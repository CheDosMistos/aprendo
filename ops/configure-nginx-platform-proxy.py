#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

DOMAIN = "aprendo.molacomer.com"
OLD_MANAGED_START = "# BEGIN APRENDO APP AUTH"
OLD_MANAGED_END = "# END APRENDO APP AUTH"
PRIVATE_ASSETS_START = "# BEGIN APRENDO PRIVATE COURSE ASSETS"
PRIVATE_ASSETS_END = "# END APRENDO PRIVATE COURSE ASSETS"
PRIVATE_ASSET_PREFIXES = (
    "/bateria/notation/",
    "/bateria/materiales/",
)
PROXY_BODY = """proxy_pass http://127.0.0.1:4321;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Port $server_port;"""


def matching_brace(text: str, open_brace: int) -> int:
    depth = 0
    for index in range(open_brace, len(text)):
        if text[index] == "{":
            depth += 1
        elif text[index] == "}":
            depth -= 1
            if depth == 0:
                return index
    raise RuntimeError("Unbalanced Nginx braces")


def find_https_server_block(text: str) -> tuple[int, int]:
    matches: list[tuple[int, int, str]] = []
    for match in re.finditer(r"(?m)^[ \t]*server[ \t]*\{", text):
        open_brace = text.find("{", match.start(), match.end())
        close_brace = matching_brace(text, open_brace)
        block = text[match.start(): close_brace + 1]
        if re.search(rf"(?m)^[ \t]*server_name[ \t]+[^;]*\b{re.escape(DOMAIN)}\b[^;]*;", block):
            matches.append((match.start(), close_brace + 1, block))

    for start, end, block in matches:
        if re.search(r"(?m)^[ \t]*listen[ \t]+[^;]*\b443\b[^;]*;", block):
            return start, end
        if re.search(r"(?m)^[ \t]*ssl[ \t]+on[ \t]*;", block):
            return start, end

    raise RuntimeError(f"No HTTPS server block found for {DOMAIN}")


def remove_managed_block(block: str, start_marker: str, end_marker: str) -> str:
    pattern = (
        rf"(?s)\n?[ \t]*{re.escape(start_marker)}.*?"
        rf"[ \t]*{re.escape(end_marker)}[ \t]*\n?"
    )
    return re.sub(pattern, "\n", block)


def proxy_location(indent: str, route: str) -> str:
    body_indent = indent + "    "
    return (
        f"{indent}location {route} {{\n"
        + "\n".join(f"{body_indent}{line}" for line in PROXY_BODY.splitlines())
        + f"\n{indent}}}"
    )


def replace_location(block: str, route: str) -> tuple[str, bool]:
    match = re.search(
        rf"(?m)^(?P<indent>[ \t]*)location[ \t]+{re.escape(route)}[ \t]*\{{",
        block,
    )
    if not match:
        return block, False

    open_brace = block.find("{", match.start(), match.end())
    close_brace = matching_brace(block, open_brace)
    replacement = proxy_location(match.group("indent"), route)
    return block[: match.start()] + replacement + block[close_brace + 1:], True


def private_assets_block(indent: str = "    ") -> str:
    body_indent = indent + "    "
    lines = [
        f"{indent}{PRIVATE_ASSETS_START}",
        f"{indent}location = /__aprendo_private_asset_session_check {{",
        f"{body_indent}internal;",
        f"{body_indent}proxy_pass http://127.0.0.1:4321/api/auth/check/;",
        f"{body_indent}proxy_pass_request_body off;",
        f"{body_indent}proxy_set_header Content-Length \"\";",
        f"{body_indent}proxy_set_header Host $host;",
        f"{body_indent}proxy_set_header X-Forwarded-Host $host;",
        f"{body_indent}proxy_set_header X-Forwarded-Proto $scheme;",
        f"{body_indent}proxy_set_header X-Forwarded-Port $server_port;",
        f"{indent}}}",
        f"{indent}location @aprendo_private_asset_login_redirect {{",
        f"{body_indent}return 303 /login/;",
        f"{indent}}}",
    ]

    for prefix in PRIVATE_ASSET_PREFIXES:
        lines.extend([
            f"{indent}location ^~ {prefix} {{",
            f"{body_indent}auth_request /__aprendo_private_asset_session_check;",
            f"{body_indent}error_page 401 = @aprendo_private_asset_login_redirect;",
            *[f"{body_indent}{line}" for line in PROXY_BODY.splitlines()],
            f"{indent}}}",
        ])

    lines.append(f"{indent}{PRIVATE_ASSETS_END}")
    return "\n".join(lines)


def configure_server_block(block: str) -> str:
    block = remove_managed_block(block, OLD_MANAGED_START, OLD_MANAGED_END)
    block = remove_managed_block(block, PRIVATE_ASSETS_START, PRIVATE_ASSETS_END)

    # Remove legacy Basic Auth directives, including a previous explicit `off`.
    block = re.sub(
        r"(?m)^[ \t]*auth_basic(?:_user_file)?[ \t]+[^;]*;[ \t]*\n?",
        "",
        block,
    )

    # Explicitly disable any Basic Auth inherited from a broader http{} block.
    server_open = block.find("{")
    if server_open < 0:
        raise RuntimeError("Invalid server block")
    block = block[: server_open + 1] + "\n    auth_basic off;" + block[server_open + 1:]

    # Keep a dedicated /api/ location when it already exists, but make sure it
    # forwards the public HTTPS origin exactly like the root proxy. This is
    # required by Astro's CSRF origin check for form POSTs.
    block, _ = replace_location(block, "/api/")

    block, root_found = replace_location(block, "/")
    if not root_found:
        closing = block.rfind("}")
        block = block[:closing] + "\n" + proxy_location("    ", "/") + "\n" + block[closing:]

    closing = block.rfind("}")
    if closing < 0:
        raise RuntimeError("Invalid server block")
    before_closing = block[:closing].rstrip()
    block = before_closing + "\n\n" + private_assets_block() + "\n" + block[closing:]
    return block


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: configure-nginx-platform-proxy.py /path/to/nginx/site.conf")

    path = Path(sys.argv[1])
    text = path.read_text()
    start, end = find_https_server_block(text)
    updated = text[:start] + configure_server_block(text[start:end]) + text[end:]
    if updated == text:
        return

    backup = path.with_name(path.name + ".pre-aprendo-platform-proxy")
    if not backup.exists():
        shutil.copy2(path, backup)
    path.write_text(updated)


if __name__ == "__main__":
    main()

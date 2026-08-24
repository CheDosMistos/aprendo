#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

DOMAIN = "aprendo.molacomer.com"
OLD_MANAGED_START = "# BEGIN APRENDO APP AUTH"
OLD_MANAGED_END = "# END APRENDO APP AUTH"
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


def remove_old_managed_auth(block: str) -> str:
    pattern = (
        rf"(?s)\n?[ \t]*{re.escape(OLD_MANAGED_START)}.*?"
        rf"[ \t]*{re.escape(OLD_MANAGED_END)}[ \t]*\n?"
    )
    return re.sub(pattern, "\n", block)


def configure_server_block(block: str) -> str:
    block = remove_old_managed_auth(block)

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

    root_location = re.search(r"(?m)^(?P<indent>[ \t]*)location[ \t]+/[ \t]*\{", block)
    if root_location:
        open_brace = block.find("{", root_location.start(), root_location.end())
        close_brace = matching_brace(block, open_brace)
        indent = root_location.group("indent")
        body_indent = indent + "    "
        replacement = (
            f"{indent}location / {{\n"
            + "\n".join(f"{body_indent}{line}" for line in PROXY_BODY.splitlines())
            + f"\n{indent}}}"
        )
        block = block[: root_location.start()] + replacement + block[close_brace + 1:]
    else:
        closing = block.rfind("}")
        indent = "    "
        body_indent = indent + "    "
        replacement = (
            f"\n{indent}location / {{\n"
            + "\n".join(f"{body_indent}{line}" for line in PROXY_BODY.splitlines())
            + f"\n{indent}}}\n"
        )
        block = block[:closing] + replacement + block[closing:]

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

#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

DOMAIN = "aprendo.molacomer.com"
PROXY_BODY = """proxy_pass http://127.0.0.1:4321;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;"""


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


def find_server_block(text: str) -> tuple[int, int]:
    candidates: list[tuple[int, int, str]] = []
    for match in re.finditer(r"(?m)^\s*server\s*\{", text):
        open_brace = text.find("{", match.start(), match.end())
        close_brace = matching_brace(text, open_brace)
        block = text[match.start(): close_brace + 1]
        if re.search(rf"(?m)^\s*server_name\s+[^;]*\b{re.escape(DOMAIN)}\b[^;]*;", block):
            candidates.append((match.start(), close_brace + 1, block))

    if not candidates:
        raise RuntimeError(f"No server block found for {DOMAIN}")

    for start, end, block in candidates:
        if re.search(r"(?m)^\s*listen\s+[^;]*\b443\b[^;]*;", block):
            return start, end

    for start, end, block in candidates:
        if re.search(r"(?m)^\s*ssl\s+on\s*;", block):
            return start, end

    return candidates[0][0], candidates[0][1]


def configure_server_block(block: str) -> str:
    block = re.sub(
        r"(?m)^\s*auth_basic(?:_user_file)?\s+[^;]*;\s*\n?",
        "",
        block,
    )

    location = re.search(r"(?m)^(?P<indent>\s*)location\s+/\s*\{", block)
    if location:
        open_brace = block.find("{", location.start(), location.end())
        close_brace = matching_brace(block, open_brace)
        indent = location.group("indent")
        body_indent = indent + "    "
        replacement = (
            f"{indent}location / {{\n"
            + "\n".join(f"{body_indent}{line}" for line in PROXY_BODY.splitlines())
            + f"\n{indent}}}"
        )
        return block[:location.start()] + replacement + block[close_brace + 1:]

    closing = block.rfind("}")
    indent = "    "
    body_indent = indent + "    "
    location_block = (
        f"\n{indent}location / {{\n"
        + "\n".join(f"{body_indent}{line}" for line in PROXY_BODY.splitlines())
        + f"\n{indent}}}\n"
    )
    return block[:closing] + location_block + block[closing:]


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: configure-nginx-app-auth.py /path/to/nginx/site.conf")

    path = Path(sys.argv[1])
    text = path.read_text()
    start, end = find_server_block(text)
    updated = text[:start] + configure_server_block(text[start:end]) + text[end:]
    if updated == text:
        return

    backup = path.with_name(path.name + ".pre-aprendo-app-auth")
    if not backup.exists():
        shutil.copy2(path, backup)
    path.write_text(updated)


if __name__ == "__main__":
    main()

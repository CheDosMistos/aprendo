#!/usr/bin/env python3
from __future__ import annotations

import sqlite3
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit('usage: backup-sqlite.py SOURCE TARGET')

    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    if not source.is_file():
        raise SystemExit(f'database not found: {source}')

    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        raise SystemExit(f'backup already exists: {target}')

    src = sqlite3.connect(source)
    dst = sqlite3.connect(target)
    try:
        src.backup(dst)
    finally:
        dst.close()
        src.close()

    if not target.is_file() or target.stat().st_size == 0:
        raise SystemExit('backup was not created correctly')


if __name__ == '__main__':
    main()

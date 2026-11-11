#!/usr/bin/env python3
"""Küçük marka WebP (96×96). Pillow yoksa PNG küçültülür; WebP için Pillow gerekir."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "client" / "public" / "pwa" / "icons" / "site-192.png"
OUT = ROOT / "client" / "public" / "pwa" / "logo.webp"


def main() -> None:
    try:
        from PIL import Image
    except ImportError as exc:
        raise SystemExit("Pillow gerekli: pip install pillow") from exc
    img = Image.open(SRC).convert("RGBA")
    img.thumbnail((64, 64), Image.Resampling.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "WEBP", quality=70, method=6)
    print(f"{OUT} {OUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()

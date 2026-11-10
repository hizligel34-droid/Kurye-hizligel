#!/usr/bin/env python3
"""Black + gold PWA icons without third-party libraries."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

GOLD = (212, 175, 55, 255)
INK = (10, 10, 10, 255)
OUT = Path(__file__).resolve().parents[1] / "client" / "public" / "pwa" / "icons"

# Distinct marks so the three Mac apps are visually different.
MARKS = {
    "musteri": "package",  # square
    "kurye": "bike",  # chevron
    "yonetici": "admin",  # plus
    "site": "brand",  # ring
}


def png_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def write_png(path: Path, size: int, pixels: list[tuple[int, int, int, int]]) -> None:
    raw = b"".join(b"\x00" + bytes(c for px in pixels[y * size : (y + 1) * size] for c in px) for y in range(size))
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    payload = b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", ihdr) + png_chunk(b"IDAT", zlib.compress(raw, 9)) + png_chunk(b"IEND", b"")
    path.write_bytes(payload)


def in_rect(x: int, y: int, x0: int, y0: int, x1: int, y1: int) -> bool:
    return x0 <= x < x1 and y0 <= y < y1


def in_circle(x: int, y: int, cx: int, cy: int, r: int) -> bool:
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def paint(size: int, kind: str) -> list[tuple[int, int, int, int]]:
    pixels: list[tuple[int, int, int, int]] = []
    m = size / 512
    for y in range(size):
        for x in range(size):
            color = INK
            # rounded gold plate
            inset = int(36 * m)
            radius = int(72 * m)
            gx, gy = x - inset, y - inset
            inner = size - 2 * inset
            in_plate = in_rect(x, y, inset, inset, size - inset, size - inset)
            corner = (
                (x < inset + radius and y < inset + radius and not in_circle(x, y, inset + radius, inset + radius, radius))
                or (x > size - inset - radius and y < inset + radius and not in_circle(x, y, size - inset - radius, inset + radius, radius))
                or (x < inset + radius and y > size - inset - radius and not in_circle(x, y, inset + radius, size - inset - radius, radius))
                or (x > size - inset - radius and y > size - inset - radius and not in_circle(x, y, size - inset - radius, size - inset - radius, radius))
            )
            if in_plate and not corner:
                border = (
                    gx < int(28 * m)
                    or gy < int(28 * m)
                    or gx > inner - int(28 * m)
                    or gy > inner - int(28 * m)
                )
                color = GOLD if border else INK
            cx = cy = size // 2
            if kind == "package":
                if in_rect(x, y, int(170 * m), int(170 * m), int(342 * m), int(342 * m)):
                    color = GOLD
                if in_rect(x, y, int(196 * m), int(196 * m), int(316 * m), int(316 * m)):
                    color = INK
                if in_rect(x, y, int(236 * m), int(150 * m), int(276 * m), int(362 * m)):
                    color = GOLD
            elif kind == "bike":
                if in_circle(x, y, int(190 * m), int(320 * m), int(70 * m)) ^ in_circle(x, y, int(190 * m), int(320 * m), int(42 * m)):
                    color = GOLD
                if in_circle(x, y, int(330 * m), int(320 * m), int(70 * m)) ^ in_circle(x, y, int(330 * m), int(320 * m), int(42 * m)):
                    color = GOLD
                if in_rect(x, y, int(200 * m), int(180 * m), int(340 * m), int(214 * m)):
                    color = GOLD
                if in_rect(x, y, int(248 * m), int(180 * m), int(278 * m), int(320 * m)):
                    color = GOLD
            elif kind == "admin":
                if in_rect(x, y, int(226 * m), int(140 * m), int(286 * m), int(372 * m)):
                    color = GOLD
                if in_rect(x, y, int(140 * m), int(226 * m), int(372 * m), int(286 * m)):
                    color = GOLD
            else:
                if in_circle(x, y, cx, cy, int(140 * m)) and not in_circle(x, y, cx, cy, int(96 * m)):
                    color = GOLD
                if in_rect(x, y, cx - int(18 * m), cy - int(70 * m), cx + int(18 * m), cy + int(70 * m)):
                    color = GOLD
            pixels.append(color)
    return pixels


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, kind in MARKS.items():
        for size in (192, 512):
            path = OUT / f"{name}-{size}.png"
            write_png(path, size, paint(size, kind))
            print(path)


if __name__ == "__main__":
    main()

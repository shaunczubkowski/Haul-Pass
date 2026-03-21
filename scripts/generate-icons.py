#!/usr/bin/env python3
"""
Generate branded FillRight PWA icons from scratch using only Python built-ins.

Renders a fuel-pump silhouette on an orange background at multiple sizes:
  icon-192.png       (192×192) — Android PWA
  icon-512.png       (512×512) — Android PWA / splash
  apple-touch-icon.png (180×180) — iOS Add to Home Screen

Run from the repo root:
  python3 scripts/generate-icons.py
"""

import struct
import zlib
import math
import os

# ── Brand colours ────────────────────────────────────────────────────────────
ORANGE = (249, 115, 22)   # #f97316
WHITE  = (255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)

# ── PNG helpers ───────────────────────────────────────────────────────────────

def _make_chunk(tag: bytes, data: bytes) -> bytes:
    crc = zlib.crc32(tag + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)


def encode_png(pixels: list[list[tuple]], width: int, height: int) -> bytes:
    """Encode a 2-D list of (R,G,B) rows into a PNG bytestring."""
    raw = bytearray()
    for row in pixels:
        raw.append(0)  # filter type: None
        for r, g, b in row:
            raw += bytes([r, g, b])

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + _make_chunk(b"IHDR", ihdr)
        + _make_chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + _make_chunk(b"IEND", b"")
    )


# ── Geometry helpers ──────────────────────────────────────────────────────────

def lerp(a, b, t):
    return a + (b - a) * t


def blend(src: tuple, dst: tuple, alpha: float) -> tuple:
    """Alpha-composite src over dst."""
    return (
        round(lerp(dst[0], src[0], alpha)),
        round(lerp(dst[1], src[1], alpha)),
        round(lerp(dst[2], src[2], alpha)),
    )


def paint_rect(buf, bw, bh, x, y, w, h, rx, color):
    """
    Paint an axis-aligned rounded rectangle onto buf (list of lists).
    Uses supersampled anti-aliasing (4×4 sub-pixels per pixel).
    x, y, w, h, rx are in *buffer* coordinates.
    """
    SS = 4  # supersampling factor
    x2, y2 = x + w, y + h

    for py in range(max(0, int(y) - 1), min(bh, int(y2) + 2)):
        for px in range(max(0, int(x) - 1), min(bw, int(x2) + 2)):
            hits = 0
            for sy in range(SS):
                for sx in range(SS):
                    # Sample point in continuous coords
                    fx = px + (sx + 0.5) / SS
                    fy = py + (sy + 0.5) / SS

                    # Is sample inside the rounded rect?
                    if fx < x or fx > x2 or fy < y or fy > y2:
                        continue

                    # Corner proximity check
                    cx_left  = x  + rx
                    cx_right = x2 - rx
                    cy_top   = y  + rx
                    cy_bot   = y2 - rx

                    in_corner = False
                    for (qx, qy) in [(cx_left, cy_top), (cx_right, cy_top),
                                     (cx_left, cy_bot),  (cx_right, cy_bot)]:
                        if fx < (qx - rx) or fx > (qx + rx):
                            continue
                        if fy < (qy - rx) or fy > (qy + rx):
                            continue
                        # Only check if we're in the "corner box"
                        if (fx < cx_left or fx > cx_right) and (fy < cy_top or fy > cy_bot):
                            dist = math.hypot(fx - qx, fy - qy)
                            if dist > rx:
                                in_corner = True
                            break
                    if not in_corner:
                        hits += 1

            if hits > 0:
                alpha = hits / (SS * SS)
                buf[py][px] = blend(color, buf[py][px], alpha)


# ── Icon renderer ─────────────────────────────────────────────────────────────

def render(size: int) -> list[list[tuple]]:
    """
    Render the FillRight fuel-pump icon at `size`×`size`.

    All design coordinates are in a 512×512 space and scaled uniformly.
    """
    s = size / 512  # scale factor

    # Initialise canvas to solid orange
    buf = [[ORANGE] * size for _ in range(size)]

    def rect(x, y, w, h, rx, color=WHITE):
        paint_rect(buf, size, size,
                   x * s, y * s, w * s, h * s,
                   rx * s, color)

    # Pump cabinet (body)
    rect(156, 75, 200, 260, 16)

    # Display screen on cabinet face
    rect(184, 112, 144, 88, 10, ORANGE)

    # Pump base / stand
    rect(126, 318, 260, 76, 14)

    # Hose arm leaving right side of cabinet
    rect(356, 138, 65, 22, 11)

    # Vertical hose drop
    rect(399, 138, 22, 108, 11)

    # Nozzle handle (horizontal)
    rect(308, 224, 113, 22, 11)

    # Nozzle spout (vertical, at left end of handle)
    rect(300, 214, 22, 58, 11)

    return buf


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    public = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")

    targets = [
        ("icon-192.png",        192),
        ("icon-512.png",        512),
        ("apple-touch-icon.png", 180),
    ]

    for filename, size in targets:
        buf = render(size)
        png = encode_png(buf, size, size)
        out = os.path.join(public, filename)
        with open(out, "wb") as f:
            f.write(png)
        print(f"  wrote {out}  ({len(png):,} bytes)")


if __name__ == "__main__":
    main()

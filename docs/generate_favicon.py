#!/usr/bin/env python3
"""Generate pixel-art floppy disk favicon assets for nickyquinn.github.io.

Run from repo root:
    python3 src/favicon/generate_favicon.py

Outputs (in src/favicon/):
    favicon-16x16.png
    favicon-32x32.png      (16×16 scaled ×2)
    apple-touch-icon.png   (16×16 scaled ×10, centred on 180×180)
    favicon.ico            (16×16 + 32×32 packed)
"""
from pathlib import Path
from PIL import Image

# ── Palette ──────────────────────────────────────────────────────────────────
C = {
    'K': ( 42,  45,  48),  # dark case
    'L': (240, 237, 230),  # label (cream)
    'M': (160, 172, 184),  # metal shutter (silver)
    'O': ( 24,  30,  34),  # shutter slot / write-protect hole
}


def row(*specs):
    """Build a pixel row from (char, count) pairs."""
    return ''.join(ch * n for ch, n in specs)


# ── 16×16 floppy disk sprite ─────────────────────────────────────────────────
# 3.5" floppy disk, face-on.
# Label (cream, ruled lines) fills top two-thirds.
# Metal sliding shutter (silver, dark slot) fills bottom third.
#
SPRITE_16 = [
    row(('K', 16)),                                          #  0 top border
    row(('K', 1), ('L', 12), ('O', 2), ('K', 1)),           #  1 label + write-protect hole (top-right)
    row(('K', 1), ('L', 12), ('O', 2), ('K', 1)),           #  2 label + write-protect hole
    row(('K', 1), ('L', 14), ('K', 1)),                      #  3 label
    row(('K', 1), ('L', 14), ('K', 1)),                      #  4 label
    row(('K', 1), ('L', 14), ('K', 1)),                      #  5 label
    row(('K', 1), ('L', 14), ('K', 1)),                      #  6 label
    row(('K', 1), ('L', 14), ('K', 1)),                      #  7 label
    row(('K', 1), ('L', 14), ('K', 1)),                      #  8 label
    row(('K', 16)),                                          #  9 label/shutter separator
    row(('K', 1), ('M', 14), ('K', 1)),                      # 10 shutter
    row(('K', 1), ('M', 5), ('O', 4), ('M', 5), ('K', 1)),  # 11 shutter slot (centred, narrow)
    row(('K', 1), ('M', 5), ('O', 4), ('M', 5), ('K', 1)),  # 12 shutter slot
    row(('K', 1), ('M', 5), ('O', 4), ('M', 5), ('K', 1)),  # 13 shutter slot
    row(('K', 1), ('M', 14), ('K', 1)),                      # 14 shutter
    row(('K', 16)),                                          # 15 bottom border
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def grid_to_image(grid: list[str], palette: dict) -> Image.Image:
    h = len(grid)
    w = len(grid[0])
    assert all(len(r) == w for r in grid), \
        f"Row length mismatch: expected {w}, got {[len(r) for r in grid if len(r) != w]}"
    img = Image.new('RGB', (w, h))
    px = img.load()
    for y, r in enumerate(grid):
        for x, ch in enumerate(r):
            px[x, y] = palette[ch]
    return img


def upscale_nearest(img: Image.Image, factor: int) -> Image.Image:
    return img.resize((img.width * factor, img.height * factor), Image.NEAREST)


def centre_on_canvas(img: Image.Image, w: int, h: int, bg: tuple) -> Image.Image:
    canvas = Image.new('RGB', (w, h), bg)
    x = (w - img.width) // 2
    y = (h - img.height) // 2
    canvas.paste(img, (x, y))
    return canvas


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    out = Path(__file__).parent

    img16 = grid_to_image(SPRITE_16, C)
    img32 = upscale_nearest(img16, 2)

    img16.save(out / 'favicon-16x16.png')
    img32.save(out / 'favicon-32x32.png')

    # apple-touch-icon: ×10 = 160×160, centred on 180×180 with dark border
    scaled = upscale_nearest(img16, 10)
    touch = centre_on_canvas(scaled, 180, 180, C['K'])
    touch.save(out / 'apple-touch-icon.png')

    img16.save(
        out / 'favicon.ico',
        format='ICO',
        append_images=[img32],
        sizes=[(16, 16), (32, 32)],
    )

    print("Generated:")
    for f in ['favicon-16x16.png', 'favicon-32x32.png',
              'apple-touch-icon.png', 'favicon.ico']:
        size = (out / f).stat().st_size
        print(f"  {f}  ({size} bytes)")


if __name__ == '__main__':
    main()

"""
Cut the ten category photographs out of the client's category sheet.

    python assets/categories/extract_categories.py

Input   assets/categories/categories-supplied.png   the client's sheet (2172 x 724)
Output  apps/web/public/images/categories/{slug}.webp  one 4:3 tile image each

Each card's edges were measured from the sheet's border lines (not guessed),
the printed label below each photograph is found by its dark text and left
out, and the product is trimmed to its own outline — including its soft
shadow — then re-centred on white at the same fill for every tile, so all
ten read at one scale in the row. The site renders each category's name
from its own data, not from the sheet's printed label.
"""
import json
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "categories-supplied.png")
OUT = os.path.join(ROOT, "apps", "web", "public", "images", "categories")
os.makedirs(OUT, exist_ok=True)

# Card boxes (x0, y0, x1, y1), from the sheet's border lines, in sheet order.
CARDS = [
    ("dehydrated-powders-flakes", (40, 12, 361, 354)),
    ("dehydrated-fruits", (381, 12, 712, 354)),
    ("pickles", (734, 12, 1069, 354)),
    ("spiced-dal-powders", (1090, 12, 1412, 354)),
    ("sun-dried-crisps", (1432, 12, 1784, 354)),
    ("dry-fruits", (1807, 12, 2130, 354)),
    ("millets", (50, 370, 378, 702)),
    ("herbal-tea-coffee", (396, 370, 730, 702)),
    ("masala-powders", (749, 370, 1090, 702)),
    ("combo-packs", (1104, 370, 1507, 702)),
]

TILE_W, TILE_H = 480, 360   # 4:3, at 2-3x the size the tiles render
FILL = 0.9                  # product box fills this share of the tile's limiting side
INSET = 5                   # stay inside the card's border line

sheet = np.asarray(Image.open(SRC).convert("RGB"))
report = []

for slug, (x0, y0, x1, y1) in CARDS:
    card = sheet[y0 + INSET:y1 - INSET, x0 + INSET:x1 - INSET].astype(np.int32)
    h, w, _ = card.shape
    grey = card.mean(axis=2)
    sat = card.max(axis=2) - card.min(axis=2)

    # The label. Its text is near-black and unsaturated; the produce above it
    # is coloured. It is at most two lines, about 75px tall in this sheet, so:
    # find where the text ends, then the highest text-like row within one
    # label's height above that. (A first attempt took any dark row in the
    # lower half — dark produce read as text and cut products off; a second
    # scanned upward and stopped at the faint anti-aliasing between two label
    # lines, keeping the first line in the photograph.)
    # A label row is black text on white: dark unsaturated pixels and no
    # colour anywhere in the row. A row through a bowl's dark base or a dark
    # nut always also carries coloured pixels, which is what tells them apart.
    ink_px = (255 - card).max(axis=2) > 14
    coloured = (ink_px & (sat > 50)).sum(axis=1)
    textlike = (((grey < 110) & (sat < 45)).sum(axis=1) >= 3) & (coloured == 0)
    text_bottom = int(np.nonzero(textlike)[0].max())
    zone = range(max(0, text_bottom - 75), text_bottom + 1)
    label_top = min(y for y in zone if textlike[y])
    photo = card[: max(label_top - 8, 1)]

    # The product: anything distinctly off-white, including its shadow.
    ink = (255 - photo).max(axis=2) > 14
    ys, xs = np.nonzero(ink)
    py0, py1, px0, px1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    product = Image.fromarray(photo[py0:py1, px0:px1].astype(np.uint8))

    # Re-centre on white at a consistent fill.
    scale = min(TILE_W * FILL / product.width, TILE_H * FILL / product.height)
    scaled = product.resize(
        (max(1, round(product.width * scale)), max(1, round(product.height * scale))),
        Image.LANCZOS,
    )
    tile = Image.new("RGB", (TILE_W, TILE_H), (255, 255, 255))
    # Sit slightly low, the way a photographed object rests on a surface.
    ox = (TILE_W - scaled.width) // 2
    oy = round((TILE_H - scaled.height) * 0.6)
    tile.paste(scaled, (ox, oy))
    path = os.path.join(OUT, f"{slug}.webp")
    tile.save(path, "WEBP", quality=88, method=6)

    report.append({
        "slug": slug,
        "label_row_in_card": int(label_top),
        "product_px": [int(px1 - px0), int(py1 - py0)],
        "upscale": round(scale, 2),
        "bytes": os.path.getsize(path),
    })

print(json.dumps(report, indent=1))

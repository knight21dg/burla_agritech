"""
Cut the six featured-product photographs out of the client's sheet.

    python assets/products/extract_featured.py

Input   assets/products/featured-supplied.png      the client's sheet (2172 x 724)
Output  apps/web/public/images/products/{slug}.webp  one square image each

Same method as assets/categories/extract_categories.py: card edges measured
from the sheet's own border lines; the text under each photograph (name,
pack sizes, price, cart icon) left behind; the product trimmed to its
outline, shadow included, and re-centred on white at one fill.

The text block is found scanning DOWN from mid-card for the first row that
is black text on white — dark unsaturated pixels and no colour anywhere in
the row. Produce rows always carry colour, so they never qualify; and the
green cart icon sits on the price line, below the name, so it never matters.
"""
import json
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "featured-supplied.png")
OUT = os.path.join(ROOT, "apps", "web", "public", "images", "products")
os.makedirs(OUT, exist_ok=True)

TOP, BOTTOM = 94, 686
# Named for the catalogue's product slugs. The sheet's Dehydrated Banana
# (x 728-1078) and Ragi Flour (x 1444-1793) are not in the catalogue of
# 2026-09-10 and are not extracted.
CARDS = [
    ("dehydrated-fruits-mango", (14, 363)),   # sheet: Dehydrated Mango
    ("mango-pickle", (376, 715)),
    ("red-chilli-powder", (1090, 1431)),
    ("gongura-pickle", (1805, 2157)),
]

TILE = 600      # square, matching the product card's image area, ~2x its size
FILL = 0.9
INSET = 5       # just inside the border line
EDGE_BAND = 16  # the rounded corners' border arcs reach this far in

sheet = np.asarray(Image.open(SRC).convert("RGB"))
report = []

for slug, (x0, x1) in CARDS:
    card = sheet[TOP + INSET:BOTTOM - INSET, x0 + INSET:x1 - INSET].astype(np.int32)
    h, w, _ = card.shape

    # The cards have rounded corners, and their border arcs would count as
    # "product" and stretch every box to the card's full width. Insetting
    # past them instead shaved the edges off leaves that reach the card's
    # side. So: whiten only border-like pixels — pale and colourless — in a
    # band along the edge. Produce there is coloured, and survives.
    yy, xx = np.mgrid[0:h, 0:w]
    near_edge = np.minimum(np.minimum(yy, h - 1 - yy), np.minimum(xx, w - 1 - xx)) < EDGE_BAND
    border_like = (card.max(axis=2) - card.min(axis=2) < 15) & (card.mean(axis=2) > 175)
    card[near_edge & border_like] = 255
    grey = card.mean(axis=2)
    sat = card.max(axis=2) - card.min(axis=2)
    ink = (255 - card).max(axis=2) > 14
    coloured = (ink & (sat > 50)).sum(axis=1)
    textlike = (((grey < 110) & (sat < 45)).sum(axis=1) >= 3) & (coloured == 0)

    text_top = next(y for y in range(h // 2, h) if textlike[y])
    photo = card[: text_top - 8]

    ys, xs = np.nonzero((255 - photo).max(axis=2) > 14)
    py0, py1, px0, px1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    product = Image.fromarray(photo[py0:py1, px0:px1].astype(np.uint8))

    scale = min(TILE * FILL / product.width, TILE * FILL / product.height)
    scaled = product.resize(
        (round(product.width * scale), round(product.height * scale)), Image.LANCZOS
    )
    tile = Image.new("RGB", (TILE, TILE), (255, 255, 255))
    tile.paste(scaled, ((TILE - scaled.width) // 2, round((TILE - scaled.height) * 0.6)))
    path = os.path.join(OUT, f"{slug}.webp")
    tile.save(path, "WEBP", quality=88, method=6)

    report.append({
        "slug": slug,
        "text_top_in_card": int(text_top),
        "product_px": [int(px1 - px0), int(py1 - py0)],
        "upscale": round(scale, 2),
        "bytes": os.path.getsize(path),
    })

print(json.dumps(report, indent=1))

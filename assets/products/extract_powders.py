"""
Cut the thirteen Powders photographs out of the client's sheet.

    python assets/products/extract_powders.py

Input   assets/products/powders-supplied.png       the client's sheet (2092 x 752)
Output  apps/web/public/images/products/{slug}.webp  one square image each

Same method as extract_featured.py: card edges measured from the sheet's own
border lines; the printed name under each photograph left behind; the product
trimmed to its outline, shadow included, and re-centred on white at one fill.

The sheet has two rows of different card widths — seven cards above, six
below — so each card carries its own box. The cards are in the catalogue's
order, and each is named for the product whose name is printed on it.
"""
import json
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "powders-supplied.png")
OUT = os.path.join(ROOT, "apps", "web", "public", "images", "products")
os.makedirs(OUT, exist_ok=True)

ROW_1 = (13, 367)
ROW_2 = (381, 720)
CARDS = [
    ("moringa-powder", (12, 289), ROW_1),
    ("banana-powder", (305, 583), ROW_1),
    ("lemon-powder", (600, 879), ROW_1),
    ("tomato-powder", (896, 1175), ROW_1),
    ("ginger-powder", (1191, 1472), ROW_1),
    ("garlic-powder", (1490, 1770), ROW_1),
    ("onion-powder", (1787, 2066), ROW_1),
    ("carrot-powder", (11, 316), ROW_2),
    ("beetroot-powder", (333, 647), ROW_2),
    ("curry-leaves", (664, 986), ROW_2),
    ("amla-powder", (1003, 1328), ROW_2),
    ("abc-powder", (1345, 1684), ROW_2),      # sheet: "ABC Powder (Confirmation Required)"
    ("spinach-powder", (1702, 2028), ROW_2),
]

TILE = 600      # square, matching the product card's image area, ~2x its size
FILL = 0.9
INSET = 5       # just inside the border line
EDGE_BAND = 16  # the rounded corners' border arcs reach this far in
LABEL_GAP = 14  # blank rows between photo and label; label lines sit closer

sheet = np.asarray(Image.open(SRC).convert("RGB"))
report = []

for slug, (x0, x1), (top, bottom) in CARDS:
    card = sheet[top + INSET:bottom - INSET, x0 + INSET:x1 - INSET].astype(np.int32)
    h, w, _ = card.shape

    # Whiten only border-like pixels — pale and colourless — in a band along
    # the edge, so the rounded corners do not count as product. Produce that
    # reaches the card's side is coloured, and survives.
    yy, xx = np.mgrid[0:h, 0:w]
    near_edge = np.minimum(np.minimum(yy, h - 1 - yy), np.minimum(xx, w - 1 - xx)) < EDGE_BAND
    border_like = (card.max(axis=2) - card.min(axis=2) < 15) & (card.mean(axis=2) > 175)
    card[near_edge & border_like] = 255
    grey = card.mean(axis=2)
    sat = card.max(axis=2) - card.min(axis=2)
    ink = (255 - card).max(axis=2) > 14
    coloured = (ink & (sat > 50)).sum(axis=1)
    textlike = (((grey < 110) & (sat < 45)).sum(axis=1) >= 3) & (coloured == 0)

    # The label is found from the BOTTOM up, not from mid-card down: white
    # garlic and a dark beetroot are colourless enough to pass for text, and
    # scanning down stopped on them. Upwards, the label is the first text,
    # its lines (two, on ABC) are close together, and a wide blank gap
    # separates it from the photograph. Colour anywhere ends it at once.
    inked = ink.sum(axis=1)
    y = max(yy for yy in range(h) if textlike[yy])
    text_top, gap = y, 0
    while y > 0:
        y -= 1
        if coloured[y] > 0:
            break
        if inked[y] <= 2:
            gap += 1
            if gap >= LABEL_GAP:
                break
        else:
            gap, text_top = 0, y
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
        "product_box": [int(px0), int(py0), int(px1), int(py1)],
        "card": [int(w), int(h)],
        "upscale": round(scale, 2),
        "bytes": os.path.getsize(path),
    })

print(json.dumps(report, indent=1))

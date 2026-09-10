"""
Cut the product photographs out of the client's per-category sheets.

    python assets/products/extract_product_sheets.py

Input   assets/products/powders-supplied.png       13 cards (2092 x 752)
        assets/products/flakes-supplied.png        7 cards (2092 x 752)
        assets/products/fruits-supplied.png        6 cards (1774 x 887)
        assets/products/pickles-supplied.png       7 cards (1536 x 1024)
Output  apps/web/public/images/products/{slug}.webp  one square image each

Same method as extract_featured.py: card edges measured from the sheet's own
border lines; the printed name under each photograph left behind; the product
trimmed to its outline, shadow included, and re-centred on white at one fill.

Each sheet has two rows of different card widths, so each card carries its
own box. The cards are in the catalogue's order, and each is named for the
product whose name is printed on it.
"""
import json
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "apps", "web", "public", "images", "products")
os.makedirs(OUT, exist_ok=True)

# Powders sheet
ROW_1 = (13, 367)
ROW_2 = (381, 720)
POWDERS = [
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

# Flakes sheet: four wide cards above, three below.
F_ROW_1 = (12, 367)
F_ROW_2 = (379, 739)
FLAKES = [
    ("mango-flakes", (12, 514), F_ROW_1),
    ("tomato-flakes", (534, 1037), F_ROW_1),
    ("ginger-flakes", (1057, 1558), F_ROW_1),
    ("garlic-flakes", (1579, 2081), F_ROW_1),
    ("onion-flakes", (13, 518), F_ROW_2),
    ("carrot-flakes", (537, 1101), F_ROW_2),
    ("beetroot-flakes", (1121, 1638), F_ROW_2),
]

# Dehydrated Fruits sheet: three cards in each row. Its Mango card replaces
# the Featured sheet's (see extract_featured.py), so the six fruits match.
D_ROW_1 = (12, 436)
D_ROW_2 = (452, 874)
FRUITS = [
    ("dehydrated-fruits-apple", (11, 584), D_ROW_1),
    ("dehydrated-fruits-papaya", (601, 1173), D_ROW_1),
    ("dehydrated-fruits-mango", (1190, 1762), D_ROW_1),
    ("dehydrated-fruits-pineapple", (11, 584), D_ROW_2),
    ("dehydrated-fruits-sapota", (601, 1173), D_ROW_2),
    ("dehydrated-fruits-honey", (1190, 1762), D_ROW_2),  # sheet: "Honey (Confirmation Required)"
]

# Pickles sheet: a "Veg Pickles" band over four cards, a "Non-Veg Pickles"
# band over three. The rows start below each band. Its Mango and Gongura
# cards replace the Featured sheet's, so the seven pickles match.
P_ROW_1 = (66, 466)     # Veg Pickles
P_ROW_2 = (553, 989)    # Non-Veg Pickles
PICKLES = [
    ("tomato-pickle", (17, 384), P_ROW_1),
    ("gongura-pickle", (394, 762), P_ROW_1),
    ("garlic-pickle", (773, 1141), P_ROW_1),
    ("mango-pickle", (1151, 1518), P_ROW_1),
    ("chicken-pickle", (17, 511), P_ROW_2),
    ("prawns-pickle", (521, 1014), P_ROW_2),
    ("mutton-pickle", (1024, 1518), P_ROW_2),
]

SHEETS = [
    ("powders-supplied.png", POWDERS),
    ("flakes-supplied.png", FLAKES),
    ("fruits-supplied.png", FRUITS),
    ("pickles-supplied.png", PICKLES),
]

TILE = 600      # square, matching the product card's image area, ~2x its size
FILL = 0.9
INSET = 5       # just inside the border line
EDGE_BAND = 16  # the rounded corners' border arcs reach this far in
LABEL_GAP = 14  # blank rows between photo and label; label lines sit closer

report = []
CARDS = [
    (np.asarray(Image.open(os.path.join(HERE, name)).convert("RGB")), card)
    for name, cards in SHEETS
    for card in cards
]

for sheet, (slug, (x0, x1), (top, bottom)) in CARDS:
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

    # The label is found from the BOTTOM up, in blocks: runs of inked rows
    # separated by blank ones. The lowest text block is the label's last
    # line; the blocks above it join the label while they are colourless and
    # close (ABC and Honey have two lines, 11 and 5 rows apart). The first
    # block with colour in it is the photograph, and so is anything past a
    # wide gap.
    #
    # Not row by row: a bowl's colourless shadow sits in the same block as
    # the bowl, and read row by row it passed for label — on the Tomato
    # Pickle card the cut then took 8 rows off the photo. Nor scanning down
    # from mid-card: white garlic and dark beetroot pass for text.
    blank = ink.sum(axis=1) <= 2
    blocks, y = [], 0
    while y < h:
        if blank[y]:
            y += 1
            continue
        start = y
        while y < h and not blank[y]:
            y += 1
        blocks.append((start, y - 1))
    last_line = max(yy for yy in range(h) if textlike[yy])
    label = [b for b in blocks if b[0] <= last_line]
    text_top = label[-1][0]
    for above, below in zip(label[-2::-1], label[:0:-1]):
        if below[0] - above[1] - 1 >= LABEL_GAP or coloured[above[0]:above[1] + 1].any():
            break
        text_top = above[0]
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

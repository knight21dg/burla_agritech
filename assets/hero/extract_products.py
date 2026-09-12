"""
Cut the product composition out of the client's hero image.

    python assets/hero/extract_products.py

Input   assets/hero/hero-clean.png            the supplied hero, floating leaves already lifted out
Output  apps/web/public/images/home/hero-products.webp

The supplied image is one painting: logo, headline, copy, the script and the
products. The page now composes those itself — live text, its own leaves —
so only the products are needed as an image.

The two painted text blocks are whitened where they sit (their boxes,
measured from the file: the headline block on the left, the script top
right), what remains is trimmed to its own bounds, and the edges are
feathered into white so the crop never shows a seam against the page.
"""
import numpy as np
from PIL import Image

SRC = "assets/hero/hero-clean.png"
OUT = "apps/web/public/images/home/hero-products.webp"

# Painted text, in source px: the headline block (logo, headline, paragraph)
# and the "Good Food Better Living" script. Both measured from the file.
TEXT_BLOCK = (80, 95, 478, 592)
SCRIPT = (1140, 130, 1495, 380)
FEATHER = 28
PAD = 10

a = np.asarray(Image.open(SRC).convert("RGB")).astype(float)
for x0, y0, x1, y1 in (TEXT_BLOCK, SCRIPT):
    a[y0:y1, x0:x1] = 255.0

ink = (255 - a).max(axis=2) > 40
rows = np.nonzero(ink.any(axis=1))[0]
cols = np.nonzero(ink.any(axis=0))[0]
y0, y1 = max(0, rows.min() - PAD), min(a.shape[0], rows.max() + 1 + PAD)
x0, x1 = max(0, cols.min() - PAD), min(a.shape[1], cols.max() + 1 + PAD)
crop = a[y0:y1, x0:x1]
h, w, _ = crop.shape

# Feather to white at every edge: the crop is a rectangle of a photograph
# with a near-white ground, and a hard edge would read as a box on the page.
yy, xx = np.mgrid[0:h, 0:w]
edge = np.minimum(np.minimum(yy, h - 1 - yy), np.minimum(xx, w - 1 - xx))
t = np.clip(edge / FEATHER, 0, 1)[:, :, None]
crop = crop * t + 255.0 * (1 - t)

Image.fromarray(crop.round().astype(np.uint8)).save(OUT, "WEBP", quality=92, method=6)
print(f"products {w} x {h} from source ({x0},{y0})-({x1},{y1}) -> {OUT}")

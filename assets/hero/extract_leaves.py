"""
Lift the floating leaves out of the supplied hero image as transparent
sprites, and produce the hero with those leaves removed.

    python assets/hero/extract_leaves.py

Inputs   assets/hero/hero-supplied.png        the client's image, untouched
Outputs  assets/hero/hero-clean.png           the image with the leaves removed
         apps/web/public/images/home/leaves/  one WebP sprite per leaf
         apps/web/public/images/home/hero-{768,1152,1536}.webp

Positions, sizes and softness are printed as JSON; copy them into
apps/web/src/components/home/heroLeaves.ts if they change.

Requires numpy, scipy, Pillow and opencv-python.

Composited back at their original positions over the clean hero, the sprites
reproduce the original; the script measures that.
"""
import json
import os

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "hero-supplied.png")
CLEAN = os.path.join(HERE, "hero-clean.png")
PUBLIC = os.path.join(ROOT, "apps", "web", "public", "images", "home")
os.makedirs(os.path.join(PUBLIC, "leaves"), exist_ok=True)

orig = np.asarray(Image.open(SRC).convert("RGB"))
H, W, _ = orig.shape
f = orig.astype(np.float32)
BG = np.array([253.9, 253.8, 253.9], np.float32)

# Search boxes (x0, y0, x1, y1) around each floating leaf, generous enough to
# include its blurred halo. `clip_y` stops a box above something that is not
# leaf — the pouch's top edge under leaf "c".
LEAVES = [
    {"name": "a", "box": (0, 115, 75, 222)},       # far left, faint
    {"name": "b", "box": (548, 18, 676, 172)},     # top centre
    {"name": "c", "box": (556, 200, 672, 320), "clip_y": 320, "all": True},  # above the pouch; its blurred tip separates from the body
    {"name": "d", "box": (647, 179, 969, 314)},    # large, out of focus
    {"name": "e", "box": (960, 129, 1047, 221)},   # small, right of centre
    {"name": "f", "box": (1228, 0, 1455, 103)},    # top right, out of focus
    {"name": "g", "box": (1400, 341, 1536, 540)},  # right edge, out of focus
    {"name": "h", "box": (492, 314, 597, 459)},    # left of the pouch
    {"name": "i", "box": (0, 545, 136, 726)},      # left edge
    {"name": "j", "box": (115, 775, 241, 870)},    # bottom left
    {"name": "k", "box": (348, 893, 482, 972), "fill": "inpaint"},  # bottom, on the marble
]

def leaf_mask(x0, y0, x1, y1, clip_y=None, take_all=False):
    """Green, and darker than the background, then the largest blob, holes filled, halo included."""
    r = f[y0:y1, x0:x1]
    green = r[..., 1] - np.maximum(r[..., 0], r[..., 2])
    darker = (BG[None, None, :] - r).max(axis=2)
    m = (green > 4) & (darker > 6)
    if clip_y is not None:
        m[max(0, clip_y - y0):, :] = False
    lab, n = ndimage.label(m)
    if n == 0:
        z = np.zeros(m.shape, bool)
        return z, z
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    if take_all:
        # A tight box around one leaf whose out-of-focus tip reads as a
        # separate blob: keep its pieces — but not a neighbour's tip poking in
        # from the right edge of the box.
        slices = ndimage.find_objects(lab)
        keep = [
            i + 1 for i, s in enumerate(sizes)
            if s >= 4 and slices[i][1].start < 90
        ]
        core = np.isin(lab, keep)
    else:
        core = lab == (int(np.argmax(sizes)) + 1)
    core = ndimage.binary_fill_holes(core)
    # The halo of an out-of-focus leaf extends past where it reads as green.
    halo = ndimage.binary_dilation(core, iterations=7)
    if clip_y is not None:
        halo[max(0, clip_y - y0):, :] = False
    return halo, core

full_mask = np.zeros((H, W), np.uint8)
masks = {}
for L in LEAVES:
    x0, y0, x1, y1 = L["box"]
    halo, core = leaf_mask(x0, y0, x1, y1, L.get("clip_y"), L.get("all", False))
    masks[L["name"]] = (halo, core)
    full_mask[y0:y1, x0:x1][halo] = 255

# The hero with the floating leaves removed.
#
# Leaves on the plain white ground are filled with the measured white of their
# own surroundings. Inpainting there would pull colour in from any edge the
# hole touches — the pouch's tan top, under leaf "c". Only leaf "k", which
# lies on the marble surface, is inpainted, so its texture continues.
clean = orig.copy()
inpaint_mask = np.zeros((H, W), np.uint8)
for L in LEAVES:
    x0, y0, x1, y1 = L["box"]
    halo, _ = masks[L["name"]]
    if L.get("fill") == "inpaint":
        inpaint_mask[y0:y1, x0:x1][halo] = 255
        continue
    ring = ndimage.binary_dilation(halo, iterations=5) & ~halo
    region = clean[y0:y1, x0:x1]
    ground = np.median(orig[y0:y1, x0:x1][ring], axis=0) if ring.any() else BG
    region[halo] = np.round(ground).astype(np.uint8)
if inpaint_mask.any():
    clean = cv2.inpaint(clean[..., ::-1].copy(), inpaint_mask, 9, cv2.INPAINT_TELEA)[..., ::-1]
cf = clean.astype(np.float32)

manifest = []
recon = cf.copy()
for L in LEAVES:
    x0, y0, x1, y1 = L["box"]
    halo, core = masks[L["name"]]
    C = f[y0:y1, x0:x1]
    B = cf[y0:y1, x0:x1]
    d = np.linalg.norm(C - B, axis=2)

    inner = ndimage.binary_erosion(core, iterations=4)
    if inner.sum() < 20:
        inner = core
    # Distance from the background at which the leaf is fully opaque: taken
    # from its own interior, so a pale leaf and a dark leaf both become solid.
    d_ref = max(float(np.percentile(d[inner], 55)), 30.0)
    alpha = np.clip(d / d_ref, 0.0, 1.0)
    # Nothing outside the halo, and a soft roll-off at its boundary.
    soft = ndimage.gaussian_filter(halo.astype(np.float32), 1.2)
    alpha = alpha * np.clip(soft * 1.4, 0, 1)
    if L.get("clip_y") is not None:
        # The tip was met by the pouch at the clip line. Round it off over the
        # last few rows, or a falling leaf would show a ruler-straight cut.
        cy = L["clip_y"] - y0
        rows = np.arange(alpha.shape[0])[:, None]
        alpha = alpha * np.clip((cy - rows) / 9.0, 0, 1)
    # Leaves sliced by the image's own border have a ruler-straight edge
    # there. Invisible while the leaf sits at the border; obvious the moment
    # it drifts inward. Feather only the sliced sides.
    FEATHER = 16.0
    gy = np.arange(y0, y1)[:, None].astype(np.float32)
    gx = np.arange(x0, x1)[None, :].astype(np.float32)
    touches = alpha > 0.015
    if touches[:, 0].any() and x0 == 0:
        alpha = alpha * np.clip(gx / FEATHER, 0, 1)
    if touches[0, :].any() and y0 == 0:
        alpha = alpha * np.clip(gy / FEATHER, 0, 1)
    if touches[:, -1].any() and x1 == W:
        alpha = alpha * np.clip((W - 1 - gx) / FEATHER, 0, 1)
    if touches[-1, :].any() and y1 == H:
        alpha = alpha * np.clip((H - 1 - gy) / FEATHER, 0, 1)
    alpha[alpha < 0.015] = 0.0

    # Un-premultiply against the known background: composited back over B,
    # these colours give exactly C.
    a3 = np.maximum(alpha, 1e-3)[..., None]
    F = np.clip(B + (C - B) / a3, 0, 255)
    F[alpha == 0] = 0

    ys, xs = np.nonzero(alpha)
    ty0, ty1, tx0, tx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([F[ty0:ty1, tx0:tx1], alpha[ty0:ty1, tx0:tx1] * 255]).round().astype(np.uint8)
    sprite = Image.fromarray(rgba, "RGBA")
    out = os.path.join(PUBLIC, "leaves", f"leaf-{L['name']}.webp")
    sprite.save(out, "WEBP", quality=94, alpha_quality=100, method=6)

    # Softness: share of the sprite that is partly transparent. Out-of-focus
    # leaves are mostly edge; crisp ones are mostly body.
    a = alpha[ty0:ty1, tx0:tx1]
    covered = (a > 0.02).sum()
    softness = float(((a > 0.02) & (a < 0.9)).sum() / max(covered, 1))

    # Reconstruction from the saved (lossy) sprite.
    back = np.asarray(Image.open(out).convert("RGBA")).astype(np.float32)
    sa = back[..., 3:4] / 255.0
    region = recon[y0 + ty0:y0 + ty1, x0 + tx0:x0 + tx1]
    recon[y0 + ty0:y0 + ty1, x0 + tx0:x0 + tx1] = back[..., :3] * sa + region * (1 - sa)

    manifest.append({
        "name": L["name"],
        "x": int(x0 + tx0), "y": int(y0 + ty0),
        "w": int(tx1 - tx0), "h": int(ty1 - ty0),
        "softness": round(softness, 3),
        "bytes": os.path.getsize(out),
    })

Image.fromarray(clean).save(CLEAN, optimize=True)

# The hero as served: a WIDE canvas, pre-encoded.
#
# The supplied image is 3:2; screens are wider (a 1920px desktop band under
# the header is about 2.6:1). Stretching distorts it and a plain cover-crop
# cuts the logo or the products. So the canvas is widened instead:
#
#   - rows CROP_TOP..CROP_BOTTOM only: the content spans rows 107-916, and
#     the rest is empty white margin, so trimming it lets the content itself
#     render larger in a short band;
#   - PAD_X of matched backdrop added on each side, so the hero can fill any
#     width edge to edge with no seam. The backdrop at both edges is a
#     uniform near-white (the edge leaves have already been removed), so each
#     row is extended with a smoothed median of its outermost columns, and the
#     last FEATHER columns of the original are blended toward it.
#
# The page shows this canvas with object-fit: cover. The leaf sprites keep
# source-image coordinates; the page maps them with PAD_X and CROP_TOP.
CROP_TOP, CROP_BOTTOM, PAD_X, EDGE, FEATHER = 70, 950, 768, 10, 24
band = clean[CROP_TOP:CROP_BOTTOM].astype(np.float32)
bh = band.shape[0]
left_ext = ndimage.gaussian_filter1d(np.median(band[:, :EDGE], axis=1), 6, axis=0)
right_ext = ndimage.gaussian_filter1d(np.median(band[:, -EDGE:], axis=1), 6, axis=0)
ramp = np.linspace(1.0, 0.0, FEATHER)[None, :, None]   # 1 at the edge, 0 inward
band[:, :FEATHER] = band[:, :FEATHER] * (1 - ramp) + left_ext[:, None, :] * ramp
band[:, -FEATHER:] = band[:, -FEATHER:] * (1 - ramp[:, ::-1]) + right_ext[:, None, :] * ramp[:, ::-1]
# Veins in the marble at the very edge would otherwise run out across the
# whole margin as thin horizontal streaks. Moving away from the seam, each
# extension column eases from the lightly smoothed edge toward a heavily
# smoothed one, so the floor dissolves into a soft gradient.
def extension(edge_rows, flip):
    near = edge_rows
    far = ndimage.gaussian_filter1d(edge_rows, 28, axis=0)
    k = np.minimum(np.arange(PAD_X) / 240.0, 1.0)[None, :, None]
    if flip:
        k = k[:, ::-1]
    return near[:, None, :] * (1 - k) + far[:, None, :] * k

wide = np.concatenate([
    extension(left_ext, flip=True),
    band,
    extension(right_ext, flip=False),
], axis=1)
wide = np.clip(np.round(wide), 0, 255).astype(np.uint8)
for old_name in ("hero-768.webp", "hero-1152.webp", "hero-1536.webp"):
    stale = os.path.join(PUBLIC, old_name)
    if os.path.exists(stale):
        os.remove(stale)
for width in (1536, 3072):
    img = Image.fromarray(wide)
    if width != wide.shape[1]:
        img = img.resize((width, round(bh * width / wide.shape[1])), Image.LANCZOS)
    img.save(os.path.join(PUBLIC, f"hero-wide-{width}.webp"), "WEBP", quality=86, method=6)
print("wide canvas", wide.shape[1], "x", wide.shape[0])

diff = np.abs(recon - f)
mse = float((diff ** 2).mean())
psnr = 10 * np.log10(255 ** 2 / mse) if mse > 0 else float("inf")
leaf_px = full_mask > 0
print(json.dumps({
    "reconstruction": {
        "psnr_whole_image_db": round(psnr, 2),
        "mean_abs_error_in_leaf_regions": round(float(diff[leaf_px].mean()), 3),
        "p99_abs_error_in_leaf_regions": round(float(np.percentile(diff[leaf_px], 99)), 2),
        "max_abs_error": round(float(diff.max()), 1),
    },
    "leaves": manifest,
}, indent=1))

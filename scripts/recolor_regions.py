#!/usr/bin/env python3
"""
Reassign RGB colors per *parent region* (the same grouping used by the
sidebar UI / regions.json "parent" field), choosing colors that try to
stay visually distinct between spatially adjacent parent regions.

Only touches color metadata (atlas_lut.json's R/G/B, regions.json's
"color") — the atlas.nii.gz / atlasAndBorders.nii.gz volumes encode label
IDs, not colors, so they don't need to change.

Usage:
    python3 recolor_regions.py --species mouse \
        --site-root /home/dbarriere/Recherche/monsitepersonnel/site

Algorithm:
  1. Build the parent-adjacency graph by scanning the atlas volume for
     6-connected voxels whose parent groups differ (same idea as the
     border-mask computation in build_atlas_data.py).
  2. Generate a palette of N well-separated, reasonably saturated/bright
     colors (evenly spaced hue, varied saturation/value) — bright enough
     to read against a dark canvas.
  3. Assign palette colors to parent regions with a DSATUR-style greedy
     heuristic: repeatedly pick the not-yet-colored region with the most
     already-colored neighbours, and give it the *unused* palette color
     that maximizes the minimum perceptual distance to those neighbours'
     colors (redmean approximation, cheap and dependency-free).
"""
import argparse
import json
import colorsys
import math
from pathlib import Path

import nibabel as nib
import numpy as np


def build_adjacency(atlas_path, id_to_parent, parent_names):
    img = nib.load(atlas_path)
    data = np.asanyarray(img.dataobj).astype(np.int32)

    # id -> parent-group-index lookup array (index = raw id, fast to apply).
    # Sized to the data's own max (e.g. the background/border sentinel can
    # exceed any real label's ID); unknown/background IDs default to -1.
    max_id = max(max(id_to_parent.keys()), int(data.max()))
    pidx = {p: i for i, p in enumerate(parent_names)}
    lut = np.full(max_id + 1, -1, dtype=np.int32)
    for rid, parent in id_to_parent.items():
        lut[rid] = pidx[parent]

    grouped = lut[data]
    padded = np.pad(grouped, 1, mode="constant", constant_values=-1)
    center = padded[1:-1, 1:-1, 1:-1]

    n = len(parent_names)
    adjacency = [set() for _ in range(n)]
    for dx, dy, dz in [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)]:
        neighbor = padded[1 + dx : 1 + dx + data.shape[0], 1 + dy : 1 + dy + data.shape[1], 1 + dz : 1 + dz + data.shape[2]]
        diff_mask = (neighbor != center) & (center >= 0) & (neighbor >= 0)
        if not diff_mask.any():
            continue
        pairs = np.unique(np.stack([center[diff_mask], neighbor[diff_mask]], axis=1), axis=0)
        for a, b in pairs:
            if a != b:
                adjacency[a].add(int(b))
                adjacency[b].add(int(a))
    return adjacency


def generate_palette(n):
    """n well-separated colors: golden-angle hue rotation, varied S/V so
    consecutive hues (which can still look similar) get pushed further
    apart in brightness/saturation too."""
    colors = []
    golden = 0.6180339887498949
    hue = 0.02
    for i in range(n):
        hue = (hue + golden) % 1.0
        sat = 0.65 + 0.30 * ((i * 7) % 5) / 4.0  # 0.65..0.95, cycles of 5
        val = 0.75 + 0.20 * ((i * 3) % 3) / 2.0  # 0.75..0.95, cycles of 3
        r, g, b = colorsys.hsv_to_rgb(hue, min(sat, 1.0), min(val, 1.0))
        colors.append((round(r * 255), round(g * 255), round(b * 255)))
    return colors


def redmean_distance(c1, c2):
    r1, g1, b1 = c1
    r2, g2, b2 = c2
    rmean = (r1 + r2) / 2
    dr, dg, db = r1 - r2, g1 - g2, b1 - b2
    return math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db)


def assign_colors(adjacency, palette):
    n = len(adjacency)
    assigned = [None] * n
    remaining = set(range(len(palette)))
    uncolored = set(range(n))

    def saturation(i):
        return sum(1 for j in adjacency[i] if assigned[j] is not None)

    while uncolored:
        # DSATUR: pick the uncolored node with the most already-colored
        # neighbours (ties broken by degree, i.e. total neighbour count).
        node = max(uncolored, key=lambda i: (saturation(i), len(adjacency[i])))
        neighbor_colors = [palette[assigned[j]] for j in adjacency[node] if assigned[j] is not None]
        if not neighbor_colors:
            best = next(iter(remaining))
        else:
            best = max(
                remaining,
                key=lambda ci: min(redmean_distance(palette[ci], nc) for nc in neighbor_colors),
            )
        assigned[node] = best
        remaining.discard(best)
        uncolored.discard(node)
        if not remaining:
            remaining = set(range(len(palette)))  # more regions than palette slots: allow reuse
    return [palette[c] for c in assigned]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--species", required=True)
    ap.add_argument("--site-root", required=True, type=Path)
    args = ap.parse_args()

    data_dir = args.site_root / "data" / args.species
    regions = json.loads((data_dir / "regions.json").read_text())
    lut = json.loads((data_dir / "atlas_lut.json").read_text())

    id_to_parent = {r["id"]: r["parent"] for r in regions if r["base"].lower() not in ("background", "clear label")}
    parent_names = sorted(set(id_to_parent.values()))
    print(f"{len(parent_names)} parent regions, {len(id_to_parent)} labeled IDs")

    print("Scanning atlas for parent adjacency...")
    adjacency = build_adjacency(data_dir / "atlas.nii.gz", id_to_parent, parent_names)
    n_edges = sum(len(s) for s in adjacency) // 2
    print(f"  {n_edges} adjacent parent-region pairs found")

    palette = generate_palette(max(len(parent_names), 64))
    colors = assign_colors(adjacency, palette)
    parent_color = dict(zip(parent_names, colors))

    # Report worst remaining collisions for transparency.
    worst = []
    for i, name in enumerate(parent_names):
        for j in adjacency[i]:
            if j > i:
                d = redmean_distance(colors[i], colors[j])
                worst.append((d, name, parent_names[j]))
    worst.sort()
    print("5 closest-colored adjacent pairs (lower = more similar):")
    for d, a, b in worst[:5]:
        print(f"  {d:6.1f}  {a}  <->  {b}")

    for r in regions:
        if r["base"].lower() in ("background", "clear label"):
            continue
        r["color"] = list(parent_color[r["parent"]])
    (data_dir / "regions.json").write_text(json.dumps(regions, indent=1, ensure_ascii=False))

    id_to_color = {rid: parent_color[p] for rid, p in id_to_parent.items()}
    for i, rid in enumerate(lut["I"]):
        if rid in id_to_color:
            r, g, b = id_to_color[rid]
            lut["R"][i], lut["G"][i], lut["B"][i] = r, g, b
    (data_dir / "atlas_lut.json").write_text(json.dumps(lut, ensure_ascii=False))

    print(f"Done. Recolored {len(parent_names)} parent regions in {data_dir}")


if __name__ == "__main__":
    main()

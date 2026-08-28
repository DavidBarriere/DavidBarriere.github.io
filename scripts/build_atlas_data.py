#!/usr/bin/env python3
"""
Build the per-species data files consumed by assets/js/viewer.js:

  data/<species>/template.nii.gz         anatomical template, int16
  data/<species>/atlas.nii.gz            label volume, int16
  data/<species>/atlasAndBorders.nii.gz  same label volume, boundary voxels
                                          replaced by the transparent sentinel
  data/<species>/atlas_lut.json          sparse NiiVue setColormapLabel table
  data/<species>/regions.json            per-label metadata for the sidebar UI
  data/<species>/parents_list.json       unique parent-region names

Usage:
    python3 build_atlas_data.py \
        --species mouse \
        --template /path/to/Brain_Template.nii.gz \
        --atlas /path/to/Brain_Atlas.nii.gz \
        --labels /path/to/ITK_Label_File.txt \
        --site-root /home/dbarriere/Recherche/monsitepersonnel/site

Requires: nibabel, numpy, and on $PATH: fslmaths (FSL), ImageMath (ANTs).

--- Why this pipeline looks the way it does (NiiVue 0.69.0 quirks) ---

1. BACKGROUND_SENTINEL (9999): a discrete label colormap's alpha=0 entry for
   raw voxel value 0 is NOT reliably transparent in this NiiVue version —
   it renders as an opaque fallback color instead, regardless of the LUT.
   Fix: never let 0 appear in the label volume's data at all. Any "no label"
   voxel (background, or later, a region boundary) is recoded to a sentinel
   value that isn't used by any real label and IS listed in the LUT with
   alpha=0.

2. LUT_PAD (32 dummy entries prepended to the sparse LUT): NiiVue also
   silently drops/ignores roughly the first ~20 entries of a setColormapLabel
   sparse array regardless of their value (confirmed empirically: the first
   two real mouse structures in ID order rendered as plain template gray
   until padding was added). Padding with harmless negative, never-occurring
   IDs pushes all real entries safely past that zone.

3. Borders are a SECOND full label volume (atlasAndBorders.nii.gz), not a
   separate mask/overlay: every voxel that touches a differently-labeled
   neighbour gets recoded to the same BACKGROUND_SENTINEL used for the
   plain atlas's "no label" background. Because it reuses the exact same
   atlas_lut.json and the exact same proven-transparent sentinel, there is
   no extra colormap, no opacity-blend interaction between two overlapping
   label volumes, and no new NiiVue edge case to hit. The viewer just loads
   both volumes and swaps opacity between them when "region borders" is
   toggled on/off.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import nibabel as nib
import numpy as np

BACKGROUND_SENTINEL = 9999
LUT_PAD = 32
POSITIVE_PAD = 0

LINE_RE = re.compile(r'^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s+(\d+)\s+(\d+)\s+"(.*)"\s*$')


def parse_itksnap_labels(path):
    labels = []
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            # Some source files use doubled double-quotes ("") to escape an
            # apostrophe inside the label string (e.g. Barrington""s nucleus).
            line = line.replace('""', "'")
            m = LINE_RE.match(line)
            if not m:
                print(f"WARNING: could not parse line: {line!r}", file=sys.stderr)
                continue
            idx, r, g, b, _a, _vis, _mesh, name = m.groups()
            name = normalize_label_text(name.strip())
            labels.append({"id": int(idx), "r": int(r), "g": int(g), "b": int(b), "name": name})
    return labels


def normalize_label_text(name):
    """Some source files use underscore_separated_lowercase names instead of
    'Spaced Capitalized' ones — cosmetic only, makes the sidebar/tooltips
    readable regardless of the source atlas's naming convention."""
    if "_" in name and " " not in name:
        name = name.replace("_", " ")
        name = name[:1].upper() + name[1:]
    return name


def hemisphere_and_base(name):
    # Separator can be a space (" Left") or an underscore-turned-space by
    # normalize_label_text above; match either, case-insensitively.
    m = re.search(r"[\s_](left|right)$", name, re.IGNORECASE)
    if m:
        hemi = "L" if m.group(1).lower() == "left" else "R"
        return hemi, name[: m.start()].strip()
    return None, name.strip()


def is_layer_segment(seg):
    seg = seg.strip().lower()
    return seg.startswith("layer") or seg.endswith("layer")


def parent_key(base):
    if "/" in base and "," not in base:
        parts = base.split("/")
        joiner = "/"
    else:
        parts = re.split(r"\s*,\s*", base)
        joiner = ", "
    if len(parts) > 1 and is_layer_segment(parts[-1]):
        return joiner.join(parts[:-1]).strip()
    return base


def build_regions_and_lut(labels):
    regions, lut_I, lut_R, lut_G, lut_B, lut_A, lut_labels = [], [], [], [], [], [], []
    for lab in labels:
        hemi, base = hemisphere_and_base(lab["name"])
        is_bg = base.lower() in ("background", "clear label")
        pkey = base if is_bg else parent_key(base)
        real_id = BACKGROUND_SENTINEL if is_bg else lab["id"]
        regions.append(
            {
                "id": real_id,
                "name": lab["name"],
                "base": base,
                "hemisphere": hemi,
                "parent": pkey,
                "color": [lab["r"], lab["g"], lab["b"]],
            }
        )
        lut_I.append(real_id)
        lut_R.append(lab["r"])
        lut_G.append(lab["g"])
        lut_B.append(lab["b"])
        lut_A.append(0 if is_bg else 255)
        lut_labels.append(lab["name"])

    # Sort the real entries by ID. The source file lists "Background" (now
    # remapped to the large BACKGROUND_SENTINEL) first, which would otherwise
    # leave it out of order ahead of every real, much-smaller ID — and NiiVue's
    # sparse-LUT lookup appears to require (or at least strongly prefers) an
    # ascending "I" array, misrendering entries near an out-of-order one.
    order = sorted(range(len(lut_I)), key=lambda k: lut_I[k])
    lut_I = [lut_I[k] for k in order]
    lut_R = [lut_R[k] for k in order]
    lut_G = [lut_G[k] for k in order]
    lut_B = [lut_B[k] for k in order]
    lut_A = [lut_A[k] for k in order]
    lut_labels = [lut_labels[k] for k in order]

    # Padding: harmless negative IDs that never occur in real data, placed
    # first so the array stays sorted ascending (see module docstring, #2).
    # A second, small block of *positive* dummy IDs (1..POSITIVE_PAD) is
    # inserted directly before the real data: empirically, NiiVue seems to
    # drop/misalign specifically the first ~10 entries with a positive ID,
    # regardless of how much negative padding precedes them (confirmed by
    # rendering the raw data ourselves and comparing to what NiiVue showed:
    # the first real region was blank and the *next* one displayed the
    # first region's color instead of its own — a clean N-position shift
    # affecting only positive IDs). All real IDs here start at 11, so 1..10
    # can never collide with genuine data.
    pad_ids = list(range(-LUT_PAD, 0))
    positive_pad_ids = list(range(1, POSITIVE_PAD + 1))
    n_pad = LUT_PAD + POSITIVE_PAD
    lut = {
        "I": pad_ids + positive_pad_ids + lut_I,
        "R": [0] * n_pad + lut_R,
        "G": [0] * n_pad + lut_G,
        "B": [0] * n_pad + lut_B,
        "A": [0] * n_pad + lut_A,
        "labels": ["__pad__"] * n_pad + lut_labels,
    }
    parents = sorted({r["parent"] for r in regions if r["base"].lower() not in ("background", "clear label")})
    return regions, lut, parents


def apply_id_remap(regions, lut, remap):
    """
    remap: {old_id: new_id}. Updates regions[].id and lut["I"] in place.

    Workaround for a NiiVue quirk (unresolved as of 0.69.0, distinct from
    the LUT_PAD issue above): even well past the padded "dead zone", the
    very first *group* of real entries in the sparse array can still render
    wrong (invisible, or displaying a neighbouring group's color) for
    reasons padding does not fix. Moving the affected structure's IDs into
    the middle of the ID range (anywhere already proven to render fine)
    reliably works around it. Use this only for structures empirically
    confirmed broken — it's a targeted patch, not a general precaution.
    """
    remap = {int(k): int(v) for k, v in remap.items()}
    for r in regions:
        if r["id"] in remap:
            r["id"] = remap[r["id"]]
    lut["I"] = [remap.get(i, i) for i in lut["I"]]


def remap_atlas_values(atlas_path, remap):
    img = nib.load(atlas_path)
    data = np.asanyarray(img.dataobj).astype(np.int32)
    remap = {int(k): int(v) for k, v in remap.items()}
    out = data.copy()
    for old, new in remap.items():
        out[data == old] = new
    result = nib.Nifti1Image(out.astype(np.int16), img.affine, img.header)
    result.header.set_data_dtype(np.int16)
    result.to_filename(atlas_path)


def cast_labels_to_int16(src_path, out_path, background_value=0):
    img = nib.load(src_path)
    data = np.asanyarray(img.dataobj)
    if not np.all(data == np.round(data)):
        raise ValueError(f"{src_path}: atlas contains non-integer voxel values")
    if data.max() > 32767 or data.min() < 0:
        raise ValueError(f"{src_path}: label range does not fit int16")
    data = data.astype(np.int32)
    data[data == background_value] = BACKGROUND_SENTINEL
    out = nib.Nifti1Image(data.astype(np.int16), img.affine, img.header)
    out.header.set_data_dtype(np.int16)
    out.to_filename(out_path)


def copy_template_int16(src_path, out_path):
    """
    Cast the anatomical template to int16. Some source templates are
    already sanely-ranged int16; others (float, raw scanner units) can have
    huge/wide-ranging values that silently overflow/wrap when cast directly.
    Detect that case and rescale into a safe int16 range first, using a
    robust (99.5th percentile of nonzero voxels) max so a few outlier/noise
    voxels don't crush the real signal into a tiny slice of the range.

    Returns (cal_min, cal_max) in the OUTPUT int16 units — the caller should
    pass these through as the species page's templateCalMin/templateCalMax
    so the viewer's default contrast window matches the rescaled data.
    """
    img = nib.load(src_path)
    data = np.asanyarray(img.dataobj).astype(np.float64)

    needs_rescale = data.dtype != np.int16 and (data.max() > 32767 or data.min() < 0 or not np.all(data == np.round(data)))
    if needs_rescale:
        nonzero = data[data > 0]
        robust_max = float(np.percentile(nonzero, 99.5)) if nonzero.size else float(data.max())
        robust_max = max(robust_max, 1.0)
        scaled = np.clip(data, 0, robust_max) / robust_max * 30000
        out_data = scaled.astype(np.int16)
        cal_min, cal_max = 0, 27000  # ~90th percentile of the rescaled 0..30000 range
    else:
        out_data = data.astype(np.int16)
        cal_min = cal_max = None

    out = nib.Nifti1Image(out_data, img.affine, img.header)
    out.header.set_data_dtype(np.int16)
    out.to_filename(out_path)
    return cal_min, cal_max


def compute_border_mask(atlas_path, out_path, regions=None):
    """
    1 = voxel touches a 6-connected neighbour belonging to a different
    *parent* region, else 0.

    Comparing raw label IDs would also draw a line between every cortical
    layer / sub-part of the same structure (e.g. "Primary motor area, Layer
    1" vs "...Layer 2/3"), which for a finely-subdivided atlas produces so
    many borders that the outline stops being readable. Instead, every raw
    ID is first recoded to its parent-region group (the same grouping the
    sidebar UI uses, from regions.json's "parent" field) so only boundaries
    between genuinely distinct regions are drawn.

    `regions` is the list of dicts produced by build_regions_and_lut() (each
    with "id" and "parent"). If omitted, falls back to comparing raw IDs.
    """
    img = nib.load(atlas_path)
    data = np.asanyarray(img.dataobj).astype(np.int32)

    if regions:
        parent_names = sorted({r["parent"] for r in regions})
        parent_to_gid = {p: i for i, p in enumerate(parent_names)}
        id_to_gid = {r["id"]: parent_to_gid[r["parent"]] for r in regions}
        max_id = max(id_to_gid)
        lut = np.zeros(max_id + 1, dtype=np.int32)
        for rid, gid in id_to_gid.items():
            lut[rid] = gid
        compare_data = lut[data]
        pad_value = id_to_gid[BACKGROUND_SENTINEL]
    else:
        compare_data = data
        pad_value = BACKGROUND_SENTINEL

    padded = np.pad(compare_data, 1, mode="constant", constant_values=pad_value)
    center = padded[1:-1, 1:-1, 1:-1]
    border = np.zeros(data.shape, dtype=bool)
    for dx, dy, dz in [(1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1)]:
        neighbor = padded[1 + dx : 1 + dx + data.shape[0], 1 + dy : 1 + dy + data.shape[1], 1 + dz : 1 + dz + data.shape[2]]
        border |= neighbor != center
    out = nib.Nifti1Image(border.astype(np.uint8), img.affine, img.header)
    out.header.set_data_dtype(np.uint8)
    out.to_filename(out_path)


def fuse_atlas_and_borders(atlas_path, border_mask_path, out_path):
    """
    atlasAndBorders = atlas, with every border voxel forced to the sentinel.
    Implemented with FSL + ANTs so it's trivially reproducible/inspectable
    from the shell for a new species:

        fslmaths border_mask.nii.gz -binv -mul atlas.nii.gz atlasAndBorders.nii.gz
        ImageMath 3 atlasAndBorders.nii.gz ReplaceVoxelValue \\
            atlasAndBorders.nii.gz 0 0 9999.
    """
    subprocess.run(
        ["fslmaths", str(border_mask_path), "-binv", "-mul", str(atlas_path), str(out_path)],
        check=True,
    )
    subprocess.run(
        [
            "ImageMath", "3", str(out_path), "ReplaceVoxelValue",
            str(out_path), "0", "0", f"{BACKGROUND_SENTINEL}.",
        ],
        check=True,
    )


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--species", required=True, help="species slug, e.g. mouse, rat, horse, sheep, swine, quail")
    ap.add_argument("--template", required=True, type=Path, help="source anatomical template .nii.gz")
    ap.add_argument("--atlas", required=True, type=Path, help="source label/atlas .nii.gz")
    ap.add_argument("--labels", required=True, type=Path, help="ITK-SNAP label description .txt file")
    ap.add_argument("--site-root", required=True, type=Path, help="path to the site/ directory")
    ap.add_argument(
        "--atlas-background-value", type=float, default=0,
        help="raw voxel value in --atlas meaning 'no label' (default 0)",
    )
    ap.add_argument("--skip-borders", action="store_true", help="skip border-volume generation (requires FSL+ANTs)")
    ap.add_argument(
        "--relocate-ids", type=str, default=None,
        help='JSON object mapping old real label IDs to new ones, e.g. \'{"11":6691,"12":6692}\'. '
             "Workaround for specific structures that render wrong near the start of the ID range "
             "(see apply_id_remap() docstring). Only pass IDs empirically confirmed broken.",
    )
    args = ap.parse_args()

    out_dir = args.site_root / "data" / args.species
    out_dir.mkdir(parents=True, exist_ok=True)

    print("Parsing labels...")
    labels = parse_itksnap_labels(args.labels)
    regions, lut, parents = build_regions_and_lut(labels)

    remap = json.loads(args.relocate_ids) if args.relocate_ids else None
    if remap:
        print(f"Relocating IDs: {remap}")
        apply_id_remap(regions, lut, remap)

    (out_dir / "regions.json").write_text(json.dumps(regions, indent=1, ensure_ascii=False))
    (out_dir / "atlas_lut.json").write_text(json.dumps(lut, ensure_ascii=False))
    (out_dir / "parents_list.json").write_text(json.dumps(parents, indent=1, ensure_ascii=False))
    print(f"  {len(labels)} labels, {len(parents)} unique parent regions")

    print("Writing template.nii.gz (int16)...")
    tcal_min, tcal_max = copy_template_int16(args.template, out_dir / "template.nii.gz")
    if tcal_min is not None:
        print(f"  Template was rescaled — use templateCalMin: {tcal_min}, templateCalMax: {tcal_max} in the species page.")

    print("Writing atlas.nii.gz (int16, background -> sentinel)...")
    cast_labels_to_int16(args.atlas, out_dir / "atlas.nii.gz", args.atlas_background_value)
    if remap:
        remap_atlas_values(out_dir / "atlas.nii.gz", remap)

    if not args.skip_borders:
        print("Computing region-boundary mask...")
        compute_border_mask(out_dir / "atlas.nii.gz", out_dir / "borders.nii.gz", regions=regions)
        print("Fusing atlas + borders (fslmaths + ImageMath)...")
        fuse_atlas_and_borders(out_dir / "atlas.nii.gz", out_dir / "borders.nii.gz", out_dir / "atlasAndBorders.nii.gz")

    print(f"Done. Data written to {out_dir}")
    print("Don't forget to write descriptions.json (can start as '{}') and the species .html page.")


if __name__ == "__main__":
    main()

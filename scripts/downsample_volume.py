#!/usr/bin/env python3
"""
Downsample a template + atlas pair to a target isotropic voxel size.

Some source atlases (e.g. the swine one, at 0.1x0.15x0.1mm / 560x535x480 =
~144M voxels) are far too large for smooth web/WebGL loading (huge file
size, and 3D texture dimensions can exceed GPU limits on integrated
graphics). Run this BEFORE build_atlas_data.py to bring such a pair down to
a size comparable to the other species (a few million voxels).

Label volumes are resampled with nearest-neighbour (order=0) so discrete
IDs are never interpolated into invalid intermediate values; the anatomical
template uses linear interpolation (order=1).

Usage:
    python3 downsample_volume.py \
        --template /path/to/brain.nii.gz \
        --atlas /path/to/atlas.nii.gz \
        --target-mm 0.4 \
        --out-template /path/to/brain_ds.nii.gz \
        --out-atlas /path/to/atlas_ds.nii.gz
"""
import argparse

import nibabel as nib
import numpy as np
from scipy.ndimage import zoom


def downsample(src_path, out_path, target_mm, order):
    img = nib.load(src_path)
    data = np.asanyarray(img.dataobj)
    zooms = img.header.get_zooms()[:3]
    factors = [z / target_mm for z in zooms]
    new_data = zoom(data, factors, order=order)

    new_affine = img.affine.copy()
    for i in range(3):
        new_affine[:3, i] = img.affine[:3, i] / factors[i]

    out_img = nib.Nifti1Image(new_data, new_affine, img.header)
    out_img.to_filename(out_path)
    return data.shape, new_data.shape


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--template", required=True)
    ap.add_argument("--atlas", required=True)
    ap.add_argument("--out-template", required=True)
    ap.add_argument("--out-atlas", required=True)
    ap.add_argument("--target-mm", type=float, required=True, help="target isotropic voxel size in mm")
    args = ap.parse_args()

    old_shape, new_shape = downsample(args.template, args.out_template, args.target_mm, order=1)
    print(f"template: {old_shape} -> {new_shape} ({np.prod(new_shape):,} voxels)")

    old_shape, new_shape = downsample(args.atlas, args.out_atlas, args.target_mm, order=0)
    print(f"atlas:    {old_shape} -> {new_shape} ({np.prod(new_shape):,} voxels)")

    orig_labels = set(np.unique(np.asanyarray(nib.load(args.atlas).dataobj)).tolist())
    new_labels = set(np.unique(np.asanyarray(nib.load(args.out_atlas).dataobj)).tolist())
    missing = orig_labels - new_labels
    if missing:
        print(f"WARNING: {len(missing)} label ID(s) disappeared after downsampling (too small to survive at this "
              f"resolution): {sorted(missing)}")
    else:
        print("All label IDs preserved.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Merge freshly-researched region descriptions into a species' descriptions.json.

Input is a JSON file mapping region name -> {"en": ..., "fr": ..., "sources": [{"title","url"}, ...]}
for exactly the structures that were previously empty placeholders. Only fills entries that are
currently empty (no "en"/"fr" text) or missing outright; never overwrites an already-documented entry.

Usage:
    python3 merge_descriptions.py --target swine --input /path/to/swine_batch1.json --site-root .
"""
import argparse
import json
import os


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--target", required=True)
    ap.add_argument("--input", required=True, action="append", help="can be passed multiple times")
    ap.add_argument("--site-root", default=".")
    args = ap.parse_args()

    desc_path = os.path.join(args.site_root, "data", args.target, "descriptions.json")
    with open(desc_path, "r", encoding="utf-8") as f:
        descs = json.load(f)

    filled, skipped, unknown = 0, 0, []

    for input_path in args.input:
        with open(input_path, "r", encoding="utf-8") as f:
            batch = json.load(f)

        for name, entry in batch.items():
            if name not in descs:
                unknown.append(name)
                continue
            existing = descs.get(name)
            is_empty = existing is None or not (
                isinstance(existing, dict) and (existing.get("en") or existing.get("fr"))
            )
            if not is_empty:
                skipped += 1
                continue
            descs[name] = {
                "en": entry["en"],
                "fr": entry["fr"],
                "sources": entry.get("sources", []),
                "status": "documented",
            }
            filled += 1

    with open(desc_path, "w", encoding="utf-8") as f:
        json.dump(descs, f, indent=2, ensure_ascii=False)

    print(f"{args.target}: filled {filled}, skipped {skipped} (already documented)")
    if unknown:
        print(f"WARNING: {len(unknown)} name(s) in input not found in target descriptions.json: {unknown}")

    total = len(descs)
    documented = sum(1 for v in descs.values() if isinstance(v, dict) and (v.get("en") or v.get("fr")))
    print(f"{args.target}: {documented}/{total} documented")


if __name__ == "__main__":
    main()

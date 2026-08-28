#!/usr/bin/env python3
"""
Populate a species' descriptions.json by reusing already-researched
descriptions from another species (e.g. mouse -> rat), matching parent
region names. Saves re-running expensive WebSearch-heavy research for
structures that are effectively the same nucleus/area across species.

Only exact (after light normalization) or very-high-confidence fuzzy
matches are reused, so we don't attach a mouse-specific citation to an
unrelated rat structure. Everything else is left/marked "pending" for a
later, smaller, targeted research pass.

Usage:
    python3 reuse_descriptions.py --source mouse --target rat \
        --site-root /home/dbarriere/Recherche/monsitepersonnel/site
"""
import argparse
import difflib
import json
import re
from pathlib import Path


SPECIES_WORDS = {
    "mouse": {"en": ["mouse", "mice"], "fr": ["souris"]},
    "rat": {"en": ["rat", "rats"], "fr": ["rat", "rats"]},
}


def retarget_species_words(text, source, target):
    if source not in SPECIES_WORDS or target not in SPECIES_WORDS:
        return text
    for lang in ("en", "fr"):
        src_words = SPECIES_WORDS[source][lang]
        tgt_word = SPECIES_WORDS[target][lang][0]
        for w in src_words:
            text = re.sub(rf"\b{w.capitalize()}\b", tgt_word.capitalize(), text)
            text = re.sub(rf"\b{w}\b", tgt_word, text, flags=re.IGNORECASE)
    return text


def normalize(name):
    n = name.lower().strip()
    n = re.sub(r",?\s*unspecified$", "", n)
    n = re.sub(r"[,\-]", " ", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n


def levenshtein(a, b):
    if a == b:
        return 0
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        prev = cur
    return prev[-1]


def is_safe_fuzzy_match(name_a, name_b):
    """
    Only accept a fuzzy match when it's essentially the same words (typo /
    minor spelling variant), never when a word gained/lost a meaningful
    prefix or was swapped for a different-but-similar-looking one — e.g.
    "thalamic" vs "hypothalamic", or "parafascicular" vs
    "subparafascicular", are DIFFERENT structures despite scoring high on
    plain string similarity.
    """
    wa, wb = name_a.split(), name_b.split()
    if len(wa) != len(wb):
        return False
    diffs = 0
    for a, b in zip(wa, wb):
        if a == b:
            continue
        diffs += 1
        if diffs > 1 or levenshtein(a, b) > 2:
            return False
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", required=True, help="species slug to copy descriptions FROM")
    ap.add_argument("--target", required=True, help="species slug to write descriptions.json for")
    ap.add_argument("--site-root", required=True, type=Path)
    ap.add_argument("--fuzzy-cutoff", type=float, default=0.92, help="difflib ratio threshold for non-exact matches")
    args = ap.parse_args()

    src_dir = args.site_root / "data" / args.source
    tgt_dir = args.site_root / "data" / args.target

    src_desc = json.loads((src_dir / "descriptions.json").read_text())
    tgt_parents = json.loads((tgt_dir / "parents_list.json").read_text())

    # Additive: if the target already has a descriptions.json (e.g. from a
    # prior --source run against a different species), keep whatever is
    # already "documented" there and only try to fill in what's still
    # pending — so running this multiple times against several sources
    # (mouse, then rat, ...) accumulates matches instead of each run
    # clobbering the previous one's.
    tgt_desc_path = tgt_dir / "descriptions.json"
    existing = json.loads(tgt_desc_path.read_text()) if tgt_desc_path.exists() else {}

    src_documented = {k: v for k, v in src_desc.items() if v.get("status") == "documented"}
    src_norm = {normalize(k): k for k in src_documented}
    src_norm_keys = list(src_norm.keys())

    def make_entry(match_key):
        entry = dict(src_documented[match_key])
        entry["en"] = retarget_species_words(entry.get("en", ""), args.source, args.target)
        entry["fr"] = retarget_species_words(entry.get("fr", ""), args.source, args.target)
        entry["reused_from"] = f"{args.source}:{match_key}"
        return entry

    out = dict(existing)
    exact, fuzzy, missing, already = 0, 0, 0, 0
    for parent in tgt_parents:
        if existing.get(parent, {}).get("status") == "documented":
            already += 1
            continue
        n = normalize(parent)
        if n in src_norm:
            match_key = src_norm[n]
            out[parent] = make_entry(match_key)
            exact += 1
            continue
        close = difflib.get_close_matches(n, src_norm_keys, n=1, cutoff=args.fuzzy_cutoff)
        close = [c for c in close if is_safe_fuzzy_match(n, c)]
        if close:
            match_key = src_norm[close[0]]
            out[parent] = make_entry(match_key)
            fuzzy += 1
            continue
        out[parent] = {"en": "", "fr": "", "sources": [], "status": "pending"}
        missing += 1

    tgt_desc_path.write_text(json.dumps(out, indent=1, ensure_ascii=False))
    print(
        f"{args.target}: {already} already documented (kept), {exact} new exact matches, "
        f"{fuzzy} new fuzzy matches, {missing} still pending, {len(tgt_parents)} total"
    )


if __name__ == "__main__":
    main()

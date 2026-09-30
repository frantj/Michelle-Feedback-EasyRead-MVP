#!/usr/bin/env python3
"""Check an Easy Read JSON file against the schema and the Easy Read rules.

Usage: python3 validate.py easy-read.json

Prints every violation (must fix) and warning (worth a look). Exits 1 if there
are violations, 0 otherwise.
"""

import re
import sys
from collections import defaultdict

from easy_read_common import load_image_map, load_json, resolve_keyword, schema_errors

MAX_SENTENCE_WORDS = 15
MAX_TITLE_WORDS = 8
MAX_SUMMARY_WORDS = 80
MAX_IMAGE_REPEATS = 3

CONTRACTION = re.compile(
    r"\b(\w+n't|\w+'(re|ll|ve|m|d)|(it|that|there|here|what|who|he|she|let|where|how)'s)\b",
    re.IGNORECASE,
)
NUMBER_WORD = re.compile(
    r"\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|"
    r"thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|"
    r"thirty|forty|fifty|hundred|thousand|million)\b",
    re.IGNORECASE,
)


def word_count(text):
    return len([w for w in text.split() if re.search(r"\w", w)])


def check_text(label, text, max_words, violations, warnings):
    normalized = text.replace("’", "'")
    n = word_count(normalized)
    if max_words and n > max_words:
        violations.append(f"{label}: {n} words (max {max_words}): {text}")
    for m in CONTRACTION.finditer(normalized):
        violations.append(f'{label}: contraction "{m.group(0)}" (write it in full): {text}')
    for m in NUMBER_WORD.finditer(normalized):
        warnings.append(f'{label}: number written as a word "{m.group(0)}" (use figures): {text}')


def validate(doc, image_map):
    violations = schema_errors(doc)
    warnings = []
    if violations:
        return violations, warnings

    check_text("Title", doc["title"], MAX_TITLE_WORDS, violations, warnings)
    if not doc["title"].strip():
        violations.append("Title is empty.")
    check_text("Summary", doc["summary"], MAX_SUMMARY_WORDS, violations, warnings)
    if not doc["sections"]:
        violations.append("There are no sections.")

    sentences_by_file = defaultdict(list)
    for i, section in enumerate(doc["sections"], 1):
        if not section["heading"].strip():
            violations.append(f"Section {i}: heading is empty.")
        if not section["sentences"]:
            violations.append(f'Section {i} ("{section["heading"]}"): no sentences.')
        for j, s in enumerate(section["sentences"], 1):
            label = f"Section {i}, sentence {j}"
            text = s["text"]
            if not text.strip():
                violations.append(f"{label}: empty sentence.")
                continue
            check_text(label, text, MAX_SENTENCE_WORDS, violations, warnings)
            if text.count(",") >= 3:
                warnings.append(f"{label}: looks like a list in one sentence (split it up): {text}")

            kw = s.get("imageKeyword")
            if not kw:
                violations.append(f"{label}: no imageKeyword.")
                continue
            match, how = resolve_keyword(kw, image_map)
            if how == "exact":
                sentences_by_file[image_map[match]["file"]].append((label, kw))
            elif how == "fallback":
                violations.append(f'{label}: keyword "{kw}" is not in the catalog '
                                  f'(closest: "{match}"; use a catalog keyword).')
            else:
                violations.append(f'{label}: keyword "{kw}" is not in the catalog.')

    for uses in sentences_by_file.values():
        if len(uses) > MAX_IMAGE_REPEATS:
            kws = ", ".join(sorted({kw for _, kw in uses}))
            where = "; ".join(label for label, _ in uses)
            violations.append(f'Image for "{kws}" is used {len(uses)} times '
                              f'(max {MAX_IMAGE_REPEATS}): {where}. Pick different images.')
    return violations, warnings


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    doc = load_json(sys.argv[1])
    image_map, _ = load_image_map()
    violations, warnings = validate(doc, image_map)

    for w in warnings:
        print(f"WARNING  {w}")
    for v in violations:
        print(f"FIX      {v}")
    if violations:
        print(f"\n{len(violations)} violation(s) to fix, {len(warnings)} warning(s).")
        sys.exit(1)
    count = sum(len(s["sentences"]) for s in doc["sections"])
    print(f"\nOK: {count} sentences, 0 violations, {len(warnings)} warning(s).")


if __name__ == "__main__":
    main()

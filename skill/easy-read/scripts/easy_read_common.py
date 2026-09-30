"""Shared helpers for validate.py and build_document.py: loading files and matching image keywords."""

import base64
import json
import sys
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
MAP_PATH = SKILL_DIR / "assets" / "image-map.json"
# The images are packed in one JSON file, because a skill upload is limited to 200 files
# and may not contain zip files. Format: {"files": {name: {"encoding": "text"|"base64", "data": ...}}}
IMAGES_BUNDLE = SKILL_DIR / "assets" / "images.json"


def load_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        sys.exit(f"ERROR: file not found: {path}")
    except json.JSONDecodeError as e:
        sys.exit(f"ERROR: {path} is not valid JSON: {e}")


def load_image_map():
    """Return (keyword -> entry, attribution) with _meta/_attribution removed."""
    data = load_json(MAP_PATH)
    image_map = {k: v for k, v in data.items()
                 if not k.startswith("_") and isinstance(v, dict) and v.get("file")}
    return image_map, data.get("_attribution", {})


class ImageBundle:
    """The packed images: .namelist() lists file names, .read(name) returns a file's bytes."""

    def __init__(self, path):
        self._files = load_json(path)["files"]

    def namelist(self):
        return list(self._files)

    def read(self, name):
        entry = self._files[name]
        if entry["encoding"] == "base64":
            return base64.b64decode(entry["data"])
        return entry["data"].encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def open_images():
    return ImageBundle(IMAGES_BUNDLE)


def schema_errors(doc):
    """Port of validateEasyReadResponse() in server.js, with a message per problem."""
    if not isinstance(doc, dict):
        return ["The top level must be a JSON object."]
    errors = []
    if not isinstance(doc.get("title"), str):
        errors.append('"title" must be a string.')
    if not isinstance(doc.get("summary"), str):
        errors.append('"summary" must be a string.')
    sections = doc.get("sections")
    if not isinstance(sections, list):
        errors.append('"sections" must be a list.')
        return errors
    for i, section in enumerate(sections, 1):
        if not isinstance(section, dict) or not isinstance(section.get("heading"), str):
            errors.append(f'Section {i}: "heading" must be a string.')
            continue
        if not isinstance(section.get("sentences"), list):
            errors.append(f'Section {i}: "sentences" must be a list.')
            continue
        for j, s in enumerate(section["sentences"], 1):
            if not isinstance(s, dict) or not isinstance(s.get("text"), str):
                errors.append(f'Section {i}, sentence {j}: "text" must be a string.')
            elif "imageKeyword" in s and not isinstance(s["imageKeyword"], (str, type(None))):
                errors.append(f'Section {i}, sentence {j}: "imageKeyword" must be a string.')
    return errors


def fuzzy_match(keyword, image_map):
    """Port of findImage() in public/js/results.js, minus the exact match: word and stem fallbacks."""
    kw = keyword.lower().strip()
    for word in kw.split():
        if len(word) > 2 and word in image_map:
            return word
    stems = []
    if kw.endswith("s") and len(kw) > 3:
        stems.append(kw[:-1])
    if kw.endswith("ing") and len(kw) > 5:
        stems.append(kw[:-3])
    if kw.endswith("ed") and len(kw) > 4:
        stems.append(kw[:-2])
    if kw.endswith("er") and len(kw) > 4:
        stems.append(kw[:-2])
    if kw.endswith("ly") and len(kw) > 4:
        stems.append(kw[:-2])
    for stem in stems:
        if stem in image_map:
            return stem
    return None


def resolve_keyword(keyword, image_map):
    """Return (matched keyword or None, how): how is 'exact', 'fallback' or 'none'.

    Aliases are keys of the image map too, so an alias counts as an exact match.
    """
    if not keyword:
        return None, "none"
    kw = keyword.lower().strip()
    if kw in image_map:
        return kw, "exact"
    match = fuzzy_match(kw, image_map)
    return (match, "fallback") if match else (None, "none")

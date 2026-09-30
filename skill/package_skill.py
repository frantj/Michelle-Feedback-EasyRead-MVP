#!/usr/bin/env python3
"""Package the Easy Read skill for upload to Claude.

Copies the site's image map into the skill, packs the images it uses into
assets/images.json (a skill upload is limited to 200 files and may not contain
zip files), regenerates the
image catalog, and zips the skill folder to dist/easy-read.zip. The version
is read from SKILL.md for the release tag. The copied
assets are gitignored, so the site's folders stay the only source of truth.

Usage (from anywhere): python3 skill/package_skill.py
"""

import base64
import json
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SKILL_DIR = REPO / "skill" / "easy-read"
ASSETS_DIR = SKILL_DIR / "assets"
LIBRARY_DIR = REPO / "public" / "images" / "library"
DIST_DIR = REPO / "dist"
MAX_FILES = 200


def copy_assets():
    if ASSETS_DIR.exists():
        shutil.rmtree(ASSETS_DIR)
    ASSETS_DIR.mkdir()
    shutil.copy2(REPO / "data" / "image-map.json", ASSETS_DIR / "image-map.json")

    # Only the images the map uses; files it points to but that are missing are left
    # for build_catalog.py to report
    image_map = json.loads((ASSETS_DIR / "image-map.json").read_text(encoding="utf-8"))
    used = sorted({v["file"] for k, v in image_map.items()
                   if not k.startswith("_") and isinstance(v, dict) and v.get("file")})
    files = {}
    for name in used:
        path = LIBRARY_DIR / name
        if not path.is_file():
            continue
        if path.suffix.lower() == ".svg":
            files[name] = {"encoding": "text", "data": path.read_text(encoding="utf-8")}
        else:
            files[name] = {"encoding": "base64", "data": base64.b64encode(path.read_bytes()).decode("ascii")}
    with open(ASSETS_DIR / "images.json", "w", encoding="utf-8") as f:
        json.dump({"_note": "Packed by skill/package_skill.py. Do not read this file into the conversation; "
                            "scripts/extract_image.py extracts single images.", "files": files}, f)
    unused = len([f for f in LIBRARY_DIR.iterdir() if f.is_file()]) - len(used)
    print(f"Packed {len(files)} images into assets/images.json ({unused} unused library files left out)")


def build_catalog():
    result = subprocess.run([sys.executable, str(SKILL_DIR / "scripts" / "build_catalog.py")])
    if result.returncode != 0:
        sys.exit("Catalog build failed; fix the image map before packaging.")


def read_version():
    """The version in SKILL.md's frontmatter (metadata: version: "x.y.z")."""
    text = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
    m = re.search(r'^\s+version:\s*"?([0-9][^"\s]*)"?\s*$', text.split("\n---", 1)[0], re.MULTILINE)
    if not m:
        sys.exit('ERROR: no version in SKILL.md frontmatter (expected metadata: version: "x.y.z").')
    return m.group(1)


def make_zip(version):
    # Same name every version, so the README's releases/latest/download link keeps working
    zip_path = DIST_DIR / "easy-read.zip"
    DIST_DIR.mkdir(exist_ok=True)
    if zip_path.exists():
        zip_path.unlink()
    files = [p for p in sorted(SKILL_DIR.rglob("*"))
             if p.is_file() and p.name != ".DS_Store" and "__pycache__" not in p.parts]
    nested = [p.name for p in files if p.suffix.lower() == ".zip"]
    if nested:
        sys.exit(f"ERROR: Claude does not accept zip files inside a skill: {', '.join(nested)}")
    if len(files) > MAX_FILES:
        sys.exit(f"ERROR: the skill has {len(files)} files; Claude accepts at most {MAX_FILES}.")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in files:
            # Keep easy-read/ at the zip root
            zf.write(path, path.relative_to(SKILL_DIR.parent))
    size_mb = zip_path.stat().st_size / 1_000_000
    print(f"Wrote {zip_path.relative_to(REPO)} (version {version}, {len(files)} files, {size_mb:.1f} MB)")
    print(f'To release: gh release create easy-read-v{version} {zip_path.relative_to(REPO)} '
          f'--title "Easy Read skill {version}" --notes "<what changed>"')


if __name__ == "__main__":
    version = read_version()
    copy_assets()
    build_catalog()
    make_zip(version)

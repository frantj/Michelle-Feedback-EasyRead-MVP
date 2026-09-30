#!/usr/bin/env python3
"""Package the Easy Read skill for upload to Claude.

Copies the site's image map into the skill, packs the images it uses into
assets/images.zip (a skill upload is limited to 200 files), regenerates the
image catalog, and zips the skill folder to dist/easy-read.zip. The copied
assets are gitignored, so the site's folders stay the only source of truth.

Usage (from anywhere): python3 skill/package_skill.py
"""

import json
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SKILL_DIR = REPO / "skill" / "easy-read"
ASSETS_DIR = SKILL_DIR / "assets"
LIBRARY_DIR = REPO / "public" / "images" / "library"
ZIP_PATH = REPO / "dist" / "easy-read.zip"
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
    with zipfile.ZipFile(ASSETS_DIR / "images.zip", "w", zipfile.ZIP_DEFLATED) as zf:
        for name in used:
            if (LIBRARY_DIR / name).is_file():
                zf.write(LIBRARY_DIR / name, name)
    unused = len([f for f in LIBRARY_DIR.iterdir() if f.is_file()]) - len(used)
    print(f"Packed {len(used)} images into assets/images.zip ({unused} unused library files left out)")


def build_catalog():
    result = subprocess.run([sys.executable, str(SKILL_DIR / "scripts" / "build_catalog.py")])
    if result.returncode != 0:
        sys.exit("Catalog build failed; fix the image map before packaging.")


def make_zip():
    ZIP_PATH.parent.mkdir(exist_ok=True)
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    files = [p for p in sorted(SKILL_DIR.rglob("*"))
             if p.is_file() and p.name != ".DS_Store" and "__pycache__" not in p.parts]
    if len(files) > MAX_FILES:
        sys.exit(f"ERROR: the skill has {len(files)} files; Claude accepts at most {MAX_FILES}.")
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in files:
            # Keep easy-read/ at the zip root
            zf.write(path, path.relative_to(SKILL_DIR.parent))
    size_mb = ZIP_PATH.stat().st_size / 1_000_000
    print(f"Wrote {ZIP_PATH.relative_to(REPO)} ({len(files)} files, {size_mb:.1f} MB)")


if __name__ == "__main__":
    copy_assets()
    build_catalog()
    make_zip()

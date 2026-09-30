#!/usr/bin/env python3
"""Package the Easy Read skill for upload to Claude.

Copies the site's image library and image map into the skill, regenerates the
image catalog, and zips the skill folder to dist/easy-read.zip. The copied
assets are gitignored, so the site's folders stay the only source of truth.

Usage (from anywhere): python3 skill/package_skill.py
"""

import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SKILL_DIR = REPO / "skill" / "easy-read"
ASSETS_DIR = SKILL_DIR / "assets"
ZIP_PATH = REPO / "dist" / "easy-read.zip"


def copy_assets():
    if ASSETS_DIR.exists():
        shutil.rmtree(ASSETS_DIR)
    ASSETS_DIR.mkdir()
    shutil.copy2(REPO / "data" / "image-map.json", ASSETS_DIR / "image-map.json")
    shutil.copytree(REPO / "public" / "images" / "library", ASSETS_DIR / "images")


def build_catalog():
    result = subprocess.run([sys.executable, str(SKILL_DIR / "scripts" / "build_catalog.py")])
    if result.returncode != 0:
        sys.exit("Catalog build failed; fix the image map before packaging.")


def make_zip():
    ZIP_PATH.parent.mkdir(exist_ok=True)
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(SKILL_DIR.rglob("*")):
            if path.is_file() and path.name != ".DS_Store" and "__pycache__" not in path.parts:
                # Keep easy-read/ at the zip root
                zf.write(path, path.relative_to(SKILL_DIR.parent))
    size_mb = ZIP_PATH.stat().st_size / 1_000_000
    print(f"Wrote {ZIP_PATH.relative_to(REPO)} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    copy_assets()
    build_catalog()
    make_zip()

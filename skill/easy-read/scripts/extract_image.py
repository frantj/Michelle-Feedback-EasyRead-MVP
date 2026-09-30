#!/usr/bin/env python3
"""Save the image for a keyword (or a file name) from assets/images.json, to look at it.

Usage: python3 extract_image.py <keyword or file name> [output folder]

Prints the path of the saved file. The default output folder is
/tmp/easy-read-images.
"""

import sys
from pathlib import Path

from easy_read_common import load_image_map, open_images, resolve_keyword


def main():
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    wanted = sys.argv[1]
    out_dir = Path(sys.argv[2] if len(sys.argv) == 3 else "/tmp/easy-read-images")

    images = open_images()
    name = wanted if wanted in images.namelist() else None
    if name is None:
        image_map, _ = load_image_map()
        match, how = resolve_keyword(wanted, image_map)
        if how != "exact":
            sys.exit(f'ERROR: "{wanted}" is not a catalog keyword or image file name.')
        name = image_map[match]["file"]

    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / name
    out.write_bytes(images.read(name))
    print(out)


if __name__ == "__main__":
    main()

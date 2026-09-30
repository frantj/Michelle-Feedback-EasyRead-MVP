# License

## Skill code and instructions

`SKILL.md`, `references/` and `scripts/` are released under the MIT License, the same license as the
[Easy Read Generator repository](https://github.com/frantj/Michelle-Feedback-EasyRead-MVP) (see `LICENSE` in the repo root).

Copyright (c) 2026 Jesper Frant

## Images

The images packed in `assets/images.json` come from the sources below. Each is licensed under a Creative Commons
share-alike license. Each entry in `assets/image-map.json` gives its source in the `source` field.

| Source key | Name | License | URL |
| --- | --- | --- | --- |
| `mulberry` | Mulberry Symbols | CC BY-SA 2.0 UK | https://mulberrysymbols.org |
| `openmoji` | OpenMoji | CC BY-SA 4.0 | https://openmoji.org |
| `demcloud` | Easy Read Online Dictionary | CC BY-SA 4.0 | https://easyread.demcloud.org |

License texts:

- CC BY-SA 2.0 UK: https://creativecommons.org/licenses/by-sa/2.0/uk/
- CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/

### Adaptations

`scripts/build_document.py` converts SVG images to PNG when it builds a Word document, because Word does not
render SVG reliably. The PNG files are adaptations of the originals. They stay under the same license as their
source image. No other changes are made to the images.

### Attribution in generated documents

Every document built by this skill ends with an "Image credits" line. It names the sources of the images used
in that document and their licenses, as the share-alike licenses require.

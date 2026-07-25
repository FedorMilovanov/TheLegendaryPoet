#!/usr/bin/env python3
"""Rebuild platform icons from the approved cloaked WebP master.

The script is intentionally not part of normal npm build: public derivatives are
tracked in Git. Run it only for an intentional brand asset refresh with:

  python -m pip install pillow==11.3.0
  npm run brand:materialize
  python scripts/rebuild-approved-brand-platform-assets.py

The generated manifest is consumed by Node materialization/validation and keeps
all source/output hashes, formats and dimensions explicit.
"""

from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path
from typing import Final

from PIL import Image

ROOT: Final = Path(__file__).resolve().parents[1]
PUBLIC: Final = ROOT / "public"
SOURCE_DIR: Final = ROOT / "src" / "brand-assets"
MANIFEST_PATH: Final = SOURCE_DIR / "approved-brand-manifest.json"

SOURCE_SPECS: Final = [
    ("master-320-q92.webp.b64", "brand-emblem-master.webp", "image/webp", 320, 320),
    ("favicon-16.png.b64", "favicon-16.png", "image/png", 16, 16),
    ("favicon-32.png.b64", "favicon-32.png", "image/png", 32, 32),
]

OUTPUT_SPECS: Final = [
    ("brand-emblem-master.webp", "image/webp", 320, 320, "master-320-q92.webp.b64"),
    ("favicon-16.png", "image/png", 16, 16, "favicon-16.png.b64"),
    ("favicon-32.png", "image/png", 32, 32, "favicon-32.png.b64"),
    ("apple-touch-icon.png", "image/png", 180, 180, "brand-emblem-master.webp"),
    ("icon-192.png", "image/png", 192, 192, "brand-emblem-master.webp"),
    ("icon-512.png", "image/png", 512, 512, "brand-emblem-master.webp"),
    ("icon-maskable-512.png", "image/png", 512, 512, "brand-emblem-master.webp"),
    ("mstile-150x150.png", "image/png", 150, 150, "brand-emblem-master.webp"),
    ("og-image.jpg", "image/jpeg", 1200, 630, "approved-final-share-layout"),
]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def source_bytes(name: str) -> bytes:
    encoded = (SOURCE_DIR / name).read_text(encoding="ascii").replace("\n", "").replace("\r", "")
    decoded = base64.b64decode(encoded, validate=True)
    if base64.b64encode(decoded).decode("ascii") != encoded:
        raise RuntimeError(f"{name}: non-canonical Base64")
    return decoded


def save_png(image: Image.Image, name: str) -> None:
    image.save(PUBLIC / name, format="PNG", optimize=True, compress_level=9)
    with Image.open(PUBLIC / name) as check:
        check.load()


def rebuild() -> None:
    master_path = PUBLIC / "brand-emblem-master.webp"
    with Image.open(master_path) as image:
        image.load()
        master = image.convert("RGB")
    if master.size != (320, 320):
        raise RuntimeError(f"approved master must be 320x320, got {master.size}")

    for name, size in [
        ("apple-touch-icon.png", 180),
        ("icon-192.png", 192),
        ("icon-512.png", 512),
        ("mstile-150x150.png", 150),
    ]:
        save_png(master.resize((size, size), Image.Resampling.LANCZOS), name)

    maskable = Image.new("RGB", (512, 512), (1, 4, 9))
    inner = master.resize((384, 384), Image.Resampling.LANCZOS)
    maskable.paste(inner, (64, 64))
    save_png(maskable, "icon-maskable-512.png")


def inspect_image(path: Path, expected_width: int, expected_height: int) -> None:
    with Image.open(path) as image:
        image.load()
        if image.size != (expected_width, expected_height):
            raise RuntimeError(
                f"{path.name}: expected {expected_width}x{expected_height}, got {image.size[0]}x{image.size[1]}"
            )


def write_manifest() -> None:
    sources = []
    for source_name, output_name, mime, width, height in SOURCE_SPECS:
        data = source_bytes(source_name)
        output = PUBLIC / output_name
        inspect_image(output, width, height)
        if output.read_bytes() != data:
            raise RuntimeError(f"{source_name}: decoded bytes differ from {output_name}")
        sources.append(
            {
                "source": source_name,
                "output": output_name,
                "mime": mime,
                "width": width,
                "height": height,
                "bytes": len(data),
                "sha256": sha256(data),
            }
        )

    outputs = []
    for name, mime, width, height, derived_from in OUTPUT_SPECS:
        path = PUBLIC / name
        if not path.exists():
            raise RuntimeError(f"{name}: required output is missing")
        inspect_image(path, width, height)
        data = path.read_bytes()
        outputs.append(
            {
                "name": name,
                "mime": mime,
                "width": width,
                "height": height,
                "bytes": len(data),
                "sha256": sha256(data),
                "derivedFrom": derived_from,
            }
        )

    manifest = {
        "schemaVersion": 1,
        "brandVersion": "cloak-20260725-2",
        "generator": "scripts/rebuild-approved-brand-platform-assets.py@1",
        "pillow": "11.3.0",
        "sources": sources,
        "outputs": outputs,
    }
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


def main() -> None:
    rebuild()
    write_manifest()


if __name__ == "__main__":
    main()

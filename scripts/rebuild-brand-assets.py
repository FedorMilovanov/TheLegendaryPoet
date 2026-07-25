#!/usr/bin/env python3
"""Rebuild deterministic raster brand derivatives and the LPBRAND2 source archive.

Dependencies are intentionally pinned in docs/CI:
  cairosvg==2.8.2
  pillow==11.3.0
"""

from __future__ import annotations

import base64
import hashlib
import io
import json
import re
from pathlib import Path
from typing import Final

import cairosvg
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT: Final = Path(__file__).resolve().parents[1]
PUBLIC: Final = ROOT / "public"
SOURCE_DIR: Final = ROOT / "src" / "brand-assets"
PART_BYTES: Final = 48_000
SIGNATURE: Final = b"LPBRAND2\n"
GENERATOR: Final = "scripts/rebuild-brand-assets.py@2"

ASSET_SPECS: Final = [
    ("brand-emblem-master.webp", 512, 512, "image/webp"),
    ("favicon-16.png", 16, 16, "image/png"),
    ("favicon-32.png", 32, 32, "image/png"),
    ("apple-touch-icon.png", 180, 180, "image/png"),
    ("icon-192.png", 192, 192, "image/png"),
    ("icon-512.png", 512, 512, "image/png"),
    ("icon-maskable-512.png", 512, 512, "image/png"),
    ("mstile-150x150.png", 150, 150, "image/png"),
    ("og-image.jpg", 1200, 630, "image/jpeg"),
]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def vector_only_svg() -> bytes:
    source = (PUBLIC / "brand-emblem.svg").read_bytes()
    rendered = re.sub(rb"\s*<image\b[^>]*/>\s*", b"\n", source, flags=re.IGNORECASE)
    if rendered == source or b"brand-emblem-master.webp" in rendered:
        raise RuntimeError("brand vector source: raster overlay was not removed")
    return rendered


def render_svg(svg: bytes, width: int, height: int) -> Image.Image:
    png = cairosvg.svg2png(bytestring=svg, output_width=width, output_height=height)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def save_png(image: Image.Image, path: Path) -> None:
    image.save(path, format="PNG", optimize=True, compress_level=9)
    with Image.open(path) as check:
        check.verify()


def font(path: str, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    try:
        return ImageFont.truetype(path, size=size)
    except OSError:
        return ImageFont.load_default()


def build_assets() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    vector = vector_only_svg()
    favicon = (PUBLIC / "favicon.svg").read_bytes()

    master = render_svg(vector, 512, 512)
    master.save(PUBLIC / "brand-emblem-master.webp", format="WEBP", lossless=True, method=6)

    for name, size in [
        ("favicon-16.png", 16),
        ("favicon-32.png", 32),
        ("apple-touch-icon.png", 180),
        ("icon-192.png", 192),
        ("icon-512.png", 512),
        ("mstile-150x150.png", 150),
    ]:
        save_png(render_svg(favicon, size, size), PUBLIC / name)

    maskable = Image.new("RGBA", (512, 512), "#02050b")
    atmosphere = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    glow = ImageDraw.Draw(atmosphere)
    glow.ellipse((82, 68, 430, 430), fill=(46, 216, 255, 58))
    atmosphere = atmosphere.filter(ImageFilter.GaussianBlur(54))
    maskable.alpha_composite(atmosphere)
    emblem = render_svg(vector, 336, 336)
    maskable.alpha_composite(emblem, ((512 - 336) // 2, (512 - 336) // 2))
    save_png(maskable, PUBLIC / "icon-maskable-512.png")

    width, height = 1200, 630
    og = Image.new("RGB", (width, height), "#02050b")
    pixels = og.load()
    top, bottom = (2, 5, 11), (5, 20, 33)
    for y in range(height):
        amount = y / (height - 1)
        row = tuple(round(top[index] * (1 - amount) + bottom[index] * amount) for index in range(3))
        for x in range(width):
            pixels[x, y] = row

    fog = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    fog_draw = ImageDraw.Draw(fog)
    fog_draw.ellipse((-130, 20, 650, 760), fill=(35, 199, 255, 64))
    fog_draw.ellipse((700, -220, 1350, 460), fill=(44, 104, 255, 34))
    fog = fog.filter(ImageFilter.GaussianBlur(102))
    og_rgba = Image.alpha_composite(og.convert("RGBA"), fog)

    emblem_large = render_svg(vector, 408, 408)
    aura = Image.new("RGBA", (500, 500), (0, 0, 0, 0))
    aura.alpha_composite(emblem_large, (46, 46))
    aura = aura.filter(ImageFilter.GaussianBlur(30))
    aura.putalpha(aura.getchannel("A").point(lambda value: min(118, value)))
    og_rgba.alpha_composite(aura, (24, 62))
    og_rgba.alpha_composite(emblem_large, (70, 108))

    draw = ImageDraw.Draw(og_rgba)
    serif = font("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 62)
    sans = font("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    sans_bold = font("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    text_x = 515
    draw.text((text_x, 177), "THE LEGENDARY", font=serif, fill=(230, 252, 255, 255))
    draw.text(
        (text_x, 248),
        "POET",
        font=serif,
        fill=(105, 224, 255, 255),
        stroke_width=1,
        stroke_fill=(34, 103, 180, 255),
    )
    draw.rounded_rectangle((text_x, 344, text_x + 132, 347), radius=2, fill=(212, 175, 55, 220))
    draw.text((text_x, 377), "ПОЭЗИЯ • АНАЛИЗ • ИСТОРИЯ", font=sans_bold, fill=(165, 226, 238, 225))
    draw.text((text_x, 430), "Великие тексты, судьбы и духовные поиски", font=sans, fill=(185, 214, 224, 190))
    draw.text((text_x, 469), "русских поэтов — бережно и без мифологизации.", font=sans, fill=(185, 214, 224, 190))
    draw.rounded_rectangle((36, 28, width - 36, height - 28), radius=28, outline=(72, 199, 230, 58), width=2)
    og_rgba.convert("RGB").save(
        PUBLIC / "og-image.jpg",
        format="JPEG",
        quality=93,
        optimize=True,
        progressive=False,
        subsampling=0,
    )


def image_dimensions(path: Path) -> tuple[int, int]:
    with Image.open(path) as image:
        return image.size


def build_archive() -> tuple[bytes, list[dict[str, object]]]:
    entries: list[dict[str, object]] = []
    archive = bytearray(SIGNATURE)
    archive.extend(f"{len(ASSET_SPECS)}\n".encode())

    for name, expected_width, expected_height, mime in ASSET_SPECS:
        path = PUBLIC / name
        data = path.read_bytes()
        width, height = image_dimensions(path)
        if (width, height) != (expected_width, expected_height):
            raise RuntimeError(f"{name}: expected {expected_width}x{expected_height}, got {width}x{height}")
        archive.extend(f"{name}\n{len(data)}\n".encode())
        archive.extend(data)
        entries.append(
            {
                "name": name,
                "size": len(data),
                "sha256": sha256(data),
                "width": width,
                "height": height,
                "mime": mime,
            }
        )
    return bytes(archive), entries


def write_parts(archive: bytes) -> list[dict[str, object]]:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    for previous in SOURCE_DIR.glob("assets.part*.b64"):
        previous.unlink()

    part_records: list[dict[str, object]] = []
    for index, start in enumerate(range(0, len(archive), PART_BYTES), start=1):
        chunk = archive[start : start + PART_BYTES]
        encoded = base64.b64encode(chunk).decode("ascii")
        name = f"assets.part{index:02d}.b64"
        (SOURCE_DIR / name).write_text(encoded + "\n", encoding="ascii")
        part_records.append(
            {
                "name": name,
                "encodedLength": len(encoded),
                "decodedBytes": len(chunk),
                "sha256": sha256(chunk),
            }
        )
    return part_records


def main() -> None:
    build_assets()
    archive, entries = build_archive()
    parts = write_parts(archive)
    manifest = {
        "schemaVersion": 2,
        "signature": "LPBRAND2",
        "generator": GENERATOR,
        "source": {
            "path": "public/brand-emblem.svg",
            "sha256": sha256((PUBLIC / "brand-emblem.svg").read_bytes()),
        },
        "archive": {
            "byteLength": len(archive),
            "sha256": sha256(archive),
            "parts": parts,
        },
        "entries": entries,
    }
    (SOURCE_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

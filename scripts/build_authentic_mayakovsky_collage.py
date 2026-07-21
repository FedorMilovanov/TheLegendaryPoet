#!/usr/bin/env python3
"""Download verified archival photographs and build a non-generative collage.

All pixels in the photographs come from the original files returned by the
Wikimedia Commons API. Pillow is used only for grayscale conversion, cropping,
resizing, borders, shadows, rotation and final compositing.
"""

from __future__ import annotations

import csv
import hashlib
import html
import io
import json
import math
import random
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "TheLegendaryPoetArchiveCollage/1.0 (historical editorial project; GitHub Actions)"
OUTPUT_DIR = Path("build/archive-collage")
DOWNLOAD_DIR = OUTPUT_DIR / "originals"

FILES = [
    "Mayakovsky 1910.jpg",
    "Mayakovsky 1912.jpg",
    "Vladimir Mayakovsky 1914.jpg",
    "Mayakovsky 1915.jpg",
    "Mayakovsky 1917 a.jpg",
    "Mayakovsky 1918.jpg",
    "Mayakovsky 1925.jpg",
    "Mayakovsky 1928 by Osip Brik.jpg",
    "Mayakovsky 1930 a.jpg",
    "Mayakovsky and Futurists.jpg",
    "Mayakovsky and Moreno by Modotti 1925.jpg",
    "Mayakovsky Brik Crimea 1926.jpg",
    "Mayakovsky Pasternak.jpg",
    "Mayakovsky with dog Pushkino 1925.jpg",
    "1926. Владимир Маяковский с Булькой.jpg",
    "1927. Владимир Маяковский бреется.jpg",
    "Маяковский и Чуковский.jpg",
    "Владимир Маяковский и Леонид Кузьмин 1912 год (Vladimir Myakovsky and Leonid Kuzmin 1912).jpg",
    "Lilya Brik in 1906.jpg",
    "Lilya Brik in 1914.jpg",
    "Lilya Brik in Moscow, 1915-1916.jpg",
    "Lilya Brik with friends, 1915.jpg",
    "Lilya Brik with her mother and sister Elsa.jpg",
    "Lilya Brik 1929.jpg",
    "LilyaBrik FotoOsipBrik.jpg",
    "Vladimir Mayakovsky & Lilya Brik 1918. Retouched.jpg",
    "1928 LYuB editing film.jpg",
    "Osip Brik.jpg",
    "Osip LUB.jpg",
    "Maiakowski 1925.jpg",
]


@dataclass
class ArchiveImage:
    filename: str
    page_url: str
    original_url: str
    description: str
    date: str
    author: str
    license_name: str
    license_url: str
    sha256: str
    width: int
    height: int
    local_path: Path


def clean_html(value: Any) -> str:
    if not value:
        return ""
    if isinstance(value, dict):
        value = value.get("value", "")
    text = html.unescape(str(value))
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def meta_value(metadata: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = clean_html(metadata.get(key))
        if value:
            return value
    return ""


def api_metadata(session: requests.Session, filename: str) -> dict[str, Any]:
    params = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "prop": "imageinfo",
        "iiprop": "url|size|mime|sha1|extmetadata",
        "titles": f"File:{filename}",
    }
    response = session.get(API, params=params, timeout=45)
    response.raise_for_status()
    payload = response.json()
    page = payload["query"]["pages"][0]
    if page.get("missing"):
        raise RuntimeError(f"Commons file not found: {filename}")
    info = page["imageinfo"][0]
    info["canonicaltitle"] = page.get("title", f"File:{filename}")
    return info


def download_verified(session: requests.Session, filename: str, index: int) -> ArchiveImage:
    info = api_metadata(session, filename)
    metadata = info.get("extmetadata", {})
    original_url = info["url"]
    mime = info.get("mime", "")
    if not mime.startswith("image/"):
        raise RuntimeError(f"Not an image: {filename} ({mime})")

    response = session.get(original_url, timeout=90)
    response.raise_for_status()
    content_type = response.headers.get("content-type", "")
    if not content_type.startswith("image/"):
        raise RuntimeError(f"Unexpected response for {filename}: {content_type}")
    raw = response.content
    digest = hashlib.sha256(raw).hexdigest()

    suffix = Path(filename).suffix.lower() or ".jpg"
    local_path = DOWNLOAD_DIR / f"{index:02d}-{digest[:10]}{suffix}"
    local_path.write_bytes(raw)

    with Image.open(io.BytesIO(raw)) as probe:
        width, height = probe.size
        probe.verify()

    title = info["canonicaltitle"].removeprefix("File:")
    page_url = "https://commons.wikimedia.org/wiki/File:" + quote(title.replace(" ", "_"), safe="_().,-")
    description = meta_value(metadata, "ImageDescription", "ObjectName") or title
    date = meta_value(metadata, "DateTimeOriginal", "DateTime", "Date")
    author = meta_value(metadata, "Artist", "Credit") or "Unknown / see Commons file page"
    license_name = meta_value(metadata, "LicenseShortName", "UsageTerms") or "See Commons file page"
    license_url = meta_value(metadata, "LicenseUrl")

    return ArchiveImage(
        filename=title,
        page_url=page_url,
        original_url=original_url,
        description=description,
        date=date,
        author=author,
        license_name=license_name,
        license_url=license_url,
        sha256=digest,
        width=width,
        height=height,
        local_path=local_path,
    )


def load_font(size: int) -> ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            pass
    return ImageFont.load_default()


def fit_crop(image: Image.Image, size: tuple[int, int], focus_top: bool = False) -> Image.Image:
    image = ImageOps.exif_transpose(image).convert("L")
    # Preserve archival tonality while making mixed scans visually coherent.
    image = ImageOps.autocontrast(image, cutoff=0.6)
    image = ImageEnhance.Contrast(image).enhance(1.04)
    target_w, target_h = size
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.LANCZOS,
    )
    left = max(0, (resized.width - target_w) // 2)
    if focus_top:
        top = max(0, round((resized.height - target_h) * 0.28))
    else:
        top = max(0, (resized.height - target_h) // 2)
    return resized.crop((left, top, left + target_w, top + target_h))


def photo_card(item: ArchiveImage, size: tuple[int, int], number: int) -> Image.Image:
    border = 22
    caption_h = 54
    with Image.open(item.local_path) as source:
        portraitish = source.height > source.width * 1.13
        photo = fit_crop(source, size, focus_top=portraitish)

    card = Image.new("L", (size[0] + border * 2, size[1] + border * 2 + caption_h), 239)
    card.paste(photo, (border, border))
    draw = ImageDraw.Draw(card)
    font = load_font(23)
    date = item.date or "date: see manifest"
    label = f"{number:02d}  {date[:35]}"
    draw.text((border, border + size[1] + 12), label, fill=35, font=font)
    return card.convert("RGB")


def build_collage(items: list[ArchiveImage], output_path: Path) -> None:
    if len(items) < 20:
        raise RuntimeError(f"Only {len(items)} verified images available; expected at least 20")

    canvas_w, canvas_h = 6000, 3600
    background = Image.new("RGB", (canvas_w, canvas_h), (24, 23, 21))
    paper = Image.new("RGB", (canvas_w - 120, canvas_h - 120), (63, 59, 53))
    paper = paper.filter(ImageFilter.GaussianBlur(0.4))
    background.paste(paper, (60, 60))

    rng = random.Random(1928)
    cols, rows = 6, 5
    cell_w = (canvas_w - 300) // cols
    cell_h = (canvas_h - 280) // rows
    photo_size = (cell_w - 72, cell_h - 112)

    # Place all 30 unique verified files once. No duplicated photographs.
    for idx, item in enumerate(items[: cols * rows]):
        row, col = divmod(idx, cols)
        card = photo_card(item, photo_size, idx + 1)
        angle = rng.uniform(-2.2, 2.2)
        rotated = card.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True, fillcolor=(239, 239, 239))

        shadow = Image.new("RGBA", rotated.size, (0, 0, 0, 0))
        shadow_alpha = Image.new("L", rotated.size, 0)
        ImageDraw.Draw(shadow_alpha).rounded_rectangle(
            (12, 12, rotated.width - 4, rotated.height - 4), radius=8, fill=150
        )
        shadow_alpha = shadow_alpha.filter(ImageFilter.GaussianBlur(18))
        shadow.putalpha(shadow_alpha)

        x = 105 + col * cell_w + rng.randint(-16, 16)
        y = 90 + row * cell_h + rng.randint(-13, 13)
        background.paste(shadow, (x + 18, y + 22), shadow)
        background.paste(rotated, (x, y))

    background.save(output_path, format="PNG", optimize=True)


def build_contact_sheet(items: list[ArchiveImage], output_path: Path) -> None:
    thumb_w, thumb_h = 440, 330
    cols = 5
    rows = math.ceil(len(items) / cols)
    margin = 30
    canvas = Image.new("RGB", (cols * thumb_w + (cols + 1) * margin, rows * (thumb_h + 72) + (rows + 1) * margin), "white")
    draw = ImageDraw.Draw(canvas)
    font = load_font(20)
    for idx, item in enumerate(items):
        row, col = divmod(idx, cols)
        x = margin + col * (thumb_w + margin)
        y = margin + row * (thumb_h + 72 + margin)
        with Image.open(item.local_path) as source:
            thumb = fit_crop(source, (thumb_w, thumb_h), focus_top=source.height > source.width * 1.13).convert("RGB")
        canvas.paste(thumb, (x, y))
        draw.text((x, y + thumb_h + 8), f"{idx + 1:02d}. {item.filename[:43]}", fill="black", font=font)
        draw.text((x, y + thumb_h + 35), (item.date or "date in manifest")[:43], fill=(70, 70, 70), font=font)
    canvas.save(output_path, format="PNG", optimize=True)


def write_manifest(items: list[ArchiveImage], csv_path: Path, json_path: Path) -> None:
    fieldnames = [
        "number", "filename", "description", "date", "author", "license", "license_url",
        "commons_page", "original_file", "sha256", "width", "height",
    ]
    with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for number, item in enumerate(items, 1):
            writer.writerow({
                "number": number,
                "filename": item.filename,
                "description": item.description,
                "date": item.date,
                "author": item.author,
                "license": item.license_name,
                "license_url": item.license_url,
                "commons_page": item.page_url,
                "original_file": item.original_url,
                "sha256": item.sha256,
                "width": item.width,
                "height": item.height,
            })
    json_path.write_text(json.dumps([item.__dict__ | {"local_path": str(item.local_path)} for item in items], ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    verified: list[ArchiveImage] = []
    seen_hashes: set[str] = set()
    failures: list[str] = []
    for index, filename in enumerate(FILES, 1):
        try:
            item = download_verified(session, filename, index)
            if item.sha256 in seen_hashes:
                failures.append(f"duplicate bytes skipped: {filename}")
                continue
            seen_hashes.add(item.sha256)
            verified.append(item)
            print(f"[{len(verified):02d}] verified {item.filename} — {item.date or 'date missing'}")
            time.sleep(0.15)
        except Exception as exc:  # keep a full audit trail while allowing isolated Commons issues
            failures.append(f"{filename}: {exc}")
            print(f"WARNING: {filename}: {exc}", file=sys.stderr)

    (OUTPUT_DIR / "download-audit.txt").write_text("\n".join(failures) + "\n", encoding="utf-8")
    if len(verified) < 20:
        raise RuntimeError(f"Verification failed: only {len(verified)} unique originals downloaded. {failures}")

    # We target 30; if Commons has an isolated outage the collage still remains 20+ genuine images.
    verified = verified[:30]
    build_collage(verified, OUTPUT_DIR / "mayakovsky-brik-authentic-archive-collage.png")
    build_contact_sheet(verified, OUTPUT_DIR / "mayakovsky-brik-authentic-contact-sheet.png")
    write_manifest(
        verified,
        OUTPUT_DIR / "mayakovsky-brik-authentic-manifest.csv",
        OUTPUT_DIR / "mayakovsky-brik-authentic-manifest.json",
    )
    print(f"Built collage from {len(verified)} unique original archival files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Build a collage from verified, non-generated archival photographs.

The script downloads original files returned by the Wikimedia Commons API,
records their metadata and hashes, and uses Pillow only for grayscale conversion,
cropping, sizing, borders, shadows and compositing.
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
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "TheLegendaryPoetArchiveCollage/1.1 (historical editorial project; contact via GitHub repository)"
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


def normalized_title(value: str) -> str:
    return value.removeprefix("File:").replace("_", " ").strip().casefold()


def request_with_backoff(
    session: requests.Session,
    method: str,
    url: str,
    *,
    timeout: int,
    params: dict[str, Any] | None = None,
    data: dict[str, Any] | None = None,
    attempts: int = 9,
) -> requests.Response:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            response = session.request(method, url, params=params, data=data, timeout=timeout)
            if response.status_code not in {429, 500, 502, 503, 504}:
                response.raise_for_status()
                return response
            retry_header = response.headers.get("retry-after", "")
            try:
                retry_after = float(retry_header)
            except ValueError:
                retry_after = 0
            delay = max(retry_after, min(75.0, 4.0 * (2**attempt)))
            print(
                f"rate limit/server response {response.status_code}; waiting {delay:.1f}s before retry {attempt + 2}/{attempts}",
                file=sys.stderr,
            )
            time.sleep(delay)
        except requests.RequestException as exc:
            last_error = exc
            if attempt == attempts - 1:
                raise
            delay = min(60.0, 3.0 * (2**attempt))
            print(f"request error {exc}; waiting {delay:.1f}s", file=sys.stderr)
            time.sleep(delay)
    if last_error:
        raise last_error
    raise RuntimeError(f"Unable to fetch {url}")


def fetch_all_metadata(session: requests.Session, filenames: list[str]) -> dict[str, dict[str, Any]]:
    params = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "maxlag": "5",
        "prop": "imageinfo",
        "iiprop": "url|size|mime|sha1|extmetadata",
        "titles": "|".join(f"File:{name}" for name in filenames),
    }
    # One POST request prevents the API request burst that can trigger 429s.
    response = request_with_backoff(session, "POST", API, data=params, timeout=90)
    payload = response.json()
    result: dict[str, dict[str, Any]] = {}
    for page in payload.get("query", {}).get("pages", []):
        if page.get("missing") or not page.get("imageinfo"):
            continue
        info = page["imageinfo"][0]
        info["canonicaltitle"] = page.get("title", "")
        result[normalized_title(page.get("title", ""))] = info
    return result


def download_verified(
    session: requests.Session,
    filename: str,
    index: int,
    info: dict[str, Any],
) -> ArchiveImage:
    metadata = info.get("extmetadata", {})
    original_url = info["url"]
    mime = info.get("mime", "")
    if not mime.startswith("image/"):
        raise RuntimeError(f"Not an image: {filename} ({mime})")

    response = request_with_backoff(session, "GET", original_url, timeout=120)
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
    page_url = "https://commons.wikimedia.org/wiki/File:" + quote(
        title.replace(" ", "_"), safe="_().,-"
    )
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
    for candidate in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ):
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            pass
    return ImageFont.load_default()


def fit_crop(image: Image.Image, size: tuple[int, int], focus_top: bool = False) -> Image.Image:
    image = ImageOps.exif_transpose(image).convert("L")
    image = ImageOps.autocontrast(image, cutoff=0.6)
    image = ImageEnhance.Contrast(image).enhance(1.04)
    target_w, target_h = size
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.LANCZOS,
    )
    left = max(0, (resized.width - target_w) // 2)
    top_factor = 0.28 if focus_top else 0.5
    top = max(0, round((resized.height - target_h) * top_factor))
    return resized.crop((left, top, left + target_w, top + target_h))


def photo_card(item: ArchiveImage, size: tuple[int, int], number: int) -> Image.Image:
    border = 22
    caption_h = 54
    with Image.open(item.local_path) as source:
        photo = fit_crop(source, size, focus_top=source.height > source.width * 1.13)
    card = Image.new("L", (size[0] + border * 2, size[1] + border * 2 + caption_h), 239)
    card.paste(photo, (border, border))
    draw = ImageDraw.Draw(card)
    label = f"{number:02d}  {(item.date or 'date: see manifest')[:35]}"
    draw.text((border, border + size[1] + 12), label, fill=35, font=load_font(23))
    return card.convert("RGB")


def build_collage(items: list[ArchiveImage], output_path: Path) -> None:
    if len(items) < 20:
        raise RuntimeError(f"Only {len(items)} verified images available; expected at least 20")
    canvas_w, canvas_h = 6000, 3600
    background = Image.new("RGB", (canvas_w, canvas_h), (24, 23, 21))
    background.paste(Image.new("RGB", (canvas_w - 120, canvas_h - 120), (63, 59, 53)), (60, 60))

    rng = random.Random(1928)
    cols, rows = 6, 5
    cell_w = (canvas_w - 300) // cols
    cell_h = (canvas_h - 280) // rows
    photo_size = (cell_w - 72, cell_h - 112)

    for idx, item in enumerate(items[: cols * rows]):
        row, col = divmod(idx, cols)
        card = photo_card(item, photo_size, idx + 1)
        rotated = card.rotate(
            rng.uniform(-2.2, 2.2),
            resample=Image.Resampling.BICUBIC,
            expand=True,
            fillcolor=(239, 239, 239),
        )
        shadow = Image.new("RGBA", rotated.size, (0, 0, 0, 0))
        alpha = Image.new("L", rotated.size, 0)
        ImageDraw.Draw(alpha).rounded_rectangle((12, 12, rotated.width - 4, rotated.height - 4), radius=8, fill=150)
        shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(18)))
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
    canvas = Image.new(
        "RGB",
        (cols * thumb_w + (cols + 1) * margin, rows * (thumb_h + 72) + (rows + 1) * margin),
        "white",
    )
    draw = ImageDraw.Draw(canvas)
    font = load_font(20)
    for idx, item in enumerate(items):
        row, col = divmod(idx, cols)
        x = margin + col * (thumb_w + margin)
        y = margin + row * (thumb_h + 72 + margin)
        with Image.open(item.local_path) as source:
            thumb = fit_crop(source, (thumb_w, thumb_h), source.height > source.width * 1.13).convert("RGB")
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
    serializable = []
    for item in items:
        row = asdict(item)
        row["local_path"] = str(row["local_path"])
        serializable.append(row)
    json_path.write_text(json.dumps(serializable, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({
        "User-Agent": USER_AGENT,
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    })

    metadata_by_title = fetch_all_metadata(session, FILES)
    verified: list[ArchiveImage] = []
    seen_hashes: set[str] = set()
    failures: list[str] = []
    for index, filename in enumerate(FILES, 1):
        try:
            info = metadata_by_title.get(normalized_title(filename))
            if not info:
                raise RuntimeError("metadata missing from Commons batch response")
            item = download_verified(session, filename, index, info)
            if item.sha256 in seen_hashes:
                failures.append(f"duplicate bytes skipped: {filename}")
                continue
            seen_hashes.add(item.sha256)
            verified.append(item)
            print(f"[{len(verified):02d}] verified {item.filename} — {item.date or 'date missing'}")
            # Shared Wikimedia infrastructure is rate limited; deliberately stay gentle.
            time.sleep(2.4)
        except Exception as exc:
            failures.append(f"{filename}: {exc}")
            print(f"WARNING: {filename}: {exc}", file=sys.stderr)

    (OUTPUT_DIR / "download-audit.txt").write_text("\n".join(failures) + "\n", encoding="utf-8")
    if len(verified) < 20:
        raise RuntimeError(f"Verification failed: only {len(verified)} unique originals downloaded")

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

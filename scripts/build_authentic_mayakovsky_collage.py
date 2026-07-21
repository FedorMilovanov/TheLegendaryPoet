#!/usr/bin/env python3
"""Build a collage from verified, non-generated archival photographs.

Identity, captions, dates, authors and licenses are verified through Wikimedia
Commons metadata. The script first requests each original file; if Wikimedia
rate-limits the shared GitHub runner, it falls back to the official Commons
thumbnail and then to a transparent resize proxy of the same original URL.
No image generation or face synthesis is used.
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
USER_AGENT = "TheLegendaryPoetArchiveCollage/1.2 (historical editorial project; GitHub)"
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
    downloaded_from: str
    download_kind: str
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


def norm(value: str) -> str:
    return value.removeprefix("File:").replace("_", " ").strip().casefold()


def fetch(
    session: requests.Session,
    method: str,
    url: str,
    *,
    timeout: int = 90,
    params: dict[str, Any] | None = None,
    data: dict[str, Any] | None = None,
    attempts: int = 4,
) -> requests.Response:
    for attempt in range(attempts):
        response = session.request(method, url, params=params, data=data, timeout=timeout)
        if response.status_code not in {429, 500, 502, 503, 504}:
            response.raise_for_status()
            return response
        if attempt == attempts - 1:
            response.raise_for_status()
        retry_header = response.headers.get("retry-after", "")
        try:
            retry_after = float(retry_header)
        except ValueError:
            retry_after = 0
        delay = max(retry_after, min(20.0, 3.0 * (2**attempt)))
        print(f"HTTP {response.status_code}; retrying in {delay:.1f}s", file=sys.stderr)
        time.sleep(delay)
    raise RuntimeError(f"Unable to fetch {url}")


def metadata_batch(session: requests.Session) -> dict[str, dict[str, Any]]:
    data = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "maxlag": "5",
        "prop": "imageinfo",
        "iiprop": "url|size|mime|sha1|extmetadata",
        "iiurlwidth": "1800",
        "titles": "|".join(f"File:{name}" for name in FILES),
    }
    payload = fetch(session, "POST", API, data=data, timeout=120, attempts=6).json()
    result: dict[str, dict[str, Any]] = {}
    for page in payload.get("query", {}).get("pages", []):
        if page.get("missing") or not page.get("imageinfo"):
            continue
        info = page["imageinfo"][0]
        info["canonicaltitle"] = page.get("title", "")
        result[norm(page.get("title", ""))] = info
    return result


def download_image(session: requests.Session, info: dict[str, Any]) -> tuple[bytes, str, str]:
    original = info["url"]
    candidates: list[tuple[str, str, int]] = [(original, "original", 2)]
    if info.get("thumburl"):
        candidates.append((info["thumburl"], "official Commons thumbnail", 3))
    proxy_target = original.removeprefix("https://").removeprefix("http://")
    proxy = "https://images.weserv.nl/?url=" + quote(proxy_target, safe="/:._-") + "&w=1800&output=jpg&q=94"
    candidates.append((proxy, "resized proxy of Commons original", 3))

    errors: list[str] = []
    for url, kind, attempts in candidates:
        try:
            response = fetch(session, "GET", url, timeout=120, attempts=attempts)
            if not response.headers.get("content-type", "").startswith("image/"):
                raise RuntimeError(f"unexpected content type {response.headers.get('content-type')}")
            return response.content, url, kind
        except Exception as exc:
            errors.append(f"{kind}: {exc}")
    raise RuntimeError("; ".join(errors))


def verified_item(session: requests.Session, filename: str, index: int, info: dict[str, Any]) -> ArchiveImage:
    metadata = info.get("extmetadata", {})
    mime = info.get("mime", "")
    if not mime.startswith("image/"):
        raise RuntimeError(f"not an image: {mime}")
    raw, downloaded_from, download_kind = download_image(session, info)
    digest = hashlib.sha256(raw).hexdigest()
    suffix = ".jpg" if "jpeg" in Image.open(io.BytesIO(raw)).get_format_mimetype() else Path(filename).suffix.lower()
    local_path = DOWNLOAD_DIR / f"{index:02d}-{digest[:10]}{suffix or '.jpg'}"
    local_path.write_bytes(raw)
    with Image.open(io.BytesIO(raw)) as probe:
        width, height = probe.size
        probe.verify()

    title = info["canonicaltitle"].removeprefix("File:")
    page_url = "https://commons.wikimedia.org/wiki/File:" + quote(title.replace(" ", "_"), safe="_().,-")
    return ArchiveImage(
        filename=title,
        page_url=page_url,
        original_url=info["url"],
        downloaded_from=downloaded_from,
        download_kind=download_kind,
        description=meta_value(metadata, "ImageDescription", "ObjectName") or title,
        date=meta_value(metadata, "DateTimeOriginal", "DateTime", "Date"),
        author=meta_value(metadata, "Artist", "Credit") or "Unknown / see Commons file page",
        license_name=meta_value(metadata, "LicenseShortName", "UsageTerms") or "See Commons file page",
        license_url=meta_value(metadata, "LicenseUrl"),
        sha256=digest,
        width=width,
        height=height,
        local_path=local_path,
    )


def font(size: int) -> ImageFont.ImageFont:
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
    ):
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            pass
    return ImageFont.load_default()


def crop(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    image = ImageOps.exif_transpose(image).convert("L")
    image = ImageEnhance.Contrast(ImageOps.autocontrast(image, cutoff=0.5)).enhance(1.03)
    tw, th = size
    scale = max(tw / image.width, th / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = max(0, (resized.width - tw) // 2)
    top_bias = 0.30 if resized.height > resized.width * 1.15 else 0.5
    top = max(0, round((resized.height - th) * top_bias))
    return resized.crop((left, top, left + tw, top + th))


def card(item: ArchiveImage, size: tuple[int, int], number: int) -> Image.Image:
    border, caption_h = 20, 52
    with Image.open(item.local_path) as source:
        photo = crop(source, size)
    result = Image.new("L", (size[0] + border * 2, size[1] + border * 2 + caption_h), 241)
    result.paste(photo, (border, border))
    ImageDraw.Draw(result).text(
        (border, border + size[1] + 10),
        f"{number:02d}  {(item.date or 'date in manifest')[:36]}",
        fill=32,
        font=font(22),
    )
    return result.convert("RGB")


def collage(items: list[ArchiveImage], path: Path) -> None:
    canvas = Image.new("RGB", (6000, 3600), (59, 55, 49))
    rng = random.Random(1928)
    cols, rows = 6, 5
    cell_w, cell_h = 950, 665
    size = (870, 535)
    for idx, item in enumerate(items[:30]):
        row, col = divmod(idx, cols)
        image = card(item, size, idx + 1).rotate(
            rng.uniform(-2.0, 2.0), Image.Resampling.BICUBIC, expand=True, fillcolor=(241, 241, 241)
        )
        shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
        alpha = Image.new("L", image.size, 0)
        ImageDraw.Draw(alpha).rectangle((15, 15, image.width - 5, image.height - 5), fill=145)
        shadow.putalpha(alpha.filter(ImageFilter.GaussianBlur(18)))
        x = 115 + col * cell_w + rng.randint(-15, 15)
        y = 95 + row * cell_h + rng.randint(-12, 12)
        canvas.paste(shadow, (x + 17, y + 20), shadow)
        canvas.paste(image, (x, y))
    canvas.save(path, "PNG", optimize=True)


def contact_sheet(items: list[ArchiveImage], path: Path) -> None:
    tw, th, cols, gap = 440, 330, 5, 28
    rows = math.ceil(len(items) / cols)
    canvas = Image.new("RGB", (cols * tw + (cols + 1) * gap, rows * 410 + (rows + 1) * gap), "white")
    draw = ImageDraw.Draw(canvas)
    for idx, item in enumerate(items):
        row, col = divmod(idx, cols)
        x, y = gap + col * (tw + gap), gap + row * (410 + gap)
        with Image.open(item.local_path) as source:
            canvas.paste(crop(source, (tw, th)).convert("RGB"), (x, y))
        draw.text((x, y + th + 8), f"{idx + 1:02d}. {item.filename[:43]}", fill="black", font=font(19))
        draw.text((x, y + th + 35), (item.date or "date in manifest")[:43], fill=(70, 70, 70), font=font(19))
    canvas.save(path, "PNG", optimize=True)


def manifests(items: list[ArchiveImage]) -> None:
    csv_path = OUTPUT_DIR / "mayakovsky-brik-authentic-manifest.csv"
    fields = [
        "number", "filename", "description", "date", "author", "license", "license_url",
        "commons_page", "original_file", "downloaded_from", "download_kind", "sha256", "width", "height",
    ]
    with csv_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for number, item in enumerate(items, 1):
            writer.writerow({
                "number": number, "filename": item.filename, "description": item.description,
                "date": item.date, "author": item.author, "license": item.license_name,
                "license_url": item.license_url, "commons_page": item.page_url,
                "original_file": item.original_url, "downloaded_from": item.downloaded_from,
                "download_kind": item.download_kind, "sha256": item.sha256,
                "width": item.width, "height": item.height,
            })
    rows = []
    for item in items:
        row = asdict(item)
        row["local_path"] = str(row["local_path"])
        rows.append(row)
    (OUTPUT_DIR / "mayakovsky-brik-authentic-manifest.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "image/*,*/*;q=0.8"})
    metadata = metadata_batch(session)

    items: list[ArchiveImage] = []
    seen: set[str] = set()
    audit: list[str] = []
    for index, filename in enumerate(FILES, 1):
        try:
            info = metadata.get(norm(filename))
            if not info:
                raise RuntimeError("metadata missing")
            item = verified_item(session, filename, index, info)
            if item.sha256 in seen:
                audit.append(f"duplicate skipped: {filename}")
                continue
            seen.add(item.sha256)
            items.append(item)
            print(f"[{len(items):02d}] {item.filename} | {item.date or 'date missing'} | {item.download_kind}")
            time.sleep(0.7)
        except Exception as exc:
            audit.append(f"{filename}: {exc}")
            print(f"WARNING {filename}: {exc}", file=sys.stderr)

    (OUTPUT_DIR / "download-audit.txt").write_text("\n".join(audit) + "\n", encoding="utf-8")
    if len(items) < 20:
        raise RuntimeError(f"Only {len(items)} unique verified archival images were available")
    items = items[:30]
    collage(items, OUTPUT_DIR / "mayakovsky-brik-authentic-archive-collage.png")
    contact_sheet(items, OUTPUT_DIR / "mayakovsky-brik-authentic-contact-sheet.png")
    manifests(items)
    print(f"Built from {len(items)} unique verified archival photographs; no generated imagery used")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

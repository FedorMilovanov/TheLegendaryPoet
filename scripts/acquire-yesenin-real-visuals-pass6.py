#!/usr/bin/env python3
"""Acquire real Yesenin visual witnesses and build a numbered research contact sheet.

No image is generated, retouched, colorized, extended or composited with synthetic
content. The contact sheet only scales the downloaded original bytes without
cropping and places neutral slot numbers outside each image.
"""

from __future__ import annotations

import hashlib
import json
import mimetypes
import os
from pathlib import Path
import shutil
import sys
from typing import Any
from urllib.request import Request, urlopen

from PIL import Image, ImageDraw, ImageFont, UnidentifiedImageError

OUTPUT = Path(os.environ.get("YESENIN_REAL_VISUAL_OUTPUT", "artifacts/yesenin-real-visuals-pass6"))
USER_AGENT = "TheLegendaryPoet-Research-Acquisition/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)"

RECORDS: list[dict[str, Any]] = [
    {
        "number": "01",
        "id": "VIS-YE1-P6-001",
        "title": "С. А. Есенин с сёстрами Катей и Шурой",
        "date": "Москва, 1912",
        "source_page": "https://commons.wikimedia.org/wiki/File:%D0%A1%D0%B5%D1%80%D0%B3%D0%B5%D0%B9_%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD_%D1%81_%D1%81%D1%91%D1%81%D1%82%D1%80%D0%B0%D0%BC%D0%B8_%D0%9A%D0%B0%D1%82%D0%B5%D0%B9_%D0%B8_%D0%A8%D1%83%D1%80%D0%BE%D0%B9.jpg",
        "file_url": "https://upload.wikimedia.org/wikipedia/commons/e/e6/%D0%A1%D0%B5%D1%80%D0%B3%D0%B5%D0%B9_%D0%95%D1%81%D0%B5%D0%BD%D0%B8%D0%BD_%D1%81_%D1%81%D1%91%D1%81%D1%82%D1%80%D0%B0%D0%BC%D0%B8_%D0%9A%D0%B0%D1%82%D0%B5%D0%B9_%D0%B8_%D0%A8%D1%83%D1%80%D0%BE%D0%B9.jpg",
        "expected_dimensions": [2268, 3160],
        "expected_bytes": 4118323,
        "expected_sha256": "72e2c130c01969948e33e6f872fb49123fb36abdf6afcb03de3376ff7314759f",
        "rights": "public-domain-candidate / legal metadata incomplete",
    },
    {
        "number": "02",
        "id": "VIS-YE1-P6-002",
        "title": "Автограф письма С. А. Есенина Г. А. Панфилову",
        "date": "до 18 августа 1912; ФЭБ, печатная с. 557",
        "source_page": "https://feb-web.ru/feb/esenin/chronics/el1/el1-551-.htm?cmd=p",
        "file_url": "https://feb-web.ru/feb/esenin/pictures/el1-557-.jpg",
        "expected_dimensions": [491, 680],
        "expected_bytes": 75811,
        "expected_sha256": "360e31bea4e627248ffac8fcacee1a8af856894510601fb032783be2ced7fa26",
        "rights": "research-only / scan rights unresolved",
    },
    {
        "number": "03",
        "id": "VIS-YE1-P6-003",
        "title": "Портрет С. А. Есенина 1914 года",
        "date": "1914",
        "source_page": "https://commons.wikimedia.org/wiki/File:Esenin1914.jpg",
        "file_url": "https://upload.wikimedia.org/wikipedia/commons/d/de/Esenin1914.jpg",
        "expected_dimensions": [570, 606],
        "expected_bytes": 67529,
        "expected_sha256": "1f4f3d25719582dedd54c7804c4b438136e943730526b75ec1437f8fcf73dfe6",
        "rights": "public-domain-candidate",
    },
    {
        "number": "04",
        "id": "VIS-YE1-P6-004",
        "title": "С. А. Есенин и Н. А. Клюев",
        "date": "1 февраля 1916",
        "source_page": "https://commons.wikimedia.org/wiki/File:Eseninnikolaiklyeuv.jpg",
        "file_url": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Eseninnikolaiklyeuv.jpg",
        "expected_dimensions": [792, 620],
        "expected_bytes": 228836,
        "expected_sha256": "5ca96a2d2f48eb320ad119dff7275149d8a27935a373359524152444814391bc",
        "rights": "public-domain-candidate",
    },
    {
        "number": "05",
        "id": "VIS-YE1-P6-005",
        "title": "С. А. Есенин и М. П. Мурашёв",
        "date": "Петроград, 10 апреля 1916; ФЭБ, печатная с. 668",
        "source_page": "https://feb-web.ru/feb/esenin/chronics/el1/el1-411-.htm?cmd=p",
        "file_url": "https://feb-web.ru/feb/esenin/pictures/el1-668-.jpg",
        "expected_dimensions": [614, 416],
        "expected_bytes": 39069,
        "expected_sha256": "2f16e6f0de81b4c7e9fc15d14845d5a665d8df6ef0ce37ba12aced1645b2189f",
        "rights": "research-only / exact holding and scan rights unresolved",
    },
    {
        "number": "06",
        "id": "VIS-YE1-P6-006",
        "title": "Извещение Петроградского резерва санитаров",
        "date": "1916; ФЭБ, печатная с. 673",
        "source_page": "https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p",
        "file_url": "https://feb-web.ru/feb/esenin/pictures/el1-673-.jpg",
        "expected_dimensions": [373, 542],
        "expected_bytes": 43430,
        "expected_sha256": "b9ce49137fa139faa1ee47e8e33d6e4592ac2d4bed1e2b69ac8da88c167c1484",
        "rights": "acquired-hashed / rights unresolved",
    },
    {
        "number": "07",
        "id": "VIS-YE1-P6-007",
        "title": "С. А. Есенин среди персонала военно-санитарного поезда № 143",
        "date": "1916; ФЭБ, печатная с. 690",
        "source_page": "https://feb-web.ru/feb/esenin/chronics/el1/el1-669-.htm?cmd=p",
        "file_url": "https://feb-web.ru/feb/esenin/pictures/el1-690-.jpg",
        "expected_dimensions": [614, 408],
        "expected_bytes": 54060,
        "expected_sha256": "08465a4383e3afa2d9fa087c61a006e750c6fc6c395a343ebf26c0fbfb5ad8ef",
        "rights": "acquired-hashed / rights unresolved",
    },
    {
        "number": "08",
        "id": "VIS-YE1-P6-008",
        "title": "Обложка журнала «Сирена» № 4–5",
        "date": "1919; ФЭБ, печатная с. 621",
        "source_page": "https://feb-web.ru/feb/esenin/chronics/el2/el2-spis.htm?cmd=p",
        "file_url": "https://feb-web.ru/feb/esenin/pictures/El2-6212.jpg",
        "expected_dimensions": [237, 309],
        "expected_bytes": 18693,
        "expected_sha256": "a316190933bcbdb433c835359d971854176a32d808787bcdc0050aad5b501cb4",
        "rights": "acquired-hashed / rights unresolved",
    },
]


def fail(message: str) -> None:
    raise RuntimeError(f"[yesenin-real-visuals-pass6] {message}")


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def download(record: dict[str, Any], destination: Path) -> dict[str, Any]:
    request = Request(record["file_url"], headers={"User-Agent": USER_AGENT, "Accept": "image/*"})
    with urlopen(request, timeout=60) as response:
        status = getattr(response, "status", 200)
        content_type = response.headers.get_content_type()
        data = response.read()
    if status != 200:
        fail(f"{record['id']} returned HTTP {status}")
    if not content_type.startswith("image/"):
        fail(f"{record['id']} returned {content_type}, not an image")
    if len(data) < 2_000:
        fail(f"{record['id']} is implausibly small: {len(data)} bytes")

    expected_bytes = record.get("expected_bytes")
    if expected_bytes is None:
        fail(f"{record['id']} has no frozen byte-size baseline")
    if len(data) != expected_bytes:
        fail(f"{record['id']} byte size drifted: expected {expected_bytes}, found {len(data)}")

    sha256 = hashlib.sha256(data).hexdigest()
    expected_sha = record.get("expected_sha256")
    if not expected_sha:
        fail(f"{record['id']} has no frozen SHA-256 baseline")
    if sha256 != expected_sha:
        fail(f"{record['id']} SHA-256 drifted: expected {expected_sha}, found {sha256}")

    suffix = mimetypes.guess_extension(content_type) or ".img"
    if suffix == ".jpe":
        suffix = ".jpg"
    destination = destination.with_suffix(suffix)
    destination.write_bytes(data)

    try:
        with Image.open(destination) as image:
            image.verify()
        with Image.open(destination) as image:
            width, height = image.size
            image_format = image.format
    except UnidentifiedImageError as exc:
        fail(f"{record['id']} is not a decodable image: {exc}")

    expected_dimensions = record.get("expected_dimensions")
    if not expected_dimensions:
        fail(f"{record['id']} has no frozen dimensions baseline")
    if [width, height] != expected_dimensions:
        fail(
            f"{record['id']} dimensions drifted: expected {expected_dimensions}, "
            f"found {[width, height]}"
        )

    return {
        **record,
        "local_file": destination.name,
        "mime": content_type,
        "format": image_format,
        "bytes": len(data),
        "width": width,
        "height": height,
        "sha256": sha256,
        "productionAuthorized": False,
        "synthetic": False,
    }


def build_contact_sheet(manifest: list[dict[str, Any]], originals: Path, output: Path) -> None:
    columns, rows = 4, 2
    cell_w, cell_h = 560, 620
    margin, label_h = 32, 76
    sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), "white")
    draw = ImageDraw.Draw(sheet)
    number_font = font(52)

    for index, record in enumerate(manifest):
        col, row = index % columns, index // columns
        x0, y0 = col * cell_w, row * cell_h
        draw.rectangle((x0, y0, x0 + cell_w - 1, y0 + cell_h - 1), outline=(215, 215, 215), width=2)
        draw.text((x0 + margin, y0 + 10), record["number"], fill="black", font=number_font)

        with Image.open(originals / record["local_file"]) as original:
            image = original.convert("RGB")
            max_w = cell_w - 2 * margin
            max_h = cell_h - label_h - 2 * margin
            image.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
            px = x0 + (cell_w - image.width) // 2
            py = y0 + label_h + (max_h - image.height) // 2
            sheet.paste(image, (px, py))

    sheet.save(output, format="PNG", optimize=True)


def main() -> int:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    originals = OUTPUT / "originals"
    originals.mkdir(parents=True)

    manifest: list[dict[str, Any]] = []
    for record in RECORDS:
        print(f"Acquiring {record['number']} {record['id']} ...", flush=True)
        manifest.append(download(record, originals / record["id"]))

    manifest_path = OUTPUT / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    build_contact_sheet(manifest, originals, OUTPUT / "contact-sheet-01-08.png")

    summary = {
        "records": len(manifest),
        "realOriginals": len(manifest),
        "syntheticImages": 0,
        "generatedFaces": 0,
        "generatedDocuments": 0,
        "allByteBaselinesFrozen": True,
        "allDimensionBaselinesFrozen": True,
        "allSha256BaselinesFrozen": True,
        "productionAuthorized": False,
        "contactSheet": "contact-sheet-01-08.png",
        "manifest": "manifest.json",
        "sha256": {item["id"]: item["sha256"] for item in manifest},
    }
    (OUTPUT / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        sys.exit(1)

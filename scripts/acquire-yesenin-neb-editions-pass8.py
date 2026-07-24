#!/usr/bin/env python3
"""Acquire two real NEB edition PDFs and render page-contact sheets for collation.

This workflow performs no OCR, no text synthesis, no page reconstruction and no
image generation. It downloads the exact PDF endpoints exposed by the NEB
catalog, hashes the original bytes, renders every page without cropping, and
adds only neutral PDF page numbers outside the page image.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import sys
from typing import Any
from urllib.request import Request, urlopen

import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

OUTPUT = Path(os.environ.get("YESENIN_NEB_OUTPUT", "artifacts/yesenin-neb-editions-pass8"))
USER_AGENT = "TheLegendaryPoet-Research-Acquisition/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)"

RECORDS: list[dict[str, Any]] = [
    {
        "id": "NEB-YE1-RADUNITSA-1916",
        "title": "С. А. Есенин. Радуница. Петроград: М. В. Аверьянов, 1916",
        "catalog_url": "https://rusneb.ru/catalog/000199_000009_004210209/",
        "pdf_url": "https://rusneb.ru/local/tools/exalead/getFiles.php?book_id=000199_000009_004210209&doc_type=pdf&name=000199_000009_004210209-%D0%A0%D0%B0%D0%B4%D1%83%D0%BD%D0%B8%D1%86%D0%B0+%3A+%D0%A1%D0%B1.+%D1%81%D1%82%D0%B8%D1%85%D0%BE%D0%B2",
        "catalog_extent": "62 с.",
        "holding": "Российская государственная библиотека / НЭБ",
        "minimum_bytes": 20_000_000,
        "minimum_pdf_pages": 60,
    },
    {
        "id": "NEB-YE1-ISPOVED-1921",
        "title": "С. А. Есенин. Исповедь хулигана. Москва, 1921",
        "catalog_url": "https://rusneb.ru/catalog/000200_000018_RU_NLR_A1SV_46698/",
        "pdf_url": "https://rusneb.ru/local/tools/exalead/getFiles.php?book_id=000200_000018_RU_NLR_A1SV_46698&doc_type=pdf&name=000200_000018_RU_NLR_A1SV_46698-%D0%98%D1%81%D0%BF%D0%BE%D0%B2%D0%B5%D0%B4%D1%8C+%D1%85%D1%83%D0%BB%D0%B8%D0%B3%D0%B0%D0%BD%D0%B0",
        "catalog_extent": "[12] с.",
        "holding": "Российская национальная библиотека / НЭБ",
        "minimum_bytes": 1_000_000,
        "minimum_pdf_pages": 10,
    },
]


def fail(message: str) -> None:
    raise RuntimeError(f"[yesenin-neb-editions-pass8] {message}")


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ):
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def download_pdf(record: dict[str, Any], destination: Path) -> dict[str, Any]:
    request = Request(
        record["pdf_url"],
        headers={"User-Agent": USER_AGENT, "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1"},
    )
    with urlopen(request, timeout=180) as response:
        status = getattr(response, "status", 200)
        content_type = response.headers.get_content_type()
        final_url = response.geturl()
        data = response.read()

    if status != 200:
        fail(f"{record['id']} returned HTTP {status}")
    if not data.startswith(b"%PDF-"):
        preview = data[:80].decode("utf-8", errors="replace")
        fail(f"{record['id']} did not return PDF bytes ({content_type}): {preview!r}")
    if len(data) < record["minimum_bytes"]:
        fail(f"{record['id']} is too small: {len(data)} bytes")

    destination.write_bytes(data)
    sha256 = hashlib.sha256(data).hexdigest()

    document = fitz.open(stream=data, filetype="pdf")
    page_count = document.page_count
    metadata = {key: value for key, value in document.metadata.items() if value}
    if page_count < record["minimum_pdf_pages"]:
        fail(f"{record['id']} has only {page_count} PDF pages")
    if document.needs_pass:
        fail(f"{record['id']} unexpectedly requires a password")
    document.close()

    return {
        **record,
        "final_url": final_url,
        "content_type": content_type,
        "local_pdf": destination.name,
        "bytes": len(data),
        "sha256": sha256,
        "pdf_pages": page_count,
        "pdf_metadata": metadata,
        "ocrUsed": False,
        "synthetic": False,
        "productionAuthorized": False,
    }


def render_contact_sheets(record: dict[str, Any], pdf_path: Path, output_dir: Path) -> list[str]:
    document = fitz.open(pdf_path)
    columns, rows = 4, 4
    per_sheet = columns * rows
    cell_w, cell_h = 410, 520
    header_h, margin = 48, 20
    number_font = font(28)
    sheet_names: list[str] = []

    for sheet_index in range(math.ceil(document.page_count / per_sheet)):
        sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), "white")
        draw = ImageDraw.Draw(sheet)
        first_page = sheet_index * per_sheet
        last_page = min(document.page_count, first_page + per_sheet)

        for page_index in range(first_page, last_page):
            slot = page_index - first_page
            col, row = slot % columns, slot // columns
            x0, y0 = col * cell_w, row * cell_h
            draw.rectangle((x0, y0, x0 + cell_w - 1, y0 + cell_h - 1), outline=(205, 205, 205), width=2)
            draw.text((x0 + margin, y0 + 8), f"PDF {page_index + 1:02d}", fill="black", font=number_font)

            page = document.load_page(page_index)
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
            page_image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            page_image.thumbnail((cell_w - 2 * margin, cell_h - header_h - 2 * margin), Image.Resampling.LANCZOS)
            px = x0 + (cell_w - page_image.width) // 2
            py = y0 + header_h + (cell_h - header_h - page_image.height) // 2
            sheet.paste(page_image, (px, py))

        sheet_name = f"{record['id'].lower()}-contact-{sheet_index + 1:02d}.jpg"
        sheet.save(output_dir / sheet_name, format="JPEG", quality=88, optimize=True, progressive=True)
        sheet_names.append(sheet_name)

    document.close()
    return sheet_names


def main() -> int:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    originals = OUTPUT / "originals"
    sheets = OUTPUT / "contact-sheets"
    originals.mkdir(parents=True)
    sheets.mkdir(parents=True)

    manifest: list[dict[str, Any]] = []
    for record in RECORDS:
        print(f"Acquiring {record['id']} ...", flush=True)
        acquired = download_pdf(record, originals / f"{record['id']}.pdf")
        acquired["contact_sheets"] = render_contact_sheets(
            acquired,
            originals / acquired["local_pdf"],
            sheets,
        )
        manifest.append(acquired)

    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    summary = {
        "records": len(manifest),
        "realPdfObjects": len(manifest),
        "totalPdfPages": sum(record["pdf_pages"] for record in manifest),
        "ocrUsed": False,
        "syntheticImages": 0,
        "generatedDocuments": 0,
        "productionAuthorized": False,
        "objects": {
            record["id"]: {
                "bytes": record["bytes"],
                "sha256": record["sha256"],
                "pdfPages": record["pdf_pages"],
                "contactSheets": record["contact_sheets"],
            }
            for record in manifest
        },
    }
    (OUTPUT / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        sys.exit(1)

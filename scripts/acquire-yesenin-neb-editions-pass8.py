#!/usr/bin/env python3
"""Acquire real NEB edition PDFs and render neutral page-contact sheets.

No OCR, text synthesis, page reconstruction, generative fill, or generated
historical imagery is used. PDF frames are preserved in full and receive only
neutral external labels such as ``PDF 01``.
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
        "catalog_extent": "62 printed pages",
        "pdf_packaging": "35 PDF frames; printed leaves are photographed as full leaves and spreads",
        "holding": "Russian State Library / National Electronic Library",
        "expected_bytes": 49_288_163,
        "expected_sha256": "761ba9c1eb41e0d6e146618c8d5cb30bb79485d02587e0161523a819cd753185",
        "expected_pdf_frames": 35,
    },
    {
        "id": "NEB-YE1-ISPOVED-1921",
        "title": "С. А. Есенин. Исповедь хулигана. Москва, 1921",
        "catalog_url": "https://rusneb.ru/catalog/000200_000018_RU_NLR_A1SV_46698/",
        "pdf_url": "https://rusneb.ru/local/tools/exalead/getFiles.php?book_id=000200_000018_RU_NLR_A1SV_46698&doc_type=pdf&name=000200_000018_RU_NLR_A1SV_46698-%D0%98%D1%81%D0%BF%D0%BE%D0%B2%D0%B5%D0%B4%D1%8C+%D1%85%D1%83%D0%BB%D0%B8%D0%B3%D0%B0%D0%BD%D0%B0",
        "catalog_extent": "[12] printed pages plus cover/endpaper frames",
        "pdf_packaging": "16 PDF frames including front cover, inner covers, text leaves and back cover",
        "holding": "Russian National Library / National Electronic Library",
        "expected_bytes": 3_309_388,
        "expected_sha256": "17917962290fdd24eedd52fdd76d84c7c1bdf0898f53a41c52af555691f3116c",
        "expected_pdf_frames": 16,
    },
]


def fail(message: str) -> None:
    raise RuntimeError(f"[yesenin-neb-editions-pass8] {message}")


def label_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ):
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def acquire(record: dict[str, Any], pdf_path: Path) -> dict[str, Any]:
    request = Request(
        record["pdf_url"],
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
        },
    )
    with urlopen(request, timeout=180) as response:
        status = getattr(response, "status", 200)
        content_type = response.headers.get_content_type()
        final_url = response.geturl()
        data = response.read()

    if status != 200:
        fail(f"{record['id']} returned HTTP {status}")
    if not data.startswith(b"%PDF-"):
        preview = data[:100].decode("utf-8", errors="replace")
        fail(f"{record['id']} returned {content_type}, not PDF bytes: {preview!r}")
    if len(data) != record["expected_bytes"]:
        fail(
            f"{record['id']} byte-size drifted: expected {record['expected_bytes']}, found {len(data)}"
        )

    sha256 = hashlib.sha256(data).hexdigest()
    if sha256 != record["expected_sha256"]:
        fail(
            f"{record['id']} SHA-256 drifted: expected {record['expected_sha256']}, found {sha256}"
        )

    pdf_path.write_bytes(data)
    document = fitz.open(stream=data, filetype="pdf")
    frame_count = document.page_count
    metadata = {key: value for key, value in document.metadata.items() if value}
    needs_password = bool(document.needs_pass)
    document.close()

    if needs_password:
        fail(f"{record['id']} unexpectedly requires a password")
    if frame_count != record["expected_pdf_frames"]:
        fail(
            f"{record['id']} PDF-frame count drifted: expected {record['expected_pdf_frames']}, found {frame_count}"
        )

    return {
        **record,
        "final_url": final_url,
        "content_type": content_type,
        "local_pdf": pdf_path.name,
        "bytes": len(data),
        "sha256": sha256,
        "pdf_frames": frame_count,
        "pdf_metadata": metadata,
        "ocrUsed": False,
        "synthetic": False,
        "productionAuthorized": False,
    }


def render_contact_sheets(record: dict[str, Any], pdf_path: Path, output_dir: Path) -> list[str]:
    document = fitz.open(pdf_path)
    columns, rows, per_sheet = 4, 4, 16
    cell_w, cell_h, header_h, margin = 410, 520, 48, 20
    font = label_font(28)
    sheet_names: list[str] = []

    for sheet_index in range(math.ceil(document.page_count / per_sheet)):
        sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), "white")
        draw = ImageDraw.Draw(sheet)
        first = sheet_index * per_sheet
        last = min(document.page_count, first + per_sheet)

        for frame_index in range(first, last):
            slot = frame_index - first
            col, row = slot % columns, slot // columns
            x0, y0 = col * cell_w, row * cell_h
            draw.rectangle((x0, y0, x0 + cell_w - 1, y0 + cell_h - 1), outline=(205, 205, 205), width=2)
            draw.text((x0 + margin, y0 + 8), f"PDF {frame_index + 1:02d}", fill="black", font=font)

            page = document.load_page(frame_index)
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
            page_image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            page_image.thumbnail((cell_w - 2 * margin, cell_h - header_h - 2 * margin), Image.Resampling.LANCZOS)
            px = x0 + (cell_w - page_image.width) // 2
            py = y0 + header_h + (cell_h - header_h - page_image.height) // 2
            sheet.paste(page_image, (px, py))

        name = f"{record['id'].lower()}-contact-{sheet_index + 1:02d}.jpg"
        sheet.save(output_dir / name, format="JPEG", quality=88, optimize=True, progressive=True)
        sheet_names.append(name)

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
        acquired = acquire(record, originals / f"{record['id']}.pdf")
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
        "totalPdfFrames": sum(record["pdf_frames"] for record in manifest),
        "exactBytesFrozen": True,
        "exactSha256Frozen": True,
        "exactFrameCountsFrozen": True,
        "ocrUsed": False,
        "syntheticImages": 0,
        "generatedDocuments": 0,
        "productionAuthorized": False,
        "objects": {
            record["id"]: {
                "catalogExtent": record["catalog_extent"],
                "pdfPackaging": record["pdf_packaging"],
                "bytes": record["bytes"],
                "sha256": record["sha256"],
                "pdfFrames": record["pdf_frames"],
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

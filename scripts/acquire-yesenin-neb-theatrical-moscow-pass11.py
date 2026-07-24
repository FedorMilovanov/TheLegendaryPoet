#!/usr/bin/env python3
"""Acquire exact NEB PDFs for selected 1921 issues of Theatrical Moscow.

Routes must come from the preserved child-page HTML discovery manifest. The
script performs no OCR, no document reconstruction and no synthetic imagery.
Every PDF frame is rendered in full with only an external neutral frame label.
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
from urllib.parse import parse_qs, quote, urlsplit, urlunsplit
from urllib.request import Request, urlopen

import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

SERIAL_OUTPUT = Path(
    os.environ.get("YESENIN_NEB_SERIAL_OUTPUT", "artifacts/yesenin-neb-serial-discovery-pass10")
)
OUTPUT = Path(
    os.environ.get("YESENIN_NEB_THEATRE_OUTPUT", "artifacts/yesenin-neb-theatrical-moscow-pass11")
)
ROUTE_MANIFEST = SERIAL_OUTPUT / "child-pdf-routes.json"
USER_AGENT = "TheLegendaryPoet-Research-Acquisition/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)"
EXPECTED = {
    "1921, № 2": "000199_000009_013560962",
    "1921, № 7": "000199_000009_013560972",
    "1921, № 8": "000199_000009_013560974",
    "1921, № 11-12": "000199_000009_013560981",
}


def fail(message: str) -> None:
    raise RuntimeError(f"[yesenin-neb-theatrical-moscow-pass11] {message}")


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ):
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def ascii_url(url: str) -> str:
    parts = urlsplit(url)
    encoded_path = quote(parts.path, safe="/%")
    encoded_query = quote(parts.query, safe="=&%")
    return urlunsplit((parts.scheme, parts.netloc, encoded_path, encoded_query, parts.fragment))


def canonical_route(issue: dict[str, Any], code: str) -> tuple[str, list[str]]:
    exact: list[tuple[str, str]] = []
    for route in issue.get("pdfRoutes", []):
        parsed = urlsplit(route)
        query = parse_qs(parsed.query)
        if query.get("book_id") != [code] or query.get("doc_type") != ["pdf"]:
            continue
        names = query.get("name", [])
        if len(names) != 1:
            continue
        exact.append((route, names[0]))
    preferred = [route for route, name in exact if name.startswith(f"{code}-")]
    if len(preferred) != 1:
        fail(f"{code} expected one code-prefixed PDF route, found {len(preferred)}")
    alternatives = [route for route, _name in exact if route != preferred[0]]
    return preferred[0], alternatives


def download_pdf(label: str, code: str, route: str, alternatives: list[str], destination: Path) -> dict[str, Any]:
    encoded_route = ascii_url(route)
    request = Request(
        encoded_route,
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
        fail(f"{label} returned HTTP {status}")
    if not data.startswith(b"%PDF-"):
        preview = data[:100].decode("utf-8", errors="replace")
        fail(f"{label} returned {content_type}, not PDF bytes: {preview!r}")
    if len(data) < 5_000_000:
        fail(f"{label} is implausibly small: {len(data)} bytes")

    destination.write_bytes(data)
    document = fitz.open(stream=data, filetype="pdf")
    frame_count = document.page_count
    metadata = {key: value for key, value in document.metadata.items() if value}
    needs_password = bool(document.needs_pass)
    document.close()
    if needs_password:
        fail(f"{label} unexpectedly requires a password")
    if frame_count < 4:
        fail(f"{label} has only {frame_count} PDF frames")

    return {
        "label": label,
        "catalogueCode": code,
        "catalogueUrl": f"https://rusneb.ru/catalog/{code}/",
        "publishedPdfRoute": route,
        "publishedAlternativeRoutes": alternatives,
        "encodedRequestUrl": encoded_route,
        "finalUrl": final_url,
        "contentType": content_type,
        "localPdf": destination.name,
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "pdfFrames": frame_count,
        "pdfMetadata": metadata,
        "routeConstructed": False,
        "ocrUsed": False,
        "synthetic": False,
        "productionAuthorized": False,
    }


def render_sheets(record: dict[str, Any], pdf_path: Path, sheets: Path) -> list[str]:
    document = fitz.open(pdf_path)
    columns, rows, per_sheet = 4, 4, 16
    cell_w, cell_h, header_h, margin = 410, 520, 48, 20
    label_font = font(28)
    names: list[str] = []
    safe_code = record["catalogueCode"].lower()

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
            draw.text((x0 + margin, y0 + 8), f"PDF {frame_index + 1:02d}", fill="black", font=label_font)
            page = document.load_page(frame_index)
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
            page_image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            page_image.thumbnail((cell_w - 2 * margin, cell_h - header_h - 2 * margin), Image.Resampling.LANCZOS)
            px = x0 + (cell_w - page_image.width) // 2
            py = y0 + header_h + (cell_h - header_h - page_image.height) // 2
            sheet.paste(page_image, (px, py))
        name = f"theatrical-moscow-{safe_code}-contact-{sheet_index + 1:02d}.jpg"
        sheet.save(sheets / name, format="JPEG", quality=88, optimize=True, progressive=True)
        names.append(name)
    document.close()
    return names


def main() -> int:
    if not ROUTE_MANIFEST.exists():
        fail(f"missing child route manifest {ROUTE_MANIFEST}")
    routes = json.loads(ROUTE_MANIFEST.read_text(encoding="utf-8"))
    if routes.get("errors"):
        fail(f"child route discovery contains errors: {routes['errors']}")
    by_label = {item["label"]: item for item in routes.get("issues", [])}

    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    originals = OUTPUT / "originals"
    sheets = OUTPUT / "contact-sheets"
    originals.mkdir(parents=True)
    sheets.mkdir(parents=True)

    manifest: list[dict[str, Any]] = []
    for label, code in EXPECTED.items():
        issue = by_label.get(label)
        if not issue or issue.get("catalogueCode") != code:
            fail(f"missing exact child route source for {label}")
        route, alternatives = canonical_route(issue, code)
        print(f"Acquiring {label} / {code} ...", flush=True)
        acquired = download_pdf(label, code, route, alternatives, originals / f"{code}.pdf")
        acquired["contactSheets"] = render_sheets(acquired, originals / acquired["localPdf"], sheets)
        manifest.append(acquired)

    summary = {
        "records": len(manifest),
        "realPdfObjects": len(manifest),
        "totalPdfBytes": sum(item["bytes"] for item in manifest),
        "totalPdfFrames": sum(item["pdfFrames"] for item in manifest),
        "routesConstructed": False,
        "ocrUsed": False,
        "syntheticImages": 0,
        "generatedDocuments": 0,
        "productionAuthorized": False,
        "issues": manifest,
    }
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        sys.exit(1)

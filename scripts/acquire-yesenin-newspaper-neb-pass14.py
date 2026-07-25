#!/usr/bin/env python3
"""Acquire the three exact Izvestia 1921 PDFs discovered through official NEB search.

Only code-prefixed PDF routes preserved from accepted issue-card HTML are used.
The script requires real PDF bytes, records exact hashes/frame counts and renders
all frames to neutral contact sheets. It performs no OCR or synthetic generation.
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

import fitz
from PIL import Image, ImageDraw, ImageFont

SEARCH_OUTPUT = Path(
    os.environ.get(
        "YESENIN_NEWSPAPER_SEARCH_OUTPUT",
        "artifacts/yesenin-newspaper-neb-search-pass14",
    )
)
ROUTES = SEARCH_OUTPUT / "issue-pdf-routes.json"
OUTPUT = Path(
    os.environ.get(
        "YESENIN_NEWSPAPER_ACQUISITION_OUTPUT",
        "artifacts/yesenin-newspaper-neb-acquisition-pass14",
    )
)
USER_AGENT = (
    "TheLegendaryPoet-Research-Newspaper-Acquisition/1.0 "
    "(+https://github.com/FedorMilovanov/TheLegendaryPoet)"
)
EXPECTED = {
    "NEB-YE1-IZVESTIA-1921-08-24": "000199_000009_013351165",
    "NEB-YE1-IZVESTIA-1921-11-09": "000199_000009_013351339",
    "NEB-YE1-IZVESTIA-1921-11-23": "000199_000009_013351387",
}


def fail(message: str) -> None:
    raise RuntimeError(f"[yesenin-newspaper-neb-pass14] {message}")


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
    return urlunsplit(
        (
            parts.scheme,
            parts.netloc,
            quote(parts.path, safe="/%"),
            quote(parts.query, safe="=&%"),
            parts.fragment,
        )
    )


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
        fail(f"{code} expected exactly one code-prefixed literal PDF route, found {len(preferred)}")
    return preferred[0], [route for route, _name in exact if route != preferred[0]]


def download_pdf(issue: dict[str, Any], route: str, alternatives: list[str], destination: Path) -> dict[str, Any]:
    encoded = ascii_url(route)
    request = Request(
        encoded,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
        },
    )
    with urlopen(request, timeout=240) as response:
        status = getattr(response, "status", 200)
        content_type = response.headers.get_content_type()
        final_url = response.geturl()
        data = response.read()
    if status != 200:
        fail(f"{issue['targetId']} returned HTTP {status}")
    if not data.startswith(b"%PDF-"):
        preview = data[:120].decode("utf-8", errors="replace")
        fail(f"{issue['targetId']} returned {content_type}, not PDF bytes: {preview!r}")
    if len(data) < 5_000_000:
        fail(f"{issue['targetId']} PDF is implausibly small: {len(data)} bytes")

    destination.write_bytes(data)
    document = fitz.open(stream=data, filetype="pdf")
    if document.needs_pass:
        document.close()
        fail(f"{issue['targetId']} unexpectedly requires a password")
    frames = document.page_count
    metadata = {key: value for key, value in document.metadata.items() if value}
    document.close()
    if frames < 2:
        fail(f"{issue['targetId']} has only {frames} PDF frames")

    return {
        "targetId": issue["targetId"],
        "date": issue["date"],
        "issueNumber": issue["issueNumber"],
        "catalogueCode": issue["catalogueCode"],
        "catalogueUrl": issue["catalogueUrl"],
        "catalogueHtmlSha256": issue["htmlSha256"],
        "publishedPdfRoute": route,
        "publishedAlternativeRoutes": alternatives,
        "encodedRequestUrl": encoded,
        "finalUrl": final_url,
        "contentType": content_type,
        "localPdf": destination.name,
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "pdfFrames": frames,
        "pdfMetadata": metadata,
        "routeConstructed": False,
        "ocrUsed": False,
        "syntheticContentUsed": False,
        "productionAuthorized": False,
    }


def render_contact_sheets(record: dict[str, Any], pdf_path: Path, output: Path) -> list[str]:
    document = fitz.open(pdf_path)
    columns, rows, per_sheet = 4, 4, 16
    cell_w, cell_h, header_h, margin = 420, 540, 48, 18
    label_font = font(27)
    names: list[str] = []
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
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.0, 1.0), alpha=False)
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            image.thumbnail((cell_w - 2 * margin, cell_h - header_h - 2 * margin), Image.Resampling.LANCZOS)
            px = x0 + (cell_w - image.width) // 2
            py = y0 + header_h + (cell_h - header_h - image.height) // 2
            sheet.paste(image, (px, py))
        name = f"izvestia-{record['issueNumber']}-contact-{sheet_index + 1:02d}.jpg"
        sheet.save(output / name, format="JPEG", quality=88, optimize=True, progressive=True)
        names.append(name)
    document.close()
    return names


def main() -> int:
    if not ROUTES.exists():
        fail(f"missing literal route manifest {ROUTES}")
    discovery = json.loads(ROUTES.read_text(encoding="utf-8"))
    if discovery.get("errors"):
        fail(f"route discovery contains errors: {discovery['errors']}")
    by_id = {issue["targetId"]: issue for issue in discovery.get("issues", [])}
    if set(by_id) != set(EXPECTED):
        fail(f"expected exactly {sorted(EXPECTED)}, got {sorted(by_id)}")

    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    originals = OUTPUT / "originals"
    sheets = OUTPUT / "contact-sheets"
    originals.mkdir(parents=True)
    sheets.mkdir(parents=True)

    records: list[dict[str, Any]] = []
    for target_id, code in EXPECTED.items():
        issue = by_id[target_id]
        if issue["catalogueCode"] != code:
            fail(f"{target_id} catalogue code drifted: {issue['catalogueCode']}")
        route, alternatives = canonical_route(issue, code)
        print(f"Acquiring {target_id} / {code} ...", flush=True)
        record = download_pdf(issue, route, alternatives, originals / f"{code}.pdf")
        record["contactSheets"] = render_contact_sheets(record, originals / record["localPdf"], sheets)
        records.append(record)

    summary = {
        "records": len(records),
        "realPdfObjects": len(records),
        "totalPdfBytes": sum(record["bytes"] for record in records),
        "totalPdfFrames": sum(record["pdfFrames"] for record in records),
        "routesConstructed": False,
        "ocrUsed": False,
        "syntheticImages": 0,
        "generatedDocuments": 0,
        "productionAuthorized": False,
        "issues": records,
    }
    (OUTPUT / "manifest.json").write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
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

#!/usr/bin/env python3
"""Discover and acquire published RSL facsimiles for Mariengof 1927/1928.

The script follows only URLs that are literally present in official RSL HTML,
JSON or JavaScript responses. A route is accepted as a PDF only after its
response bytes begin with %PDF-. Viewer HTML is never promoted to a facsimile.
"""

from __future__ import annotations

import hashlib
import html
import json
import math
import os
import re
import ssl
import sys
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

OUTPUT = Path(
    os.environ.get(
        "YESENIN_MARIENGOF_OUTPUT",
        "artifacts/yesenin-mariengof-editions-pass13",
    )
)
USER_AGENT = (
    "Mozilla/5.0 (compatible; TheLegendaryPoetResearch/1.0; "
    "published-route-evidence-discovery)"
)
OFFICIAL_SUFFIX = "rsl.ru"
MAX_DISCOVERY_FETCHES = 48
MAX_DISCOVERY_DEPTH = 3
MAX_DISCOVERY_RESPONSE_BYTES = 12_000_000

RECORDS = (
    {
        "year": 1927,
        "label": "Роман без вранья. Первое издание",
        "record_id": "01009215492",
        "card_url": "https://search.rsl.ru/ru/record/01009215492",
        "historical_hold_id": "PW6-YE1-MARIENGOF-1927",
        "expected_extent_marker": "154 с.",
    },
    {
        "year": 1928,
        "label": "Роман без вранья. Второе издание",
        "record_id": "01009215494",
        "card_url": "https://search.rsl.ru/ru/record/01009215494",
        "historical_hold_id": "PW6-YE1-MARIENGOF-1928",
        "expected_extent_marker": "157 с.",
    },
)


class LinkCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.values: list[tuple[str, str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for key, value in attrs:
            if value and key.lower() in {
                "href",
                "src",
                "action",
                "content",
                "data-url",
                "data-href",
                "data-src",
                "data-file",
                "data-download",
            }:
                self.values.append((tag, key, value.strip()))


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def request_bytes(
    url: str,
    *,
    max_bytes: int | None = None,
) -> tuple[bytes, dict[str, Any]]:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": (
                "text/html,application/xhtml+xml,application/json,"
                "text/javascript,application/javascript,application/pdf;q=0.9,*/*;q=0.8"
            ),
            "Accept-Language": "ru,en;q=0.8",
        },
    )
    context = ssl.create_default_context()
    with urlopen(request, timeout=120, context=context) as response:
        data = response.read() if max_bytes is None else response.read(max_bytes)
        return data, {
            "requestedUrl": url,
            "finalUrl": response.geturl(),
            "status": getattr(response, "status", None),
            "contentType": response.headers.get("Content-Type"),
            "contentDisposition": response.headers.get("Content-Disposition"),
            "contentLengthHeader": response.headers.get("Content-Length"),
        }


def normalize_url(raw: str, base: str) -> str | None:
    value = html.unescape(raw.strip()).strip("\"' ")
    value = value.replace("\\/", "/").replace("\\u002F", "/")
    if not value or value.startswith(("javascript:", "mailto:", "tel:", "#")):
        return None
    if value.startswith("//"):
        value = "https:" + value
    absolute = urljoin(base, value)
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    return absolute


def official(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return host == OFFICIAL_SUFFIX or host.endswith("." + OFFICIAL_SUFFIX)


def extract_official_urls(payload: bytes, base: str) -> list[dict[str, str]]:
    text = payload.decode("utf-8", errors="replace")
    collector = LinkCollector()
    try:
        collector.feed(text)
    except Exception:
        # Inline JSON/JS is still handled by regex extraction below.
        pass

    found: list[dict[str, str]] = []
    seen: set[str] = set()

    def add(raw: str, source: str) -> None:
        candidate = normalize_url(raw, base)
        if not candidate or candidate in seen or not official(candidate):
            return
        seen.add(candidate)
        found.append({"url": candidate, "source": source})

    for tag, key, value in collector.values:
        add(value, f"html:{tag}[{key}]")

    absolute_patterns = (
        r"https?://[^\s\"'<>\\]+",
        r"https?:\\/\\/[^\s\"'<>]+",
    )
    for pattern in absolute_patterns:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            add(match.group(0), "inline:absolute-url")

    keyed_pattern = re.compile(
        r"(?:href|src|url|uri|downloadUrl|download_url|viewerUrl|viewer_url|"
        r"fileUrl|file_url|manifestUrl|manifest_url|documentUrl|document_url|"
        r"pdfUrl|pdf_url|contentUrl|content_url)\s*[:=]\s*[\"']([^\"']+)[\"']",
        flags=re.IGNORECASE,
    )
    for match in keyed_pattern.finditer(text):
        add(match.group(1), "inline:keyed-url")

    quoted_path_pattern = re.compile(
        r"[\"']((?:/|\\/)[^\"']{2,500}(?:viewer|download|document|manifest|"
        r"iiif|pdf|file|content)[^\"']*)[\"']",
        flags=re.IGNORECASE,
    )
    for match in quoted_path_pattern.finditer(text):
        add(match.group(1), "inline:quoted-route")

    return found


def candidate_priority(url: str, record_id: str) -> tuple[int, int, str]:
    parsed = urlparse(url)
    lowered = url.lower()
    path = parsed.path.lower()
    score = 100
    if record_id in url:
        score -= 40
    if path.endswith(".pdf") or "pdf" in lowered:
        score -= 30
    if any(marker in lowered for marker in ("download", "document", "content", "file")):
        score -= 20
    if any(marker in lowered for marker in ("viewer", "dlib", "libweb", "manifest", "iiif")):
        score -= 15
    if path.endswith((".json", ".js", ".mjs")):
        score -= 5
    if parsed.hostname == "search.rsl.ru":
        score += 20
    return score, len(url), url


def should_follow(url: str, record_id: str, depth: int) -> bool:
    if depth > MAX_DISCOVERY_DEPTH or not official(url):
        return False
    parsed = urlparse(url)
    lowered = url.lower()
    path = parsed.path.lower()
    if record_id in url:
        return True
    if any(
        marker in lowered
        for marker in (
            "viewer",
            "dlib",
            "libweb",
            "download",
            "document",
            "read",
            "online",
            "manifest",
            "iiif",
            "pdf",
            "file",
            "content",
        )
    ):
        return True
    # Viewer applications often publish API configuration only through their
    # own JS/JSON assets. Fetch those assets only after the first official hop.
    return depth >= 1 and path.endswith((".json", ".js", ".mjs"))


def safe_artifact_name(url: str, depth: int, suffix: str) -> str:
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:18]
    return f"hop-{depth}-{digest}{suffix}"


@dataclass
class DiscoveryResult:
    pdfBytes: bytes | None
    publishedRoute: str | None
    finalUrl: str | None
    contentType: str | None
    routeStatus: str
    provenance: list[dict[str, Any]]
    errors: list[str]


def discover_published_pdf(
    card_bytes: bytes,
    card_url: str,
    record_id: str,
    discovery_dir: Path,
) -> DiscoveryResult:
    queue: list[tuple[str, str, str, int]] = []
    enqueued: set[str] = set()
    visited: set[str] = {card_url}
    provenance: list[dict[str, Any]] = []
    errors: list[str] = []

    def enqueue(url: str, discovered_from: str, source: str, depth: int) -> None:
        if url in visited or url in enqueued or not should_follow(url, record_id, depth):
            return
        enqueued.add(url)
        queue.append((url, discovered_from, source, depth))
        queue.sort(key=lambda item: candidate_priority(item[0], record_id))

    for child in extract_official_urls(card_bytes, card_url):
        provenance.append(
            {
                "url": child["url"],
                "discoveredFrom": card_url,
                "source": child["source"],
                "depth": 0,
                "fetched": False,
            }
        )
        enqueue(child["url"], card_url, child["source"], 1)

    fetches = 0
    while queue and fetches < MAX_DISCOVERY_FETCHES:
        url, discovered_from, source, depth = queue.pop(0)
        enqueued.discard(url)
        if url in visited:
            continue
        visited.add(url)
        fetches += 1

        try:
            payload, metadata = request_bytes(
                url,
                max_bytes=MAX_DISCOVERY_RESPONSE_BYTES,
            )
        except (HTTPError, URLError, TimeoutError, OSError) as error:
            message = f"{type(error).__name__}: {error}"
            errors.append(f"{url}: {message}")
            provenance.append(
                {
                    "url": url,
                    "discoveredFrom": discovered_from,
                    "source": source,
                    "depth": depth,
                    "fetched": True,
                    "error": message,
                }
            )
            continue

        final_url = str(metadata.get("finalUrl") or url)
        content_type = str(metadata.get("contentType") or "")
        is_pdf = payload.startswith(b"%PDF-")
        record_identity_visible = record_id in url or record_id in final_url
        entry: dict[str, Any] = {
            "url": url,
            "finalUrl": final_url,
            "discoveredFrom": discovered_from,
            "source": source,
            "depth": depth,
            "fetched": True,
            "status": metadata.get("status"),
            "contentType": metadata.get("contentType"),
            "contentDisposition": metadata.get("contentDisposition"),
            "sampleBytes": len(payload),
            "sampleSha256": sha256_bytes(payload),
            "pdfMagic": is_pdf,
            "recordIdentityVisible": record_identity_visible,
        }
        provenance.append(entry)

        if is_pdf:
            if not record_identity_visible:
                entry["rejected"] = "PDF route lacks record identity in published/final URL"
                continue
            # Discovery requests cap non-final responses. If Content-Length
            # proves the PDF is larger, fetch the complete object now.
            full_payload = payload
            content_length_header = metadata.get("contentLengthHeader")
            if content_length_header and int(content_length_header) > len(payload):
                full_payload, full_metadata = request_bytes(final_url)
                if not full_payload.startswith(b"%PDF-"):
                    entry["rejected"] = "full response lost PDF magic"
                    continue
                final_url = str(full_metadata.get("finalUrl") or final_url)
                content_type = str(full_metadata.get("contentType") or content_type)
            return DiscoveryResult(
                pdfBytes=full_payload,
                publishedRoute=url,
                finalUrl=final_url,
                contentType=content_type,
                routeStatus="published-pdf-route-acquired",
                provenance=provenance,
                errors=errors,
            )

        lowered_type = content_type.lower()
        suffix = ".json" if "json" in lowered_type else ".js" if "javascript" in lowered_type else ".html"
        (discovery_dir / safe_artifact_name(url, depth, suffix)).write_bytes(payload)

        if depth >= MAX_DISCOVERY_DEPTH:
            continue
        for child in extract_official_urls(payload, final_url):
            provenance.append(
                {
                    "url": child["url"],
                    "discoveredFrom": final_url,
                    "source": child["source"],
                    "depth": depth,
                    "fetched": False,
                }
            )
            enqueue(child["url"], final_url, child["source"], depth + 1)

    viewer_seen = any(
        any(marker in str(item.get("finalUrl", item.get("url", ""))).lower() for marker in ("viewer", "dlib", "libweb"))
        and item.get("fetched")
        for item in provenance
    )
    return DiscoveryResult(
        pdfBytes=None,
        publishedRoute=None,
        finalUrl=None,
        contentType=None,
        routeStatus=(
            "official-viewer-chain-inspected-no-pdf"
            if viewer_seen
            else "published-pdf-route-not-found"
        ),
        provenance=provenance,
        errors=errors,
    )


def render_contact_sheets(pdf_path: Path, destination: Path, *, columns: int = 4) -> list[str]:
    document = fitz.open(pdf_path)
    thumb_width = 360
    caption_height = 38
    gap = 12
    page_images: list[Image.Image] = []
    for page_index in range(document.page_count):
        page = document.load_page(page_index)
        rect = page.rect
        scale = thumb_width / rect.width
        pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        canvas = Image.new("RGB", (thumb_width, image.height + caption_height), "white")
        canvas.paste(image, (0, caption_height))
        draw = ImageDraw.Draw(canvas)
        draw.text((10, 10), f"PDF {page_index + 1:03d}", fill="black", font=ImageFont.load_default())
        page_images.append(canvas)

    rows_per_sheet = 4
    per_sheet = columns * rows_per_sheet
    names: list[str] = []
    for sheet_index in range(math.ceil(len(page_images) / per_sheet)):
        subset = page_images[sheet_index * per_sheet : (sheet_index + 1) * per_sheet]
        cell_height = max(image.height for image in subset)
        width = columns * thumb_width + (columns + 1) * gap
        rows = math.ceil(len(subset) / columns)
        height = rows * cell_height + (rows + 1) * gap
        sheet = Image.new("RGB", (width, height), "#d9d9d9")
        for index, image in enumerate(subset):
            x = gap + (index % columns) * (thumb_width + gap)
            y = gap + (index // columns) * (cell_height + gap)
            sheet.paste(image, (x, y))
        name = f"{pdf_path.stem}-contact-{sheet_index + 1:02d}.jpg"
        sheet.save(destination / name, quality=88, optimize=True)
        names.append(name)
    document.close()
    return names


@dataclass
class AcquisitionRecord:
    year: int
    label: str
    recordId: str
    historicalHoldId: str
    cardUrl: str
    cardBytes: int | None
    cardSha256: str | None
    publishedPdfRoute: str | None
    routeConstructed: bool
    routeStatus: str
    discoveryProvenanceFile: str | None
    discoveryErrors: list[str]
    finalPdfUrl: str | None
    contentType: str | None
    localPdf: str | None
    bytes: int | None
    sha256: str | None
    pdfFrames: int | None
    pdfMetadata: dict[str, Any]
    contactSheets: list[str]
    recordError: str | None
    ocrUsedForEvidence: bool
    syntheticContentUsed: bool
    archiveOriginalInspected: bool
    productionAuthorized: bool
    rightsState: str


def write_partial_manifest(results: list[AcquisitionRecord]) -> None:
    (OUTPUT / "manifest.partial.json").write_text(
        json.dumps([asdict(record) for record in results], ensure_ascii=False, indent=2) + "\n"
    )


def main() -> int:
    cards_dir = OUTPUT / "cards"
    discovery_dir = OUTPUT / "discovery"
    originals_dir = OUTPUT / "originals"
    contacts_dir = OUTPUT / "contact-sheets"
    for directory in (cards_dir, discovery_dir, originals_dir, contacts_dir):
        directory.mkdir(parents=True, exist_ok=True)

    results: list[AcquisitionRecord] = []
    for specification in RECORDS:
        record = AcquisitionRecord(
            year=specification["year"],
            label=specification["label"],
            recordId=specification["record_id"],
            historicalHoldId=specification["historical_hold_id"],
            cardUrl=specification["card_url"],
            cardBytes=None,
            cardSha256=None,
            publishedPdfRoute=None,
            routeConstructed=False,
            routeStatus="card-not-yet-fetched",
            discoveryProvenanceFile=None,
            discoveryErrors=[],
            finalPdfUrl=None,
            contentType=None,
            localPdf=None,
            bytes=None,
            sha256=None,
            pdfFrames=None,
            pdfMetadata={},
            contactSheets=[],
            recordError=None,
            ocrUsedForEvidence=False,
            syntheticContentUsed=False,
            archiveOriginalInspected=False,
            productionAuthorized=False,
            rightsState="open-digital-facsimile / reproduction-rights-unresolved",
        )
        try:
            card_bytes, _card_meta = request_bytes(specification["card_url"])
            record.cardBytes = len(card_bytes)
            record.cardSha256 = sha256_bytes(card_bytes)
            card_text = card_bytes.decode("utf-8", errors="replace")
            if specification["expected_extent_marker"] not in card_text:
                raise RuntimeError(
                    f"card lost extent marker {specification['expected_extent_marker']}"
                )
            card_path = cards_dir / f"rsl-{specification['record_id']}.html"
            card_path.write_bytes(card_bytes)

            discovery = discover_published_pdf(
                card_bytes,
                specification["card_url"],
                specification["record_id"],
                discovery_dir,
            )
            provenance_name = f"rsl-{specification['record_id']}-provenance.json"
            (discovery_dir / provenance_name).write_text(
                json.dumps(discovery.provenance, ensure_ascii=False, indent=2) + "\n"
            )
            record.discoveryProvenanceFile = provenance_name
            record.discoveryErrors = discovery.errors
            record.routeStatus = discovery.routeStatus
            record.publishedPdfRoute = discovery.publishedRoute
            record.finalPdfUrl = discovery.finalUrl
            record.contentType = discovery.contentType

            if discovery.pdfBytes is not None:
                local_name = (
                    f"mariengof-roman-bez-vranya-{specification['year']}-"
                    f"{specification['record_id']}.pdf"
                )
                pdf_path = originals_dir / local_name
                pdf_path.write_bytes(discovery.pdfBytes)
                document = fitz.open(pdf_path)
                record.pdfMetadata = {
                    key: value for key, value in document.metadata.items() if value
                }
                record.pdfFrames = document.page_count
                document.close()
                if (record.pdfFrames or 0) < 100:
                    raise RuntimeError(
                        f"acquired PDF has implausibly few frames: {record.pdfFrames}"
                    )
                record.localPdf = local_name
                record.bytes = len(discovery.pdfBytes)
                record.sha256 = sha256_bytes(discovery.pdfBytes)
                record.contactSheets = render_contact_sheets(pdf_path, contacts_dir)
        except Exception as error:  # noqa: BLE001 - preserve per-record diagnostics
            record.recordError = f"{type(error).__name__}: {error}"
            if record.routeStatus == "card-not-yet-fetched":
                record.routeStatus = "record-processing-error"
        results.append(record)
        write_partial_manifest(results)

    manifest = [asdict(record) for record in results]
    acquired = [record for record in results if record.bytes is not None]
    failed = [record for record in results if record.recordError]
    summary = {
        "status": (
            "2-RSL-CARDS / PUBLISHED-LINK-DISCOVERY / "
            "PARTIAL-OR-COMPLETE-ACQUISITION / NO-CONSTRUCTED-ROUTES / "
            "NO-OCR-EVIDENCE"
        ),
        "records": len(results),
        "cardsFetched": sum(record.cardBytes is not None for record in results),
        "publishedPdfRoutesFound": len(acquired),
        "publishedPdfRoutesMissing": len(results) - len(acquired),
        "acquiredPdfObjects": len(acquired),
        "recordErrors": len(failed),
        "totalPdfBytes": sum(record.bytes or 0 for record in acquired),
        "totalPdfFrames": sum(record.pdfFrames or 0 for record in acquired),
        "routeConstructed": False,
        "ocrUsedForEvidence": False,
        "syntheticContentUsed": False,
        "archiveOriginalsInspected": 0,
        "productionAuthorized": False,
        "rightsResolved": False,
    }
    (OUTPUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    )
    (OUTPUT / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n"
    )
    print(json.dumps({"summary": summary, "records": manifest}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # noqa: BLE001 - last-resort diagnostics
        OUTPUT.mkdir(parents=True, exist_ok=True)
        (OUTPUT / "fatal-error.txt").write_text(
            f"{type(error).__name__}: {error}\n",
            encoding="utf-8",
        )
        print(f"[yesenin-mariengof-pass13] {type(error).__name__}: {error}", file=sys.stderr)
        raise

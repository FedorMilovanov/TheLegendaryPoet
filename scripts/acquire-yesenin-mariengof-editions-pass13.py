#!/usr/bin/env python3
"""Acquire Mariengof 1927/1928 facsimiles through official RSL evidence routes.

Accepted route sources:
1. literal links in the official Search RSL card;
2. literal redirects/replacement rules in official dlib/viewer HTML;
3. API path templates present in official viewer.rsl.ru JavaScript, instantiated
   only with the document id exposed by that viewer route.

A facsimile is accepted only when response bytes begin with %PDF- and the
viewer metadata itself declares PDF as a downloadable format.
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
from dataclasses import asdict, dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urljoin, urlsplit, urlunsplit
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
    "official-rsl-evidence-route-client)"
)
OFFICIAL_SUFFIX = "rsl.ru"
MAX_CARD_LINKS = 80
MAX_VIEWER_SCRIPTS = 40
MAX_NON_PDF_BYTES = 16_000_000

RECORDS = (
    {
        "year": 1927,
        "label": "Роман без вранья. Первое издание",
        "record_id": "01009215492",
        "card_url": "https://search.rsl.ru/ru/record/01009215492",
        "historical_hold_id": "PW6-YE1-MARIENGOF-1927",
        "extent_marker": "154 с.",
    },
    {
        "year": 1928,
        "label": "Роман без вранья. Второе издание",
        "record_id": "01009215494",
        "card_url": "https://search.rsl.ru/ru/record/01009215494",
        "historical_hold_id": "PW6-YE1-MARIENGOF-1928",
        "extent_marker": "157 с.",
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


def ascii_url(url: str) -> str:
    """Percent-encode non-ASCII path/query without changing route semantics."""
    parts = urlsplit(url)
    path = quote(unquote(parts.path), safe="/%:@!$&'()*+,;=-._~")
    query = quote(unquote(parts.query), safe="=&%/:?@!$'()*+,;.-_~")
    fragment = quote(unquote(parts.fragment), safe="=&%/:?@!$'()*+,;.-_~")
    return urlunsplit((parts.scheme, parts.netloc, path, query, fragment))


def official(url: str) -> bool:
    host = (urlsplit(url).hostname or "").lower()
    return host == OFFICIAL_SUFFIX or host.endswith("." + OFFICIAL_SUFFIX)


def normalize_url(raw: str, base: str) -> str | None:
    value = html.unescape(raw.strip()).strip("\"' ")
    value = value.replace("\\/", "/").replace("\\u002F", "/")
    if not value or value.startswith(("javascript:", "mailto:", "tel:", "#")):
        return None
    if value.startswith("//"):
        value = "https:" + value
    absolute = urljoin(base, value)
    if not urlsplit(absolute).scheme.startswith("http") or not urlsplit(absolute).netloc:
        return None
    return ascii_url(absolute)


def request_bytes(
    url: str,
    *,
    max_bytes: int | None = None,
) -> tuple[bytes, dict[str, Any]]:
    requested = ascii_url(url)
    request = Request(
        requested,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": (
                "text/html,application/xhtml+xml,application/json,"
                "application/javascript,text/javascript,application/pdf;q=0.9,*/*;q=0.8"
            ),
            "Accept-Language": "ru,en;q=0.8",
        },
    )
    context = ssl.create_default_context()
    with urlopen(request, timeout=150, context=context) as response:
        data = response.read() if max_bytes is None else response.read(max_bytes)
        return data, {
            "requestedUrl": requested,
            "finalUrl": response.geturl(),
            "status": getattr(response, "status", None),
            "contentType": response.headers.get("Content-Type"),
            "contentDisposition": response.headers.get("Content-Disposition"),
            "contentLengthHeader": response.headers.get("Content-Length"),
        }


def extract_official_urls(payload: bytes, base: str) -> list[dict[str, str]]:
    text = payload.decode("utf-8", errors="replace")
    collector = LinkCollector()
    try:
        collector.feed(text)
    except Exception:
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
    for match in re.finditer(r"https?://[^\s\"'<>\\]+", text, flags=re.IGNORECASE):
        add(match.group(0), "inline:absolute-url")
    for match in re.finditer(r"https?:\\/\\/[^\s\"'<>]+", text, flags=re.IGNORECASE):
        add(match.group(0), "inline:escaped-absolute-url")
    keyed = re.compile(
        r"(?:href|src|url|uri|downloadUrl|download_url|viewerUrl|viewer_url|"
        r"fileUrl|file_url|manifestUrl|manifest_url|documentUrl|document_url|"
        r"pdfUrl|pdf_url|contentUrl|content_url)\s*[:=]\s*[\"']([^\"']+)[\"']",
        flags=re.IGNORECASE,
    )
    for match in keyed.finditer(text):
        add(match.group(1), "inline:keyed-url")
    return found


def interesting_card_link(url: str, record_id: str) -> bool:
    lowered = url.lower()
    return record_id in url or any(
        marker in lowered
        for marker in (
            "/view/",
            "viewer",
            "dlib",
            "download",
            ".pdf",
            "electronic",
            "document",
        )
    )


def save_payload(directory: Path, prefix: str, url: str, payload: bytes, content_type: str) -> str:
    lowered = content_type.lower()
    suffix = ".json" if "json" in lowered else ".js" if "javascript" in lowered else ".html"
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:18]
    name = f"{prefix}-{digest}{suffix}"
    (directory / name).write_bytes(payload)
    return name


def derive_viewer_route_from_dlib_html(
    requested_url: str,
    final_url: str,
    payload: bytes,
) -> tuple[str | None, str | None]:
    text = payload.decode("utf-8", errors="replace")
    marker_old = "location.href.replace('https://dlib.rsl.ru/', 'https://viewer.rsl.ru/rsl')"
    marker_double = 'location.href.replace("https://dlib.rsl.ru/", "https://viewer.rsl.ru/rsl")'
    if marker_old not in text and marker_double not in text:
        return None, None
    source = final_url if final_url.startswith("https://dlib.rsl.ru/") else requested_url
    if not source.startswith(("https://dlib.rsl.ru/", "http://dlib.rsl.ru/")):
        return None, None
    source = source.replace("http://dlib.rsl.ru/", "https://dlib.rsl.ru/", 1)
    derived = source.replace("https://dlib.rsl.ru/", "https://viewer.rsl.ru/rsl", 1)
    return ascii_url(derived), marker_old


def viewer_document_ids(urls: list[str], record_id: str) -> list[str]:
    candidates: list[str] = []
    for url in urls:
        for match in re.finditer(r"(?:^|/)(rsl\d{11}|\d{11})(?:$|[/?#])", url):
            value = match.group(1)
            if record_id in value and value not in candidates:
                candidates.append(value)
    # The official dlib replacement rule prepends literal `rsl` to the path.
    prefixed = f"rsl{record_id}"
    if prefixed not in candidates:
        candidates.append(prefixed)
    if record_id not in candidates:
        candidates.append(record_id)
    return candidates


def viewer_contract_evidence(payload: bytes) -> dict[str, bool]:
    text = payload.decode("utf-8", errors="replace")
    return {
        "apiBaseTemplate": '"/api/v1"' in text or '"/api/v1' in text or "/api/v1" in text,
        "documentInfoTemplate": "/document/" in text and "/info" in text,
        "downloadTemplate": "downloadDocument" in text and "/document/" in text,
        "downloadableFormats": "downloadableFormats" in text,
    }


@dataclass
class ApiProbe:
    documentId: str
    infoUrl: str
    infoStatus: int | None
    infoContentType: str | None
    infoFile: str | None
    infoSha256: str | None
    infoDocId: str | None
    downloadable: bool | None
    downloadableFormats: list[str]
    downloadUrl: str | None
    downloadStatus: int | None
    downloadContentType: str | None
    downloadPdfMagic: bool
    error: str | None


@dataclass
class AcquisitionRecord:
    year: int
    label: str
    recordId: str
    historicalHoldId: str
    cardUrl: str
    cardBytes: int | None = None
    cardSha256: str | None = None
    cardLinksInspected: int = 0
    firstHopFiles: list[str] = field(default_factory=list)
    derivedViewerRoutes: list[str] = field(default_factory=list)
    viewerFiles: list[str] = field(default_factory=list)
    viewerScriptFiles: list[str] = field(default_factory=list)
    viewerContractFiles: list[str] = field(default_factory=list)
    apiProbes: list[ApiProbe] = field(default_factory=list)
    publishedPdfRoute: str | None = None
    routeSource: str | None = None
    routeConstructed: bool = False
    routeDerivedFromPublishedContract: bool = False
    routeStatus: str = "card-not-fetched"
    finalPdfUrl: str | None = None
    contentType: str | None = None
    localPdf: str | None = None
    bytes: int | None = None
    sha256: str | None = None
    pdfFrames: int | None = None
    pdfMetadata: dict[str, Any] = field(default_factory=dict)
    contactSheets: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    ocrUsedForEvidence: bool = False
    syntheticContentUsed: bool = False
    archiveOriginalInspected: bool = False
    productionAuthorized: bool = False
    rightsState: str = "open-digital-facsimile / reproduction-rights-unresolved"


def download_json_info(
    viewer_origin: str,
    document_id: str,
    api_dir: Path,
) -> tuple[dict[str, Any] | None, ApiProbe]:
    info_url = f"{viewer_origin}/api/v1/document/{quote(document_id, safe='')}/info"
    probe = ApiProbe(
        documentId=document_id,
        infoUrl=info_url,
        infoStatus=None,
        infoContentType=None,
        infoFile=None,
        infoSha256=None,
        infoDocId=None,
        downloadable=None,
        downloadableFormats=[],
        downloadUrl=None,
        downloadStatus=None,
        downloadContentType=None,
        downloadPdfMagic=False,
        error=None,
    )
    try:
        payload, metadata = request_bytes(info_url, max_bytes=4_000_000)
        probe.infoStatus = metadata.get("status")
        probe.infoContentType = metadata.get("contentType")
        probe.infoSha256 = sha256_bytes(payload)
        name = f"document-{document_id}-info.json"
        (api_dir / name).write_bytes(payload)
        probe.infoFile = name
        data = json.loads(payload.decode("utf-8"))
        if not isinstance(data, dict):
            raise RuntimeError("document info response is not a JSON object")
        probe.infoDocId = str(data.get("docId")) if data.get("docId") is not None else None
        access = data.get("downloadAccess") or {}
        if isinstance(access, dict):
            value = access.get("isDownloadable")
            probe.downloadable = bool(value) if value is not None else None
            formats = access.get("downloadableFormats") or []
            if isinstance(formats, list):
                probe.downloadableFormats = [str(item) for item in formats]
        return data, probe
    except Exception as error:  # noqa: BLE001 - preserve API diagnostics
        probe.error = f"{type(error).__name__}: {error}"
        return None, probe


def try_api_download(
    viewer_origin: str,
    document_id: str,
    document_info: dict[str, Any],
    probe: ApiProbe,
) -> tuple[bytes | None, str | None, str | None]:
    access = document_info.get("downloadAccess") or {}
    if not isinstance(access, dict) or access.get("isDownloadable") is not True:
        return None, None, None
    formats = access.get("downloadableFormats") or []
    normalized = [str(value).lower() for value in formats] if isinstance(formats, list) else []
    if "pdf" not in normalized:
        return None, None, None
    download_url = f"{viewer_origin}/api/v1/document/{quote(document_id, safe='')}/pdf"
    probe.downloadUrl = download_url
    try:
        payload, metadata = request_bytes(download_url)
        probe.downloadStatus = metadata.get("status")
        probe.downloadContentType = metadata.get("contentType")
        probe.downloadPdfMagic = payload.startswith(b"%PDF-")
        if not probe.downloadPdfMagic:
            probe.error = "download endpoint did not return PDF magic"
            return None, None, None
        return payload, str(metadata.get("finalUrl") or download_url), str(metadata.get("contentType") or "")
    except Exception as error:  # noqa: BLE001
        probe.error = f"{type(error).__name__}: {error}"
        return None, None, None


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
        ImageDraw.Draw(canvas).text(
            (10, 10),
            f"PDF {page_index + 1:03d}",
            fill="black",
            font=ImageFont.load_default(),
        )
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


def write_manifest(results: list[AcquisitionRecord], name: str = "manifest.partial.json") -> None:
    (OUTPUT / name).write_text(
        json.dumps([asdict(record) for record in results], ensure_ascii=False, indent=2) + "\n"
    )


def main() -> int:
    cards_dir = OUTPUT / "cards"
    hops_dir = OUTPUT / "first-hops"
    viewer_dir = OUTPUT / "viewer"
    scripts_dir = OUTPUT / "viewer-scripts"
    api_dir = OUTPUT / "api"
    originals_dir = OUTPUT / "originals"
    contacts_dir = OUTPUT / "contact-sheets"
    for directory in (
        cards_dir,
        hops_dir,
        viewer_dir,
        scripts_dir,
        api_dir,
        originals_dir,
        contacts_dir,
    ):
        directory.mkdir(parents=True, exist_ok=True)

    results: list[AcquisitionRecord] = []
    for specification in RECORDS:
        record = AcquisitionRecord(
            year=specification["year"],
            label=specification["label"],
            recordId=specification["record_id"],
            historicalHoldId=specification["historical_hold_id"],
            cardUrl=specification["card_url"],
        )
        results.append(record)
        try:
            card_bytes, _card_metadata = request_bytes(specification["card_url"])
            record.cardBytes = len(card_bytes)
            record.cardSha256 = sha256_bytes(card_bytes)
            card_text = card_bytes.decode("utf-8", errors="replace")
            if specification["extent_marker"] not in card_text:
                raise RuntimeError(f"card lost extent marker {specification['extent_marker']}")
            (cards_dir / f"rsl-{specification['record_id']}.html").write_bytes(card_bytes)

            card_links = [
                entry
                for entry in extract_official_urls(card_bytes, specification["card_url"])
                if interesting_card_link(entry["url"], specification["record_id"])
            ][:MAX_CARD_LINKS]
            record.cardLinksInspected = len(card_links)
            viewer_routes: list[str] = []
            direct_pdf_payload: bytes | None = None
            direct_pdf_url: str | None = None
            direct_pdf_type: str | None = None

            for index, entry in enumerate(card_links, start=1):
                url = entry["url"]
                try:
                    payload, metadata = request_bytes(url, max_bytes=MAX_NON_PDF_BYTES)
                except (HTTPError, URLError, TimeoutError, OSError) as error:
                    record.errors.append(f"first hop {url}: {type(error).__name__}: {error}")
                    continue
                content_type = str(metadata.get("contentType") or "")
                file_name = save_payload(hops_dir, f"{specification['record_id']}-{index:02d}", url, payload, content_type)
                record.firstHopFiles.append(file_name)
                final_url = ascii_url(str(metadata.get("finalUrl") or url))
                if payload.startswith(b"%PDF-"):
                    if specification["record_id"] in url or specification["record_id"] in final_url:
                        direct_pdf_payload = payload
                        direct_pdf_url = final_url
                        direct_pdf_type = content_type
                        record.publishedPdfRoute = url
                        record.routeSource = f"Search RSL card: {entry['source']}"
                        break
                if "viewer.rsl.ru" in final_url and final_url not in viewer_routes:
                    viewer_routes.append(final_url)
                derived, rule = derive_viewer_route_from_dlib_html(url, final_url, payload)
                if derived and derived not in viewer_routes:
                    viewer_routes.append(derived)
                    record.derivedViewerRoutes.append(derived)
                    record.routeDerivedFromPublishedContract = True
                    record.routeSource = f"official dlib HTML replacement rule: {rule}"
                for child in extract_official_urls(payload, final_url):
                    if "viewer.rsl.ru" in child["url"] and child["url"] not in viewer_routes:
                        viewer_routes.append(child["url"])

            pdf_payload = direct_pdf_payload
            pdf_final_url = direct_pdf_url
            pdf_content_type = direct_pdf_type

            viewer_urls_seen: list[str] = []
            viewer_origins: list[str] = []
            contract_payloads: list[tuple[str, bytes]] = []
            script_urls_seen: set[str] = set()

            if pdf_payload is None:
                for viewer_index, viewer_url in enumerate(viewer_routes, start=1):
                    try:
                        payload, metadata = request_bytes(viewer_url, max_bytes=MAX_NON_PDF_BYTES)
                    except (HTTPError, URLError, TimeoutError, OSError) as error:
                        record.errors.append(
                            f"viewer {viewer_url}: {type(error).__name__}: {error}"
                        )
                        continue
                    final_url = ascii_url(str(metadata.get("finalUrl") or viewer_url))
                    if final_url not in viewer_urls_seen:
                        viewer_urls_seen.append(final_url)
                    origin_parts = urlsplit(final_url)
                    viewer_origin = f"{origin_parts.scheme}://{origin_parts.netloc}"
                    if viewer_origin not in viewer_origins:
                        viewer_origins.append(viewer_origin)
                    content_type = str(metadata.get("contentType") or "")
                    name = save_payload(
                        viewer_dir,
                        f"{specification['record_id']}-{viewer_index:02d}",
                        viewer_url,
                        payload,
                        content_type,
                    )
                    record.viewerFiles.append(name)
                    if payload.startswith(b"%PDF-"):
                        pdf_payload = payload
                        pdf_final_url = final_url
                        pdf_content_type = content_type
                        record.publishedPdfRoute = viewer_url
                        record.routeSource = record.routeSource or "published viewer route"
                        break
                    for child in extract_official_urls(payload, final_url):
                        child_url = child["url"]
                        path = urlsplit(child_url).path.lower()
                        if not path.endswith((".js", ".mjs")) or child_url in script_urls_seen:
                            continue
                        if len(script_urls_seen) >= MAX_VIEWER_SCRIPTS:
                            break
                        script_urls_seen.add(child_url)
                        try:
                            script_payload, script_metadata = request_bytes(
                                child_url,
                                max_bytes=MAX_NON_PDF_BYTES,
                            )
                        except (HTTPError, URLError, TimeoutError, OSError) as error:
                            record.errors.append(
                                f"viewer script {child_url}: {type(error).__name__}: {error}"
                            )
                            continue
                        script_name = save_payload(
                            scripts_dir,
                            specification["record_id"],
                            child_url,
                            script_payload,
                            str(script_metadata.get("contentType") or "application/javascript"),
                        )
                        record.viewerScriptFiles.append(script_name)
                        evidence = viewer_contract_evidence(script_payload)
                        if all(evidence.values()):
                            record.viewerContractFiles.append(script_name)
                            contract_payloads.append((child_url, script_payload))

            record.derivedViewerRoutes = list(dict.fromkeys(record.derivedViewerRoutes))
            record.viewerFiles = list(dict.fromkeys(record.viewerFiles))
            record.viewerScriptFiles = list(dict.fromkeys(record.viewerScriptFiles))
            record.viewerContractFiles = list(dict.fromkeys(record.viewerContractFiles))

            if pdf_payload is None and contract_payloads:
                record.routeDerivedFromPublishedContract = True
                route_candidates = viewer_urls_seen + viewer_routes + record.derivedViewerRoutes
                document_ids = viewer_document_ids(route_candidates, specification["record_id"])
                for viewer_origin in viewer_origins or ["https://viewer.rsl.ru"]:
                    if not viewer_origin.endswith("rsl.ru"):
                        continue
                    for document_id in document_ids:
                        info, probe = download_json_info(viewer_origin, document_id, api_dir)
                        record.apiProbes.append(probe)
                        if info is None:
                            continue
                        payload, final_url, content_type = try_api_download(
                            viewer_origin,
                            document_id,
                            info,
                            probe,
                        )
                        if payload is None:
                            continue
                        pdf_payload = payload
                        pdf_final_url = final_url
                        pdf_content_type = content_type
                        record.publishedPdfRoute = probe.downloadUrl
                        record.routeSource = (
                            "official viewer JS contract: /api/v1 + "
                            "/document/{id}/info + /document/{id}/{format}"
                        )
                        break
                    if pdf_payload is not None:
                        break

            if pdf_payload is not None:
                local_name = (
                    f"mariengof-roman-bez-vranya-{specification['year']}-"
                    f"{specification['record_id']}.pdf"
                )
                pdf_path = originals_dir / local_name
                pdf_path.write_bytes(pdf_payload)
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
                record.bytes = len(pdf_payload)
                record.sha256 = sha256_bytes(pdf_payload)
                record.finalPdfUrl = pdf_final_url
                record.contentType = pdf_content_type
                record.contactSheets = render_contact_sheets(pdf_path, contacts_dir)
                record.routeStatus = "published-or-contract-derived-pdf-acquired"
            elif record.apiProbes:
                record.routeStatus = "viewer-api-inspected-download-unavailable"
            elif record.viewerFiles:
                record.routeStatus = "official-viewer-inspected-no-api-contract"
            else:
                record.routeStatus = "published-viewer-or-pdf-route-not-resolved"
        except Exception as error:  # noqa: BLE001 - preserve per-record diagnostics
            record.errors.append(f"record processing: {type(error).__name__}: {error}")
            if record.routeStatus == "card-not-fetched":
                record.routeStatus = "record-processing-error"
        write_manifest(results)

    acquired = [record for record in results if record.bytes is not None]
    summary = {
        "status": (
            "2-RSL-CARDS / OFFICIAL-CARD-VIEWER-API-CONTRACT / "
            "PARTIAL-OR-COMPLETE-ACQUISITION / NO-ARBITRARY-ROUTE-GUESSING / "
            "NO-OCR-EVIDENCE"
        ),
        "records": len(results),
        "cardsFetched": sum(record.cardBytes is not None for record in results),
        "viewerContractsVerified": sum(bool(record.viewerContractFiles) for record in results),
        "apiInfoResponses": sum(
            sum(probe.infoStatus == 200 for probe in record.apiProbes) for record in results
        ),
        "acquiredPdfObjects": len(acquired),
        "totalPdfBytes": sum(record.bytes or 0 for record in acquired),
        "totalPdfFrames": sum(record.pdfFrames or 0 for record in acquired),
        "routeConstructed": False,
        "routeDerivedFromPublishedContract": any(
            record.routeDerivedFromPublishedContract for record in results
        ),
        "ocrUsedForEvidence": False,
        "syntheticContentUsed": False,
        "archiveOriginalsInspected": 0,
        "productionAuthorized": False,
        "rightsResolved": False,
    }
    write_manifest(results, "manifest.json")
    (OUTPUT / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n"
    )
    print(json.dumps({"summary": summary, "records": [asdict(r) for r in results]}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # noqa: BLE001
        OUTPUT.mkdir(parents=True, exist_ok=True)
        (OUTPUT / "fatal-error.txt").write_text(
            f"{type(error).__name__}: {error}\n",
            encoding="utf-8",
        )
        print(f"[yesenin-mariengof-pass13] {type(error).__name__}: {error}", file=sys.stderr)
        raise

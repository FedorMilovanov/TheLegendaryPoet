#!/usr/bin/env python3
"""Probe the literal official RSL viewer API chain for Mariengof 1928.

No route is reconstructed from the catalogue record number. The document id is
accepted only when it appears in a viewer URL reached from the literal Search
RSL card link and the literal dlib replacement rule returned by RSL itself.
"""

from __future__ import annotations

import hashlib
import html
import json
import os
import re
import ssl
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import quote, unquote, urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen

OUTPUT = Path(
    os.environ.get(
        "YESENIN_MARIENGOF_OUTPUT",
        "artifacts/yesenin-mariengof-editions-pass13",
    )
) / "viewer-api-probe"
CARD_URL = "https://search.rsl.ru/ru/record/01009215494"
USER_AGENT = (
    "Mozilla/5.0 (compatible; TheLegendaryPoetResearch/1.0; "
    "literal-rsl-viewer-api-probe)"
)
MAX_RESOURCE_BYTES = 20_000_000


class ResourceCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.scripts: list[str] = []
        self.preloads: list[str] = []
        self.prefetches: list[str] = []
        self.links: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag.lower() == "script" and values.get("src"):
            self.scripts.append(values["src"] or "")
        if tag.lower() == "link" and values.get("href"):
            rel = (values.get("rel") or "").lower()
            as_value = (values.get("as") or "").lower()
            href = values["href"] or ""
            if "preload" in rel and as_value == "script":
                self.preloads.append(href)
            elif "prefetch" in rel and href.lower().split("?", 1)[0].endswith((".js", ".mjs")):
                self.prefetches.append(href)
        if tag.lower() == "a" and values.get("href"):
            self.links.append(values["href"] or "")


def ascii_url(url: str) -> str:
    parts = urlsplit(url)
    path = quote(unquote(parts.path), safe="/%:@!$&'()*+,;=-._~")
    query = quote(unquote(parts.query), safe="=&%/:?@!$'()*+,;.-_~")
    fragment = quote(unquote(parts.fragment), safe="=&%/:?@!$'()*+,;.-_~")
    return urlunsplit((parts.scheme, parts.netloc, path, query, fragment))


def official(url: str) -> bool:
    host = (urlsplit(url).hostname or "").lower()
    return host == "rsl.ru" or host.endswith(".rsl.ru")


def fetch(url: str, *, max_bytes: int | None = None) -> tuple[bytes, dict[str, Any]]:
    requested = ascii_url(url)
    request = Request(
        requested,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/json,application/javascript,text/javascript,application/pdf,*/*;q=0.8",
            "Accept-Language": "ru,en;q=0.8",
        },
    )
    with urlopen(request, timeout=150, context=ssl.create_default_context()) as response:
        payload = response.read() if max_bytes is None else response.read(max_bytes)
        return payload, {
            "requestedUrl": requested,
            "finalUrl": response.geturl(),
            "status": getattr(response, "status", None),
            "contentType": response.headers.get("Content-Type"),
            "contentDisposition": response.headers.get("Content-Disposition"),
            "bytes": len(payload),
            "sha256": hashlib.sha256(payload).hexdigest(),
        }


def normalize(raw: str, base: str) -> str | None:
    value = html.unescape(raw.strip()).strip("\"' ").replace("\\/", "/")
    if not value or value.startswith(("#", "javascript:", "mailto:", "tel:")):
        return None
    absolute = ascii_url(urljoin(base, value))
    return absolute if official(absolute) else None


def save(directory: Path, prefix: str, url: str, payload: bytes, content_type: str | None) -> str:
    directory.mkdir(parents=True, exist_ok=True)
    lowered = (content_type or "").lower()
    suffix = ".json" if "json" in lowered else ".js" if "javascript" in lowered else ".html"
    name = f"{prefix}-{hashlib.sha256(url.encode()).hexdigest()[:16]}{suffix}"
    (directory / name).write_bytes(payload)
    return name


def unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))


@dataclass
class ContractEvidence:
    apiV1: bool = False
    documentPath: bool = False
    infoPath: bool = False
    downloadableFormats: bool = False
    isDownloadable: bool = False
    downloadDocument: bool = False
    formatEndpoint: bool = False

    def merge(self, payload: bytes) -> None:
        text = payload.decode("utf-8", errors="replace")
        self.apiV1 = self.apiV1 or "/api/v1" in text
        self.documentPath = self.documentPath or "/document/" in text
        self.infoPath = self.infoPath or "/info" in text
        self.downloadableFormats = self.downloadableFormats or "downloadableFormats" in text
        self.isDownloadable = self.isDownloadable or "isDownloadable" in text
        self.downloadDocument = self.downloadDocument or "downloadDocument" in text
        self.formatEndpoint = self.formatEndpoint or bool(
            re.search(r"/document/[\"']?\s*\+?[^\n]{0,300}/[\"']?\s*\+?[^\n]{0,300}format", text)
        )

    def sufficient(self) -> bool:
        return (
            self.apiV1
            and self.documentPath
            and self.infoPath
            and self.downloadableFormats
            and self.isDownloadable
            and (self.downloadDocument or self.formatEndpoint)
        )


def find_literal_card_view(card: bytes) -> str:
    text = card.decode("utf-8", errors="replace")
    match = re.search(
        r'href=["\']([^"\']*/ru/view/01009215494\?redirect=[^"\']+)["\']',
        text,
        flags=re.IGNORECASE,
    )
    if not match:
        raise RuntimeError("official card lost literal /ru/view/ redirect link")
    route = normalize(match.group(1), CARD_URL)
    if not route:
        raise RuntimeError("literal card viewer route is not on an official RSL host")
    return route


def derive_literal_viewer_route(requested: str, final_url: str, payload: bytes) -> tuple[str, str]:
    text = payload.decode("utf-8", errors="replace")
    rule = "location.href.replace('https://dlib.rsl.ru/', 'https://viewer.rsl.ru/rsl')"
    alternate = 'location.href.replace("https://dlib.rsl.ru/", "https://viewer.rsl.ru/rsl")'
    if rule not in text and alternate not in text:
        raise RuntimeError("official dlib response lost its literal viewer replacement rule")
    source = final_url if final_url.startswith("https://dlib.rsl.ru/") else requested
    source = source.replace("http://dlib.rsl.ru/", "https://dlib.rsl.ru/", 1)
    if not source.startswith("https://dlib.rsl.ru/"):
        raise RuntimeError("replacement source is not a literal dlib.rsl.ru URL")
    return ascii_url(source.replace("https://dlib.rsl.ru/", "https://viewer.rsl.ru/rsl", 1)), rule


def literal_document_id(viewer_url: str) -> str:
    path = urlsplit(viewer_url).path
    match = re.search(r"/(rsl\d{11})(?:$|/)", path)
    if not match:
        raise RuntimeError(f"viewer URL exposes no literal rsl document id: {viewer_url}")
    return match.group(1)


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    resources_dir = OUTPUT / "resources"
    api_dir = OUTPUT / "api"
    originals_dir = OUTPUT / "originals"
    for directory in (resources_dir, api_dir, originals_dir):
        directory.mkdir(parents=True, exist_ok=True)

    report: dict[str, Any] = {
        "status": "LITERAL-CARD-DLIB-VIEWER-API-CHAIN",
        "routeConstructed": False,
        "recordIdUsedToInventRoute": False,
        "ocrUsedForEvidence": False,
        "syntheticContentUsed": False,
        "archiveOriginalInspected": False,
        "productionAuthorized": False,
        "rightsState": "open-digital-facsimile / reproduction-rights-unresolved",
    }

    card, card_meta = fetch(CARD_URL)
    (OUTPUT / "card-01009215494.html").write_bytes(card)
    report["card"] = card_meta
    card_view = find_literal_card_view(card)
    report["literalCardViewUrl"] = card_view

    first_hop, first_meta = fetch(card_view, max_bytes=MAX_RESOURCE_BYTES)
    (OUTPUT / "card-view-response.html").write_bytes(first_hop)
    report["cardViewResponse"] = first_meta

    viewer_url, replacement_rule = derive_literal_viewer_route(
        card_view,
        str(first_meta.get("finalUrl") or card_view),
        first_hop,
    )
    report["viewerReplacementRule"] = replacement_rule
    report["literalViewerUrl"] = viewer_url
    document_id = literal_document_id(viewer_url)
    report["literalViewerDocumentId"] = document_id

    viewer_html, viewer_meta = fetch(viewer_url, max_bytes=MAX_RESOURCE_BYTES)
    (OUTPUT / "viewer.html").write_bytes(viewer_html)
    report["viewer"] = viewer_meta

    collector = ResourceCollector()
    collector.feed(viewer_html.decode("utf-8", errors="replace"))
    ordered_raw = collector.scripts + collector.preloads + collector.prefetches
    resource_urls = unique(
        [candidate for raw in ordered_raw if (candidate := normalize(raw, viewer_url))]
    )
    report["publishedJavascriptResources"] = resource_urls

    evidence = ContractEvidence()
    saved_resources: list[dict[str, Any]] = []
    # Direct scripts and preload scripts contain the application contract. Prefetch
    # chunks are then inspected until the distributed contract is complete.
    for index, resource_url in enumerate(resource_urls, start=1):
        path = urlsplit(resource_url).path.lower()
        if not path.endswith((".js", ".mjs")):
            continue
        try:
            payload, metadata = fetch(resource_url, max_bytes=MAX_RESOURCE_BYTES)
        except Exception as error:
            saved_resources.append(
                {"url": resource_url, "error": f"{type(error).__name__}: {error}"}
            )
            continue
        evidence.merge(payload)
        name = save(
            resources_dir,
            f"{index:03d}",
            resource_url,
            payload,
            str(metadata.get("contentType") or "application/javascript"),
        )
        saved_resources.append({"url": resource_url, "file": name, "metadata": metadata})
        if evidence.sufficient() and index >= len(unique(collector.scripts + collector.preloads)):
            break

    report["resourcesInspected"] = saved_resources
    report["contractEvidence"] = asdict(evidence)
    report["contractSufficient"] = evidence.sufficient()
    if not evidence.sufficient():
        raise RuntimeError(f"distributed official viewer contract incomplete: {asdict(evidence)}")

    viewer_origin = f"{urlsplit(viewer_url).scheme}://{urlsplit(viewer_url).netloc}"
    info_url = f"{viewer_origin}/api/v1/document/{quote(document_id, safe='')}/info"
    info_payload, info_meta = fetch(info_url, max_bytes=4_000_000)
    (api_dir / "document-info.json").write_bytes(info_payload)
    report["infoUrl"] = info_url
    report["infoResponse"] = info_meta
    info = json.loads(info_payload.decode("utf-8"))
    if not isinstance(info, dict):
        raise RuntimeError("viewer info response is not a JSON object")
    report["infoTopLevelKeys"] = sorted(info.keys())

    access = info.get("downloadAccess") or {}
    if not isinstance(access, dict):
        access = {}
    downloadable = access.get("isDownloadable") is True
    formats = [str(value).lower() for value in access.get("downloadableFormats", [])]
    report["downloadAccess"] = {
        "isDownloadable": downloadable,
        "downloadableFormats": formats,
    }

    acquired: dict[str, Any] | None = None
    if downloadable and "pdf" in formats:
        download_url = f"{viewer_origin}/api/v1/document/{quote(document_id, safe='')}/pdf"
        pdf, pdf_meta = fetch(download_url)
        if not pdf.startswith(b"%PDF-"):
            raise RuntimeError("server-authorized PDF endpoint returned non-PDF bytes")
        pdf_path = originals_dir / "mariengof-roman-bez-vranya-1928.pdf"
        pdf_path.write_bytes(pdf)
        acquired = {
            "downloadUrl": download_url,
            "response": pdf_meta,
            "localFile": pdf_path.name,
            "bytes": len(pdf),
            "sha256": hashlib.sha256(pdf).hexdigest(),
        }
    report["acquiredPdf"] = acquired

    (OUTPUT / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

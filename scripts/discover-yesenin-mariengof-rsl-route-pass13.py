#!/usr/bin/env python3
"""Discover published RSL viewer/PDF routes for Mariengof 1928 without URL guessing."""

from __future__ import annotations

import hashlib
import html
import json
import os
import re
import ssl
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

RECORD_URL = "https://search.rsl.ru/ru/record/01009198586"
OUTPUT = Path(os.environ.get("YESENIN_MARIENGOF_RSL_OUTPUT", "artifacts/yesenin-mariengof-rsl-pass13"))
USER_AGENT = "Mozilla/5.0 (compatible; TheLegendaryPoetResearch/1.0; evidence-route-discovery)"
KEYWORDS = (
    "pdf",
    "viewer",
    "download",
    "electronic",
    "digital",
    "dlib",
    "libweb",
    "fulltext",
    "object",
    "manifest",
    "iiif",
    "01009198586",
)
OFFICIAL_HOST_SUFFIXES = ("rsl.ru",)


class LinkCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.values: list[tuple[str, str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for key, value in attrs:
            if not value:
                continue
            if key.lower() in {"href", "src", "action", "content", "data-url", "data-href"}:
                self.values.append((tag, key, value.strip()))


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def request_bytes(url: str, *, range_probe: bool = False) -> tuple[bytes, dict[str, Any]]:
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/json,application/pdf;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru,en;q=0.8",
    }
    if range_probe:
        headers["Range"] = "bytes=0-65535"
    request = Request(url, headers=headers)
    context = ssl.create_default_context()
    with urlopen(request, timeout=45, context=context) as response:
        data = response.read(2_000_000 if range_probe else 20_000_000)
        metadata = {
            "requestedUrl": url,
            "finalUrl": response.geturl(),
            "status": getattr(response, "status", None),
            "contentType": response.headers.get("Content-Type"),
            "contentDisposition": response.headers.get("Content-Disposition"),
            "contentLengthHeader": response.headers.get("Content-Length"),
            "sampleBytes": len(data),
            "sampleSha256": sha256(data),
        }
        return data, metadata


def normalize_candidate(raw: str) -> str | None:
    value = html.unescape(raw.strip()).strip("\"' ")
    if not value or value.startswith(("javascript:", "mailto:", "tel:", "#")):
        return None
    if value.startswith("//"):
        value = "https:" + value
    absolute = urljoin(RECORD_URL, value)
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    return absolute


def official(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return any(host == suffix or host.endswith("." + suffix) for suffix in OFFICIAL_HOST_SUFFIXES)


def relevant(url: str) -> bool:
    lowered = url.lower()
    return any(keyword in lowered for keyword in KEYWORDS)


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    raw, record_meta = request_bytes(RECORD_URL)
    record_path = OUTPUT / "rsl-record-01009198586.html"
    record_path.write_bytes(raw)

    text = raw.decode("utf-8", errors="replace")
    collector = LinkCollector()
    collector.feed(text)

    discovered: dict[str, dict[str, Any]] = {}

    def add(raw_value: str, source: str) -> None:
        candidate = normalize_candidate(raw_value)
        if not candidate:
            return
        entry = discovered.setdefault(
            candidate,
            {
                "url": candidate,
                "sources": [],
                "officialRslHost": official(candidate),
                "keywordRelevant": relevant(candidate),
                "routeConstructed": False,
            },
        )
        if source not in entry["sources"]:
            entry["sources"].append(source)

    for tag, key, value in collector.values:
        add(value, f"html:{tag}[{key}]")

    for match in re.finditer(r"https?://[^\s\"'<>\\]+", text, flags=re.IGNORECASE):
        add(match.group(0), "inline:absolute-url")

    for match in re.finditer(
        r"(?:href|src|url|downloadUrl|viewerUrl|fileUrl|manifestUrl)\s*[:=]\s*[\"']([^\"']+)[\"']",
        text,
        flags=re.IGNORECASE,
    ):
        add(match.group(1), "inline:keyed-url")

    keyword_lines: list[dict[str, Any]] = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        lowered = line.lower()
        hits = [keyword for keyword in KEYWORDS if keyword in lowered]
        if hits:
            keyword_lines.append(
                {
                    "line": line_number,
                    "keywords": hits,
                    "text": line.strip()[:1200],
                }
            )

    candidates = [
        entry
        for entry in discovered.values()
        if entry["officialRslHost"] and entry["keywordRelevant"]
    ]
    candidates.sort(key=lambda entry: entry["url"])

    probes: list[dict[str, Any]] = []
    for entry in candidates[:80]:
        try:
            _sample, metadata = request_bytes(entry["url"], range_probe=True)
            metadata.update(
                {
                    "sources": entry["sources"],
                    "officialRslHost": True,
                    "routeConstructed": False,
                    "error": None,
                }
            )
            probes.append(metadata)
        except HTTPError as error:
            probes.append(
                {
                    "requestedUrl": entry["url"],
                    "status": error.code,
                    "contentType": error.headers.get("Content-Type") if error.headers else None,
                    "sources": entry["sources"],
                    "officialRslHost": True,
                    "routeConstructed": False,
                    "error": f"HTTPError: {error}",
                }
            )
        except (URLError, TimeoutError, OSError) as error:
            probes.append(
                {
                    "requestedUrl": entry["url"],
                    "status": None,
                    "contentType": None,
                    "sources": entry["sources"],
                    "officialRslHost": True,
                    "routeConstructed": False,
                    "error": f"{type(error).__name__}: {error}",
                }
            )

    pdf_like = [
        probe
        for probe in probes
        if "pdf" in str(probe.get("contentType", "")).lower()
        or ".pdf" in str(probe.get("finalUrl", probe.get("requestedUrl", ""))).lower()
        or "attachment" in str(probe.get("contentDisposition", "")).lower()
    ]
    viewer_like = [
        probe
        for probe in probes
        if any(
            keyword in str(probe.get("finalUrl", probe.get("requestedUrl", ""))).lower()
            for keyword in ("viewer", "dlib", "libweb", "object", "manifest", "iiif")
        )
    ]

    result = {
        "status": "RSL-RECORD-FETCHED / PUBLISHED-LINKS-ONLY / NO-CONSTRUCTED-ROUTES",
        "recordUrl": RECORD_URL,
        "recordMetadata": record_meta,
        "recordBytes": len(raw),
        "recordSha256": sha256(raw),
        "allExtractedUrls": len(discovered),
        "officialRelevantCandidates": len(candidates),
        "probedCandidates": len(probes),
        "pdfLikeCandidates": pdf_like,
        "viewerLikeCandidates": viewer_like,
        "routeConstructed": False,
        "ocrUsed": False,
        "syntheticContentUsed": False,
        "documentGenerated": False,
        "productionAuthorized": False,
        "rightsResolved": False,
    }

    (OUTPUT / "candidates.json").write_text(json.dumps(candidates, ensure_ascii=False, indent=2) + "\n")
    (OUTPUT / "probes.json").write_text(json.dumps(probes, ensure_ascii=False, indent=2) + "\n")
    (OUTPUT / "keyword-lines.json").write_text(
        json.dumps(keyword_lines, ensure_ascii=False, indent=2) + "\n"
    )
    (OUTPUT / "summary.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # noqa: BLE001 - diagnostics must preserve unexpected failures
        print(f"[yesenin-mariengof-rsl-pass13] {type(error).__name__}: {error}", file=sys.stderr)
        raise

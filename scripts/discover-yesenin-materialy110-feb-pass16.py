#!/usr/bin/env python3
"""Inspect official FEB publication surfaces for `Материалы к биографии`, p.110.

This diagnostic preserves exact HTML bytes and extracts only literal institution-
published links or resource addresses. It does not invent a page URL from the
book title/year/page number, use OCR, or promote a description to page evidence.
"""

from __future__ import annotations

import hashlib
from html import unescape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import shutil
import sys
from typing import Any
from urllib.parse import urljoin
from urllib.request import Request, urlopen

OUTPUT = Path(os.environ.get("YESENIN_MATERIALY110_OUTPUT", "artifacts/yesenin-materialy110-feb-pass16"))
USER_AGENT = "TheLegendaryPoet-Research-Materialy110-Discovery/1.1 (+https://github.com/FedorMilovanov/TheLegendaryPoet)"
SURFACES = [
    {"id": "feb-description", "url": "https://feb-web.ru/feb/esenin/critics/-g1992.html"},
    {"id": "feb-sitemap", "url": "https://feb-web.ru/feb/esenin/sitemap.htm"},
]


class SurfaceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[dict[str, str]] = []
        self.href: str | None = None
        self.text: list[str] = []
        self.scripts: list[str] = []
        self.base_href: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        lower = tag.lower()
        if lower == "a" and values.get("href"):
            self.href = values["href"]
            self.text = []
        elif lower == "script" and values.get("src"):
            self.scripts.append(values["src"])
        elif lower == "base" and values.get("href"):
            self.base_href = values["href"]

    def handle_data(self, data: str) -> None:
        if self.href is not None:
            self.text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self.href is not None:
            self.links.append({"href": self.href, "text": " ".join("".join(self.text).split())})
            self.href = None
            self.text = []


def fetch(url: str) -> tuple[bytes, str, str, int]:
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "ru,en;q=0.7"})
    with urlopen(request, timeout=120) as response:
        return response.read(), response.geturl(), response.headers.get_content_type(), getattr(response, "status", 200)


def decode_html(data: bytes) -> tuple[str, str]:
    head = data[:4096].decode("ascii", errors="ignore")
    match = re.search(r"charset\s*=\s*['\"]?([A-Za-z0-9._-]+)", head, re.I)
    candidates = [match.group(1) if match else "", "windows-1251", "utf-8"]
    for encoding in candidates:
        if not encoding:
            continue
        try:
            return data.decode(encoding), encoding.lower()
        except (LookupError, UnicodeDecodeError):
            continue
    return data.decode("windows-1251", errors="replace"), "windows-1251-replacement"


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value).replace("\\/", "/")).strip()


def classify_url(url: str, label: str = "") -> dict[str, Any]:
    lower = f"{url} {label}".casefold()
    return {
        "url": url,
        "anchorText": label,
        "mentionsMaterialy": "материалы к биографии" in lower,
        "mentionsPage110": bool(re.search(r"(?:с\.|стр\.|page|p\.)\s*110(?:\D|$)", lower)),
        "looksPageLevel": any(token in url.lower() for token in ("?cmd=p", "-110-", "p110", "page=110")),
        "looksDocument": any(token in url.lower() for token in (".pdf", "download", "viewer")),
        "isDescriptionResource": "-g1992.html" in url.lower(),
    }


def inspect_surface(surface: dict[str, str]) -> dict[str, Any]:
    data, final_url, content_type, status = fetch(surface["url"])
    if status != 200:
        raise RuntimeError(f"{surface['id']} returned HTTP {status}")
    if len(data) < 2_000:
        raise RuntimeError(f"{surface['id']} returned only {len(data)} bytes")
    raw_name = f"{surface['id']}.html"
    (OUTPUT / "raw").joinpath(raw_name).write_bytes(data)
    text, encoding = decode_html(data)
    parser = SurfaceParser()
    parser.feed(text)
    resolution_base = urljoin(final_url, parser.base_href) if parser.base_href else final_url

    links: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for link in parser.links:
        absolute = urljoin(resolution_base, link["href"])
        anchor = normalize(link["text"])
        key = (absolute, anchor)
        if key in seen:
            continue
        seen.add(key)
        links.append(classify_url(absolute, anchor))

    normalized_html = normalize(text).casefold()
    literal_urls = sorted(
        set(
            re.findall(
                r"https?://[^\"'<>\s]+",
                unescape(text).replace("\\/", "/"),
                flags=re.I,
            )
        )
    )
    literal_resources = [classify_url(url) for url in literal_urls]
    route_candidates = [
        item
        for item in [*links, *literal_resources]
        if item["mentionsMaterialy"]
        or item["mentionsPage110"]
        or item["looksPageLevel"]
        or item["looksDocument"]
        or item["isDescriptionResource"]
    ]
    return {
        **surface,
        "finalUrl": final_url,
        "status": status,
        "contentType": content_type,
        "detectedEncoding": encoding,
        "htmlBytes": len(data),
        "htmlSha256": hashlib.sha256(data).hexdigest(),
        "rawHtml": f"raw/{raw_name}",
        "titleAndEditionPresent": (
            "с. а. есенин" in normalized_html
            and "материалы к биографии" in normalized_html
            and "1992" in normalized_html
            and "446" in normalized_html
        ),
        "page110LiteralInHtml": bool(
            re.search(r"(?:с\.|стр\.|page|p\.)\s*110(?:\D|$)", normalized_html)
        ),
        "links": links,
        "routeCandidates": route_candidates,
        "literalResourceUrls": literal_resources,
        "scriptSources": [urljoin(resolution_base, source) for source in parser.scripts],
    }


def main() -> int:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    (OUTPUT / "raw").mkdir(parents=True)
    results: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    for surface in SURFACES:
        print(f"Inspecting {surface['id']} ...", flush=True)
        try:
            results.append(inspect_surface(surface))
        except Exception as exc:  # noqa: BLE001
            errors.append({"id": surface["id"], "error": str(exc)})

    all_candidates = [
        {"surface": item["id"], **candidate}
        for item in results
        for candidate in item["routeCandidates"]
    ]
    literal_page_routes = [
        candidate
        for candidate in all_candidates
        if candidate["looksPageLevel"]
        and (candidate["mentionsMaterialy"] or candidate["mentionsPage110"])
        and not candidate["isDescriptionResource"]
    ]
    literal_document_routes = [
        candidate
        for candidate in all_candidates
        if candidate["looksDocument"] and candidate["mentionsMaterialy"]
    ]
    description_resources = [
        candidate for candidate in all_candidates if candidate["isDescriptionResource"]
    ]
    resolution = (
        "literal-page-route-published"
        if literal_page_routes
        else "literal-document-route-published"
        if literal_document_routes
        else "bibliographic-description-only-copy-required"
    )
    summary = {
        "target": "С. А. Есенин: Материалы к биографии, p.110",
        "surfaces": len(SURFACES),
        "completedSurfaces": len(results),
        "errors": errors,
        "resolutionState": resolution,
        "descriptionResources": description_resources,
        "literalPageRoutes": literal_page_routes,
        "literalDocumentRoutes": literal_document_routes,
        "pageUrlConstructed": False,
        "pdfRouteConstructed": False,
        "ocrUsed": False,
        "syntheticContentUsed": False,
        "page110VisuallyInspected": False,
        "productionAuthorized": False,
        "results": results,
    }
    (OUTPUT / "discovery.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (OUTPUT / "summary.md").write_text(
        "\n".join(
            [
                "# Materialy p.110 FEB discovery pass 16",
                "",
                f"- Resolution: `{resolution}`",
                f"- Description resources: `{len(description_resources)}`",
                f"- Literal page routes: `{len(literal_page_routes)}`",
                f"- Literal document routes: `{len(literal_document_routes)}`",
                "- Constructed routes: `false`",
                "- OCR: `false`",
                "- Page 110 visually inspected: `false`",
                "- Production authorization: `false`",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"[yesenin-materialy110-feb-pass16] {exc}", file=sys.stderr)
        sys.exit(1)

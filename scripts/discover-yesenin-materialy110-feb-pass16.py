#!/usr/bin/env python3
"""Inspect official FEB publication surfaces for `Материалы к биографии`, p.110.

This diagnostic preserves exact HTML bytes and extracts only literal institution-
published links. It does not invent a page URL from the year/title, use OCR, or
promote a bibliographic description to page-level evidence.
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
USER_AGENT = "TheLegendaryPoet-Research-Materialy110-Discovery/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)"
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
        self.script_src: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag.lower() == "a" and values.get("href"):
            self.href = values["href"]
            self.text = []
        elif tag.lower() == "script":
            self.script_src = values.get("src")
            if self.script_src:
                self.scripts.append(self.script_src)

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


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value).replace("\\/", "/")).strip()


def inspect_surface(surface: dict[str, str]) -> dict[str, Any]:
    data, final_url, content_type, status = fetch(surface["url"])
    if status != 200:
        raise RuntimeError(f"{surface['id']} returned HTTP {status}")
    if len(data) < 2_000:
        raise RuntimeError(f"{surface['id']} returned only {len(data)} bytes")
    raw_name = f"{surface['id']}.html"
    (OUTPUT / "raw").joinpath(raw_name).write_bytes(data)
    text = data.decode("utf-8", errors="replace")
    parser = SurfaceParser()
    parser.feed(text)

    links: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for link in parser.links:
        absolute = urljoin(final_url, link["href"])
        anchor = normalize(link["text"])
        key = (absolute, anchor)
        if key in seen:
            continue
        seen.add(key)
        lower = f"{absolute} {anchor}".casefold()
        links.append(
            {
                "url": absolute,
                "anchorText": anchor,
                "mentionsMaterialy": "материалы к биографии" in lower,
                "mentionsPage110": bool(re.search(r"(?:с\.|стр\.|page)\s*110(?:\D|$)", lower)),
                "looksPageLevel": any(token in absolute.lower() for token in ("?cmd=p", "-110-", "p110", "page=110")),
                "looksDocument": any(token in absolute.lower() for token in (".pdf", "download", "viewer")),
            }
        )

    normalized_html = normalize(text).casefold()
    literal_urls = sorted(set(re.findall(r"https?://[^\"'<>\s]+", unescape(text).replace("\\/", "/"))))
    route_candidates = [
        link
        for link in links
        if link["mentionsMaterialy"] or link["mentionsPage110"] or link["looksPageLevel"] or link["looksDocument"]
    ]
    return {
        **surface,
        "finalUrl": final_url,
        "status": status,
        "contentType": content_type,
        "htmlBytes": len(data),
        "htmlSha256": hashlib.sha256(data).hexdigest(),
        "rawHtml": f"raw/{raw_name}",
        "titleAndEditionPresent": (
            "с. а. есенин" in normalized_html
            and "материалы к биографии" in normalized_html
            and "1992" in normalized_html
            and "446" in normalized_html
        ),
        "page110LiteralInHtml": bool(re.search(r"(?:с\.|стр\.|page)\s*110(?:\D|$)", normalized_html)),
        "links": links,
        "routeCandidates": route_candidates,
        "literalAbsoluteUrls": literal_urls,
        "scriptSources": [urljoin(final_url, source) for source in parser.scripts],
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

    literal_page_routes = [
        {"surface": item["id"], **link}
        for item in results
        for link in item["routeCandidates"]
        if link["looksPageLevel"] and (link["mentionsMaterialy"] or link["mentionsPage110"])
    ]
    literal_document_routes = [
        {"surface": item["id"], **link}
        for item in results
        for link in item["routeCandidates"]
        if link["looksDocument"] and link["mentionsMaterialy"]
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
    (OUTPUT / "discovery.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT / "summary.md").write_text(
        "\n".join(
            [
                "# Materialy p.110 FEB discovery pass 16",
                "",
                f"- Resolution: `{resolution}`",
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

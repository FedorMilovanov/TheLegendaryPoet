#!/usr/bin/env python3
"""Fetch exact NEB child issue pages and extract their published PDF routes."""

from __future__ import annotations

import hashlib
from html import unescape
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
from typing import Any
from urllib.parse import urljoin
from urllib.request import Request, urlopen

OUTPUT = Path(os.environ.get("YESENIN_NEB_SERIAL_OUTPUT", "artifacts/yesenin-neb-serial-discovery-pass10"))
DISCOVERY = OUTPUT / "discovery.json"
USER_AGENT = "TheLegendaryPoet-Research-Discovery/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)"
TARGET_LABELS = ["1921, № 2", "1921, № 7", "1921, № 8", "1921, № 11-12"]


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.current_href: str | None = None
        self.current_text: list[str] = []
        self.links: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        href = dict(attrs).get("href")
        if href:
            self.current_href = href
            self.current_text = []

    def handle_data(self, data: str) -> None:
        if self.current_href is not None:
            self.current_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a" or self.current_href is None:
            return
        self.links.append(
            {
                "href": self.current_href,
                "text": " ".join("".join(self.current_text).split()),
            }
        )
        self.current_href = None
        self.current_text = []


def normalize_url(value: str, base_url: str) -> str:
    value = unescape(value).replace("\\/", "/").replace("\\u0026", "&")
    value = value.rstrip("\\")
    return urljoin(base_url, value)


def pdf_candidates(html_text: str, final_url: str) -> tuple[list[str], list[dict[str, str]]]:
    parser = LinkParser()
    parser.feed(html_text)
    links = [
        {
            "url": normalize_url(item["href"], final_url),
            "text": item["text"],
        }
        for item in parser.links
    ]

    normalized = unescape(html_text).replace("\\/", "/").replace("\\u0026", "&")
    raw_candidates = re.findall(
        r"(?:https?://rusneb\.ru)?/local/tools/exalead/getFiles\.php\?[^\"'<>\s\\]+",
        normalized,
        flags=re.IGNORECASE,
    )
    raw_candidates.extend(
        item["url"]
        for item in links
        if "getFiles.php" in item["url"] or "doc_type=pdf" in item["url"].lower()
    )

    routes: list[str] = []
    for candidate in raw_candidates:
        route = normalize_url(candidate, final_url)
        if "getFiles.php" not in route or "doc_type=pdf" not in route.lower():
            continue
        if route not in routes:
            routes.append(route)

    diagnostic_links = [
        item
        for item in links
        if any(token in item["url"].lower() for token in ("pdf", "getfiles", "viewer", "download"))
    ]
    return routes, diagnostic_links


def fetch(url: str) -> tuple[bytes, str, str, int]:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.2",
            "Accept-Language": "ru,en;q=0.7",
        },
    )
    with urlopen(request, timeout=90) as response:
        return (
            response.read(),
            response.geturl(),
            response.headers.get_content_type(),
            getattr(response, "status", 200),
        )


def main() -> int:
    if not DISCOVERY.exists():
        raise RuntimeError(f"missing parent discovery manifest {DISCOVERY}")
    parent = json.loads(DISCOVERY.read_text(encoding="utf-8"))
    theatre = next(
        result
        for result in parent["results"]
        if result["id"] == "NEB-SERIAL-YE1-TEATRALNAYA-MOSKVA-1921"
    )
    issue_map = {item["label"]: item for item in theatre["issueMap"]}

    raw_dir = OUTPUT / "raw-child-pages"
    raw_dir.mkdir(parents=True, exist_ok=True)
    details: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []

    for label in TARGET_LABELS:
        item = issue_map.get(label)
        if not item or not item.get("catalogueCode") or not item.get("url"):
            errors.append({"label": label, "error": "missing child catalogue record in parent discovery"})
            continue
        code = item["catalogueCode"]
        try:
            data, final_url, content_type, status = fetch(item["url"])
            if status != 200:
                raise RuntimeError(f"HTTP {status}")
            if len(data) < 5_000:
                raise RuntimeError(f"implausibly small HTML: {len(data)} bytes")
            html_text = data.decode("utf-8", errors="replace")
            path = raw_dir / f"{code}.html"
            path.write_bytes(data)
            routes, diagnostic_links = pdf_candidates(html_text, final_url)
            details.append(
                {
                    "label": label,
                    "catalogueCode": code,
                    "catalogueUrl": item["url"],
                    "finalUrl": final_url,
                    "contentType": content_type,
                    "status": status,
                    "htmlBytes": len(data),
                    "htmlSha256": hashlib.sha256(data).hexdigest(),
                    "rawHtml": str(path.relative_to(OUTPUT)),
                    "pdfRoutes": routes,
                    "diagnosticLinks": diagnostic_links,
                    "routeConstructed": False,
                    "ocrUsed": False,
                    "synthetic": False,
                    "productionAuthorized": False,
                }
            )
        except Exception as exc:  # noqa: BLE001
            errors.append({"label": label, "catalogueCode": code, "error": str(exc)})

    result = {
        "targetIssues": len(TARGET_LABELS),
        "completedIssues": len(details),
        "errors": errors,
        "routesDiscoveredFromChildHtml": True,
        "routeConstructionAllowed": False,
        "ocrUsed": False,
        "syntheticContentUsed": False,
        "productionAuthorized": False,
        "issues": details,
    }
    (OUTPUT / "child-pdf-routes.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"[yesenin-neb-serial-pdf-routes-pass10] {exc}", file=sys.stderr)
        sys.exit(1)

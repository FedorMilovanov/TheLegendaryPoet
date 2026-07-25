#!/usr/bin/env python3
"""Fetch accepted NEB newspaper issue cards and extract literal PDF routes.

Input cards must come from the official-search discovery manifest. No catalogue
ID is accepted from configuration, no neighbouring-ID arithmetic is performed,
and no PDF route is constructed from a catalogue code.
"""

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

SEARCH_OUTPUT = Path(
    os.environ.get(
        "YESENIN_NEWSPAPER_SEARCH_OUTPUT",
        "artifacts/yesenin-newspaper-neb-search-pass14",
    )
)
DISCOVERY = SEARCH_OUTPUT / "discovery.json"
USER_AGENT = (
    "TheLegendaryPoet-Research-Newspaper-Route-Discovery/1.0 "
    "(+https://github.com/FedorMilovanov/TheLegendaryPoet)"
)


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.href: str | None = None
        self.text: list[str] = []
        self.links: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        href = dict(attrs).get("href")
        if href:
            self.href = href
            self.text = []

    def handle_data(self, data: str) -> None:
        if self.href is not None:
            self.text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a" or self.href is None:
            return
        self.links.append({"href": self.href, "text": " ".join("".join(self.text).split())})
        self.href = None
        self.text = []


def normalize_url(value: str, base_url: str) -> str:
    value = unescape(value).replace("\/", "/").replace("\\u0026", "&").rstrip("\\")
    return urljoin(base_url, value)


def pdf_candidates(html_text: str, final_url: str) -> tuple[list[str], list[dict[str, str]]]:
    parser = LinkParser()
    parser.feed(html_text)
    links = [
        {"url": normalize_url(item["href"], final_url), "text": item["text"]}
        for item in parser.links
    ]
    normalized = unescape(html_text).replace("\/", "/").replace("\\u0026", "&")
    raw = re.findall(
        r"(?:https?://rusneb\.ru)?/local/tools/exalead/getFiles\.php\?[^\"'<>\s\\]+",
        normalized,
        flags=re.I,
    )
    raw.extend(
        item["url"]
        for item in links
        if "getFiles.php" in item["url"] or "doc_type=pdf" in item["url"].lower()
    )
    routes: list[str] = []
    for candidate in raw:
        route = normalize_url(candidate, final_url)
        if "getFiles.php" not in route or "doc_type=pdf" not in route.lower():
            continue
        if route not in routes:
            routes.append(route)
    diagnostic = [
        item
        for item in links
        if any(token in item["url"].lower() for token in ("pdf", "getfiles", "viewer", "download"))
    ]
    return routes, diagnostic


def fetch(url: str) -> tuple[bytes, str, str, int]:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.2",
            "Accept-Language": "ru,en;q=0.7",
        },
    )
    with urlopen(request, timeout=120) as response:
        return (
            response.read(),
            response.geturl(),
            response.headers.get_content_type(),
            getattr(response, "status", 200),
        )


def main() -> int:
    if not DISCOVERY.exists():
        raise RuntimeError(f"missing official-search manifest {DISCOVERY}")
    search = json.loads(DISCOVERY.read_text(encoding="utf-8"))
    accepted = [item for item in search["results"] if item.get("acceptedIssueCard")]
    raw_dir = SEARCH_OUTPUT / "raw-issue-cards"
    raw_dir.mkdir(parents=True, exist_ok=True)

    issues: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    for target in accepted:
        card = target["acceptedIssueCard"]
        code = card["catalogueCode"]
        try:
            data, final_url, content_type, status = fetch(card["url"])
            if status != 200:
                raise RuntimeError(f"HTTP {status}")
            if len(data) < 5_000:
                raise RuntimeError(f"implausibly small card HTML: {len(data)} bytes")
            path = raw_dir / f"{code}.html"
            path.write_bytes(data)
            html_text = data.decode("utf-8", errors="replace")
            routes, diagnostic = pdf_candidates(html_text, final_url)
            issues.append(
                {
                    "targetId": target["id"],
                    "date": target["date"],
                    "issueNumber": target["issueNumber"],
                    "catalogueCode": code,
                    "catalogueUrl": card["url"],
                    "acceptedSearchAnchorText": card["anchorText"],
                    "finalUrl": final_url,
                    "status": status,
                    "contentType": content_type,
                    "htmlBytes": len(data),
                    "htmlSha256": hashlib.sha256(data).hexdigest(),
                    "rawHtml": str(path.relative_to(SEARCH_OUTPUT)),
                    "pdfRoutes": routes,
                    "diagnosticLinks": diagnostic,
                    "routeConstructed": False,
                    "ocrUsed": False,
                    "syntheticContentUsed": False,
                    "productionAuthorized": False,
                }
            )
        except Exception as exc:  # noqa: BLE001
            errors.append({"targetId": target["id"], "catalogueCode": code, "error": str(exc)})

    result = {
        "acceptedSearchCards": len(accepted),
        "completedIssueCards": len(issues),
        "cardsWithLiteralPdfRoutes": sum(1 for issue in issues if issue["pdfRoutes"]),
        "errors": errors,
        "routeConstructionAllowed": False,
        "ocrUsed": False,
        "syntheticContentUsed": False,
        "productionAuthorized": False,
        "issues": issues,
    }
    (SEARCH_OUTPUT / "issue-pdf-routes.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"[yesenin-newspaper-neb-pdf-routes-pass14] {exc}", file=sys.stderr)
        sys.exit(1)

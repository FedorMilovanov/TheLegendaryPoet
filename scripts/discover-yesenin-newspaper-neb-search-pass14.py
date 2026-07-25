#!/usr/bin/env python3
"""Discover exact 1921 newspaper issue cards through the official NEB search form.

The queries use independently established issue numbers, but a result is accepted
only when the server-rendered NEB anchor text literally contains the expected
title, year and issue number. The script preserves every response byte and hash.
It performs no OCR, no catalogue-ID arithmetic and no PDF-route construction.
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
from urllib.parse import quote, urlencode, urljoin
from urllib.request import Request, urlopen

OUTPUT = Path(
    os.environ.get(
        "YESENIN_NEWSPAPER_SEARCH_OUTPUT",
        "artifacts/yesenin-newspaper-neb-search-pass14",
    )
)
USER_AGENT = (
    "TheLegendaryPoet-Research-Newspaper-Discovery/1.0 "
    "(+https://github.com/FedorMilovanov/TheLegendaryPoet)"
)
CATALOGUE_PATTERN = re.compile(r"(?:https?://rusneb\.ru)?/catalog/([^/\"'?#&<>]+)/?", re.I)

TARGETS: list[dict[str, Any]] = [
    {
        "id": "NEB-YE1-IZVESTIA-1921-08-24",
        "titleToken": "Известия",
        "issueNumber": "186",
        "date": "24 августа 1921",
        "queries": [
            "Известия газета федеральный выпуск 1921 № 186",
            "Известия 1921 № 186 24 августа",
        ],
    },
    {
        "id": "NEB-YE1-IZVESTIA-1921-11-09",
        "titleToken": "Известия",
        "issueNumber": "251",
        "date": "9 ноября 1921",
        "queries": [
            "Известия газета федеральный выпуск 1921 № 251",
            "Известия 1921 № 251 9 ноября",
        ],
    },
    {
        "id": "NEB-YE1-IZVESTIA-1921-11-23",
        "titleToken": "Известия",
        "issueNumber": "263",
        "date": "23 ноября 1921",
        "queries": [
            "Известия газета федеральный выпуск 1921 № 263",
            "Известия 1921 № 263 23 ноября",
        ],
    },
    {
        "id": "NEB-YE1-PRAVDA-1921-11-09",
        "titleToken": "Правда",
        "issueNumber": "252",
        "date": "9 ноября 1921",
        "queries": [
            "Правда газета Москва 1921 № 252",
            "Правда 1921 № 252 9 ноября",
        ],
    },
]


class AnchorParser(HTMLParser):
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


def normalize(value: str) -> str:
    value = unescape(value).replace("\/", "/").replace("№", "№ ")
    value = re.sub(r"\s+", " ", value)
    value = re.sub(r"№\s+", "№ ", value)
    return value.strip()


def fetch_search(query: str) -> tuple[bytes, str, str, int, str]:
    params = urlencode({"q": query, "access[]": "open"}, doseq=True)
    url = f"https://rusneb.ru/search/?{params}"
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.2",
            "Accept-Language": "ru,en;q=0.7",
        },
    )
    with urlopen(request, timeout=120) as response:
        status = getattr(response, "status", 200)
        content_type = response.headers.get_content_type()
        final_url = response.geturl()
        data = response.read()
    return data, final_url, content_type, status, url


def exact_issue_text(text: str, target: dict[str, Any]) -> bool:
    normalized = normalize(text).casefold()
    title_ok = target["titleToken"].casefold() in normalized
    year_ok = "1921" in normalized
    issue = re.compile(rf"(?:№|n)\s*{re.escape(target['issueNumber'])}(?:\D|$)", re.I)
    return title_ok and year_ok and bool(issue.search(normalized))


def discover_target(target: dict[str, Any]) -> dict[str, Any]:
    searches: list[dict[str, Any]] = []
    exact_by_url: dict[str, dict[str, str]] = {}

    for index, query in enumerate(target["queries"], start=1):
        data, final_url, content_type, status, requested_url = fetch_search(query)
        if status != 200:
            raise RuntimeError(f"{target['id']} query {index} returned HTTP {status}")
        if len(data) < 5_000:
            raise RuntimeError(f"{target['id']} query {index} returned only {len(data)} HTML bytes")

        raw_name = f"{target['id'].lower()}-query-{index:02d}.html"
        (OUTPUT / "raw" / raw_name).write_bytes(data)
        text = data.decode("utf-8", errors="replace")
        parser = AnchorParser()
        parser.feed(text)
        catalogue_links: list[dict[str, Any]] = []
        seen: set[tuple[str, str]] = set()
        for link in parser.links:
            absolute = urljoin(final_url, link["href"])
            match = CATALOGUE_PATTERN.search(absolute)
            if not match:
                continue
            normalized_text = normalize(link["text"])
            key = (absolute, normalized_text)
            if key in seen:
                continue
            seen.add(key)
            item = {
                "url": absolute,
                "catalogueCode": match.group(1),
                "anchorText": normalized_text,
                "exactIssueText": exact_issue_text(normalized_text, target),
            }
            catalogue_links.append(item)
            if item["exactIssueText"]:
                exact_by_url[absolute] = {
                    "url": absolute,
                    "catalogueCode": item["catalogueCode"],
                    "anchorText": normalized_text,
                }

        searches.append(
            {
                "query": query,
                "requestedUrl": requested_url,
                "finalUrl": final_url,
                "status": status,
                "contentType": content_type,
                "htmlBytes": len(data),
                "htmlSha256": hashlib.sha256(data).hexdigest(),
                "rawHtml": f"raw/{raw_name}",
                "catalogueLinks": catalogue_links,
            }
        )

    exact_matches = sorted(exact_by_url.values(), key=lambda item: item["url"])
    accepted = exact_matches[0] if len(exact_matches) == 1 else None
    return {
        **target,
        "searches": searches,
        "exactMatches": exact_matches,
        "acceptedIssueCard": accepted,
        "resolutionState": (
            "one-literal-official-search-match"
            if accepted
            else "no-literal-official-search-match"
            if not exact_matches
            else "ambiguous-multiple-literal-official-search-matches"
        ),
        "catalogueIdConstructed": False,
        "pdfRouteConstructed": False,
        "ocrUsed": False,
        "syntheticContentUsed": False,
        "productionAuthorized": False,
    }


def main() -> int:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    (OUTPUT / "raw").mkdir(parents=True)

    results: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    for target in TARGETS:
        print(f"Searching official NEB for {target['id']} ...", flush=True)
        try:
            results.append(discover_target(target))
        except Exception as exc:  # noqa: BLE001
            errors.append({"id": target["id"], "error": str(exc)})

    summary = {
        "targets": len(TARGETS),
        "completedTargets": len(results),
        "errors": errors,
        "acceptedIssueCards": sum(1 for item in results if item["acceptedIssueCard"]),
        "catalogueIdsConstructed": False,
        "pdfRoutesConstructed": False,
        "ocrUsed": False,
        "syntheticContentUsed": False,
        "productionAuthorized": False,
        "results": results,
    }
    (OUTPUT / "discovery.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    lines = [
        "# Yesenin newspaper NEB search pass 14",
        "",
        "Official server-rendered `/search/` results only. No OCR, ID arithmetic or PDF-route construction.",
        "",
        "| Target | Issue | Resolution | Accepted card |",
        "|---|---:|---|---|",
    ]
    for item in results:
        accepted = item["acceptedIssueCard"]
        lines.append(
            f"| {item['id']} | {item['issueNumber']} | {item['resolutionState']} | "
            f"{accepted['catalogueCode'] if accepted else 'NONE'} |"
        )
    if errors:
        lines.extend(["", "## Errors", "", "```json", json.dumps(errors, ensure_ascii=False, indent=2), "```"])
    (OUTPUT / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"[yesenin-newspaper-neb-search-pass14] {exc}", file=sys.stderr)
        sys.exit(1)

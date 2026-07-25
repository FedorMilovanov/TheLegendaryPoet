#!/usr/bin/env python3
"""Inspect official Search RSL client code that assigns free-access viewer links.

This diagnostic does not invent viewer or PDF routes. It fetches only URLs
published by the two official catalogue cards, saves the relevant Search RSL
JavaScript, and records bounded snippets around the code that mutates the
`freeAccessAlertReadLink` anchor or requests document-access metadata.
"""

from __future__ import annotations

import hashlib
import html
import json
import os
import re
import ssl
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
) / "search-rsl-access-discovery"
USER_AGENT = (
    "Mozilla/5.0 (compatible; TheLegendaryPoetResearch/1.0; "
    "official-search-rsl-access-route-inspector)"
)
CARDS = (
    ("01009215492", "https://search.rsl.ru/ru/record/01009215492"),
    ("01009215494", "https://search.rsl.ru/ru/record/01009215494"),
)
KEYWORDS = (
    "freeAccessAlertReadLink",
    "freeAccessAlert",
    "document-access",
    "free-access",
    "rsl-record",
    "readLink",
    "viewUrl",
    "redirect",
    "/ru/view/",
    "ajax",
)


class ScriptCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.scripts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "script":
            return
        values = dict(attrs)
        src = values.get("src")
        if src:
            self.scripts.append(src)


def ascii_url(url: str) -> str:
    parts = urlsplit(url)
    path = quote(unquote(parts.path), safe="/%:@!$&'()*+,;=-._~")
    query = quote(unquote(parts.query), safe="=&%/:?@!$'()*+,;.-_~")
    fragment = quote(unquote(parts.fragment), safe="=&%/:?@!$'()*+,;.-_~")
    return urlunsplit((parts.scheme, parts.netloc, path, query, fragment))


def official_search_rsl(url: str) -> bool:
    return (urlsplit(url).hostname or "").lower() == "search.rsl.ru"


def fetch(url: str) -> tuple[bytes, dict[str, Any]]:
    requested = ascii_url(url)
    request = Request(
        requested,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/javascript,text/javascript,*/*;q=0.8",
            "Accept-Language": "ru,en;q=0.8",
        },
    )
    with urlopen(request, timeout=90, context=ssl.create_default_context()) as response:
        payload = response.read(8_000_000)
        return payload, {
            "requestedUrl": requested,
            "finalUrl": response.geturl(),
            "status": getattr(response, "status", None),
            "contentType": response.headers.get("Content-Type"),
            "bytes": len(payload),
            "sha256": hashlib.sha256(payload).hexdigest(),
        }


def snippets(text: str, *, radius: int = 900) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    seen: set[tuple[str, int]] = set()
    for keyword in KEYWORDS:
        start = 0
        while True:
            index = text.find(keyword, start)
            if index < 0:
                break
            key = (keyword, index)
            if key not in seen:
                seen.add(key)
                found.append(
                    {
                        "keyword": keyword,
                        "offset": index,
                        "text": text[max(0, index - radius) : index + radius],
                    }
                )
            start = index + len(keyword)
    return found


def route_literals(text: str, base: str) -> list[str]:
    candidates: list[str] = []
    patterns = (
        r"[\"']([^\"']*(?:view|access|document|record|redirect)[^\"']*)[\"']",
        r"url\s*:\s*[\"']([^\"']+)[\"']",
        r"(?:get|post)\s*\(\s*[\"']([^\"']+)[\"']",
    )
    for pattern in patterns:
        for match in re.finditer(pattern, text, flags=re.IGNORECASE):
            raw = html.unescape(match.group(1)).replace("\\/", "/")
            if not raw or len(raw) > 500:
                continue
            absolute = ascii_url(urljoin(base, raw))
            if official_search_rsl(absolute) and absolute not in candidates:
                candidates.append(absolute)
    return candidates


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    script_urls: list[str] = []
    report: dict[str, Any] = {
        "status": "OFFICIAL-SEARCH-RSL-CLIENT-CODE-INSPECTED / NO-ROUTE-GUESSING",
        "cards": [],
        "scripts": [],
        "routeLiterals": [],
        "freeAccessAnchorMutations": [],
        "routeConstructed": False,
        "ocrUsedForEvidence": False,
        "productionAuthorized": False,
    }

    for record_id, card_url in CARDS:
        payload, metadata = fetch(card_url)
        card_name = f"card-{record_id}.html"
        (OUTPUT / card_name).write_bytes(payload)
        text = payload.decode("utf-8", errors="replace")
        collector = ScriptCollector()
        collector.feed(text)
        published_scripts: list[str] = []
        for raw in collector.scripts:
            candidate = ascii_url(urljoin(card_url, html.unescape(raw)))
            if not official_search_rsl(candidate) or candidate in published_scripts:
                continue
            published_scripts.append(candidate)
            if candidate not in script_urls:
                script_urls.append(candidate)
        anchor_match = re.search(
            r'id=["\']freeAccessAlertReadLink["\'][^>]*href=["\']([^"\']*)["\']',
            text,
            flags=re.IGNORECASE,
        )
        report["cards"].append(
            {
                "recordId": record_id,
                "url": card_url,
                "file": card_name,
                "metadata": metadata,
                "publishedScripts": published_scripts,
                "freeAccessAnchorHref": anchor_match.group(1) if anchor_match else None,
                "cardSnippets": snippets(text),
            }
        )

    for index, url in enumerate(script_urls, start=1):
        try:
            payload, metadata = fetch(url)
            suffix = Path(urlsplit(url).path).name or f"script-{index:02d}.js"
            name = f"{index:02d}-{suffix}"
            (OUTPUT / name).write_bytes(payload)
            text = payload.decode("utf-8", errors="replace")
            script_snippets = snippets(text)
            literals = route_literals(text, url)
            report["scripts"].append(
                {
                    "url": url,
                    "file": name,
                    "metadata": metadata,
                    "snippets": script_snippets,
                    "routeLiterals": literals,
                }
            )
            for literal in literals:
                if literal not in report["routeLiterals"]:
                    report["routeLiterals"].append(literal)
            for snippet in script_snippets:
                if snippet["keyword"] in {"freeAccessAlertReadLink", "freeAccessAlert"}:
                    report["freeAccessAnchorMutations"].append(
                        {"script": name, **snippet}
                    )
        except Exception as error:  # preserve diagnostic continuity
            report["scripts"].append(
                {
                    "url": url,
                    "error": f"{type(error).__name__}: {error}",
                }
            )

    (OUTPUT / "report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

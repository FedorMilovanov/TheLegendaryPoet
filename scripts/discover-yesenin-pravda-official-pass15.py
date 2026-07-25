#!/usr/bin/env python3
"""Discover the exact Moscow Pravda issue of 9 November 1921.

The pass searches official NEB without an open-access filter, preserves every
server response, and then fetches each literal candidate card. A candidate is
accepted only when the issue anchor gives 1921 no. 252 / 9 November and the card
itself identifies the Moscow central-party newspaper. No neighbouring-ID
arithmetic, OCR or PDF-route construction is allowed.
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
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen

OUTPUT = Path(
    os.environ.get(
        "YESENIN_PRAVDA_DISCOVERY_OUTPUT",
        "artifacts/yesenin-pravda-discovery-pass15",
    )
)
USER_AGENT = (
    "TheLegendaryPoet-Research-Pravda-Discovery/1.0 "
    "(+https://github.com/FedorMilovanov/TheLegendaryPoet)"
)
CATALOGUE_PATTERN = re.compile(r"(?:https?://rusneb\.ru)?/catalog/([^/\"'?#&<>]+)/?", re.I)
QUERIES = [
    "Правда газета Москва 1921 № 252 9 ноября",
    "Правда газета орган Центрального комитета РКП(б) 1921 № 252",
    "Правда 1921 № 252 09 ноября Москва",
    '"Правда" "1921" "№ 252"',
]
EXPECTED_PARENT_RSL = "https://search.rsl.ru/ru/record/01004548325"


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


def issue_anchor_candidate(text: str) -> bool:
    value = normalize(text).casefold()
    return (
        "правда" in value
        and "1921" in value
        and bool(re.search(r"(?:№|n)\s*252(?:\D|$)", value, re.I))
        and ("09 ноября" in value or "9 ноября" in value)
    )


def central_moscow_card(text: str) -> dict[str, bool]:
    value = normalize(text).casefold()
    return {
        "titlePravda": "правда" in value,
        "moscow": "москва" in value,
        "centralCommittee": "центрального комитета" in value or "цк ркп" in value or "цк вкп" in value,
        "newspaper": "газета" in value,
        "year1921": "1921" in value,
        "issue252": bool(re.search(r"(?:№|n)\s*252(?:\D|$)", value, re.I)),
        "date9November": "09 ноября" in value or "9 ноября" in value,
    }


def main() -> int:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    search_dir = OUTPUT / "raw-search"
    card_dir = OUTPUT / "raw-cards"
    search_dir.mkdir(parents=True)
    card_dir.mkdir(parents=True)

    searches: list[dict[str, Any]] = []
    candidates: dict[str, dict[str, str]] = {}
    errors: list[dict[str, str]] = []

    for index, query in enumerate(QUERIES, start=1):
        requested = f"https://rusneb.ru/search/?{urlencode({'q': query})}"
        try:
            data, final_url, content_type, status = fetch(requested)
            if status != 200:
                raise RuntimeError(f"HTTP {status}")
            if len(data) < 5_000:
                raise RuntimeError(f"implausibly small search HTML: {len(data)} bytes")
            raw_name = f"query-{index:02d}.html"
            (search_dir / raw_name).write_bytes(data)
            parser = AnchorParser()
            parser.feed(data.decode("utf-8", errors="replace"))
            literal: list[dict[str, Any]] = []
            for item in parser.links:
                absolute = urljoin(final_url, item["href"])
                match = CATALOGUE_PATTERN.search(absolute)
                if not match:
                    continue
                anchor = normalize(item["text"])
                candidate = issue_anchor_candidate(anchor)
                row = {
                    "url": absolute,
                    "catalogueCode": match.group(1),
                    "anchorText": anchor,
                    "issueAnchorCandidate": candidate,
                }
                literal.append(row)
                if candidate:
                    candidates[absolute] = {
                        "url": absolute,
                        "catalogueCode": match.group(1),
                        "anchorText": anchor,
                    }
            searches.append(
                {
                    "query": query,
                    "requestedUrl": requested,
                    "finalUrl": final_url,
                    "status": status,
                    "contentType": content_type,
                    "htmlBytes": len(data),
                    "htmlSha256": hashlib.sha256(data).hexdigest(),
                    "rawHtml": f"raw-search/{raw_name}",
                    "catalogueLinks": literal,
                }
            )
        except Exception as exc:  # noqa: BLE001
            errors.append({"query": query, "error": str(exc)})

    inspected: list[dict[str, Any]] = []
    accepted: list[dict[str, Any]] = []
    for candidate in sorted(candidates.values(), key=lambda item: item["url"]):
        code = candidate["catalogueCode"]
        try:
            data, final_url, content_type, status = fetch(candidate["url"])
            if status != 200:
                raise RuntimeError(f"HTTP {status}")
            if len(data) < 5_000:
                raise RuntimeError(f"implausibly small card HTML: {len(data)} bytes")
            path = card_dir / f"{code}.html"
            path.write_bytes(data)
            text = data.decode("utf-8", errors="replace")
            checks = central_moscow_card(text)
            is_accepted = all(checks.values())
            row = {
                **candidate,
                "finalUrl": final_url,
                "status": status,
                "contentType": content_type,
                "htmlBytes": len(data),
                "htmlSha256": hashlib.sha256(data).hexdigest(),
                "rawHtml": f"raw-cards/{path.name}",
                "identityChecks": checks,
                "acceptedCentralMoscowIssue": is_accepted,
            }
            inspected.append(row)
            if is_accepted:
                accepted.append(row)
        except Exception as exc:  # noqa: BLE001
            errors.append({"catalogueCode": code, "error": str(exc)})

    result = {
        "target": "Правда, Москва, 9 ноября 1921, № 252",
        "expectedParentRsl": EXPECTED_PARENT_RSL,
        "queries": len(QUERIES),
        "completedSearches": len(searches),
        "literalIssueCandidates": len(candidates),
        "inspectedCandidateCards": len(inspected),
        "acceptedCentralMoscowCards": len(accepted),
        "resolutionState": (
            "one-literal-official-central-moscow-match"
            if len(accepted) == 1
            else "no-literal-official-central-moscow-match"
            if not accepted
            else "ambiguous-multiple-central-moscow-matches"
        ),
        "acceptedCard": accepted[0] if len(accepted) == 1 else None,
        "errors": errors,
        "catalogueIdConstructed": False,
        "pdfRouteConstructed": False,
        "ocrUsed": False,
        "syntheticContentUsed": False,
        "productionAuthorized": False,
        "searches": searches,
        "candidateCards": inspected,
    }
    (OUTPUT / "discovery.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (OUTPUT / "summary.md").write_text(
        "\n".join(
            [
                "# Pravda official discovery pass 15",
                "",
                f"- Resolution: `{result['resolutionState']}`",
                f"- Literal issue candidates: `{len(candidates)}`",
                f"- Accepted central Moscow cards: `{len(accepted)}`",
                "- Catalogue-ID arithmetic: `false`",
                "- OCR: `false`",
                "- Production authorization: `false`",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"[yesenin-pravda-discovery-pass15] {exc}", file=sys.stderr)
        sys.exit(1)

#!/usr/bin/env python3
"""Discover literal RSL access routes for Pravda no. 252, 9 November 1921.

This diagnostic preserves official RSL server responses and literal links only.
It never constructs a child record, viewer identifier, PDF route, or issue card
from neighbouring IDs. A result may be a bounded access state rather than an
acquired issue.
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
from urllib.error import HTTPError, URLError
from urllib.parse import quote_plus, urljoin, urlparse
from urllib.request import Request, urlopen

OUTPUT = Path(
    os.environ.get(
        "YESENIN_PRAVDA_RSL_ACCESS_OUTPUT",
        "artifacts/yesenin-pravda-rsl-access-pass26",
    )
)
USER_AGENT = (
    "TheLegendaryPoet-Research-Pravda-RSL-Access/1.0 "
    "(+https://github.com/FedorMilovanov/TheLegendaryPoet)"
)
PARENT_URL = "https://search.rsl.ru/ru/record/01004548325"
EXPECTED_PARENT_ID = "01004548325"
EXPECTED_TITLE = "Правда"
EXPECTED_DATE = "9 ноября 1921"
EXPECTED_ISSUE = 252

# These are literal official routes. The fragment route is exposed by the
# parent card itself; the two search URLs are discovery controls and cannot be
# promoted to an issue without a literal result anchor and matching card.
CONTROL_URLS = [
    PARENT_URL,
    f"https://search.rsl.ru/ru/fragment-eorder/rsl{EXPECTED_PARENT_ID}",
    "https://search.rsl.ru/ru/search?q=" + quote_plus('"Правда" "1921" "№ 252"'),
    "https://search.rsl.ru/ru/search?q=" + quote_plus('title:Правда "9 ноября 1921"'),
]


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[dict[str, str]] = []
        self.forms: list[dict[str, Any]] = []
        self._href: str | None = None
        self._link_text: list[str] = []
        self._form: dict[str, Any] | None = None
        self._text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        lower = tag.lower()
        if lower == "a" and values.get("href"):
            self._href = values["href"]
            self._link_text = []
        elif lower == "form":
            self._form = {
                "action": values.get("action", ""),
                "method": values.get("method", "get").lower(),
                "fields": [],
            }
        elif lower in {"input", "textarea", "select", "button"} and self._form is not None:
            self._form["fields"].append(
                {
                    "tag": lower,
                    "name": values.get("name", ""),
                    "type": values.get("type", ""),
                    "value": values.get("value", ""),
                }
            )

    def handle_data(self, data: str) -> None:
        self._text.append(data)
        if self._href is not None:
            self._link_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        lower = tag.lower()
        if lower == "a" and self._href is not None:
            self.links.append(
                {
                    "href": self._href,
                    "text": normalize("".join(self._link_text)),
                }
            )
            self._href = None
            self._link_text = []
        elif lower == "form" and self._form is not None:
            self.forms.append(self._form)
            self._form = None

    @property
    def visible_text(self) -> str:
        return normalize(" ".join(self._text))


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", unescape(value).replace("\u00a0", " ")).strip()


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def fetch(url: str) -> dict[str, Any]:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.2",
            "Accept-Language": "ru,en;q=0.7",
        },
    )
    try:
        with urlopen(request, timeout=120) as response:
            data = response.read()
            return {
                "requestedUrl": url,
                "finalUrl": response.geturl(),
                "status": getattr(response, "status", 200),
                "contentType": response.headers.get("Content-Type", ""),
                "bytes": len(data),
                "sha256": sha256(data),
                "data": data,
                "error": None,
            }
    except HTTPError as exc:
        data = exc.read()
        return {
            "requestedUrl": url,
            "finalUrl": exc.geturl(),
            "status": exc.code,
            "contentType": exc.headers.get("Content-Type", "") if exc.headers else "",
            "bytes": len(data),
            "sha256": sha256(data),
            "data": data,
            "error": f"HTTP {exc.code}",
        }
    except (URLError, TimeoutError, OSError) as exc:
        return {
            "requestedUrl": url,
            "finalUrl": url,
            "status": 0,
            "contentType": "",
            "bytes": 0,
            "sha256": sha256(b""),
            "data": b"",
            "error": str(exc),
        }


def safe_name(url: str, index: int) -> str:
    parsed = urlparse(url)
    label = re.sub(r"[^a-zA-Z0-9._-]+", "-", (parsed.path.strip("/") or "root"))
    return f"response-{index:02d}-{label[:80]}.bin"


def issue_marker(text: str) -> bool:
    value = normalize(text).casefold()
    has_issue = bool(re.search(r"(?:№|n)\s*252(?:\D|$)", value, re.I))
    has_date = "9 ноября 1921" in value or "09 ноября 1921" in value
    return "правда" in value and has_issue and has_date


def central_moscow_marker(text: str) -> dict[str, bool]:
    value = normalize(text).casefold()
    return {
        "titlePravda": "правда" in value,
        "year1921": "1921" in value,
        "issue252": bool(re.search(r"(?:№|n)\s*252(?:\D|$)", value, re.I)),
        "date9November": "9 ноября" in value or "09 ноября" in value,
        "moscow": "москва" in value,
        "centralPartyIdentity": (
            "центрального комитета" in value
            or "цк ркп" in value
            or "цк вкп" in value
            or "орган цк" in value
        ),
    }


def main() -> int:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    raw_dir = OUTPUT / "raw"
    raw_dir.mkdir(parents=True)

    responses: list[dict[str, Any]] = []
    literal_links: dict[str, dict[str, Any]] = {}
    parent_checks: dict[str, bool] = {}
    parent_fragment_links: list[dict[str, str]] = []
    parent_candidate_issue_links: list[dict[str, str]] = []

    queue = list(CONTROL_URLS)
    visited: set[str] = set()
    index = 0
    while queue:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)
        index += 1
        result = fetch(url)
        data = result.pop("data")
        raw_file = safe_name(url, index)
        (raw_dir / raw_file).write_bytes(data)
        record: dict[str, Any] = {**result, "rawFile": f"raw/{raw_file}"}

        parser = PageParser()
        decoded = data.decode("utf-8", errors="replace")
        content_type = str(record.get("contentType", "")).casefold()
        if data and ("html" in content_type or decoded.lstrip().startswith("<")):
            parser.feed(decoded)
            visible = parser.visible_text
            record["visibleTextSha256"] = sha256(visible.encode("utf-8"))
            record["visibleTextBytes"] = len(visible.encode("utf-8"))
            record["forms"] = parser.forms
            normalized_links: list[dict[str, str]] = []
            for link in parser.links:
                absolute = urljoin(str(record["finalUrl"]), link["href"])
                normalized = {"url": absolute, "text": link["text"]}
                normalized_links.append(normalized)
                if absolute.startswith("https://search.rsl.ru/"):
                    literal_links.setdefault(absolute, normalized)
                if url == PARENT_URL and "fragment-eorder" in absolute:
                    parent_fragment_links.append(normalized)
                    if absolute not in visited:
                        queue.append(absolute)
                if issue_marker(link["text"]):
                    parent_candidate_issue_links.append(normalized)
                    if absolute.startswith("https://search.rsl.ru/") and absolute not in visited:
                        queue.append(absolute)
            record["links"] = normalized_links

            if url == PARENT_URL:
                value = visible.casefold()
                parent_checks = {
                    "recordIdPresent": EXPECTED_PARENT_ID in decoded or "004548325" in decoded,
                    "titlePravda": EXPECTED_TITLE.casefold() in value,
                    "moscowPublication": "москва" in value,
                    "holds1912Through1923": "1912 ... 1923" in value or "1912 … 1923" in value,
                    "fragmentOrderLabel": "заказать копию фрагмента" in value,
                    "remoteArchiveNote": "удаленный доступ к электронному архиву" in value,
                    "microfilm1921Coverage": "1917-1981" in value or "1917–1981" in value,
                }
        responses.append(record)

    issue_cards: list[dict[str, Any]] = []
    accepted_issue_cards: list[dict[str, Any]] = []
    for record in responses:
        if record["requestedUrl"] == PARENT_URL:
            continue
        text_hash = record.get("visibleTextSha256")
        links = record.get("links", [])
        text = " ".join(link.get("text", "") for link in links)
        checks = central_moscow_marker(text)
        if any(checks.values()) or issue_marker(text):
            row = {
                "url": record["finalUrl"],
                "status": record["status"],
                "bytes": record["bytes"],
                "sha256": record["sha256"],
                "visibleTextSha256": text_hash,
                "identityChecks": checks,
                "accepted": all(checks.values()),
            }
            issue_cards.append(row)
            if row["accepted"]:
                accepted_issue_cards.append(row)

    fragment_records = [
        record
        for record in responses
        if "fragment-eorder" in str(record["requestedUrl"])
        or "fragment-eorder" in str(record["finalUrl"])
    ]
    fragment_form_detected = any(record.get("forms") for record in fragment_records)
    fragment_route_reachable = any(int(record["status"]) in {200, 302, 303, 307, 308} for record in fragment_records)

    result = {
        "schema": "yesenin-pravda-rsl-access-discovery-pass26/v1",
        "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "target": {
            "title": "Правда",
            "publicationPlace": "Москва",
            "date": EXPECTED_DATE,
            "issueNumber": EXPECTED_ISSUE,
            "parentRslRecord": PARENT_URL,
        },
        "parentChecks": parent_checks,
        "parentVerified": bool(parent_checks) and all(parent_checks.values()),
        "literalParentFragmentLinks": parent_fragment_links,
        "literalIssueCandidateLinks": parent_candidate_issue_links,
        "officialResponses": responses,
        "literalOfficialLinkCount": len(literal_links),
        "fragmentRoute": {
            "literalLinkPresent": bool(parent_fragment_links),
            "reachable": fragment_route_reachable,
            "formDetected": fragment_form_detected,
            "requestSubmitted": False,
            "personalDataProvided": False,
            "paymentAuthorized": False,
        },
        "issueCardsInspected": issue_cards,
        "acceptedExactIssueCards": accepted_issue_cards,
        "exactIssueResolved": len(accepted_issue_cards) == 1,
        "resolutionState": (
            "one-literal-rsl-exact-issue"
            if len(accepted_issue_cards) == 1
            else "ambiguous-multiple-literal-rsl-issues"
            if len(accepted_issue_cards) > 1
            else "parent-and-fragment-route-only-no-literal-issue-card"
        ),
        "catalogueIdConstructed": False,
        "viewerIdConstructed": False,
        "pdfRouteConstructed": False,
        "neighbourIdArithmeticUsed": False,
        "ocrUsed": False,
        "syntheticContentUsed": False,
        "facsimileAcquired": False,
        "contentInspected": False,
        "productionAuthorized": False,
        "articlePublished": False,
    }

    (OUTPUT / "manifest.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (OUTPUT / "SUMMARY.md").write_text(
        "\n".join(
            [
                "# RSL Pravda access discovery pass 26",
                "",
                f"- Parent verified: `{str(result['parentVerified']).lower()}`",
                f"- Literal fragment-order link present: `{str(result['fragmentRoute']['literalLinkPresent']).lower()}`",
                f"- Fragment route reachable: `{str(result['fragmentRoute']['reachable']).lower()}`",
                f"- Fragment form detected: `{str(result['fragmentRoute']['formDetected']).lower()}`",
                f"- Literal issue candidates: `{len(parent_candidate_issue_links)}`",
                f"- Exact issue resolved: `{str(result['exactIssueResolved']).lower()}`",
                f"- Resolution: `{result['resolutionState']}`",
                "- Request submitted: `false`",
                "- Catalogue/viewer/PDF construction: `false`",
                "- Facsimile acquired: `false`",
                "- Content inspected: `false`",
                "",
            ]
        ),
        encoding="utf-8",
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # A negative issue result is valid. Fail only when the official parent itself
    # cannot be verified, because then the diagnostic has no trusted identity base.
    return 0 if result["parentVerified"] else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"[yesenin-pravda-rsl-access-pass26] {exc}", file=sys.stderr)
        sys.exit(1)

#!/usr/bin/env python3
"""Discover issue-level NEB catalogue records from real serial parent pages.

The script performs no OCR and does not infer issue IDs from search snippets. It
saves the exact HTML bytes returned by NEB, hashes them, extracts catalogue links
and records the nearest source context for each target label.
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

OUTPUT = Path(os.environ.get("YESENIN_NEB_SERIAL_OUTPUT", "artifacts/yesenin-neb-serial-discovery-pass10"))
USER_AGENT = "TheLegendaryPoet-Research-Discovery/1.0 (+https://github.com/FedorMilovanov/TheLegendaryPoet)"
CATALOGUE_PATTERN = re.compile(r"(?:https?://rusneb\.ru)?/catalog/([^/\"'?#&<>]+)/?", re.IGNORECASE)

TARGETS: list[dict[str, Any]] = [
    {
        "id": "NEB-SERIAL-YE1-TEATRALNAYA-MOSKVA-1921",
        "title": "Театральная Москва, 1921",
        "parent_url": "https://rusneb.ru/catalog/000199_000009_007920703/",
        "parent_code": "000199_000009_007920703",
        "required_issue_labels": ["1921, № 2", "1921, № 7", "1921, № 8"],
        "inventory_labels": ["1921, № 1", "1921, № 2", "1921, № 3", "1921, № 7", "1921, № 8", "1921, № 9-10"],
        "request_only_labels": ["1921, № 11-12"],
    },
    {
        "id": "NEB-SERIAL-YE1-IZVESTIA-1921",
        "title": "Известия ВЦИК, 1921",
        "parent_url": "https://rusneb.ru/catalog/000199_000009_013348831/",
        "parent_code": "000199_000009_013348831",
        "required_issue_labels": [],
        "inventory_labels": [],
        "exploratory_labels": ["24 августа", "9 ноября", "23 ноября"],
    },
]


class AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.current_href: str | None = None
        self.current_text: list[str] = []
        self.links: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "a":
            return
        values = dict(attrs)
        href = values.get("href")
        if href:
            self.current_href = href
            self.current_text = []

    def handle_data(self, data: str) -> None:
        if self.current_href is not None:
            self.current_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() != "a" or self.current_href is None:
            return
        text = " ".join("".join(self.current_text).split())
        self.links.append({"href": self.current_href, "text": text})
        self.current_href = None
        self.current_text = []


def normalize_text(value: str) -> str:
    value = unescape(value).replace("\\/", "/")
    value = value.replace("\u2116", "№")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def catalogue_code(href: str) -> str | None:
    match = CATALOGUE_PATTERN.search(href.replace("\\/", "/"))
    return match.group(1) if match else None


def nearest_catalogue_code(raw: str, label: str, parent_code: str) -> dict[str, Any] | None:
    normalized_raw = normalize_text(raw)
    variants = {label, label.replace("№ ", "№"), label.replace("№", "N")}
    positions: list[int] = []
    for variant in variants:
        start = 0
        while True:
            index = normalized_raw.casefold().find(variant.casefold(), start)
            if index < 0:
                break
            positions.append(index)
            start = index + 1
    if not positions:
        return None

    best: tuple[int, str, str] | None = None
    for position in positions:
        left = max(0, position - 2500)
        right = min(len(normalized_raw), position + 2500)
        window = normalized_raw[left:right]
        for match in CATALOGUE_PATTERN.finditer(window):
            code = match.group(1)
            if code == parent_code:
                continue
            absolute = left + match.start()
            distance = abs(absolute - position)
            context = normalized_raw[max(0, position - 280): min(len(normalized_raw), position + 520)]
            candidate = (distance, code, context)
            if best is None or candidate[0] < best[0]:
                best = candidate
    if best is None:
        return {"label": label, "catalogueCode": None, "context": normalized_raw[max(0, positions[0] - 280): positions[0] + 520]}
    return {"label": label, "catalogueCode": best[1], "context": best[2]}


def fetch_html(url: str) -> tuple[bytes, str, str, int]:
    request = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.2",
            "Accept-Language": "ru,en;q=0.7",
        },
    )
    with urlopen(request, timeout=90) as response:
        status = getattr(response, "status", 200)
        content_type = response.headers.get_content_type()
        final_url = response.geturl()
        data = response.read()
    return data, final_url, content_type, status


def discover(target: dict[str, Any]) -> dict[str, Any]:
    data, final_url, content_type, status = fetch_html(target["parent_url"])
    if status != 200:
        raise RuntimeError(f"{target['id']} returned HTTP {status}")
    if len(data) < 5_000:
        raise RuntimeError(f"{target['id']} returned implausibly small HTML: {len(data)} bytes")

    html_text = data.decode("utf-8", errors="replace")
    normalized_html = normalize_text(html_text)
    html_path = OUTPUT / "raw" / f"{target['id'].lower()}.html"
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_bytes(data)

    parser = AnchorParser()
    parser.feed(html_text)
    links: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for item in parser.links:
        absolute = urljoin(final_url, item["href"])
        code = catalogue_code(absolute)
        key = (absolute, item["text"])
        if key in seen:
            continue
        seen.add(key)
        links.append({"url": absolute, "text": normalize_text(item["text"]), "catalogueCode": code})

    raw_codes = sorted(set(CATALOGUE_PATTERN.findall(normalized_html)))
    child_codes = [code for code in raw_codes if code != target["parent_code"]]

    labels = [
        *target.get("inventory_labels", []),
        *target.get("request_only_labels", []),
        *target.get("exploratory_labels", []),
    ]
    issue_map: list[dict[str, Any]] = []
    for label in labels:
        anchor_match = next(
            (
                item
                for item in links
                if label.casefold() in item["text"].casefold()
                and item["catalogueCode"]
                and item["catalogueCode"] != target["parent_code"]
            ),
            None,
        )
        if anchor_match:
            issue_map.append(
                {
                    "label": label,
                    "catalogueCode": anchor_match["catalogueCode"],
                    "url": anchor_match["url"],
                    "anchorText": anchor_match["text"],
                    "method": "anchor",
                }
            )
            continue
        nearest = nearest_catalogue_code(html_text, label, target["parent_code"])
        issue_map.append(
            {
                **(nearest or {"label": label, "catalogueCode": None, "context": None}),
                "url": (
                    f"https://rusneb.ru/catalog/{nearest['catalogueCode']}/"
                    if nearest and nearest.get("catalogueCode")
                    else None
                ),
                "method": "nearest-html-context" if nearest else "label-not-present",
            }
        )

    required = set(target.get("required_issue_labels", []))
    mapped_required = {
        item["label"]
        for item in issue_map
        if item["label"] in required and item.get("catalogueCode")
    }
    return {
        **target,
        "status": status,
        "contentType": content_type,
        "finalUrl": final_url,
        "htmlBytes": len(data),
        "htmlSha256": hashlib.sha256(data).hexdigest(),
        "rawHtml": str(html_path.relative_to(OUTPUT)),
        "anchorLinks": links,
        "catalogueCodesInHtml": raw_codes,
        "childCatalogueCodes": child_codes,
        "issueMap": issue_map,
        "requiredIssueLabelsMapped": sorted(mapped_required),
        "requiredIssueLabelsComplete": mapped_required == required,
        "synthetic": False,
        "ocrUsed": False,
        "productionAuthorized": False,
    }


def main() -> int:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)

    results: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []
    for target in TARGETS:
        print(f"Discovering {target['id']} ...", flush=True)
        try:
            results.append(discover(target))
        except Exception as exc:  # noqa: BLE001
            errors.append({"id": target["id"], "error": str(exc)})

    summary = {
        "targets": len(TARGETS),
        "completedTargets": len(results),
        "errors": errors,
        "serverHtmlPreserved": True,
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
        "# NEB serial discovery pass 10",
        "",
        "No OCR, synthetic reconstruction or search-snippet inference was used.",
        "",
    ]
    for result in results:
        lines.extend(
            [
                f"## {result['title']}",
                "",
                f"- Parent: `{result['parent_code']}`",
                f"- HTML bytes: `{result['htmlBytes']}`",
                f"- HTML SHA-256: `{result['htmlSha256']}`",
                f"- Child catalogue codes found: `{len(result['childCatalogueCodes'])}`",
                "",
                "| Target label | Child code | Method |",
                "|---|---|---|",
            ]
        )
        for item in result["issueMap"]:
            lines.append(
                f"| {item['label']} | {item.get('catalogueCode') or 'NOT-EXPOSED'} | {item['method']} |"
            )
        lines.append("")
    if errors:
        lines.extend(["## Errors", "", "```json", json.dumps(errors, ensure_ascii=False, indent=2), "```", ""])
    (OUTPUT / "summary.md").write_text("\n".join(lines), encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"[yesenin-neb-serial-discovery-pass10] {exc}", file=sys.stderr)
        sys.exit(1)

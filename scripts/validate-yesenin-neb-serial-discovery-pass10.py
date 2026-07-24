#!/usr/bin/env python3
"""Validate issue-level NEB serial discovery without promoting parent records."""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
import sys
from typing import Any

OUTPUT = Path(os.environ.get("YESENIN_NEB_SERIAL_OUTPUT", "artifacts/yesenin-neb-serial-discovery-pass10"))
DISCOVERY = OUTPUT / "discovery.json"
SHA256 = re.compile(r"^[a-f0-9]{64}$")


def fail(message: str) -> None:
    raise RuntimeError(f"[yesenin-neb-serial-discovery-pass10] {message}")


def by_id(results: list[dict[str, Any]], target_id: str) -> dict[str, Any]:
    for result in results:
        if result.get("id") == target_id:
            return result
    fail(f"missing target result {target_id}")


def main() -> int:
    if not DISCOVERY.exists():
        fail(f"missing discovery manifest {DISCOVERY}")
    manifest = json.loads(DISCOVERY.read_text(encoding="utf-8"))

    if manifest.get("targets") != 2 or manifest.get("completedTargets") != 2:
        fail(f"expected two completed parent pages, found {manifest.get('completedTargets')}")
    if manifest.get("errors"):
        fail(f"parent discovery errors: {manifest['errors']}")
    if (
        manifest.get("serverHtmlPreserved") is not True
        or manifest.get("ocrUsed") is not False
        or manifest.get("syntheticContentUsed") is not False
        or manifest.get("productionAuthorized") is not False
    ):
        fail("discovery boundary changed")

    results = manifest.get("results", [])
    for result in results:
        if result.get("status") != 200:
            fail(f"{result.get('id')} did not return HTTP 200")
        if result.get("htmlBytes", 0) < 5_000:
            fail(f"{result.get('id')} HTML is implausibly small")
        if not SHA256.fullmatch(result.get("htmlSha256", "")):
            fail(f"{result.get('id')} has invalid HTML SHA-256")
        if result.get("ocrUsed") is not False or result.get("synthetic") is not False:
            fail(f"{result.get('id')} used a forbidden evidence path")
        raw_path = OUTPUT / result.get("rawHtml", "")
        if not raw_path.exists() or raw_path.stat().st_size != result.get("htmlBytes"):
            fail(f"{result.get('id')} raw HTML was not preserved byte-for-byte")

    theatre = by_id(results, "NEB-SERIAL-YE1-TEATRALNAYA-MOSKVA-1921")
    if theatre.get("parent_code") != "000199_000009_007920703":
        fail("Theatrical Moscow parent code drifted")
    if theatre.get("requiredIssueLabelsComplete") is not True:
        fail(
            "Theatrical Moscow issue-level child IDs for no. 2, 7 and 8 were not all discovered; "
            "inspect the preserved HTML instead of promoting the parent record"
        )

    issue_map = {item["label"]: item for item in theatre.get("issueMap", [])}
    required_labels = ["1921, № 2", "1921, № 7", "1921, № 8"]
    child_codes: list[str] = []
    for label in required_labels:
        item = issue_map.get(label)
        if not item or not item.get("catalogueCode"):
            fail(f"missing exact child code for {label}")
        code = item["catalogueCode"]
        if code == theatre["parent_code"]:
            fail(f"{label} incorrectly resolves to the serial parent")
        if not str(item.get("url", "")).startswith(f"https://rusneb.ru/catalog/{code}/"):
            fail(f"{label} has inconsistent child URL")
        child_codes.append(code)
    if len(set(child_codes)) != len(child_codes):
        fail("different Theatrical Moscow issues resolved to the same child code")

    inventory_labels = ["1921, № 1", "1921, № 2", "1921, № 3", "1921, № 7", "1921, № 8", "1921, № 9-10"]
    for label in inventory_labels:
        if label not in issue_map:
            fail(f"Theatrical Moscow parent did not expose inventory label {label}")

    missing_11_12 = issue_map.get("1921, № 11-12")
    issue_11_12_state = (
        "child-located" if missing_11_12 and missing_11_12.get("catalogueCode") else "not-exposed-in-public-parent"
    )

    izvestia = by_id(results, "NEB-SERIAL-YE1-IZVESTIA-1921")
    if izvestia.get("parent_code") != "000199_000009_013348831":
        fail("Izvestia 1921 parent code drifted")
    exploratory = {
        item["label"]: item.get("catalogueCode")
        for item in izvestia.get("issueMap", [])
        if item["label"] in {"24 августа", "9 ноября", "23 ноября"}
    }

    print(
        json.dumps(
            {
                "status": "ISSUE-LEVEL-DISCOVERY / REAL-SERVER-HTML / NO-OCR / RESEARCH-ONLY",
                "theatricalMoscowParent": theatre["parent_code"],
                "theatricalMoscowRequiredIssues": dict(zip(required_labels, child_codes, strict=True)),
                "theatricalMoscowIssue11_12": issue_11_12_state,
                "izvestiaParent": izvestia["parent_code"],
                "izvestiaExploratoryTargets": exploratory,
                "rawHtmlPreserved": True,
                "ocrUsed": False,
                "syntheticContentUsed": False,
                "productionAuthorized": False,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(str(exc), file=sys.stderr)
        sys.exit(1)

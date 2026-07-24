#!/usr/bin/env python3
"""Validate PDF routes discovered from exact NEB serial child HTML."""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import parse_qs, urlparse

OUTPUT = Path(os.environ.get("YESENIN_NEB_SERIAL_OUTPUT", "artifacts/yesenin-neb-serial-discovery-pass10"))
MANIFEST = OUTPUT / "child-pdf-routes.json"
SHA256 = re.compile(r"^[a-f0-9]{64}$")
EXPECTED = {
    "1921, № 2": "000199_000009_013560962",
    "1921, № 7": "000199_000009_013560972",
    "1921, № 8": "000199_000009_013560974",
    "1921, № 11-12": "000199_000009_013560981",
}


def fail(message: str) -> None:
    raise RuntimeError(f"[yesenin-neb-serial-pdf-routes-pass10] {message}")


def main() -> int:
    if not MANIFEST.exists():
        fail(f"missing child-route manifest {MANIFEST}")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("targetIssues") != 4 or manifest.get("completedIssues") != 4:
        fail(f"expected four completed issue pages, found {manifest.get('completedIssues')}")
    if manifest.get("errors"):
        fail(f"child-page discovery errors: {manifest['errors']}")
    if (
        manifest.get("routesDiscoveredFromChildHtml") is not True
        or manifest.get("routeConstructionAllowed") is not False
        or manifest.get("ocrUsed") is not False
        or manifest.get("syntheticContentUsed") is not False
        or manifest.get("productionAuthorized") is not False
    ):
        fail("child-route discovery boundary changed")

    by_label = {item["label"]: item for item in manifest.get("issues", [])}
    resolved: dict[str, str] = {}
    for label, code in EXPECTED.items():
        issue = by_label.get(label)
        if not issue:
            fail(f"missing child detail for {label}")
        if issue.get("catalogueCode") != code:
            fail(f"{label} child code drifted: {issue.get('catalogueCode')}")
        if issue.get("status") != 200 or issue.get("htmlBytes", 0) < 5_000:
            fail(f"{label} child HTML was not acquired correctly")
        if not SHA256.fullmatch(issue.get("htmlSha256", "")):
            fail(f"{label} has invalid child HTML SHA-256")
        raw_path = OUTPUT / issue.get("rawHtml", "")
        if not raw_path.exists() or raw_path.stat().st_size != issue.get("htmlBytes"):
            fail(f"{label} child HTML was not preserved byte-for-byte")
        if (
            issue.get("routeConstructed") is not False
            or issue.get("ocrUsed") is not False
            or issue.get("synthetic") is not False
            or issue.get("productionAuthorized") is not False
        ):
            fail(f"{label} route/evidence boundary changed")

        routes = issue.get("pdfRoutes", [])
        if not routes:
            fail(f"{label} child page exposed no exact PDF route")
        exact_routes: list[str] = []
        for route in routes:
            parsed = urlparse(route)
            query = parse_qs(parsed.query)
            if parsed.scheme != "https" or parsed.netloc != "rusneb.ru":
                continue
            if not parsed.path.endswith("/local/tools/exalead/getFiles.php"):
                continue
            if query.get("book_id") != [code] or query.get("doc_type") != ["pdf"]:
                continue
            exact_routes.append(route)
        if len(exact_routes) != 1:
            fail(f"{label} expected one exact PDF route, found {len(exact_routes)}")
        resolved[label] = exact_routes[0]

    if len(set(resolved.values())) != len(resolved):
        fail("different serial issues resolved to the same PDF route")

    print(
        json.dumps(
            {
                "status": "EXACT-CHILD-PDF-ROUTES / REAL-HTML / NO-CONSTRUCTION / RESEARCH-ONLY",
                "issues": resolved,
                "childHtmlPreserved": True,
                "routesConstructed": False,
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

#!/usr/bin/env python3
"""Run issue #77 provenance acquisition with MediaWiki-safe title resolution.

The core acquisition implementation stays in commons-provenance-77.py. This
runner replaces only the Commons metadata adapter because MediaWiki forbids
rvlimit when multiple pages are supplied. Image metadata is fetched in one
batch; revision/template evidence is then fetched per canonical page.
Normalization and redirect aliases are retained without weakening the
original-only download policy.
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path
from typing import Any

import requests

CORE_PATH = Path(__file__).with_name("commons-provenance-77.py")
SPEC = importlib.util.spec_from_file_location("commons_provenance_77_core", CORE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"unable to load provenance core from {CORE_PATH}")
core = importlib.util.module_from_spec(SPEC)
# dataclasses resolves annotations through sys.modules during class creation.
sys.modules[SPEC.name] = core
SPEC.loader.exec_module(core)


def _api_json(session: requests.Session, *, data: dict[str, Any], timeout: int = 180) -> dict[str, Any]:
    response = session.post(core.API, data=data, timeout=timeout)
    response.raise_for_status()
    payload = response.json()
    if payload.get("error"):
        raise RuntimeError(
            "Commons API error: "
            + json.dumps(payload["error"], ensure_ascii=False, sort_keys=True)
        )
    return payload


def _follow_alias(value: str, aliases: dict[str, str]) -> str:
    current = value
    seen: set[str] = set()
    while current in aliases and current not in seen:
        seen.add(current)
        current = aliases[current]
    return current


def _latest_revision_and_templates(
    session: requests.Session,
    canonical_title: str,
) -> tuple[dict[str, Any], list[str]]:
    payload = _api_json(
        session,
        data={
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "maxlag": "5",
            "prop": "revisions|templates",
            "rvprop": "ids|timestamp",
            "rvlimit": "1",
            "tlnamespace": "10",
            "tllimit": "max",
            "titles": canonical_title,
        },
        timeout=90,
    )
    pages = payload.get("query", {}).get("pages", [])
    if len(pages) != 1:
        return {}, []
    revisions = pages[0].get("revisions") or []
    templates = [
        str(item.get("title", ""))
        for item in (pages[0].get("templates") or [])
        if item.get("title")
    ]
    return (dict(revisions[0]) if revisions else {}), templates


def _sanitize_unknown_author(raw_artist: str, raw_credit: str) -> str:
    # Commons often embeds a hidden duplicate for multilingual display. Remove
    # only display:none spans before converting the attribution to plain text.
    artist = re.sub(
        r'<span[^>]*display\s*:\s*none[^>]*>.*?</span>',
        '',
        raw_artist,
        flags=re.I | re.S,
    )
    text = core.clean_html(artist) or core.clean_html(raw_credit)
    text = re.sub(r'\s+', ' ', text).strip()
    folded = text.casefold()
    if not text or folded.startswith('unknown') or folded in {
        'неизвестен',
        'неизвестный автор',
        'неизвестный фотограф',
    }:
        return 'Unknown author'
    return text


def metadata_batch(session: requests.Session) -> tuple[dict[str, dict[str, Any]], dict[str, Any]]:
    requested_titles = [f"File:{name}" for name in core.FILES]
    payload = _api_json(
        session,
        data={
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "maxlag": "5",
            "redirects": "1",
            "prop": "imageinfo",
            "iiprop": "url|size|mime|sha1|timestamp|extmetadata",
            "titles": "|".join(requested_titles),
        },
    )

    query = payload.get("query", {})
    aliases: dict[str, str] = {}
    for item in query.get("normalized", []) or []:
        aliases[core.norm_title(str(item.get("from", "")))] = core.norm_title(
            str(item.get("to", ""))
        )
    for item in query.get("redirects", []) or []:
        aliases[core.norm_title(str(item.get("from", "")))] = core.norm_title(
            str(item.get("to", ""))
        )

    pages_by_key: dict[str, dict[str, Any]] = {}
    revision_payloads: list[dict[str, Any]] = []
    for page in query.get("pages", []) or []:
        if page.get("missing") or not page.get("imageinfo"):
            continue
        canonical_title = str(page.get("title", ""))
        info = dict(page["imageinfo"][0])
        info["canonicaltitle"] = canonical_title
        info["pageid"] = page.get("pageid")
        info["lastrevid"] = page.get("lastrevid")
        revision, templates = _latest_revision_and_templates(session, canonical_title)
        info["revision"] = revision
        info["provenance_templates"] = templates

        # DateTime without DateTimeOriginal is commonly the MediaWiki upload
        # timestamp, not the depicted/created date. Preserve it in raw API
        # evidence but do not promote it to the editorial date field.
        extmetadata = dict(info.get("extmetadata") or {})
        date_time = extmetadata.get("DateTime") or {}
        if (
            not extmetadata.get("DateTimeOriginal")
            and isinstance(date_time, dict)
            and date_time.get("source") == "mediawiki-metadata"
        ):
            extmetadata.pop("DateTime", None)
        info["extmetadata"] = extmetadata

        revision_payloads.append(
            {
                "canonicaltitle": canonical_title,
                "pageid": page.get("pageid"),
                "lastrevid": page.get("lastrevid"),
                "revision": revision,
                "templates": templates,
            }
        )
        pages_by_key[core.norm_title(canonical_title)] = info

    result: dict[str, dict[str, Any]] = dict(pages_by_key)
    unresolved_aliases: list[dict[str, str]] = []
    for requested_title in requested_titles:
        requested_key = core.norm_title(requested_title)
        canonical_key = _follow_alias(requested_key, aliases)
        info = pages_by_key.get(canonical_key)
        if info is not None:
            result[requested_key] = info
        else:
            unresolved_aliases.append(
                {
                    "requested": requested_title,
                    "requested_key": requested_key,
                    "resolved_key": canonical_key,
                }
            )

    evidence = {
        "imageinfo_batch": payload,
        "revision_queries": revision_payloads,
        "alias_map": aliases,
        "unresolved_aliases": unresolved_aliases,
        "sha1_representation": "Commons imageinfo sha1 and computed digest are compared as lowercase hexadecimal SHA-1",
    }
    return result, evidence


core.metadata_batch = metadata_batch
core.normalized_author = _sanitize_unknown_author
# Current Commons imageinfo returns a 40-character hexadecimal SHA-1. The core
# field name keeps its initial compatibility label, but both values are now
# compared in the API's actual representation rather than converting one side.
core.sha1_base36_from_hex = lambda hex_digest: hex_digest.lower()
raise SystemExit(core.main())

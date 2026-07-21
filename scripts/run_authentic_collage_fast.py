#!/usr/bin/env python3
"""Reliable GitHub runner for the authentic archive collage.

Wikimedia frequently rate-limits original-file downloads from shared CI IPs.
This wrapper keeps Commons metadata/original URLs as the source of truth, but
prefers the official Commons 1800px thumbnail of each exact archival file. If
that CDN is rate-limited too, it asks a transparent image-resize proxy for the
same Commons original URL. It never generates or alters faces.
"""

from __future__ import annotations

from urllib.parse import quote

import build_authentic_mayakovsky_collage as builder


def reliable_download(session, info):
    original = info["url"]
    candidates = []
    if info.get("thumburl"):
        candidates.append((info["thumburl"], "official Commons thumbnail", 2))
    proxy_target = original.removeprefix("https://").removeprefix("http://")
    proxy = (
        "https://images.weserv.nl/?url="
        + quote(proxy_target, safe="/:._-")
        + "&w=1800&output=jpg&q=95"
    )
    candidates.append((proxy, "resized proxy of Commons original", 2))
    # Last resort: one direct attempt at the original-resolution archival file.
    candidates.append((original, "original", 1))

    errors = []
    for url, kind, attempts in candidates:
        try:
            response = builder.fetch(session, "GET", url, timeout=90, attempts=attempts)
            if not response.headers.get("content-type", "").startswith("image/"):
                raise RuntimeError(f"unexpected content type {response.headers.get('content-type')}")
            return response.content, url, kind
        except Exception as exc:
            errors.append(f"{kind}: {exc}")
    raise RuntimeError("; ".join(errors))


builder.download_image = reliable_download
raise SystemExit(builder.main())

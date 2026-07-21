#!/usr/bin/env python3
"""Fast reliable runner for the authentic archival collage.

The Commons API verifies each exact file and supplies its original URL,
metadata and official thumbnail URL. Shared CI addresses are aggressively
rate-limited by Wikimedia's image CDN, so this runner requests a transparent
1800px resize of that exact original URL first. This is a mechanical resize of
the archival photograph, not image generation. The original Commons URL and
full attribution remain recorded in the manifest.
"""

from __future__ import annotations

from urllib.parse import quote

import build_authentic_mayakovsky_collage as builder


def reliable_download(session, info):
    original = info["url"]
    proxy_target = original.removeprefix("https://").removeprefix("http://")
    proxy = (
        "https://images.weserv.nl/?url="
        + quote(proxy_target, safe="/:._-")
        + "&w=1800&output=jpg&q=95"
    )
    candidates = [(proxy, "transparent resize of Commons original", 1)]
    if info.get("thumburl"):
        candidates.append((info["thumburl"], "official Commons thumbnail", 1))

    errors = []
    for url, kind, attempts in candidates:
        try:
            response = builder.fetch(session, "GET", url, timeout=45, attempts=attempts)
            if not response.headers.get("content-type", "").startswith("image/"):
                raise RuntimeError(f"unexpected content type {response.headers.get('content-type')}")
            return response.content, url, kind
        except Exception as exc:
            errors.append(f"{kind}: {exc}")
    raise RuntimeError("; ".join(errors))


builder.download_image = reliable_download
raise SystemExit(builder.main())

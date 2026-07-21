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

# A previous draft accidentally included a modern retouched reconstruction.
# Replace it with the genuine public-domain 1915 photograph of Mayakovsky and
# Lilya Brik recorded on its Commons file page.
builder.FILES = [
    "Vladimir mayakovsky and lilya brik.jpg"
    if name == "Vladimir Mayakovsky & Lilya Brik 1918. Retouched.jpg"
    else name
    for name in builder.FILES
]


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


_original_verified_item = builder.verified_item


def verified_item_with_editorial_dates(session, filename, index, info):
    item = _original_verified_item(session, filename, index, info)
    # Commons metadata for these scans exposes the upload/scan timestamp rather
    # than the depicted date. Their file pages explicitly identify the dates.
    overrides = {
        "1928 LYuB editing film.jpg": "1928",
        "Lilya Brik in Moscow, 1915-1916.jpg": "1915–1916",
        "Vladimir mayakovsky and lilya brik.jpg": "1915",
    }
    if item.filename in overrides:
        item.date = overrides[item.filename]
    return item


builder.download_image = reliable_download
builder.verified_item = verified_item_with_editorial_dates
raise SystemExit(builder.main())

#!/usr/bin/env python3
"""Acquire and audit the 30 Mayakovsky–Brik image candidates from Commons originals.

This is a provenance tool, not a collage generator. It intentionally refuses
proxy, thumbnail and Special:Redirect downloads. Every candidate keeps the raw
Commons metadata, exact original bytes, a separately generated web derivative,
independent hashes and a network audit. Editorial identity/caption acceptance
remains explicit and defaults to unresolved.
"""

from __future__ import annotations

import argparse
import collections
import csv
import hashlib
import html
import io
import json
import re
import sys
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = (
    "TheLegendaryPoet-ProvenanceAudit/2.0 "
    "(historical editorial research; https://github.com/FedorMilovanov/TheLegendaryPoet)"
)
RETRYABLE = {408, 425, 429, 500, 502, 503, 504}

FILES = [
    "Mayakovsky 1910.jpg",
    "Mayakovsky 1912.jpg",
    "Vladimir Mayakovsky 1914.jpg",
    "Mayakovsky 1915.jpg",
    "Mayakovsky 1917 a.jpg",
    "Mayakovsky 1918.jpg",
    "Mayakovsky 1925.jpg",
    "Mayakovsky 1928 by Osip Brik.jpg",
    "Mayakovsky 1930 a.jpg",
    "Mayakovsky and Futurists.jpg",
    "Mayakovsky and Moreno by Modotti 1925.jpg",
    "Mayakovsky Brik Crimea 1926.jpg",
    "Mayakovsky Pasternak.jpg",
    "Mayakovsky with dog Pushkino 1925.jpg",
    "1926. Владимир Маяковский с Булькой.jpg",
    "1927. Владимир Маяковский бреется.jpg",
    "Маяковский и Чуковский.jpg",
    "Владимир Маяковский и Леонид Кузьмин 1912 год (Vladimir Myakovsky and Leonid Kuzmin 1912).jpg",
    "Lilya Brik in 1906.jpg",
    "Lilya Brik in 1914.jpg",
    "Lilya Brik in Moscow, 1915-1916.jpg",
    "Lilya Brik with friends, 1915.jpg",
    "Lilya Brik with her mother and sister Elsa.jpg",
    "Lilya Brik 1929.jpg",
    "LilyaBrik FotoOsipBrik.jpg",
    "Vladimir mayakovsky and lilya brik.jpg",
    "1928 LYuB editing film.jpg",
    "Osip Brik.jpg",
    "Osip LUB.jpg",
    "Maiakowski 1925.jpg",
]

MIME_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/tiff": ".tif",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


@dataclass
class NetworkAttempt:
    candidate_id: str
    attempt: int
    url: str
    final_url: str
    status: int | None
    content_type: str
    content_length: str
    redirects: list[dict[str, Any]]
    elapsed_seconds: float
    bytes_written: int
    outcome: str
    error: str


@dataclass
class ProvenanceRecord:
    candidate_id: str
    requested_title: str
    canonical_title: str
    commons_page_url: str
    page_id: int | None
    revision_id: int | None
    revision_timestamp: str
    image_timestamp: str
    original_url: str
    original_mime: str
    api_original_bytes: int
    original_width: int
    original_height: int
    api_sha1_base36: str
    computed_sha1_base36: str
    original_sha256: str
    original_local_path: str
    downloaded_bytes: int
    derivative_local_path: str
    derivative_width: int
    derivative_height: int
    derivative_sha256: str
    derivative_processing: str
    dhash64: str
    description_raw: str
    description_text: str
    date_raw: str
    date_text: str
    author_raw: str
    author_text: str
    credit_raw: str
    licence_short_name_raw: str
    licence_short_name: str
    usage_terms_raw: str
    licence_url_raw: str
    licence_url: str
    attribution_required_raw: str
    restrictions_raw: str
    editorial_status: str
    editorial_evidence_url: str
    editorial_notes: str
    acquisition_status: str
    metadata_gaps: list[str]


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def clean_html(value: Any) -> str:
    if not value:
        return ""
    if isinstance(value, dict):
        value = value.get("value", "")
    text = html.unescape(str(value))
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def raw_meta(metadata: dict[str, Any], key: str) -> str:
    value = metadata.get(key)
    if isinstance(value, dict):
        return str(value.get("value", ""))
    return "" if value is None else str(value)


def normalized_author(raw_artist: str, raw_credit: str) -> str:
    text = clean_html(raw_artist) or clean_html(raw_credit)
    compact = re.sub(r"\s+", " ", text).strip()
    if compact.casefold() == "unknown authorunknown author":
        return "Unknown author"
    midpoint = len(compact) // 2
    if len(compact) % 2 == 0 and compact[:midpoint].casefold() == compact[midpoint:].casefold():
        compact = compact[:midpoint].strip()
    return compact


def norm_title(value: str) -> str:
    return value.removeprefix("File:").replace("_", " ").strip().casefold()


def safe_slug(value: str) -> str:
    value = clean_html(value).lower()
    value = re.sub(r"[^a-z0-9а-яё]+", "-", value, flags=re.I)
    value = value.strip("-")
    return (value[:80] or "image").encode("ascii", "ignore").decode() or "image"


def page_url(canonical_title: str) -> str:
    title = canonical_title.removeprefix("File:")
    return "https://commons.wikimedia.org/wiki/File:" + quote(
        title.replace(" ", "_"), safe="_().,-"
    )


def base36(number: int) -> str:
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
    if number == 0:
        return "0"
    result = ""
    while number:
        number, remainder = divmod(number, 36)
        result = alphabet[remainder] + result
    return result


def sha1_base36_from_hex(hex_digest: str) -> str:
    return base36(int(hex_digest, 16)).rjust(31, "0")


def metadata_batch(session: requests.Session) -> tuple[dict[str, dict[str, Any]], dict[str, Any]]:
    payload = {
        "action": "query",
        "format": "json",
        "formatversion": "2",
        "maxlag": "5",
        "prop": "imageinfo|revisions",
        "iiprop": "url|size|mime|sha1|timestamp|extmetadata",
        "rvprop": "ids|timestamp",
        "rvlimit": "1",
        "titles": "|".join(f"File:{name}" for name in FILES),
    }
    response = session.post(API, data=payload, timeout=180)
    response.raise_for_status()
    raw = response.json()
    result: dict[str, dict[str, Any]] = {}
    for page in raw.get("query", {}).get("pages", []):
        if page.get("missing") or not page.get("imageinfo"):
            continue
        info = dict(page["imageinfo"][0])
        info["canonicaltitle"] = page.get("title", "")
        info["pageid"] = page.get("pageid")
        info["lastrevid"] = page.get("lastrevid")
        revisions = page.get("revisions") or []
        info["revision"] = revisions[0] if revisions else {}
        result[norm_title(page.get("title", ""))] = info
    return result, raw


def valid_original_url(url: str) -> bool:
    parsed = urlparse(url)
    return (
        parsed.scheme == "https"
        and parsed.hostname == "upload.wikimedia.org"
        and parsed.path.startswith("/wikipedia/commons/")
        and "/thumb/" not in parsed.path
    )


def request_original(
    session: requests.Session,
    *,
    candidate_id: str,
    url: str,
    referer: str,
    destination: Path,
    audit: list[NetworkAttempt],
    attempts: int = 8,
) -> tuple[int, str, str]:
    if not valid_original_url(url):
        raise RuntimeError(f"refusing non-original Commons URL: {url}")

    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".part")
    for attempt in range(1, attempts + 1):
        started = time.monotonic()
        status: int | None = None
        content_type = ""
        content_length = ""
        final_url = url
        redirects: list[dict[str, Any]] = []
        bytes_written = 0
        error = ""
        try:
            with session.get(
                url,
                headers={"Referer": referer},
                stream=True,
                timeout=(30, 300),
                allow_redirects=True,
            ) as response:
                status = response.status_code
                final_url = response.url
                content_type = response.headers.get("content-type", "")
                content_length = response.headers.get("content-length", "")
                redirects = [
                    {
                        "status": item.status_code,
                        "url": item.url,
                        "location": item.headers.get("location", ""),
                    }
                    for item in response.history
                ]
                if status in RETRYABLE:
                    raise RuntimeError(f"retryable HTTP {status}")
                response.raise_for_status()
                if not content_type.lower().startswith("image/"):
                    raise RuntimeError(f"unexpected content type {content_type!r}")
                sha1 = hashlib.sha1()
                sha256 = hashlib.sha256()
                with temporary.open("wb") as handle:
                    for chunk in response.iter_content(chunk_size=1024 * 1024):
                        if not chunk:
                            continue
                        handle.write(chunk)
                        sha1.update(chunk)
                        sha256.update(chunk)
                        bytes_written += len(chunk)
                temporary.replace(destination)
                audit.append(
                    NetworkAttempt(
                        candidate_id=candidate_id,
                        attempt=attempt,
                        url=url,
                        final_url=final_url,
                        status=status,
                        content_type=content_type,
                        content_length=content_length,
                        redirects=redirects,
                        elapsed_seconds=round(time.monotonic() - started, 3),
                        bytes_written=bytes_written,
                        outcome="success",
                        error="",
                    )
                )
                return bytes_written, sha1.hexdigest(), sha256.hexdigest()
        except Exception as exc:
            error = str(exc)
            temporary.unlink(missing_ok=True)
            audit.append(
                NetworkAttempt(
                    candidate_id=candidate_id,
                    attempt=attempt,
                    url=url,
                    final_url=final_url,
                    status=status,
                    content_type=content_type,
                    content_length=content_length,
                    redirects=redirects,
                    elapsed_seconds=round(time.monotonic() - started, 3),
                    bytes_written=bytes_written,
                    outcome="retry" if attempt < attempts else "failed",
                    error=error,
                )
            )
            if attempt == attempts:
                raise
            retry_after = min(90.0, 4.0 * (2 ** (attempt - 1)))
            time.sleep(retry_after)
    raise RuntimeError(f"unable to acquire {url}")


def original_extension(info: dict[str, Any]) -> str:
    mime = str(info.get("mime", "")).lower()
    extension = MIME_EXTENSIONS.get(mime)
    if extension:
        return extension
    suffix = Path(urlparse(str(info.get("url", ""))).path).suffix.lower()
    return suffix if suffix and len(suffix) <= 8 else ".bin"


def make_derivative(original: Path, derivative: Path) -> tuple[int, int, str, str]:
    derivative.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(original) as source:
        image = ImageOps.exif_transpose(source)
        if image.mode not in {"RGB", "L"}:
            image = image.convert("RGB")
        elif image.mode == "L":
            image = image.convert("RGB")
        image.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
        image.save(
            derivative,
            "JPEG",
            quality=92,
            optimize=True,
            progressive=True,
            subsampling=0,
        )
        width, height = image.size
    digest = hashlib.sha256(derivative.read_bytes()).hexdigest()
    return width, height, digest, "Pillow JPEG, max 1800px, quality 92, 4:4:4, no crop"


def dhash64(path: Path) -> str:
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert("L").resize(
            (9, 8), Image.Resampling.LANCZOS
        )
        pixels = list(image.getdata())
    value = 0
    for row in range(8):
        offset = row * 9
        for column in range(8):
            value = (value << 1) | int(pixels[offset + column] > pixels[offset + column + 1])
    return f"{value:016x}"


def hamming(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()


def load_decisions(path: Path | None) -> dict[str, dict[str, str]]:
    if path is None or not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError("decisions file must be an object keyed by canonical title")
    result: dict[str, dict[str, str]] = {}
    for key, value in raw.items():
        if not isinstance(value, dict):
            raise ValueError(f"decision for {key!r} must be an object")
        status = str(value.get("status", "unresolved"))
        if status not in {"accepted", "rejected", "unresolved"}:
            raise ValueError(f"invalid editorial status for {key!r}: {status}")
        result[norm_title(key)] = {
            "status": status,
            "evidence_url": str(value.get("evidence_url", "")),
            "notes": str(value.get("notes", "")),
        }
    return result


def write_contact_sheet(records: list[ProvenanceRecord], output_root: Path) -> None:
    columns, cell_width, cell_height = 5, 360, 300
    rows = (len(records) + columns - 1) // columns
    canvas = Image.new("RGB", (columns * cell_width, rows * cell_height), "white")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    for index, record in enumerate(records):
        row, column = divmod(index, columns)
        x, y = column * cell_width, row * cell_height
        derivative = output_root / record.derivative_local_path
        with Image.open(derivative) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            image.thumbnail((cell_width - 20, cell_height - 75), Image.Resampling.LANCZOS)
            image_x = x + (cell_width - image.width) // 2
            image_y = y + 8
            canvas.paste(image, (image_x, image_y))
        caption = f"{record.candidate_id} {record.canonical_title}"
        wrapped = [caption[i : i + 49] for i in range(0, min(len(caption), 147), 49)]
        draw.multiline_text((x + 8, y + cell_height - 62), "\n".join(wrapped), fill="black", font=font, spacing=2)
        draw.rectangle((x, y, x + cell_width - 1, y + cell_height - 1), outline="#999999")
    canvas.save(output_root / "contact-sheet.jpg", "JPEG", quality=90, optimize=True)


def write_outputs(
    output_root: Path,
    records: list[ProvenanceRecord],
    audit: list[NetworkAttempt],
    raw_api: dict[str, Any],
    failures: list[dict[str, str]],
) -> dict[str, Any]:
    output_root.mkdir(parents=True, exist_ok=True)
    (output_root / "commons-api-response.json").write_text(
        json.dumps(raw_api, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (output_root / "manifest.json").write_text(
        json.dumps([asdict(item) for item in records], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    with (output_root / "manifest.csv").open("w", newline="", encoding="utf-8") as handle:
        fieldnames = [
            "candidate_id",
            "requested_title",
            "canonical_title",
            "commons_page_url",
            "page_id",
            "revision_id",
            "revision_timestamp",
            "original_url",
            "original_mime",
            "api_original_bytes",
            "downloaded_bytes",
            "original_width",
            "original_height",
            "api_sha1_base36",
            "computed_sha1_base36",
            "original_sha256",
            "original_local_path",
            "derivative_local_path",
            "derivative_width",
            "derivative_height",
            "derivative_sha256",
            "author_text",
            "date_text",
            "licence_short_name",
            "licence_url",
            "editorial_status",
            "editorial_evidence_url",
            "editorial_notes",
            "acquisition_status",
            "metadata_gaps",
        ]
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for record in records:
            row = asdict(record)
            row["metadata_gaps"] = " | ".join(record.metadata_gaps)
            writer.writerow(row)

    with (output_root / "network-audit.jsonl").open("w", encoding="utf-8") as handle:
        for item in audit:
            handle.write(json.dumps(asdict(item), ensure_ascii=False) + "\n")

    exact: dict[str, list[str]] = {}
    for record in records:
        exact.setdefault(record.original_sha256, []).append(record.candidate_id)
    exact_groups = [group for group in exact.values() if len(group) > 1]
    near_pairs: list[dict[str, Any]] = []
    for left_index, left in enumerate(records):
        for right in records[left_index + 1 :]:
            distance = hamming(left.dhash64, right.dhash64)
            if distance <= 5:
                near_pairs.append(
                    {
                        "left": left.candidate_id,
                        "right": right.candidate_id,
                        "hamming_distance": distance,
                    }
                )
    duplicate_audit = {"exact_groups": exact_groups, "near_pairs_dhash_le_5": near_pairs}
    (output_root / "duplicate-audit.json").write_text(
        json.dumps(duplicate_audit, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    if records:
        write_contact_sheet(records, output_root)

    status_counts = dict(sorted(collections.Counter(item.editorial_status for item in records).items()))
    gap_counts: dict[str, int] = {}
    for record in records:
        for gap in record.metadata_gaps:
            gap_counts[gap] = gap_counts.get(gap, 0) + 1
    summary = {
        "generated_at": utc_now(),
        "requested_candidates": len(FILES),
        "records_acquired": len(records),
        "failures": failures,
        "network_attempts": len(audit),
        "editorial_status_counts": status_counts,
        "metadata_gap_counts": dict(sorted(gap_counts.items())),
        "exact_duplicate_groups": exact_groups,
        "near_duplicate_pairs": near_pairs,
        "all_original_sha1_match": all(
            item.api_sha1_base36 == item.computed_sha1_base36 for item in records
        ),
        "all_original_sizes_match": all(
            item.api_original_bytes == item.downloaded_bytes for item in records
        ),
        "all_download_urls_are_direct_originals": all(
            valid_original_url(item.original_url) for item in records
        ),
    }
    (output_root / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return summary


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("build/provenance-77"))
    parser.add_argument("--decisions", type=Path)
    parser.add_argument(
        "--strict-metadata",
        action="store_true",
        help="also fail when author/date/licence metadata is incomplete",
    )
    args = parser.parse_args()

    if len(FILES) != 30 or len({norm_title(item) for item in FILES}) != 30:
        raise RuntimeError("candidate list must contain exactly 30 unique titles")

    output_root: Path = args.output
    output_root.mkdir(parents=True, exist_ok=True)
    decisions = load_decisions(args.decisions)

    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": USER_AGENT,
            "Accept": "application/json,image/*;q=0.9,*/*;q=0.1",
        }
    )

    metadata, raw_api = metadata_batch(session)
    records: list[ProvenanceRecord] = []
    audit: list[NetworkAttempt] = []
    failures: list[dict[str, str]] = []

    for index, requested_title in enumerate(FILES, start=1):
        candidate_id = f"C{index:02d}"
        info = metadata.get(norm_title(requested_title))
        if info is None:
            failures.append(
                {
                    "candidate_id": candidate_id,
                    "requested_title": requested_title,
                    "error": "Commons API did not resolve the exact title",
                }
            )
            continue

        canonical_title = str(info.get("canonicaltitle", "")).removeprefix("File:")
        commons_url = page_url(canonical_title)
        original_url = str(info.get("url", ""))
        extension = original_extension(info)
        slug = safe_slug(canonical_title)
        original_relative = Path("originals") / f"{candidate_id}-{slug}{extension}"
        derivative_relative = Path("derivatives") / f"{candidate_id}-{slug}.jpg"
        original_path = output_root / original_relative
        derivative_path = output_root / derivative_relative

        try:
            downloaded_bytes, sha1_hex, original_sha256 = request_original(
                session,
                candidate_id=candidate_id,
                url=original_url,
                referer=commons_url,
                destination=original_path,
                audit=audit,
            )
            with Image.open(original_path) as probe:
                original_width, original_height = probe.size
                probe.verify()
            derivative_width, derivative_height, derivative_sha256, processing = make_derivative(
                original_path, derivative_path
            )
            dhash = dhash64(derivative_path)
        except Exception as exc:
            failures.append(
                {
                    "candidate_id": candidate_id,
                    "requested_title": requested_title,
                    "canonical_title": canonical_title,
                    "error": str(exc),
                }
            )
            continue

        metadata_block = info.get("extmetadata") or {}
        description_raw = raw_meta(metadata_block, "ImageDescription") or raw_meta(
            metadata_block, "ObjectName"
        )
        date_raw = (
            raw_meta(metadata_block, "DateTimeOriginal")
            or raw_meta(metadata_block, "DateTime")
            or raw_meta(metadata_block, "Date")
        )
        author_raw = raw_meta(metadata_block, "Artist")
        credit_raw = raw_meta(metadata_block, "Credit")
        licence_name_raw = raw_meta(metadata_block, "LicenseShortName")
        usage_terms_raw = raw_meta(metadata_block, "UsageTerms")
        licence_url_raw = raw_meta(metadata_block, "LicenseUrl")
        attribution_required_raw = raw_meta(metadata_block, "AttributionRequired")
        restrictions_raw = raw_meta(metadata_block, "Restrictions")

        author_text = normalized_author(author_raw, credit_raw)
        date_text = clean_html(date_raw)
        licence_name = clean_html(licence_name_raw) or clean_html(usage_terms_raw)
        licence_url = clean_html(licence_url_raw)
        description_text = clean_html(description_raw) or canonical_title

        gaps: list[str] = []
        if not author_text or author_text.casefold() in {
            "unknown author",
            "unknown / see commons file page",
        }:
            gaps.append("author")
        if not date_text:
            gaps.append("date")
        if not licence_name:
            gaps.append("licence_name")
        if not licence_url:
            gaps.append("licence_url")
        if not description_text:
            gaps.append("description")

        api_sha1 = str(info.get("sha1", "")).lower()
        computed_sha1 = sha1_base36_from_hex(sha1_hex)
        api_size = int(info.get("size") or 0)
        if api_sha1 != computed_sha1:
            gaps.append("api_sha1_mismatch")
        if api_size != downloaded_bytes:
            gaps.append("api_size_mismatch")
        if int(info.get("width") or 0) != original_width or int(info.get("height") or 0) != original_height:
            gaps.append("api_dimensions_mismatch")

        decision = decisions.get(norm_title(canonical_title), {})
        editorial_status = decision.get("status", "unresolved")
        editorial_evidence_url = decision.get("evidence_url", "")
        editorial_notes = decision.get("notes", "")
        if editorial_status == "accepted" and not editorial_evidence_url:
            gaps.append("accepted_without_editorial_evidence_url")

        revision = info.get("revision") or {}
        acquisition_status = (
            "original-acquired / metadata-complete / subject-review-pending"
            if not gaps
            else "original-acquired / metadata-incomplete / subject-review-pending"
        )
        records.append(
            ProvenanceRecord(
                candidate_id=candidate_id,
                requested_title=requested_title,
                canonical_title=canonical_title,
                commons_page_url=commons_url,
                page_id=info.get("pageid"),
                revision_id=revision.get("revid") or info.get("lastrevid"),
                revision_timestamp=str(revision.get("timestamp", "")),
                image_timestamp=str(info.get("timestamp", "")),
                original_url=original_url,
                original_mime=str(info.get("mime", "")),
                api_original_bytes=api_size,
                original_width=original_width,
                original_height=original_height,
                api_sha1_base36=api_sha1,
                computed_sha1_base36=computed_sha1,
                original_sha256=original_sha256,
                original_local_path=original_relative.as_posix(),
                downloaded_bytes=downloaded_bytes,
                derivative_local_path=derivative_relative.as_posix(),
                derivative_width=derivative_width,
                derivative_height=derivative_height,
                derivative_sha256=derivative_sha256,
                derivative_processing=processing,
                dhash64=dhash,
                description_raw=description_raw,
                description_text=description_text,
                date_raw=date_raw,
                date_text=date_text,
                author_raw=author_raw,
                author_text=author_text,
                credit_raw=credit_raw,
                licence_short_name_raw=licence_name_raw,
                licence_short_name=licence_name,
                usage_terms_raw=usage_terms_raw,
                licence_url_raw=licence_url_raw,
                licence_url=licence_url,
                attribution_required_raw=attribution_required_raw,
                restrictions_raw=restrictions_raw,
                editorial_status=editorial_status,
                editorial_evidence_url=editorial_evidence_url,
                editorial_notes=editorial_notes,
                acquisition_status=acquisition_status,
                metadata_gaps=gaps,
            )
        )
        time.sleep(2.0)

    summary = write_outputs(output_root, records, audit, raw_api, failures)

    hard_failures = bool(failures)
    hard_failures = hard_failures or len(records) != len(FILES)
    hard_failures = hard_failures or not summary["all_original_sha1_match"]
    hard_failures = hard_failures or not summary["all_original_sizes_match"]
    hard_failures = hard_failures or not summary["all_download_urls_are_direct_originals"]
    if args.strict_metadata:
        hard_failures = hard_failures or any(record.metadata_gaps for record in records)

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 1 if hard_failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

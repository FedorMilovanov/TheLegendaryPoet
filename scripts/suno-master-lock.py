#!/usr/bin/env python3
"""Optional local raster QA/compositing. Requires Pillow; no generation or network."""
import argparse
import json
import io
import struct
from pathlib import Path
from PIL import Image, ImageChops, PngImagePlugin


def load(path):
    with Image.open(path) as image:
        if getattr(image, "n_frames", 1) != 1 or image.getexif().get(274, 1) != 1:
            raise ValueError("use single-frame, orientation-normalized inputs")
        image.load()
        return image.copy()


COLOR_KEYS = ("icc_profile", "gamma", "srgb", "chromaticity")


def png_color_info(image):
    """Preserve supported PNG color chunks; Pillow does not copy them by default."""
    info = PngImagePlugin.PngInfo()
    if "gamma" in image.info:
        info.add(b"gAMA", struct.pack(">I", round(image.info["gamma"] * 100000)))
    if "srgb" in image.info:
        info.add(b"sRGB", bytes([image.info["srgb"]]))
    if "chromaticity" in image.info:
        info.add(b"cHRM", struct.pack(">8I", *(round(v * 100000) for v in image.info["chromaticity"])))
    return info


def validate_inputs(base, candidate, mask):
    if base.size != candidate.size or base.size != mask.size:
        raise ValueError("canvas mismatch; align candidate and mask before QA")
    if base.mode not in ("RGB", "RGBA") or candidate.mode not in ("RGB", "RGBA"):
        raise ValueError("use RGB/RGBA inputs")
    if mask.mode != "L":
        raise ValueError("mask must be single-channel L")
    if not mask.getbbox() or mask.getextrema()[0] != 0:
        raise ValueError("local mask must contain both editable and protected pixels")
    for key in COLOR_KEYS:
        if base.info.get(key) != candidate.info.get(key):
            raise ValueError(f"color metadata mismatch: {key}; reconcile color before compositing")
    for image in (base, candidate):
        if image.mode == "RGB" and "transparency" in image.info:
            raise ValueError("convert RGB transparency to explicit RGBA before QA")


def verify(base, final, mask):
    validate_inputs(base, final, mask)
    bands = ImageChops.difference(base.convert("RGBA"), final.convert("RGBA")).split()
    delta = bands[0]
    for band in bands[1:]:
        delta = ImageChops.lighter(delta, band)
    changed = delta.point(lambda value: 255 if value else 0)
    protected = mask.point(lambda value: 0 if value else 255)
    outside = ImageChops.multiply(changed, protected).histogram()[255]
    count = changed.histogram()[255]
    return {"valid": outside == 0, "changed": count, "outside": outside,
            "size": list(base.size), "changed_bbox": changed.getbbox(),
            "scope": "decoded pixels outside mask; not visual/geometry QA"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=("verify", "composite"))
    parser.add_argument("base")
    parser.add_argument("candidate")
    parser.add_argument("mask")
    parser.add_argument("output", nargs="?")
    args = parser.parse_args()
    try:
        base, candidate, mask = map(load, (args.base, args.candidate, args.mask))
        if args.operation == "verify":
            if args.output:
                raise ValueError("verify does not write output")
            result = verify(base, candidate, mask)
        else:
            validate_inputs(base, candidate, mask)
            if not args.output or Path(args.output).suffix.lower() != ".png":
                raise ValueError("composite requires a new PNG output")
            if base.mode == "RGB" and candidate.mode == "RGBA" and candidate.getchannel("A").getextrema() != (255, 255):
                raise ValueError("nonopaque candidate would lose alpha on RGB base")
            final = Image.composite(candidate.convert(base.mode), base, mask)
            final.info = base.info.copy()
            result = verify(base, final, mask)
            if not result["valid"]:
                raise ValueError("composite failed pixel guard")
            # Validate encoded bytes before creating the destination.
            encoded = io.BytesIO()
            final.save(encoded, format="PNG", icc_profile=base.info.get("icc_profile"),
                       pnginfo=png_color_info(base))
            encoded.seek(0)
            result = verify(base, load(encoded), mask)
            if not result["valid"]:
                raise ValueError("encoded composite failed pixel guard")
            # Exclusive create: never overwrite the source or another candidate.
            with open(args.output, "xb") as target:
                target.write(encoded.getbuffer())
            result = verify(base, load(args.output), mask)
        print(json.dumps(result))
        return 0 if result["valid"] else 1
    except (OSError, ValueError, OverflowError, struct.error) as error:
        print(json.dumps({"valid": False, "reason": str(error)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

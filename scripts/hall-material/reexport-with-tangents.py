from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy

EXPECTED_VERSION = (4, 5, 12)


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Re-export Hall material spike with explicit tangents")
    parser.add_argument("--contract", required=True)
    parser.add_argument("--blend", required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args(args)


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("tangent re-export must run in Blender background mode")

    contract = json.loads(Path(args.contract).read_text(encoding="utf-8"))
    blend_path = Path(args.blend).resolve()
    output_path = Path(args.output).resolve()
    bpy.ops.wm.open_mainfile(filepath=str(blend_path), load_ui=False)

    if len(bpy.data.lights) != 0:
        fail("material-spike blend must contain zero lights before transport export")

    bpy.ops.object.select_all(action="DESELECT")
    for name in contract["bay"]["exportNodes"]:
        obj = bpy.data.objects.get(name)
        if obj is None:
            fail(f"missing export node: {name}")
        obj.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_cameras=True,
        export_materials="EXPORT",
        export_tangents=True,
        export_yup=True,
    )
    if not output_path.exists() or output_path.stat().st_size == 0:
        fail("tangent re-export did not create raw GLB")
    print(f"Hall material spike tangent GLB exported: {output_path}")


if __name__ == "__main__":
    main()

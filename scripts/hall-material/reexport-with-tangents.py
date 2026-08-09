from __future__ import annotations

import argparse
import hashlib
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


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def seal_final_raw_glb_identity(output_path: Path) -> None:
    evidence_path = output_path.parent / "source-evidence.json"
    if not evidence_path.exists():
        fail(f"missing source evidence to reseal after tangent export: {evidence_path}")

    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    files = evidence.get("files")
    if not isinstance(files, dict):
        fail("source evidence must contain a files object before tangent reseal")

    final_identity = {
        "path": output_path.name,
        "bytes": output_path.stat().st_size,
        "sha256": sha256_file(output_path),
    }
    files["rawGlb"] = final_identity

    temporary_path = evidence_path.with_name(f"{evidence_path.name}.tmp")
    temporary_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary_path.replace(evidence_path)

    sealed = json.loads(evidence_path.read_text(encoding="utf-8"))
    if sealed.get("files", {}).get("rawGlb") != final_identity:
        fail("source evidence rawGlb identity did not persist after tangent reseal")
    if final_identity["bytes"] <= 0 or final_identity["sha256"] != sha256_file(output_path):
        fail("source evidence rawGlb identity does not match final tangent GLB")


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

    seal_final_raw_glb_identity(output_path)
    print(f"Hall material spike tangent GLB exported and evidence resealed: {output_path}")


if __name__ == "__main__":
    main()

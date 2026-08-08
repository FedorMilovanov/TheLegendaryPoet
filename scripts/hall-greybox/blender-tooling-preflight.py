from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import bpy

EXPECTED_VERSION = (4, 5, 12)
PROXY_HEIGHT_METRES = 1.75
REQUIRED_COLLECTIONS = ("COLL_CORE", "COLL_CAMERAS", "COLL_EXPORT_HELPERS")
REQUIRED_OBJECTS = ("TOOLING_FLOOR", "HUMAN_PROXY", "CAM_TOOLING_PREFLIGHT")


def fail(message: str) -> None:
    raise RuntimeError(message)


def cli_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Hall v3 Blender tooling smoke test")
    parser.add_argument("--output-dir", required=True)
    return parser.parse_args(args)


def as_text(value: object) -> str:
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return str(value)


def move_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)


def create_smoke_scene() -> tuple[Path, dict[str, object]]:
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("greybox tooling preflight must run in Blender background mode")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "HALL_GREYBOX_TOOLING_PREFLIGHT"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene.unit_settings.scale_length = 1.0

    collections: dict[str, bpy.types.Collection] = {}
    for name in REQUIRED_COLLECTIONS:
        collection = bpy.data.collections.new(name)
        scene.collection.children.link(collection)
        collections[name] = collection

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, -0.05))
    floor = bpy.context.object
    if floor is None:
        fail("failed to create tooling floor")
    floor.name = "TOOLING_FLOOR"
    floor.dimensions = (4.0, 4.0, 0.1)
    move_to_collection(floor, collections["COLL_CORE"])

    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, PROXY_HEIGHT_METRES / 2.0))
    proxy = bpy.context.object
    if proxy is None:
        fail("failed to create human proxy")
    proxy.name = "HUMAN_PROXY"
    proxy.dimensions = (0.45, 0.30, PROXY_HEIGHT_METRES)
    move_to_collection(proxy, collections["COLL_EXPORT_HELPERS"])

    camera_data = bpy.data.cameras.new("CAM_TOOLING_PREFLIGHT_DATA")
    camera_data.lens = 35.0
    camera = bpy.data.objects.new("CAM_TOOLING_PREFLIGHT", camera_data)
    camera.location = (0.0, -4.0, 1.60)
    camera.rotation_euler = (math.radians(78.0), 0.0, 0.0)
    collections["COLL_CAMERAS"].objects.link(camera)
    scene.camera = camera

    if len(bpy.data.materials) != 0:
        fail("tooling smoke scene must not create materials")
    if len(bpy.data.lights) != 0:
        fail("tooling smoke scene must not create lights")

    output_dir = Path(cli_args().output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    blend_path = output_dir / "tooling-smoke.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))

    return blend_path, {
        "version": bpy.app.version_string,
        "versionTuple": list(bpy.app.version),
        "buildHash": as_text(bpy.app.build_hash),
        "background": bool(bpy.app.background),
    }


def validate_round_trip(blend_path: Path, runtime: dict[str, object]) -> dict[str, object]:
    bpy.ops.wm.open_mainfile(filepath=str(blend_path), load_ui=False)
    scene = bpy.context.scene

    if scene.unit_settings.system != "METRIC":
        fail(f"expected METRIC unit system, got {scene.unit_settings.system}")
    if scene.unit_settings.length_unit != "METERS":
        fail(f"expected METERS length unit, got {scene.unit_settings.length_unit}")
    if abs(scene.unit_settings.scale_length - 1.0) > 1e-9:
        fail(f"expected scale_length=1.0, got {scene.unit_settings.scale_length}")

    collection_names = sorted(collection.name for collection in bpy.data.collections)
    object_names = sorted(obj.name for obj in bpy.data.objects)
    for name in REQUIRED_COLLECTIONS:
        if name not in collection_names:
            fail(f"round-trip scene lost required collection: {name}")
    for name in REQUIRED_OBJECTS:
        if name not in object_names:
            fail(f"round-trip scene lost required object: {name}")

    proxy = bpy.data.objects.get("HUMAN_PROXY")
    if proxy is None:
        fail("round-trip scene lost HUMAN_PROXY")
    proxy_height = float(proxy.dimensions.z)
    if abs(proxy_height - PROXY_HEIGHT_METRES) > 1e-6:
        fail(f"human proxy height drifted: expected {PROXY_HEIGHT_METRES}, got {proxy_height}")

    camera = bpy.data.objects.get("CAM_TOOLING_PREFLIGHT")
    if camera is None or camera.type != "CAMERA":
        fail("round-trip scene lost tooling camera")

    if len(bpy.data.materials) != 0:
        fail("round-trip tooling scene unexpectedly contains materials")
    if len(bpy.data.lights) != 0:
        fail("round-trip tooling scene unexpectedly contains lights")

    return {
        "schemaVersion": 1,
        "laneId": "TLP-HALL-001",
        "phase": "metricGreybox",
        "runtime": runtime,
        "scene": {
            "name": scene.name,
            "unitSystem": scene.unit_settings.system,
            "lengthUnit": scene.unit_settings.length_unit,
            "scaleLength": float(scene.unit_settings.scale_length),
            "collections": collection_names,
            "objects": object_names,
            "humanProxyHeightMetres": proxy_height,
            "toolingCameraLensMm": float(camera.data.lens),
            "materials": len(bpy.data.materials),
            "lights": len(bpy.data.lights),
        },
        "roundTripSaveReopen": True,
        "rendered": False,
        "blendFile": blend_path.name,
    }


def main() -> None:
    blend_path, runtime = create_smoke_scene()
    evidence = validate_round_trip(blend_path, runtime)
    evidence_path = blend_path.parent / "preflight.json"
    evidence_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Hall greybox Blender tooling preflight passed: {evidence_path}")


if __name__ == "__main__":
    main()

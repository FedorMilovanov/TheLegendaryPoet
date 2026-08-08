from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

EXPECTED_VERSION = (4, 5, 12)
WITNESSES = (
    "entryReveal",
    "orientation",
    "firstTransition",
    "pushkinApproach",
    "pushkinViewing",
    "reverseExit",
)
EXPECTED_SOURCE_FINGERPRINT = "5d5d0ddd8b150aa64afb73a2a3d9e00c6005e99fc935a6d4707a49ecd475fe65"
EXPECTED_PUSHKIN_OBJECT = "EXHIBIT_alexander-pushkin"
CAMERA_COLLECTION = "COLL_CAMERA_APPROVAL"


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Generate Hall v3 H3 camera approval candidates")
    parser.add_argument("--rigs", required=True)
    parser.add_argument("--source-blend", required=True)
    parser.add_argument("--source-manifest", required=True)
    parser.add_argument("--output-dir", required=True)
    return parser.parse_args(args)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def stable_float(value: float) -> float:
    return round(float(value), 8)


def geometry_fingerprint() -> str:
    payload: list[dict[str, Any]] = []
    for obj in sorted((item for item in bpy.data.objects if item.type == "MESH"), key=lambda item: item.name):
        mesh = obj.data
        payload.append(
            {
                "name": obj.name,
                "matrixWorld": [stable_float(value) for row in obj.matrix_world for value in row],
                "vertices": [
                    [stable_float(vertex.co.x), stable_float(vertex.co.y), stable_float(vertex.co.z)]
                    for vertex in mesh.vertices
                ],
                "edges": [list(edge.vertices) for edge in mesh.edges],
                "polygons": [list(polygon.vertices) for polygon in mesh.polygons],
            }
        )
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def camera_collection() -> bpy.types.Collection:
    existing = bpy.data.collections.get(CAMERA_COLLECTION)
    if existing is not None:
        for obj in list(existing.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        return existing
    collection = bpy.data.collections.new(CAMERA_COLLECTION)
    bpy.context.scene.collection.children.link(collection)
    return collection


def create_camera(name: str, spec: dict[str, Any], collection: bpy.types.Collection) -> bpy.types.Object:
    data = bpy.data.cameras.new(f"{name}_DATA")
    data.lens = float(spec["lensMm"])
    data.sensor_width = 36.0
    data.clip_start = 0.05
    data.clip_end = 200.0
    camera = bpy.data.objects.new(name, data)
    camera.location = tuple(float(value) for value in spec["position"])
    direction = Vector(tuple(float(value) for value in spec["target"])) - camera.location
    if direction.length <= 0.05:
        fail(f"camera target is too close: {name}")
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    collection.objects.link(camera)
    return camera


def ray_witness(origin_values: list[float], target_values: list[float], expected_object: str | None) -> dict[str, Any]:
    scene = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()
    origin = Vector(tuple(float(value) for value in origin_values))
    target = Vector(tuple(float(value) for value in target_values))
    vector = target - origin
    distance = vector.length
    if distance <= 0.05:
        fail("camera witness ray is too short")
    hit, _location, _normal, _index, obj, _matrix = scene.ray_cast(
        depsgraph,
        origin,
        vector.normalized(),
        distance=max(distance - 0.02, 0.01),
    )
    hit_name = obj.name if hit and obj else None
    visible = hit_name == expected_object if expected_object else not hit
    return {
        "visible": visible,
        "hitObject": hit_name,
        "expectedVisibleObject": expected_object,
        "occluder": None if visible else hit_name,
        "distanceMetres": round(distance, 4),
    }


def set_resolution(resolution: list[int]) -> None:
    scene = bpy.context.scene
    scene.render.resolution_x = int(resolution[0])
    scene.render.resolution_y = int(resolution[1])
    scene.render.resolution_percentage = 100


def projected_bounds(camera: bpy.types.Object, obj: bpy.types.Object, resolution: list[int]) -> dict[str, Any]:
    scene = bpy.context.scene
    set_resolution(resolution)
    points = [world_to_camera_view(scene, camera, obj.matrix_world @ Vector(corner)) for corner in obj.bound_box]
    xs = [float(point.x) for point in points]
    ys = [float(point.y) for point in points]
    zs = [float(point.z) for point in points]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    clipped_min_x, clipped_max_x = max(0.0, min_x), min(1.0, max_x)
    clipped_min_y, clipped_max_y = max(0.0, min_y), min(1.0, max_y)
    visible_width = max(0.0, clipped_max_x - clipped_min_x)
    visible_height = max(0.0, clipped_max_y - clipped_min_y)
    return {
        "minX": round(min_x, 5),
        "maxX": round(max_x, 5),
        "minY": round(min_y, 5),
        "maxY": round(max_y, 5),
        "width": round(max_x - min_x, 5),
        "height": round(max_y - min_y, 5),
        "visibleAreaFraction": round(visible_width * visible_height, 5),
        "fullyInsideFrame": min_x >= 0.0 and max_x <= 1.0 and min_y >= 0.0 and max_y <= 1.0 and min(zs) > 0.0,
        "inFront": min(zs) > 0.0,
        "center": [round((min_x + max_x) / 2.0, 5), round((min_y + max_y) / 2.0, 5)],
    }


def render_camera(camera: bpy.types.Object, output: Path, resolution: list[int]) -> None:
    scene = bpy.context.scene
    set_resolution(resolution)
    scene.camera = camera
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)


def collect_outputs(root: Path) -> list[dict[str, Any]]:
    outputs: list[dict[str, Any]] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.name == "manifest.json":
            continue
        outputs.append(
            {
                "path": str(path.relative_to(root)).replace("\\", "/"),
                "bytes": path.stat().st_size,
                "sha256": sha256_file(path),
            }
        )
    return outputs


def verify_source_scene(source_manifest: dict[str, Any], expected_source_blend: Path) -> str:
    if source_manifest.get("candidateId") != "H3":
        fail("camera approval source manifest must be H3")
    if source_manifest.get("layoutFingerprint") != EXPECTED_SOURCE_FINGERPRINT:
        fail("camera approval source manifest does not match frozen H3 topology fingerprint")
    scene = bpy.context.scene
    if scene.unit_settings.system != "METRIC" or scene.unit_settings.length_unit != "METERS" or abs(scene.unit_settings.scale_length - 1.0) > 1e-9:
        fail("camera approval source .blend lost metre-scale scene units")
    if scene.render.engine != "BLENDER_WORKBENCH":
        fail("camera approval source must remain neutral Blender Workbench")
    if len(bpy.data.materials) != 0 or len(bpy.data.lights) != 0:
        fail("camera approval source must contain zero materials and zero lights")
    if bpy.data.objects.get(EXPECTED_PUSHKIN_OBJECT) is None:
        fail("camera approval source lost Pushkin proxy")
    for witness in WITNESSES:
        if bpy.data.objects.get(f"CAM_H3_{witness}") is None:
            fail(f"camera approval source lost frozen H3 witness camera: {witness}")
    if not expected_source_blend.exists():
        fail("camera approval source .blend does not exist")
    return geometry_fingerprint()


def validate_rigs_source(rigs: dict[str, Any]) -> None:
    if rigs.get("laneId") != "TLP-HALL-001" or rigs.get("phase") != "cameraApproval":
        fail("camera rig source identity mismatch")
    if rigs.get("selectedTopology") != "H3" or rigs.get("approvedRig") is not None:
        fail("camera candidate-authoring must remain H3-only with approvedRig=null")
    rig_ids = [rig.get("id") for rig in rigs.get("rigs", [])]
    if rig_ids != ["R0", "R1", "R2", "R3"]:
        fail("camera source must compare R0/R1/R2/R3 in order")
    desktop = rigs.get("render", {}).get("desktopWitnesses", [])
    if desktop != list(WITNESSES):
        fail("camera source must retain all six desktop witnesses")
    if rigs.get("render", {}).get("mobileWitnesses") != ["entryReveal", "pushkinApproach", "pushkinViewing"]:
        fail("camera source must retain the three portrait witnesses")
    frozen_baseline: dict[str, Any] | None = None
    for rig in rigs["rigs"]:
        cameras = rig.get("cameras", {})
        if list(cameras.keys()) != list(WITNESSES):
            fail(f"{rig['id']}: camera ids/order must match the six certified witnesses")
        if rig["id"] == "R0":
            frozen_baseline = cameras
            continue
        if frozen_baseline is None:
            fail("R0 benchmark must precede candidate rigs")
        for witness in WITNESSES:
            if witness == "pushkinViewing":
                continue
            if cameras[witness] != frozen_baseline[witness]:
                fail(f"{rig['id']}/{witness}: non-problem witness drifted from frozen H3 benchmark")


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("camera candidate generation must run in Blender background mode")

    rigs_path = Path(args.rigs).resolve()
    source_blend = Path(args.source_blend).resolve()
    source_manifest_path = Path(args.source_manifest).resolve()
    output_root = Path(args.output_dir).resolve()
    output_root.mkdir(parents=True, exist_ok=True)

    rigs = read_json(rigs_path)
    validate_rigs_source(rigs)
    source_manifest = read_json(source_manifest_path)

    bpy.ops.wm.open_mainfile(filepath=str(source_blend), load_ui=False)
    before_geometry = verify_source_scene(source_manifest, source_blend)
    source_blend_sha = sha256_file(source_blend)
    source_manifest_sha = sha256_file(source_manifest_path)
    source_mesh_count = sum(1 for obj in bpy.data.objects if obj.type == "MESH")
    source_material_count = len(bpy.data.materials)
    source_light_count = len(bpy.data.lights)

    collection = camera_collection()
    pushkin = bpy.data.objects.get(EXPECTED_PUSHKIN_OBJECT)
    case_1 = bpy.data.objects.get("EXHIBIT_DOC_CASE_01")
    case_2 = bpy.data.objects.get("EXHIBIT_DOC_CASE_02")
    if pushkin is None or case_1 is None or case_2 is None:
        fail("camera approval source must retain Pushkin anchor plus two document cases")

    index_manifests: list[str] = []
    rig_summaries: dict[str, Any] = {}
    for rig in rigs["rigs"]:
        rig_id = rig["id"]
        rig_dir = output_root / rig_id
        desktop_dir = rig_dir / "desktop"
        mobile_dir = rig_dir / "mobile"
        desktop_dir.mkdir(parents=True, exist_ok=True)
        mobile_dir.mkdir(parents=True, exist_ok=True)

        cameras: dict[str, bpy.types.Object] = {}
        visibility: dict[str, Any] = {}
        for witness in WITNESSES:
            spec = rig["cameras"][witness]
            camera = create_camera(f"CAM_CA_{rig_id}_{witness}", spec, collection)
            cameras[witness] = camera
            expected = EXPECTED_PUSHKIN_OBJECT if witness == "pushkinViewing" else None
            ray_target = list(pushkin.location) if expected else spec["nextDestination"]
            ray = ray_witness(spec["position"], ray_target, expected)
            ray["note"] = spec["note"]
            ray["lensMm"] = float(spec["lensMm"])
            visibility[witness] = ray

        for witness in rigs["render"]["desktopWitnesses"]:
            render_camera(cameras[witness], desktop_dir / f"{witness}.png", rigs["render"]["desktopResolution"])
        for witness in rigs["render"]["mobileWitnesses"]:
            render_camera(cameras[witness], mobile_dir / f"{witness}.png", rigs["render"]["mobileResolution"])

        viewing_camera = cameras["pushkinViewing"]
        framing = {
            "desktop": {
                "anchor": projected_bounds(viewing_camera, pushkin, rigs["render"]["desktopResolution"]),
                "documentCase01": projected_bounds(viewing_camera, case_1, rigs["render"]["desktopResolution"]),
                "documentCase02": projected_bounds(viewing_camera, case_2, rigs["render"]["desktopResolution"]),
            },
            "mobile": {
                "anchor": projected_bounds(viewing_camera, pushkin, rigs["render"]["mobileResolution"]),
                "documentCase01": projected_bounds(viewing_camera, case_1, rigs["render"]["mobileResolution"]),
                "documentCase02": projected_bounds(viewing_camera, case_2, rigs["render"]["mobileResolution"]),
            },
        }

        after_geometry = geometry_fingerprint()
        if after_geometry != before_geometry:
            fail(f"{rig_id}: camera evidence generation mutated frozen mesh geometry")
        if sum(1 for obj in bpy.data.objects if obj.type == "MESH") != source_mesh_count:
            fail(f"{rig_id}: camera evidence generation changed mesh object count")
        if len(bpy.data.materials) != source_material_count or len(bpy.data.lights) != source_light_count:
            fail(f"{rig_id}: camera evidence generation changed materials/lights")

        manifest = {
            "schemaVersion": 1,
            "laneId": "TLP-HALL-001",
            "phase": "cameraApproval",
            "rigId": rig_id,
            "rigName": rig["name"],
            "rigStatus": rig["status"],
            "selectedTopology": "H3",
            "approvedRig": None,
            "runtime": {
                "versionTuple": list(bpy.app.version),
                "version": bpy.app.version_string,
                "buildHash": bpy.app.build_hash.decode("utf-8", errors="replace") if isinstance(bpy.app.build_hash, bytes) else str(bpy.app.build_hash),
                "background": bool(bpy.app.background),
            },
            "source": {
                "blendSha256": source_blend_sha,
                "manifestSha256": source_manifest_sha,
                "layoutFingerprint": source_manifest["layoutFingerprint"],
                "geometryFingerprintBefore": before_geometry,
                "geometryFingerprintAfter": after_geometry,
                "meshObjects": source_mesh_count,
                "materials": source_material_count,
                "lights": source_light_count,
            },
            "cameraWitnesses": visibility,
            "pushkinViewingFraming": framing,
            "render": {
                "engine": bpy.context.scene.render.engine,
                "desktopResolution": rigs["render"]["desktopResolution"],
                "mobileResolution": rigs["render"]["mobileResolution"],
                "desktopWitnesses": rigs["render"]["desktopWitnesses"],
                "mobileWitnesses": rigs["render"]["mobileWitnesses"],
                "lookdev": False,
            },
            "outputs": [],
        }
        manifest["outputs"] = collect_outputs(rig_dir)
        write_json(rig_dir / "manifest.json", manifest)
        index_manifests.append(f"{rig_id}/manifest.json")
        rig_summaries[rig_id] = {
            "status": rig["status"],
            "pushkinViewingLensMm": rig["cameras"]["pushkinViewing"]["lensMm"],
            "pushkinViewingDistanceMetres": visibility["pushkinViewing"]["distanceMetres"],
            "desktopAnchor": framing["desktop"]["anchor"],
            "mobileAnchor": framing["mobile"]["anchor"],
        }

    final_geometry = geometry_fingerprint()
    if final_geometry != before_geometry:
        fail("camera candidate generation mutated frozen H3 geometry")

    index = {
        "schemaVersion": 1,
        "laneId": "TLP-HALL-001",
        "phase": "cameraApproval",
        "status": "candidate-evidence",
        "selectedTopology": "H3",
        "approvedRig": None,
        "sourceLayoutFingerprint": source_manifest["layoutFingerprint"],
        "sourceBlendSha256": source_blend_sha,
        "sourceGeometryFingerprint": before_geometry,
        "runtime": {
            "versionTuple": list(bpy.app.version),
            "buildHash": bpy.app.build_hash.decode("utf-8", errors="replace") if isinstance(bpy.app.build_hash, bytes) else str(bpy.app.build_hash),
        },
        "candidateOrder": [rig["id"] for rig in rigs["rigs"]],
        "manifests": index_manifests,
        "rigSummaries": rig_summaries,
    }
    write_json(output_root / "index.json", index)
    print(f"Hall H3 camera candidates generated: {output_root}")


if __name__ == "__main__":
    main()

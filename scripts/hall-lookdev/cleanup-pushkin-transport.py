from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

import bpy

EXPECTED_VERSION = (4, 5, 12)


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Prune redundant UV transport from the bounded Pushkin lookdev candidate")
    parser.add_argument("--cleanup-contract", required=True)
    parser.add_argument("--visual-contract", required=True)
    parser.add_argument("--canonical-contract", required=True)
    parser.add_argument("--blend", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--tested-sha", required=True)
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
    return f"sha256:{digest.hexdigest()}"


def load_remediation_module():
    module_path = Path(__file__).resolve().with_name("remediate-pushkin-visual.py")
    spec = importlib.util.spec_from_file_location("hall_pushkin_visual_remediation", module_path)
    if spec is None or spec.loader is None:
        fail(f"cannot load remediation authority from {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def material_uses_authoritative_uv(material: bpy.types.Material, uv_name: str) -> bool:
    if not material.use_nodes or material.node_tree is None:
        return False
    uv_node = material.node_tree.nodes.get("LOOKDEV_UV0")
    if uv_node is None or uv_node.bl_idname != "ShaderNodeUVMap" or uv_node.uv_map != uv_name:
        return False
    roughness = material.node_tree.nodes.get("LOOKDEV_ROUGHNESS")
    normal = material.node_tree.nodes.get("LOOKDEV_NORMAL")
    if roughness is None or normal is None:
        return False
    links = material.node_tree.links
    return any(link.from_node == uv_node and link.to_node == roughness and link.to_socket.name == "Vector" for link in links) and any(
        link.from_node == uv_node and link.to_node == normal and link.to_socket.name == "Vector" for link in links
    )


def prune_object_uvs(obj: bpy.types.Object, target_names: set[str], uv_name: str, remediation) -> dict[str, Any]:
    if obj.type != "MESH":
        fail(f"{obj.name}: cleanup target is not a mesh")
    mesh = obj.data
    sharing = sorted(other.name for other in bpy.data.objects if other.type == "MESH" and other.data == mesh)
    outside = [name for name in sharing if name not in target_names]
    if outside:
        fail(f"{obj.name}: mesh data is shared with non-target objects: {outside}")

    material = obj.data.materials[0] if len(obj.data.materials) else None
    if material is None or not material_uses_authoritative_uv(material, uv_name):
        fail(f"{obj.name}: material does not use the authoritative {uv_name} lookdev node")

    authoritative = mesh.uv_layers.get(uv_name)
    if authoritative is None:
        fail(f"{obj.name}: authoritative UV layer {uv_name} is missing")

    before_names = [layer.name for layer in mesh.uv_layers]
    before_bounds = remediation.world_bounds(obj)
    before_geometry = remediation.mesh_fingerprint([obj])
    removed = [name for name in before_names if name != uv_name]
    if len(removed) != 1:
        fail(f"{obj.name}: expected exactly one reproduced redundant UV layer, found {removed}")

    for layer in list(mesh.uv_layers):
        if layer.name != uv_name:
            mesh.uv_layers.remove(layer)
    if len(mesh.uv_layers) != 1 or mesh.uv_layers[0].name != uv_name:
        fail(f"{obj.name}: cleanup did not leave exactly one authoritative {uv_name} layer")
    mesh.uv_layers.active_index = 0
    try:
        mesh.uv_layers[0].active_render = True
    except Exception:
        pass
    mesh.update()
    bpy.context.view_layer.update()

    after_bounds = remediation.world_bounds(obj)
    after_geometry = remediation.mesh_fingerprint([obj])
    bounds_delta = remediation.maximum_bounds_delta(before_bounds, after_bounds)
    if before_geometry != after_geometry:
        fail(f"{obj.name}: UV cleanup changed geometry/transform fingerprint")
    if bounds_delta > 0.0000001:
        fail(f"{obj.name}: UV cleanup changed world bounds by {bounds_delta:.10f} m")

    return {
        "object": obj.name,
        "material": material.name,
        "uvLayersBefore": before_names,
        "removedUvLayers": removed,
        "uvLayersAfter": [layer.name for layer in mesh.uv_layers],
        "geometryFingerprintMatched": before_geometry == after_geometry,
        "worldBoundsDeltaMeters": round(float(bounds_delta), 10),
    }


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("Pushkin transport cleanup must run in Blender background mode")

    cleanup_path = Path(args.cleanup_contract).resolve()
    visual_path = Path(args.visual_contract).resolve()
    canonical_path = Path(args.canonical_contract).resolve()
    blend_path = Path(args.blend).resolve()
    output_dir = Path(args.output_dir).resolve()
    evidence_path = output_dir / "visual-remediation-evidence.json"
    raw_glb = output_dir / "pushkin-lookdev-candidate-raw.glb"

    cleanup = read_json(cleanup_path)
    visual = read_json(visual_path)
    canonical = read_json(canonical_path)
    evidence = read_json(evidence_path)
    if cleanup.get("issue") != 444 or cleanup.get("status") != "redundant-uv-transport-cleanup":
        fail("transport cleanup contract identity/status is not selectable")
    source = cleanup.get("sourceAuthority", {})
    if source.get("visualRemediationIssue") != 440 or source.get("tangentPortabilityIssue") != 442:
        fail("transport cleanup must remain a follow-up to #440/#442")
    for key, expected in (("topology", "H3"), ("approvedRig", "R1"), ("productionLightingAuthority", "L0-minimal-runtime"), ("surfaceUv", "UV0")):
        if source.get(key) != expected:
            fail(f"transport cleanup source authority drifted: {key}")
    scope = cleanup.get("scope", {})
    if scope.get("candidateOnly") is not True or any(
        scope.get(key) is not False
        for key in (
            "canonicalGeneratorMayChange",
            "frozenH3ArchitectureMayChange",
            "approvedCameraMayChange",
            "productionLightingAuthorityMayChange",
            "materialAppearanceMayChange",
            "documentaryMediaMayChange",
            "productionHallMayActivate",
            "productionWebglMayBegin",
            "offlineVisualApprovalMayPromote",
        )
    ):
        fail("transport cleanup crossed its bounded source/production scope")
    if evidence.get("testedSha") != str(args.tested_sha):
        fail("transport cleanup evidence SHA does not match exact tested head")

    cleanup_spec = cleanup["cleanup"]
    uv_name = str(cleanup_spec["authoritativeUvLayer"])
    target_names = list(visual.get("edgeTreatment", {}).get("targetObjects", []))
    expected_count = int(cleanup_spec["expectedTargetCount"])
    if len(target_names) != expected_count or len(set(target_names)) != expected_count:
        fail("transport cleanup target inventory drifted from bounded visual target set")
    target_set = set(target_names)

    remediation = load_remediation_module()
    bpy.ops.wm.open_mainfile(filepath=str(blend_path), load_ui=False)
    records = []
    for name in target_names:
        obj = bpy.data.objects.get(name)
        if obj is None:
            fail(f"transport cleanup target missing: {name}")
        records.append(prune_object_uvs(obj, target_set, uv_name, remediation))

    removed_count = sum(len(record["removedUvLayers"]) for record in records)
    if removed_count != expected_count:
        fail(f"expected to remove {expected_count} redundant UV layers, removed {removed_count}")

    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    bpy.ops.wm.open_mainfile(filepath=str(blend_path), load_ui=False)
    remediation.export_candidate_glb(raw_glb)
    stills = remediation.render_stills(canonical, list(visual["evidence"]["stillIds"]), output_dir)

    evidence["stills"] = stills
    evidence.setdefault("transport", {})["uvCleanupIssue"] = 444
    evidence["transport"]["authoritativeUvLayer"] = uv_name
    evidence["transport"]["redundantUvLayersRemoved"] = removed_count
    evidence["transportCleanup"] = {
        "issue": 444,
        "status": "redundant-uv-transport-cleaned",
        "targetCount": len(records),
        "authoritativeUvLayer": uv_name,
        "removedUvLayerCount": removed_count,
        "objects": records,
        "acceptedExporterInfo": cleanup["acceptedExporterInfo"],
    }
    evidence.setdefault("files", {})["blend"] = {
        "path": blend_path.name,
        "bytes": blend_path.stat().st_size,
        "sha256": sha256_file(blend_path),
    }
    evidence["files"]["rawGlb"] = {
        "path": raw_glb.name,
        "bytes": raw_glb.stat().st_size,
        "sha256": sha256_file(raw_glb),
    }
    write_json(evidence_path, evidence)
    print(f"Pushkin transport cleanup complete: {removed_count} redundant UV layers removed across {len(records)} bounded targets.")


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import hashlib
import json
import math
import struct
import sys
import zlib
from pathlib import Path
from typing import Any, Callable

import bpy
from mathutils import Vector

EXPECTED_VERSION = (4, 5, 12)


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Build bounded Pushkin offline visual-remediation candidate")
    parser.add_argument("--contract", required=True)
    parser.add_argument("--canonical-contract", required=True)
    parser.add_argument("--source-blend", required=True)
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


def stable_float(value: float) -> float:
    return round(float(value), 8)


def stable_matrix(obj: bpy.types.Object) -> list[float]:
    return [stable_float(value) for row in obj.matrix_world for value in row]


def mesh_fingerprint(objects: list[bpy.types.Object]) -> str:
    payload: list[dict[str, Any]] = []
    for obj in sorted(objects, key=lambda item: item.name):
        mesh = obj.data
        payload.append(
            {
                "name": obj.name,
                "matrixWorld": stable_matrix(obj),
                "vertices": [[stable_float(v.co.x), stable_float(v.co.y), stable_float(v.co.z)] for v in mesh.vertices],
                "edges": [list(edge.vertices) for edge in mesh.edges],
                "polygons": [list(poly.vertices) for poly in mesh.polygons],
            }
        )
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def png_chunk(kind: bytes, payload: bytes) -> bytes:
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)


def write_rgb_png(
    path: Path,
    width: int,
    height: int,
    sample_fn: Callable[[float, float], tuple[float, float, float]],
) -> None:
    rows: list[bytes] = []
    for y in range(height):
        row = bytearray([0])
        v = (y + 0.5) / height
        for x in range(width):
            u = (x + 0.5) / width
            r, g, b = sample_fn(u, v)
            row.extend(
                max(0, min(255, int(round(value))))
                for value in (r, g, b)
            )
        rows.append(bytes(row))
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", header)
        + png_chunk(b"IDAT", zlib.compress(b"".join(rows), level=9))
        + png_chunk(b"IEND", b"")
    )


def texture_slug(material_name: str) -> str:
    return material_name.lower().replace("mat_pushkin_", "").replace("_", "-")


def create_response_textures(
    texture_dir: Path,
    material_name: str,
    spec: dict[str, Any],
    resolution: int,
) -> dict[str, Path]:
    texture_dir.mkdir(parents=True, exist_ok=True)
    slug = texture_slug(material_name)
    rough_path = texture_dir / f"{slug}-roughness.png"
    normal_path = texture_dir / f"{slug}-normal.png"
    tau = math.tau
    seed = float(spec["seed"])
    phase_a = (seed % 17.0) * 0.173
    phase_b = (seed % 29.0) * 0.119
    base_roughness = float(spec["baseRoughness"])
    roughness_amplitude = float(spec["roughnessAmplitude"])
    normal_amplitude = float(spec["normalAmplitude8Bit"])

    def rough_sample(u: float, v: float) -> tuple[float, float, float]:
        signal = (
            0.52 * math.sin(tau * (2.0 * u + 3.0 * v) + phase_a)
            + 0.31 * math.cos(tau * (5.0 * u - 2.0 * v) + phase_b)
            + 0.17 * math.sin(tau * (9.0 * u + 7.0 * v) + phase_a + phase_b)
        )
        value = max(0.02, min(0.98, base_roughness + roughness_amplitude * signal)) * 255.0
        return value, value, value

    def normal_sample(u: float, v: float) -> tuple[float, float, float]:
        nx = 128.0 + normal_amplitude * (
            0.70 * math.sin(tau * (4.0 * u + 3.0 * v) + phase_a)
            + 0.30 * math.sin(tau * (11.0 * u - 5.0 * v) + phase_b)
        )
        ny = 128.0 + normal_amplitude * (
            0.70 * math.cos(tau * (3.0 * u - 4.0 * v) + phase_b)
            + 0.30 * math.cos(tau * (7.0 * u + 9.0 * v) + phase_a)
        )
        return nx, ny, 254.0

    write_rgb_png(rough_path, resolution, resolution, rough_sample)
    write_rgb_png(normal_path, resolution, resolution, normal_sample)
    return {"roughness": rough_path, "normal": normal_path}


def set_non_color(image: bpy.types.Image) -> None:
    for candidate in ("Non-Color", "Raw"):
        try:
            image.colorspace_settings.name = candidate
            return
        except Exception:
            continue
    fail(f"cannot set data-map color space for {image.name}")


def wire_material_response(
    material: bpy.types.Material,
    texture_paths: dict[str, Path],
    normal_strength: float,
) -> dict[str, Any]:
    if not material.use_nodes or material.node_tree is None:
        fail(f"material {material.name} is not node based")
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = next((node for node in nodes if node.bl_idname == "ShaderNodeBsdfPrincipled"), None)
    if bsdf is None:
        fail(f"material {material.name} has no Principled BSDF")

    for node_name in ("LOOKDEV_UV0", "LOOKDEV_ROUGHNESS", "LOOKDEV_NORMAL", "LOOKDEV_NORMAL_MAP"):
        existing = nodes.get(node_name)
        if existing is not None:
            nodes.remove(existing)

    uv = nodes.new("ShaderNodeUVMap")
    uv.name = "LOOKDEV_UV0"
    uv.uv_map = "UV0"
    uv.location = (-720, -100)

    rough_image = bpy.data.images.load(str(texture_paths["roughness"]), check_existing=False)
    rough_image.name = f"LOOKDEV_{texture_slug(material.name)}_ROUGHNESS"
    set_non_color(rough_image)
    rough = nodes.new("ShaderNodeTexImage")
    rough.name = "LOOKDEV_ROUGHNESS"
    rough.image = rough_image
    rough.extension = "REPEAT"
    rough.location = (-460, 40)

    normal_image = bpy.data.images.load(str(texture_paths["normal"]), check_existing=False)
    normal_image.name = f"LOOKDEV_{texture_slug(material.name)}_NORMAL"
    set_non_color(normal_image)
    normal = nodes.new("ShaderNodeTexImage")
    normal.name = "LOOKDEV_NORMAL"
    normal.image = normal_image
    normal.extension = "REPEAT"
    normal.location = (-460, -220)

    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.name = "LOOKDEV_NORMAL_MAP"
    normal_map.inputs["Strength"].default_value = float(normal_strength)
    normal_map.location = (-120, -210)

    links.new(uv.outputs["UV"], rough.inputs["Vector"])
    links.new(rough.outputs["Color"], bsdf.inputs["Roughness"])
    links.new(uv.outputs["UV"], normal.inputs["Vector"])
    links.new(normal.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])

    return {
        "material": material.name,
        "roughnessTexture": texture_paths["roughness"].name,
        "normalTexture": texture_paths["normal"].name,
        "normalStrength": float(normal_strength),
    }


def world_bounds(obj: bpy.types.Object) -> dict[str, list[float]]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    return {
        "min": [stable_float(min(point[index] for point in points)) for index in range(3)],
        "max": [stable_float(max(point[index] for point in points)) for index in range(3)],
    }


def maximum_bounds_delta(left: dict[str, list[float]], right: dict[str, list[float]]) -> float:
    return max(abs(a - b) for key in ("min", "max") for a, b in zip(left[key], right[key]))


def apply_scale_without_world_drift(obj: bpy.types.Object) -> float:
    before = world_bounds(obj)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)
    bpy.context.view_layer.update()
    after = world_bounds(obj)
    delta = maximum_bounds_delta(before, after)
    if delta > 0.00001:
        fail(f"{obj.name}: applying local scale drifted world bounds by {delta:.8f} m")
    return delta


def local_dimensions(obj: bpy.types.Object) -> tuple[float, float, float]:
    corners = [Vector(corner) for corner in obj.bound_box]
    return tuple(max(point[index] for point in corners) - min(point[index] for point in corners) for index in range(3))


def ensure_metre_scaled_uv0(obj: bpy.types.Object, period_meters: float) -> dict[str, Any]:
    mesh = obj.data
    uv0 = mesh.uv_layers.get("UV0")
    if uv0 is None:
        uv0 = mesh.uv_layers.new(name="UV0")
    else:
        uv0.name = "UV0"
    for polygon in mesh.polygons:
        normal = polygon.normal
        axis = max(range(3), key=lambda index: abs(normal[index]))
        for loop_index in polygon.loop_indices:
            coordinate = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            if axis == 0:
                u = (-coordinate.y if normal.x >= 0 else coordinate.y) / period_meters
                v = coordinate.z / period_meters
            elif axis == 1:
                u = (coordinate.x if normal.y >= 0 else -coordinate.x) / period_meters
                v = coordinate.z / period_meters
            else:
                u = (coordinate.x if normal.z >= 0 else -coordinate.x) / period_meters
                v = coordinate.y / period_meters
            uv0.data[loop_index].uv = (u, v)
    mesh.update()
    return {
        "uvLayer": "UV0",
        "projection": "dominant-axis-box",
        "texturePeriodMeters": period_meters,
    }


def add_bounded_bevel(obj: bpy.types.Object, edge_contract: dict[str, Any]) -> dict[str, Any]:
    dimensions = local_dimensions(obj)
    smallest = min(dimensions)
    width = min(
        float(edge_contract["maximumWidthMeters"]),
        smallest * float(edge_contract["maximumFractionOfSmallestLocalDimension"]),
    )
    width = max(float(edge_contract["minimumWidthMeters"]), width)
    if width >= smallest * 0.5:
        fail(f"{obj.name}: computed bevel {width:.6f} m is not bounded by local thickness {smallest:.6f} m")

    existing = obj.modifiers.get(str(edge_contract["modifierName"]))
    if existing is not None:
        obj.modifiers.remove(existing)
    modifier = obj.modifiers.new(name=str(edge_contract["modifierName"]), type="BEVEL")
    modifier.width = width
    modifier.segments = int(edge_contract["segments"])
    modifier.profile = float(edge_contract["profile"])
    modifier.limit_method = "ANGLE"
    modifier.angle_limit = math.radians(30.0)
    modifier.use_clamp_overlap = True
    if hasattr(modifier, "harden_normals"):
        modifier.harden_normals = True
    obj["lookdevCandidateOnly"] = True
    obj["lookdevBevelMeters"] = width
    obj["lookdevBevelSegments"] = int(edge_contract["segments"])
    return {
        "object": obj.name,
        "widthMeters": stable_float(width),
        "segments": int(edge_contract["segments"]),
        "smallestLocalDimensionMeters": stable_float(smallest),
    }


def render_stills(
    canonical_contract: dict[str, Any],
    still_ids: list[str],
    output_dir: Path,
) -> list[dict[str, Any]]:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.image_settings.file_format = "PNG"
    rendered: list[dict[str, Any]] = []
    specs = {entry["id"]: entry for entry in canonical_contract["evidence"]["stills"]}
    for still_id in still_ids:
        spec = specs.get(still_id)
        if spec is None:
            fail(f"unknown canonical still id {still_id}")
        camera = bpy.data.objects.get(f"CAM_PUSHKIN_{still_id}")
        if camera is None or camera.type != "CAMERA":
            fail(f"candidate lost canonical camera {still_id}")
        resolution = canonical_contract["evidence"]["mobileResolution"] if spec["class"] == "mobile" else canonical_contract["evidence"]["desktopResolution"]
        output = output_dir / f"{still_id}.png"
        scene.camera = camera
        scene.render.resolution_x = int(resolution[0])
        scene.render.resolution_y = int(resolution[1])
        scene.render.resolution_percentage = 100
        scene.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)
        if not output.exists() or output.stat().st_size <= 20_000:
            fail(f"candidate still {still_id} is missing or trivial")
        rendered.append(
            {
                "id": still_id,
                "class": spec["class"],
                "path": output.name,
                "resolution": resolution,
                "bytes": output.stat().st_size,
                "sha256": sha256_file(output),
            }
        )
    return rendered


def export_candidate_glb(output: Path) -> None:
    exhibit_collection = bpy.data.collections.get("COLL_PUSHKIN_OFFLINE_EXHIBIT")
    if exhibit_collection is None:
        fail("canonical packed scene lost Pushkin exhibit collection")
    bpy.ops.object.select_all(action="DESELECT")
    selected_meshes = 0
    for obj in exhibit_collection.all_objects:
        if obj.type == "MESH":
            obj.select_set(True)
            selected_meshes += 1
    camera = bpy.data.objects.get("CAM_PUSHKIN_01-r1-hero")
    if camera is None or camera.type != "CAMERA":
        fail("canonical R1 evidence camera missing")
    camera.select_set(True)
    bpy.context.view_layer.objects.active = camera
    bpy.ops.export_scene.gltf(
        filepath=str(output),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_cameras=True,
        export_materials="EXPORT",
        export_yup=True,
        export_apply=True,
    )
    if selected_meshes < 15 or not output.exists() or output.stat().st_size == 0:
        fail("candidate GLB export did not contain the substantive Pushkin mesh set")


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("visual remediation must run in Blender background mode")

    contract_path = Path(args.contract).resolve()
    canonical_contract_path = Path(args.canonical_contract).resolve()
    source_blend = Path(args.source_blend).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    texture_dir = output_dir / "textures"

    contract = read_json(contract_path)
    canonical = read_json(canonical_contract_path)
    if contract.get("issue") != 440 or contract.get("status") != "lookdev-candidate-authoring":
        fail("visual remediation contract identity/status is not selectable")
    if contract.get("scope", {}).get("candidateOnly") is not True or contract.get("scope", {}).get("offlineVisualApprovalMayPromote") is not False:
        fail("visual remediation must remain candidate-only and unable to promote approval")
    source_authority = contract["sourceAuthority"]
    if canonical.get("source", {}).get("topology") != source_authority["topology"]:
        fail("canonical exhibit topology authority drifted")
    if canonical.get("source", {}).get("layoutFingerprint") != source_authority["layoutFingerprint"]:
        fail("canonical H3 layout fingerprint drifted")
    if canonical.get("source", {}).get("meshGeometryFingerprint") != source_authority["meshGeometryFingerprint"]:
        fail("canonical H3 mesh fingerprint drifted")
    if canonical.get("source", {}).get("approvedRig") != source_authority["approvedRig"]:
        fail("canonical R1 authority drifted")
    if canonical.get("source", {}).get("lightingBaseline") != source_authority["productionLightingAuthority"]:
        fail("canonical L0 authority drifted")

    bpy.ops.wm.open_mainfile(filepath=str(source_blend), load_ui=False)
    scene = bpy.context.scene
    if scene.unit_settings.system != "METRIC" or scene.unit_settings.length_unit != "METERS" or abs(scene.unit_settings.scale_length - 1.0) > 1e-9:
        fail("canonical packed exhibit lost metre-scale scene contract")

    target_names = list(contract["edgeTreatment"]["targetObjects"])
    target_set = set(target_names)
    if len(target_names) != len(target_set):
        fail("edge target contract contains duplicates")
    targets: list[bpy.types.Object] = []
    for name in target_names:
        obj = bpy.data.objects.get(name)
        if obj is None or obj.type != "MESH":
            fail(f"missing candidate edge target {name}")
        if not name.startswith("PUSHKIN_"):
            fail(f"candidate may not mutate non-Pushkin object {name}")
        targets.append(obj)

    untouched_meshes = [obj for obj in bpy.data.objects if obj.type == "MESH" and obj.name not in target_set]
    untouched_before = mesh_fingerprint(untouched_meshes)

    resolution = int(contract["materialResponse"]["textureResolution"])
    material_specs = contract["materialResponse"]["materials"]
    material_evidence: list[dict[str, Any]] = []
    texture_evidence: dict[str, dict[str, Any]] = {}
    for material_name, spec in material_specs.items():
        material = bpy.data.materials.get(material_name)
        if material is None:
            fail(f"canonical packed exhibit lost material {material_name}")
        paths = create_response_textures(texture_dir, material_name, spec, resolution)
        material_evidence.append(wire_material_response(material, paths, float(spec["normalStrength"])))
        texture_evidence[material_name] = {
            role: {"path": str(path.relative_to(output_dir)), "bytes": path.stat().st_size, "sha256": sha256_file(path)}
            for role, path in paths.items()
        }

    edge_evidence: list[dict[str, Any]] = []
    scale_deltas: dict[str, float] = {}
    uv_evidence: dict[str, dict[str, Any]] = {}
    for obj in targets:
        scale_deltas[obj.name] = stable_float(apply_scale_without_world_drift(obj))
        if len(obj.data.materials) == 0 or obj.data.materials[0] is None:
            fail(f"{obj.name}: target has no material")
        material_name = obj.data.materials[0].name
        material_spec = material_specs.get(material_name)
        if material_spec is None:
            fail(f"{obj.name}: material {material_name} has no bounded response contract")
        uv_evidence[obj.name] = ensure_metre_scaled_uv0(obj, float(material_spec["texturePeriodMeters"]))
        edge_evidence.append(add_bounded_bevel(obj, contract["edgeTreatment"]))

    bpy.context.view_layer.update()
    untouched_after = mesh_fingerprint(untouched_meshes)
    if untouched_before != untouched_after:
        fail("visual remediation mutated mesh/transform data outside the explicit target set")

    for obj in targets:
        obj["visualRemediationIssue"] = 440
        obj["productionAsset"] = False
        obj["offlineVisualApprovalPromoted"] = False

    candidate_blend = output_dir / "pushkin-lookdev-candidate.blend"
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(candidate_blend))
    bpy.ops.wm.open_mainfile(filepath=str(candidate_blend), load_ui=False)

    raw_glb = output_dir / "pushkin-lookdev-candidate-raw.glb"
    export_candidate_glb(raw_glb)
    stills = render_stills(canonical, list(contract["evidence"]["stillIds"]), output_dir)

    evidence = {
        "schemaVersion": 1,
        "issue": 440,
        "testedSha": str(args.tested_sha),
        "status": "lookdev-candidate-generated-awaiting-human-disposition",
        "runtime": {
            "blenderVersion": bpy.app.version_string,
            "versionTuple": list(bpy.app.version),
            "renderEngine": "BLENDER_EEVEE_NEXT",
        },
        "source": {
            "canonicalBlend": source_blend.name,
            "canonicalBlendSha256": sha256_file(source_blend),
            "canonicalContractSha256": sha256_file(canonical_contract_path),
            "topology": source_authority["topology"],
            "layoutFingerprint": source_authority["layoutFingerprint"],
            "meshGeometryFingerprint": source_authority["meshGeometryFingerprint"],
            "approvedRig": source_authority["approvedRig"],
            "productionLightingAuthority": source_authority["productionLightingAuthority"],
            "surfaceUv": source_authority["surfaceUv"],
        },
        "integrity": {
            "explicitTargetCount": len(targets),
            "untouchedMeshFingerprintBefore": untouched_before,
            "untouchedMeshFingerprintAfter": untouched_after,
            "untouchedMeshFingerprintMatched": untouched_before == untouched_after,
            "maximumScaleApplyBoundsDeltaMeters": max(scale_deltas.values(), default=0.0),
        },
        "edgeTreatment": edge_evidence,
        "uvProjection": uv_evidence,
        "materialResponse": material_evidence,
        "textures": texture_evidence,
        "stills": stills,
        "walkthrough": {
            "status": "deferred-during-lookdev-iteration",
            "requiredForFinalDisposition": bool(contract["evidence"]["walkthroughRequiredForFinalDisposition"]),
        },
        "files": {
            "blend": {"path": candidate_blend.name, "bytes": candidate_blend.stat().st_size, "sha256": sha256_file(candidate_blend)},
            "rawGlb": {"path": raw_glb.name, "bytes": raw_glb.stat().st_size, "sha256": sha256_file(raw_glb)},
        },
        "productionBoundary": {
            "productionAsset": False,
            "productionManifestAllowed": False,
            "productionWebglMayBegin": False,
            "canonicalOfflineExhibitReplaced": False,
            "offlineVisualApprovalPromoted": False,
            "humanOwnerVisualDispositionRequired": True,
        },
    }
    write_json(output_dir / "visual-remediation-evidence.json", evidence)
    print(
        f"Pushkin lookdev candidate generated: {len(targets)} bounded edge targets, "
        f"{len(material_evidence)} PBR material responses, {len(stills)} stills."
    )


if __name__ == "__main__":
    main()

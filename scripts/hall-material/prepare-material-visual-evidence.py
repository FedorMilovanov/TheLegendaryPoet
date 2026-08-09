from __future__ import annotations

import argparse
import hashlib
import json
import math
import statistics
import struct
import sys
import zlib
from pathlib import Path
from typing import Any

import bpy
from mathutils import Vector

EXPECTED_VERSION = (4, 5, 12)
ARCH_NODES = ("ARCH_spike_floor", "ARCH_wall_016", "ARCH_wall_017")


def log(message: str) -> None:
    print(f"[hall-material-visual] {message}", flush=True)


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Prepare bounded Hall material visual-evidence lookdev")
    parser.add_argument("--contract", required=True)
    parser.add_argument("--blend", required=True)
    parser.add_argument("--source-evidence", required=True)
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


def file_identity(path: Path, relative_to: Path) -> dict[str, Any]:
    return {
        "path": str(path.relative_to(relative_to)),
        "bytes": path.stat().st_size,
        "sha256": sha256_file(path),
    }


def stable_float(value: float) -> float:
    return round(float(value), 8)


def stable_matrix(obj: bpy.types.Object) -> list[float]:
    return [stable_float(value) for row in obj.matrix_world for value in row]


def bounds_from_corners(obj: bpy.types.Object, corners: Any) -> dict[str, list[float]]:
    points = [obj.matrix_world @ Vector(corner) for corner in corners]
    return {
        "min": [stable_float(min(point[index] for point in points)) for index in range(3)],
        "max": [stable_float(max(point[index] for point in points)) for index in range(3)],
    }


def world_bounds(obj: bpy.types.Object) -> dict[str, list[float]]:
    return bounds_from_corners(obj, obj.bound_box)


def evaluated_world_bounds(obj: bpy.types.Object, depsgraph: bpy.types.Depsgraph) -> dict[str, list[float]]:
    evaluated = obj.evaluated_get(depsgraph)
    return bounds_from_corners(evaluated, evaluated.bound_box)


def maximum_bounds_delta(left: dict[str, list[float]], right: dict[str, list[float]]) -> float:
    return max(abs(a - b) for key in ("min", "max") for a, b in zip(left[key], right[key]))


def png_chunk(kind: bytes, payload: bytes) -> bytes:
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)


def write_rgb_png(path: Path, width: int, height: int, pixel_fn) -> None:
    rows: list[bytes] = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            r, g, b = pixel_fn(x, y, width, height)
            row.extend((max(0, min(255, int(r))), max(0, min(255, int(g))), max(0, min(255, int(b)))))
        rows.append(bytes(row))
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", header)
        + png_chunk(b"IDAT", zlib.compress(b"".join(rows), level=9))
        + png_chunk(b"IEND", b"")
    )


def rewrite_proof_textures(texture_dir: Path, contract: dict[str, Any], resolution: int) -> dict[str, Path]:
    texture_dir.mkdir(parents=True, exist_ok=True)
    paths = {
        "baseColor": texture_dir / contract["materialProof"]["baseColor"]["file"],
        "normal": texture_dir / contract["materialProof"]["normal"]["file"],
        "roughness": texture_dir / contract["materialProof"]["roughness"]["file"],
    }
    tau = math.tau

    def base_pixel(x: int, y: int, width: int, height: int):
        u = x / max(1, width - 1)
        v = y / max(1, height - 1)
        coarse = math.sin(tau * (u * 2.25 + v * 0.35)) * 8.0 + math.cos(tau * (v * 1.7 - u * 0.2)) * 6.0
        grain = math.sin(tau * (u * 9.0 + v * 4.0)) * 2.8 + math.cos(tau * (u * 3.0 - v * 11.0)) * 2.2
        value = 146.0 + coarse + grain
        return value + 4.0, value, value - 7.0

    def normal_pixel(x: int, y: int, width: int, height: int):
        u = x / max(1, width - 1)
        v = y / max(1, height - 1)
        nx = 128.0 + 15.0 * math.sin(tau * (u * 5.0 + v * 1.7)) + 4.0 * math.sin(tau * v * 13.0)
        ny = 128.0 + 13.0 * math.cos(tau * (v * 4.0 - u * 1.2)) + 4.0 * math.cos(tau * u * 12.0)
        return nx, ny, 253.0

    def rough_pixel(x: int, y: int, width: int, height: int):
        u = x / max(1, width - 1)
        v = y / max(1, height - 1)
        value = 171.0 + 24.0 * math.sin(tau * (u * 2.8 + v * 1.3)) + 11.0 * math.cos(tau * (u * 7.0 - v * 3.0))
        return value, value, value

    write_rgb_png(paths["baseColor"], resolution, resolution, base_pixel)
    write_rgb_png(paths["normal"], resolution, resolution, normal_pixel)
    write_rgb_png(paths["roughness"], resolution, resolution, rough_pixel)
    return paths


def set_image_colorspace(image: bpy.types.Image, preferred: list[str]) -> str:
    for candidate in preferred:
        try:
            image.colorspace_settings.name = candidate
            return candidate
        except Exception:
            continue
    return str(image.colorspace_settings.name)


def replace_material_images(texture_paths: dict[str, Path], material_name: str) -> dict[str, str]:
    material = bpy.data.materials.get(material_name)
    if material is None or not material.use_nodes or material.node_tree is None:
        fail(f"missing node material {material_name}")
    mapping = {
        "baseColor": ("TEX_BASECOLOR", ["sRGB"]),
        "normal": ("TEX_NORMAL", ["Non-Color"]),
        "roughness": ("TEX_ROUGHNESS", ["Non-Color"]),
    }
    colorspaces: dict[str, str] = {}
    for role, (node_name, preferred) in mapping.items():
        node = material.node_tree.nodes.get(node_name)
        if node is None or node.bl_idname != "ShaderNodeTexImage":
            fail(f"missing material image node {node_name}")
        image = bpy.data.images.load(str(texture_paths[role]), check_existing=False)
        image.name = f"VISUAL_{role}_{texture_paths[role].stem}"
        colorspaces[role] = set_image_colorspace(image, preferred)
        node.image = image
    return colorspaces


def dominant_axis_box_project_uv0(obj: bpy.types.Object, cube_size: float) -> dict[str, Any]:
    if obj.type != "MESH":
        fail(f"{obj.name}: UV projection requires mesh")
    mesh = obj.data
    uv0 = mesh.uv_layers.get("UV0")
    uv1 = mesh.uv_layers.get("UV1")
    if uv0 is None or uv1 is None:
        fail(f"{obj.name}: expected existing UV0/UV1 before visual evidence")

    for polygon in mesh.polygons:
        normal = polygon.normal
        axis = max(range(3), key=lambda index: abs(normal[index]))
        for loop_index in polygon.loop_indices:
            coordinate = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            if axis == 0:
                u = (-coordinate.y if normal.x >= 0 else coordinate.y) / cube_size
                v = coordinate.z / cube_size
            elif axis == 1:
                u = (coordinate.x if normal.y >= 0 else -coordinate.x) / cube_size
                v = coordinate.z / cube_size
            else:
                u = (coordinate.x if normal.z >= 0 else -coordinate.x) / cube_size
                v = coordinate.y / cube_size
            uv0.data[loop_index].uv = (u, v)
    mesh.update()

    ratios: list[float] = []
    transform = obj.matrix_world.to_3x3()
    for polygon in mesh.polygons:
        loops = list(polygon.loop_indices)
        for index, loop_index in enumerate(loops):
            next_loop_index = loops[(index + 1) % len(loops)]
            a_vertex = mesh.vertices[mesh.loops[loop_index].vertex_index].co
            b_vertex = mesh.vertices[mesh.loops[next_loop_index].vertex_index].co
            world_length = (transform @ (b_vertex - a_vertex)).length
            uv_length = (uv0.data[next_loop_index].uv - uv0.data[loop_index].uv).length
            if world_length > 1e-6 and uv_length > 1e-6:
                ratios.append(float(world_length / uv_length))
    if not ratios:
        fail(f"{obj.name}: UV0 projection produced no measurable edges")
    median = statistics.median(ratios)
    tolerance = cube_size * 0.04
    if abs(median - cube_size) > tolerance:
        fail(f"{obj.name}: UV0 metre scale drift {median:.6f} vs {cube_size:.6f}")
    return {
        "projection": "cube",
        "implementation": "dominant-axis-loop-data",
        "cubeSizeMeters": cube_size,
        "sampleCount": len(ratios),
        "medianMetersPerUvUnit": stable_float(median),
        "minimumMetersPerUvUnit": stable_float(min(ratios)),
        "maximumMetersPerUvUnit": stable_float(max(ratios)),
    }


def add_bounded_bevel_modifier(
    obj: bpy.types.Object,
    depsgraph: bpy.types.Depsgraph,
    width: float,
    segments: int,
    limit_method: str,
) -> dict[str, Any]:
    before_matrix = stable_matrix(obj)
    before_bounds = world_bounds(obj)
    modifier = obj.modifiers.get("SPIKE_VISUAL_BEVEL")
    if modifier is not None:
        obj.modifiers.remove(modifier)
    modifier = obj.modifiers.new(name="SPIKE_VISUAL_BEVEL", type="BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = limit_method
    modifier.angle_limit = math.radians(30.0)
    modifier.profile = 0.5
    modifier.use_clamp_overlap = True
    bpy.context.view_layer.update()

    after_matrix = stable_matrix(obj)
    evaluated = obj.evaluated_get(depsgraph)
    after_bounds = evaluated_world_bounds(obj, depsgraph)
    bounds_delta = maximum_bounds_delta(before_bounds, after_bounds)
    if before_matrix != after_matrix:
        fail(f"{obj.name}: visual bevel changed H3 object transform")
    if bounds_delta > 0.00005:
        fail(f"{obj.name}: visual bevel changed architectural bounds by {bounds_delta:.8f} m")

    obj["visualEvidenceOnly"] = True
    obj["lookdevBevelMeters"] = width
    obj["lookdevBevelSegments"] = segments
    return {
        "widthMeters": width,
        "segments": segments,
        "limitMethod": limit_method,
        "implementation": "non-destructive-modifier-export-apply",
        "matrixWorldUnchanged": True,
        "boundsBefore": before_bounds,
        "boundsAfter": after_bounds,
        "maximumBoundsDeltaMeters": stable_float(bounds_delta),
        "verticesBefore": len(obj.data.vertices),
        "polygonsBefore": len(obj.data.polygons),
        "verticesEvaluated": len(evaluated.data.vertices),
        "polygonsEvaluated": len(evaluated.data.polygons),
    }


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("material visual evidence must run in Blender background mode")

    contract_path = Path(args.contract).resolve()
    blend_path = Path(args.blend).resolve()
    source_evidence_path = Path(args.source_evidence).resolve()
    output_dir = source_evidence_path.parent
    contract = read_json(contract_path)
    source_evidence = read_json(source_evidence_path)
    visual = contract.get("visualEvidence")
    if not isinstance(visual, dict) or visual.get("status") != "repeat-spike-authoring":
        fail("material visual evidence contract is not active repeat-spike authoring")
    if contract.get("decision", {}).get("pushkinVerticalSliceMayActivate") is not False:
        fail("visual evidence may not advance Pushkin vertical slice")
    if source_evidence.get("source", {}).get("meshGeometryFingerprintBeforeSpike") != contract["source"]["meshGeometryFingerprint"]:
        fail("visual evidence must start from the frozen H3 source fingerprint")

    log(f"open representative blend {blend_path.name}")
    bpy.ops.wm.open_mainfile(filepath=str(blend_path), load_ui=False)
    scene = bpy.context.scene
    if scene.unit_settings.system != "METRIC" or scene.unit_settings.length_unit != "METERS" or abs(scene.unit_settings.scale_length - 1.0) > 1e-9:
        fail("material visual evidence lost metre-scale scene contract")
    if len(bpy.data.lights) != 0:
        fail("material visual evidence must not add persistent Blender lights")

    r1 = bpy.data.objects.get("CAM_R1_pushkinViewing")
    if r1 is None or r1.type != "CAMERA" or r1.get("approvedRig") != "R1":
        fail("material visual evidence lost approved R1 camera authority")
    r1_matrix_before = stable_matrix(r1)

    cube_size = float(visual["surfaceUvCubeSizeMeters"])
    bevel_width = float(visual["lookdevBevelMeters"])
    bevel_segments = int(visual["lookdevBevelSegments"])
    bevel_limit = str(visual["lookdevBevelLimit"])
    texture_resolution = int(visual["proofTextureResolution"])
    if cube_size <= 0 or bevel_width <= 0 or bevel_width > 0.02 or bevel_segments < 1 or bevel_segments > 4:
        fail("visual evidence UV/bevel contract is outside bounded limits")
    if texture_resolution not in (128, 256, 512):
        fail("visual proof texture resolution must remain a bounded power-of-two lab size")

    log("write and bind deterministic proof textures")
    texture_paths = rewrite_proof_textures(output_dir / "textures", contract, texture_resolution)
    colorspaces = replace_material_images(texture_paths, contract["materialProof"]["stoneMaterial"])
    if colorspaces.get("baseColor") != "sRGB" or colorspaces.get("normal") != "Non-Color" or colorspaces.get("roughness") != "Non-Color":
        fail(f"visual proof texture color-space assignment drifted: {colorspaces}")

    depsgraph = bpy.context.evaluated_depsgraph_get()
    object_evidence: dict[str, Any] = {}
    for name in ARCH_NODES:
        log(f"prepare {name}: direct UV0 projection")
        obj = bpy.data.objects.get(name)
        if obj is None or obj.type != "MESH":
            fail(f"missing representative architecture node {name}")
        uv_evidence = dominant_axis_box_project_uv0(obj, cube_size)
        obj["surfaceUvProjection"] = "cube"
        obj["surfaceUvCubeSizeMeters"] = cube_size
        log(f"prepare {name}: bounded non-destructive bevel")
        bevel_evidence = add_bounded_bevel_modifier(obj, depsgraph, bevel_width, bevel_segments, bevel_limit)
        if [layer.name for layer in obj.data.uv_layers] != ["UV0", "UV1"]:
            fail(f"{name}: visual lookdev must preserve exactly UV0/UV1")
        object_evidence[name] = {
            "uv0": uv_evidence,
            "bevel": bevel_evidence,
            "uvSetsAfter": [layer.name for layer in obj.data.uv_layers],
        }

    if stable_matrix(r1) != r1_matrix_before:
        fail("visual evidence modified the frozen R1 camera")

    log("save and reopen visual-evidence blend")
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    bpy.ops.wm.open_mainfile(filepath=str(blend_path), load_ui=False)
    if len(bpy.data.lights) != 0:
        fail("visual-evidence save/reopen contains unexpected Blender lights")
    reopened_r1 = bpy.data.objects.get("CAM_R1_pushkinViewing")
    if reopened_r1 is None or stable_matrix(reopened_r1) != r1_matrix_before:
        fail("visual-evidence save/reopen changed R1")
    for name in ARCH_NODES:
        obj = bpy.data.objects.get(name)
        if obj is None or [layer.name for layer in obj.data.uv_layers] != ["UV0", "UV1"]:
            fail(f"{name}: visual-evidence save/reopen lost UV0/UV1")
        modifier = obj.modifiers.get("SPIKE_VISUAL_BEVEL")
        if modifier is None or modifier.type != "BEVEL":
            fail(f"{name}: visual-evidence save/reopen lost bounded bevel modifier")

    visual_evidence = {
        "schemaVersion": 1,
        "laneId": "TLP-HALL-001",
        "phase": "materialLightingExportSpike",
        "status": "repeat-spike-visual-evidence",
        "sourceTopology": "H3",
        "approvedRig": "R1",
        "inspectionTarget": visual["inspectionTarget"],
        "proofTextureResolution": texture_resolution,
        "surfaceUvProjection": visual["surfaceUvProjection"],
        "surfaceUvCubeSizeMeters": cube_size,
        "lookdevBevelMeters": bevel_width,
        "lookdevBevelSegments": bevel_segments,
        "lookdevBevelLimit": bevel_limit,
        "bevelExportMode": "gltf-export-apply-modifiers",
        "r1MatrixUnchanged": True,
        "objects": object_evidence,
        "productionAsset": False,
        "decisionMayAdvance": False,
    }
    visual_evidence_path = output_dir / "visual-lookdev-evidence.json"
    write_json(visual_evidence_path, visual_evidence)

    source_evidence.setdefault("material", {}).update({
        "proofTextureResolution": texture_resolution,
        "surfaceUvProjection": visual["surfaceUvProjection"],
        "surfaceUvCubeSizeMeters": cube_size,
        "lookdevBevelMeters": bevel_width,
        "lookdevBevelSegments": bevel_segments,
        "bevelExportMode": "gltf-export-apply-modifiers",
    })
    source_evidence["visualLookdev"] = visual_evidence
    files = source_evidence.setdefault("files", {})
    files["blend"] = file_identity(blend_path, output_dir)
    files["textures"] = {key: file_identity(path, output_dir) for key, path in texture_paths.items()}
    files["visualLookdev"] = file_identity(visual_evidence_path, output_dir)
    write_json(source_evidence_path, source_evidence)
    log(f"prepared visual evidence {visual_evidence_path.name}")


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import hashlib
import json
import math
import struct
import sys
import zlib
from pathlib import Path
from typing import Any

import bpy
from mathutils import Vector

EXPECTED_VERSION = (4, 5, 12)


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Generate Hall v3 representative H3 material/light/export spike")
    parser.add_argument("--contract", required=True)
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


def png_chunk(kind: bytes, payload: bytes) -> bytes:
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)


def write_rgb_png(path: Path, width: int, height: int, pixel_fn) -> None:
    rows = []
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


def create_proof_textures(texture_dir: Path) -> dict[str, Path]:
    texture_dir.mkdir(parents=True, exist_ok=True)
    base = texture_dir / "stone-basecolor.png"
    normal = texture_dir / "stone-normal.png"
    rough = texture_dir / "stone-roughness.png"

    def base_pixel(x: int, y: int, width: int, height: int):
        wave = math.sin(x * 0.33) * 6.0 + math.cos(y * 0.27) * 5.0 + math.sin((x + y) * 0.11) * 3.0
        value = 143 + wave
        return value, value - 5, value - 12

    def normal_pixel(x: int, y: int, width: int, height: int):
        nx = 128 + math.sin(y * 0.4) * 5
        ny = 128 + math.cos(x * 0.37) * 5
        return nx, ny, 254

    def rough_pixel(x: int, y: int, width: int, height: int):
        value = 168 + math.sin(x * 0.22 + y * 0.19) * 20
        return value, value, value

    write_rgb_png(base, 64, 64, base_pixel)
    write_rgb_png(normal, 64, 64, normal_pixel)
    write_rgb_png(rough, 64, 64, rough_pixel)
    return {"baseColor": base, "normal": normal, "roughness": rough}


def set_image_colorspace(image: bpy.types.Image, preferred: list[str]) -> str:
    for candidate in preferred:
        try:
            image.colorspace_settings.name = candidate
            return candidate
        except Exception:
            continue
    return str(image.colorspace_settings.name)


def ensure_uv_layers(obj: bpy.types.Object) -> None:
    if obj.type != "MESH":
        return
    mesh = obj.data
    if len(mesh.uv_layers) == 0:
        layer = mesh.uv_layers.new(name="UV0")
        mesh.uv_layers.active = layer
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(island_margin=0.03)
        bpy.ops.object.mode_set(mode="OBJECT")
        obj.select_set(False)
    mesh.uv_layers[0].name = "UV0"
    if len(mesh.uv_layers) < 2:
        source = mesh.uv_layers[0]
        target = mesh.uv_layers.new(name="UV1")
        for index, loop in enumerate(target.data):
            loop.uv = source.data[index].uv
    else:
        mesh.uv_layers[1].name = "UV1"
    mesh.uv_layers.active_index = 1
    mesh.uv_layers[1].active_render = True


def create_box(name: str, center: list[float], size: list[float], collection: bpy.types.Collection) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=tuple(float(value) for value in center))
    obj = bpy.context.object
    if obj is None:
        fail(f"failed to create {name}")
    obj.name = name
    obj.dimensions = tuple(float(value) for value in size)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def create_camera(name: str, spec: dict[str, Any], collection: bpy.types.Collection) -> bpy.types.Object:
    data = bpy.data.cameras.new(f"{name}_DATA")
    data.lens = float(spec["lensMm"])
    data.sensor_width = 36.0
    data.clip_start = 0.05
    data.clip_end = 80.0
    camera = bpy.data.objects.new(name, data)
    camera.location = tuple(float(value) for value in spec["position"])
    direction = Vector(tuple(float(value) for value in spec["target"])) - camera.location
    if direction.length <= 0.05:
        fail("R1 camera target is too close")
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    collection.objects.link(camera)
    return camera


def keep_only_objects(keep_names: set[str]) -> None:
    for obj in list(bpy.data.objects):
        if obj.name not in keep_names:
            bpy.data.objects.remove(obj, do_unlink=True)


def build_material(texture_paths: dict[str, Path], name: str, metallic: float) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (620, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (330, 0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = 1.0
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    uv = nodes.new("ShaderNodeUVMap")
    uv.uv_map = "UV0"
    uv.location = (-700, 40)

    base_image = bpy.data.images.load(str(texture_paths["baseColor"]), check_existing=False)
    set_image_colorspace(base_image, ["sRGB"])
    base = nodes.new("ShaderNodeTexImage")
    base.name = "TEX_BASECOLOR"
    base.image = base_image
    base.location = (-430, 160)
    links.new(uv.outputs["UV"], base.inputs["Vector"])
    links.new(base.outputs["Color"], bsdf.inputs["Base Color"])

    rough_image = bpy.data.images.load(str(texture_paths["roughness"]), check_existing=False)
    set_image_colorspace(rough_image, ["Non-Color"])
    rough = nodes.new("ShaderNodeTexImage")
    rough.name = "TEX_ROUGHNESS"
    rough.image = rough_image
    rough.location = (-430, -40)
    links.new(uv.outputs["UV"], rough.inputs["Vector"])
    links.new(rough.outputs["Color"], bsdf.inputs["Roughness"])

    normal_image = bpy.data.images.load(str(texture_paths["normal"]), check_existing=False)
    set_image_colorspace(normal_image, ["Non-Color"])
    normal_tex = nodes.new("ShaderNodeTexImage")
    normal_tex.name = "TEX_NORMAL"
    normal_tex.image = normal_image
    normal_tex.location = (-430, -250)
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.location = (80, -220)
    links.new(uv.outputs["UV"], normal_tex.inputs["Vector"])
    links.new(normal_tex.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], bsdf.inputs["Normal"])
    return material


def build_proxy_material() -> bpy.types.Material:
    material = bpy.data.materials.new("MAT_EXHIBIT_PROXY")
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is not None:
        bsdf.inputs["Base Color"].default_value = (0.17, 0.19, 0.22, 1.0)
        bsdf.inputs["Metallic"].default_value = 0.0
        bsdf.inputs["Roughness"].default_value = 0.72
    return material


def assign_material(obj: bpy.types.Object, material: bpy.types.Material) -> None:
    obj.data.materials.clear()
    obj.data.materials.append(material)


def add_bake_light() -> bpy.types.Object:
    light_data = bpy.data.lights.new("SPIKE_BAKE_AREA_DATA", type="AREA")
    light_data.energy = 650.0
    light_data.shape = "DISK"
    light_data.size = 3.0
    light = bpy.data.objects.new("SPIKE_BAKE_AREA", light_data)
    light.location = (8.6, 4.2, 5.8)
    direction = Vector((10.6, 5.0, 1.3)) - light.location
    light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.collection.objects.link(light)
    return light


def bake_lightmap(obj: bpy.types.Object, material: bpy.types.Material, output: Path, resolution: int) -> dict[str, Any]:
    mesh = obj.data
    ensure_uv_layers(obj)
    mesh.uv_layers.active_index = 1
    mesh.uv_layers[1].active_render = True

    image = bpy.data.images.new(
        name=f"LM_{obj.name}",
        width=resolution,
        height=resolution,
        alpha=False,
        float_buffer=True,
    )
    set_image_colorspace(image, ["Non-Color", "Linear Rec.709", "Linear"])

    nodes = material.node_tree.nodes
    bake_node = nodes.get("LIGHTMAP_BAKE_TARGET")
    if bake_node is None:
        bake_node = nodes.new("ShaderNodeTexImage")
        bake_node.name = "LIGHTMAP_BAKE_TARGET"
    bake_node.image = image
    nodes.active = bake_node

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 16
    scene.render.bake.margin = 4
    scene.render.bake.use_pass_direct = True
    scene.render.bake.use_pass_indirect = True
    scene.render.bake.use_pass_color = False
    bpy.ops.object.bake(type="DIFFUSE")

    image.filepath_raw = str(output)
    image.file_format = "OPEN_EXR"
    image.save()
    obj.select_set(False)
    return {
        "node": obj.name,
        "texture": output.name,
        "uvChannel": 1,
        "runtimeColorSpace": "LinearSRGBColorSpace",
        "sourceEncoding": "OpenEXR-Linear",
        "bytes": output.stat().st_size,
        "sha256": sha256_file(output),
    }


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("material spike must run in Blender background mode")

    contract_path = Path(args.contract).resolve()
    source_blend = Path(args.source_blend).resolve()
    source_manifest_path = Path(args.source_manifest).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    texture_dir = output_dir / "textures"
    lightmap_dir = output_dir / "lightmaps"
    lightmap_dir.mkdir(parents=True, exist_ok=True)

    contract = read_json(contract_path)
    source_manifest = read_json(source_manifest_path)
    if contract["source"]["topology"] != "H3" or source_manifest.get("candidateId") != "H3":
        fail("material spike must derive from frozen H3")
    if source_manifest.get("layoutFingerprint") != contract["source"]["layoutFingerprint"]:
        fail("H3 layout fingerprint does not match material-spike contract")

    bpy.ops.wm.open_mainfile(filepath=str(source_blend), load_ui=False)
    scene = bpy.context.scene
    if scene.unit_settings.system != "METRIC" or scene.unit_settings.length_unit != "METERS" or abs(scene.unit_settings.scale_length - 1.0) > 1e-9:
        fail("source H3 scene lost metre-scale contract")

    original_geometry_fingerprint = geometry_fingerprint()
    expected_mesh_fingerprint = contract["source"]["meshGeometryFingerprint"]
    if original_geometry_fingerprint != expected_mesh_fingerprint:
        fail(f"source H3 mesh fingerprint drift: {original_geometry_fingerprint} != {expected_mesh_fingerprint}")

    keep = set(contract["source"]["representativeWallNodes"])
    keep.update({
        contract["source"]["servedExhibit"],
        "EXHIBIT_DOC_CASE_01",
        "EXHIBIT_DOC_CASE_02",
    })
    keep_only_objects(keep)

    collection = bpy.data.collections.get("COLL_MATERIAL_SPIKE")
    if collection is None:
        collection = bpy.data.collections.new("COLL_MATERIAL_SPIKE")
        scene.collection.children.link(collection)

    floor = create_box(
        contract["bay"]["derivedFloorNode"],
        contract["bay"]["derivedFloorCenter"],
        contract["bay"]["derivedFloorSize"],
        collection,
    )
    floor["derivedForMaterialSpike"] = True
    floor["productionAsset"] = False
    floor["sourceTopology"] = "H3"

    camera = create_camera("CAM_R1_pushkinViewing", contract["approvedCameraWitness"], collection)
    camera["approvedRig"] = "R1"
    camera["sourceTopology"] = "H3"
    camera["productionAsset"] = False

    texture_paths = create_proof_textures(texture_dir)
    stone = build_material(texture_paths, contract["materialProof"]["stoneMaterial"], float(contract["materialProof"]["stoneMetallicFactor"]))
    proxy = build_proxy_material()

    architecture_names = [contract["bay"]["derivedFloorNode"], *contract["source"]["representativeWallNodes"]]
    architecture_objects: list[bpy.types.Object] = []
    for name in architecture_names:
        obj = bpy.data.objects.get(name)
        if obj is None or obj.type != "MESH":
            fail(f"missing architecture spike node: {name}")
        ensure_uv_layers(obj)
        obj["hallSpike"] = True
        obj["sourceTopology"] = "H3"
        obj["productionAsset"] = False
        assign_material(obj, stone)
        architecture_objects.append(obj)

    for name in [contract["source"]["servedExhibit"], "EXHIBIT_DOC_CASE_01", "EXHIBIT_DOC_CASE_02"]:
        obj = bpy.data.objects.get(name)
        if obj is None or obj.type != "MESH":
            fail(f"missing exhibit proxy: {name}")
        obj["hallSpike"] = True
        obj["productionAsset"] = False
        assign_material(obj, proxy)

    pushkin = bpy.data.objects.get(contract["source"]["servedExhibit"])
    if pushkin is None or pushkin.get("poetId") != "alexander-pushkin":
        fail("Pushkin poetId extra was not preserved from H3 source")

    world = scene.world or bpy.data.worlds.new("SPIKE_WORLD")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background is not None:
        background.inputs["Color"].default_value = (0.10, 0.115, 0.13, 1.0)
        background.inputs["Strength"].default_value = 0.35
    bake_light = add_bake_light()

    lightmap_bindings: list[dict[str, Any]] = []
    resolution = int(contract["materialProof"]["lightmaps"]["resolution"])
    for obj in architecture_objects:
        path = lightmap_dir / f"lightmap-{obj.name}.exr"
        lightmap_bindings.append(bake_lightmap(obj, stone, path, resolution))

    bpy.data.objects.remove(bake_light, do_unlink=True)
    if len(bpy.data.lights) != 0:
        fail("bake lights must not survive into exported material-spike scene")

    # Remove bake-only node; runtime GLB owns surface PBR, while external lightmap binding is explicit.
    bake_node = stone.node_tree.nodes.get("LIGHTMAP_BAKE_TARGET")
    if bake_node is not None:
        stone.node_tree.nodes.remove(bake_node)

    scene.render.engine = "BLENDER_WORKBENCH"
    raw_blend = output_dir / "material-spike.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(raw_blend))
    bpy.ops.wm.open_mainfile(filepath=str(raw_blend), load_ui=False)
    scene = bpy.context.scene

    if len(bpy.data.lights) != 0:
        fail("save/reopen material spike contains unexpected lights")
    for name in architecture_names:
        obj = bpy.data.objects.get(name)
        if obj is None or len(obj.data.uv_layers) < 2:
            fail(f"{name}: UV0/UV1 contract lost after save/reopen")
        if obj.data.uv_layers[0].name != "UV0" or obj.data.uv_layers[1].name != "UV1":
            fail(f"{name}: UV channel names drifted after save/reopen")

    export_names = set(contract["bay"]["exportNodes"])
    bpy.ops.object.select_all(action="DESELECT")
    for name in export_names:
        obj = bpy.data.objects.get(name)
        if obj is None:
            fail(f"missing export node after save/reopen: {name}")
        obj.select_set(True)

    raw_glb = output_dir / "material-spike-raw.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(raw_glb),
        export_format="GLB",
        use_selection=True,
        export_extras=True,
        export_cameras=True,
        export_materials="EXPORT",
        export_yup=True,
    )
    if not raw_glb.exists() or raw_glb.stat().st_size == 0:
        fail("Blender did not create raw material-spike GLB")

    bindings = {
        "schemaVersion": 1,
        "laneId": "TLP-HALL-001",
        "phase": "materialLightingExportSpike",
        "strategy": "L1-external-lightmap",
        "sourceTopology": "H3",
        "approvedRig": "R1",
        "bindings": lightmap_bindings,
    }
    bindings_path = output_dir / "lightmap-bindings.json"
    write_json(bindings_path, bindings)

    evidence = {
        "schemaVersion": 1,
        "laneId": "TLP-HALL-001",
        "phase": "materialLightingExportSpike",
        "runtime": {
            "version": bpy.app.version_string,
            "versionTuple": list(bpy.app.version),
            "buildHash": bpy.app.build_hash.decode("utf-8", errors="replace") if isinstance(bpy.app.build_hash, bytes) else str(bpy.app.build_hash),
            "background": bool(bpy.app.background),
        },
        "source": {
            "candidateId": source_manifest.get("candidateId"),
            "layoutFingerprint": source_manifest.get("layoutFingerprint"),
            "meshGeometryFingerprintBeforeSpike": original_geometry_fingerprint,
            "sourceBlend": source_blend.name,
        },
        "camera": {
            "name": "CAM_R1_pushkinViewing",
            "position": list(contract["approvedCameraWitness"]["position"]),
            "target": list(contract["approvedCameraWitness"]["target"]),
            "lensMm": float(contract["approvedCameraWitness"]["lensMm"]),
        },
        "material": {
            "name": stone.name,
            "metallicFactor": float(contract["materialProof"]["stoneMetallicFactor"]),
            "baseColorColorSpace": "sRGB",
            "normalColorSpace": "Non-Color",
            "roughnessColorSpace": "Non-Color",
            "lightmapRuntimeColorSpace": "LinearSRGBColorSpace",
            "uv0": 0,
            "uv1": 1,
        },
        "scene": {
            "unitSystem": scene.unit_settings.system,
            "lengthUnit": scene.unit_settings.length_unit,
            "scaleLength": float(scene.unit_settings.scale_length),
            "materials": len(bpy.data.materials),
            "lights": len(bpy.data.lights),
            "meshObjects": sum(1 for obj in bpy.data.objects if obj.type == "MESH"),
            "cameraObjects": sum(1 for obj in bpy.data.objects if obj.type == "CAMERA"),
        },
        "exportNodes": sorted(export_names),
        "architectureUvSets": {
            name: [layer.name for layer in bpy.data.objects[name].data.uv_layers]
            for name in architecture_names
        },
        "files": {
            "blend": {"path": raw_blend.name, "bytes": raw_blend.stat().st_size, "sha256": sha256_file(raw_blend)},
            "rawGlb": {"path": raw_glb.name, "bytes": raw_glb.stat().st_size, "sha256": sha256_file(raw_glb)},
            "lightmapBindings": {"path": bindings_path.name, "bytes": bindings_path.stat().st_size, "sha256": sha256_file(bindings_path)},
            "textures": {
                key: {"path": str(path.relative_to(output_dir)), "bytes": path.stat().st_size, "sha256": sha256_file(path)}
                for key, path in texture_paths.items()
            },
            "lightmaps": lightmap_bindings,
        },
        "productionAsset": False,
        "documentaryAsset": False,
    }
    write_json(output_dir / "source-evidence.json", evidence)
    print(f"Hall material spike generated: {output_dir}")


if __name__ == "__main__":
    main()

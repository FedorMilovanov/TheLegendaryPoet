from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
from typing import Any

import bpy
from mathutils import Vector

EXPECTED_VERSION = (4, 5, 12)
EXPORT_COLLECTION = "COLL_MATERIAL_SPIKE_EXPORT"
BAKE_COLLECTION = "COLL_MATERIAL_SPIKE_BAKE"
REQUIRED_CAMERA_NAME = "CAM_H3_R1_pushkinViewing"
ARCH_NAME = "ARCH_H3_SPIKE_BAY"
PUSHKIN_PROXY_NAME = "EXHIBIT_alexander-pushkin"
EMISSIVE_MARKER_NAME = "ARCH_H3_SPIKE_EMISSIVE_MARKER"


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Generate the bounded Hall v3 H3 material/light/export spike bay")
    parser.add_argument("--config", required=True)
    parser.add_argument("--layouts", required=True)
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


def same(a: Any, b: Any) -> bool:
    return json.dumps(a, sort_keys=True, separators=(",", ":")) == json.dumps(b, sort_keys=True, separators=(",", ":"))


def collection(name: str) -> bpy.types.Collection:
    result = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(result)
    return result


def move_to_collection(obj: bpy.types.Object, destination: bpy.types.Collection) -> None:
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    destination.objects.link(obj)


def create_box(
    name: str,
    center: tuple[float, float, float],
    size: tuple[float, float, float],
    destination: bpy.types.Collection,
    rotation_z: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=center, rotation=(0.0, 0.0, rotation_z))
    obj = bpy.context.object
    if obj is None:
        fail(f"failed to create box {name}")
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    move_to_collection(obj, destination)
    return obj


def create_wall(
    name: str,
    segment: list[float],
    thickness: float,
    height: float,
    destination: bpy.types.Collection,
) -> bpy.types.Object:
    x1, y1, x2, y2 = (float(value) for value in segment)
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    if length <= 0.05:
        fail(f"wall segment too short: {name}")
    return create_box(
        name,
        ((x1 + x2) / 2.0, (y1 + y2) / 2.0, height / 2.0),
        (length, thickness, height),
        destination,
        math.atan2(dy, dx),
    )


def create_camera(
    name: str,
    position: list[float],
    target: list[float],
    lens_mm: float,
    destination: bpy.types.Collection,
) -> bpy.types.Object:
    data = bpy.data.cameras.new(f"{name}_DATA")
    data.lens = float(lens_mm)
    data.sensor_width = 36.0
    data.clip_start = 0.05
    data.clip_end = 200.0
    camera = bpy.data.objects.new(name, data)
    camera.location = tuple(float(value) for value in position)
    direction = Vector(tuple(float(value) for value in target)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    destination.objects.link(camera)
    return camera


def join_meshes(objects: list[bpy.types.Object], name: str) -> bpy.types.Object:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    result = bpy.context.object
    if result is None:
        fail("failed to join representative architecture bay")
    result.name = name
    return result


def unwrap_uvs(obj: bpy.types.Object) -> None:
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66.0), island_margin=0.03)
    bpy.ops.object.mode_set(mode="OBJECT")
    mesh = obj.data
    if not isinstance(mesh, bpy.types.Mesh) or len(mesh.uv_layers) < 1:
        fail("UV0 creation failed")
    uv0 = mesh.uv_layers[0]
    uv0.name = "UV0"
    uv1 = mesh.uv_layers.new(name="UV1")
    for source, target in zip(uv0.data, uv1.data):
        target.uv = source.uv
    mesh.uv_layers.active_index = 0
    uv0.active_render = True
    uv1.active_render = False


def save_generated_image(image: bpy.types.Image, path: Path, color_space: str) -> None:
    image.colorspace_settings.name = color_space
    image.filepath_raw = str(path)
    image.file_format = "PNG"
    image.save()
    image.pack()


def generate_base_color(path: Path) -> bpy.types.Image:
    size = 128
    image = bpy.data.images.new("TEX_H3_SPIKE_BASECOLOR", width=size, height=size, alpha=True)
    pixels: list[float] = []
    for y in range(size):
        for x in range(size):
            grain = (((x * 17 + y * 31) % 23) - 11) / 1200.0
            pixels.extend((0.34 + grain, 0.35 + grain, 0.37 + grain, 1.0))
    image.pixels = pixels
    save_generated_image(image, path, "sRGB")
    return image


def generate_orm(path: Path) -> bpy.types.Image:
    size = 128
    image = bpy.data.images.new("TEX_H3_SPIKE_ORM", width=size, height=size, alpha=True)
    pixels: list[float] = []
    for y in range(size):
        for x in range(size):
            roughness = 0.62 + ((((x + y) * 13) % 11) - 5) / 250.0
            pixels.extend((1.0, roughness, 0.0, 1.0))
    image.pixels = pixels
    save_generated_image(image, path, "Non-Color")
    return image


def generate_normal(path: Path) -> bpy.types.Image:
    size = 128
    image = bpy.data.images.new("TEX_H3_SPIKE_NORMAL", width=size, height=size, alpha=True)
    pixels: list[float] = []
    for y in range(size):
        for x in range(size):
            nx = 0.5 + ((((x * 7 + y * 5) % 17) - 8) / 4000.0)
            ny = 0.5 + ((((x * 3 + y * 11) % 19) - 9) / 4000.0)
            pixels.extend((nx, ny, 1.0, 1.0))
    image.pixels = pixels
    save_generated_image(image, path, "Non-Color")
    return image


def generate_emissive(path: Path) -> bpy.types.Image:
    size = 32
    image = bpy.data.images.new("TEX_H3_SPIKE_EMISSIVE", width=size, height=size, alpha=True)
    image.generated_color = (0.025, 0.18, 0.30, 1.0)
    image.pixels = list(image.generated_color) * (size * size)
    save_generated_image(image, path, "sRGB")
    return image


def input_socket(node: bpy.types.Node, *names: str) -> bpy.types.NodeSocket:
    for name in names:
        socket = node.inputs.get(name)
        if socket is not None:
            return socket
    fail(f"missing expected Principled BSDF input: {names}")


def gltf_material_output_group() -> bpy.types.NodeTree:
    group = bpy.data.node_groups.get("glTF Material Output")
    if group is None:
        group = bpy.data.node_groups.new("glTF Material Output", "ShaderNodeTree")
        group.interface.new_socket(name="Occlusion", in_out="INPUT", socket_type="NodeSocketFloat")
    return group


def build_surface_material(base: bpy.types.Image, orm: bpy.types.Image, normal: bpy.types.Image) -> bpy.types.Material:
    material = bpy.data.materials.new("MAT_H3_SPIKE_STONE")
    material.use_nodes = True
    material["spikeMaterialRole"] = "surface"
    material["metalnessMaximum"] = 0.0
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (720, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (420, 0)
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    base_node = nodes.new("ShaderNodeTexImage")
    base_node.name = "BASECOLOR_SRGB"
    base_node.label = "baseColor / sRGB"
    base_node.image = base
    base_node.location = (-700, 220)
    links.new(base_node.outputs["Color"], input_socket(bsdf, "Base Color"))

    orm_node = nodes.new("ShaderNodeTexImage")
    orm_node.name = "ORM_NON_COLOR"
    orm_node.label = "AO-Roughness-Metalness / Non-Color"
    orm_node.image = orm
    orm_node.location = (-700, -20)
    separate = nodes.new("ShaderNodeSeparateColor")
    separate.location = (-440, -20)
    links.new(orm_node.outputs["Color"], separate.inputs["Color"])
    links.new(separate.outputs[1], input_socket(bsdf, "Roughness"))
    links.new(separate.outputs[2], input_socket(bsdf, "Metallic"))

    occlusion = nodes.new("ShaderNodeGroup")
    occlusion.name = "GLTF_OCCLUSION_OUTPUT"
    occlusion.node_tree = gltf_material_output_group()
    occlusion.location = (-120, -240)
    links.new(separate.outputs[0], occlusion.inputs["Occlusion"])

    normal_node = nodes.new("ShaderNodeTexImage")
    normal_node.name = "NORMAL_NON_COLOR"
    normal_node.label = "normal / Non-Color"
    normal_node.image = normal
    normal_node.location = (-700, -300)
    normal_map = nodes.new("ShaderNodeNormalMap")
    normal_map.location = (-420, -300)
    normal_map.space = "TANGENT"
    normal_map.inputs["Strength"].default_value = 0.42
    links.new(normal_node.outputs["Color"], normal_map.inputs["Color"])
    links.new(normal_map.outputs["Normal"], input_socket(bsdf, "Normal"))

    return material


def build_proxy_material() -> bpy.types.Material:
    material = bpy.data.materials.new("MAT_H3_SPIKE_PROXY")
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        fail("proxy material missing Principled BSDF")
    input_socket(bsdf, "Base Color").default_value = (0.19, 0.21, 0.24, 1.0)
    input_socket(bsdf, "Roughness").default_value = 0.72
    input_socket(bsdf, "Metallic").default_value = 0.0
    return material


def build_emissive_material(emissive: bpy.types.Image) -> bpy.types.Material:
    material = bpy.data.materials.new("MAT_H3_SPIKE_EMISSIVE_CALIBRATION")
    material.use_nodes = True
    material["spikeMaterialRole"] = "calibration-only"
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if bsdf is None:
        fail("emissive material missing Principled BSDF")
    image_node = nodes.new("ShaderNodeTexImage")
    image_node.name = "EMISSIVE_SRGB"
    image_node.label = "emissive / sRGB"
    image_node.image = emissive
    links.new(image_node.outputs["Color"], input_socket(bsdf, "Emission Color", "Emission"))
    input_socket(bsdf, "Emission Strength").default_value = 0.35
    input_socket(bsdf, "Roughness").default_value = 0.68
    input_socket(bsdf, "Metallic").default_value = 0.0
    return material


def create_area_light(
    name: str,
    location: tuple[float, float, float],
    energy: float,
    size: float,
    color: tuple[float, float, float],
    destination: bpy.types.Collection,
    target: tuple[float, float, float],
) -> bpy.types.Object:
    data = bpy.data.lights.new(name=f"{name}_DATA", type="AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    destination.objects.link(obj)
    return obj


def bake_lightmap(obj: bpy.types.Object, material: bpy.types.Material, output: Path) -> bpy.types.Image:
    mesh = obj.data
    if not isinstance(mesh, bpy.types.Mesh):
        fail("lightmap target is not a mesh")
    uv1 = mesh.uv_layers.get("UV1")
    uv0 = mesh.uv_layers.get("UV0")
    if uv0 is None or uv1 is None:
        fail("lightmap bake requires UV0 and UV1")
    mesh.uv_layers.active = uv1
    uv1.active_render = True
    uv0.active_render = False

    image = bpy.data.images.new("TEX_H3_SPIKE_LIGHTMAP_UV1", width=256, height=256, alpha=False)
    image.colorspace_settings.name = "Non-Color"

    node = material.node_tree.nodes.new("ShaderNodeTexImage")
    node.name = "SPIKE_LIGHTMAP_BAKE_TARGET"
    node.image = image
    for item in material.node_tree.nodes:
        item.select = False
    node.select = True
    material.node_tree.nodes.active = node

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.cycles.samples = 24
    bpy.context.scene.cycles.use_denoising = False
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, use_clear=True, margin=6)

    image.filepath_raw = str(output)
    image.file_format = "PNG"
    image.save()
    image.pack()

    material.node_tree.nodes.remove(node)
    mesh.uv_layers.active = uv0
    uv0.active_render = True
    uv1.active_render = False
    return image


def geometry_fingerprint(objects: list[bpy.types.Object]) -> str:
    payload: list[dict[str, Any]] = []
    for obj in sorted((item for item in objects if item.type == "MESH"), key=lambda item: item.name):
        mesh = obj.data
        vertices = []
        for vertex in mesh.vertices:
            point = obj.matrix_world @ vertex.co
            vertices.append([round(point.x, 6), round(point.y, 6), round(point.z, 6)])
        faces = [list(poly.vertices) for poly in mesh.polygons]
        payload.append({"name": obj.name, "vertices": vertices, "faces": faces})
    encoded = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def main() -> None:
    if tuple(bpy.app.version[:3]) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version[:3])}")

    args = parse_args()
    config_path = Path(args.config)
    layouts_path = Path(args.layouts)
    output_dir = Path(args.output_dir)
    textures_dir = output_dir / "texture-source"
    output_dir.mkdir(parents=True, exist_ok=True)
    textures_dir.mkdir(parents=True, exist_ok=True)

    config = read_json(config_path)
    layouts = read_json(layouts_path)
    h3 = next((item for item in layouts.get("candidates", []) if item.get("id") == "H3"), None)
    if h3 is None:
        fail("H3 layout missing")
    if config.get("frozenAuthority", {}).get("topology") != "H3":
        fail("material spike may only use frozen H3")
    bay = config["representativeBay"]
    if bay["ceilingZone"] not in h3["ceilingZones"]:
        fail("representative bay ceiling zone is not literal frozen H3 source")
    for segment in bay["wallSegments"]:
        if segment not in h3["walls"]:
            fail(f"representative wall is not literal frozen H3 source: {segment}")
    if not same(bay["pushkinAnchor"], h3["pushkin"]["anchor"]):
        fail("Pushkin proxy anchor drifted from frozen H3")
    if not same(bay["documentCases"], h3["pushkin"]["documentCases"]):
        fail("document proxy geometry drifted from frozen H3")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "HALL_H3_MATERIAL_EXPORT_SPIKE"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene.unit_settings.scale_length = 1.0
    scene.render.image_settings.file_format = "PNG"
    scene.world.color = (0.018, 0.022, 0.03)

    export_collection = collection(EXPORT_COLLECTION)
    bake_collection = collection(BAKE_COLLECTION)

    zone = bay["ceilingZone"]
    cx, cy = (float(v) for v in zone["center"])
    width, depth = (float(v) for v in zone["size"])
    ceiling_height = float(zone["height"])
    wall_height = float(layouts["common"]["defaultWallHeight"])
    wall_thickness = float(layouts["common"]["wallThickness"])

    architecture_parts = [
        create_box("ARCH_H3_SPIKE_FLOOR_SOURCE", (cx, cy, -0.06), (width, depth, 0.12), export_collection),
        create_box("ARCH_H3_SPIKE_CEILING_SOURCE", (cx, cy, ceiling_height + 0.06), (width, depth, 0.12), export_collection),
    ]
    for index, segment in enumerate(bay["wallSegments"], start=1):
        architecture_parts.append(
            create_wall(f"ARCH_H3_SPIKE_WALL_SOURCE_{index:02d}", segment, wall_thickness, wall_height, export_collection)
        )
    architecture = join_meshes(architecture_parts, ARCH_NAME)
    architecture["laneId"] = "TLP-HALL-001"
    architecture["sourceTopology"] = "H3"
    architecture["spikeOnly"] = True
    architecture["documentaryAsset"] = False

    bevel = architecture.modifiers.new("SPIKE_PHYSICAL_EDGE_BEVEL", "BEVEL")
    bevel.width = 0.018
    bevel.segments = 2
    bpy.context.view_layer.objects.active = architecture
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    unwrap_uvs(architecture)

    base = generate_base_color(textures_dir / "basecolor-srgb.png")
    orm = generate_orm(textures_dir / "orm-non-color.png")
    normal = generate_normal(textures_dir / "normal-non-color.png")
    emissive = generate_emissive(textures_dir / "emissive-srgb.png")
    surface_material = build_surface_material(base, orm, normal)
    architecture.data.materials.append(surface_material)

    proxy_material = build_proxy_material()
    anchor = bay["pushkinAnchor"]
    pushkin = create_box(
        PUSHKIN_PROXY_NAME,
        tuple(float(v) for v in anchor["center"]),
        tuple(float(v) for v in anchor["size"]),
        export_collection,
        float(anchor["rotationZ"]),
    )
    pushkin["poetId"] = "alexander-pushkin"
    pushkin["greyboxProxy"] = True
    pushkin["documentaryAsset"] = False
    pushkin.data.materials.append(proxy_material)

    document_proxies: list[bpy.types.Object] = []
    for spec in bay["documentCases"]:
        obj = create_box(
            spec["name"],
            tuple(float(v) for v in spec["center"]),
            tuple(float(v) for v in spec["size"]),
            export_collection,
            float(spec["rotationZ"]),
        )
        obj["greyboxProxy"] = True
        obj["documentaryAsset"] = False
        obj.data.materials.append(proxy_material)
        document_proxies.append(obj)

    marker = create_box(
        EMISSIVE_MARKER_NAME,
        (9.18, 6.75, 1.55),
        (0.36, 0.035, 0.12),
        export_collection,
        -0.45,
    )
    marker["spikeOnly"] = True
    marker["calibrationOnly"] = True
    marker["documentaryAsset"] = False
    marker.data.materials.append(build_emissive_material(emissive))

    camera_spec = config["frozenAuthority"]["camera"]
    camera = create_camera(
        REQUIRED_CAMERA_NAME,
        camera_spec["position"],
        camera_spec["target"],
        float(camera_spec["lensMm"]),
        export_collection,
    )
    camera["rigId"] = "R1"
    camera["variableWitness"] = camera_spec["variableWitness"]
    camera["nextDestination"] = json.dumps(camera_spec["nextDestination"], separators=(",", ":"))

    create_area_light(
        "BAKE_KEY",
        (8.4, 2.6, 4.0),
        900.0,
        3.0,
        (1.0, 0.91, 0.82),
        bake_collection,
        (10.4, 5.2, 1.5),
    )
    create_area_light(
        "BAKE_FILL",
        (12.3, 6.9, 3.5),
        500.0,
        2.2,
        (0.48, 0.68, 1.0),
        bake_collection,
        (10.6, 5.0, 1.3),
    )

    lightmap_path = output_dir / "h3-bay-lightmap-uv1.png"
    lightmap = bake_lightmap(architecture, surface_material, lightmap_path)

    export_meshes = [architecture, pushkin, *document_proxies, marker]
    geometry_hash = geometry_fingerprint(export_meshes)

    blend_path = output_dir / "h3-material-spike.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), check_existing=False)

    bpy.ops.object.select_all(action="DESELECT")
    export_objects = [architecture, pushkin, *document_proxies, marker, camera]
    for obj in export_objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = architecture

    raw_glb_path = output_dir / "h3-bay.raw.glb"
    if not hasattr(bpy.ops.export_scene, "gltf"):
        fail("Blender glTF exporter is unavailable")
    bpy.ops.export_scene.gltf(
        filepath=str(raw_glb_path),
        export_format="GLB",
        use_selection=True,
        export_cameras=True,
        export_lights=False,
        export_extras=True,
        export_yup=True,
        export_apply=False,
    )

    required_names = [ARCH_NAME, PUSHKIN_PROXY_NAME, "EXHIBIT_DOC_CASE_01", "EXHIBIT_DOC_CASE_02", EMISSIVE_MARKER_NAME, REQUIRED_CAMERA_NAME]
    manifest = {
        "schemaVersion": 1,
        "laneId": "TLP-HALL-001",
        "phase": "materialLightingExportSpike",
        "status": "generated-candidate-evidence",
        "runtime": {
            "versionTuple": list(bpy.app.version[:3]),
            "background": bool(bpy.app.background),
            "unitSystem": scene.unit_settings.system,
            "scaleLength": scene.unit_settings.scale_length,
        },
        "sourceAuthority": {
            "topology": "H3",
            "layoutFingerprint": config["frozenAuthority"]["layoutFingerprint"],
            "sourceGeometryFingerprint": config["frozenAuthority"]["meshGeometryFingerprint"],
            "cameraRig": "R1",
            "camera": camera_spec,
            "representativeBay": bay,
        },
        "generatedBay": {
            "geometryFingerprint": geometry_hash,
            "requiredNodeNames": required_names,
            "meshObjects": [obj.name for obj in export_meshes],
            "uvLayers": [layer.name for layer in architecture.data.uv_layers],
            "materials": [material.name for material in bpy.data.materials],
            "rightsClearedMediaUsed": False,
            "documentaryMediaUsed": False,
            "metallicTextureMaximum": 0.0,
        },
        "textureSemantics": {
            "baseColor": {"image": base.name, "sourceColorSpace": base.colorspace_settings.name, "role": "color"},
            "normal": {"image": normal.name, "sourceColorSpace": normal.colorspace_settings.name, "role": "data"},
            "orm": {"image": orm.name, "sourceColorSpace": orm.colorspace_settings.name, "role": "data", "channels": {"R": "ao", "G": "roughness", "B": "metalness"}},
            "emissive": {"image": emissive.name, "sourceColorSpace": emissive.colorspace_settings.name, "role": "color"},
            "lightMap": {"image": lightmap.name, "sourceColorSpace": lightmap.colorspace_settings.name, "role": "linear-irradiance", "uvChannel": 1},
        },
        "lightingCandidates": config["lightingCandidates"],
        "files": {
            "blend": {"path": blend_path.name, "sha256": sha256_file(blend_path), "bytes": blend_path.stat().st_size},
            "rawGlb": {"path": raw_glb_path.name, "sha256": sha256_file(raw_glb_path), "bytes": raw_glb_path.stat().st_size},
            "lightMap": {"path": lightmap_path.name, "sha256": sha256_file(lightmap_path), "bytes": lightmap_path.stat().st_size},
        },
    }
    write_json(output_dir / "source-manifest.json", manifest)

    hashes = {}
    for path in sorted(output_dir.rglob("*")):
        if path.is_file() and path.name != "sha256-manifest.json":
            hashes[str(path.relative_to(output_dir))] = sha256_file(path)
    write_json(output_dir / "sha256-manifest.json", {"schemaVersion": 1, "files": hashes})

    print(f"Generated bounded H3 material spike bay: {raw_glb_path}")
    print(f"Geometry fingerprint: {geometry_hash}")


if __name__ == "__main__":
    main()

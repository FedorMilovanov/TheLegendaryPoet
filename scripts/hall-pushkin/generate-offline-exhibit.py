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


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Generate the first Hall v3 Pushkin source-based offline exhibit")
    parser.add_argument("--contract", required=True)
    parser.add_argument("--source-blend", required=True)
    parser.add_argument("--source-evidence", required=True)
    parser.add_argument("--source-assets-evidence", required=True)
    parser.add_argument("--portrait", required=True)
    parser.add_argument("--onegin-page", required=True)
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
    return f"sha256:{digest.hexdigest()}"


def move_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)


def collection(name: str) -> bpy.types.Collection:
    result = bpy.data.collections.get(name)
    if result is None:
        result = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(result)
    return result


def material_principled(
    name: str,
    color: list[float],
    metallic: float,
    roughness: float,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        fail(f"missing Principled BSDF for {name}")
    bsdf.inputs["Base Color"].default_value = tuple(float(value) for value in color)
    bsdf.inputs["Metallic"].default_value = float(metallic)
    bsdf.inputs["Roughness"].default_value = float(roughness)
    return material


def image_material(name: str, image_path: Path, roughness: float = 0.78) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (420, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (120, 0)
    bsdf.inputs["Metallic"].default_value = 0.0
    bsdf.inputs["Roughness"].default_value = roughness
    texture = nodes.new("ShaderNodeTexImage")
    texture.location = (-260, 0)
    texture.image = bpy.data.images.load(str(image_path), check_existing=False)
    try:
        texture.image.colorspace_settings.name = "sRGB"
    except Exception:
        pass
    links.new(texture.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return material


def assign_material(obj: bpy.types.Object, material: bpy.types.Material) -> None:
    if not hasattr(obj.data, "materials"):
        return
    obj.data.materials.clear()
    obj.data.materials.append(material)


def create_empty(name: str, location: list[float], rotation_z: float, coll: bpy.types.Collection) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    obj.location = tuple(float(value) for value in location)
    obj.rotation_euler = (0.0, 0.0, float(rotation_z))
    coll.objects.link(obj)
    return obj


def create_local_box(
    name: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    size: tuple[float, float, float],
    material: bpy.types.Material,
    coll: bpy.types.Collection,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    obj = bpy.context.object
    if obj is None:
        fail(f"failed to create box {name}")
    obj.name = name
    move_to_collection(obj, coll)
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj.scale = size
    # primitive_cube_add(size=1) has a one-metre base cube, so scale equals requested dimensions.
    assign_material(obj, material)
    return obj


def create_local_plane_xz(
    name: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    size: tuple[float, float],
    material: bpy.types.Material,
    coll: bpy.types.Collection,
) -> bpy.types.Object:
    width, height = size
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    mesh.from_pydata(
        [(-width / 2, 0.0, -height / 2), (width / 2, 0.0, -height / 2), (width / 2, 0.0, height / 2), (-width / 2, 0.0, height / 2)],
        [],
        [[0, 1, 2, 3]],
    )
    mesh.update()
    uv = mesh.uv_layers.new(name="UV0")
    coords = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
    for loop in mesh.loops:
        uv.data[loop.index].uv = coords[loop.vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    obj.parent = parent
    obj.location = location
    assign_material(obj, material)
    return obj


def create_local_plane_xy(
    name: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    size: tuple[float, float],
    material: bpy.types.Material,
    coll: bpy.types.Collection,
    rotation_x: float = 0.0,
) -> bpy.types.Object:
    width, depth = size
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    mesh.from_pydata(
        [(-width / 2, -depth / 2, 0.0), (width / 2, -depth / 2, 0.0), (width / 2, depth / 2, 0.0), (-width / 2, depth / 2, 0.0)],
        [],
        [[0, 1, 2, 3]],
    )
    mesh.update()
    uv = mesh.uv_layers.new(name="UV0")
    coords = [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
    for loop in mesh.loops:
        uv.data[loop.index].uv = coords[loop.vertex_index]
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = (rotation_x, 0.0, 0.0)
    assign_material(obj, material)
    return obj


def create_text(
    name: str,
    body: str,
    parent: bpy.types.Object,
    location: tuple[float, float, float],
    size: float,
    material: bpy.types.Material,
    coll: bpy.types.Collection,
) -> bpy.types.Object:
    curve = bpy.data.curves.new(f"{name}_CURVE", type="FONT")
    curve.body = body
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = 0.0015
    curve.bevel_depth = 0.0004
    obj = bpy.data.objects.new(name, curve)
    coll.objects.link(obj)
    obj.parent = parent
    obj.location = location
    # Blender text faces local +Z. Rotate to face local -Y, matching the exhibit/front direction.
    obj.rotation_euler = (math.radians(90.0), 0.0, 0.0)
    assign_material(obj, material)
    return obj


def create_camera(name: str, position: list[float], target: list[float], lens_mm: float, coll: bpy.types.Collection) -> bpy.types.Object:
    data = bpy.data.cameras.new(f"{name}_DATA")
    data.lens = float(lens_mm)
    data.sensor_width = 36.0
    data.clip_start = 0.04
    data.clip_end = 80.0
    camera = bpy.data.objects.new(name, data)
    camera.location = tuple(float(value) for value in position)
    direction = Vector(tuple(float(value) for value in target)) - camera.location
    if direction.length < 0.05:
        fail(f"camera {name} target too close")
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    coll.objects.link(camera)
    return camera


def point_light_color(intent: str) -> tuple[float, float, float]:
    if intent == "warm-document":
        return (1.0, 0.73, 0.47)
    if intent == "warm-neutral":
        return (1.0, 0.82, 0.64)
    return (0.90, 0.94, 1.0)


def create_light(spec: dict[str, Any], coll: bpy.types.Collection) -> bpy.types.Object:
    data = bpy.data.lights.new(f"OFFLINE_{spec['id']}_DATA", type=spec["type"])
    data.energy = float(spec["energy"])
    data.color = point_light_color(str(spec.get("temperatureIntent", "soft-neutral")))
    if data.type == "AREA":
        data.shape = "DISK"
        data.size = float(spec["size"])
    light = bpy.data.objects.new(f"OFFLINE_{spec['id']}", data)
    light.location = tuple(float(value) for value in spec["location"])
    direction = Vector(tuple(float(value) for value in spec["target"])) - light.location
    light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    light["offlineRenderOnly"] = True
    light["productionLightingAuthority"] = "L0-minimal-runtime"
    coll.objects.link(light)
    return light


def configure_world(contract: dict[str, Any]) -> None:
    scene = bpy.context.scene
    world = scene.world or bpy.data.worlds.new("PUSHKIN_OFFLINE_WORLD")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background is not None:
        background.inputs["Color"].default_value = (0.018, 0.022, 0.030, 1.0)
        background.inputs["Strength"].default_value = float(contract["offlineLighting"]["worldStrength"])


def set_object_evidence(obj: bpy.types.Object, role: str, source_asset_id: str | None = None) -> None:
    obj["poetId"] = "alexander-pushkin"
    obj["offlineEvidenceOnly"] = True
    obj["productionAsset"] = False
    obj["exhibitRole"] = role
    if source_asset_id:
        obj["sourceAssetId"] = source_asset_id


def create_hero(
    contract: dict[str, Any],
    portrait_path: Path,
    materials: dict[str, bpy.types.Material],
    coll: bpy.types.Collection,
) -> list[bpy.types.Object]:
    spec = contract["exhibit"]["anchor"]
    hero_spec = contract["exhibit"]["heroPortrait"]
    root = create_empty("PUSHKIN_HERO_ROOT", spec["center"], float(spec["rotationZ"]), coll)
    set_object_evidence(root, "hero-root")

    outer_w, outer_h = (float(value) for value in hero_spec["frameOuterSizeMetres"])
    mat_w, mat_h = (float(value) for value in hero_spec["matSizeMetres"])
    image_w, image_h = (float(value) for value in hero_spec["visibleImageSizeMetres"])
    depth = float(hero_spec["frameDepthMetres"])
    rail = (outer_w - mat_w) / 2.0
    front_y = -0.125

    objects: list[bpy.types.Object] = []
    backing = create_local_box("PUSHKIN_HERO_SHADOW_BACK", root, (0.0, 0.0, 0.0), (outer_w + 0.08, depth, outer_h + 0.08), materials["charcoal"], coll)
    objects.append(backing)
    mat = create_local_box("PUSHKIN_HERO_LINEN_MAT", root, (0.0, front_y + 0.016, 0.0), (mat_w, 0.035, mat_h), materials["linen"], coll)
    objects.append(mat)
    portrait_material = image_material("MAT_PUSHKIN_KIPRENSKY_SOURCE", portrait_path, roughness=0.82)
    materials["portrait"] = portrait_material
    art = create_local_plane_xz("PUSHKIN_HERO_PORTRAIT", root, (0.0, front_y - 0.010, 0.0), (image_w, image_h), portrait_material, coll)
    objects.append(art)

    for name, loc, size in [
        ("PUSHKIN_HERO_FRAME_TOP", (0.0, front_y - 0.030, outer_h / 2 - rail / 2), (outer_w, depth, rail)),
        ("PUSHKIN_HERO_FRAME_BOTTOM", (0.0, front_y - 0.030, -outer_h / 2 + rail / 2), (outer_w, depth, rail)),
        ("PUSHKIN_HERO_FRAME_LEFT", (-outer_w / 2 + rail / 2, front_y - 0.030, 0.0), (rail, depth, outer_h - 2 * rail)),
        ("PUSHKIN_HERO_FRAME_RIGHT", (outer_w / 2 - rail / 2, front_y - 0.030, 0.0), (rail, depth, outer_h - 2 * rail)),
    ]:
        objects.append(create_local_box(name, root, loc, size, materials["brass"], coll))

    title = create_text("PUSHKIN_HERO_LABEL", "АЛЕКСАНДР ПУШКИН", root, (0.0, front_y - 0.055, -outer_h / 2 - 0.22), 0.105, materials["label"], coll)
    objects.append(title)
    dates = create_text("PUSHKIN_HERO_DATES", "1799 — 1837", root, (0.0, front_y - 0.057, -outer_h / 2 - 0.37), 0.060, materials["labelDim"], coll)
    objects.append(dates)

    for obj in objects:
        set_object_evidence(obj, "hero-portrait", hero_spec["assetId"] if obj == art else None)
    art["sourceFileHash"] = hero_spec["sourceHash"]
    art["documentaryDerivative"] = False
    return objects


def create_onegin_case(
    contract: dict[str, Any],
    page_path: Path,
    source_assets: dict[str, Any],
    materials: dict[str, bpy.types.Material],
    coll: bpy.types.Collection,
) -> list[bpy.types.Object]:
    case_spec = contract["exhibit"]["documentCases"][0]
    page_spec = contract["exhibit"]["oneginTitlePage"]
    root = create_empty("PUSHKIN_ONEGIN_CASE_ROOT", case_spec["center"], float(case_spec["rotationZ"]), coll)
    set_object_evidence(root, "onegin-case")
    tilt = math.radians(float(page_spec["deckTiltDegrees"]))

    objects: list[bpy.types.Object] = []
    base = create_local_box("PUSHKIN_ONEGIN_PLINTH", root, (0.0, 0.0, -0.03), (1.05, 0.72, 1.04), materials["charcoal"], coll)
    objects.append(base)
    cap = create_local_box("PUSHKIN_ONEGIN_CAP", root, (0.0, 0.0, 0.51), (1.11, 0.78, 0.08), materials["warmStone"], coll)
    objects.append(cap)
    deck = create_local_box("PUSHKIN_ONEGIN_DECK", root, (0.0, 0.0, 0.60), (0.68, 0.94, 0.045), materials["paperBacking"], coll, rotation=(tilt, 0.0, 0.0))
    objects.append(deck)

    page_material = image_material("MAT_PUSHKIN_ONEGIN_TITLE_PAGE", page_path, roughness=0.92)
    materials["oneginPage"] = page_material
    page_w, page_h = (float(value) for value in page_spec["displayPageSizeMetres"])
    page = create_local_plane_xy("PUSHKIN_ONEGIN_PAGE", root, (0.0, -0.02, 0.638), (page_w, page_h), page_material, coll, rotation_x=tilt)
    objects.append(page)
    page["sourceAssetId"] = page_spec["assetId"]
    page["sourceFileHash"] = page_spec["sourceHash"]
    derivative = next((item for item in source_assets.get("derivatives", []) if item.get("sourceAssetId") == page_spec["assetId"]), None)
    if not derivative:
        fail("Onegin derivative evidence missing")
    page["derivedFileHash"] = derivative["sha256"]
    page["sourcePdfPageIndex"] = int(page_spec["sourcePdfPageIndex"])
    page["documentaryDerivative"] = True

    # Brass rails imply a protective vitrinal perimeter without relying on transparency sorting.
    rail_z = 0.675
    for name, loc, size in [
        ("PUSHKIN_ONEGIN_RAIL_FRONT", (0.0, -0.47, rail_z), (0.72, 0.018, 0.018)),
        ("PUSHKIN_ONEGIN_RAIL_BACK", (0.0, 0.47, rail_z + 0.30), (0.72, 0.018, 0.018)),
        ("PUSHKIN_ONEGIN_RAIL_LEFT", (-0.36, 0.0, rail_z + 0.15), (0.018, 0.95, 0.018)),
        ("PUSHKIN_ONEGIN_RAIL_RIGHT", (0.36, 0.0, rail_z + 0.15), (0.018, 0.95, 0.018)),
    ]:
        objects.append(create_local_box(name, root, loc, size, materials["brass"], coll, rotation=(tilt, 0.0, 0.0)))

    caption = create_text("PUSHKIN_ONEGIN_LABEL", "ЕВГЕНИЙ ОНЕГИН · 1833", root, (0.0, -0.38, 0.25), 0.052, materials["label"], coll)
    objects.append(caption)
    for obj in objects:
        set_object_evidence(obj, "documentary-publication", page_spec["assetId"] if obj == page else None)
    return objects


def create_context_case(contract: dict[str, Any], materials: dict[str, bpy.types.Material], coll: bpy.types.Collection) -> list[bpy.types.Object]:
    case_spec = contract["exhibit"]["documentCases"][1]
    root = create_empty("PUSHKIN_CONTEXT_CASE_ROOT", case_spec["center"], float(case_spec["rotationZ"]), coll)
    set_object_evidence(root, "editorial-context")
    objects: list[bpy.types.Object] = []
    base = create_local_box("PUSHKIN_CONTEXT_PLINTH", root, (0.0, 0.0, -0.02), (1.0, 0.65, 1.04), materials["charcoal"], coll)
    objects.append(base)
    tablet = create_local_box("PUSHKIN_CONTEXT_TABLET", root, (0.0, -0.30, 0.56), (0.82, 0.045, 0.66), materials["warmStone"], coll, rotation=(math.radians(12.0), 0.0, 0.0))
    objects.append(tablet)
    accent = create_local_box("PUSHKIN_CONTEXT_BRASS_RULE", root, (0.0, -0.333, 0.79), (0.66, 0.012, 0.012), materials["brass"], coll, rotation=(math.radians(12.0), 0.0, 0.0))
    objects.append(accent)
    labels = contract["exhibit"]["contextCase"]["labels"]
    for index, body in enumerate(labels):
        obj = create_text(
            f"PUSHKIN_CONTEXT_LABEL_{index+1:02d}",
            str(body),
            root,
            (0.0, -0.345, 0.68 - index * 0.13),
            0.047 if index == 0 else 0.036,
            materials["label"] if index == 0 else materials["labelDim"],
            coll,
        )
        obj.rotation_euler = (math.radians(78.0), 0.0, 0.0)
        objects.append(obj)
    for obj in objects:
        set_object_evidence(obj, "editorial-context")
        obj["documentaryAsset"] = False
    return objects


def make_camera_set(contract: dict[str, Any], coll: bpy.types.Collection) -> dict[str, bpy.types.Object]:
    cameras: dict[str, bpy.types.Object] = {}
    for spec in contract["evidence"]["stills"]:
        camera = create_camera(f"CAM_PUSHKIN_{spec['id']}", spec["position"], spec["target"], float(spec["lensMm"]), coll)
        camera["evidenceClass"] = spec["class"]
        camera["offlineEvidenceOnly"] = True
        cameras[spec["id"]] = camera
    return cameras


def render_stills(contract: dict[str, Any], cameras: dict[str, bpy.types.Object], output_dir: Path) -> list[dict[str, Any]]:
    scene = bpy.context.scene
    rendered: list[dict[str, Any]] = []
    for spec in contract["evidence"]["stills"]:
        resolution = contract["evidence"]["mobileResolution"] if spec["class"] == "mobile" else contract["evidence"]["desktopResolution"]
        output = output_dir / f"{spec['id']}.png"
        scene.camera = cameras[spec["id"]]
        scene.render.resolution_x = int(resolution[0])
        scene.render.resolution_y = int(resolution[1])
        scene.render.resolution_percentage = 100
        scene.render.filepath = str(output)
        bpy.ops.render.render(write_still=True)
        if not output.exists() or output.stat().st_size == 0:
            fail(f"still render failed: {output.name}")
        rendered.append({
            "id": spec["id"],
            "class": spec["class"],
            "path": output.name,
            "resolution": resolution,
            "bytes": output.stat().st_size,
            "sha256": sha256_file(output),
        })
    return rendered


def create_sequence_camera(contract: dict[str, Any], coll: bpy.types.Collection) -> tuple[bpy.types.Object, bpy.types.Object, int]:
    sequence = contract["evidence"]["cameraSequence"]
    camera_data = bpy.data.cameras.new("CAM_PUSHKIN_SEQUENCE_DATA")
    camera_data.lens = 32.0
    camera_data.sensor_width = 36.0
    camera = bpy.data.objects.new("CAM_PUSHKIN_SEQUENCE", camera_data)
    coll.objects.link(camera)
    target = bpy.data.objects.new("CAM_PUSHKIN_SEQUENCE_TARGET", None)
    coll.objects.link(target)
    constraint = camera.constraints.new(type="TRACK_TO")
    constraint.target = target
    constraint.track_axis = "TRACK_NEGATIVE_Z"
    constraint.up_axis = "UP_Y"
    camera["offlineEvidenceOnly"] = True
    target["offlineEvidenceOnly"] = True

    fps = int(sequence["fps"])
    final_frame = int(sequence["durationSeconds"] * fps)
    for keyframe in sequence["keyframes"]:
        frame = int(round(float(keyframe["second"]) * fps)) + 1
        camera.location = tuple(float(value) for value in keyframe["position"])
        target.location = tuple(float(value) for value in keyframe["target"])
        camera.keyframe_insert(data_path="location", frame=frame)
        target.keyframe_insert(data_path="location", frame=frame)
    return camera, target, final_frame


def render_sequence(contract: dict[str, Any], camera: bpy.types.Object, final_frame: int, output_dir: Path) -> dict[str, Any]:
    scene = bpy.context.scene
    sequence = contract["evidence"]["cameraSequence"]
    scene.camera = camera
    scene.render.fps = int(sequence["fps"])
    scene.frame_start = 1
    scene.frame_end = final_frame + 1
    scene.render.resolution_x = int(sequence["resolution"][0])
    scene.render.resolution_y = int(sequence["resolution"][1])
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.ffmpeg.ffmpeg_preset = "GOOD"
    scene.render.filepath = str(output_dir / "pushkin-sequence")
    bpy.ops.render.render(animation=True)
    candidates = sorted(output_dir.glob("pushkin-sequence*.mp4"))
    if not candidates:
        fail("camera sequence MP4 was not created")
    video = candidates[-1]
    return {
        "path": video.name,
        "bytes": video.stat().st_size,
        "sha256": sha256_file(video),
        "durationSeconds": int(sequence["durationSeconds"]),
        "fps": int(sequence["fps"]),
        "frameCount": final_frame + 1,
        "resolution": sequence["resolution"],
    }


def triangle_count(objects: list[bpy.types.Object]) -> int:
    count = 0
    for obj in objects:
        if obj.type != "MESH":
            continue
        obj.data.calc_loop_triangles()
        count += len(obj.data.loop_triangles)
    return count


def export_glb(objects: list[bpy.types.Object], camera: bpy.types.Object, output: Path) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        if obj.type == "MESH":
            obj.select_set(True)
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
    )
    if not output.exists() or output.stat().st_size == 0:
        fail("raw Pushkin exhibit GLB was not created")


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("Pushkin exhibit generation must run in Blender background mode")

    contract_path = Path(args.contract).resolve()
    source_blend = Path(args.source_blend).resolve()
    source_evidence_path = Path(args.source_evidence).resolve()
    source_assets_path = Path(args.source_assets_evidence).resolve()
    portrait_path = Path(args.portrait).resolve()
    onegin_page_path = Path(args.onegin_page).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    contract = read_json(contract_path)
    source_evidence = read_json(source_evidence_path)
    source_assets = read_json(source_assets_path)
    if contract["source"]["topology"] != "H3" or source_evidence.get("source", {}).get("candidateId") != "H3":
        fail("Pushkin exhibit must derive from frozen H3 material bay")
    if source_evidence.get("source", {}).get("layoutFingerprint") != contract["source"]["layoutFingerprint"]:
        fail("Pushkin exhibit H3 layout fingerprint drifted")
    if source_evidence.get("source", {}).get("meshGeometryFingerprintBeforeSpike") != contract["source"]["meshGeometryFingerprint"]:
        fail("Pushkin exhibit H3 geometry fingerprint drifted")
    if source_assets.get("purpose") != "offline-source-evidence-only-not-production-media" or source_assets.get("productionManifestAllowed") is not False:
        fail("source assets evidence crossed the production boundary")
    source_hashes = {entry["assetId"]: entry["sha256"] for entry in source_assets.get("sources", [])}
    if source_hashes.get(contract["exhibit"]["heroPortrait"]["assetId"]) != contract["exhibit"]["heroPortrait"]["sourceHash"]:
        fail("Kiprensky source evidence hash drifted")
    if source_hashes.get(contract["exhibit"]["oneginTitlePage"]["assetId"]) != contract["exhibit"]["oneginTitlePage"]["sourceHash"]:
        fail("Onegin source evidence hash drifted")
    if sha256_file(portrait_path) != contract["exhibit"]["heroPortrait"]["sourceHash"]:
        fail("portrait file hash does not match exhibit contract")

    bpy.ops.wm.open_mainfile(filepath=str(source_blend), load_ui=False)
    scene = bpy.context.scene
    if scene.unit_settings.system != "METRIC" or scene.unit_settings.length_unit != "METERS" or abs(scene.unit_settings.scale_length - 1.0) > 1e-9:
        fail("source material bay lost metre-scale contract")
    scene.render.engine = contract["evidence"]["renderEngine"]
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    if hasattr(scene, "render"):
        scene.render.resolution_percentage = 100
    configure_world(contract)

    exhibit_coll = collection("COLL_PUSHKIN_OFFLINE_EXHIBIT")
    camera_coll = collection("COLL_PUSHKIN_OFFLINE_CAMERAS")
    light_coll = collection("COLL_PUSHKIN_OFFLINE_LIGHTS")

    for name in ["EXHIBIT_alexander-pushkin", "EXHIBIT_DOC_CASE_01", "EXHIBIT_DOC_CASE_02"]:
        obj = bpy.data.objects.get(name)
        if obj is None:
            fail(f"source material bay missing required H3 proxy {name}")
        obj.hide_render = True
        obj["constructionProxyPreserved"] = True
        obj["productionAsset"] = False

    palette = contract["artDirection"]["palette"]
    material_specs = contract["artDirection"]["materials"]
    materials: dict[str, bpy.types.Material] = {
        "charcoal": material_principled("MAT_PUSHKIN_CHARCOAL", palette["charcoal"], **material_specs["charcoalPlinth"]),
        "warmStone": material_principled("MAT_PUSHKIN_WARM_STONE", palette["warmStone"], 0.0, 0.74),
        "linen": material_principled("MAT_PUSHKIN_LINEN", palette["linen"], **material_specs["linenMat"]),
        "paperBacking": material_principled("MAT_PUSHKIN_PAPER", palette["paper"], **material_specs["paperBacking"]),
        "brass": material_principled("MAT_PUSHKIN_BRASS", palette["brass"], **material_specs["frameBrass"]),
        "label": material_principled("MAT_PUSHKIN_LABEL", [0.82, 0.76, 0.64, 1.0], 0.0, 0.72),
        "labelDim": material_principled("MAT_PUSHKIN_LABEL_DIM", [0.42, 0.39, 0.34, 1.0], 0.0, 0.80),
    }

    exhibit_objects: list[bpy.types.Object] = []
    exhibit_objects.extend(create_hero(contract, portrait_path, materials, exhibit_coll))
    exhibit_objects.extend(create_onegin_case(contract, onegin_page_path, source_assets, materials, exhibit_coll))
    exhibit_objects.extend(create_context_case(contract, materials, exhibit_coll))

    offline_lights = [create_light(spec, light_coll) for spec in contract["offlineLighting"]["lights"]]
    still_cameras = make_camera_set(contract, camera_coll)
    r1 = still_cameras["01-r1-hero"]
    r1["approvedRig"] = "R1"
    r1["sourceTopology"] = "H3"
    r1["productionAsset"] = False

    raw_glb = output_dir / "pushkin-offline-raw.glb"
    export_glb(exhibit_objects, r1, raw_glb)

    blend_path = output_dir / "pushkin-offline-exhibit.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    bpy.ops.wm.open_mainfile(filepath=str(blend_path), load_ui=False)
    scene = bpy.context.scene
    if scene.unit_settings.system != "METRIC" or scene.unit_settings.length_unit != "METERS":
        fail("saved Pushkin exhibit lost metric scene contract")

    still_cameras = {spec["id"]: bpy.data.objects.get(f"CAM_PUSHKIN_{spec['id']}") for spec in contract["evidence"]["stills"]}
    if any(camera is None for camera in still_cameras.values()):
        fail("saved Pushkin exhibit lost still cameras")
    still_evidence = render_stills(contract, still_cameras, output_dir)

    sequence_camera, _sequence_target, final_frame = create_sequence_camera(contract, camera_coll)
    sequence_evidence = render_sequence(contract, sequence_camera, final_frame, output_dir)

    mesh_objects = [obj for obj in exhibit_objects if obj.type == "MESH"]
    evidence = {
        "schemaVersion": 1,
        "laneId": "TLP-HALL-001",
        "productIssue": 369,
        "phase": "pushkinVerticalSlice",
        "status": "offline-exhibit-generated-awaiting-human-visual-approval",
        "runtime": {
            "version": bpy.app.version_string,
            "versionTuple": list(bpy.app.version),
            "background": bool(bpy.app.background),
            "renderEngine": contract["evidence"]["renderEngine"],
        },
        "source": {
            "topology": "H3",
            "layoutFingerprint": contract["source"]["layoutFingerprint"],
            "meshGeometryFingerprint": contract["source"]["meshGeometryFingerprint"],
            "approvedRig": "R1",
            "lightingBaseline": "L0-minimal-runtime",
            "portraitSourceHash": contract["exhibit"]["heroPortrait"]["sourceHash"],
            "oneginSourceHash": contract["exhibit"]["oneginTitlePage"]["sourceHash"],
            "oneginDerivativeHash": next(item["sha256"] for item in source_assets["derivatives"] if item["sourceAssetId"] == contract["exhibit"]["oneginTitlePage"]["assetId"]),
        },
        "scene": {
            "unitSystem": scene.unit_settings.system,
            "lengthUnit": scene.unit_settings.length_unit,
            "scaleLength": float(scene.unit_settings.scale_length),
            "exhibitMeshObjects": len(mesh_objects),
            "exhibitTriangles": triangle_count(mesh_objects),
            "materials": len({slot.material.name for obj in mesh_objects for slot in obj.material_slots if slot.material}),
            "offlineLights": len(offline_lights),
            "stillCameras": len(still_cameras),
        },
        "offlineLights": [light.name for light in offline_lights],
        "stills": still_evidence,
        "cameraSequence": sequence_evidence,
        "files": {
            "blend": {"path": blend_path.name, "bytes": blend_path.stat().st_size, "sha256": sha256_file(blend_path)},
            "rawGlb": {"path": raw_glb.name, "bytes": raw_glb.stat().st_size, "sha256": sha256_file(raw_glb)},
        },
        "productionBoundary": {
            "productionAsset": False,
            "productionManifestAllowed": False,
            "productionWebglMayBegin": False,
            "offlineVisualApprovalPromoted": False,
            "humanOwnerVisualApprovalRequired": True,
        },
    }
    write_json(output_dir / "offline-exhibit-evidence.json", evidence)
    print(f"Pushkin offline exhibit generated: {len(still_evidence)} stills, {sequence_evidence['durationSeconds']}s sequence, {evidence['scene']['exhibitTriangles']} exhibit triangles.")


if __name__ == "__main__":
    main()

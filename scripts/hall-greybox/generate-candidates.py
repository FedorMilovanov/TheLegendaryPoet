from __future__ import annotations

import argparse
import hashlib
import html
import json
import math
import sys
from pathlib import Path
from typing import Any

import bpy
from mathutils import Vector

EXPECTED_VERSION = (4, 5, 12)
REQUIRED_CAMERA_IDS = (
    "entryReveal",
    "orientation",
    "firstTransition",
    "pushkinApproach",
    "pushkinViewing",
    "reverseExit",
)
COLLECTIONS = (
    "COLL_CORE",
    "COLL_GALLERY_GREYBOX",
    "COLL_EXHIBITS_alexander-pushkin",
    "COLL_CAMERAS",
    "COLL_EXPORT_HELPERS",
)


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Generate Hall v3 neutral metric greybox candidates")
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


def route_length(points: list[list[float]]) -> float:
    return sum(math.dist(a, b) for a, b in zip(points, points[1:]))


def forced_turn_count(points: list[list[float]], threshold_degrees: float = 20.0) -> int:
    count = 0
    for previous, current, following in zip(points, points[1:], points[2:]):
        incoming = Vector((current[0] - previous[0], current[1] - previous[1]))
        outgoing = Vector((following[0] - current[0], following[1] - current[1]))
        if incoming.length == 0 or outgoing.length == 0:
            continue
        angle = math.degrees(incoming.angle(outgoing))
        if angle >= threshold_degrees:
            count += 1
    return count


def scene_collection(name: str) -> bpy.types.Collection:
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def move_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    for owner in list(obj.users_collection):
        owner.objects.unlink(obj)
    collection.objects.link(obj)


def create_box(
    name: str,
    center: tuple[float, float, float],
    size: tuple[float, float, float],
    collection: bpy.types.Collection,
    rotation_z: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=center, rotation=(0.0, 0.0, rotation_z))
    obj = bpy.context.object
    if obj is None:
        fail(f"failed to create box: {name}")
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    move_to_collection(obj, collection)
    return obj


def create_wall(
    name: str,
    segment: list[float],
    thickness: float,
    height: float,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    x1, y1, x2, y2 = segment
    dx = x2 - x1
    dy = y2 - y1
    length = math.hypot(dx, dy)
    if length <= 0.05:
        fail(f"wall segment is too short: {name}")
    center = ((x1 + x2) / 2.0, (y1 + y2) / 2.0, height / 2.0)
    angle = math.atan2(dy, dx)
    return create_box(name, center, (length, thickness, height), collection, angle)


def create_floor(name: str, polygon: list[list[float]], collection: bpy.types.Collection) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(f"{name}_MESH")
    vertices = [(float(x), float(y), 0.0) for x, y in polygon]
    mesh.from_pydata(vertices, [], [list(range(len(vertices)))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj


def create_ceiling(
    name: str,
    zone: dict[str, Any],
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    center_x, center_y = zone["center"]
    width, depth = zone["size"]
    height = float(zone["height"])
    thickness = 0.12
    return create_box(
        name,
        (float(center_x), float(center_y), height + thickness / 2.0),
        (float(width), float(depth), thickness),
        collection,
    )


def create_camera(
    name: str,
    position: list[float],
    target: list[float],
    lens_mm: float,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    data = bpy.data.cameras.new(f"{name}_DATA")
    data.lens = lens_mm
    data.sensor_width = 36.0
    data.clip_start = 0.05
    data.clip_end = 200.0
    camera = bpy.data.objects.new(name, data)
    camera.location = tuple(float(value) for value in position)
    direction = Vector(tuple(float(value) for value in target)) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    collection.objects.link(camera)
    return camera


def configure_scene(candidate_id: str) -> dict[str, bpy.types.Collection]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = f"HALL_GREYBOX_{candidate_id}"
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene.unit_settings.scale_length = 1.0
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.image_settings.file_format = "PNG"
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "SINGLE"
    scene.display.shading.single_color = (0.58, 0.58, 0.58)
    return {name: scene_collection(name) for name in COLLECTIONS}


def build_candidate(candidate: dict[str, Any], common: dict[str, Any]) -> dict[str, bpy.types.Object]:
    collections = configure_scene(candidate["id"])
    core = collections["COLL_CORE"]
    gallery = collections["COLL_GALLERY_GREYBOX"]
    exhibits = collections["COLL_EXHIBITS_alexander-pushkin"]
    helpers = collections["COLL_EXPORT_HELPERS"]
    cameras = collections["COLL_CAMERAS"]

    create_floor("ARCH_floor", candidate["floorPolygon"], core)
    wall_height = float(common["defaultWallHeight"])
    wall_thickness = float(common["wallThickness"])
    for index, segment in enumerate(candidate["walls"], start=1):
        create_wall(f"ARCH_wall_{index:03d}", segment, wall_thickness, wall_height, gallery)
    for index, zone in enumerate(candidate["ceilingZones"], start=1):
        create_ceiling(f"ARCH_ceiling_{index:02d}", zone, core)

    pushkin = candidate["pushkin"]
    anchor_spec = pushkin["anchor"]
    anchor = create_box(
        "EXHIBIT_alexander-pushkin",
        tuple(float(value) for value in anchor_spec["center"]),
        tuple(float(value) for value in anchor_spec["size"]),
        exhibits,
        float(anchor_spec.get("rotationZ", 0.0)),
    )
    anchor["poetId"] = "alexander-pushkin"
    anchor["greyboxProxy"] = True

    for case_spec in pushkin["documentCases"]:
        case = create_box(
            case_spec["name"],
            tuple(float(value) for value in case_spec["center"]),
            tuple(float(value) for value in case_spec["size"]),
            exhibits,
            float(case_spec.get("rotationZ", 0.0)),
        )
        case["greyboxProxy"] = True
        case["documentaryAsset"] = False

    proxy_x, proxy_y = candidate["humanProxyPosition"]
    create_box(
        "HUMAN_PROXY",
        (float(proxy_x), float(proxy_y), float(common["humanProxyHeightMetres"]) / 2.0),
        (0.45, 0.30, float(common["humanProxyHeightMetres"])),
        helpers,
    )

    camera_objects: dict[str, bpy.types.Object] = {}
    for camera_id in REQUIRED_CAMERA_IDS:
        spec = candidate["cameras"][camera_id]
        camera_objects[camera_id] = create_camera(
            f"CAM_{candidate['id']}_{camera_id}",
            spec["position"],
            spec["target"],
            float(common["comparisonLensMm"]),
            cameras,
        )

    if len(bpy.data.materials) != 0:
        fail(f"{candidate['id']}: neutral greybox must contain zero Blender materials")
    if len(bpy.data.lights) != 0:
        fail(f"{candidate['id']}: neutral greybox must contain zero scene lights")

    return camera_objects


def ray_is_clear(origin_values: list[float], target_values: list[float]) -> tuple[bool, str | None, float]:
    scene = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()
    origin = Vector(tuple(float(value) for value in origin_values))
    target = Vector(tuple(float(value) for value in target_values))
    vector = target - origin
    distance = vector.length
    if distance <= 0.05:
        fail("ray witness distance is too short")
    direction = vector.normalized()
    hit, _location, _normal, _index, obj, _matrix = scene.ray_cast(
        depsgraph,
        origin,
        direction,
        distance=max(distance - 0.08, 0.01),
    )
    return (not hit, obj.name if hit and obj else None, distance)


def object_xy_bounds(obj: bpy.types.Object) -> tuple[float, float, float, float]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    xs = [point.x for point in points]
    ys = [point.y for point in points]
    return min(xs), min(ys), max(xs), max(ys)


def rectangles_overlap(
    left: tuple[float, float, float, float],
    right: tuple[float, float, float, float],
) -> bool:
    return not (
        left[2] <= right[0]
        or left[0] >= right[2]
        or left[3] <= right[1]
        or left[1] >= right[3]
    )


def validate_viewing_clearance(candidate: dict[str, Any]) -> dict[str, Any]:
    spec = candidate["viewingClearance"]
    cx, cy = (float(value) for value in spec["center"])
    width, depth = (float(value) for value in spec["size"])
    region = (cx - width / 2.0, cy - depth / 2.0, cx + width / 2.0, cy + depth / 2.0)
    overlaps: list[str] = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        if obj.name in {"ARCH_floor", spec["servedObject"]} or obj.name.startswith("ARCH_ceiling_"):
            continue
        if not (obj.name.startswith("ARCH_") or obj.name.startswith("EXHIBIT_")):
            continue
        if rectangles_overlap(region, object_xy_bounds(obj)):
            overlaps.append(obj.name)
    return {
        "center": [cx, cy],
        "width": width,
        "depth": depth,
        "servedObject": spec["servedObject"],
        "overlaps": sorted(overlaps),
        "clear": len(overlaps) == 0,
    }


def render_camera(
    camera: bpy.types.Object,
    output: Path,
    resolution: list[int],
) -> None:
    scene = bpy.context.scene
    scene.camera = camera
    scene.render.resolution_x = int(resolution[0])
    scene.render.resolution_y = int(resolution[1])
    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)


def polygon_bounds(polygon: list[list[float]]) -> tuple[float, float, float, float]:
    xs = [float(point[0]) for point in polygon]
    ys = [float(point[1]) for point in polygon]
    return min(xs), min(ys), max(xs), max(ys)


def svg_transform(polygon: list[list[float]], width: int = 1000, height: int = 760, margin: int = 80):
    min_x, min_y, max_x, max_y = polygon_bounds(polygon)
    span_x = max(max_x - min_x, 1.0)
    span_y = max(max_y - min_y, 1.0)
    scale = min((width - 2 * margin) / span_x, (height - 2 * margin) / span_y)

    def point(x: float, y: float) -> tuple[float, float]:
        sx = margin + (x - min_x) * scale
        sy = height - margin - (y - min_y) * scale
        return sx, sy

    return point, scale, (min_x, min_y, max_x, max_y), (width, height, margin)


def svg_header(width: int, height: int, title: str) -> list[str]:
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="white"/>',
        f'<text x="28" y="34" font-family="sans-serif" font-size="20" font-weight="700">{html.escape(title)}</text>',
    ]


def write_plan_svg(candidate: dict[str, Any], common: dict[str, Any], path: Path) -> None:
    point, scale, bounds, page = svg_transform(candidate["floorPolygon"])
    width, height, margin = page
    lines = svg_header(width, height, f"{candidate['id']} — dimensioned plan")
    polygon_points = " ".join(f"{point(float(x), float(y))[0]:.1f},{point(float(x), float(y))[1]:.1f}" for x, y in candidate["floorPolygon"])
    lines.append(f'<polygon points="{polygon_points}" fill="#f7f7f7" stroke="#111" stroke-width="2"/>')
    wall_stroke = max(2.0, float(common["wallThickness"]) * scale)
    for segment in candidate["walls"]:
        x1, y1, x2, y2 = (float(value) for value in segment)
        a = point(x1, y1)
        b = point(x2, y2)
        lines.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#222" stroke-width="{wall_stroke:.1f}"/>')
    route = [point(float(x), float(y)) for x, y in candidate["route"]]
    route_points = " ".join(f"{x:.1f},{y:.1f}" for x, y in route)
    lines.append(f'<polyline points="{route_points}" fill="none" stroke="#555" stroke-width="3" stroke-dasharray="10 7"/>')
    for probe in candidate["clearanceProbes"]:
        ax, ay, _ = probe["a"]
        bx, by, _ = probe["b"]
        a = point(float(ax), float(ay))
        b = point(float(bx), float(by))
        length = math.dist((float(ax), float(ay)), (float(bx), float(by)))
        lines.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#777" stroke-width="2"/>')
        mx, my = (a[0] + b[0]) / 2.0, (a[1] + b[1]) / 2.0
        lines.append(f'<text x="{mx + 5:.1f}" y="{my - 5:.1f}" font-family="sans-serif" font-size="13">{html.escape(probe["id"])} {length:.2f} m</text>')
    anchor = candidate["pushkin"]["anchor"]
    anchor_center = point(float(anchor["center"][0]), float(anchor["center"][1]))
    lines.append(f'<circle cx="{anchor_center[0]:.1f}" cy="{anchor_center[1]:.1f}" r="8" fill="none" stroke="#000" stroke-width="2"/>')
    lines.append(f'<text x="{anchor_center[0] + 11:.1f}" y="{anchor_center[1] - 8:.1f}" font-family="sans-serif" font-size="14">Pushkin anchor</text>')

    min_x, min_y, max_x, max_y = bounds
    overall_width = max_x - min_x
    overall_depth = max_y - min_y
    left_top = point(min_x, max_y)
    right_top = point(max_x, max_y)
    dim_y = margin - 28
    lines.append(f'<line x1="{left_top[0]:.1f}" y1="{dim_y}" x2="{right_top[0]:.1f}" y2="{dim_y}" stroke="#000" stroke-width="1"/>')
    lines.append(f'<text x="{(left_top[0]+right_top[0])/2 - 32:.1f}" y="{dim_y - 8}" font-family="sans-serif" font-size="14">{overall_width:.1f} m</text>')
    dim_x = width - margin + 28
    top = point(max_x, max_y)
    bottom = point(max_x, min_y)
    lines.append(f'<line x1="{dim_x}" y1="{top[1]:.1f}" x2="{dim_x}" y2="{bottom[1]:.1f}" stroke="#000" stroke-width="1"/>')
    lines.append(f'<text x="{dim_x + 8}" y="{(top[1]+bottom[1])/2:.1f}" font-family="sans-serif" font-size="14" transform="rotate(90 {dim_x + 8} {(top[1]+bottom[1])/2:.1f})">{overall_depth:.1f} m</text>')
    lines.append('</svg>')
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def wall_section_positions(candidate: dict[str, Any], axis: str) -> list[float]:
    positions: list[float] = []
    epsilon = 1e-6
    for segment in candidate["walls"]:
        x1, y1, x2, y2 = (float(value) for value in segment)
        if axis == "x":
            if min(x1, x2) - epsilon <= 0.0 <= max(x1, x2) + epsilon:
                if abs(x2 - x1) < epsilon:
                    if abs(x1) < epsilon:
                        positions.append((y1 + y2) / 2.0)
                else:
                    t = (0.0 - x1) / (x2 - x1)
                    positions.append(y1 + t * (y2 - y1))
        else:
            if min(y1, y2) - epsilon <= 0.0 <= max(y1, y2) + epsilon:
                if abs(y2 - y1) < epsilon:
                    if abs(y1) < epsilon:
                        positions.append((x1 + x2) / 2.0)
                else:
                    t = (0.0 - y1) / (y2 - y1)
                    positions.append(x1 + t * (x2 - x1))
    return positions


def write_section_svg(candidate: dict[str, Any], common: dict[str, Any], path: Path, axis: str) -> None:
    min_x, min_y, max_x, max_y = polygon_bounds(candidate["floorPolygon"])
    horizontal_min, horizontal_max = (min_y, max_y) if axis == "x" else (min_x, max_x)
    max_height = max(float(zone["height"]) for zone in candidate["ceilingZones"]) + 1.0
    width, height, margin = 1000, 520, 70
    scale_x = (width - 2 * margin) / max(horizontal_max - horizontal_min, 1.0)
    scale_z = (height - 2 * margin) / max_height

    def sx(value: float) -> float:
        return margin + (value - horizontal_min) * scale_x

    def sz(value: float) -> float:
        return height - margin - value * scale_z

    label = "x=0" if axis == "x" else "y=0"
    lines = svg_header(width, height, f"{candidate['id']} — section {label}")
    lines.append(f'<line x1="{margin}" y1="{sz(0):.1f}" x2="{width-margin}" y2="{sz(0):.1f}" stroke="#111" stroke-width="2"/>')
    wall_height = float(common["defaultWallHeight"])
    for position in wall_section_positions(candidate, axis):
        x = sx(position)
        lines.append(f'<rect x="{x-3:.1f}" y="{sz(wall_height):.1f}" width="6" height="{wall_height*scale_z:.1f}" fill="#555"/>')
    for zone in candidate["ceilingZones"]:
        cx, cy = (float(value) for value in zone["center"])
        zw, zd = (float(value) for value in zone["size"])
        height_value = float(zone["height"])
        if axis == "x" and cx - zw / 2 <= 0 <= cx + zw / 2:
            a, b = cy - zd / 2, cy + zd / 2
        elif axis == "y" and cy - zd / 2 <= 0 <= cy + zd / 2:
            a, b = cx - zw / 2, cx + zw / 2
        else:
            continue
        lines.append(f'<line x1="{sx(a):.1f}" y1="{sz(height_value):.1f}" x2="{sx(b):.1f}" y2="{sz(height_value):.1f}" stroke="#222" stroke-width="4"/>')
    proxy_height = float(common["humanProxyHeightMetres"])
    proxy_x = sx((horizontal_min + horizontal_max) / 2.0)
    lines.append(f'<rect x="{proxy_x-7:.1f}" y="{sz(proxy_height):.1f}" width="14" height="{proxy_height*scale_z:.1f}" fill="none" stroke="#000" stroke-width="2"/>')
    lines.append(f'<text x="{margin}" y="{sz(max_height-0.25):.1f}" font-family="sans-serif" font-size="14">wall {wall_height:.2f} m · proxy {proxy_height:.2f} m</text>')
    lines.append('</svg>')
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_sightline_svg(candidate: dict[str, Any], visibility: dict[str, Any], path: Path) -> None:
    point, scale, _bounds, page = svg_transform(candidate["floorPolygon"])
    width, height, _margin = page
    lines = svg_header(width, height, f"{candidate['id']} — route and sightlines")
    polygon_points = " ".join(f"{point(float(x), float(y))[0]:.1f},{point(float(x), float(y))[1]:.1f}" for x, y in candidate["floorPolygon"])
    lines.append(f'<polygon points="{polygon_points}" fill="#fafafa" stroke="#111" stroke-width="2"/>')
    wall_stroke = max(2.0, 0.25 * scale)
    for segment in candidate["walls"]:
        x1, y1, x2, y2 = (float(value) for value in segment)
        a = point(x1, y1)
        b = point(x2, y2)
        lines.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#333" stroke-width="{wall_stroke:.1f}"/>')
    route_points = " ".join(f"{point(float(x), float(y))[0]:.1f},{point(float(x), float(y))[1]:.1f}" for x, y in candidate["route"])
    lines.append(f'<polyline points="{route_points}" fill="none" stroke="#666" stroke-width="3" stroke-dasharray="10 7"/>')
    for camera_id in REQUIRED_CAMERA_IDS:
        camera = candidate["cameras"][camera_id]
        origin = point(float(camera["position"][0]), float(camera["position"][1]))
        target = point(float(camera["nextDestination"][0]), float(camera["nextDestination"][1]))
        dash = "" if visibility[camera_id]["visible"] else ' stroke-dasharray="5 5"'
        lines.append(f'<line x1="{origin[0]:.1f}" y1="{origin[1]:.1f}" x2="{target[0]:.1f}" y2="{target[1]:.1f}" stroke="#111" stroke-width="1.5"{dash}/>')
        lines.append(f'<circle cx="{origin[0]:.1f}" cy="{origin[1]:.1f}" r="4" fill="#111"/>')
        lines.append(f'<text x="{origin[0]+7:.1f}" y="{origin[1]-7:.1f}" font-family="sans-serif" font-size="12">{html.escape(camera_id)}</text>')
    lines.append('</svg>')
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def collect_output_files(candidate_dir: Path) -> list[dict[str, Any]]:
    outputs: list[dict[str, Any]] = []
    for path in sorted(candidate_dir.rglob("*")):
        if not path.is_file() or path.name == "manifest.json":
            continue
        outputs.append({
            "path": str(path.relative_to(candidate_dir)).replace("\\", "/"),
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        })
    return outputs


def generate_candidate(candidate: dict[str, Any], common: dict[str, Any], output_root: Path) -> dict[str, Any]:
    candidate_id = candidate["id"]
    candidate_dir = output_root / candidate_id
    desktop_dir = candidate_dir / "desktop"
    mobile_dir = candidate_dir / "mobile"
    desktop_dir.mkdir(parents=True, exist_ok=True)
    mobile_dir.mkdir(parents=True, exist_ok=True)

    camera_objects = build_candidate(candidate, common)
    blend_path = candidate_dir / f"{candidate_id}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    bpy.ops.wm.open_mainfile(filepath=str(blend_path), load_ui=False)
    scene = bpy.context.scene

    if scene.unit_settings.system != "METRIC" or scene.unit_settings.length_unit != "METERS" or abs(scene.unit_settings.scale_length - 1.0) > 1e-9:
        fail(f"{candidate_id}: metric unit contract failed after save/reopen")

    camera_objects = {
        camera_id: bpy.data.objects.get(f"CAM_{candidate_id}_{camera_id}")
        for camera_id in REQUIRED_CAMERA_IDS
    }
    if any(camera is None for camera in camera_objects.values()):
        fail(f"{candidate_id}: save/reopen lost one or more camera witnesses")

    visibility: dict[str, Any] = {}
    for camera_id in REQUIRED_CAMERA_IDS:
        spec = candidate["cameras"][camera_id]
        visible, occluder, distance = ray_is_clear(spec["position"], spec["nextDestination"])
        visibility[camera_id] = {
            "visible": visible,
            "occluder": occluder,
            "distanceMetres": round(distance, 4),
            "note": spec["note"],
        }

    clearances: list[dict[str, Any]] = []
    minimum_two_way = float(common["minimumClearances"]["routeTwoWayRecommended"])
    for probe in candidate["clearanceProbes"]:
        clear, occluder, distance = ray_is_clear(probe["a"], probe["b"])
        clearances.append({
            "id": probe["id"],
            "measuredWidthMetres": round(distance, 4),
            "clear": clear,
            "occluder": occluder,
            "meetsTwoWayRecommendedWitness": clear and distance >= minimum_two_way,
        })

    viewing_clearance = validate_viewing_clearance(candidate)
    minimum_view_width = float(common["minimumClearances"]["viewingWidth"])
    minimum_view_depth = float(common["minimumClearances"]["viewingDepth"])
    viewing_clearance["meetsMinimumWitness"] = (
        viewing_clearance["clear"]
        and viewing_clearance["width"] >= minimum_view_width
        and viewing_clearance["depth"] >= minimum_view_depth
    )

    for camera_id in REQUIRED_CAMERA_IDS:
        camera = camera_objects[camera_id]
        if camera is None:
            fail(f"{candidate_id}: missing camera after reopen: {camera_id}")
        render_camera(camera, desktop_dir / f"{camera_id}.png", common["desktopResolution"])

    for camera_id in common["mobileWitnesses"]:
        camera = camera_objects[camera_id]
        if camera is None:
            fail(f"{candidate_id}: missing mobile witness camera: {camera_id}")
        render_camera(camera, mobile_dir / f"{camera_id}.png", common["mobileResolution"])

    write_plan_svg(candidate, common, candidate_dir / "dimensioned-plan.svg")
    write_section_svg(candidate, common, candidate_dir / "section-x.svg", "x")
    write_section_svg(candidate, common, candidate_dir / "section-y.svg", "y")
    write_sightline_svg(candidate, visibility, candidate_dir / "sightlines.svg")

    layout_fingerprint = hashlib.sha256(
        json.dumps(
            {
                "floorPolygon": candidate["floorPolygon"],
                "walls": candidate["walls"],
                "route": candidate["route"],
                "ceilingZones": candidate["ceilingZones"],
            },
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()

    route = candidate["route"]
    manifest: dict[str, Any] = {
        "schemaVersion": 1,
        "laneId": "TLP-HALL-001",
        "phase": "metricGreybox",
        "candidateId": candidate_id,
        "candidateName": candidate["name"],
        "layoutFingerprint": layout_fingerprint,
        "runtime": {
            "version": bpy.app.version_string,
            "versionTuple": list(bpy.app.version),
            "buildHash": bpy.app.build_hash.decode("utf-8", errors="replace") if isinstance(bpy.app.build_hash, bytes) else str(bpy.app.build_hash),
            "background": bool(bpy.app.background),
        },
        "scene": {
            "name": bpy.context.scene.name,
            "unitSystem": bpy.context.scene.unit_settings.system,
            "lengthUnit": bpy.context.scene.unit_settings.length_unit,
            "scaleLength": float(bpy.context.scene.unit_settings.scale_length),
            "comparisonLensMm": float(common["comparisonLensMm"]),
            "humanProxyHeightMetres": float(common["humanProxyHeightMetres"]),
            "materials": len(bpy.data.materials),
            "lights": len(bpy.data.lights),
            "meshObjects": sum(1 for obj in bpy.data.objects if obj.type == "MESH"),
            "cameraObjects": sum(1 for obj in bpy.data.objects if obj.type == "CAMERA"),
        },
        "route": {
            "points": route,
            "lengthMetres": round(route_length(route), 4),
            "forcedTurnCount": forced_turn_count(route),
        },
        "clearanceProbes": clearances,
        "viewingClearance": viewing_clearance,
        "cameraWitnesses": visibility,
        "render": {
            "engine": common["neutralRenderEngine"],
            "desktopResolution": common["desktopResolution"],
            "mobileResolution": common["mobileResolution"],
            "mobileWitnesses": common["mobileWitnesses"],
            "lookdev": False,
        },
        "savedBlend": blend_path.name,
        "outputs": [],
    }
    manifest["outputs"] = collect_output_files(candidate_dir)
    write_json(candidate_dir / "manifest.json", manifest)
    return manifest


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("candidate generation must run in Blender background mode")

    layouts_path = Path(args.layouts).resolve()
    output_root = Path(args.output_dir).resolve()
    output_root.mkdir(parents=True, exist_ok=True)
    layouts = read_json(layouts_path)
    common = layouts["common"]
    candidates = layouts["candidates"]
    if [candidate["id"] for candidate in candidates] != ["H1", "H2", "H3"]:
        fail("candidate source must contain H1/H2/H3 in comparison order")

    manifests = [generate_candidate(candidate, common, output_root) for candidate in candidates]
    fingerprints = [manifest["layoutFingerprint"] for manifest in manifests]
    if len(set(fingerprints)) != 3:
        fail("H1/H2/H3 must be materially different layout sources")

    index = {
        "schemaVersion": 1,
        "laneId": "TLP-HALL-001",
        "phase": "metricGreybox",
        "runtime": {
            "versionTuple": list(bpy.app.version),
            "buildHash": bpy.app.build_hash.decode("utf-8", errors="replace") if isinstance(bpy.app.build_hash, bytes) else str(bpy.app.build_hash),
        },
        "comparisonLensMm": float(common["comparisonLensMm"]),
        "candidateOrder": [manifest["candidateId"] for manifest in manifests],
        "manifests": [f"{manifest['candidateId']}/manifest.json" for manifest in manifests],
        "routeLengthsMetres": {manifest["candidateId"]: manifest["route"]["lengthMetres"] for manifest in manifests},
        "forcedTurnCounts": {manifest["candidateId"]: manifest["route"]["forcedTurnCount"] for manifest in manifests},
        "approvedCandidate": None,
    }
    write_json(output_root / "index.json", index)
    print(f"Hall greybox candidates generated: {output_root}")


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path
from typing import Any

import bpy

EXPECTED_VERSION = (4, 5, 12)
LIBRARY_PATH = Path(__file__).resolve().with_name("generate-offline-exhibit.py")

spec = importlib.util.spec_from_file_location("hall_pushkin_offline_library", LIBRARY_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load exhibit generator library: {LIBRARY_PATH}")
lib = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lib)


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Generate packed Hall v3 Pushkin scene and fixed still evidence")
    parser.add_argument("--contract", required=True)
    parser.add_argument("--source-blend", required=True)
    parser.add_argument("--source-evidence", required=True)
    parser.add_argument("--source-assets-evidence", required=True)
    parser.add_argument("--portrait", required=True)
    parser.add_argument("--onegin-page", required=True)
    parser.add_argument("--output-dir", required=True)
    return parser.parse_args(args)


def make_materials(contract: dict[str, Any]) -> dict[str, bpy.types.Material]:
    palette = contract["artDirection"]["palette"]
    material_specs = contract["artDirection"]["materials"]
    return {
        "charcoal": lib.material_principled("MAT_PUSHKIN_CHARCOAL", palette["charcoal"], **material_specs["charcoalPlinth"]),
        "warmStone": lib.material_principled("MAT_PUSHKIN_WARM_STONE", palette["warmStone"], 0.0, 0.74),
        "linen": lib.material_principled("MAT_PUSHKIN_LINEN", palette["linen"], **material_specs["linenMat"]),
        "paperBacking": lib.material_principled("MAT_PUSHKIN_PAPER", palette["paper"], **material_specs["paperBacking"]),
        "brass": lib.material_principled("MAT_PUSHKIN_BRASS", palette["brass"], **material_specs["frameBrass"]),
        "label": lib.material_principled("MAT_PUSHKIN_LABEL", [0.82, 0.76, 0.64, 1.0], 0.0, 0.72),
        "labelDim": lib.material_principled("MAT_PUSHKIN_LABEL_DIM", [0.42, 0.39, 0.34, 1.0], 0.0, 0.80),
    }


def validate_source_authority(
    contract: dict[str, Any],
    source_evidence: dict[str, Any],
    source_assets: dict[str, Any],
    portrait_path: Path,
    onegin_page_path: Path,
) -> dict[str, Any]:
    if contract["source"]["topology"] != "H3" or source_evidence.get("source", {}).get("candidateId") != "H3":
        fail("Pushkin exhibit must derive from frozen H3 material bay")
    if source_evidence.get("source", {}).get("layoutFingerprint") != contract["source"]["layoutFingerprint"]:
        fail("Pushkin exhibit H3 layout fingerprint drifted")
    if source_evidence.get("source", {}).get("meshGeometryFingerprintBeforeSpike") != contract["source"]["meshGeometryFingerprint"]:
        fail("Pushkin exhibit H3 geometry fingerprint drifted")
    if source_assets.get("purpose") != "offline-source-evidence-only-not-production-media" or source_assets.get("productionManifestAllowed") is not False:
        fail("source assets evidence crossed the production boundary")

    source_hashes = {entry["assetId"]: entry["sha256"] for entry in source_assets.get("sources", [])}
    portrait_spec = contract["exhibit"]["heroPortrait"]
    onegin_spec = contract["exhibit"]["oneginTitlePage"]
    if source_hashes.get(portrait_spec["assetId"]) != portrait_spec["sourceHash"]:
        fail("Kiprensky source evidence hash drifted")
    if source_hashes.get(onegin_spec["assetId"]) != onegin_spec["sourceHash"]:
        fail("Onegin source evidence hash drifted")
    if lib.sha256_file(portrait_path) != portrait_spec["sourceHash"]:
        fail("portrait file hash does not match exhibit contract")

    derivative = next((item for item in source_assets.get("derivatives", []) if item.get("sourceAssetId") == onegin_spec["assetId"]), None)
    if derivative is None:
        fail("Onegin derivative evidence missing")
    if int(derivative.get("sourcePdfPageIndex", -1)) != int(onegin_spec["sourcePdfPageIndex"]):
        fail("Onegin derivative page index drifted")
    if lib.sha256_file(onegin_page_path) != derivative.get("sha256"):
        fail("Onegin rendered title-page bytes do not match derivative evidence")
    if derivative.get("productionEligible") is not False:
        fail("Onegin offline derivative may not claim production eligibility")
    return derivative


def create_clean_context_case(
    contract: dict[str, Any],
    materials: dict[str, bpy.types.Material],
    coll: bpy.types.Collection,
) -> list[bpy.types.Object]:
    case_spec = contract["exhibit"]["documentCases"][1]
    root = lib.create_empty("PUSHKIN_CONTEXT_CASE_ROOT", case_spec["center"], float(case_spec["rotationZ"]), coll)
    lib.set_object_evidence(root, "editorial-context")
    objects: list[bpy.types.Object] = []
    base = lib.create_local_box(
        "PUSHKIN_CONTEXT_PLINTH",
        root,
        (0.0, 0.0, -0.18),
        (0.90, 0.58, 0.68),
        materials["charcoal"],
        coll,
    )
    objects.append(base)
    cap = lib.create_local_box(
        "PUSHKIN_CONTEXT_CAP",
        root,
        (0.0, 0.0, 0.18),
        (0.96, 0.64, 0.055),
        materials["warmStone"],
        coll,
    )
    objects.append(cap)
    accent = lib.create_local_box(
        "PUSHKIN_CONTEXT_BRASS_RULE",
        root,
        (0.0, -0.302, 0.10),
        (0.60, 0.012, 0.012),
        materials["brass"],
        coll,
    )
    objects.append(accent)
    label = lib.create_text(
        "PUSHKIN_CONTEXT_LABEL",
        "ПУШКИН · 1799—1837",
        root,
        (0.0, -0.306, -0.015),
        0.044,
        materials["label"],
        coll,
    )
    objects.append(label)
    for obj in objects:
        lib.set_object_evidence(obj, "editorial-context")
        obj["documentaryAsset"] = False
    return objects


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

    contract = lib.read_json(contract_path)
    source_evidence = lib.read_json(source_evidence_path)
    source_assets = lib.read_json(source_assets_path)
    derivative = validate_source_authority(contract, source_evidence, source_assets, portrait_path, onegin_page_path)

    bpy.ops.wm.open_mainfile(filepath=str(source_blend), load_ui=False)
    scene = bpy.context.scene
    if scene.unit_settings.system != "METRIC" or scene.unit_settings.length_unit != "METERS" or abs(scene.unit_settings.scale_length - 1.0) > 1e-9:
        fail("source material bay lost metre-scale contract")
    scene.render.engine = contract["evidence"]["renderEngine"]
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.resolution_percentage = 100
    lib.configure_world(contract)
    scene.view_settings.exposure = float(contract["offlineLighting"].get("exposureStops", 0.0))

    exhibit_coll = lib.collection("COLL_PUSHKIN_OFFLINE_EXHIBIT")
    camera_coll = lib.collection("COLL_PUSHKIN_OFFLINE_CAMERAS")
    light_coll = lib.collection("COLL_PUSHKIN_OFFLINE_LIGHTS")

    for name in ["EXHIBIT_alexander-pushkin", "EXHIBIT_DOC_CASE_01", "EXHIBIT_DOC_CASE_02"]:
        obj = bpy.data.objects.get(name)
        if obj is None:
            fail(f"source material bay missing required H3 proxy {name}")
        obj.hide_render = True
        obj["constructionProxyPreserved"] = True
        obj["productionAsset"] = False

    materials = make_materials(contract)
    exhibit_objects: list[bpy.types.Object] = []
    exhibit_objects.extend(lib.create_hero(contract, portrait_path, materials, exhibit_coll))
    exhibit_objects.extend(lib.create_onegin_case(contract, onegin_page_path, source_assets, materials, exhibit_coll))
    exhibit_objects.extend(create_clean_context_case(contract, materials, exhibit_coll))

    offline_lights = [lib.create_light(light_spec, light_coll) for light_spec in contract["offlineLighting"]["lights"]]
    still_cameras = lib.make_camera_set(contract, camera_coll)
    r1 = still_cameras["01-r1-hero"]
    r1["approvedRig"] = "R1"
    r1["sourceTopology"] = "H3"
    r1["productionAsset"] = False
    _sequence_camera, _sequence_target, final_frame = lib.create_sequence_camera(contract, camera_coll)

    raw_glb = output_dir / "pushkin-offline-raw.glb"
    lib.export_glb(exhibit_objects, r1, raw_glb)

    bpy.ops.file.pack_all()
    blend_path = output_dir / "pushkin-offline-exhibit.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    if not blend_path.exists() or blend_path.stat().st_size == 0:
        fail("packed Pushkin exhibit blend was not created")

    still_evidence = lib.render_stills(contract, still_cameras, output_dir)
    mesh_objects = [obj for obj in exhibit_objects if obj.type == "MESH"]
    material_names = sorted({slot.material.name for obj in mesh_objects for slot in obj.material_slots if slot.material})
    sequence = contract["evidence"]["cameraSequence"]
    evidence = {
        "schemaVersion": 1,
        "laneId": "TLP-HALL-001",
        "productIssue": 369,
        "phase": "pushkinVerticalSlice",
        "status": "offline-stills-generated-sequence-pending-human-visual-approval",
        "runtime": {
            "version": bpy.app.version_string,
            "versionTuple": list(bpy.app.version),
            "background": bool(bpy.app.background),
            "renderEngine": contract["evidence"]["renderEngine"],
            "exposureStops": float(contract["offlineLighting"].get("exposureStops", 0.0)),
        },
        "source": {
            "topology": "H3",
            "layoutFingerprint": contract["source"]["layoutFingerprint"],
            "meshGeometryFingerprint": contract["source"]["meshGeometryFingerprint"],
            "approvedRig": "R1",
            "lightingBaseline": "L0-minimal-runtime",
            "portraitSourceHash": contract["exhibit"]["heroPortrait"]["sourceHash"],
            "oneginSourceHash": contract["exhibit"]["oneginTitlePage"]["sourceHash"],
            "oneginDerivativeHash": derivative["sha256"],
            "oneginSourcePdfPageIndex": derivative["sourcePdfPageIndex"],
        },
        "scene": {
            "unitSystem": scene.unit_settings.system,
            "lengthUnit": scene.unit_settings.length_unit,
            "scaleLength": float(scene.unit_settings.scale_length),
            "exhibitMeshObjects": len(mesh_objects),
            "exhibitTriangles": lib.triangle_count(mesh_objects),
            "materials": len(material_names),
            "materialNames": material_names,
            "offlineLights": len(offline_lights),
            "stillCameras": len(still_cameras),
        },
        "offlineLights": [light.name for light in offline_lights],
        "stills": still_evidence,
        "cameraSequence": {
            "status": "pending-sequence-render",
            "durationSeconds": int(sequence["durationSeconds"]),
            "fps": int(sequence["fps"]),
            "frameCount": final_frame + 1,
            "resolution": sequence["resolution"],
        },
        "files": {
            "blend": {"path": blend_path.name, "bytes": blend_path.stat().st_size, "sha256": lib.sha256_file(blend_path), "packedSourceImages": True},
            "rawGlb": {"path": raw_glb.name, "bytes": raw_glb.stat().st_size, "sha256": lib.sha256_file(raw_glb)},
        },
        "productionBoundary": {
            "productionAsset": False,
            "productionManifestAllowed": False,
            "documentaryProductionShippingAllowed": False,
            "productionWebglMayBegin": False,
            "offlineVisualApprovalPromoted": False,
            "humanOwnerVisualApprovalRequired": True,
        },
    }
    lib.write_json(output_dir / "offline-exhibit-evidence.json", evidence)
    print(
        f"Pushkin offline still evidence generated: {len(still_evidence)} stills, "
        f"packed scene, {evidence['scene']['exhibitTriangles']} exhibit triangles; sequence deferred to separate step."
    )


if __name__ == "__main__":
    main()

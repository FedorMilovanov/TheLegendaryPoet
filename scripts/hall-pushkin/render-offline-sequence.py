from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

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
    parser = argparse.ArgumentParser(description="Render the authored Pushkin walkthrough from a packed exhibit blend")
    parser.add_argument("--contract", required=True)
    parser.add_argument("--blend", required=True)
    parser.add_argument("--evidence", required=True)
    parser.add_argument("--output-dir", required=True)
    return parser.parse_args(args)


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("Pushkin sequence render must run in Blender background mode")

    contract_path = Path(args.contract).resolve()
    blend_path = Path(args.blend).resolve()
    evidence_path = Path(args.evidence).resolve()
    output_dir = Path(args.output_dir).resolve()
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))

    if evidence.get("status") != "offline-stills-generated-sequence-pending-human-visual-approval":
        fail("sequence renderer requires completed still evidence before video")
    if evidence.get("productionBoundary", {}).get("productionWebglMayBegin") is not False:
        fail("offline sequence evidence may not unlock production WebGL")
    if evidence.get("files", {}).get("blend", {}).get("sha256") != lib.sha256_file(blend_path):
        fail("packed blend hash does not match still evidence")

    bpy.ops.wm.open_mainfile(filepath=str(blend_path), load_ui=False)
    camera = bpy.data.objects.get("CAM_PUSHKIN_SEQUENCE")
    target = bpy.data.objects.get("CAM_PUSHKIN_SEQUENCE_TARGET")
    if camera is None or camera.type != "CAMERA" or target is None:
        fail("packed exhibit is missing authored sequence camera/target")

    sequence = contract["evidence"]["cameraSequence"]
    render_samples = int(sequence.get("renderSamples", 0))
    if render_samples != 8:
        fail(f"walkthrough evidence render must use exactly 8 samples, got {render_samples}")
    scene = bpy.context.scene
    if not hasattr(scene, "eevee") or not hasattr(scene.eevee, "taa_render_samples"):
        fail("Blender 4.5.12 runtime does not expose Eevee taa_render_samples")
    scene.eevee.taa_render_samples = render_samples
    if int(scene.eevee.taa_render_samples) != render_samples:
        fail("failed to bind exact walkthrough Eevee render sample count")

    final_frame = int(sequence["durationSeconds"] * sequence["fps"])
    rendered = lib.render_sequence(contract, camera, final_frame, output_dir)
    rendered["status"] = "rendered"
    rendered["renderSamples"] = render_samples

    evidence["status"] = "offline-exhibit-generated-awaiting-human-visual-approval"
    evidence["cameraSequence"] = rendered
    evidence_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Pushkin walkthrough rendered separately: {rendered['durationSeconds']}s, "
        f"{rendered['frameCount']} frames, {render_samples} samples, {rendered['bytes']} bytes."
    )


if __name__ == "__main__":
    main()

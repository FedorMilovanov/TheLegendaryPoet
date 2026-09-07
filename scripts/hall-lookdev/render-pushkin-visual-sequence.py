from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

import bpy

EXPECTED_VERSION = (4, 5, 12)
LIBRARY_PATH = Path(__file__).resolve().parents[1] / "hall-pushkin" / "generate-offline-exhibit.py"

spec = importlib.util.spec_from_file_location("hall_pushkin_offline_library", LIBRARY_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load exhibit generator library: {LIBRARY_PATH}")
lib = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lib)


def fail(message: str) -> None:
    raise RuntimeError(message)


def parse_args() -> argparse.Namespace:
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Render final bounded Pushkin lookdev candidate walkthrough")
    parser.add_argument("--contract", required=True)
    parser.add_argument("--canonical-contract", required=True)
    parser.add_argument("--blend", required=True)
    parser.add_argument("--evidence", required=True)
    parser.add_argument("--output-dir", required=True)
    return parser.parse_args(args)


def main() -> None:
    args = parse_args()
    if tuple(bpy.app.version) != EXPECTED_VERSION:
        fail(f"expected Blender {EXPECTED_VERSION}, got {tuple(bpy.app.version)}")
    if not bpy.app.background:
        fail("Pushkin visual-remediation sequence must run in Blender background mode")

    contract_path = Path(args.contract).resolve()
    canonical_path = Path(args.canonical_contract).resolve()
    blend_path = Path(args.blend).resolve()
    evidence_path = Path(args.evidence).resolve()
    output_dir = Path(args.output_dir).resolve()
    contract = json.loads(contract_path.read_text(encoding="utf-8"))
    canonical = json.loads(canonical_path.read_text(encoding="utf-8"))
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))

    if contract.get("issue") != 440 or contract.get("scope", {}).get("candidateOnly") is not True:
        fail("walkthrough renderer is bounded to candidate-only issue #440")
    if contract.get("evidence", {}).get("walkthroughRequiredForFinalDisposition") is not True:
        fail("candidate contract no longer requires final walkthrough evidence")
    if contract.get("evidence", {}).get("walkthroughMayBeDeferredDuringLookdevIterations") is not False:
        fail("final candidate contract still allows walkthrough deferral")
    if evidence.get("issue") != 440 or evidence.get("status") != "lookdev-candidate-generated-awaiting-human-disposition":
        fail("walkthrough requires completed exact-head candidate still evidence")
    boundary = evidence.get("productionBoundary", {})
    if boundary.get("productionAsset") is not False or boundary.get("productionWebglMayBegin") is not False or boundary.get("offlineVisualApprovalPromoted") is not False:
        fail("candidate walkthrough may not cross production or visual-approval boundary")
    if evidence.get("files", {}).get("blend", {}).get("sha256") != lib.sha256_file(blend_path):
        fail("candidate packed blend hash does not match still evidence")

    bpy.ops.wm.open_mainfile(filepath=str(blend_path), load_ui=False)
    camera = bpy.data.objects.get("CAM_PUSHKIN_SEQUENCE")
    target = bpy.data.objects.get("CAM_PUSHKIN_SEQUENCE_TARGET")
    if camera is None or camera.type != "CAMERA" or target is None:
        fail("candidate packed scene lost canonical sequence camera/target")

    sequence = canonical["evidence"]["cameraSequence"]
    duration = int(sequence.get("durationSeconds", 0))
    fps = int(sequence.get("fps", 0))
    render_samples = int(sequence.get("renderSamples", 0))
    if duration != 24 or fps <= 0 or render_samples != 8:
        fail(f"canonical walkthrough contract drifted: duration={duration} fps={fps} samples={render_samples}")

    scene = bpy.context.scene
    if not hasattr(scene, "eevee") or not hasattr(scene.eevee, "taa_render_samples"):
        fail("Blender 4.5.12 runtime does not expose Eevee taa_render_samples")
    scene.eevee.taa_render_samples = render_samples
    if int(scene.eevee.taa_render_samples) != render_samples:
        fail("failed to bind exact candidate walkthrough render sample count")

    final_frame = duration * fps
    rendered = lib.render_sequence(canonical, camera, final_frame, output_dir)
    rendered["status"] = "rendered"
    rendered["renderSamples"] = render_samples
    rendered["requiredForFinalDisposition"] = True

    evidence["walkthrough"] = rendered
    evidence["files"] = {
        **evidence.get("files", {}),
        "walkthrough": {
            "path": rendered["path"],
            "bytes": rendered["bytes"],
            "sha256": rendered["sha256"],
        },
    }
    evidence_path.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Pushkin candidate walkthrough rendered: {rendered['durationSeconds']}s, "
        f"{rendered['frameCount']} frames, {render_samples} samples, {rendered['bytes']} bytes."
    )


if __name__ == "__main__":
    main()

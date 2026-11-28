"""Optional regression suite: python scripts/tests/test_suno_master_lock.py (Pillow)."""
import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
from PIL import Image, PngImagePlugin

SCRIPT = Path(__file__).resolve().parents[1] / 'suno-master-lock.py'
spec = importlib.util.spec_from_file_location('master_lock', SCRIPT)
lock = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lock)


class MasterLockTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.base = Image.new('RGBA', (3, 3), (10, 20, 30, 255))
        self.candidate = Image.new('RGBA', (3, 3), (70, 80, 90, 255))
        self.mask = Image.new('L', (3, 3))
        self.mask.putpixel((1, 1), 128)
        self.mask.save(self.root / 'mask.png')

    def save_inputs(self, base_info=None, candidate_info=None):
        self.base.save(self.root / 'base.png', pnginfo=base_info)
        self.candidate.save(self.root / 'candidate.png', pnginfo=candidate_info)

    def run_cli(self, operation, output=None):
        args = [sys.executable, str(SCRIPT), operation, str(self.root / 'base.png'),
                str(self.root / 'candidate.png'), str(self.root / 'mask.png')]
        if output:
            args.append(str(self.root / output))
        proc = subprocess.run(args, capture_output=True, text=True, timeout=10)
        return proc.returncode, json.loads(proc.stdout)

    def test_composite_and_no_overwrite(self):
        self.save_inputs()
        code, result = self.run_cli('composite', 'final.png')
        self.assertEqual(code, 0)
        self.assertEqual(result['outside'], 0)
        self.assertEqual(result['changed'], 1)
        original = (self.root / 'base.png').read_bytes()
        self.assertEqual(self.run_cli('composite', 'base.png')[0], 1)
        self.assertEqual((self.root / 'base.png').read_bytes(), original)

    def test_protected_alpha_change_fails(self):
        candidate = self.base.copy()
        candidate.putpixel((0, 0), (10, 20, 30, 254))
        result = lock.verify(self.base, candidate, self.mask)
        self.assertEqual(result['outside'], 1)
        self.assertFalse(result['valid'])
        candidate = self.base.copy()
        candidate.putpixel((0, 0), (11, 20, 30, 255))
        result = lock.verify(self.base, candidate, self.mask)
        self.assertEqual(result['outside'], 1)
        self.assertFalse(result['valid'])

    def test_invalid_masks_and_sizes(self):
        for mask in (Image.new('L', (3, 3)), Image.new('L', (3, 3), 255), Image.new('L', (2, 2))):
            with self.assertRaises(ValueError):
                lock.verify(self.base, self.candidate, mask)

    def test_different_gamma_rejected_before_output(self):
        a, b = PngImagePlugin.PngInfo(), PngImagePlugin.PngInfo()
        a.add(b'gAMA', struct.pack('>I', 45455))
        b.add(b'gAMA', struct.pack('>I', 100000))
        self.save_inputs(a, b)
        code, result = self.run_cli('composite', 'final.png')
        self.assertEqual(code, 1)
        self.assertIn('gamma', result['reason'])
        self.assertFalse((self.root / 'final.png').exists())

    def test_color_chunks_round_trip(self):
        meta = PngImagePlugin.PngInfo()
        meta.add(b'gAMA', struct.pack('>I', 45455))
        meta.add(b'sRGB', b'\x00')
        meta.add(b'cHRM', struct.pack('>8I', 31270, 32900, 64000, 33000, 30000, 60000, 15000, 6000))
        self.save_inputs(meta, meta)
        self.assertEqual(self.run_cli('composite', 'final.png')[0], 0)
        original, final = (lock.load(self.root / name) for name in ('base.png', 'final.png'))
        for key in ('gamma', 'srgb', 'chromaticity'):
            self.assertEqual(original.info[key], final.info[key])

    def test_nonopaque_candidate_on_rgb_base_rejected(self):
        self.base = self.base.convert('RGB')
        self.candidate.putpixel((1, 1), (70, 80, 90, 100))
        self.save_inputs()
        self.assertEqual(self.run_cli('composite', 'final.png')[0], 1)
        self.assertFalse((self.root / 'final.png').exists())


if __name__ == '__main__':
    unittest.main()

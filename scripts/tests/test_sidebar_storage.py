# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

from pathlib import Path
import subprocess
import unittest


class SidebarStorageTests(unittest.TestCase):
    def test_repeated_generation_preserves_sidebar_asset(self):
        root = Path(__file__).resolve().parents[2]
        asset = root / "book/toc.js"
        before = asset.read_bytes()
        result = subprocess.run(
            ["python3", str(root / "scripts/build-discovery.py"), str(root)],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(asset.read_bytes(), before)

    def test_generated_sidebar_handles_available_and_denied_storage(self):
        root = Path(__file__).resolve().parents[2]
        runner = Path(__file__).with_name("sidebar-storage.cjs")
        for mode in ("available", "getter-denied", "methods-denied", "write-denied"):
            with self.subTest(mode=mode):
                result = subprocess.run(
                    ["node", str(runner), str(root / "book/toc.js"), mode],
                    capture_output=True, text=True,
                )
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()

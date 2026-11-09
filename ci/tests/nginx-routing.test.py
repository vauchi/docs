# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

import http.client
from pathlib import Path
import socket
import subprocess
import tempfile
import unittest


class DocsRoutingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.directory = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.directory.cleanup)
        root = Path(cls.directory.name)
        public = root / "public"
        (public / "css").mkdir(parents=True)
        (public / "users").mkdir()
        (public / "index.html").write_text(
            '<link rel="stylesheet" href="css/general.css">'
            '<script src="book.js"></script>'
        )
        (public / "css/general.css").write_text("body { color: purple; }")
        (public / "book.js").write_text("window.docsLoaded = true;")
        (public / "users/getting-started.html").write_text("Getting started")
        (public / "build-info.json").write_text('{"sha":"routing-test"}')
        (public / "404.html").write_text("Page not found")
        (root / "private.txt").write_text("outside-public-root-sentinel")
        sources = Path(__file__).resolve().parents[2] / "src"
        cls.chapters = sorted(
            path.relative_to(sources).with_suffix(".html")
            for path in sources.rglob("*.md") if path.name != "SUMMARY.md"
        )
        for chapter in cls.chapters:
            destination = public / chapter
            destination.parent.mkdir(parents=True, exist_ok=True)
            if not destination.exists():
                destination.write_text("Chapter: " + chapter.as_posix())
        root.chmod(0o755)
        for path in public.rglob("*"):
            path.chmod(0o755 if path.is_dir() else 0o644)
        public.chmod(0o755)
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            cls.port = listener.getsockname()[1]

        source = Path(__file__).resolve().parents[2] / "nginx.conf"
        server = source.read_text().replace(
            "listen 80 default_server;",
            f"listen 127.0.0.1:{cls.port} default_server;",
        ).replace("/usr/share/nginx/html", str(public))
        config = root / "nginx.conf"
        temp_paths = "".join(
            f"{name}_temp_path {root}/{name};\n"
            for name in ("client_body", "proxy", "fastcgi", "uwsgi", "scgi")
        )
        config.write_text(
            f"daemon off; pid {root}/nginx.pid; error_log stderr notice;\n"
            "events {}\nhttp { access_log off; "
            + temp_paths + "types { text/css css; application/javascript js; "
            "application/json json; }\n" + server + "\n}\n"
        )
        cls.nginx = subprocess.Popen(
            [
                "nginx", "-e", "stderr",
                "-p", str(root), "-c", str(config),
            ],
            stderr=subprocess.PIPE,
            text=True,
        )
        cls.addClassCleanup(cls.stop_nginx)
        messages = []
        for line in cls.nginx.stderr:
            messages.append(line)
            if "start worker process " in line:
                break
        else:
            raise RuntimeError("nginx did not start: " + "".join(messages))

    @classmethod
    def stop_nginx(cls):
        cls.nginx.terminate()
        cls.nginx.wait(timeout=5)
        cls.nginx.stderr.close()

    def request(self, path, method="GET"):
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        try:
            connection.request(method, path)
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()

    def test_docs_redirects_to_trailing_slash(self):
        status, headers, _ = self.request("/docs")
        self.assertEqual(status, 301)
        self.assertEqual(headers["Location"], "/docs/")

    def test_docs_redirect_preserves_query(self):
        status, headers, _ = self.request("/docs?search=contact%20card&theme=coal")
        self.assertEqual(status, 301)
        self.assertEqual(
            headers["Location"], "/docs/?search=contact%20card&theme=coal"
        )

    def test_docs_head_redirects(self):
        status, headers, body = self.request("/docs", "HEAD")
        self.assertEqual(status, 301)
        self.assertEqual(headers["Location"], "/docs/")
        self.assertEqual(body, b"")

    def test_docs_slash_serves_index_without_redirect(self):
        status, headers, body = self.request("/docs/")
        self.assertEqual(status, 200)
        self.assertNotIn("Location", headers)
        self.assertEqual(
            body, b'<link rel="stylesheet" href="css/general.css">'
            b'<script src="book.js"></script>'
        )

    def test_docs_assets_load_with_correct_content_types(self):
        for path, content_type, content in [
            ("/docs/css/general.css", "text/css", b"body { color: purple; }"),
            ("/docs/book.js", "application/javascript", b"window.docsLoaded = true;"),
        ]:
            with self.subTest(path=path):
                status, headers, body = self.request(path)
                self.assertEqual(status, 200)
                self.assertEqual(headers["Content-Type"], content_type)
                self.assertEqual(body, content)

    def test_nested_docs_page_loads(self):
        status, _, body = self.request("/docs/users/getting-started.html")
        self.assertEqual(status, 200)
        self.assertEqual(body, b"Getting started")

    def test_missing_docs_page_returns_404(self):
        status, _, body = self.request("/docs/missing-page")
        self.assertEqual(status, 404)
        self.assertEqual(body, b"Page not found")

    def test_health_check_reads_build_provenance(self):
        status, _, body = self.request("/health")
        self.assertEqual(status, 200)
        self.assertEqual(body, b'{"sha":"routing-test"}')

    def test_prefix_stripped_requests_work_during_rollout(self):
        status, _, body = self.request("/css/general.css")
        self.assertEqual(status, 200)
        self.assertEqual(body, b"body { color: purple; }")

    def test_existing_leaf_aliases_redirect_to_the_same_canonical_chapter(self):
        for chapter in self.chapters:
            if chapter.name == "index.html":
                continue
            slug = chapter.with_suffix("").as_posix()
            for prefix in ("/", "/docs/"):
                for suffix in ("", "/"):
                    with self.subTest(chapter=str(chapter), prefix=prefix, suffix=suffix):
                        status, headers, _ = self.request(prefix + slug + suffix + "?q=one%20two")
                        self.assertEqual(status, 301)
                        expected = "https://vauchi.app/docs/" + chapter.as_posix()
                        self.assertEqual(headers["Location"], expected + "?q=one%20two")
                        final, _, _ = self.request("/docs/" + chapter.as_posix())
                        self.assertEqual(final, 200)

    def test_index_aliases_and_directory_slashes_use_the_mounted_canonical(self):
        for chapter in self.chapters:
            if chapter.name != "index.html":
                continue
            section = chapter.parent.as_posix()
            section = "" if section == "." else section + "/"
            for prefix in ("/", "/docs/"):
                aliases = [prefix + chapter.as_posix()]
                if section:
                    aliases.append(prefix + section.rstrip("/"))
                for alias in aliases:
                    with self.subTest(alias=alias):
                        status, headers, _ = self.request(alias + "?search=one%20two")
                        self.assertEqual(status, 301)
                        self.assertEqual(headers["Location"], "https://vauchi.app/docs/" + section + "?search=one%20two")

    def test_head_alias_redirect_preserves_query_without_a_body(self):
        status, headers, body = self.request("/docs/users/getting-started/?theme=coal", "HEAD")
        self.assertEqual(status, 301)
        self.assertEqual(headers["Location"], "https://vauchi.app/docs/users/getting-started.html?theme=coal")
        self.assertEqual(body, b"")

    def test_unknown_chapters_and_removed_release_guide_stay_missing(self):
        for path in ("/docs/missing/", "/docs/developers/verify-releases/", "/docs/not-a-directory/index.html"):
            with self.subTest(path=path):
                status, headers, body = self.request(path)
                self.assertEqual(status, 404)
                self.assertNotIn("Location", headers)
                self.assertEqual(body, b"Page not found")

    def test_malformed_aliases_do_not_escape_root_or_inject_headers(self):
        for path in (
            "/docs/users/x%0d%0aSet-Cookie:injected=yes/",
            "/docs/%2e%2e/%2e%2e/private.txt",
            "/docs/users/%2f%2e%2e/%2e%2e/private.txt",
            "/docs/" + "x" * 9000,
        ):
            with self.subTest(path=path[:80]):
                status, headers, body = self.request(path)
                self.assertIn(status, (400, 404, 414))
                self.assertNotIn("Location", headers)
                self.assertNotIn("Set-Cookie", headers)
                self.assertNotIn(b"outside-public-root-sentinel", body)


if __name__ == "__main__":
    unittest.main()

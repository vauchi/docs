# SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me>
# SPDX-License-Identifier: GPL-3.0-or-later

[no-cd]
test-routing:
    python3 "{{justfile_directory()}}/ci/tests/nginx-routing.test.py"

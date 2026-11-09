<!-- SPDX-FileCopyrightText: 2026 Mattia Egloff <mattia.egloff@pm.me> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

> **Mirror:** This repo is a read-only mirror of [gitlab.com/vauchi/docs](https://gitlab.com/vauchi/docs). Please open issues and merge requests there.

# Vauchi Docs

The source of the Vauchi user and developer documentation, published at
[vauchi.app/docs](https://vauchi.app/docs/). It is an
[mdBook](https://rust-lang.github.io/mdBook/); the pages are in `src/`.

The protocol specification lives in
[vauchi/spec](https://gitlab.com/vauchi/spec), the code in
[vauchi/core](https://gitlab.com/vauchi/core).

## Build

Needs `mdbook` 0.4 (CI pins 0.4.44; 0.5 breaks the build),
`mdbook-admonish`, `python3` and `node`, for the preprocessors in
`book.toml`:

```sh
npm ci
mdbook serve
```

## License

GPL-3.0-or-later; see `LICENSE` and `REUSE.toml`.

# Scott Murray's portfolio

A portfolio built with Rust, Dioxus 0.6, WebAssembly, and Trunk.
VS Code Dev Containers for herdr, the Minikube Terraform provider, and the Teams
emoji uploader share equal project rows. A separate section links to upstream
contributions under broad project names, without individual fix descriptions or language labels.

## Run locally

```sh
rustup target add wasm32-unknown-unknown
cargo install trunk --version 0.21.14 --locked
trunk serve
```

Open <http://localhost:8080>. If your shell sets `NO_COLOR=1`, use
`NO_COLOR=true trunk serve` because Trunk expects a boolean value.

## Checks

```sh
cargo fmt --check
cargo test --locked
cargo clippy --locked --target wasm32-unknown-unknown -- -D warnings
NO_COLOR=true trunk build --release --locked
```

`tests/browser-smoke.cjs` checks selected projects, general contribution links,
removed content, keyboard navigation, direct anchor links, focus, reduced motion,
mobile sizes, and zoom reflow.
Run it against a server with Playwright available:

```sh
BASE_URL=http://localhost:8080 node tests/browser-smoke.cjs
```

Set `CHROME_PATH` to use an installed Chrome executable. Set `SCREENSHOT_DIR` to
an existing folder to save desktop and mobile screenshots. The old desktop app
modules and assets remain in the repository but are no longer loaded. The legacy
cloud test is not part of the rebuilt site's CI checks.

## Content and evidence

`src/portfolio.rs` contains the site. `portfolio.css` contains the
responsive layout. `public/verification.txt` records sources and completed checks.
Profile facts and project descriptions came from public GitHub data. Personal copy
was reviewed and supplied by Scott. No résumé file was available,
so the site links to LinkedIn instead. Contribution evidence came from the original
upstream pull requests, checked on 11 October 2026. The site links to repositories.

Fonts load from Google Fonts, with local sans-serif fallbacks. No analytics or
backend services are required. GitHub data is compiled into the page, not fetched
from the browser.

## Deploy

The existing workflow tests the release build and publishes the static nginx
container to GHCR. Docker and Raspberry Pi hosting remain supported:

```sh
docker run -d --name scott-portfolio --restart unless-stopped \
  -p 8080:80 ghcr.io/scott-the-programmer/smkiwi/smkiwi:latest
```

[MIT License](LICENSE)

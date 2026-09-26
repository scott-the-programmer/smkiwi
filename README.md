# Scott OS

Scott Murray's personal website as a **tiling window manager**, built with Rust + Dioxus and compiled to WebAssembly. Static files, no backend, no real system access.

## Run

```sh
rustup target add wasm32-unknown-unknown
cargo install trunk --version 0.21.14 --locked
trunk serve
```

Open **http://localhost:8080**. Node and the Dioxus CLI are not required.

## Workspace

Three apps open by default:

- **About Me** — the original site's Cloud Whisperer bio, Auckland location, skills, career history, projects, and social links. Career history is explicitly identified as carried over from the previous site, not newly verified employment information.
- **Fractal Clock** — inspired by the [egui sample](https://www.egui.rs/#clock), with second/minute branches rotated relative to the hour hand, fading into a dense animated fractal. Open Settings to pause, set depth (0–10), zoom, change branch length, or reset. Each generation uses a single SVG path. Attribution is linked at the bottom of the app.
- **Terminal** — a sandboxed shell with profile commands, command history, tab completion, and a small read-only virtual filesystem (`ls`, `cd`, `pwd`, and `cat`). It never executes system commands.

Open **Cloud Invoice Simulator** from Applications; restore existing windows from the taskbar. Power six toy servers on/off, adjust traffic, or go viral for 30 simulated seconds. An animated request conveyor shows traffic moving through a Rust/WASM FIFO queue while an itemised receipt bills fictional compute and request charges. One simulated second runs every 250 ms; requests time out after 10 simulated seconds. Pause or reset from the app. Hidden panes pause automatically; closing resets the simulation. Prices are fictional USD, with no real cloud resources or charges.

Windows automatically tile into a large master pane and stacked secondary panes. There is no layout selector or tile counter. Larger stacks scroll rather than squeezing panes out of reach. Each title bar offers:

- **Make master** (⇤): move this pane to the first position.
- **Minimize** (−): hide the pane and retile the others; its state is preserved.
- **Zoom or restore** (□): temporarily fill the workspace with one pane.
- **Close** (×): remove the pane; temporary state resets when reopened.

Each launch from Applications creates a **new independent instance**, including for apps that are already open. Taskbar buttons restore existing windows without duplicating them. Instance numbers identify matching title bars and taskbar buttons. Minimizing, zooming, promoting, or closing one instance never changes another instance's app state. Escape dismisses the menu and exits zoom. On mobile, panes become a vertically scrolling stack. App state resets on reload. The moon button toggles the workspace background theme. Field Notes, Pixel Studio, and Little Life have been removed. Previously saved notes are left untouched in browser storage, but the site no longer reads or writes them.

## Checks and production build

```sh
cargo fmt --check
cargo test --locked
cargo clippy --locked --target wasm32-unknown-unknown -- -D warnings
trunk build --release --locked
```

Optional browser integration tests (with `trunk serve` running separately):

```sh
npm install --prefix /tmp/scott-browser-check playwright
/tmp/scott-browser-check/node_modules/.bin/playwright install chromium
NODE_PATH=/tmp/scott-browser-check/node_modules node tests/browser-smoke.cjs
NODE_PATH=/tmp/scott-browser-check/node_modules node tests/cloud-smoke.cjs
```

Set `BASE_URL` to test another server, or `CHROME_PATH` to use an installed Chrome executable. Node is only needed for this optional test.

Deploy `dist/` to a static host, or package it in the nginx container:

```sh
trunk build --release --locked
docker build -t scott-os:local .
docker run --rm -p 8080:80 scott-os:local
```

The Dockerfile expects an existing `dist/`. Optional Google Fonts have system fallbacks.

## CI and container registry

Pull requests and pushes to `main` run formatting checks, Rust tests, Clippy, and a release WASM build. Both browser suites run against the production nginx container. Only successful `main` builds publish to GitHub Container Registry, using the same tested artifact for all architectures:

- `ghcr.io/scott-the-programmer/smkiwi/smkiwi:latest`
- `ghcr.io/scott-the-programmer/smkiwi/smkiwi:sha-<full-commit-sha>`

Images support `linux/amd64`, `linux/arm64`, and `linux/arm/v7`. GitHub Actions authenticates with its built-in `GITHUB_TOKEN`; no registry password secret is required. Dependabot checks Cargo, Docker, and GitHub Actions weekly.

Raspberry Pi deployment will be configured separately. The eventual pull/run commands are:

```sh
docker pull ghcr.io/scott-the-programmer/smkiwi/smkiwi:latest
docker run -d --name scott-os --restart unless-stopped \
  -p 8080:80 ghcr.io/scott-the-programmer/smkiwi/smkiwi:latest
```

Use the commit tag or image digest to pin a deployment or roll back. Private GHCR packages require login with a token that has `read:packages`; public packages allow anonymous pulls. The container serves `/healthz` and includes a health check. Publishing an image does not deploy it to the Pi.

## Source

- `src/main.rs` — workspace, tiling, launcher, window chrome
- `src/model.rs` — window state and unit tests
- `src/about.rs` — personal content recovered from the original React website
- `src/clock.rs` — animated SVG fractal clock and geometry tests
- `src/cloud.rs` — cloud traffic simulation, fictional billing, and invariant tests
- `src/toys.rs` — sandboxed terminal
- `desktop.css` — responsive workspace styles
- `tests/browser-smoke.cjs` — app and tiling integration checks

The legacy React site, generated API client, and unused image assets have been removed. Git history retains the previous website. Old `/blog` and `/dog` routes are not implemented.

[MIT License](LICENSE)

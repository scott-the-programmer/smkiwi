# Scott OS

My personal website, built as a tiling window manager. I vibe coded it with Fable and Astra. It is Rust with [Dioxus](https://dioxuslabs.com), compiled to WebAssembly and served as static files. There is no backend and no real system access.

![Scott OS workspace: About Me, Fractal Clock, and Terminal tiled side by side](docs/screenshot.png)

## Run it locally

```sh
rustup target add wasm32-unknown-unknown
cargo install trunk --version 0.21.14 --locked
trunk serve
```

Open <http://localhost:8080>.

## Apps

Three windows open by default. The rest launch from the Applications menu or the command palette (⌘K or Ctrl+K).

| App | What it does |
| --- | --- |
| About Me | Bio, skills, career history, projects, and social links. |
| Fractal Clock | Animated SVG clock inspired by the [egui sample](https://www.egui.rs/#clock). |
| Terminal | Sandboxed shell with a small read-only virtual filesystem. Never runs real commands. |
| Cloud Invoice Simulator | Toy servers, a traffic slider, and a "go viral" button, with a fictional itemised bill. |
| Forward-Backward Lab | Hidden Markov model visualizer using the classic hidden-weather example. |

## Window manager

Windows tile into one master pane and a stacked column of secondary panes. Each title bar can make a pane master, minimize, zoom, or close it. Every launch opens a new instance, and the dock restores existing windows. The moon button toggles night mode. On mobile, panes stack vertically. App state resets on reload.

## Checks

```sh
cargo fmt --check
cargo test --locked
cargo clippy --locked --target wasm32-unknown-unknown -- -D warnings
trunk build --release --locked
```

Optional Playwright smoke tests live in `tests/` and need `trunk serve` running.

## Deploy

CI builds and tests every push, then publishes `main` to GHCR for `linux/amd64`, `linux/arm64`, and `linux/arm/v7`. I run it on a Raspberry Pi:

```sh
docker run -d --name scott-os --restart unless-stopped \
  -p 8080:80 ghcr.io/scott-the-programmer/smkiwi/smkiwi:latest
```

[MIT License](LICENSE)

# Redesign verification

Verified on scott@192.168.1.70 against the production Nginx image, October 6, 2026. Baseline: d97d7f91aeb6f2105497067b101a4345fb30adff. No push or production rollout performed by this implementation task.

## Automated checks

- npm ci: reproducible install, audit reported zero vulnerabilities.
- npm test: 13 controller/adapter tests passed, including insecure context, unavailable runtime, upstream model ID, native history/deltas, abort/reset races and runtime failures.
- cargo fmt --check: passed.
- cargo test --locked: 7 retained clock/terminal unit tests passed.
- cargo clippy --locked --target wasm32-unknown-unknown -- -D warnings: passed.
- trunk 0.21.14 build --release --locked: passed; bundled WebLLM and module worker included in dist.
- Docker build and /healthz: passed.
- tests/browser-smoke.cjs: real Chromium UI passed, including retained bio/social link, terminal XSS/history/filesystem, live fractal clock controls, no automatic model downloads, unique IDs, and responsive workspace/tool layouts down to 320px.
- tests/runtime-smoke.cjs: explicitly labelled Chrome API fixtures passed for download progress, disabled/loading controls, streaming, system instruction, XSS, stop/reconnect, completed-only history, reset during load, load/inference errors, unsupported runtime and insecure origin.

## Actual local inference — no API fixtures

Command: CHROME_PATH=/usr/bin/chromium BASE_URL=http://localhost:8090 WEBGPU_TEST_FLAGS=1 node tests/real-inference.cjs

- Chromium 152.0.7977.82; NVIDIA Ampere (RTX 3060 Ti) selected through test-only Vulkan flags. Default headless Chromium had no WebGPU adapter. The native Chrome API returned unavailable on this installation, so its real-model path could not be exercised here.
- The real dedicated worker downloaded and initialized Qwen2.5-0.5B-Instruct-q4f32_1-MLC from upstream model files. This GPU did not advertise shader-f16, which is why the supported f32 compute variant was selected.
- Prompt: Name the capital city of France. Reply with one short sentence.
- Latest actual response: Paris is the capital city of France.
- Latest follow-up: Paris. Instrumentation verified the prior user/assistant history reached the real worker unchanged. Earlier runs returned Berlin and Buenos Aires for this follow-up despite correct context; that is a small-model quality limitation, not hidden or replaced by a fixture.
- Actual generation cancellation stopped partial output; completed history stayed intact. New session terminated the worker and successfully reinitialized the cached model.
- Observed requests used GET only; no POST/inference-server traffic. No page errors.

The optional hardware test is intentionally separate from CI, and its result does not promise compatibility on every visitor's browser/GPU. Plain-text rendering and no tool integration prevent generated text from executing actions.

## Artifacts

- docs/screenshot.png: screenshot of real local inference, committed with this change.
- test-results/harness-desktop.png and harness-mobile.png: actual UI screenshots.
- test-results/harness-real-inference.png: full-resolution inference screenshot.
- test-results/inference-report.json: actual model output, worker context, network hosts/methods and lifecycle results.

The test-results directory is ignored by Git. Copies are provided separately to the parent reviewer.

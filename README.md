# Scott OS — local AI harness

Scott Murray's personal website, now a dark developer workspace for browser-local language models. Rust + Dioxus renders the shell and secondary tools; a bundled JavaScript controller manages model lifecycle and streaming. The site is static. There is no inference server, API key, tool execution, or mock production fallback.

![Local AI workspace running Qwen on the browser GPU](docs/screenshot.png)

## Use the workspace

1. Open the site over **HTTPS** or on **localhost**. Plain HTTP on a LAN IP is not a secure context.
2. Choose an engine. Availability is capability-detected, not inferred from browser version:
   - **Chrome built-in AI** uses LanguageModel.availability(), create() and promptStreaming(). Chrome manages Gemini Nano and may require a multi-GB download, hardware/storage prerequisites, and browser permission. Only text/English is requested. Chromium exposing the API does not mean it can load the model.
   - **WebLLM / WebGPU** uses a dedicated module worker and the upstream Qwen2.5-0.5B-Instruct-q4f32_1-MLC model. The f32 compute variant avoids requiring shader-f16 while retaining 4-bit weights. Allow roughly 400 MB of downloads and at least 1.1 GB of GPU memory plus overhead. A WebGPU-enabled browser with compatible drivers/hardware is required. Model context is 4,096 tokens; output is bounded to 512 tokens per turn.
3. Read the download notice, explicitly consent, then **Load local model**. No model weights or WebLLM runtime code are requested before loading. Failed/unavailable runtimes show an error; there is no silent switch to cloud inference.
4. Set a system instruction before loading, submit a prompt, and watch text stream. Ctrl/⌘+Enter runs the prompt; Enter alone inserts a newline.
5. **Stop** aborts the request and destroys the session/worker. Completed turns remain; partial turns are labelled incomplete and never replayed. Reconnect to continue. **New session** unloads the runtime and clears all chat, then requires consent/load again; model files may remain cached by the browser.

Chats live in page memory only and disappear on reload. Model downloads contact Google for Chrome or Hugging Face/GitHub for WebLLM. Prompts are not sent to an inference server. The UI has no analytics; Google Fonts supplies typography. Generated text is rendered as plain text, not executable HTML or Markdown. Small local models can hallucinate. Limits: 8,000 characters per user prompt, 4,000 characters in the UI's system instruction, 12 completed turns, 64,000 characters per response. Model context may fill earlier; errors ask you to reconnect or start a new session.

The secondary tools retain Scott's bio/social links, the animated Fractal Clock, and a sandboxed terminal with a read-only virtual filesystem. These tools are separate from the LLM. The old invoice simulator, forward/backward lab, wallpaper, and tiling-window manager have been removed.

## Run locally

    rustup target add wasm32-unknown-unknown
    cargo install trunk --version 0.21.14 --locked
    npm ci
    trunk serve

Open <http://localhost:8090>. The Trunk pre-build hook bundles the pinned WebLLM dependency with esbuild. The generated public/runtime/ directory is ignored by Git, copied to dist, and served from /public/runtime/. The site expects to be served at the domain root. Model weights are downloaded on demand, not packaged in the image.

## Checks

    npm ci
    npm test
    cargo fmt --check
    cargo test --locked
    cargo clippy --locked --target wasm32-unknown-unknown -- -D warnings
    trunk build --release --locked
    npx playwright install chromium

Test the same production Nginx container CI uses (choose an unused port):

    docker build -t smkiwi-harness:test .
    docker run -d --name smkiwi-harness-test -p 127.0.0.1:8090:80 smkiwi-harness:test
    BASE_URL=http://localhost:8090 npm run test:browser
    docker rm -f smkiwi-harness-test

Set CHROME_PATH=/usr/bin/chromium to use an installed browser. tests/browser-smoke.cjs checks the real UI, secondary tools, responsive layouts, safe text rendering, and absence of automatic model downloads. tests/runtime-smoke.cjs uses **explicitly labelled native API fixtures** for progress, streaming, cancellation/reset races, errors and unsupported/insecure origins. Those fixture results are not proof of inference. Node tests cover the controller/adapters and verify the selected model exists in the pinned upstream catalog.

An opt-in **real-model** test downloads the actual model and exercises worker loading, GPU inference, follow-up context transport, stop and reset:

    CHROME_PATH=/usr/bin/chromium BASE_URL=http://localhost:8090 node tests/real-inference.cjs

On the Linux development host, headless Chromium required WEBGPU_TEST_FLAGS=1 to select its NVIDIA Vulkan GPU. These are test-only flags, not a recommendation to change normal browser security settings. The real test has no API fixtures: instrumentation observes actual worker prompts but forwards them unchanged. It checks there are no POST requests. It is excluded from CI because public runners generally lack compatible GPUs and should not download weights on every build. Screenshots and the actual inference report are written to test-results/. The follow-up test verifies full context reached the worker, not factual accuracy: this small model can fail to recall a previous answer.

## Deployment

The existing CI/deployment structure is retained: checks and production-container smoke tests, artifact upload, then GHCR multi-architecture publishing from main. Images remain ghcr.io/scott-the-programmer/smkiwi/smkiwi:latest and :sha-<commit>. The existing Raspberry Pi deployment serves the same static image; only visitors' devices run inference. Production must provide HTTPS.

References: [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api), [WebLLM](https://webllm.mlc.ai/docs/user/get_started.html), [Fractal Clock inspiration](https://www.egui.rs/#clock).

[MIT License](LICENSE)

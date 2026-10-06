import workspace from "./workspace.html";
import { Harness } from "./controller.mjs";
import { adapter, capabilities } from "./adapters.mjs";
function mount(root) {
  root.innerHTML = workspace;
  const get = (id) => root.querySelector("#" + id);
  const transcript = get("transcript");
  const welcome = transcript.firstElementChild;
  let caps = null;
  const h = new Harness(adapter, render);
  function render() {
    const busy = ["loading", "streaming"].includes(h.state);
    const connected = h.state === "ready" || h.state === "streaming";
    get("send").disabled = h.state !== "ready";
    get("prompt").disabled = busy;
    get("runtime").disabled = busy || connected;
    get("system").disabled = busy || connected || h.messages.length > 0;
    get("consent").disabled = busy || connected;
    get("stop").hidden = !busy;
    get("connect").disabled =
      busy || connected || !caps || !get("consent").checked || !usable();
    get("connect").textContent =
      h.state === "loading"
        ? "Loading on your device…"
        : connected
          ? "Model loaded ✓"
          : "Load local model ↓";
    get("run-status").textContent = h.detail;
    get("status-dot").className = "status-dot " + h.state;
    get("elapsed").textContent = h.elapsed ? h.elapsed.toFixed(1) + "s" : "";
    get("turn-count").textContent =
      Math.floor(h.messages.length / 2) + " TURNS";
    if (!h.messages.length && !h.current) {
      transcript.replaceChildren(welcome);
      return;
    }
    const atBottom =
      transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight <
      70;
    const fragment = document.createDocumentFragment();
    const message = (role, text, incomplete = false) => {
      const article = document.createElement("article");
      article.className = "message " + role;
      const label = document.createElement("div");
      label.className = "message-label mono";
      label.textContent =
        role === "user"
          ? "YOU"
          : "LOCAL MODEL" +
            (incomplete
              ? h.state === "streaming"
                ? " / GENERATING"
                : " / INCOMPLETE"
              : "");
      const content = document.createElement("div");
      content.className = "message-content";
      content.textContent = text;
      article.append(label, content);
      fragment.append(article);
    };
    for (const item of h.messages) message(item.role, item.content);
    if (h.current) {
      message("user", h.current.content);
      message("assistant", h.partial || "…", true);
    }
    transcript.replaceChildren(fragment);
    if (atBottom) transcript.scrollTop = transcript.scrollHeight;
  }
  function usable() {
    return get("runtime").value === "native"
      ? caps.native !== "unavailable"
      : caps.gpu;
  }
  function updateRuntime() {
    const native = get("runtime").value === "native";
    get("model-name").textContent = native ? "Gemini Nano" : "Qwen 2.5 / 0.5B";
    get("model-description").textContent = native
      ? "Managed by Chrome · text / English"
      : "4-bit quantized · 4,096 token context";
    get("download-info").textContent = native
      ? "Chrome may download a multi-GB model. Requires a supported desktop device, enough free storage, and browser permission. Model size is managed by Chrome."
      : "First load downloads roughly 400 MB of model files. Allow at least 1.1 GB of GPU memory plus browser overhead. Uses a dedicated worker; weights are cached by the browser.";
    get("availability").textContent = !caps
      ? "Checking browser capabilities…"
      : native
        ? "Chrome API: " +
          caps.native +
          (caps.native === "unavailable"
            ? ". " + caps.reason
            : " · text / English")
        : caps.gpu
          ? "WebGPU detected · GPU compatibility checked on load"
          : "WebGPU is unavailable. Enable hardware acceleration or use a supported desktop browser. " +
            caps.reason;
    render();
  }
  get("consent").addEventListener("change", render);
  get("runtime").addEventListener("change", () => {
    get("consent").checked = false;
    updateRuntime();
  });
  get("connect").addEventListener("click", () => {
    if (get("consent").checked && usable())
      h.connect(get("runtime").value, get("system").value);
  });
  get("stop").addEventListener("click", () => h.stop());
  get("new-session").addEventListener("click", () => {
    h.reset();
    get("prompt").value = "";
    get("consent").checked = false;
    updateRuntime();
  });
  get("prompt-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = get("prompt").value;
    const pending = h.run(text);
    if (h.state === "streaming") get("prompt").value = "";
    await pending;
  });
  get("prompt").addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      get("prompt-form").requestSubmit();
    }
  });
  root.querySelectorAll("[data-prompt]").forEach((button) =>
    button.addEventListener("click", () => {
      get("prompt").value = button.dataset.prompt;
      get("prompt").focus();
    }),
  );
  // BFCache restoration must not leave a ready UI pointing at a destroyed adapter.
  window.addEventListener("pagehide", () => h.stop());
  updateRuntime();
  capabilities().then((result) => {
    caps = result;
    if (caps.native === "unavailable" && caps.gpu)
      get("runtime").value = "webllm";
    updateRuntime();
  });
}
const observer = new MutationObserver(() => {
  const root = document.getElementById("harness");
  if (root) {
    observer.disconnect();
    mount(root);
  }
});
const root = document.getElementById("harness");
if (root) mount(root);
else observer.observe(document, { childList: true, subtree: true });

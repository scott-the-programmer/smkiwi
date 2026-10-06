export const MODEL = "Qwen2.5-0.5B-Instruct-q4f32_1-MLC";
export const TEXT_OPTIONS = {
  expectedInputs: [{ type: "text", languages: ["en"] }],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
};
export async function capabilities(env = globalThis) {
  if (!env.isSecureContext)
    return {
      native: "unavailable",
      gpu: false,
      reason: "Open this site over HTTPS (or localhost) to use local AI.",
    };
  let native = "unavailable";
  try {
    if (env.LanguageModel?.availability)
      native = await env.LanguageModel.availability(TEXT_OPTIONS);
  } catch {
    /* Keep WebLLM available when the native API is restricted. */
  }
  return {
    native,
    gpu: Boolean(env.navigator?.gpu),
    reason:
      native === "unavailable"
        ? "Chrome built-in AI is not available here. Try WebLLM on a WebGPU-capable device."
        : "",
  };
}
export class NativeAdapter {
  constructor(env = globalThis) {
    this.env = env;
  }
  async connect({ system, messages, signal, progress }) {
    if (!this.env.isSecureContext)
      throw new Error("HTTPS or localhost is required.");
    const api = this.env.LanguageModel;
    if (!api?.create || !api?.availability)
      throw new Error(
        "Chrome Prompt API is not exposed in this browser. Select WebLLM instead.",
      );
    const status = await api.availability(TEXT_OPTIONS);
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    if (status === "unavailable")
      throw new Error(
        "Chrome built-in AI is unavailable on this device or disabled by browser policy. Select WebLLM or use a supported desktop Chrome installation.",
      );
    progress(
      status === "available"
        ? "Opening Gemini Nano…"
        : "Chrome is downloading Gemini Nano. This can take several minutes…",
    );
    const session = await api.create({
      ...TEXT_OPTIONS,
      signal,
      initialPrompts: [{ role: "system", content: system }, ...messages],
      monitor(monitor) {
        monitor.addEventListener("downloadprogress", (e) =>
          progress(
            "Gemini Nano download · " + Math.round(e.loaded * 100) + "%",
          ),
        );
      },
    });
    if (signal.aborted) {
      session.destroy();
      throw new DOMException("Cancelled", "AbortError");
    }
    this.session = session;
    session.addEventListener?.("contextoverflow", () =>
      progress(
        "Context full: Chrome dropped older turns from model context. Start a new session for a clean run.",
      ),
    );
  }
  async *stream(messages, signal) {
    // Chrome owns prior context; sending the full transcript again would duplicate it.
    for await (const chunk of this.session.promptStreaming(
      messages.at(-1).content,
      { signal },
    ))
      yield chunk;
  }
  dispose() {
    this.session?.destroy();
    this.session = null;
  }
}
export class WebLLMAdapter {
  constructor(env = globalThis) {
    this.env = env;
  }
  async connect({ signal, progress }) {
    if (!this.env.isSecureContext)
      throw new Error("HTTPS or localhost is required.");
    if (!this.env.navigator?.gpu)
      throw new Error(
        "WebGPU is unavailable. Use a WebGPU-enabled desktop browser, enable hardware acceleration, or try Chrome built-in AI.",
      );
    const gpu = await this.env.navigator.gpu.requestAdapter();
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    if (!gpu)
      throw new Error(
        "No WebGPU adapter was found. Check hardware acceleration and GPU drivers.",
      );
    const { WebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    this.worker = new this.env.Worker("/public/runtime/worker.js", {
      type: "module",
    });
    this.engine = new WebWorkerMLCEngine(this.worker, {
      initProgressCallback: (report) => progress(report.text),
      logLevel: "WARN",
    });
    // Termination otherwise leaves the worker library's pending promise unresolved.
    await new Promise((resolve, reject) => {
      const abort = () => reject(new DOMException("Cancelled", "AbortError"));
      const failed = (event) =>
        reject(
          new Error(
            "Local model worker failed: " +
              (event.message || "GPU or memory error"),
          ),
        );
      signal.addEventListener("abort", abort, { once: true });
      this.worker.addEventListener("error", failed, { once: true });
      this.engine
        .reload(MODEL, { context_window_size: 4096 })
        .then(resolve, reject)
        .finally(() => {
          signal.removeEventListener("abort", abort);
          this.worker?.removeEventListener("error", failed);
        });
    });
  }
  async *stream(messages, signal) {
    const chunks = await this.guard(
      this.engine.chat.completions.create({
        messages,
        stream: true,
        max_tokens: 512,
        temperature: 0.7,
      }),
      signal,
    );
    const iterator = chunks[Symbol.asyncIterator]();
    while (true) {
      const { value: chunk, done } = await this.guard(iterator.next(), signal);
      if (done || signal.aborted) break;
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }
  guard(promise, signal) {
    if (signal.aborted)
      return Promise.reject(new DOMException("Cancelled", "AbortError"));
    return new Promise((resolve, reject) => {
      const abort = () => reject(new DOMException("Cancelled", "AbortError"));
      const failed = (event) =>
        reject(
          new Error(
            "Local model worker failed: " +
              (event.message || "GPU or memory error"),
          ),
        );
      signal.addEventListener("abort", abort, { once: true });
      this.worker.addEventListener("error", failed, { once: true });
      promise.then(resolve, reject).finally(() => {
        signal.removeEventListener("abort", abort);
        this.worker?.removeEventListener("error", failed);
      });
    });
  }
  dispose() {
    this.engine?.interruptGenerate();
    this.worker?.terminate();
    this.worker = null;
    this.engine = null;
  }
}
export function adapter(kind) {
  return kind === "native" ? new NativeAdapter() : new WebLLMAdapter();
}

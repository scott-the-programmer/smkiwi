import test from "node:test";
import assert from "node:assert/strict";
import {
  capabilities,
  NativeAdapter,
  WebLLMAdapter,
  MODEL,
} from "../web/adapters.mjs";
import { prebuiltAppConfig } from "@mlc-ai/web-llm";

test("pinned WebLLM model exists in the shipped upstream catalog", () => {
  const record = prebuiltAppConfig.model_list.find((m) => m.model_id === MODEL);
  assert(record);
  assert.equal(record.overrides.context_window_size, 4096);
  assert(record.vram_required_MB < 1100);
});
test("insecure context never probes native AI or GPU", async () => {
  let called = false;
  const result = await capabilities({
    isSecureContext: false,
    LanguageModel: {
      async availability() {
        called = true;
      },
    },
  });
  assert.equal(result.gpu, false);
  assert.equal(called, false);
  assert.match(result.reason, /HTTPS/);
});
test("restricted native API does not hide a GPU-capable fallback", async () => {
  const result = await capabilities({
    isSecureContext: true,
    navigator: { gpu: {} },
    LanguageModel: {
      async availability() {
        throw new Error("policy");
      },
    },
  });
  assert.equal(result.native, "unavailable");
  assert.equal(result.gpu, true);
});
test("native adapter supplies history and emits text deltas without duplicating context", async () => {
  let options,
    prompt,
    destroyed = false;
  const session = {
    destroy() {
      destroyed = true;
    },
    async *promptStreaming(value) {
      prompt = value;
      yield "first";
      yield " second";
    },
  };
  const a = new NativeAdapter({
    isSecureContext: true,
    LanguageModel: {
      async availability() {
        return "available";
      },
      async create(o) {
        options = o;
        return session;
      },
    },
  });
  const signal = new AbortController().signal;
  await a.connect({
    system: "SYSTEM",
    messages: [
      { role: "user", content: "earlier" },
      { role: "assistant", content: "answer" },
    ],
    signal,
    progress() {},
  });
  assert.equal(options.initialPrompts.length, 3);
  assert.deepEqual(options.expectedInputs, [
    { type: "text", languages: ["en"] },
  ]);
  let text = "";
  for await (const chunk of a.stream(
    [
      { role: "system", content: "SYSTEM" },
      { role: "user", content: "latest" },
    ],
    signal,
  ))
    text += chunk;
  assert.equal(prompt, "latest");
  assert.equal(text, "first second");
  a.dispose();
  assert(destroyed);
});
test("unsupported native and missing GPU adapters fail with actionable messages", async () => {
  const options = {
    system: "",
    messages: [],
    signal: new AbortController().signal,
    progress() {},
  };
  await assert.rejects(
    () => new NativeAdapter({ isSecureContext: true }).connect(options),
    /Select WebLLM/,
  );
  await assert.rejects(
    () =>
      new NativeAdapter({
        isSecureContext: true,
        LanguageModel: {
          create() {},
          async availability() {
            return "unavailable";
          },
        },
      }).connect(options),
    /browser policy/,
  );
  await assert.rejects(
    () =>
      new WebLLMAdapter({ isSecureContext: true, navigator: {} }).connect(
        options,
      ),
    /WebGPU is unavailable/,
  );
  await assert.rejects(
    () =>
      new WebLLMAdapter({
        isSecureContext: true,
        navigator: {
          gpu: {
            async requestAdapter() {
              return null;
            },
          },
        },
      }).connect(options),
    /hardware acceleration/,
  );
});
test("cancellation destroys a native session which resolves after abort", async () => {
  const c = new AbortController();
  let destroyed = false;
  const a = new NativeAdapter({
    isSecureContext: true,
    LanguageModel: {
      async availability() {
        return "available";
      },
      async create() {
        c.abort();
        return {
          destroy() {
            destroyed = true;
          },
        };
      },
    },
  });
  await assert.rejects(
    () =>
      a.connect({ system: "", messages: [], signal: c.signal, progress() {} }),
    /Cancelled/,
  );
  assert(destroyed);
});

test("worker guard rejects an already-aborted request instead of hanging", async () => {
  const controller = new AbortController();
  controller.abort();
  const a = new WebLLMAdapter();
  a.worker = new EventTarget();
  await assert.rejects(
    () =>
      Promise.race([
        a.guard(new Promise(() => {}), controller.signal),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 20),
        ),
      ]),
    /Cancelled/,
  );
});

// Opt-in hardware/network check. NO fixtures, no server inference, downloads the real model.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const args =
    process.env.WEBGPU_TEST_FLAGS === "1"
      ? [
          "--enable-unsafe-webgpu",
          "--ignore-gpu-blocklist",
          "--use-angle=vulkan",
          "--use-vulkan=native",
          "--enable-features=Vulkan,VulkanFromANGLE,DefaultANGLEVulkan",
          "--disable-vulkan-surface",
        ]
      : [];
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    headless: true,
    args,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1040 },
    });
    // Observe the actual worker transport; do not replace responses or inference.
    await page.addInitScript(() => {
      window.actualWorkerPrompts = [];
      const post = Worker.prototype.postMessage;
      Worker.prototype.postMessage = function (message, ...options) {
        if (message.kind === "chatCompletionStreamInit")
          window.actualWorkerPrompts.push(
            structuredClone(message.content.request.messages),
          );
        return post.call(this, message, ...options);
      };
    });
    const errors = [];
    const requests = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) =>
      requests.push({ url: r.url(), method: r.method() }),
    );
    page.on("console", (m) => {
      if (m.type() === "error") console.log("BROWSER ERROR:", m.text());
    });
    await page.goto(process.env.BASE_URL || "http://localhost:8090");
    await page.getByRole("heading", { name: "Think locally." }).waitFor();
    await page
      .getByText("Checking browser capabilities…")
      .waitFor({ state: "hidden" });
    console.log(
      "ACTUAL CAPABILITIES:",
      await page.evaluate(async () => {
        const a = await navigator.gpu?.requestAdapter();
        return {
          secure: isSecureContext,
          native:
            typeof LanguageModel === "undefined"
              ? "not exposed"
              : await LanguageModel.availability(),
          webgpu: !!a,
          vendor: a?.info.vendor,
          architecture: a?.info.architecture,
          shaderF16: a?.features.has("shader-f16"),
        };
      }),
    );
    await page.locator("#runtime").selectOption("webllm");
    await page.locator("#consent").check();
    await page.locator("#connect").click();
    await page.waitForFunction(
      () =>
        ["Local model ready"].includes(
          document.querySelector("#run-status").textContent,
        ) || document.querySelector("#status-dot").classList.contains("error"),
      null,
      { timeout: 600000 },
    );
    console.log("LOAD:", await page.locator("#run-status").innerText());
    assert.equal(
      await page.locator("#send").isEnabled(),
      true,
      "Real model must initialize",
    );
    assert.equal(await page.locator("#system").isDisabled(), true);
    await page
      .locator("#prompt")
      .fill("Name the capital city of France. Reply with one short sentence.");
    await page.locator("#send").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#status-dot").classList.contains("ready") ||
        document.querySelector("#status-dot").classList.contains("error"),
      null,
      { timeout: 180000 },
    );
    const response = await page
      .locator(".message.assistant .message-content")
      .innerText();
    console.log("REAL MODEL RESPONSE:", response);
    console.log("RUN:", await page.locator("#run-status").innerText());
    assert.match(response, /Paris/i);
    assert.equal(await page.locator("#turn-count").innerText(), "1 TURNS");
    require("node:fs").mkdirSync("test-results", { recursive: true });
    await page.screenshot({
      path: "test-results/harness-real-inference.png",
      fullPage: true,
    });
    assert(
      requests.some((r) => r.url.includes("/public/runtime/worker.js")),
      "Worker entry must load",
    );
    assert(
      requests.some((r) => r.url.includes("huggingface.co")),
      "Real weights must be requested",
    );
    assert(
      !requests.some((r) => r.method === "POST"),
      "No remote inference requests",
    );
    assert.deepEqual(errors, []);
    await page
      .locator("#prompt")
      .fill("What city did you just name? Answer with the city name only.");
    await page.locator("#send").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#status-dot").classList.contains("ready") ||
        document.querySelector("#status-dot").classList.contains("error"),
      null,
      { timeout: 180000 },
    );
    const followup = await page
      .locator(".message.assistant .message-content")
      .last()
      .innerText();
    // This is a transport/lifecycle test, not a benchmark for a probabilistic 0.5B model.
    assert(followup.trim().length > 0);
    assert.equal(await page.locator("#turn-count").innerText(), "2 TURNS");
    const actualContext = await page.evaluate(() => actualWorkerPrompts.at(-1));
    assert.equal(actualContext.length, 4);
    assert.equal(actualContext[2].role, "assistant");
    assert.equal(actualContext[2].content, response);
    if (!/Paris/i.test(followup))
      console.log(
        "MODEL QUALITY WARNING: follow-up did not recall Paris despite receiving correct context",
      );
    console.log("REAL FOLLOW-UP:", followup);
    await page
      .locator("#prompt")
      .fill("Write a detailed 500-word essay about cloud engineering.");
    await page.locator("#send").click();
    await page.waitForFunction(
      () => {
        const n = document.querySelectorAll(
          ".message.assistant .message-content",
        );
        return n.length === 3 && n[2].textContent.length > 10;
      },
      null,
      { timeout: 180000 },
    );
    await page.locator("#stop").click();
    const partial = await page
      .locator(".message.assistant .message-content")
      .last()
      .innerText();
    await page.waitForTimeout(1000);
    assert.equal(
      await page
        .locator(".message.assistant .message-content")
        .last()
        .innerText(),
      partial,
    );
    assert.equal(await page.locator("#turn-count").innerText(), "2 TURNS");
    console.log(
      "REAL CANCEL: partial output stopped, completed history preserved",
    );
    await page.locator("#new-session").click();
    await page.locator("#consent").check();
    await page.locator("#connect").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#status-dot").classList.contains("ready") ||
        document.querySelector("#status-dot").classList.contains("error"),
      null,
      { timeout: 180000 },
    );
    assert.equal(await page.locator("#send").isEnabled(), true);
    assert.equal(await page.locator("#turn-count").innerText(), "0 TURNS");
    console.log("REAL RESET: worker unloaded and cached model reinitialized");
    assert(!requests.some((r) => r.method === "POST"));
    assert.deepEqual(errors, []);
    require("node:fs").writeFileSync(
      "test-results/inference-report.json",
      JSON.stringify(
        {
          model: "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
          response,
          followup,
          followupContext: actualContext,
          cancellation: "partial stopped and completed history retained",
          reset: "cached worker reinitialized",
          requestMethods: [...new Set(requests.map((r) => r.method))],
          requestHosts: [
            ...new Set(requests.map((r) => new URL(r.url).hostname)),
          ],
          pageErrors: errors,
          testGpuFlags: process.env.WEBGPU_TEST_FLAGS === "1",
        },
        null,
        2,
      ),
    );
    console.log(
      "PASS: real browser worker, real downloaded Qwen weights, GPU inference and follow-up context, cancellation and reset; no POST requests",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

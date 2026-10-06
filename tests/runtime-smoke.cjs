// API fixtures exercise the real UI/controller/native adapter; these are NOT inference results.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    headless: true,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.fixture = { mode: "ok", destroyed: 0, calls: [], options: [] };
      Object.defineProperty(window, "LanguageModel", {
        configurable: true,
        value: {
          availability: async () => "downloadable",
          create: async (options) => {
            fixture.options.push({
              initialPrompts: options.initialPrompts,
              expectedInputs: options.expectedInputs,
            });
            const monitor = new EventTarget();
            options.monitor(monitor);
            const event = new Event("downloadprogress");
            event.loaded = 0.5;
            monitor.dispatchEvent(event);
            await new Promise((r) => setTimeout(r, 100));
            if (fixture.mode === "load-error")
              throw new Error("Fixture download failed");
            return {
              destroy() {
                fixture.destroyed++;
              },
              addEventListener() {},
              async *promptStreaming(prompt, { signal }) {
                fixture.calls.push(prompt);
                if (fixture.mode === "stream-error")
                  throw new Error("Fixture GPU lost");
                yield "<img src=x onerror=window.fixtureXss=true>";
                await new Promise((r) =>
                  setTimeout(r, fixture.mode === "slow" ? 1000 : 100),
                );
                if (signal.aborted)
                  throw new DOMException("Aborted", "AbortError");
                yield " real text";
              },
            };
          },
        },
      });
    });
    await page.goto(process.env.BASE_URL || "http://localhost:8090");
    await page.getByText(/Chrome API: downloadable/).waitFor();
    const status = page.locator("#run-status");
    const load = async () => {
      await page.locator("#consent").check();
      await page.locator("#connect").click();
    };
    await page.locator("#system").fill("TEST SYSTEM");
    await load();
    await page
      .getByText("Gemini Nano download · 50%", { exact: true })
      .waitFor();
    assert.equal(await page.locator("#send").isEnabled(), false);
    await page.getByText("Local model ready", { exact: true }).waitFor();
    assert.equal(await page.locator("#system").isEnabled(), false);
    await page
      .locator("#prompt")
      .fill("<script>window.fixtureXss=true</script>");
    await page.locator("#send").click();
    await page.getByText(/Generating on your device/).waitFor();
    await page
      .getByText("Run complete · local inference", { exact: true })
      .waitFor();
    assert.equal(
      await page.locator("#transcript img,#transcript script").count(),
      0,
    );
    assert.equal(await page.evaluate(() => window.fixtureXss), undefined);
    assert.equal(await page.locator("#turn-count").innerText(), "1 TURNS");
    assert.equal(
      await page.evaluate(() => fixture.options[0].initialPrompts[0].content),
      "TEST SYSTEM",
    );
    await page.evaluate(() => (fixture.mode = "slow"));
    await page.locator("#prompt").fill("Cancel me");
    await page.locator("#send").click();
    await page.getByText(/Generating on your device/).waitFor();
    await page.locator("#stop").click();
    await page.getByText(/Stopped. Reconnect to continue/).waitFor();
    await page.waitForTimeout(1100);
    assert.equal(await page.locator("#turn-count").innerText(), "1 TURNS");
    assert.equal(
      await page
        .locator("#transcript")
        .getByText("<img src=x onerror=window.fixtureXss=true>", {
          exact: true,
        })
        .count(),
      1,
    );
    await page.evaluate(() => (fixture.mode = "ok"));
    await page.locator("#connect").click();
    await page.getByText("Local model ready", { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => fixture.options.at(-1).initialPrompts.length),
      3,
      "Only completed turns replayed",
    );
    await page.evaluate(() => (fixture.mode = "stream-error"));
    await page.locator("#prompt").fill("Fail");
    await page.locator("#send").click();
    await page.getByText(/Fixture GPU lost/).waitFor();
    assert.equal(await page.locator("#turn-count").innerText(), "1 TURNS");
    await page.locator("#new-session").click();
    assert.equal(await page.locator("#turn-count").innerText(), "0 TURNS");
    assert.equal(await page.locator("#system").isEnabled(), true);
    assert.equal(await page.locator("#connect").isEnabled(), false);
    await page.evaluate(() => (fixture.mode = "load-error"));
    await load();
    await page.getByText("Fixture download failed", { exact: true }).waitFor();
    await page.locator("#new-session").click();
    await page.evaluate(() => (fixture.mode = "slow"));
    await load();
    await page.locator("#new-session").click();
    await page.waitForTimeout(200);
    assert.equal(await status.innerText(), "New session · no model loaded");
    assert.equal(await page.locator("#send").isEnabled(), false);
    // Unsupported browser and insecure origin are separate real capability checks, not fake inference.
    await page.addInitScript(() => {
      Object.defineProperty(window, "LanguageModel", {
        configurable: true,
        value: undefined,
      });
      Object.defineProperty(navigator, "gpu", {
        configurable: true,
        value: undefined,
      });
    });
    await page.reload();
    await page.getByText(/Chrome API: unavailable/).waitFor();
    await page.locator("#consent").check();
    assert.equal(await page.locator("#connect").isEnabled(), false);
    await page.locator("#runtime").selectOption("webllm");
    await page.locator("#consent").check();
    assert.equal(await page.locator("#connect").isEnabled(), false);
    await page.route("http://harness.test/**", async (route) => {
      const response = await route.fetch({
        url: route
          .request()
          .url()
          .replace("http://harness.test", process.env.BASE_URL || "http://localhost:8090"),
      });
      await route.fulfill({ response });
    });
    await page.goto("http://harness.test/");
    await page.getByText(/Open this site over HTTPS/).waitFor();
    await page.locator("#consent").check();
    assert.equal(await page.locator("#connect").isEnabled(), false);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: labelled API fixtures: download progress, streaming, system prompt, XSS, cancel, completed-only history, reset/loading race, load/inference errors, unsupported runtime, insecure origin",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    headless: true,
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1040 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const modelRequests = [];
    page.on("request", (request) => {
      if (
        /huggingface|binary-mlc|googleapis.*optimization/i.test(request.url())
      )
        modelRequests.push(request.url());
    });
    await page.goto(process.env.BASE_URL || "http://localhost:8090");
    await page.getByRole("heading", { name: "Think locally." }).waitFor();
    await page
      .getByText("Checking browser capabilities…")
      .waitFor({ state: "hidden" });
    assert.equal(await page.locator("#send").isEnabled(), false);
    assert.equal(await page.locator("#connect").isEnabled(), false);
    assert.equal(
      await page.getByText(/Cloud Invoice Simulator|Forward.Backward/).count(),
      0,
    );
    await page.getByRole("button", { name: /Explain a concept/ }).click();
    assert.match(
      await page.locator("#prompt").inputValue(),
      /technical concept/,
    );
    fs.mkdirSync("test-results", { recursive: true });
    await page.screenshot({
      path: "test-results/harness-desktop.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "About Scott", exact: true })
      .click();
    await page.getByRole("heading", { name: "Cloud Whisperer." }).waitFor();
    assert.equal(
      await page
        .getByRole("link", { name: "GitHub ↗", exact: true })
        .getAttribute("href"),
      "https://github.com/scott-the-programmer",
    );
    await page
      .getByRole("button", { name: "Sandbox Terminal", exact: true })
      .click();
    const terminal = page.getByRole("region", {
      name: "Sandbox Terminal",
      exact: true,
    });
    await terminal
      .getByRole("textbox", { name: "Terminal command" })
      .fill("echo <img src=x onerror=alert(1)>");
    await terminal.getByRole("textbox").press("Enter");
    await terminal
      .getByText("<img src=x onerror=alert(1)>", { exact: true })
      .waitFor();
    assert.equal(await terminal.locator("img").count(), 0);
    await terminal.getByRole("textbox").fill("pwd");
    await terminal.getByRole("textbox").press("Enter");
    await terminal.getByText("/home/guest", { exact: true }).waitFor();
    await terminal.getByRole("textbox").fill("cd projects");
    await terminal.getByRole("textbox").press("Enter");
    await terminal.getByRole("textbox").fill("cat smkiwi.md");
    await terminal.getByRole("textbox").press("Enter");
    await terminal
      .getByText(/browser-local AI harness, built with Rust/)
      .waitFor();
    await terminal.getByRole("textbox").press("ArrowUp");
    assert.equal(
      await terminal.getByRole("textbox").inputValue(),
      "cat smkiwi.md",
    );
    await page
      .getByRole("button", { name: "Fractal Clock", exact: true })
      .click();
    const clock = page.getByRole("region", {
      name: "Fractal Clock",
      exact: true,
    });
    await clock.getByRole("img", { name: /Fractal clock/ }).waitFor();
    const d = await clock.locator(".fractal-layer").last().getAttribute("d");
    await page.waitForFunction(
      (d) =>
        document
          .querySelector(".fractal-layer:last-child")
          .getAttribute("d") !== d,
      d,
    );
    await clock.locator("summary").click();
    await clock.getByRole("button", { name: /Pause/ }).click();
    const frozen = await clock.locator("svg").innerHTML();
    await page.waitForTimeout(120);
    assert.equal(await clock.locator("svg").innerHTML(), frozen);
    await clock.getByRole("slider", { name: /Depth/ }).fill("3");
    assert.equal(await clock.locator(".fractal-layer").count(), 4);
    await clock.getByRole("button", { name: "Reset", exact: true }).click();
    assert.equal(await clock.locator(".fractal-layer").count(), 10);
    await page.getByRole("button", { name: "Workspace", exact: true }).click();
    assert.match(
      await page.locator("#prompt").inputValue(),
      /technical concept/,
    );
    for (const width of [320, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Horizontal overflow at " + width,
      );
    }
    for (const name of ["About Scott", "Sandbox Terminal", "Fractal Clock"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await page.setViewportSize({ width: 320, height: 844 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Tool overflows at 320px: " + name,
      );
    }
    await page.getByRole("button", { name: "Workspace", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "test-results/harness-mobile.png",
      fullPage: true,
    });
    const ids = await page
      .locator("[id]")
      .evaluateAll((nodes) => nodes.map((n) => n.id));
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(
      modelRequests,
      [],
      "No model download without explicit consent",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: real browser UI, navigation, bio links, sandbox XSS/history/filesystem, clock animation/pause/settings, responsive layout, no model download",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

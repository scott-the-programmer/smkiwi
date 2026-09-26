// Optional integration check against a running server; setup is in README.md.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.BASE_URL || 'http://localhost:8080');
    const pane = name => page.getByRole('region', { name, exact: true });
    const window = id => page.locator(`.app-window[data-window-id="${id}"]`);
    const launch = async name => {
      await page.getByRole('button', { name: 'Applications', exact: true }).click();
      await page.getByRole('navigation', { name: 'Application menu' }).getByRole('button', { name: new RegExp(name) }).click();
    };
    const tiles = page.locator('.app-window:not([hidden])');
    async function nonOverlapping(expected) {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.waitForFunction(() => !document.querySelector('.tile-moving'));
      assert.equal(await tiles.count(), expected);
      const boxes = await tiles.evaluateAll(nodes => nodes.map(n => {
        const r = n.getBoundingClientRect();
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width };
      }));
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        assert(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y, 'Tiles overlap');
      }
      return boxes;
    }
    await page.getByRole('heading', { name: 'Cloud Whisperer.' }).waitFor();
    await pane('About Me').getByText('Terraform', { exact: true }).waitFor();
    let boxes = await nonOverlapping(3);
    assert(Math.abs(boxes[0].width - boxes[1].width) <= 1, 'Tile columns should have equal widths');
    assert.equal(boxes[1].x, boxes[2].x);
    assert.equal(await page.getByRole('button', { name: /Columns/ }).count(), 0);
    assert.equal(await page.locator('.workspace-hint').count(), 0);

    const clock = window(2);
    await clock.getByRole('img', { name: /Fractal clock:/ }).waitFor();
    assert.equal(await clock.locator('.fractal-layer').count(), 10);
    const colors = await clock.locator('.fractal-layer').evaluateAll(nodes => nodes.slice(0, 5).map(n => getComputedStyle(n).stroke));
    assert.deepEqual(colors, ['rgb(251, 177, 60)', 'rgb(87, 184, 255)', 'rgb(254, 104, 71)', 'rgb(33, 118, 174)', 'rgb(182, 109, 13)']);
    const animated = clock.locator('.fractal-layer').last();
    const livePath = await animated.getAttribute('d');
    await page.waitForFunction(d => document.querySelector('.fractal-layer:last-child').getAttribute('d') !== d, livePath);
    await clock.locator('summary').click();
    await clock.getByRole('button', { name: 'Pause', exact: false }).click();
    const frozen = await clock.locator('svg').innerHTML();
    await page.waitForTimeout(200);
    assert.equal(await clock.locator('svg').innerHTML(), frozen);
    await clock.getByRole('slider', { name: /Depth/ }).fill('6');
    assert.equal(await clock.locator('.fractal-layer').count(), 7);
    await clock.getByRole('slider', { name: 'Zoom', exact: true }).fill('0.4');
    assert.equal(await clock.locator('svg').getAttribute('viewBox'), '-125 -125 250 250');
    assert.equal(await clock.getByRole('link', { name: 'egui fractal clock sample' }).getAttribute('href'), 'https://www.egui.rs/#clock');

    await launch('Fractal Clock');
    await nonOverlapping(4);
    const secondClock = window(4); // new windows become master, so DOM order changes
    await secondClock.locator('summary').click();
    assert.equal(await secondClock.getByRole('slider', { name: /Depth/ }).inputValue(), '9');
    await secondClock.getByRole('slider', { name: /Depth/ }).fill('3');
    assert.equal(await clock.getByRole('slider', { name: /Depth/ }).inputValue(), '6');
    await clock.getByRole('button', { name: 'Minimize', exact: true }).click();
    await nonOverlapping(3);
    await page.getByRole('button', { name: 'Restore Fractal Clock #2', exact: true }).click();
    await nonOverlapping(4);
    assert.equal(await clock.getByRole('slider', { name: /Depth/ }).inputValue(), '6');
    await secondClock.getByRole('button', { name: 'Close', exact: true }).click();
    await clock.getByRole('button', { name: 'Reset', exact: true }).click();
    assert.equal(await clock.getByRole('slider', { name: /Depth/ }).inputValue(), '9');
    await clock.locator('summary').click();

    await pane('Terminal').getByRole('button', { name: 'Make master', exact: true }).click();
    await pane('Terminal').getByRole('button', { name: 'Zoom or restore' }).click();
    await nonOverlapping(1);
    await pane('Terminal').getByRole('textbox').fill('echo first instance');
    await pane('Terminal').getByRole('textbox').press('Enter');
    await pane('Terminal').getByText('first instance', { exact: true }).waitFor();
    await launch('Terminal');
    await nonOverlapping(4);
    const secondTerminal = window(5);
    await secondTerminal.getByRole('textbox').fill('echo second instance');
    await secondTerminal.getByRole('textbox').press('Enter');
    await secondTerminal.getByText('second instance', { exact: true }).waitFor();
    assert.equal(await window(3).getByText('second instance', { exact: true }).count(), 0);
    await secondTerminal.getByRole('button', { name: 'Close', exact: true }).click();
    await pane('Terminal').getByText('first instance', { exact: true }).waitFor();
    await nonOverlapping(3);

    await launch('Forward–Backward Lab');
    await nonOverlapping(4);
    const algorithm = pane('Forward–Backward Lab');
    await algorithm.getByRole('heading', { name: 'What was the weather?' }).waitFor();
    await algorithm.getByRole('button', { name: 'Posterior γ' }).click();
    await algorithm.getByRole('button', { name: /Observation 1: Walk/ }).click();
    await algorithm.getByRole('button', { name: /Observation 1: Shop/ }).waitFor();
    assert.match(await algorithm.getByText(/Sequence likelihood:/).innerText(), /0\.0/);
    assert.equal(await algorithm.getByRole('link', { name: 'Algorithm ↗' }).getAttribute('href'), 'https://en.wikipedia.org/wiki/Forward%E2%80%93backward_algorithm');
    await algorithm.getByRole('button', { name: 'Close', exact: true }).click();
    await nonOverlapping(3);


    // ⌘K / Ctrl+K command palette: open, filter, keyboard-run, and Escape.
    await page.locator('body').click({ position: { x: 5, y: 500 } });
    await page.keyboard.press('Control+k');
    const palette = page.getByRole('dialog', { name: 'Command palette' });
    const search = palette.getByRole('textbox', { name: 'Search commands' });
    await search.waitFor();
    assert.equal(await search.evaluate(n => document.activeElement === n), true, 'Palette input should be focused');
    assert.equal(await palette.getByRole('button').count(), 3 + 5);
    await search.fill('cloud invoice');
    assert.equal(await palette.getByRole('button').count(), 1);
    await page.keyboard.press('Enter');
    await palette.waitFor({ state: 'hidden' });
    await nonOverlapping(4);
    await pane('Cloud Invoice Simulator').waitFor();
    await pane('Cloud Invoice Simulator').getByRole('button', { name: 'Minimize', exact: true }).click();
    await nonOverlapping(3);
    await page.keyboard.press('Control+k');
    await search.fill('switch invoice');
    await palette.getByRole('button', { name: /Switch to Cloud Invoice Simulator #\d+/ }).waitFor();
    await page.keyboard.press('Enter');
    await nonOverlapping(4);
    await page.keyboard.press('Control+k');
    await search.fill('zzz');
    await palette.getByText('No matching commands.').waitFor();
    await page.keyboard.press('Escape');
    await palette.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Open command palette' }).click();
    await search.waitFor();
    await page.keyboard.press('Control+k');
    await palette.waitFor({ state: 'hidden' });
    await pane('Cloud Invoice Simulator').getByRole('button', { name: 'Close', exact: true }).click();
    await nonOverlapping(3);

    const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(n => n.id));
    assert.equal(new Set(ids).size, ids.length, 'DOM IDs must be unique');
    assert(!/Little Life|Pixel Studio|Kiwi OS|Field Notes/.test(await page.locator('body').innerText()));
    await page.setViewportSize({ width: 390, height: 844 });
    await nonOverlapping(3);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile page overflows');
    while (await tiles.count()) await tiles.first().getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('heading', { name: 'No applications open' }).waitFor();
    await launch('About Me');
    await nonOverlapping(1);
    assert.deepEqual(errors, []);
    console.log('PASS: command palette, master/stack, independent duplicate clocks and terminals, restore, zoom, close, clock animation/settings/credit, mobile, empty workspace');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });

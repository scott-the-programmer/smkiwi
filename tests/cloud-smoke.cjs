// Uses the same optional Playwright setup as browser-smoke.cjs.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.BASE_URL || 'http://localhost:8080');
    const launch = async () => {
      await page.getByRole('button', { name: 'Applications', exact: true }).click();
      await page.getByRole('navigation', { name: 'Application menu' })
        .getByRole('button', { name: /Cloud Invoice Simulator/ }).click();
    };
    await launch();
    const cloud = page.getByRole('region', { name: 'Cloud Invoice Simulator', exact: true }).first();
    await cloud.getByRole('button', { name: 'Zoom or restore' }).click();
    await cloud.getByRole('button', { name: 'Pause simulation', exact: true }).click();
    const flow = cloud.getByRole('img', { name: /Animated request flow/ });
    assert.equal(await flow.count(), 1);
    assert.equal(await cloud.locator('.cloud-flow.paused').count(), 1, 'Pause must freeze the request animation');
    assert(await flow.locator('.cloud-request').count() > 0, 'Traffic should render animated request packets');
    const frozen = await cloud.locator('.cloud-time').innerText();
    await page.waitForTimeout(600);
    assert.equal(await cloud.locator('.cloud-time').innerText(), frozen, 'Pause must freeze time');
    assert.equal(await cloud.locator('.cloud-server.powered').count(), 2);
    await cloud.getByRole('slider').fill('240');
    await cloud.getByRole('button', { name: 'Go viral', exact: false }).click();
    await cloud.getByText('1200 req/s', { exact: true }).waitFor();
    await cloud.getByRole('button', { name: 'Resume simulation', exact: true }).click();
    assert.equal(await cloud.locator('.cloud-flow.paused').count(), 0);
    await page.waitForFunction(() => Number(document.querySelector('.cloud-totals span:last-child').textContent.split(' ')[0]) > 0);
    await cloud.getByRole('button', { name: 'Pause simulation', exact: true }).click();
    assert.notEqual(await cloud.locator('.cloud-total dd').innerText(), '$0.00');
    await page.screenshot({ path: '/tmp/scott-cloud-desktop.png', fullPage: true });

    await cloud.getByRole('button', { name: 'Reset simulation', exact: true }).click();
    assert.equal(await cloud.getByRole('slider').inputValue(), '60');
    assert.equal(await cloud.locator('.cloud-server.powered').count(), 2);
    await cloud.getByRole('button', { name: 'Server 1 power', exact: true }).click();
    await cloud.getByRole('button', { name: 'Server 2 power', exact: true }).click();
    assert.equal(await cloud.locator('.cloud-server.powered').count(), 0);
    await page.waitForTimeout(300);
    const idleBill = await cloud.locator('.cloud-total dd').innerText();
    await page.waitForTimeout(600);
    assert.equal(await cloud.locator('.cloud-total dd').innerText(), idleBill, 'No billing with all servers off');

    const id = await cloud.getAttribute('data-window-id');
    await cloud.getByRole('button', { name: 'Minimize', exact: true }).click();
    const hiddenCloud = page.locator(`[data-window-id="${id}"]`);
    const hiddenTime = await hiddenCloud.locator('.cloud-time').textContent();
    await page.waitForTimeout(600);
    assert.equal(await hiddenCloud.locator('.cloud-time').textContent(), hiddenTime, 'Hidden window must pause');
    await page.getByRole('button', { name: `Restore Cloud Invoice Simulator #${id}`, exact: true }).click();
    await page.waitForFunction(({ id, old }) => document.querySelector(`[data-window-id="${id}"] .cloud-time`).textContent !== old, { id, old: hiddenTime });

    await launch();
    const secondId = await page.getByRole('region', { name: 'Cloud Invoice Simulator', exact: true }).nth(1).getAttribute('data-window-id');
    const second = page.locator(`[data-window-id="${secondId}"]`);
    assert.equal(await second.locator('.cloud-server.powered').count(), 2);
    assert.equal(await cloud.locator('.cloud-server.powered').count(), 0);
    assert.notEqual(await second.getByRole('slider').getAttribute('id'), await cloud.getByRole('slider').getAttribute('id'));
    await second.getByRole('button', { name: 'Zoom or restore' }).click();
    const zoomHidden = await hiddenCloud.locator('.cloud-time').textContent();
    await page.waitForTimeout(600);
    assert.equal(await hiddenCloud.locator('.cloud-time').textContent(), zoomHidden, 'Zooming another window must pause');
    await page.setViewportSize({ width: 390, height: 844 });
    await second.getByRole('button', { name: 'Pause simulation', exact: true }).click();
    await second.locator('.window-body').evaluate(node => { node.scrollTop = 0; });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile page overflow');
    assert(await second.locator('.window-body').evaluate(node => node.scrollWidth <= node.clientWidth), 'Mobile pane overflow');
    await page.screenshot({ path: '/tmp/scott-cloud-mobile.png', fullPage: true });
    await second.locator('.cloud-receipt').scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/scott-cloud-mobile-receipt.png', fullPage: true });
    await second.getByRole('button', { name: 'Close', exact: true }).click();
    await launch();
    const fresh = page.getByRole('region', { name: 'Cloud Invoice Simulator', exact: true }).nth(1);
    assert.equal(await fresh.getByRole('slider').inputValue(), '60');
    assert.equal(await fresh.locator('.cloud-server.powered').count(), 2);
    assert.deepEqual(errors, []);
    console.log('PASS: cloud launch, traffic spike, timeouts, billing, power, pause/reset, hidden/zoom pause, independent windows, close/reopen, mobile');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });

const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.BASE_URL || 'http://localhost:8080';
    await page.goto(base);
    await page.getByRole('heading', { level: 1, name: 'Software engineer. Tinkerer. Human.' }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.getByRole('main').count(), 1);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.project-row').count(), 3);
    const projects = await page.locator('.project-row h3 a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
    assert.deepEqual(projects, [
      'https://github.com/scott-the-programmer/vscode-devcontainers-herdr',
      'https://github.com/scott-the-programmer/terraform-provider-minikube',
      'https://github.com/scott-the-programmer/teams-emoji-upload-extension',
    ]);
    const contributions = await page.locator('.contribution-link').evaluateAll(nodes => nodes.map(node => ({ name: node.childNodes[0].textContent, href: node.getAttribute('href') })));
    assert.deepEqual(contributions, [
      { name: 'PostHog', href: 'https://github.com/PostHog/posthog-dotnet' },
      { name: 'Azure SDKs', href: 'https://github.com/Azure/go-autorest' },
      { name: '.NET', href: 'https://github.com/dotnet/sdk' },
      { name: 'Pulumi', href: 'https://github.com/pulumi/pulumi' },
      { name: "Azure's Terraform provider", href: 'https://github.com/hashicorp/terraform-provider-azurerm' },
    ]);
    assert.equal(await page.locator('.project-tech, .status, .contribution-description').count(), 0);
    assert(!/TypeScript|Rust|\bGo\b|PR #|Fractional|sticky settings|web\.config/.test(await page.locator('body').innerText()));
    assert(!/Spacelift|Backstage|Beam|Configuration explorer|Featured project/.test(await page.locator('body').innerText()));
    assert.equal(await page.locator('#demo, #case-study, #evidence, .flagship, .explorer').count(), 0);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content');
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, '#content');
    const project = page.locator('.project-row h3 a').first();
    await project.focus();
    assert.equal(await project.evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
    const missing = await page.locator('a[href^="#"]').evaluateAll(links => links.filter(link => link.hash && !document.getElementById(link.hash.slice(1))).map(link => link.href));
    assert.deepEqual(missing, []);
    assert.equal((await page.request.get(`${base}/public/verification.txt`)).status(), 200);
    assert.equal((await page.request.get(`${base}/public/scott-avatar.png`)).status(), 200);
    for (const anchor of ['work', 'contributions', 'about']) {
      await page.goto(`${base}/#${anchor}`);
      await page.reload();
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.waitForFunction(id => {
        const target = document.getElementById(id);
        const desired = Math.min(target.getBoundingClientRect().top + scrollY - 32, document.documentElement.scrollHeight - innerHeight);
        return Math.abs(scrollY - desired) < 3;
      }, anchor);
    }
    const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
    assert.equal(new Set(ids).size, ids.length);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
    for (const width of [1440, 1024, 768, 390, 320, 640]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
    }
    if (process.env.SCREENSHOT_DIR) {
      for (const [label, width, height] of [['desktop', 1440, 1000], ['mobile', 390, 844]]) {
        const capture = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
        await capture.goto(base);
        await capture.getByRole('heading', { level: 1 }).waitFor();
        await capture.evaluate(() => document.fonts.ready);
        await capture.waitForFunction(() => document.querySelector('.hero-profile img').naturalWidth > 0);
        await capture.screenshot({ path: `${process.env.SCREENSHOT_DIR}/portfolio-${label}.png`, fullPage: true });
        await capture.close();
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: equal projects, general contribution links, no language labels or fix details, keyboard, focus, direct anchors, assets, unique IDs, reduced motion, responsive widths, zoom reflow, no runtime errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });

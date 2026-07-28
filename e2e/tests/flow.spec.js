const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SCREEN_DIR = path.join(__dirname, '..', '..', 'docs', 'screenshots');

test.describe('No Label No Deal flow', () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREEN_DIR, { recursive: true });
  });

  test('hero is bright, CTA reaches step 1, full contact flow works', async ({ page }) => {
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(String(err)));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Legacy dark hero / Lade… must not be visible
    await expect(page.locator('#hero.hero--legacy')).toBeHidden();
    await expect(page.getByText('Lade...')).toHaveCount(0);

    const hero = page.locator('#heroPostDemo');
    await expect(hero).toBeVisible();
    const styles = await hero.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, image: cs.backgroundImage };
    });
    // gradient or light solid — not a solid near-black fill
    const isGradient = styles.image.includes('gradient');
    const rgb = styles.bg.match(/\d+/g)?.map(Number) || [0, 0, 0];
    const lum = rgb[0] + rgb[1] + rgb[2];
    expect(isGradient || lum > 500 || styles.bg === 'rgba(0, 0, 0, 0)').toBeTruthy();
    if (!isGradient && styles.bg !== 'rgba(0, 0, 0, 0)') {
      expect(lum).toBeGreaterThan(500);
    }
    // ensure CSS includes our light hero rule
    expect(styles.image + styles.bg).not.toMatch(/rgb\(15,\s*15,\s*15\)|rgb\(26,\s*26,\s*26\)/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(SCREEN_DIR, 'homepage-390.png'), fullPage: false });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(SCREEN_DIR, 'homepage-1440.png'), fullPage: false });

    await page.getByRole('button', { name: /Jetzt Abgeordneten kontaktieren|Contact an MEP now/i }).click();
    await page.waitForFunction(() => {
      const el = document.getElementById('step-language-country');
      if (!el) return false;
      const r = el.getBoundingClientRect();
      // scroll-margin ~72–88px; wait until settled near top (not mid-animation)
      return r.top >= 40 && r.top < 140;
    }, null, { timeout: 8000 });

    // Section top is scroll target; heading sits below flow-progress + scroll-margin
    const step1Top = await page.locator('#step-language-country').evaluate((el) => el.getBoundingClientRect().top);
    expect(step1Top).toBeGreaterThanOrEqual(40);
    expect(step1Top).toBeLessThan(140);
    const step1Heading = page.getByRole('heading', { name: /Bitte wähle Sprache und Land|Please select language and country/i });
    await expect(step1Heading).toBeVisible();
    const box = await step1Heading.boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeLessThan(450);
    await expect(page.locator('#flowProgressLang')).toBeVisible();

    await page.locator('#language').selectOption('de');
    await page.locator('#country').selectOption('Polen');
    await page.locator('#continueBtn').click();
    await page.waitForFunction(() => {
      const el = document.getElementById('step-role');
      if (!el || el.style.display === 'none') return false;
      const r = el.getBoundingClientRect();
      return r.top >= 40 && r.top < 140;
    }, null, { timeout: 8000 });

    const roleTop = await page.locator('#step-role').evaluate((el) => el.getBoundingClientRect().top);
    expect(roleTop).toBeGreaterThanOrEqual(40);
    expect(roleTop).toBeLessThan(140);
    const roleHeading = page.getByRole('heading', { name: /In welcher Rolle|In which role/i });
    await expect(roleHeading).toBeVisible();
    const roleBox = await roleHeading.boundingBox();
    expect(roleBox.y).toBeGreaterThanOrEqual(0);
    expect(roleBox.y).toBeLessThan(450);

    await page.locator('.btn-role[data-role="consumer"]').click();
    await page.waitForFunction(() => {
      const el = document.getElementById('mep-selection');
      if (!el || el.style.display === 'none') return false;
      const r = el.getBoundingClientRect();
      return r.top >= 40 && r.top < 160;
    }, null, { timeout: 8000 });

    const mepTop = await page.locator('#mep-selection').evaluate((el) => el.getBoundingClientRect().top);
    expect(mepTop).toBeGreaterThanOrEqual(40);
    expect(mepTop).toBeLessThan(160);
    const mepHeading = page.getByRole('heading', { name: /EU-Abgeordnete kontaktieren|Contact EU/i });
    await expect(mepHeading).toBeVisible();
    await expect(page.locator('#flowProgressContacts')).toBeVisible();
    const mepBox = await mepHeading.boundingBox();
    expect(mepBox.y).toBeGreaterThanOrEqual(0);
    expect(mepBox.y).toBeLessThan(450);

    await page.locator('#searchInput').fill('Adamowicz');
    await page.waitForTimeout(400);
    const writeBtn = page.locator('.btn-card-message').first();
    await expect(writeBtn).toBeVisible({ timeout: 15000 });
    await writeBtn.click();

    const editor = page.locator('#message-editor');
    await expect(editor).toBeVisible();
    await expect(page.locator('#composeName')).toContainText(/Adamowicz/i);

    await page.locator('#composeBody').fill('Testnachricht Herkunftskennzeichnung');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#composeCopyText').click();
    await page.waitForTimeout(200);
    const copiedText = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedText).toContain('Testnachricht');

    await page.locator('#composeCopyEmail').click();
    await page.waitForTimeout(200);
    const copiedMail = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedMail.toLowerCase()).toContain('adamowicz');
    expect(copiedMail).toMatch(/@europarl\.europa\.eu$/i);

    const expected = await page.evaluate(() => {
      const cb = document.querySelector('#mandatareList input[type="checkbox"]:checked');
      const em = cb ? cb.dataset.email : '';
      const subject = encodeURIComponent(document.getElementById('composeSubject').value || '');
      const body = encodeURIComponent(document.getElementById('composeBody').value || '');
      return `mailto:${em}?subject=${subject}&body=${body}`;
    });
    expect(expected.toLowerCase()).toContain('adamowicz');
    expect(decodeURIComponent(expected)).toContain('Testnachricht');
    expect(decodeURIComponent(expected)).toContain('NO LABEL NO DEAL');

    await expect(page.locator('footer a[href="impressum.html"]')).toHaveAttribute('href', 'impressum.html');
    await expect(page.locator('footer a[href="datenschutz.html"]')).toHaveAttribute('href', 'datenschutz.html');

    await page.evaluate(() => {
      const p = document.getElementById('petition');
      if (p) p.style.display = 'block';
    });
    await expect(page.locator('#petitionPendingNotice')).toBeVisible();
    await expect(page.locator('#petitionSignTop')).toBeHidden();

    expect(consoleErrors).toEqual([]);
  });
});

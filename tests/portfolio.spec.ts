import { test, expect } from '@playwright/test'
test('overview, navigation, cross-connections, and browser history', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Explore my universe.' })).toBeVisible()
  await page.getByRole('button', { name: 'Projects 02', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Projects', exact: true }).last(),
  ).toBeFocused()
  await page
    .locator('.content-panel')
    .getByRole('link', { name: /SafetyHub/ })
    .click()
  await expect(page).toHaveURL(/node=project%3Asafetyhub/)
  await expect(page.locator('.content-panel')).toContainText(
    'potential user base of 7,000+',
  )
  await page
    .locator('.skill-chips')
    .getByRole('button', { name: 'React', exact: true })
    .click()
  await expect(page.locator('.content-panel h2')).toHaveText('React')
  await expect(page.locator('.content-panel')).toContainText('AI Flash Cards')
  await page.goBack()
  await expect(page.locator('.content-panel h2')).toHaveText('SafetyHub')
  await page.goForward()
  await expect(page.locator('.content-panel h2')).toHaveText('React')
  await page.keyboard.press('Escape')
  await expect(page.locator('.content-panel')).toHaveCount(0)
  await page.waitForTimeout(1600)
  await page.screenshot({ path: '/tmp/portfolio-desktop.png' })
  expect(errors).toEqual([])
})
test('direct links, search, and a downloadable PDF', async ({ page, request }) => {
  await page.goto('/#node=project%3Aberea-bazaar')
  await expect(page.locator('.content-panel h2')).toHaveText('Berea Bazaar')
  await page.getByLabel('Find a node').fill('Purdue')
  await page.locator('.search-results').getByRole('link').first().click()
  await expect(page.locator('.content-panel')).toContainText('Purdue University')
  const pdf = await request.get('/assets/resume/besher-kitaz-resume.pdf')
  expect(pdf.status()).toBe(200)
  expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF')
})
test('HTML navigation remains available without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'List view', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'A closer look.' })).toBeVisible()
  await page
    .locator('.all-content')
    .getByRole('link', { name: /AI Flash Cards/ })
    .click()
  await expect(page.locator('.content-panel')).toContainText('spaced-repetition')
})
test('mobile layout and reduced-motion direct navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.waitForTimeout(1500)
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBe(true)
  await page.screenshot({ path: '/tmp/portfolio-mobile.png' })
  await page.getByRole('button', { name: /Berea Bazaar/ }).click()
  await expect(page.locator('.content-panel h2')).toHaveText('Berea Bazaar')
  const panel = await page.locator('.content-panel').boundingBox()
  expect(panel!.x).toBeGreaterThanOrEqual(0)
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(390)
  await page.screenshot({ path: '/tmp/portfolio-mobile-panel.png' })
})
test('static portfolio is complete with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/')
  await expect(
    page.getByRole('heading', { name: 'Besher Kitaz', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'SafetyHub', exact: true }),
  ).toBeVisible()
  await page.goto('http://127.0.0.1:4173/portfolio.html')
  await expect(page.getByText('Dean’s List: Fall 2024 and Fall 2025.')).toBeVisible()
  await context.close()
})
for (const size of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
]) {
  test(`phone navigation, scrolling, and touch targets at ${size.width}×${size.height}`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: size,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:4173/')
    const phoneNav = page.getByRole('navigation', { name: 'Phone navigation' })
    await expect(phoneNav).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
    for (const button of await phoneNav.getByRole('button').all()) {
      const box = await button.boundingBox()
      expect(box!.height).toBeGreaterThanOrEqual(44)
      expect(box!.width).toBeGreaterThanOrEqual(44)
    }
    await phoneNav.getByRole('button', { name: 'Explore', exact: true }).tap()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Experience', exact: true })
      .tap()
    await expect(page.locator('.content-panel h2')).toHaveText('Experience')
    await page
      .locator('.content-panel')
      .getByRole('link', { name: /Software Engineer Intern/ })
      .tap()
    await expect(page.locator('.content-panel h2')).toHaveText('Software Engineer Intern')
    const panel = page.locator('.content-panel')
    const bounds = await panel.boundingBox()
    const navBounds = await phoneNav.boundingBox()
    expect(bounds!.y).toBeGreaterThanOrEqual(0)
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(navBounds!.y)
    await panel.evaluate((el) => (el.scrollTop = el.scrollHeight))
    await expect(panel.getByRole('button', { name: 'Close details' })).toBeInViewport()
    await panel.getByRole('button', { name: 'Close details' }).tap()
    await expect(panel).toHaveCount(0)
    await page.getByRole('button', { name: 'List view', exact: true }).tap()
    await page
      .locator('.all-content')
      .getByRole('link', { name: /AI Flash Cards/ })
      .tap()
    await expect(panel.locator('h2')).toHaveText('AI Flash Cards')
    await phoneNav.getByRole('button', { name: 'Home', exact: true }).tap()
    await page.getByRole('button', { name: 'Graph view', exact: true }).tap()
    await page.getByLabel('Find a node').fill('Purdue')
    expect(
      await page
        .getByLabel('Find a node')
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16)
    await page
      .locator('.search-results')
      .getByRole('link', { name: /Software Engineer/ })
      .last()
      .tap()
    await expect(panel).toContainText('Purdue University')
    await phoneNav.getByRole('button', { name: 'Home', exact: true }).tap()
    await page.locator('.main-content').evaluate((el) => (el.scrollTop = 0))
    if (size.height > 500)
      await expect(
        page.getByRole('button', { name: 'Besher Kitaz THE CENTRAL NODE', exact: true }),
      ).toBeInViewport()
    await page.screenshot({ path: `/tmp/portfolio-phone-${size.width}.png` })
    await context.close()
  })
}
test('phone menu releases focus when resized to desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page
    .getByRole('navigation', { name: 'Phone navigation' })
    .getByRole('button', { name: 'Explore', exact: true })
    .click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(page.locator('dialog')).not.toHaveAttribute('open', '')
  await page.getByRole('button', { name: 'Projects 02', exact: true }).click()
  await expect(page.locator('.content-panel h2')).toHaveText('Projects')
})

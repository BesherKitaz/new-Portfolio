import { test, expect } from '@playwright/test'
test('overview, navigation, cross-connections, and browser history', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Besher Kitaz', exact: true }),
  ).toBeVisible()
  await expect(page.locator('.intro-subtitle')).toHaveText('Software Developer')
  await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Zoom out', exact: true })).toHaveCount(0)
  await expect(page.locator('.intro').getByRole('link')).toHaveCount(0)
  await expect(page.getByText('THE CENTRAL NODE', { exact: true })).toHaveCount(0)
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
  await page
    .getByRole('navigation', { name: 'Phone navigation' })
    .getByRole('button', { name: 'Projects', exact: true })
    .click()
  await page
    .locator('.selected-work')
    .getByRole('link', { name: /Berea Bazaar/ })
    .click()
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
        page.getByRole('button', { name: 'Besher Kitaz', exact: true }),
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

test('identity stays stable through hover, drag, selection, deselection, and history', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const intro = page.locator('.identity-intro')
  const canvas = page.locator('canvas')
  await expect(intro).toHaveCSS('opacity', '1')
  await expect(intro).toContainText('Connecting ideas through code.')

  const projects = page
    .locator('.galaxy-scene')
    .getByRole('button', { name: 'Projects', exact: true })
  await projects.hover()
  await expect(intro).toHaveCSS('opacity', '1')
  const central = page
    .locator('.galaxy-scene')
    .getByRole('button', { name: 'Besher Kitaz', exact: true })
  await central.hover()
  await page.mouse.down()
  await expect(intro).toHaveCSS('opacity', '1')
  await page.mouse.up()
  await expect(intro).toHaveCSS('opacity', '1')

  const scene = await canvas.boundingBox()
  await page.mouse.move(scene!.x + 24, scene!.y + scene!.height / 2)
  await page.mouse.wheel(0, -100)
  await expect(intro).toHaveCSS('opacity', '1')
  await page.mouse.down()
  await page.mouse.move(scene!.x + 110, scene!.y + scene!.height / 2 + 25, { steps: 8 })
  await page.mouse.up()
  await expect(intro).toHaveCSS('opacity', '0')
  await expect(page.locator('.content-panel')).toHaveCount(0)
  await central.click()
  await expect(intro).toHaveCSS('opacity', '1')

  const centralBounds = await central.boundingBox()
  await page.mouse.move(
    centralBounds!.x + centralBounds!.width / 2,
    centralBounds!.y - 30,
  )
  await page.mouse.down()
  await page.mouse.move(
    centralBounds!.x + centralBounds!.width / 2 + 70,
    centralBounds!.y - 10,
    { steps: 8 },
  )
  await page.mouse.up()
  await expect(intro).toHaveCSS('opacity', '0')
  await expect(page.locator('.content-panel')).toHaveCount(0)
  await central.click()
  await expect(intro).toHaveCSS('opacity', '1')

  await projects.click()
  await expect(intro).toHaveCSS('opacity', '0')
  await expect(page.locator('.selected-work')).toContainText('SafetyHub')
  await page
    .locator('.content-panel')
    .getByRole('button', { name: 'Close details' })
    .click()
  await expect(intro).toHaveCSS('opacity', '1')
  await expect(page.locator('.content-panel')).toHaveCount(0)

  await projects.click()
  await expect(intro).toHaveCSS('opacity', '0')
  await canvas.click({ position: { x: 20, y: 20 } })
  await expect(page.locator('.content-panel')).toHaveCount(0)
  await expect(intro).toHaveCSS('opacity', '1')

  await projects.click()
  await page.goBack()
  await expect(intro).toHaveCSS('opacity', '1')
  await page.goForward()
  await expect(intro).toHaveCSS('opacity', '0')
  await page.keyboard.press('Escape')
  await expect(intro).toHaveCSS('opacity', '1')
})

for (const touchInput of [false, true]) {
  test(`gesture guide appears once per browser with ${touchInput ? 'touch' : 'mouse'} instructions`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      hasTouch: touchInput,
      isMobile: touchInput,
      viewport: touchInput ? { width: 390, height: 844 } : { width: 1280, height: 800 },
    })
    const page = await context.newPage()
    await page.goto('http://127.0.0.1:4173/')
    const guide = page.getByRole('status', { name: 'Graph navigation tip' })
    await expect(guide).toBeVisible()
    await expect(page.locator('.gesture-guide-pointer')).toHaveCSS(
      'animation-name',
      'gesture-slide',
    )
    await expect(guide).toContainText(
      touchInput ? 'Slide one finger' : 'left mouse button',
    )
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem('portfolio:gesture-guide-seen:v1')!)
            .firstVisitedAt,
      ),
    ).toBeTruthy()
    await guide.getByRole('button', { name: 'Got it' }).click()
    await expect(guide).toHaveCount(0)
    await page.reload()
    await expect(page.locator('canvas')).toBeVisible()
    await page.waitForTimeout(500)
    await expect(guide).toHaveCount(0)
    if (!touchInput) {
      await page.getByRole('button', { name: 'List view', exact: true }).click()
      await page.getByRole('button', { name: 'Graph view', exact: true }).click()
      await expect(page.locator('canvas')).toBeVisible()
      await expect(guide).toHaveCount(0)
    }
    await context.close()
  })
}

test('first-visit guide waits for WebGL and tolerates unavailable storage', async ({
  browser,
}) => {
  const unavailable = await browser.newContext()
  const page = await unavailable.newPage()
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext
  })
  await page.goto('http://127.0.0.1:4173/')
  await page.getByRole('button', { name: 'List view', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'A closer look.' })).toBeVisible()
  await expect(page.getByRole('status', { name: 'Graph navigation tip' })).toHaveCount(0)
  expect(
    await page.evaluate(() => localStorage.getItem('portfolio:gesture-guide-seen:v1')),
  ).toBeNull()
  await unavailable.close()

  const blocked = await browser.newContext({ reducedMotion: 'reduce' })
  const blockedPage = await blocked.newPage()
  await blockedPage.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage disabled', 'SecurityError')
      },
    })
  })
  await blockedPage.goto('http://127.0.0.1:4173/')
  const guide = blockedPage.getByRole('status', { name: 'Graph navigation tip' })
  await expect(guide).toBeVisible()
  await expect(blockedPage.locator('.gesture-guide-pointer')).toHaveCSS(
    'animation-name',
    'none',
  )
  await guide.getByRole('button', { name: 'Got it' }).click()
  await blockedPage.getByRole('button', { name: 'Projects 02', exact: true }).click()
  await expect(blockedPage.locator('.content-panel h2')).toHaveText('Projects')
  await blocked.close()
})

test('tablet visitors get the finger-swipe demonstration', async ({ browser }) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 768, height: 1024 },
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/')
  const guide = page.getByRole('status', { name: 'Graph navigation tip' })
  await expect(guide).toBeVisible()
  await expect(guide).toContainText('Slide one finger')
  await page.screenshot({ path: '/tmp/portfolio-tablet-gesture-guide.png' })
  await guide.getByRole('button', { name: 'Got it' }).tap()
  await expect(guide).toHaveCount(0)
  await context.close()
})

test('finger dragging hides the identity and a central-node tap restores it', async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4173/')
  await page
    .getByRole('status', { name: 'Graph navigation tip' })
    .getByRole('button', { name: 'Got it' })
    .tap()
  const intro = page.locator('.identity-intro')
  await expect(intro).toHaveCSS('opacity', '1')
  const canvas = await page.locator('canvas').boundingBox()
  const startX = canvas!.x + 24
  const startY = canvas!.y + 12
  const session = await context.newCDPSession(page)
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y: startY, id: 1 }],
  })
  await expect(intro).toHaveCSS('opacity', '1')
  for (let step = 1; step <= 8; step++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: startX + step * 10, y: startY + step * 3, id: 1 }],
    })
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(intro).toHaveCSS('opacity', '0')
  await expect(page.locator('.content-panel')).toHaveCount(0)
  await page
    .locator('.galaxy-scene')
    .getByRole('button', { name: 'Besher Kitaz', exact: true })
    .tap()
  await expect(intro).toHaveCSS('opacity', '1')
  await context.close()
})

test('header hides after substantial zoom and returns when zooming back out', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page
    .getByRole('status', { name: 'Graph navigation tip' })
    .getByRole('button', { name: 'Got it' })
    .click()
  const intro = page.locator('.identity-intro')
  const canvas = await page.locator('canvas').boundingBox()
  await page.mouse.move(canvas!.x + 20, canvas!.y + 20)
  await page.mouse.wheel(0, -120)
  await expect(intro).toHaveCSS('opacity', '1')
  for (let i = 0; i < 9; i++) {
    await page.mouse.wheel(0, -120)
    await page.waitForTimeout(60)
  }
  await expect(intro).toHaveCSS('opacity', '0')
  await page.mouse.wheel(0, 120)
  await expect(intro).toHaveCSS('opacity', '0')
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(60)
  }
  await expect(intro).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Projects 02', exact: true }).click()
  await expect(intro).toHaveCSS('opacity', '0')
  await page
    .locator('.content-panel')
    .getByRole('button', { name: 'Close details' })
    .click()
  await expect(intro).toHaveCSS('opacity', '1')
})

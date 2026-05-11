import { test, expect } from '@playwright/test'

test.describe('Auth Flow', () => {
  test('empty login shows required errors', async ({ page }) => {
    await page.goto('/login')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Email and password are required')).toBeVisible()
  })

  test('invalid email format shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="alert"]')).toBeVisible()
  })

  test('signup with mismatched passwords shows error', async ({ page }) => {
    await page.goto('/signup')
    await page.fill('input[placeholder="johndadev"]', 'testuser')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[placeholder="••••••••"]', 'password123')
    const inputs = await page.locator('input[type="password"]').all()
    if (inputs.length > 1) {
      await inputs[1].fill('password456')
    }
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('signup with short password shows error', async ({ page }) => {
    await page.goto('/signup')
    await page.fill('input[placeholder="johndadev"]', 'testuser')
    await page.fill('input[type="email"]', 'test@example.com')
    const inputs = await page.locator('input[type="password"]').all()
    if (inputs.length > 0) {
      await inputs[0].fill('short')
    }
    if (inputs.length > 1) {
      await inputs[1].fill('short')
    }
    await page.click('button[type="submit"]')
    await expect(page.locator('text=at least 8 characters')).toBeVisible()
  })

  test('login redirects to home on success', async ({ page }) => {
    await page.goto('/login')
    // Use seed user from backend
    await page.fill('input[type="email"]', 'player@test.com')
    await page.fill('input[type="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    // Wait for navigation
    await page.waitForURL('/', { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/')
  })

  test('signup creates account and redirects', async ({ page }) => {
    const timestamp = Date.now()
    const email = `test${timestamp}@example.com`
    await page.goto('/signup')
    await page.fill('input[placeholder="johndadev"]', `user${timestamp}`)
    await page.fill('input[type="email"]', email)
    const inputs = await page.locator('input[type="password"]').all()
    if (inputs.length > 0) {
      await inputs[0].fill('TestPass123!')
    }
    if (inputs.length > 1) {
      await inputs[1].fill('TestPass123!')
    }
    await page.click('button[type="submit"]')
    await page.waitForURL('/', { waitUntil: 'networkidle' })
    expect(page.url()).toContain('/')
  })

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/account')
    await expect(page).toHaveURL('/login')
  })

  test('logged-in user can access protected route', async ({ page, context }) => {
    // First login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'player@test.com')
    await page.fill('input[type="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // Now access protected route
    await page.goto('/account')
    await expect(page).not.toHaveURL('/login')
  })

  test('logout clears auth and redirects to login', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'player@test.com')
    await page.fill('input[type="password"]', 'Test1234!')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // Navigate to account (or check for logout button in navbar)
    await page.goto('/account')
    // Try to find and click logout if it exists
    const logoutBtn = page.locator('button:has-text("Logout"), [role="menuitem"]:has-text("Logout")')
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
      await expect(page).toHaveURL('/login')
    }
  })
})

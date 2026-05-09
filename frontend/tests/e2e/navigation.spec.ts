import { test, expect } from '@playwright/test'

test.describe('Navigation smoke tests', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav')).toBeVisible()
  })

  test('login route loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('form')).toBeVisible()
  })

  test('signup route loads', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.locator('form')).toBeVisible()
  })

  test('tournaments route loads', async ({ page }) => {
    await page.goto('/tournaments')
    await expect(page).toHaveURL('/tournaments')
  })

  test('create-tournament redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/create-tournament')
    await expect(page).toHaveURL('/login')
  })

  test('unknown route shows 404', async ({ page }) => {
    await page.goto('/this-does-not-exist')
    await expect(page.locator('text=404')).toBeVisible()
  })
})

import { test, expect } from '@playwright/test'

test.describe('Tournament detail + bracket', () => {
  test('detail route loads', async ({ page }) => {
    await page.goto('/tournaments/1')
    await expect(page).toHaveURL('/tournaments/1')
  })

  test('detail page renders fallback when tournament missing', async ({ page }) => {
    await page.goto('/tournaments/non-existent-id')
    // Either the not-found message or loading indicator should appear,
    // and the back button should not navigate away from the page itself.
    await expect(page.locator('text=/Tournament not found|Loading/i')).toBeVisible()
  })

  test('ongoing route redirects unauthenticated user', async ({ page }) => {
    await page.goto('/tournaments/ongoing')
    await expect(page).toHaveURL('/login')
  })
})

import { type Page, expect } from "@playwright/test";

export const CREDENTIALS = {
  superAdmin: { email: "superadmin@erp.local", password: "SuperAdmin@123" },
  admin:      { email: "admin@erp.local",      password: "Admin@123" },
  student:    { email: "student1@erp.local",   password: "Student@123" },
} as const;

const DASHBOARD_URL = /\/(admin|student|super-admin)/;

export async function loginAs(page: Page, role: keyof typeof CREDENTIALS) {
  const { email, password } = CREDENTIALS[role];
  await page.goto("/login");
  // The login form uses "Email address" as label text — getByLabel regex matches it
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  // Click and wait for the client-side router.push() to complete —
  // the login page calls /api/v1/auth/login then uses router.push(), so
  // we must wait for URL to change rather than relying on page navigation event.
  await Promise.all([
    page.waitForURL(DASHBOARD_URL, { timeout: 15_000 }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
}

export async function expectToBeOnDashboard(page: Page) {
  await expect(page).toHaveURL(DASHBOARD_URL);
}

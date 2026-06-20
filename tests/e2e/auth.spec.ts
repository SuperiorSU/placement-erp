import { test, expect } from "@playwright/test";
import { loginAs, CREDENTIALS } from "./helpers";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to /login", async ({ page }) => {
    await page.goto("/admin/companies");
    await expect(page).toHaveURL(/\/login/);
  });

  test("admin login succeeds and redirects to admin dashboard", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page).toHaveURL(/\/admin/);
  });

  test("student login succeeds and redirects to student dashboard", async ({ page }) => {
    await loginAs(page, "student");
    await expect(page).toHaveURL(/\/student/);
  });

  test("super-admin login succeeds and redirects to super-admin dashboard", async ({ page }) => {
    await loginAs(page, "superAdmin");
    await expect(page).toHaveURL(/\/super-admin/);
  });

  test("invalid credentials shows error message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email address/i).fill("notreal@erp.local");
    await page.getByLabel(/^password$/i).fill("WrongPass@123");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Should stay on login page with an error visible
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("student cannot access admin routes — redirects to /login", async ({ page }) => {
    await loginAs(page, "student");
    await page.goto("/admin/companies");
    // Middleware redirects wrong-role users to /login
    await expect(page).toHaveURL(/\/login/);
  });

  test("logout clears session", async ({ page }) => {
    await loginAs(page, "admin");
    await expect(page).toHaveURL(/\/admin/);
    await Promise.all([
      page.waitForURL(/\/login/, { timeout: 15_000 }),
      page.getByRole("button", { name: /sign out/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/login/);
    // Confirm session is gone: protected page now redirects
    await page.goto("/admin/companies");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("has email and password fields with correct labels", async ({ page }) => {
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
  });

  test("submit button is present and enabled", async ({ page }) => {
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });

  test("shows Placement ERP branding", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /placement erp/i })).toBeVisible();
  });
});

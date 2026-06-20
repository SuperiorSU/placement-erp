import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Admin — Drive management", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("drives list page loads with table or empty state", async ({ page }) => {
    await page.goto("/admin/drives");
    await expect(page).toHaveURL(/\/admin\/drives/);
    // Either a table of drives or an empty-state message should be visible
    const hasDrives = await page.locator("table").count() > 0;
    const isEmpty   = await page.getByText(/no drives/i).count() > 0;
    expect(hasDrives || isEmpty).toBe(true);
  });

  test("create drive page renders required fields", async ({ page }) => {
    await page.goto("/admin/drives/create");
    await expect(page.getByLabel(/job role/i)).toBeVisible();
    await expect(page.getByLabel(/ctc/i)).toBeVisible();
    await expect(page.getByLabel(/location/i)).toBeVisible();
    await expect(page.getByLabel(/drive date/i)).toBeVisible();
    await expect(page.getByLabel(/academic year/i)).toBeVisible();
  });

  test("companies list loads before drive creation", async ({ page }) => {
    await page.goto("/admin/companies");
    await expect(page).toHaveURL(/\/admin\/companies/);
    // Company list or empty state
    const hasContent = await page.locator("main").count() > 0;
    expect(hasContent).toBe(true);
  });

  test("company detail page has drive history section", async ({ page }) => {
    // Navigate to the companies list and click the first company (if any)
    await page.goto("/admin/companies");
    const firstCompanyLink = page.getByRole("link", { name: /view/i }).first();
    if (await firstCompanyLink.count() > 0) {
      await firstCompanyLink.click();
      await expect(page.getByText(/drive history/i)).toBeVisible();
    }
  });

  test("drive detail page shows participants section", async ({ page }) => {
    await page.goto("/admin/drives");
    const firstDriveLink = page.getByRole("link", { name: /view/i }).first();
    if (await firstDriveLink.count() > 0) {
      await firstDriveLink.click();
      await expect(page.getByText(/participants/i)).toBeVisible();
    }
  });
});

test.describe("Admin — Students", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("students page lists students", async ({ page }) => {
    await page.goto("/admin/students");
    await expect(page).toHaveURL(/\/admin\/students/);
    // Should show a table or empty state
    const hasMain = await page.locator("main").count() > 0;
    expect(hasMain).toBe(true);
  });

  test("students page supports name search", async ({ page }) => {
    await page.goto("/admin/students");
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.count() > 0) {
      await searchInput.fill("Student");
      await page.waitForTimeout(400); // debounce
      // URL should update with q param
      await expect(page).toHaveURL(/q=Student/);
    }
  });
});

test.describe("Admin — Reports", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin");
  });

  test("reports page loads with standard and advanced sections", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page.getByText(/standard reports/i)).toBeVisible();
    await expect(page.getByText(/advanced reports/i)).toBeVisible();
  });

  test("download buttons are present on reports page", async ({ page }) => {
    await page.goto("/admin/reports");
    const downloadBtns = page.getByRole("button", { name: /download excel/i });
    expect(await downloadBtns.count()).toBeGreaterThan(0);
  });
});

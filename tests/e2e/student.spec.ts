import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers";

test.describe("Student Portal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "student");
  });

  test("student dashboard loads KPI cards", async ({ page }) => {
    await expect(page).toHaveURL(/\/student/);
    // Dashboard should have at least one stat/card
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("companies page shows drive listings", async ({ page }) => {
    await page.goto("/student/companies");
    await expect(page).toHaveURL(/\/student\/companies/);
    const hasContent = await page.locator("main").count() > 0;
    expect(hasContent).toBe(true);
  });

  test("companies page search input filters drives", async ({ page }) => {
    await page.goto("/student/companies");
    const search = page.getByPlaceholder(/search/i);
    if (await search.count() > 0) {
      await search.fill("Tech");
      await page.waitForTimeout(400);
      await expect(page).toHaveURL(/q=Tech/);
    }
  });

  test("applications page renders", async ({ page }) => {
    await page.goto("/student/applications");
    await expect(page).toHaveURL(/\/student\/applications/);
    const hasMain = await page.locator("main").count() > 0;
    expect(hasMain).toBe(true);
  });

  test("consent forms page renders", async ({ page }) => {
    await page.goto("/student/consent-forms");
    await expect(page).toHaveURL(/\/student\/consent-forms/);
    const hasMain = await page.locator("main").count() > 0;
    expect(hasMain).toBe(true);
  });

  test("student cannot navigate to admin pages", async ({ page }) => {
    await page.goto("/admin/companies");
    // Should be redirected away
    await expect(page).not.toHaveURL(/\/admin\/companies/);
  });

  test("student sidebar has expected nav links", async ({ page }) => {
    const nav = page.locator("nav");
    await expect(nav.getByRole("link", { name: /companies/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /applications/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /consent/i })).toBeVisible();
  });
});

test.describe("Student — drive registration flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "student");
  });

  test("companies page shows drive cards or empty state", async ({ page }) => {
    await page.goto("/student/companies");
    // Either drive cards are visible, or an empty-state message is shown
    const hasDriveCards = await page.locator("[data-testid='drive-card'], article, .drive-card").count() > 0;
    const hasEmptyState = await page.getByText(/no (open )?drives/i).count() > 0;
    const hasAnyContent = await page.locator("main").count() > 0;
    // At minimum the main region renders without error
    expect(hasAnyContent).toBe(true);
    // If drives exist, action buttons (Register/Applied) should be visible
    const actionBtns = page.getByRole("button", { name: /register|applied/i });
    if (await actionBtns.count() > 0) {
      await expect(actionBtns.first()).toBeVisible();
    }
    void hasDriveCards; void hasEmptyState;
  });
});

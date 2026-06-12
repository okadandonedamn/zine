import { test, expect } from "@playwright/test";

/**
 * スモークテスト: 各Phaseの「生きている証拠」を1〜2本ずつ。
 * モックデータ(src/lib/mock-data.ts)前提。データを変えたらここも見直す。
 */

test.describe("独りの記録(Phase 1-4)", () => {
  test("ホームのタイムラインにカードが流れる", async ({ page }) => {
    await page.goto("/home");
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("作品の書架が表示される", async ({ page }) => {
    await page.goto("/works");
    await expect(page.getByRole("heading", { name: "作品", exact: true })).toBeVisible();
    await expect(page.getByText("花様年華").first()).toBeVisible();
  });
});

test.describe("社交(Phase 5)", () => {
  test("Followingタブにタグフォロー由来の活動が混ざる", async ({ page }) => {
    await page.goto("/home?tab=following");
    await expect(page.locator("article").first()).toBeVisible();
    // フォロー外のユーザーだが、フォロー中タグ「見ることの訓練」が付いた投稿は流れる
    await expect(page.getByText("路地裏のキュレーター").first()).toBeVisible();
  });
});

test.describe("語り場と安全(Phase 6)", () => {
  test("スレッドが表示され、削除済みレスは行が保全される", async ({ page }) => {
    await page.goto("/threads/t1");
    await expect(page.getByRole("heading", { name: /花様年華/ })).toBeVisible();
    await expect(page.getByText("このレスは削除されました")).toBeVisible();
  });

  test("NGワード入りのレスは拒否される", async ({ page }) => {
    await page.goto("/threads/t1");
    await page.locator("textarea").fill("死ね");
    await page.getByRole("button", { name: "レスを書き込む" }).click();
    await expect(page.getByText("不適切な表現が含まれている")).toBeVisible();
  });

  test("moderatorにはモデレーション画面が見える", async ({ page }) => {
    await page.goto("/moderation");
    await expect(page.getByRole("heading", { name: "モデレーション" })).toBeVisible();
    await expect(page.getByText("未対応(2)")).toBeVisible();
  });
});

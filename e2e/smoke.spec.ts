import { expect, test } from "@playwright/test";

test.describe("タイムライン中心UI", () => {
  test("ホームで3種類のタイムラインを切り替えられる", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByRole("link", { name: "フォロー中" })).toBeVisible();
    await expect(page.getByRole("link", { name: "最新" })).toBeVisible();
    await expect(page.getByRole("link", { name: "おすすめ" })).toBeVisible();

    const latestHref = await page
      .locator('main a[href="/home?feed=latest"]')
      .first()
      .getAttribute("href");
    expect(latestHref).toBe("/home?feed=latest");
    await page.goto(latestHref!);
    await expect(page).toHaveURL(/feed=latest/);
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("ホームで5機能フィルタをURLに保持できる", async ({ page }) => {
    await page.goto("/home?feed=latest&types=record");
    await expect(page).toHaveURL(/types=record/);
    await expect(page.locator("article").first()).toContainText("RECORD");

    await page.goto("/home?feed=latest&types=post,review,record");
    await expect(page).toHaveURL(/types=post%2Creview%2Crecord|types=post,review,record/);
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("短文フィルタで引用とリポストを表示できる", async ({ page }) => {
    await page.goto("/home?feed=latest&types=post");
    await expect(page).toHaveURL(/types=post/);
    await expect(page.getByText("REPOST").first()).toBeVisible();
    await expect(page.getByText("QUOTE").first()).toBeVisible();

    await page.goto("/posts?feed=latest");
    await expect(page.getByText("REPOST").first()).toBeVisible();
  });

  test("機能別ページでも3種類のタイムラインを持つ", async ({ page }) => {
    await page.goto("/reviews?feed=latest");
    await expect(page.getByRole("heading", { name: "レビュー" })).toBeVisible();
    await expect(page.getByRole("link", { name: "フォロー中" })).toBeVisible();
    await expect(page.getByRole("link", { name: "最新" })).toBeVisible();
    await expect(page.getByRole("link", { name: "おすすめ" })).toBeVisible();
    await expect(page.locator("article").first()).toContainText("REVIEW");
  });
});

test.describe("記録", () => {
  test("記録フォームでラフ記録とエキスパートモードを切り替えられる", async ({ page }) => {
    await page.goto("/records/new");
    await expect(page.getByRole("button", { name: "ラフ記録" })).toBeVisible();
    await page.getByRole("button", { name: "エキスパートモード" }).click();
    await expect(page.getByText("画像URL")).toBeVisible();
    await expect(page.getByText("集中度")).toBeVisible();
    await expect(page.getByText("満足度")).toBeVisible();
  });

  test("記録詳細で画像・コメント・数値を見返せる", async ({ page }) => {
    await page.goto("/records/rec1");
    await expect(page.getByRole("heading", { name: "鑑賞記録" })).toBeVisible();
    await expect(page.getByText("コメント / ノート")).toBeVisible();
    await expect(page.getByText("数値メモ")).toBeVisible();
    await expect(page.locator("img").first()).toBeVisible();
  });

  test("年間総括で年次の記録を見返せる", async ({ page }) => {
    await page.goto("/records/recap");
    await expect(page.getByRole("heading", { name: "年間総括" })).toBeVisible();
    await expect(page.getByText("YEARLY RECAP").first()).toBeVisible();
    await expect(page.getByText("月別の記録").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "画像として保存" })).toBeVisible();
  });
});

test.describe("既存の主要導線", () => {
  test("作品の書架が表示される", async ({ page }) => {
    await page.goto("/works");
    await expect(page.getByRole("heading", { name: "作品", exact: true })).toBeVisible();
    await expect(page.getByText("花様年華").first()).toBeVisible();
  });

  test("語り場で削除済みレスを保持して表示する", async ({ page }) => {
    await page.goto("/threads/t1");
    await expect(page.getByRole("heading", { name: /花様年華/ })).toBeVisible();
    await expect(page.getByText("このレスは削除されました")).toBeVisible();
  });

  test("語り場レスにいいねできる", async ({ page }) => {
    await page.goto("/threads/t1");
    const likeButton = page.getByRole("button", { name: "レスにいいね" }).first();
    await expect(likeButton).toHaveAttribute("aria-pressed", "false");
    const before = Number((await likeButton.textContent())?.trim() ?? "0");
    await likeButton.click();
    const likedButton = page.getByRole("button", { name: "レスのいいねを取り消す" }).first();
    const loginMessage = page.getByText(/ログインが必要|サインイン/).first();
    await expect
      .poll(async () => {
        if ((await likedButton.count()) > 0 && !(await likedButton.isDisabled())) return "liked";
        if (await loginMessage.isVisible().catch(() => false)) return "login";
        return "pending";
      })
      .toMatch(/liked|login/);
    if (await likedButton.isVisible().catch(() => false)) {
      await expect(likedButton).toHaveAttribute("aria-pressed", "true");
      await expect(likedButton).toHaveText(String(before + 1));
    } else {
      await expect(loginMessage).toBeVisible();
    }
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
    await expect(page.getByRole("heading", { name: /未対応.*2/ })).toBeVisible();
  });
});

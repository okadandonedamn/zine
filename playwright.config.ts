import { defineConfig } from "@playwright/test";

/**
 * スモークテスト(設計書v1.1: 各Phase完了時に1〜2本)。
 * Supabase環境変数なし=モックモードの dev サーバーに対して実行する。
 * 実行: npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // devサーバーはルート初回コンパイルが重いので直列で流す
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
  },
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100/home",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

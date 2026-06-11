import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  AvatarUploader,
  ProfileForm,
  SignOutButton,
} from "@/components/settings/settings-forms";
import { getCurrentUser } from "@/lib/data";

export const metadata = { title: "設定" };

export default async function SettingsPage() {
  const me = await getCurrentUser();

  if (!me) {
    return (
      <div className="max-w-xl px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl font-bold">設定</h1>
        <Card className="mt-6 space-y-3 p-8 text-center">
          <p className="font-display text-lg font-semibold">ログインが必要です</p>
          <Link href="/login">
            <Button>ログインへ</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">設定</h1>

      <Card className="mt-6 space-y-5 p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
          プロフィール
        </h2>
        <AvatarUploader user={me} />
        <ProfileForm user={me} />
      </Card>

      <Card className="mt-4 flex items-center justify-between p-5">
        <div>
          <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
            テーマ
          </h2>
          <p className="mt-1 text-xs text-subtle">
            ダーク(映画館の暗がり)とライト(古書店の昼)を切り替えます。
          </p>
        </div>
        <ThemeToggle />
      </Card>

      <Card className="mt-4 space-y-3 p-5">
        <h2 className="font-display text-sm font-semibold tracking-wider text-muted">
          公開設定
        </h2>
        <label className="flex items-center justify-between text-sm">
          鑑賞記録をデフォルトで公開する
          <input type="checkbox" defaultChecked className="accent-(--accent)" />
        </label>
        <label className="flex items-center justify-between text-sm">
          目標の達成をタイムラインに流す
          <input type="checkbox" defaultChecked className="accent-(--accent)" />
        </label>
        <label className="flex items-center justify-between text-sm">
          ネタバレを含むレビューを自動で畳む
          <input type="checkbox" defaultChecked className="accent-(--accent)" />
        </label>
      </Card>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}

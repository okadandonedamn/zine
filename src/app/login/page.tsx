"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseEnabled) return;
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage("ログインできませんでした: " + error.message);
        setLoading(false);
        return;
      }
      router.push("/home");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage("登録できませんでした: " + error.message);
        setLoading(false);
        return;
      }
      if (data.session) {
        // 新規登録 → オンボーディング(10作品に星をつけて本棚を生かす)
        router.push("/welcome");
        router.refresh();
      } else {
        // メール確認が有効なプロジェクトの場合
        setMessage("確認メールを送信しました。メール内のリンクを開いてから、ログインしてください。");
        setLoading(false);
      }
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <Link href="/" className="block text-center">
          <span className="font-display text-4xl font-bold tracking-widest">ZINE</span>
          <span className="mt-1 block text-[10px] tracking-[0.3em] text-subtle">
            CULTURE TIMELINE
          </span>
        </Link>

        {!supabaseEnabled ? (
          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm leading-7 text-muted">
              現在はモックモードで動作しています。
              <br />
              ログインなしで全機能を試せます。
            </p>
            <p className="rounded-md border border-line bg-surface-2 p-3 text-left text-xs leading-6 text-subtle">
              本物の認証を有効にするには、<code>.env.local</code> にSupabaseの
              URLとANON KEYを設定してください(手順はREADME参照)。
            </p>
            <Link href="/home">
              <Button className="w-full">タイムラインへ</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 flex rounded-md border border-line p-1 text-sm">
              {(
                [
                  { key: "signin", label: "ログイン" },
                  { key: "signup", label: "新規登録" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setMode(t.key)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-sm py-1.5 transition-colors",
                    mode === t.key ? "bg-surface-2 font-semibold" : "text-subtle",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs text-muted">メールアドレス</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-muted">パスワード</label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6文字以上"
                />
              </div>
              {message && (
                <p className="rounded-md border border-line bg-surface-2 p-3 text-xs leading-6 text-muted">
                  {message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "送信中…" : mode === "signin" ? "ログイン" : "登録する"}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/common/user-avatar";
import { updateAvatarUrl, updateProfile } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/env";
import type { User } from "@/lib/types";

/** プロフィール編集フォーム */
export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const result = await updateProfile({ displayName, username, bio });
    setMessage(result.ok ? "保存しました" : result.error);
    setSaving(false);
    if (result.ok) router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs text-muted">表示名</label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-muted">
          ユーザー名(半角英数と_、3〜20文字)
        </label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs text-muted">自己紹介</label>
        <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      {message && <p className="text-xs text-muted">{message}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}

/** アバター画像のアップロード(Supabase Storage: avatars バケット) */
export function AvatarUploader({ user }: { user: User }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!supabaseEnabled) {
      setMessage("Supabase接続後に使えます(モックモード)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("2MB以下の画像にしてください");
      return;
    }
    setUploading(true);
    setMessage(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (error) {
      setMessage("アップロードに失敗しました: " + error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    // キャッシュ避けにタイムスタンプを付ける
    const result = await updateAvatarUrl(`${data.publicUrl}?v=${Date.now()}`);
    setMessage(result.ok ? "アバターを更新しました" : result.error);
    setUploading(false);
    if (result.ok) router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar user={user} size="lg" link={false} />
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={14} />
          {uploading ? "アップロード中…" : "画像を変更"}
        </Button>
        {message && <p className="text-xs text-muted">{message}</p>}
      </div>
    </div>
  );
}

/** ログアウト */
export function SignOutButton() {
  const router = useRouter();
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  if (!supabaseEnabled) return null;
  return (
    <Button variant="outline" onClick={handleSignOut}>
      <LogOut size={15} />
      ログアウト
    </Button>
  );
}

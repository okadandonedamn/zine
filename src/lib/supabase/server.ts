import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** サーバー(Server Components / Server Actions)用のSupabaseクライアント */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component から呼ばれた場合は書き込めないが、
            // middleware がセッションを更新するので問題ない
          }
        },
      },
    },
  );
}

export const metadata = {
  title: "ZINEについて",
  description: "ZINEの利用規約・プライバシーポリシー・連絡先。",
};

/**
 * 利用規約・プライバシーポリシー・通報窓口の簡易版。
 * 設計書v1.1 Phase 2 の公開条件(友人公開前に必須)。
 * TMDB帰属表示の義務もこのページが担う(設計書 §6-5)。
 */
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold">ZINEについて</h1>
      <p className="mt-3 leading-7 text-muted">
        ZINEは、映画や文学などの文化的な鑑賞体験を記録し、批評を書き、
        同じ作品を愛する人と語り合うための小さなSNSです。
        刺激の速さではなく、書かれた言葉の確かさを大切にしています。
      </p>

      <section className="mt-10">
        <h2 className="border-b border-line pb-2 font-display text-lg font-semibold">
          利用規約(簡易版)
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted">
          <li>
            本サービスは個人が運営する試験的なサービスです。予告なく機能の変更・
            停止を行うことがあります。データの保全には努めますが、完全性は保証されません。
          </li>
          <li>
            投稿されたレビュー・記事・コメント等の著作権は投稿者本人に帰属します。
            運営は、サービスの提供(画面への表示・タイムラインへの配信)に必要な範囲でのみ
            これを利用します。
          </li>
          <li>
            次の行為を禁止します: 他者への誹謗中傷・差別的言動、著作権など第三者の権利を
            侵害する投稿、スパム・宣伝目的の利用、なりすまし、その他法令に違反する行為。
          </li>
          <li>
            禁止行為が確認された場合、運営は投稿の非表示(削除済み表示)や
            アカウントの利用停止を行うことがあります。
          </li>
          <li>
            投稿の「削除」は原則として論理削除(画面上の非表示)です。
            アカウントを削除した場合、あなたのデータは物理的に消去されます。
          </li>
          <li>本規約は必要に応じて改定されます。重要な変更はサービス内で告知します。</li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="border-b border-line pb-2 font-display text-lg font-semibold">
          プライバシーポリシー(簡易版)
        </h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-muted">
          <li>
            取得する情報: アカウント登録時のメールアドレス、プロフィール情報、
            投稿・鑑賞記録などあなたが作成したコンテンツ。
          </li>
          <li>
            利用目的: 本サービスの提供・改善、不正利用の防止。
            これ以外の目的での利用や、第三者への提供は行いません。
          </li>
          <li>
            データの保管: 認証とデータベースに Supabase を利用しています。
            メールアドレスが他の利用者に公開されることはありません。
          </li>
          <li>
            Cookieは、ログイン状態の維持(セッション管理)のためにのみ使用します。
            広告・トラッキング目的のCookieは使用しません。
          </li>
          <li>
            時間ログ(鑑賞の日記)は既定で非公開です。公開範囲は投稿ごとに選べます。
          </li>
          <li>
            アカウントを削除すると、プロフィール・投稿・記録などの本人データは
            データベースから物理的に削除されます。
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="border-b border-line pb-2 font-display text-lg font-semibold">
          通報・連絡先
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted">
          規約に違反する投稿を見つけた場合は、運営までお知らせください。
          確認のうえ、非表示などの対応を行います。連絡は{" "}
          <a
            href="https://github.com/okadandonedamn/zine/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            GitHubリポジトリのIssue
          </a>{" "}
          からどうぞ。
        </p>
      </section>

      <section className="mt-10">
        <h2 className="border-b border-line pb-2 font-display text-lg font-semibold">
          クレジット
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p className="mt-2 text-sm leading-7 text-muted">
          書籍の作品情報は openBD API の提供データを利用しています。
        </p>
      </section>

      <p className="mt-12 border-t border-line pt-4 text-xs text-subtle">
        最終更新: 2026年6月12日
      </p>
    </div>
  );
}

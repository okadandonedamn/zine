import { WelcomeRater } from "@/components/work/welcome-rater";
import { getWorks } from "@/lib/data";
import { ACTIVE_CATEGORIES } from "@/lib/types";

export const metadata = { title: "ようこそ" };

export default async function WelcomePage() {
  // UI上のアクティブカテゴリ(映画+文学)から候補を出す
  const works = (await getWorks())
    .filter((w) => ACTIVE_CATEGORIES.includes(w.category))
    .slice(0, 20);

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold">ようこそ、ZINEへ</h1>
      <p className="mt-2 max-w-lg text-sm leading-7 text-muted">
        まず、観たことのある作品・読んだことのある作品に星をつけてください。
        10作品で、あなたの本棚は初日から生きた書斎になります。
      </p>
      <div className="mt-4">
        <WelcomeRater works={works} />
      </div>
    </div>
  );
}

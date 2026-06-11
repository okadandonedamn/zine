import { notFound } from "next/navigation";
import { Timeline } from "@/components/timeline/timeline";
import { getUserByUsername, getUserFeed } from "@/lib/data";

export default async function ProfileRecordsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();
  // 非公開の記録はRLS+visibilityフィルタで他人には見えない
  const items = (await getUserFeed(user.id, "record")).filter(
    (f) => f.type !== "record" || f.record.visibility === "public",
  );
  return <Timeline items={items} />;
}

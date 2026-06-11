import { notFound } from "next/navigation";
import { Timeline } from "@/components/timeline/timeline";
import { getUserByUsername, getUserFeed } from "@/lib/data";

export default async function ProfileReviewsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();
  const items = await getUserFeed(user.id, "review");
  return <Timeline items={items} />;
}

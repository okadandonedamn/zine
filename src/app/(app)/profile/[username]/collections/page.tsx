import { notFound } from "next/navigation";
import { EmptyState } from "@/components/common/empty-state";
import { CollectionCard } from "@/components/collection/collection-card";
import { getCollectionsByUser, getUserByUsername } from "@/lib/data";

export default async function ProfileCollectionsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await getUserByUsername(username);
  if (!user) notFound();
  const collections = await getCollectionsByUser(user.id);

  if (collections.length === 0) {
    return (
      <div className="p-6">
        <EmptyState title="まだコレクションがありません" />
      </div>
    );
  }
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
      {collections.map((c) => (
        <CollectionCard key={c.id} collection={c} />
      ))}
    </div>
  );
}

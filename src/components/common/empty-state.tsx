export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line py-16 text-center">
      <p className="font-display text-lg text-muted">{title}</p>
      {description && <p className="max-w-sm text-sm text-subtle">{description}</p>}
      {action}
    </div>
  );
}

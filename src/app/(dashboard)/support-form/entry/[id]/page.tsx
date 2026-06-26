export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Edit Entry</h1>
      <p className="text-sm text-muted-foreground">Entry ID: {id}</p>
    </div>
  );
}

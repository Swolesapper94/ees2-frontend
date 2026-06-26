export default function NewEntryPage() {
  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Log Entry</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Record an objective or accomplishment for the rating period.
      </p>
      {/* TODO: QuickEntryBar / entry form → POST /api/support-forms/:id/entries */}
    </div>
  );
}

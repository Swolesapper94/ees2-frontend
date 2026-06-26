export default function AdminUnitsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Units</h1>
      <p className="text-sm text-muted-foreground">
        Manage the unit hierarchy (company / battalion / brigade).
      </p>
      {/* TODO: unit tree → GET/POST /api/units */}
    </div>
  );
}

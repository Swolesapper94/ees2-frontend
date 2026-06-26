export default function AdminUsersPage() {
  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Users</h1>
      <p className="text-sm text-muted-foreground">
        Manage soldier accounts, ranks, and roles.
      </p>
      {/* TODO: user table → GET/POST /api/users */}
    </div>
  );
}

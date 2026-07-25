export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-start justify-center overflow-y-auto bg-background p-4 py-6 lg:items-center">
      {children}
    </div>
  );
}

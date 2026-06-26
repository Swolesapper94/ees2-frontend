import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          EES 2.0
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          A modern, soldier-focused replacement for the Army&apos;s evaluation
          system. AI-assisted NCOER writing with continuous support form capture.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="rounded-sm border border-border px-5 py-2.5 text-sm font-medium"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}

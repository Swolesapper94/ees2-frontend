import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SupportFormPage() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Form</h1>
          <p className="text-sm text-muted-foreground">
            Continuous performance log — objectives and accomplishments.
          </p>
        </div>
        <Button asChild>
          <Link href="/support-form/entry/new">Log entry</Link>
        </Button>
      </div>
      {/* TODO: EntryTimeline wired to GET /api/support-forms */}
      <p className="text-sm text-muted-foreground">No entries yet.</p>
    </div>
  );
}

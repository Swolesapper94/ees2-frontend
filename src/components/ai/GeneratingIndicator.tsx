"use client";

export function GeneratingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      Drafting suggestions — review each one before it counts.
    </div>
  );
}

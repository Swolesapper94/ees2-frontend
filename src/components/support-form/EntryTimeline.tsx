"use client";

import { History } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import type { EntryType } from "@/types/evaluation";

export interface SupportEntry {
  id: string;
  type: EntryType;
  text: string;
  createdAt: string;
}

export interface EntryTimelineProps {
  entries: SupportEntry[];
}

export function EntryTimeline({ entries }: EntryTimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No entries logged yet for this period"
        description="Accomplishments and objectives will appear here in chronological order as they're added."
      />
    );
  }
  return (
    <ol className="space-y-3 border-l border-border pl-4">
      {/* TODO: map entries → EntryCard */}
      {entries.map((e) => (
        <li key={e.id} className="text-sm">
          {e.text}
        </li>
      ))}
    </ol>
  );
}

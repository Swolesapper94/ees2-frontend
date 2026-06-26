"use client";

import { useState } from "react";
import type { EntryType } from "@/types/evaluation";

export interface QuickEntryBarProps {
  onAdd?: (type: EntryType, text: string) => void;
}

export function QuickEntryBar({ onAdd }: QuickEntryBarProps) {
  const [type, setType] = useState<EntryType>("ACCOMPLISHMENT");
  const [text, setText] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd?.(type, text.trim());
    setText("");
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as EntryType)}
        className="h-9 rounded-sm border border-input bg-background px-2 text-sm"
      >
        <option value="ACCOMPLISHMENT">Accomplishment</option>
        <option value="OBJECTIVE">Objective</option>
      </select>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What happened?"
        className="h-9 flex-1 rounded-sm border border-input bg-background px-3 text-sm"
      />
      <button
        type="submit"
        className="rounded-sm bg-primary px-3 text-sm text-primary-foreground"
      >
        Log
      </button>
    </form>
  );
}

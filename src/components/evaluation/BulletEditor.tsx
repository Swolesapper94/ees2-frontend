"use client";

import { useState } from "react";
import { BULLET_MAX_CHARS } from "@/lib/utils/form-constants";

export interface BulletEditorProps {
  initialText?: string;
  onSave?: (text: string) => void;
}

export function BulletEditor({ initialText = "", onSave }: BulletEditorProps) {
  const [text, setText] = useState(initialText);
  const remaining = BULLET_MAX_CHARS - text.length;

  return (
    <div className="space-y-1.5">
      <textarea
        value={text}
        maxLength={BULLET_MAX_CHARS}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-sm border border-input bg-background p-2 text-sm"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{remaining} characters left</span>
        <button
          type="button"
          onClick={() => onSave?.(text)}
          className="font-medium text-primary"
        >
          Save
        </button>
      </div>
    </div>
  );
}

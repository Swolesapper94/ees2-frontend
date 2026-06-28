"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api/client";
import { VoiceInput } from "./VoiceInput";

const SECTIONS = [
  "CHARACTER", "PRESENCE", "INTELLECT", "LEADS", "DEVELOPS", "ACHIEVES",
] as const;

type Section = (typeof SECTIONS)[number];
type EntryType = "ACCOMPLISHMENT" | "OBJECTIVE";

interface MobileEntrySheetProps {
  supportFormId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function MobileEntrySheet({ supportFormId, onClose, onSaved }: MobileEntrySheetProps) {
  const [section, setSection] = useState<Section>("ACHIEVES");
  const [entryType, setEntryType] = useState<EntryType>("ACCOMPLISHMENT");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleVoiceTranscript(t: string) {
    setText((prev) => (prev ? `${prev} ${t}` : t));
  }

  async function save() {
    if (!text.trim()) { setError("Enter some text"); return; }
    setSaving(true);
    setError("");
    try {
      await api.post(`/support-forms/${supportFormId}/entries`, {
        section,
        entryType,
        rawText: text.trim(),
      });
      setText("");
      onSaved();
      onClose();
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 md:hidden"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border rounded-t-lg shadow-[var(--shadow-modal)] md:hidden pb-safe"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-4 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Log Entry</h2>
            <button onClick={onClose} className="text-muted-foreground text-sm">✕</button>
          </div>

          {/* Section selector */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Section</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`py-2 text-xs rounded-sm border transition-colors ${
                    section === s
                      ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Entry type */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Type</label>
            <div className="flex gap-2">
              {(["ACCOMPLISHMENT", "OBJECTIVE"] as EntryType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setEntryType(t)}
                  className={`flex-1 py-2.5 text-sm rounded-sm border transition-colors ${
                    entryType === t
                      ? "border-[#1E3A5F] bg-[#1E3A5F] text-white"
                      : "border-border"
                  }`}
                >
                  {t === "ACCOMPLISHMENT" ? "Accomplishment" : "Objective"}
                </button>
              ))}
            </div>
          </div>

          {/* Text area */}
          <div>
            <label className="block text-sm font-medium mb-1.5">What happened?</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe the accomplishment or objective…"
              rows={4}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 text-base resize-none"
              // text-base prevents iOS auto-zoom on focus
            />
            <div className="flex items-center justify-between mt-1">
              <VoiceInput onTranscript={handleVoiceTranscript} />
              <span className={`text-xs ${text.length > 400 ? "text-amber-600" : "text-muted-foreground"}`}>
                {text.length}/400
              </span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Save button — minimum 44px touch target */}
          <button
            onClick={save}
            disabled={saving || !text.trim()}
            className="w-full py-3 text-sm font-medium rounded-sm bg-primary text-primary-foreground disabled:opacity-50 min-h-[44px]"
          >
            {saving ? "Saving…" : "Save Entry"}
          </button>
        </div>
      </div>
    </>
  );
}

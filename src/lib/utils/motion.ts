// ─────────────────────────────────────────────────────────────────
// Motion Tokens (Delta Section 13)
// Keep transitions short — the tool should feel instant.
// Never use duration-500+.
// ─────────────────────────────────────────────────────────────────

export const transitions = {
  panel: "transition-all duration-200 ease-out",
  badge: "transition-colors duration-150",
  section: "transition-opacity duration-300",
  bullet: "transition-all duration-200 ease-in-out",
} as const;

export type TransitionToken = keyof typeof transitions;

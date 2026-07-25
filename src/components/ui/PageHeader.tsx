import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type PageHeaderTone = "army" | "info" | "evidence" | "people" | "warning" | "admin" | "neutral";

const TONES: Record<PageHeaderTone, { surface: string; border: string; icon: string; eyebrow: string }> = {
  army: { surface: "bg-lime-50", border: "border-lime-700", icon: "bg-lime-100 text-lime-900", eyebrow: "text-lime-800" },
  info: { surface: "bg-sky-50", border: "border-sky-600", icon: "bg-sky-100 text-sky-800", eyebrow: "text-sky-700" },
  evidence: { surface: "bg-amber-50", border: "border-amber-500", icon: "bg-amber-100 text-amber-800", eyebrow: "text-amber-700" },
  people: { surface: "bg-emerald-50", border: "border-emerald-600", icon: "bg-emerald-100 text-emerald-800", eyebrow: "text-emerald-700" },
  warning: { surface: "bg-orange-50", border: "border-orange-600", icon: "bg-orange-100 text-orange-800", eyebrow: "text-orange-700" },
  admin: { surface: "bg-rose-50", border: "border-rose-700", icon: "bg-rose-100 text-rose-800", eyebrow: "text-rose-700" },
  neutral: { surface: "bg-card", border: "border-slate-500", icon: "bg-muted text-foreground", eyebrow: "text-muted-foreground" },
};

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  eyebrow?: string;
  tone?: PageHeaderTone;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

/**
 * Shared first-viewport identity for operational pages. Color identifies the
 * work domain, while icon + eyebrow + title keep meaning independent of color.
 */
export function PageHeader({ icon: Icon, title, description, eyebrow, tone = "neutral", actions, meta, className }: PageHeaderProps) {
  const style = TONES[tone];
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-4 rounded-sm border border-l-4 p-4 shadow-card animate-in fade-in slide-in-from-bottom-1 duration-200", style.surface, style.border, className)}>
      <div className="flex min-w-0 items-start gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-sm", style.icon)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          {eyebrow && <p className={cn("text-[10px] font-semibold uppercase tracking-[0.16em]", style.eyebrow)}>{eyebrow}</p>}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
          {meta && <div className="mt-2 text-sm font-medium text-foreground">{meta}</div>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
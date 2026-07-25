import type { LucideIcon } from "lucide-react";
import { Activity, Brain, GraduationCap, ShieldCheck, Target, Users } from "lucide-react";
import type { SectionKey } from "@/types/evaluation";

export type PartIVSectionKey = Extract<
  SectionKey,
  "CHARACTER" | "PRESENCE" | "INTELLECT" | "LEADS" | "DEVELOPS" | "ACHIEVES"
>;

export interface SectionVisual {
  label: string;
  shortLabel: string;
  Icon: LucideIcon;
  surface: string;
  border: string;
  text: string;
  iconSurface: string;
  accent: string;
  segment: string;
}

/**
 * A restrained but distinct visual vocabulary for the six leadership
 * dimensions. These colors identify workspace context; ratings and lifecycle
 * status continue to use their own semantic status palette.
 */
export const SECTION_VISUALS: Record<PartIVSectionKey, SectionVisual> = {
  CHARACTER: {
    label: "Character",
    shortLabel: "CH",
    Icon: ShieldCheck,
    surface: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-900",
    iconSurface: "bg-rose-100 text-rose-800",
    accent: "border-l-rose-500",
    segment: "bg-rose-500",
  },
  PRESENCE: {
    label: "Presence",
    shortLabel: "PR",
    Icon: Activity,
    surface: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-900",
    iconSurface: "bg-sky-100 text-sky-800",
    accent: "border-l-sky-500",
    segment: "bg-sky-500",
  },
  INTELLECT: {
    label: "Intellect",
    shortLabel: "IN",
    Icon: Brain,
    surface: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-950",
    iconSurface: "bg-amber-100 text-amber-800",
    accent: "border-l-amber-500",
    segment: "bg-amber-500",
  },
  LEADS: {
    label: "Leads",
    shortLabel: "LD",
    Icon: Users,
    surface: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-950",
    iconSurface: "bg-emerald-100 text-emerald-800",
    accent: "border-l-emerald-600",
    segment: "bg-emerald-600",
  },
  DEVELOPS: {
    label: "Develops",
    shortLabel: "DV",
    Icon: GraduationCap,
    surface: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-950",
    iconSurface: "bg-teal-100 text-teal-800",
    accent: "border-l-teal-600",
    segment: "bg-teal-600",
  },
  ACHIEVES: {
    label: "Achieves",
    shortLabel: "AC",
    Icon: Target,
    surface: "bg-lime-50",
    border: "border-lime-300",
    text: "text-lime-950",
    iconSurface: "bg-lime-100 text-lime-900",
    accent: "border-l-lime-700",
    segment: "bg-lime-700",
  },
};

export function isPartIVSectionKey(section: string): section is PartIVSectionKey {
  return section in SECTION_VISUALS;
}
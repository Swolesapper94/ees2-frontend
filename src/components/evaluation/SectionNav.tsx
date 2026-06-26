"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export interface SectionNavProps {
  evalId: string;
}

const STEPS: { slug: string; label: string }[] = [
  { slug: "admin", label: "Admin Data" },
  { slug: "duty", label: "Duty Description" },
  { slug: "character", label: "Character" },
  { slug: "presence", label: "Presence" },
  { slug: "intellect", label: "Intellect" },
  { slug: "leads", label: "Leads" },
  { slug: "develops", label: "Develops" },
  { slug: "achieves", label: "Achieves" },
  { slug: "senior-rater", label: "Senior Rater" },
  { slug: "review", label: "Review" },
  { slug: "sign", label: "Sign" },
];

export function SectionNav({ evalId }: SectionNavProps) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {STEPS.map((step) => {
        const href = `/evaluations/${evalId}/${step.slug}`;
        const active = pathname === href;
        return (
          <Link
            key={step.slug}
            href={href}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm",
              active
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50",
            )}
          >
            {step.label}
          </Link>
        );
      })}
    </nav>
  );
}

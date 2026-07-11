"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { rankAbbr } from "@/lib/utils/army-ranks";

interface RankInsigniaProps {
  rank: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: "h-6 w-6 text-[9px]",
  md: "h-8 w-8 text-[10px]",
  lg: "h-12 w-12 text-xs",
} as const;

/**
 * Rank insignia badge — renders the insignia image from
 * `/public/ranks/{RANK}.svg` if present, otherwise falls back to a
 * text badge with the rank abbreviation (e.g. "CPT", "1LT", "SFC").
 *
 * To add real artwork: drop an SVG named after the Rank enum value into
 * `public/ranks/`, e.g. `public/ranks/CPT.svg`, `public/ranks/FIRST_LT.svg`,
 * `public/ranks/SFC.svg`. Official U.S. Army rank insignia are U.S.
 * government works (public domain) — Wikimedia Commons' "Rank insignia of
 * the United States Army" category is a solid source.
 *
 * Current coverage (2026-07): SGT, SSG, SFC, MSG, FIRST_SERGEANT, CSM, SMA,
 * SECOND_LT, FIRST_LT, CPT, MAJ, LTC, COL, BG, MG, LTG, GEN. Missing: SGM,
 * WO1/CW2/CW3/CW4/CW5, GA, and junior enlisted PVT/PV2/PFC/SPC/CPL — these
 * fall back to the text badge until artwork is added.
 */
export function RankInsignia({ rank, size = "md", className }: RankInsigniaProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <div
        className={cn("relative flex-shrink-0", SIZE_MAP[size], className)}
        suppressHydrationWarning
      >
        <Image
          src={`/ranks/${rank}.svg`}
          alt={`${rankAbbr(rank)} insignia`}
          fill
          className="object-contain"
          sizes="48px"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted font-bold text-muted-foreground",
        SIZE_MAP[size],
        className,
      )}
      title={`${rank} insignia not yet uploaded`}
      suppressHydrationWarning
    >
      {rankAbbr(rank)}
    </div>
  );
}

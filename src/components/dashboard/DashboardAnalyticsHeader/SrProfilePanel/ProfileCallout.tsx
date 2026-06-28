"use client";

interface ProfileCalloutProps {
  grade: string;
  mqPct: number;
  cap: number;
  recommended: number;
  cushion: number;
  misfire: boolean;
  approaching: boolean;
  newProfile: boolean;
}

/**
 * Dynamic status callout below distribution bars.
 * Spec §6d — four states: misfire, approaching, new profile, all clear.
 */
export function ProfileCallout({
  grade,
  mqPct,
  cap,
  recommended,
  cushion,
  misfire,
  approaching,
  newProfile,
}: ProfileCalloutProps) {
  const displayGrade = grade === "FIRST_SERGEANT" ? "1SG" : grade;

  if (misfire) {
    return (
      <div className="mt-3 rounded-md px-3 py-2 bg-amber-50 border border-amber-300 text-xs text-amber-800">
        <strong>Misfire risk:</strong> Your MQ rate for {displayGrade} is {mqPct}% — above the{" "}
        {cap}% cap. The next MOST QUALIFIED rating at this grade will be downgraded at HRC.
      </div>
    );
  }

  if (approaching) {
    return (
      <div className="mt-3 rounded-md px-3 py-2 bg-amber-50 border border-amber-200 text-xs text-amber-800">
        <strong>Approaching cap:</strong> You have {cushion}pp of cushion remaining for{" "}
        {displayGrade}. Limit MQ ratings at this grade until your population grows.
      </div>
    );
  }

  if (newProfile) {
    return (
      <div className="mt-3 rounded-md px-3 py-2 bg-blue-50 border border-blue-200 text-xs text-blue-800">
        <strong>New profile:</strong> Your first MOST QUALIFIED rating at {displayGrade} will always
        process as MOST QUALIFIED regardless of profile, per DA PAM 623-3.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-md px-3 py-2 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
      Profile is credible for {displayGrade}. {cushion} percentage point{cushion !== 1 ? "s" : ""} of
      cushion remaining.
    </div>
  );
}

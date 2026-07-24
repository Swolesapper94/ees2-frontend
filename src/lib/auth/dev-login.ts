import { clearClientApiCache, notifyAuthChanged } from "@/lib/api/cache";

// ─────────────────────────────────────────────────────────────────
// Dev Login & CAC Simulation (Delta Section 16)
//
// In production, rank/name/unit/chain come from IPPS-A via CAC auth.
// For MVP/demo, these profiles simulate exactly what CAC would provide,
// so any rank's experience can be demoed without a real CAC card.
//
// NOTE: For a profile to authenticate, the backend's dev-user map and the
// seed data must contain a matching `dev:<email>:testpass` user. Wiring the
// full five-persona seed is the Phase-1 seed task in the build sequence.
// ─────────────────────────────────────────────────────────────────

export type DevRole =
  | "SOLDIER"
  | "RATER"
  | "SENIOR_RATER"
  | "REVIEWER"
  | "COMMANDER"
  | "ADMIN";

export interface DevProfile {
  label: string;
  /** Short demo hint shown under the label on the selector. */
  hint: string;
  email: string;
  rank: string;
  firstName: string;
  lastName: string;
  mos: string;
  dutyTitle: string;
  unit: string;
  roles: DevRole[];
  /**
   * Which picker section this persona belongs to. "core" is the one PM-demo
   * route (see docs/admin/16-pm-demo-route.md): Davis -> Johnson -> Williams.
   * "oer" is the optional officer boundary segment. "fixtures" are personas
   * that exist only for other features' test coverage (supplementary review,
   * rating-scheme administration, identity/access admin, Access and
   * Assistance) and are not part of the demo narrative.
   */
  group: "core" | "oer" | "fixtures";
}

export const DEV_PROFILES: DevProfile[] = [
  {
    label: "SGT Davis — Team Leader",
    hint: "Rated only · Has NCOER (9-1) · Start here for the PM demo",
    email: "james.davis@army.mil",
    rank: "SGT",
    firstName: "James",
    lastName: "Davis",
    mos: "11B",
    dutyTitle: "Team Leader",
    unit: "B Co, 1-505 PIR, 82nd ABN",
    roles: ["SOLDIER"],
    group: "core",
  },
  {
    label: "SSG Johnson — Squad Leader",
    hint: "Rates SGTs · Has NCOER (9-2) · Demo step 2, Davis's rater",
    email: "marcus.johnson@army.mil",
    rank: "SSG",
    firstName: "Marcus",
    lastName: "Johnson",
    mos: "11B",
    dutyTitle: "Squad Leader",
    unit: "B Co, 1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "RATER"],
    group: "core",
  },
  {
    label: "SFC Williams — Platoon Sergeant",
    hint: "Rater + SR · Has NCOER (9-2) · Demo step 3, Davis's senior rater",
    email: "robert.williams@army.mil",
    rank: "SFC",
    firstName: "Robert",
    lastName: "Williams",
    mos: "11B",
    dutyTitle: "Platoon Sergeant",
    unit: "B Co, 1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "RATER", "SENIOR_RATER"],
    group: "core",
  },
  {
    label: "1LT Torres — PLT Leader",
    hint: "Rater = 1LT, triggers supplementary review · Optional OER segment",
    email: "maria.torres@army.mil",
    rank: "FIRST_LT",
    firstName: "Maria",
    lastName: "Torres",
    mos: "11A",
    dutyTitle: "Platoon Leader",
    unit: "A Co, 1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "RATER"],
    group: "oer",
  },
  {
    label: "CPT Smith — Company Commander",
    hint: "Rates LTs + NCOs · Has OER · Optional OER segment (Torres's rater)",
    email: "peter.smith@army.mil",
    rank: "CPT",
    firstName: "Peter",
    lastName: "Smith",
    mos: "11A",
    dutyTitle: "Company Commander",
    unit: "C Co, 1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "RATER", "SENIOR_RATER", "COMMANDER"],
    group: "oer",
  },
  {
    label: "MAJ Lee — Battalion Executive Officer",
    hint: "Senior rater for compliant replacement assignments · Optional OER segment (Torres's SR)",
    email: "jordan.lee@army.mil",
    rank: "MAJ",
    firstName: "Jordan",
    lastName: "Lee",
    mos: "11A",
    dutyTitle: "Battalion Executive Officer",
    unit: "1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "SENIOR_RATER"],
    group: "oer",
  },
  {
    label: "LTC Reed — Battalion Commander",
    hint: "Approves/publishes rating schemes; Davis's supplementary reviewer in FLOWS test cast",
    email: "morgan.reed@army.mil",
    rank: "LTC",
    firstName: "Morgan",
    lastName: "Reed",
    mos: "11A",
    dutyTitle: "Battalion Commander",
    unit: "1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "REVIEWER", "COMMANDER"],
    group: "fixtures",
  },
  {
    label: "CPT Quinn — Servicing Administrator",
    hint: "Publishes test assignments and manages workflow setup",
    email: "avery.quinn@army.mil",
    rank: "CPT",
    firstName: "Avery",
    lastName: "Quinn",
    mos: "42B",
    dutyTitle: "Battalion S-1",
    unit: "1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "ADMIN"],
    group: "fixtures",
  },
  {
    label: "SGT Rivera — Evidence Assistant",
    hint: "Assists a scoped support form under their own account",
    email: "alex.rivera@army.mil",
    rank: "SGT",
    firstName: "Alex",
    lastName: "Rivera",
    mos: "42A",
    dutyTitle: "Human Resources Specialist",
    unit: "1-505 PIR, 82nd ABN",
    roles: ["SOLDIER"],
    group: "fixtures",
  },
  {
    label: "SFC Morgan — Records Assistant",
    hint: "Completes scoped administrative fields under their own account",
    email: "taylor.morgan@army.mil",
    rank: "SFC",
    firstName: "Taylor",
    lastName: "Morgan",
    mos: "42A",
    dutyTitle: "Human Resources Specialist",
    unit: "1-505 PIR, 82nd ABN",
    roles: ["SOLDIER"],
    group: "fixtures",
  },
];

/**
 * Builds the dev auth token the backend expects (`dev:<email>:testpass`)
 * and the `Authorization` header value stored in localStorage.
 */
export function devAuthHeaderForProfile(profile: DevProfile): string {
  return `Bearer dev:${profile.email}:testpass`;
}

/** Persists the selected profile's dev credentials for subsequent API calls. */
export function loginAsDevProfile(profile: DevProfile): void {
  if (typeof window === "undefined") return;
  void clearClientApiCache();
  localStorage.setItem("devAuth", devAuthHeaderForProfile(profile));
  localStorage.setItem("devProfileEmail", profile.email);
  notifyAuthChanged();
}

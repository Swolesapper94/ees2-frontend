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
}

export const DEV_PROFILES: DevProfile[] = [
  {
    label: "CPT Smith — Company Commander",
    hint: "Rates LTs + NCOs · Has OER",
    email: "peter.smith@army.mil",
    rank: "CPT",
    firstName: "Peter",
    lastName: "Smith",
    mos: "11A",
    dutyTitle: "Company Commander",
    unit: "C Co, 1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "RATER", "SENIOR_RATER", "COMMANDER"],
  },
  {
    label: "SSG Johnson — Squad Leader",
    hint: "Rates SGTs · Has NCOER (9-2)",
    email: "marcus.johnson@army.mil",
    rank: "SSG",
    firstName: "Marcus",
    lastName: "Johnson",
    mos: "11B",
    dutyTitle: "Squad Leader",
    unit: "B Co, 1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "RATER"],
  },
  {
    label: "SGT Davis — Team Leader",
    hint: "Rated only · Has NCOER (9-1)",
    email: "james.davis@army.mil",
    rank: "SGT",
    firstName: "James",
    lastName: "Davis",
    mos: "11B",
    dutyTitle: "Team Leader",
    unit: "B Co, 1-505 PIR, 82nd ABN",
    roles: ["SOLDIER"],
  },
  {
    label: "1LT Torres — PLT Leader",
    hint: "Rater = 1LT, triggers supplementary review",
    email: "maria.torres@army.mil",
    rank: "FIRST_LT",
    firstName: "Maria",
    lastName: "Torres",
    mos: "11A",
    dutyTitle: "Platoon Leader",
    unit: "A Co, 1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "RATER"],
  },
  {
    label: "SFC Williams — Platoon Sergeant",
    hint: "Rater + SR · Has NCOER (9-2)",
    email: "robert.williams@army.mil",
    rank: "SFC",
    firstName: "Robert",
    lastName: "Williams",
    mos: "11B",
    dutyTitle: "Platoon Sergeant",
    unit: "B Co, 1-505 PIR, 82nd ABN",
    roles: ["SOLDIER", "RATER", "SENIOR_RATER"],
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
  localStorage.setItem("devAuth", devAuthHeaderForProfile(profile));
  localStorage.setItem("devProfileEmail", profile.email);
}

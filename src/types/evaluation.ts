// Domain enums mirrored from the backend Prisma schema.
// Kept in sync manually — the backend is the source of truth.

export type EvalFormType = "NCOER_9_1" | "NCOER_9_2" | "NCOER_9_3";

export type SectionKey =
  | "CHARACTER"
  | "PRESENCE"
  | "INTELLECT"
  | "LEADS"
  | "DEVELOPS"
  | "ACHIEVES"
  | "RATER_OVERALL"
  | "SENIOR_RATER_OVERALL"
  | "SOLDIER_COMMENTS";

export type RatingBinary = "MET_STANDARD" | "DID_NOT_MEET_STANDARD";

export type RatingFourLevel =
  | "NOT_MET_STANDARD"
  | "QUALIFIED"
  | "EXCEEDED_STANDARD"
  | "FAR_EXCEEDED_STANDARD";

export type SeniorRaterRating =
  | "MOST_QUALIFIED"
  | "HIGHLY_QUALIFIED"
  | "QUALIFIED"
  | "NOT_QUALIFIED";

export type EvalStatus =
  | "DRAFT"
  | "RATER_COMPLETE"
  | "PENDING_SENIOR_RATER"
  | "PENDING_SOLDIER_ACK"
  | "PENDING_REVIEWER"
  | "COMPLETE"
  | "SUBMITTED";

export type EntryType = "OBJECTIVE" | "ACCOMPLISHMENT";

export type UserRole =
  | "SOLDIER"
  | "RATER"
  | "SENIOR_RATER"
  | "REVIEWER"
  | "ADMIN";

export type BulletSource = "HUMAN" | "AI_MODIFIED" | "AI_UNMODIFIED";

export interface EvalSection {
  id: string;
  section: SectionKey;
  ratingBinary: RatingBinary | null;
  ratingFourLevel: RatingFourLevel | null;
  stagingBullets: string[];
  finalBullets: string[];
  bulletSources: Record<string, BulletSource> | null;
  isComplete: boolean;
}

export interface Evaluation {
  id: string;
  formType: EvalFormType;
  status: EvalStatus;
  periodStart: string;
  periodEnd: string;
  principalDutyTitle: string | null;
  seniorRaterRating: SeniorRaterRating | null;
  sections?: EvalSection[];
}

export interface ConsistencyFlag {
  code: string;
  severity: "WARNING" | "INFO";
  section?: string;
  message: string;
  resolvable: boolean;
}

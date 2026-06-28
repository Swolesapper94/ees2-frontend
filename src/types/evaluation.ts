// Domain enums mirrored from the backend Prisma schema.
// Kept in sync manually — the backend is the source of truth.

// NCOERs — full builder in MVP
export type EvalFormType =
  | "NCOER_9_1"   // DA 2166-9-1 — SGT (E5)
  | "NCOER_9_2"   // DA 2166-9-2 — SSG–1SG/MSG (E6–E8)
  | "NCOER_9_3"   // DA 2166-9-3 — CSM/SGM/SMA (E9)
  // OERs — dashboard + support form only for MVP
  | "OER_67_10_1"   // DA 67-10-1  — 2LT, 1LT
  | "OER_67_10_1A"  // DA 67-10-1A — WO1, CW2
  | "OER_67_10_2"   // DA 67-10-2  — CPT
  | "OER_67_10_2A"  // DA 67-10-2A — CW3–CW5
  | "OER_67_10_3"   // DA 67-10-3  — MAJ, LTC, COL
  | "OER_67_10_4";  // DA 67-10-4  — BG and above

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

/**
 * NOT_STARTED is a computed state (no DB row) — included here for UI use only.
 * OVERDUE is a milestone flag, not a status; it is never stored in EvalStatus.
 */
export type EvalStatus =
  | "DRAFT"
  | "RATER_IN_PROGRESS"
  | "PENDING_SENIOR_RATER"
  | "PENDING_SOLDIER_ACK"
  | "PENDING_SUPPLEMENTARY_REVIEW"
  | "COMPLETE"
  | "SUBMITTED"
  | "ACCEPTED"
  | "RETURNED";

export type EntryType = "OBJECTIVE" | "ACCOMPLISHMENT";

export type UserRole =
  | "SOLDIER"
  | "RATER"
  | "SENIOR_RATER"
  | "REVIEWER"
  | "COMMANDER"
  | "ADMIN";

export type BulletSource = "HUMAN" | "AI_MODIFIED" | "AI_UNMODIFIED";

// ── AI Pipeline types ────────────────────────────────────────────────────────

export type SupportFormUploadStatus =
  | "PENDING_EXTRACT"
  | "EXTRACTING"
  | "PENDING_PARSE"
  | "PARSING"
  | "PENDING_BULLETS"
  | "GENERATING"
  | "COMPLETE"
  | "FAILED";

export type AIBulletStatus = "PENDING_REVIEW" | "ACCEPTED" | "EDITED" | "REJECTED";
export type AIBulletConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface AIBulletSuggestion {
  id: string;
  evaluationId: string;
  uploadId: string | null;
  sectionKey: SectionKey;
  text: string;
  confidence: AIBulletConfidence;
  rank: number;
  status: AIBulletStatus;
  editedText: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  sourceEntryIds: string[];
  createdAt: string;
}

export interface AIExtractedEntry {
  id: string;
  uploadId: string;
  evaluationId: string;
  section: SectionKey;
  what: string;
  impact: string | null;
  date: string | null;
  context: string | null;
}

export interface SupportFormUploadState {
  hasUpload: boolean;
  uploadId?: string;
  fileUrl?: string;
  fileType?: string;
  parseStatus?: SupportFormUploadStatus;
  parseError?: string;
  extractedEntries?: AIExtractedEntry[];
  bulletSuggestions?: AIBulletSuggestion[];
}

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
  severity: "ERROR" | "WARNING" | "INFO";
  section?: string;
  message: string;
  resolvable: boolean;
}

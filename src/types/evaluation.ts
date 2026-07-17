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
  | "PENDING_FINAL_FORM_REVIEW"
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

export interface BulletSourceSnapshotEntry {
  entryId: string;
  rawText: string;
  artifactCaptions: string[];
}

export interface UnsupportedClaim {
  claimText: string;
  claimType: "NUMBER" | "PERCENTAGE" | "DATE" | "SCHOOL" | "AWARD" | "RANKING";
  reason: string;
}

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
  sourceSnapshot: BulletSourceSnapshotEntry[] | null;
  unsupportedClaims: UnsupportedClaim[] | null;
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

// ── Guided Support Form Flow \u2014 entries + artifacts ────────────────────────

export type ArtifactType = "CERTIFICATE" | "SCORE_SHEET" | "PHOTO" | "DOCUMENT" | "OTHER";
export type ArtifactCaptionStatus = "PENDING" | "COMPLETE" | "FAILED";
export type EntryConfirmationStatus =
  | "UNREVIEWED"
  | "CONFIRMED"
  | "NEEDS_CLARIFICATION"
  | "NOT_USED";

export interface SupportFormEntryArtifact {
  id: string;
  entryId: string;
  type: ArtifactType;
  fileUrl: string;
  fileType: string; // "image" | "pdf"
  aiCaption: string | null;
  aiCaptionStatus: ArtifactCaptionStatus;
  aiCaptionError: string | null;
  flaggedByServiceMember: boolean;
  flagNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportFormEntry {
  id: string;
  supportFormId: string;
  entryDate: string;
  section: SectionKey;
  entryType: EntryType;
  rawText: string;
  tags: string[];
  isHighlight: boolean;
  counseled: boolean;
  counseledDate: string | null;
  usedInEvalId: string | null;
  confirmationStatus: EntryConfirmationStatus;
  createdByUserId?: string | null;
  onBehalfOfUserId?: string | null;
  delegationGrantId?: string | null;
  createdByUser?: { firstName: string; lastName: string; rank: string } | null;
  assistedUser?: { firstName: string; lastName: string; rank: string } | null;
  confirmedById: string | null;
  confirmedAt: string | null;
  clarificationNote: string | null;
  artifacts: SupportFormEntryArtifact[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportForm {
  id: string;
  soldierId: string;
  status?: "DRAFT" | "INITIAL_COUNSELING_COMPLETE" | "ACTIVE" | "FINALIZED" | "CONSUMED" | "ARCHIVED" | "QUARANTINED";
  ratingChainId: string | null;
  evalCategory: "NCOER" | "OER" | null;
  ratingPeriodStart: string;
  ratingPeriodEnd: string | null;
  dutyTitle: string;
  dutyMosc: string | null;
  dailyDutiesScope: string | null;
  areasOfEmphasis: string | null;
  appointedDuties: string | null;
  ssdNcoesMet: boolean | null;
  soldierGoals: string | null;
  isActive: boolean;
  completedAt: string | null;
  entries: SupportFormEntry[];
}

export interface BulletProvenanceEntry {
  suggestionId: string;
  sourceEntryIds: string[];
  sourceSnapshot: BulletSourceSnapshotEntry[] | null;
}

export interface EvalSection {
  id: string;
  section: SectionKey;
  ratingBinary: RatingBinary | null;
  ratingFourLevel: RatingFourLevel | null;
  stagingBullets: string[];
  finalBullets: string[];
  bulletSources: Record<string, BulletSource> | null;
  bulletProvenance: Record<string, BulletProvenanceEntry> | null;
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
  supportFormId?: string | null;
  supportForm?: SupportForm | null;
}

export interface ConsistencyFlag {
  code: string;
  // MVP audit 5.14 — severity taxonomy expanded from flat ERROR/WARNING/INFO.
  // BLOCKING_ERROR must be fixed before proceeding; CONFIRMATION_REQUIRED
  // must be explicitly acknowledged (like WARNING) but represents a
  // stronger risk (e.g. an unsupported factual claim) that the backend
  // treats as more serious than a soft warning.
  severity: "BLOCKING_ERROR" | "CONFIRMATION_REQUIRED" | "WARNING" | "INFO";
  section?: string;
  message: string;
  resolvable: boolean;
}

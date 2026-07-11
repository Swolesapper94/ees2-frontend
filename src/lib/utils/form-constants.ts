import type {
  SectionKey,
  RatingBinary,
  RatingFourLevel,
  SeniorRaterRating,
} from "@/types/evaluation";

export const PART_IV_SECTIONS: SectionKey[] = [
  "CHARACTER",
  "PRESENCE",
  "INTELLECT",
  "LEADS",
  "DEVELOPS",
  "ACHIEVES",
];

export const SECTION_LABELS: Record<string, string> = {
  CHARACTER: "Character",
  PRESENCE: "Presence",
  INTELLECT: "Intellect",
  LEADS: "Leads",
  DEVELOPS: "Develops",
  ACHIEVES: "Achieves",
  RATER_OVERALL: "Rater Overall",
  SENIOR_RATER_OVERALL: "Senior Rater Overall",
  SOLDIER_COMMENTS: "Soldier Comments",
  TIMELINE: "Timeline",
};

export const RATING_BINARY_LABELS: Record<RatingBinary, string> = {
  MET_STANDARD: "Met Standard",
  DID_NOT_MEET_STANDARD: "Did Not Meet Standard",
};

export const RATING_FOUR_LEVEL_LABELS: Record<RatingFourLevel, string> = {
  NOT_MET_STANDARD: "Not Met Standard",
  QUALIFIED: "Qualified",
  EXCEEDED_STANDARD: "Exceeded Standard",
  FAR_EXCEEDED_STANDARD: "Far Exceeded Standard",
};

export const SENIOR_RATER_LABELS: Record<SeniorRaterRating, string> = {
  MOST_QUALIFIED: "Most Qualified",
  HIGHLY_QUALIFIED: "Highly Qualified",
  QUALIFIED: "Qualified",
  NOT_QUALIFIED: "Not Qualified",
};

export const BULLET_MAX_CHARS = 200;

// AR 623-3 Senior Rater MQ cap is grade-dependent (24% NCO / 50% Officer/WO)
// — see `srMqCapPercentFor()` in the backend's lib/utils/grade.ts, whose
// output (`capPercent`) is now returned directly by `GET /evaluations/:id`
// as part of `srMqProfile`. No flat frontend constant anymore — a single
// number here can't represent both grade bands correctly.

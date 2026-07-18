export interface MilestoneDefinition {
  label: string;
  shortLabel: string;
  owner: string;
  dueRule: string;
  why: string;
}

export const MILESTONE_DEFINITIONS: Record<string, MilestoneDefinition> = {
  INITIAL_COUNSELING_DUE: {
    label: "Initial counseling",
    shortLabel: "Initial",
    owner: "Rater",
    dueRule: "Within 30 days of the rating period start",
    why: "Sets expectations early so the evaluation is based on known standards, not surprise feedback at the end of the year.",
  },
  QUARTERLY_COUNSELING_1: {
    label: "Quarterly counseling 1",
    shortLabel: "Q1",
    owner: "Rater",
    dueRule: "About 90 days into the rating period",
    why: "Documents progress and course-corrects while there is still time to improve performance.",
  },
  QUARTERLY_COUNSELING_2: {
    label: "Quarterly counseling 2",
    shortLabel: "Q2",
    owner: "Rater",
    dueRule: "About 180 days into the rating period",
    why: "Creates a mid-period checkpoint that connects goals, accomplishments, and counseling history.",
  },
  QUARTERLY_COUNSELING_3: {
    label: "Quarterly counseling 3",
    shortLabel: "Q3",
    owner: "Rater",
    dueRule: "About 270 days into the rating period",
    why: "Catches unresolved issues before the report is drafted and helps prevent last-minute surprises.",
  },
  RATER_SECTION_DUE: {
    label: "Rater section due",
    shortLabel: "Rater",
    owner: "Rater",
    dueRule: "14 days before the rating period ends",
    why: "Keeps Part IV ratings and bullets moving early enough for review, signatures, and correction.",
  },
  SENIOR_RATER_DUE: {
    label: "Senior rater section due",
    shortLabel: "SR",
    owner: "Senior rater",
    dueRule: "7 days before the rating period ends",
    why: "Gives the senior rater time to set the overall assessment and succession planning before the soldier acknowledges the form.",
  },
  SOLDIER_ACK_DUE: {
    label: "Soldier acknowledgment due",
    shortLabel: "Acknowledge",
    owner: "Rated soldier",
    dueRule: "3 days before the rating period ends",
    why: "Ensures the rated soldier reviews the completed report and signs or raises issues before final submission.",
  },
  EVAL_SUBMISSION_DUE: {
    label: "Evaluation submission due",
    shortLabel: "Submit",
    owner: "Rater / rating chain",
    dueRule: "On the rating period end date",
    why: "Marks the point where the completed report should be ready for HDQA/HRC processing.",
  },
};

export function milestoneDefinition(type: string): MilestoneDefinition {
  return MILESTONE_DEFINITIONS[type] ?? {
    label: type.replaceAll("_", " ").toLowerCase(),
    shortLabel: type.slice(0, 6),
    owner: "Assigned official",
    dueRule: "Configured by the evaluation workflow",
    why: "Tracks a required workflow step for this evaluation.",
  };
}

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
    why: "Set expectations early.",
  },
  QUARTERLY_COUNSELING_1: {
    label: "Quarterly counseling 1",
    shortLabel: "Q1",
    owner: "Rater",
    dueRule: "About 90 days into the rating period",
    why: "Course-correct performance early.",
  },
  QUARTERLY_COUNSELING_2: {
    label: "Quarterly counseling 2",
    shortLabel: "Q2",
    owner: "Rater",
    dueRule: "About 180 days into the rating period",
    why: "Connect goals and evidence.",
  },
  QUARTERLY_COUNSELING_3: {
    label: "Quarterly counseling 3",
    shortLabel: "Q3",
    owner: "Rater",
    dueRule: "About 270 days into the rating period",
    why: "Prevent last-minute surprises.",
  },
  RATER_SECTION_DUE: {
    label: "Rater section due",
    shortLabel: "Rater",
    owner: "Rater",
    dueRule: "14 days before the rating period ends",
    why: "Draft rater content early.",
  },
  SENIOR_RATER_DUE: {
    label: "Senior rater section due",
    shortLabel: "SR",
    owner: "Senior rater",
    dueRule: "7 days before the rating period ends",
    why: "Complete senior-rater review.",
  },
  SOLDIER_ACK_DUE: {
    label: "Soldier acknowledgment due",
    shortLabel: "Acknowledge",
    owner: "Rated soldier",
    dueRule: "3 days before the rating period ends",
    why: "Soldier reviews final form.",
  },
  EVAL_SUBMISSION_DUE: {
    label: "Evaluation submission due",
    shortLabel: "Submit",
    owner: "Rater / rating chain",
    dueRule: "On the rating period end date",
    why: "Ready for HQDA/HRC.",
  },
};

export function milestoneDefinition(type: string): MilestoneDefinition {
  return MILESTONE_DEFINITIONS[type] ?? {
    label: type.replaceAll("_", " ").toLowerCase(),
    shortLabel: type.slice(0, 6),
    owner: "Assigned official",
    dueRule: "Configured by the evaluation workflow",
    why: "Required workflow step.",
  };
}

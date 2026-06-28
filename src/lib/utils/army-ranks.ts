import type { EvalFormType } from "@/types/evaluation";

// Pay grade lookup for enlisted ranks relevant to NCOERs.
export const RANK_TO_GRADE: Record<string, string> = {
  PVT: "E1",
  PV2: "E2",
  PFC: "E3",
  SPC: "E4",
  CPL: "E4",
  SGT: "E5",
  SSG: "E6",
  SFC: "E7",
  MSG: "E8",
  FIRST_SERGEANT: "E8",
  SGM: "E9",
  CSM: "E9",
  SMA: "E9",
};

export const RANK_ABBR: Record<string, string> = {
  FIRST_SERGEANT: "1SG",
  SECOND_LT: "2LT",
  FIRST_LT: "1LT",
};

export function rankAbbr(rank: string): string {
  return RANK_ABBR[rank] ?? rank;
}

/** Determines which NCOER form a rank uses. Returns null for non-NCO ranks. */
export function formTypeForRank(rank: string): EvalFormType | null {
  switch (rank) {
    case "SGT":
      return "NCOER_9_1";
    case "SSG":
    case "SFC":
    case "MSG":
    case "FIRST_SERGEANT":
      return "NCOER_9_2";
    case "SGM":
    case "CSM":
      return "NCOER_9_3";
    default:
      return null;
  }
}

/** NCOER_9_1 (SGT) uses the binary rating scale; everything else is 4-level. */
export function usesBinaryScale(formType: EvalFormType): boolean {
  return formType === "NCOER_9_1";
}

/** Full rank → form mapping with builder availability flag. */
export function resolveFormType(rank: string): {
  formType: EvalFormType;
  evalType: "NCOER" | "OER";
  builderAvailable: boolean;
} {
  switch (rank) {
    case "SGT":
      return { formType: "NCOER_9_1", evalType: "NCOER", builderAvailable: true };
    case "SSG":
    case "SFC":
    case "MSG":
    case "FIRST_SERGEANT":
      return { formType: "NCOER_9_2", evalType: "NCOER", builderAvailable: true };
    case "SGM":
    case "CSM":
    case "SMA":
      return { formType: "NCOER_9_3", evalType: "NCOER", builderAvailable: true };
    case "WO1":
    case "CW2":
      return { formType: "OER_67_10_1A", evalType: "OER", builderAvailable: false };
    case "CW3":
    case "CW4":
    case "CW5":
      return { formType: "OER_67_10_2A", evalType: "OER", builderAvailable: false };
    case "SECOND_LT":
    case "FIRST_LT":
      return { formType: "OER_67_10_1", evalType: "OER", builderAvailable: false };
    case "CPT":
      return { formType: "OER_67_10_2", evalType: "OER", builderAvailable: false };
    case "MAJ":
    case "LTC":
    case "COL":
      return { formType: "OER_67_10_3", evalType: "OER", builderAvailable: false };
    case "BG":
    case "MG":
    case "LTG":
    case "GEN":
    case "GA":
      return { formType: "OER_67_10_4", evalType: "OER", builderAvailable: false };
    default:
      return { formType: "NCOER_9_1", evalType: "NCOER", builderAvailable: false };
  }
}

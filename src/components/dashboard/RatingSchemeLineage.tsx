import { rankAbbr } from "@/lib/utils/army-ranks";

interface ChainUser {
  firstName: string;
  lastName: string;
  rank: string;
  dutyTitle?: string | null;
  unit?: { name: string } | null;
}

interface RatingSchemeLineageProps {
  soldier: ChainUser;
  rater: ChainUser;
  seniorRater: ChainUser;
  reviewer?: ChainUser | null;
}

function ChainTier({
  label,
  user,
  isYou = false,
}: {
  label?: string;
  user: ChainUser;
  isYou?: boolean;
}) {
  const displayRank = rankAbbr(user.rank);
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline gap-2">
        <span className="w-28 flex-shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label ?? ""}
        </span>
        <span className="font-medium text-sm">
          {displayRank} {user.lastName}, {user.firstName.charAt(0)}.
          {isYou && (
            <span className="ml-1.5 text-xs text-muted-foreground">(You)</span>
          )}
        </span>
      </div>
      {(user.dutyTitle ?? user.unit?.name) && (
        <div className="ml-[7.5rem] text-xs text-muted-foreground">
          {[user.dutyTitle, user.unit?.name].filter(Boolean).join("  •  ")}
        </div>
      )}
    </div>
  );
}

/**
 * Vertical lineage strip showing the rated soldier's rating chain from top
 * to bottom. Displayed in Zone A on the dashboard below the eval card.
 */
export function RatingSchemeLineage({
  soldier,
  rater,
  seniorRater,
  reviewer,
}: RatingSchemeLineageProps) {
  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        My Rating Scheme
      </h3>

      <div className="flex flex-col">
        {/* Soldier */}
        <ChainTier user={soldier} label="Rated Soldier" isYou />

        {/* Connector */}
        <div className="my-1.5 ml-[7rem] flex items-center gap-1 text-xs text-muted-foreground/50">
          <span className="border-l border-border pl-2">rated by</span>
        </div>

        {/* Rater */}
        <ChainTier user={rater} label="Rater" />

        {/* Connector */}
        <div className="my-1.5 ml-[7rem] flex items-center gap-1 text-xs text-muted-foreground/50">
          <span className="border-l border-border pl-2">senior rated by</span>
        </div>

        {/* Senior Rater */}
        <ChainTier user={seniorRater} label="Senior Rater" />

        {/* Reviewer — always show slot */}
        <div className="my-1.5 ml-[7rem] flex items-center gap-1 text-xs text-muted-foreground/50">
          <span className="border-l border-border pl-2">reviewer</span>
        </div>

        {reviewer ? (
          <ChainTier user={reviewer} label="Reviewer" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="w-28 flex-shrink-0 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Reviewer
            </span>
            <span className="text-xs text-muted-foreground">
              — Not required at this grade
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

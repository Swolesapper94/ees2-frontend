"use client";

export type RelationshipOfficial = {
  id: string;
  firstName: string;
  lastName: string;
  rank: string;
};

export type RelationshipAssignment = {
  id: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  formCategory: "NCOER" | "OER";
  ratedSoldier: RelationshipOfficial;
  rater: RelationshipOfficial;
  intermediateRater: RelationshipOfficial | null;
  seniorRater: RelationshipOfficial;
  supplementaryReviewer: RelationshipOfficial | null;
  unit: { name: string } | null;
};

type UnassignedPerson = RelationshipOfficial & { mos: string; category: string | null };

type RelationshipMapProps = {
  assignments: RelationshipAssignment[];
  unassignedPersonnel: UnassignedPerson[];
  onSelect: (assignment: RelationshipAssignment) => void;
};

function fullName(person: RelationshipOfficial) {
  return `${person.rank} ${person.lastName}, ${person.firstName}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function RatingRelationshipMap({ assignments, unassignedPersonnel, onSelect }: RelationshipMapProps) {
  const branches = new Map<string, { seniorRater: RelationshipOfficial; raters: Map<string, { rater: RelationshipOfficial; assignments: RelationshipAssignment[] }> }>();

  for (const assignment of assignments) {
    const branch = branches.get(assignment.seniorRater.id) ?? { seniorRater: assignment.seniorRater, raters: new Map() };
    const raterGroup = branch.raters.get(assignment.rater.id) ?? { rater: assignment.rater, assignments: [] };
    raterGroup.assignments.push(assignment);
    branch.raters.set(assignment.rater.id, raterGroup);
    branches.set(assignment.seniorRater.id, branch);
  }

  return (
    <section className="space-y-5" aria-label="Rating relationship map">
      <div className="grid gap-4 xl:grid-cols-2">
        {[...branches.values()].map((branch) => (
          <section key={branch.seniorRater.id} className="border border-border bg-card">
            <div className="border-b border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Senior Rater</p>
              <p className="font-semibold">{fullName(branch.seniorRater)}</p>
            </div>
            <div className="divide-y divide-border">
              {[...branch.raters.values()].map((raterGroup) => (
                <div key={raterGroup.rater.id} className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="h-px w-5 bg-primary/50" />
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Rater</p>
                      <p className="font-medium">{fullName(raterGroup.rater)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {raterGroup.assignments.map((assignment) => (
                      <button
                        type="button"
                        key={assignment.id}
                        onClick={() => onSelect(assignment)}
                        className="border border-border bg-background p-3 text-left hover:border-primary/60 hover:bg-primary/5"
                      >
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Rated Soldier</p>
                        <p className="mt-1 font-medium">{fullName(assignment.ratedSoldier)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{assignment.formCategory} · Effective {formatDate(assignment.effectiveFrom)}</p>
                        {assignment.intermediateRater && <p className="mt-1 text-xs text-muted-foreground">Intermediate: {fullName(assignment.intermediateRater)}</p>}
                        {assignment.supplementaryReviewer && <p className="mt-1 text-xs text-muted-foreground">Supplementary: {fullName(assignment.supplementaryReviewer)}</p>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {unassignedPersonnel.length > 0 && (
        <section className="border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase text-amber-800">Assignment Exceptions</p>
          <p className="mt-1 text-sm text-amber-900">These personnel do not appear in the relationship map because their rating relationship is incomplete.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {unassignedPersonnel.map((person) => (
              <span key={person.id} className="border border-amber-200 bg-background px-2 py-1 text-sm text-amber-900">{fullName(person)}</span>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

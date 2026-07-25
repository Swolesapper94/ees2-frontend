import { RankInsignia } from "@/components/ui/RankInsignia";

interface DashboardGreetingProps {
  firstName: string;
  lastName: string;
  rank: string;
  dutyTitle?: string | null;
  unitName?: string | null;
  recap: string;
}

function greetingForCurrentTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Personalized dashboard greeting header with profile avatar and source label.
 */
export function DashboardGreeting({
  firstName,
  lastName,
  rank,
  dutyTitle,
  unitName,
  recap,
}: DashboardGreetingProps) {
  return (
    <section className="flex items-start gap-4 rounded-sm border border-l-4 border-border border-l-primary bg-card p-4 shadow-card animate-in fade-in slide-in-from-bottom-1 duration-200" aria-label="Dashboard greeting">
      <div className="rounded-sm bg-primary/10 p-2">
        <RankInsignia rank={rank} size="lg" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Personal workspace</p>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
          {greetingForCurrentTime()}, {rank} {lastName}
        </h1>
        {(dutyTitle || unitName) && (
          <p className="mt-1 text-sm font-medium text-foreground">
            {[dutyTitle, unitName].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">{recap}</p>
      </div>
    </section>
  );
}

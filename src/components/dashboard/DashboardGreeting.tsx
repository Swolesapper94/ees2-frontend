import { RankInsignia } from "@/components/ui/RankInsignia";

interface DashboardGreetingProps {
  firstName: string;
  lastName: string;
  rank: string;
  profilePictureUrl?: string | null;
  recap: string;
}

function greetingForCurrentTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Personalized dashboard greeting header with rank insignia and soldier name.
 * Format: "(Rank Picture) (Rank) John Smith's Dashboard"
 *
 * Reuses `RankInsignia` (rather than a bespoke <Image>) so missing artwork
 * gracefully falls back to a text badge instead of a broken image — see
 * RankInsignia.tsx for current rank-image coverage.
 */
export function DashboardGreeting({
  firstName,
  lastName,
  rank,
  profilePictureUrl,
  recap,
}: DashboardGreetingProps) {
  return (
    <section className="flex items-start gap-3" aria-label="Dashboard greeting">
      <RankInsignia rank={rank} size="lg" />

      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">
          {greetingForCurrentTime()}, {rank} {firstName} {lastName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{recap}</p>
      </div>
    </section>
  );
}

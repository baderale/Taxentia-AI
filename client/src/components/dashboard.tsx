import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { confidenceStyle, timeAgo } from "@/lib/research";
import { cn } from "@/lib/utils";
import type { TaxQuery } from "@shared/schema";

interface DashboardProps {
  onOpenQuery: (query: TaxQuery) => void;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const BANDS = ["green", "amber", "red"] as const;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card p-4 sm:p-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-serif text-3xl tracking-tight sm:text-4xl">{value}</dd>
    </div>
  );
}

/** Every number on this page is calculated from the signed-in user's saved questions. */
export default function Dashboard({ onOpenQuery }: DashboardProps) {
  const { data: queries = [], isLoading } = useQuery<TaxQuery[]>({
    queryKey: ["/api/queries"],
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-10 w-48 bg-muted" />
        <Skeleton className="h-28 w-full bg-muted" />
        <Skeleton className="h-40 w-full bg-muted" />
      </div>
    );
  }

  const total = queries.length;
  const now = Date.now();
  const average = total ? Math.round(queries.reduce((sum, query) => sum + (query.confidence || 0), 0) / total) : null;
  const thisWeek = queries.filter((query) => now - new Date(query.createdAt).getTime() < WEEK_MS).length;
  const counts = BANDS.map((band) => ({
    band,
    count: queries.filter((query) => query.confidenceColor === band).length,
  }));
  const recent = [...queries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="thin-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl animate-rise px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-3xl tracking-tight sm:text-4xl">Your activity</h1>
        <p className="mt-2 text-muted-foreground">A summary of the questions saved to your account.</p>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
          <Stat label="Questions" value={total} />
          <Stat label="This week" value={thisWeek} />
          <Stat label="Average confidence" value={average === null ? "None yet" : `${average}%`} />
          <Stat label="High confidence" value={counts[0].count} />
        </dl>

        {total === 0 ? (
          <p className="mt-8 rounded-xl border bg-card p-8 text-center text-muted-foreground">
            Ask your first question and your activity will appear here.
          </p>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-12">
            <section>
              <h2 className="eyebrow border-b pb-2 font-mono">Answers by confidence</h2>
              <ul className="mt-4 space-y-4">
                {counts.map(({ band, count }) => {
                  const style = confidenceStyle(band);
                  const Icon = style.icon;
                  const share = Math.round((count / total) * 100);
                  return (
                    <li key={band} title={`${style.label}: ${count} of ${total} answers (${share}%)`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <Icon className={cn("h-4 w-4", style.text)} />
                          {style.label}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {count} ({share}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                        <div className={cn("h-1.5 rounded-full", style.bar)} style={{ width: `${share}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h2 className="eyebrow border-b pb-2 font-mono">Recent questions</h2>
              <ul>
                {recent.map((query) => (
                  <li key={query.id} className="border-b">
                    <button
                      type="button"
                      onClick={() => onOpenQuery(query)}
                      className="flex w-full items-baseline justify-between gap-4 py-3 text-left transition-colors hover:text-primary"
                    >
                      <span className="line-clamp-2 text-sm leading-snug">{query.query}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(query.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

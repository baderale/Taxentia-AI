import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { confidenceStyle, timeAgo } from "@/lib/research";
import { cn } from "@/lib/utils";
import type { TaxQuery } from "@shared/schema";

interface QueryHistoryProps {
  onSelectQuery: (query: TaxQuery) => void;
  selectedQuery: string | null;
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "green", label: "High" },
  { id: "amber", label: "Medium" },
  { id: "red", label: "Low" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const time = (query: TaxQuery) => new Date(query.createdAt).getTime() || 0;

export default function QueryHistory({ onSelectQuery, selectedQuery }: QueryHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const { data: queries = [], isLoading, isError } = useQuery<TaxQuery[]>({
    queryKey: ["/api/queries"],
  });

  const visible = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return queries
      .filter((query) => query.query.toLowerCase().includes(term))
      .filter((query) => filter === "all" || query.confidenceColor === filter)
      .sort((a, b) => time(b) - time(a));
  }, [queries, searchTerm, filter]);

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="query-history">
      <div className="space-y-2 px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search history"
            aria-label="Search history"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 bg-card pl-9"
            data-testid="input-search-history"
          />
        </div>
        <div className="flex gap-1" role="group" aria-label="Filter by confidence">
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={cn(
                "h-8 flex-1 rounded-md text-xs font-medium transition-colors",
                filter === option.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto border-t" data-testid="query-list">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((row) => (
              <div key={row} className="space-y-2">
                <Skeleton className="h-4 w-full bg-muted" />
                <Skeleton className="h-3 w-1/2 bg-muted" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="p-6 text-center text-sm text-muted-foreground">We couldn't load your history.</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground" data-testid="empty-history">
            {queries.length > 0 ? "No matching questions." : "Your questions will appear here."}
          </p>
        ) : (
          <ul>
            {visible.map((query) => {
              const confidence = confidenceStyle(query.confidenceColor);
              const selected = selectedQuery === query.id;
              return (
                <li key={query.id}>
                  <button
                    type="button"
                    onClick={() => onSelectQuery(query)}
                    aria-current={selected ? "true" : undefined}
                    className={cn(
                      "w-full border-b border-l-2 border-l-transparent px-3 py-3 text-left transition-colors hover:bg-muted",
                      selected && "border-l-gold bg-card",
                    )}
                    data-testid={`query-item-${query.id}`}
                  >
                    <span className="line-clamp-2 text-sm leading-snug" data-testid={`query-title-${query.id}`}>
                      {query.query}
                    </span>
                    <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn("h-1.5 w-1.5 rounded-full", confidence.bar)} aria-hidden />
                      {confidence.label}
                      <span aria-hidden>·</span>
                      {timeAgo(query.createdAt)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import { Calendar, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AUTHORITY_TYPE, confidenceStyle, safeHref, timeAgo } from "@/lib/research";
import { cn } from "@/lib/utils";
import type { TaxQuery, TaxResponse } from "@shared/schema";

interface ResponseDisplayProps {
  response: TaxQuery;
}

function Section({ title, children, testId }: { title: string; children: React.ReactNode; testId?: string }) {
  return (
    <section className="border-t pt-5" data-testid={testId}>
      <h2 className="eyebrow mb-3 font-mono">{title}</h2>
      {children}
    </section>
  );
}

export default function ResponseDisplay({ response }: ResponseDisplayProps) {
  const { toast } = useToast();
  const [flashed, setFlashed] = useState<number | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();
  const answer = response.response as TaxResponse | null;

  if (!answer) {
    return <p className="py-12 text-center text-muted-foreground">This answer has no saved content.</p>;
  }

  const authority = answer.authority ?? [];
  const analysis = answer.analysis ?? [];
  const confidence = confidenceStyle(answer.confidence?.color);
  const ConfidenceIcon = confidence.icon;
  const notes = answer.confidence?.notes;
  const notesText = Array.isArray(notes) ? notes.join(" ") : notes;
  const guidance = answer.proceduralGuidance;
  const guidanceGroups = [
    { title: "Forms", items: guidance?.forms },
    { title: "Deadlines", items: guidance?.deadlines },
    { title: "Elections", items: guidance?.elections },
  ].filter((group) => group.items && group.items.length > 0);

  const copyAnswer = async () => {
    const lines = [
      `Question: ${response.query}`,
      `Conclusion: ${answer.conclusion}`,
      `Authority:\n${authority.map((item) => `- ${item.citation}: ${item.title}`).join("\n")}`,
      `Analysis:\n${analysis.map((item) => `${item.step}: ${item.rationale}`).join("\n\n")}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n\n"));
      toast({ title: "Answer copied" });
    } catch {
      toast({ variant: "destructive", title: "Couldn't copy the answer" });
    }
  };

  const jumpToAuthority = (index: number) => {
    document.getElementById(`authority-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashed(index);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashed(null), 1600);
  };

  return (
    <article
      className="mx-auto grid max-w-6xl animate-rise gap-x-12 gap-y-8 px-4 py-8 sm:px-6 sm:py-10 xl:grid-cols-[minmax(0,1fr)_20rem]"
      data-testid="response-display"
    >
      {/* Question and conclusion */}
      <header className="min-w-0">
        <h1 className="text-2xl leading-snug tracking-tight sm:text-[2rem]" data-testid="user-query">
          {response.query}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className={cn("flex items-center gap-1.5 font-medium", confidence.text)} data-testid="confidence-indicator">
            <ConfidenceIcon className="h-4 w-4" />
            {confidence.label} confidence, {answer.confidence?.score ?? 0}%
          </span>
          <span className="text-muted-foreground">{timeAgo(response.createdAt)}</span>
          <Button variant="ghost" size="sm" onClick={copyAnswer} className="ml-auto h-9 text-muted-foreground" data-testid="button-copy-response">
            <Copy /> Copy
          </Button>
        </div>

        <div className="mt-6 rounded-r-lg border-l-[3px] border-gold bg-card py-4 pl-5 pr-5 shadow-sm" data-testid="conclusion-section">
          <p className="eyebrow mb-2">Conclusion</p>
          <p className="font-serif text-xl leading-relaxed" data-testid="conclusion-content">
            {answer.conclusion}
          </p>
        </div>
      </header>

      {/* Authority sits beside the memo on wide screens, and right after the conclusion on phones */}
      <aside className="min-w-0 xl:sticky xl:top-6 xl:row-span-2 xl:self-start" data-testid="authority-section">
        <h2 className="eyebrow mb-3 font-mono">Authority ({authority.length})</h2>
        {authority.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            No sources were returned for this answer, so treat it as unverified.
          </p>
        ) : (
          <ol className="space-y-2">
            {authority.map((item, index) => {
              const href = safeHref(item.directUrl) ?? safeHref(item.url);
              return (
                <li
                  key={`${item.citation}-${index}`}
                  id={`authority-${index}`}
                  className={cn(
                    "rounded-lg border bg-card p-3.5 transition-colors duration-500",
                    flashed === index && "border-gold bg-gold/10",
                  )}
                  data-testid={`authority-item-${index}`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 font-mono text-xs text-gold-deep">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-mono text-[13px] font-medium" data-testid={`authority-title-${index}`}>
                        {item.citation}
                      </p>
                      <p className="mt-1 text-sm leading-snug text-muted-foreground" data-testid={`authority-description-${index}`}>
                        {item.title}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground" data-testid={`authority-type-${index}`}>
                        {AUTHORITY_TYPE[item.sourceType] ?? "Authority"}
                      </p>
                      {(item.effectiveDate || item.versionDate) && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {item.effectiveDate || `Version ${item.versionDate}`}
                        </p>
                      )}
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex min-h-8 items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                          data-testid={`authority-link-${index}`}
                        >
                          Read source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </aside>

      {/* Rest of the memo */}
      <div className="min-w-0 space-y-8">
        <Section title="Analysis" testId="analysis-section">
          <ol className="space-y-6">
            {analysis.map((step, index) => (
              <li key={index} className="grid grid-cols-[1.5rem_minmax(0,1fr)]" data-testid={`analysis-step-${index}`}>
                <span className="pt-0.5 font-mono text-xs text-gold-deep">{index + 1}</span>
                <div>
                  <h3 className="font-sans text-[15px] font-semibold leading-snug" data-testid={`analysis-step-title-${index}`}>
                    {step.step}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/85" data-testid={`analysis-step-rationale-${index}`}>
                    {step.rationale}
                  </p>
                  {step.proceduralNotes && (
                    <p className="mt-2 rounded-md bg-accent px-3 py-2 text-sm leading-relaxed">
                      <span className="font-medium">Procedure: </span>
                      {step.proceduralNotes}
                    </p>
                  )}
                  {step.authorityRefs?.some((ref) => authority[ref]) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {step.authorityRefs.map((ref, refIndex) =>
                        authority[ref] ? (
                          <button
                            key={refIndex}
                            type="button"
                            onClick={() => jumpToAuthority(ref)}
                            className="cite min-h-8 max-w-full truncate transition-colors hover:bg-gold/25"
                            data-testid={`authority-ref-${index}-${refIndex}`}
                          >
                            {authority[ref].citation}
                          </button>
                        ) : null,
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {guidanceGroups.length > 0 && (
          <Section title="Procedural guidance" testId="procedural-guidance-section">
            <div className="grid gap-5 sm:grid-cols-3">
              {guidanceGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="font-sans text-sm font-semibold">{group.title}</h3>
                  <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-foreground/85">
                    {group.items!.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Scope and assumptions" testId="scope-section">
          <p className="text-[15px] leading-relaxed text-foreground/85" data-testid="scope-content">
            {answer.scopeAssumptions}
          </p>
        </Section>

        <Section title="Confidence" testId="confidence-section">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-medium" data-testid="confidence-score">
              {answer.confidence?.score ?? 0}%
            </span>
            <div className="h-1 max-w-48 flex-1 rounded-full bg-muted">
              <div className={cn("h-1 rounded-full", confidence.bar)} style={{ width: `${answer.confidence?.score ?? 0}%` }} />
            </div>
            <span className={cn("text-sm font-medium", confidence.text)}>{confidence.label}</span>
          </div>
          {notesText && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground" data-testid="confidence-notes">
              {notesText}
            </p>
          )}
        </Section>

        {answer.furtherReading && answer.furtherReading.length > 0 && (
          <Section title="Further reading" testId="further-reading-section">
            <ul className="space-y-3">
              {answer.furtherReading.map((reading, index) => {
                const href = safeHref(reading.url);
                return (
                  <li key={index} className="text-sm leading-relaxed" data-testid={`further-reading-${index}`}>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block py-1.5 font-medium text-primary underline-offset-4 hover:underline">
                        {reading.citation}
                      </a>
                    ) : (
                      <span className="font-medium">{reading.citation}</span>
                    )}
                    <span className="text-muted-foreground"> {reading.title}. {reading.relevance}</span>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {answer.disclaimer && (
          <p className="border-t pt-5 text-xs leading-relaxed text-muted-foreground" data-testid="disclaimer-section">
            {answer.disclaimer}
          </p>
        )}
      </div>
    </article>
  );
}

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ResponseDisplay from "@/components/response-display";
import type { TaxQuery } from "@shared/schema";

interface ChatInterfaceProps {
  currentResponse: TaxQuery | null;
  setCurrentResponse: (response: TaxQuery | null) => void;
}

const EXAMPLES = [
  { title: "Startup costs", query: "When can startup costs be deducted vs. amortized under IRC §195?" },
  { title: "Home office", query: "What are the requirements for claiming the home office deduction under IRC §280A?" },
  { title: "S corporation election", query: "What are the timing requirements for filing Form 2553 to elect S corporation status?" },
  { title: "QBI deduction", query: "What are the requirements for the qualified business income deduction under IRC §199A?" },
];

/** Counts real seconds while a question is being answered. */
function useElapsedSeconds(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    setSeconds(0);
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return seconds;
}

export default function ChatInterface({ currentResponse, setCurrentResponse }: ChatInterfaceProps) {
  const [queryText, setQueryText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast, dismiss } = useToast();
  const client = useQueryClient();

  const submit = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/taxentia/query", { query });
      return response.json() as Promise<TaxQuery>;
    },
    onSuccess: (data) => {
      setCurrentResponse(data);
      setQueryText("");
      client.invalidateQueries({ queryKey: ["/api/queries"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "We couldn't answer that",
        description: "Your question is still in the box. Please try again.",
      });
    },
  });

  const elapsed = useElapsedSeconds(submit.isPending);
  const canSend = queryText.trim().length > 0 && !submit.isPending;

  // Grow the box with the text, up to the limit set in its class.
  // Its width can change without the text changing, so watch for that too.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const fit = () => {
      input.style.height = "auto";
      input.style.height = `${input.scrollHeight}px`;
    };
    fit();
    let lastWidth = input.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (input.offsetWidth !== lastWidth) {
        lastWidth = input.offsetWidth;
        fit();
      }
    });
    observer.observe(input);
    return () => observer.disconnect();
  }, [queryText]);

  const handleSubmit = () => {
    if (!canSend) return;
    dismiss(); // Clear any earlier error so it doesn't cover the new answer
    submit.mutate(queryText.trim());
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // On touch screens Enter adds a new line, and the send button sends
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (event.key === "Enter" && !event.shiftKey && !isTouch) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const applyExample = (query: string) => {
    setQueryText(query);
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-full flex-col" data-testid="chat-interface">
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
        {submit.isPending ? (
          <div className="mx-auto max-w-3xl animate-rise px-4 py-8 sm:px-6 sm:py-12" aria-live="polite">
            <p className="font-serif text-2xl leading-snug sm:text-3xl">{submit.variables}</p>
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Searching the Code, regulations, and IRS bulletins
              <span className="font-mono text-xs">{elapsed}s</span>
            </p>
            <div className="mt-8 space-y-3 border-l-2 border-gold pl-4">
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-5/6 bg-muted" />
              <Skeleton className="h-4 w-2/3 bg-muted" />
            </div>
          </div>
        ) : currentResponse ? (
          <ResponseDisplay response={currentResponse} />
        ) : (
          <div className="mx-auto flex min-h-full max-w-2xl animate-rise flex-col justify-center px-4 py-8 sm:px-6" data-testid="welcome-message">
            <h1 className="text-[2rem] leading-tight tracking-tight sm:text-5xl" data-testid="welcome-title">
              What are you researching?
            </h1>
            <p className="mt-3 text-muted-foreground" data-testid="welcome-description">
              Ask a U.S. federal tax question. Answers cite the Code, regulations, and IRS guidance.
            </p>
            <p className="eyebrow mt-8">Try one of these</p>
            <ul className="mt-2 border-t">
              {EXAMPLES.map((example, index) => (
                <li key={example.title} className="border-b">
                  <button
                    type="button"
                    onClick={() => applyExample(example.query)}
                    className="group flex w-full flex-col gap-0.5 py-3 text-left transition-colors hover:text-primary"
                    data-testid={`example-${index}`}
                  >
                    <span className="font-medium">{example.title}</span>
                    <span className="text-sm text-muted-foreground">{example.query}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-card px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6" data-testid="input-area">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-xl border border-input bg-background p-1.5 transition-shadow focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40">
            <textarea
              ref={inputRef}
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a federal tax question"
              aria-label="Your tax question"
              rows={1}
              maxLength={2000}
              disabled={submit.isPending}
              className="thin-scroll max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] leading-6 outline-none placeholder:text-muted-foreground disabled:opacity-60"
              data-testid="input-query"
            />
            <Button
              onClick={handleSubmit}
              disabled={!canSend}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-lg"
              aria-label="Send question"
              data-testid="button-submit-query"
            >
              <ArrowUp />
            </Button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground" data-testid="scope-notice">
            U.S. federal tax only. Answers can be wrong, so check the cited sources.
          </p>
        </div>
      </div>
    </div>
  );
}

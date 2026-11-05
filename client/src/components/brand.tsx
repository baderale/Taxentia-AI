import { cn } from "@/lib/utils";

interface LogoProps {
  /** Use on dark backgrounds. */
  inverted?: boolean;
  className?: string;
}

export function Logo({ inverted, className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} data-testid="logo">
      <span
        aria-hidden
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md pb-0.5 font-serif text-xl leading-none text-gold",
          inverted ? "bg-white/10" : "bg-primary",
        )}
      >
        §
      </span>
      <span className={cn("font-serif text-xl tracking-tight", inverted ? "text-white" : "text-foreground")}>
        Taxentia
      </span>
    </span>
  );
}

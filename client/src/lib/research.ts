import { AlertCircle, AlertTriangle, CheckCircle2, type LucideIcon } from "lucide-react";

export type ConfidenceColor = "green" | "amber" | "red";

interface ConfidenceStyle {
  label: "High" | "Medium" | "Low";
  icon: LucideIcon;
  text: string;
  bar: string;
}

const CONFIDENCE: Record<ConfidenceColor, ConfidenceStyle> = {
  green: { label: "High", icon: CheckCircle2, text: "text-good", bar: "bg-good" },
  amber: { label: "Medium", icon: AlertCircle, text: "text-warn", bar: "bg-warn" },
  red: { label: "Low", icon: AlertTriangle, text: "text-bad", bar: "bg-bad" },
};

export function confidenceStyle(color: string | undefined): ConfidenceStyle {
  return CONFIDENCE[color as ConfidenceColor] ?? CONFIDENCE.red;
}

/** Links come from model output, so only ever render http(s) addresses. */
export function safeHref(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
}

export function timeAgo(date: string | null | undefined): string {
  if (!date) return "";
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export const AUTHORITY_TYPE: Record<string, string> = {
  irc: "Internal Revenue Code",
  regs: "Treasury Regulation",
  pubs: "IRS publication",
  rulings: "IRS guidance",
  cases: "Court decision",
};

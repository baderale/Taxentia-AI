import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Logo } from "@/components/brand";

const NAV = [
  { href: "#answers", label: "Answers" },
  { href: "#sources", label: "Sources" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

const ANSWER_PARTS = [
  { title: "Conclusion", body: "The short answer comes first, so you can tell right away whether it helps." },
  { title: "Authority", body: "Each source is listed with its citation, type, version date, and a link to read it." },
  { title: "Analysis", body: "The reasoning runs step by step, and each step points to the authority behind it." },
  { title: "Scope and confidence", body: "Assumptions are stated, and a score shows how much review the answer needs." },
];

const CONFIDENCE_BANDS = [
  { label: "High", range: "85 to 100", bar: "bg-good", width: "w-full", body: "Sources speak directly to the question." },
  { label: "Medium", range: "60 to 84", bar: "bg-warn", width: "w-3/4", body: "Some interpretation or assumptions were needed." },
  { label: "Low", range: "0 to 59", bar: "bg-bad", width: "w-1/3", body: "Limited support. Research this one further." },
];

const SOURCES = [
  {
    cite: "26 U.S.C.",
    name: "Internal Revenue Code",
    body: "The federal tax statutes, searched section by section.",
  },
  {
    cite: "26 C.F.R.",
    name: "Treasury Regulations",
    body: "How Treasury interprets and applies the Code.",
  },
  {
    cite: "I.R.B.",
    name: "Internal Revenue Bulletins",
    body: "Published IRS guidance. New bulletins are checked every week.",
  },
];

const STEPS = [
  { title: "Ask", body: "Write your question in plain English." },
  { title: "Retrieve", body: "A vector search finds the most relevant passages in the library." },
  { title: "Draft", body: "An AI model writes a structured answer from those passages." },
  { title: "Verify", body: "You read the cited sources and decide what to rely on." },
];

const FAQS = [
  {
    q: "How accurate are the answers?",
    a: "Answers are written by an AI model from retrieved federal sources, so they can contain mistakes. The citations and confidence score show where to check. Read the underlying authority before relying on any answer.",
  },
  {
    q: "Can this replace my CPA or tax attorney?",
    a: "No. Taxentia is a research tool and does not give tax or legal advice. It is designed to help you find and read the right authority faster.",
  },
  {
    q: "What does the library cover?",
    a: "U.S. federal tax only: the Internal Revenue Code, Treasury Regulations, and Internal Revenue Bulletins. It does not include state tax law or a library of court decisions.",
  },
  {
    q: "How current is the information?",
    a: "New Internal Revenue Bulletins are checked weekly. The Code and regulations are loaded in larger batches and refreshed less often, so check the version date shown on each citation.",
  },
  {
    q: "Who can see my questions?",
    a: "Questions are saved to your account so you can reopen them, and other accounts can't open them. They are also sent to an AI provider to produce the answer, so leave out client names, Social Security numbers, and other sensitive details.",
  },
];

function SampleAnswer() {
  return (
    <figure className="rounded-xl bg-background p-5 text-foreground shadow-2xl shadow-black/40 sm:p-7">
      <figcaption className="eyebrow mb-4 flex items-center justify-between gap-3">
        <span>Sample answer format</span>
        <span className="flex items-center gap-1.5 normal-case tracking-normal text-good">
          <span className="h-1.5 w-1.5 rounded-full bg-good" aria-hidden />
          High confidence
        </span>
      </figcaption>
      <p className="font-serif text-xl leading-snug sm:text-2xl">
        Can a self-employed consultant deduct a home office?
      </p>
      <div className="mt-5 border-l-2 border-gold pl-4">
        <p className="eyebrow mb-1.5">Conclusion</p>
        <p className="text-sm leading-relaxed sm:text-[15px]">
          Generally yes, if part of the home is used regularly and exclusively as the principal place of
          business. The deduction is limited by the income from that business.
        </p>
      </div>
      <div className="mt-5">
        <p className="eyebrow mb-2">Authority</p>
        <ul className="flex flex-wrap gap-2">
          <li className="cite">IRC §280A(c)(1)</li>
          <li className="cite">IRC §280A(c)(5)</li>
          <li className="cite">Rev. Proc. 2013-13</li>
        </ul>
      </div>
    </figure>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero, with navigation on the same dark surface */}
      <div className="ruled bg-ink text-white">
        <nav className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6" aria-label="Main">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" aria-label="Taxentia home">
              <Logo inverted />
            </Link>
            <div className="hidden items-center gap-7 md:flex">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} className="text-sm text-white/70 transition-colors hover:text-white">
                  {item.label}
                </a>
              ))}
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button asChild className="bg-gold text-ink hover:bg-gold/90">
                <Link href="/auth">Get started</Link>
              </Button>
            </div>
            <button
              type="button"
              className="-mr-2 flex h-11 w-11 items-center justify-center md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {menuOpen && (
            <div className="space-y-1 border-t border-white/10 pb-4 pt-2 md:hidden">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 text-white/80"
                >
                  {item.label}
                </a>
              ))}
              <Button asChild variant="outline" className="mt-2 h-11 w-full border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/auth">Sign in</Link>
              </Button>
            </div>
          )}
        </nav>

        <header className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-16">
          <div className="animate-rise">
            <p className="eyebrow text-gold">Federal tax research</p>
            <h1 className="mt-4 text-[2.75rem] leading-[1.05] tracking-tight sm:text-6xl">
              Tax answers you can <em className="font-normal text-gold">trace to the source.</em>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
              Ask a federal tax question in plain English. Get a structured answer with citations to the Code,
              the regulations, and IRS guidance.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 bg-gold px-6 text-base text-ink hover:bg-gold/90">
                <Link href="/auth">
                  Get started <ArrowRight className="ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/25 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <a href="#answers">See how answers work</a>
              </Button>
            </div>
          </div>
          <div className="animate-rise [animation-delay:120ms]">
            <SampleAnswer />
          </div>
        </header>
      </div>

      <main>
        {/* Anatomy of an answer */}
        <section id="answers" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="eyebrow">Answers</p>
          <h2 className="mt-3 max-w-2xl text-3xl leading-tight tracking-tight sm:text-[2.5rem]">
            Every answer reads like a research memo.
          </h2>
          <ol className="mt-10 grid border-t border-foreground/80 sm:grid-cols-2 lg:grid-cols-4">
            {ANSWER_PARTS.map((part, index) => (
              <li key={part.title} className="border-b py-6 sm:pr-8 lg:border-b-0">
                <span className="font-mono text-xs text-gold-deep">0{index + 1}</span>
                <h3 className="mt-3 text-xl">{part.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{part.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-6 rounded-xl border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_2fr] lg:gap-12">
            <div>
              <h3 className="text-2xl leading-snug">Confidence is part of the answer.</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The score is the model's own assessment. It helps you decide how closely to review an answer, and
                it doesn't guarantee accuracy.
              </p>
            </div>
            <dl className="grid gap-6 sm:grid-cols-3">
              {CONFIDENCE_BANDS.map((band) => (
                <div key={band.label}>
                  <div className="h-1 rounded-full bg-muted">
                    <div className={`h-1 rounded-full ${band.bar} ${band.width}`} />
                  </div>
                  <dt className="mt-3 flex items-baseline justify-between gap-2 font-medium">
                    {band.label}
                    <span className="font-mono text-xs font-normal text-muted-foreground">{band.range}</span>
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{band.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Sources */}
        <section id="sources" className="border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
            <p className="eyebrow">Sources</p>
            <h2 className="mt-3 max-w-2xl text-3xl leading-tight tracking-tight sm:text-[2.5rem]">
              Built on primary federal sources.
            </h2>
            <ul className="mt-10 border-t border-foreground/80">
              {SOURCES.map((source) => (
                <li key={source.cite} className="grid gap-2 border-b py-5 sm:grid-cols-[9rem_1fr_1.4fr] sm:items-baseline sm:gap-6">
                  <span className="font-mono text-sm text-gold-deep">{source.cite}</span>
                  <span className="font-serif text-xl">{source.name}</span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{source.body}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 max-w-2xl text-3xl leading-tight tracking-tight sm:text-[2.5rem]">
            The model answers from what it retrieves.
          </h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-l border-foreground/20 pl-5">
                <span className="font-mono text-xs text-muted-foreground">Step {index + 1}</span>
                <h3 className="mt-2 text-xl">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t bg-card">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_2fr] lg:gap-16 lg:py-24">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2 className="mt-3 text-3xl leading-tight tracking-tight sm:text-[2.5rem]">Before you rely on it.</h2>
            </div>
            <Accordion type="single" collapsible className="border-t border-foreground/80">
              {FAQS.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="py-5 text-left font-sans text-base font-medium hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      {/* Closing call to action and footer */}
      <footer className="ruled bg-ink text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="max-w-2xl text-4xl leading-tight tracking-tight sm:text-5xl">
            Start with your next tax question.
          </h2>
          <Button asChild size="lg" className="mt-8 h-12 w-full bg-gold px-6 text-base text-ink hover:bg-gold/90 sm:w-auto">
            <Link href="/auth">
              Get started <ArrowRight className="ml-1" />
            </Link>
          </Button>
          <div className="mt-16 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Logo inverted />
            <p className="max-w-xl text-xs leading-relaxed text-white/60 sm:text-right">
              © {new Date().getFullYear()} Taxentia. A research tool that doesn't provide tax or legal advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

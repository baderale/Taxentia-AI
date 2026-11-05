import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-7xl text-gold-deep" aria-hidden>§</p>
      <h1 className="mt-4 text-3xl tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted-foreground">This page doesn't exist or may have moved.</p>
      <Button asChild className="mt-6 h-11">
        <Link href="/">Back to Taxentia</Link>
      </Button>
    </main>
  );
}

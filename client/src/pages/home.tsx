import { useState } from "react";
import { BarChart3, Menu, MessageSquareText, PanelLeft, Plus } from "lucide-react";
import ChatInterface from "@/components/chat-interface";
import QueryHistory from "@/components/query-history";
import Dashboard from "@/components/dashboard";
import UserMenu from "@/components/user-menu";
import { Logo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { TaxQuery } from "@shared/schema";

type View = "chat" | "dashboard";

const VIEWS: { id: View; label: string; icon: typeof BarChart3 }[] = [
  { id: "chat", label: "Research", icon: MessageSquareText },
  { id: "dashboard", label: "Activity", icon: BarChart3 },
];

export default function Home() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<View>("chat");
  const [current, setCurrent] = useState<TaxQuery | null>(null);

  const openQuery = (query: TaxQuery) => {
    setCurrent(query);
    setView("chat");
    setDrawerOpen(false);
  };

  const startNew = () => {
    setCurrent(null);
    setView("chat");
    setDrawerOpen(false);
  };

  const historyPanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-3">
        <Button onClick={startNew} variant="outline" className="h-10 w-full justify-start bg-card" data-testid="button-new-research">
          <Plus /> New research
        </Button>
      </div>
      <QueryHistory onSelectQuery={openQuery} selectedQuery={current?.id ?? null} />
    </div>
  );

  return (
    <div className="flex h-[100dvh] flex-col" data-testid="home-page">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-card px-2 sm:px-3" data-testid="header">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open history"
            data-testid="button-open-history"
          >
            <Menu />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 md:inline-flex"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Hide history" : "Show history"}
            aria-expanded={sidebarOpen}
            data-testid="button-toggle-sidebar"
          >
            <PanelLeft />
          </Button>
          <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
        </div>

        <nav className="flex rounded-lg bg-muted p-0.5" aria-label="Views">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                view === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              data-testid={`nav-${id}`}
            >
              <Icon className="hidden h-4 w-4 sm:block" />
              {label}
            </button>
          ))}
        </nav>

        <UserMenu />
      </header>

      <div className="flex min-h-0 flex-1">
        {sidebarOpen && !isMobile && (
          <aside className="hidden w-72 shrink-0 border-r md:block" data-testid="sidebar">
            {historyPanel}
          </aside>
        )}

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="left" className="w-[86vw] max-w-sm bg-background p-0 pt-10">
            <SheetTitle className="sr-only">Research history</SheetTitle>
            <SheetDescription className="sr-only">Search and reopen your earlier questions.</SheetDescription>
            {historyPanel}
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1">
          {view === "chat" ? (
            <ChatInterface currentResponse={current} setCurrentResponse={setCurrent} />
          ) : (
            <Dashboard onOpenQuery={openQuery} />
          )}
        </main>
      </div>
    </div>
  );
}

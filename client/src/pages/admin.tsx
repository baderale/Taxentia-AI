import { useState } from "react";
import { Check, Copy, KeyRound, Loader2, UserPlus } from "lucide-react";
import { Logo } from "@/components/brand";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeAgo } from "@/lib/research";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  createdAt: string | null;
  questionCount: number;
}

interface Credentials {
  email: string;
  password: string;
  title: string;
}

/** The admin key stays in this page's memory only, so reloading asks for it again. */
async function adminRequest<T>(key: string, method: string, url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "x-admin-secret": key, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? "That admin key isn't correct." : data.message || "Something went wrong.");
  return data as T;
}

function CredentialsCard({ credentials, onDone }: { credentials: Credentials; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const message = `Your Taxentia login\nSite: ${window.location.origin}/auth\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
  };

  return (
    <div className="rounded-xl border-l-[3px] border-gold bg-card p-5 shadow-sm" data-testid="credentials-card">
      <h2 className="text-xl">{credentials.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Copy this now. The password won't be shown again.</p>
      <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-[13px] leading-relaxed" data-testid="credentials-text">{message}</pre>
      <div className="mt-3 flex gap-2">
        <Button onClick={copy} className="h-10">
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy login details"}
        </Button>
        <Button onClick={onDone} variant="ghost" className="h-10">Done</Button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [key, setKey] = useState("");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const loadUsers = () => adminRequest<AdminUser[]>(key, "GET", "/api/admin/users").then(setUsers);

  const createUser = (event: React.FormEvent) => {
    event.preventDefault();
    run(async () => {
      const created = await adminRequest<{ email: string; temporaryPassword?: string }>(key, "POST", "/api/admin/users", {
        email,
        fullName: fullName || undefined,
        password: password || undefined,
      });
      setCredentials({ title: "User created", email: created.email, password: created.temporaryPassword ?? password });
      setEmail("");
      setFullName("");
      setPassword("");
      await loadUsers();
    });
  };

  const resetPassword = (user: AdminUser) => {
    run(async () => {
      const { temporaryPassword } = await adminRequest<{ temporaryPassword: string }>(key, "POST", `/api/admin/users/${user.id}/reset-password`);
      setCredentials({ title: `New password for ${user.email}`, email: user.email, password: temporaryPassword });
    });
  };

  const errorAlert = error && (
    <Alert variant="destructive" className="mt-4">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  if (!users) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-sm flex-col justify-center px-5 py-10">
        <Logo />
        <h1 className="mt-8 text-4xl tracking-tight">Manage users</h1>
        <p className="mt-2 text-muted-foreground">Enter the admin key to continue.</p>
        {errorAlert}
        <form
          className="mt-6 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            run(loadUsers);
          }}
        >
          <label htmlFor="admin-key" className="text-sm font-medium">Admin key</label>
          <Input
            id="admin-key"
            type="password"
            autoComplete="off"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            className="h-11 bg-card"
          />
          <Button type="submit" className="h-11 w-full" disabled={busy || !key}>
            {busy && <Loader2 className="animate-spin" />} Continue
          </Button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <Logo />
      <h1 className="mt-8 text-4xl tracking-tight">Manage users</h1>
      {errorAlert}

      {credentials && (
        <div className="mt-6">
          <CredentialsCard credentials={credentials} onDone={() => setCredentials(null)} />
        </div>
      )}

      <form onSubmit={createUser} className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="text-xl">Create a user</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="new-email" className="text-sm font-medium">Email</label>
            <Input id="new-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="new-name" className="text-sm font-medium">Full name (optional)</label>
            <Input id="new-name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-sm font-medium">Password (optional)</label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Leave the password blank to generate one.</p>
        <Button type="submit" className="mt-4 h-11" disabled={busy || !email}>
          {busy ? <Loader2 className="animate-spin" /> : <UserPlus />} Create user
        </Button>
      </form>

      <section className="mt-8">
        <h2 className="eyebrow border-b pb-2 font-mono">Users ({users.length})</h2>
        {users.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No users yet.</p>
        ) : (
          <ul>
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 border-b py-3" data-testid={`admin-user-${user.username}`}>
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.fullName || user.username}</p>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {user.questionCount} {user.questionCount === 1 ? "question" : "questions"} · joined {timeAgo(user.createdAt).replace("Just now", "just now")}
                  </p>
                </div>
                <Button variant="outline" className="h-10" disabled={busy} onClick={() => resetPassword(user)}>
                  <KeyRound /> Reset password
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

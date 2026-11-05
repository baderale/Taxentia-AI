import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import AuthLogin from '@/components/auth-login';
import AuthSignup from '@/components/auth-signup';
import { Logo } from '@/components/brand';
import { useAuth } from '@/lib/auth-context';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) setLocation('/');
  }, [loading, isAuthenticated, setLocation]);

  if (!loading && isAuthenticated) return null;

  const handleSuccess = () => setLocation('/');

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1fr_1.1fr]">
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" aria-label="Taxentia home" className="self-start">
          <Logo />
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 items-center py-10">
          {mode === 'login' ? (
            <AuthLogin onSuccess={handleSuccess} onSwitchToSignup={() => setMode('signup')} />
          ) : (
            <AuthSignup onSuccess={handleSuccess} onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </main>

      <aside className="ruled hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <p className="eyebrow text-gold">Federal tax research</p>
        <div>
          <p className="font-serif text-5xl leading-[1.1] tracking-tight">
            Tax answers you can <em className="block text-gold">trace to the source.</em>
          </p>
          <ul className="mt-8 flex flex-wrap gap-2 font-mono text-xs text-white/80">
            <li className="rounded border border-white/20 px-2 py-1">26 U.S.C.</li>
            <li className="rounded border border-white/20 px-2 py-1">26 C.F.R.</li>
            <li className="rounded border border-white/20 px-2 py-1">I.R.B.</li>
          </ul>
        </div>
        <p className="text-xs text-white/60">A research tool that doesn't provide tax or legal advice.</p>
      </aside>
    </div>
  );
}

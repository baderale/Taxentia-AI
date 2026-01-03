import { useState } from 'react';
import { useLocation } from 'wouter';
import AuthLogin from '@/components/auth-login';
import AuthSignup from '@/components/auth-signup';
import { useAuth } from '@/lib/auth-context';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  // Redirect to home if already authenticated
  if (!loading && isAuthenticated) {
    setLocation('/');
    return null;
  }

  const handleSuccess = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-taxentia-light-gray flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header with Taxentia Branding */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-5xl font-bold text-taxentia-navy mb-3">
            Taxentia
          </h1>
          <p className="font-body text-base text-taxentia-text-slate">
            AI-Powered Tax Guidance & Research
          </p>
        </div>

        {/* Auth Forms */}
        {mode === 'login' ? (
          <AuthLogin
            onSuccess={handleSuccess}
            onSwitchToSignup={() => setMode('signup')}
          />
        ) : (
          <AuthSignup
            onSuccess={handleSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        )}

        {/* Stats Grid - Taxentia Style */}
        <div className="mt-10 text-center">
          <p className="font-body text-sm text-taxentia-text-slate mb-6">
            Professional tax analysis powered by AI and real-time authority sources
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-taxentia-slate shadow-sm">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-taxentia-sky/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-taxentia-sky" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="font-heading text-h3 font-bold text-taxentia-navy mb-1">4,143+</div>
              <div className="font-body text-small text-taxentia-text-slate">Tax Sources</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-taxentia-slate shadow-sm">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-taxentia-gold/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-taxentia-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="font-heading text-h3 font-bold text-taxentia-navy mb-1">AI-Powered</div>
              <div className="font-body text-small text-taxentia-text-slate">GPT-4o Analysis</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-taxentia-slate shadow-sm">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-taxentia-emerald/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-taxentia-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="font-heading text-h3 font-bold text-taxentia-navy mb-1">Always Fresh</div>
              <div className="font-body text-small text-taxentia-text-slate">Weekly Updates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

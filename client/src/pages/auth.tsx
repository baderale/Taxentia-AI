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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Taxentia
            </span>
          </h1>
          <p className="text-gray-600">AI-Powered Tax Guidance & Research</p>
        </div>

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

        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-4">
            Professional tax analysis powered by AI and real-time authority sources
          </p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-semibold text-gray-900">4,143+</div>
              <div>Tax Sources</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">AI-Powered</div>
              <div>GPT-5 Analysis</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Always Fresh</div>
              <div>Weekly Updates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

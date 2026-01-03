import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

export default function AuthLogin({ onSuccess, onSwitchToSignup }: LoginProps) {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      onSuccess?.();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  const displayError = localError || error;

  return (
    <Card className="w-full max-w-md shadow-lg border-taxentia-slate">
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="font-heading text-h2 text-taxentia-navy">Welcome Back</CardTitle>
        <CardDescription className="font-body text-body text-taxentia-text-slate">
          Sign in to your Taxentia account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {displayError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="font-body text-sm font-medium text-taxentia-navy">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="font-body border-taxentia-slate focus:ring-2 focus:ring-taxentia-sky focus:border-taxentia-sky"
            />
          </div>

          <div className="space-y-2">
            <label className="font-body text-sm font-medium text-taxentia-navy">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="font-body border-taxentia-slate focus:ring-2 focus:ring-taxentia-sky focus:border-taxentia-sky"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-taxentia-sky hover:bg-taxentia-sky-light text-white font-heading font-semibold py-6 text-base shadow-md transition-colors"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <div className="text-center text-sm pt-2">
            <span className="font-body text-taxentia-text-slate">Don't have an account? </span>
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-body text-taxentia-sky hover:text-taxentia-navy hover:underline font-semibold"
            >
              Sign up
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

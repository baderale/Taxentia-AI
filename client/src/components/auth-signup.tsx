import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SignupProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function AuthSignup({ onSuccess, onSwitchToLogin }: SignupProps) {
  const { register, error } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!email.trim() || !username.trim() || !password.trim()) {
      setLocalError('Email, username, and password are required');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (username.length < 3) {
      setLocalError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, username, fullName || undefined);
      onSuccess?.();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  const displayError = localError || error;

  return (
    <Card className="w-full max-w-md shadow-lg border-taxentia-slate">
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="font-heading text-h2 text-taxentia-navy">Create Account</CardTitle>
        <CardDescription className="font-body text-body text-taxentia-text-slate">
          Join Taxentia for AI-powered tax guidance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="font-body text-sm font-medium text-taxentia-navy">Username</label>
            <Input
              type="text"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="font-body border-taxentia-slate focus:ring-2 focus:ring-taxentia-sky focus:border-taxentia-sky"
            />
          </div>

          <div className="space-y-2">
            <label className="font-body text-sm font-medium text-taxentia-navy">Full Name (Optional)</label>
            <Input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
            <p className="font-body text-xs text-taxentia-text-slate">At least 8 characters</p>
          </div>

          <div className="space-y-2">
            <label className="font-body text-sm font-medium text-taxentia-navy">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            Create Account
          </Button>

          <div className="text-center text-sm pt-2">
            <span className="font-body text-taxentia-text-slate">Already have an account? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-body text-taxentia-sky hover:text-taxentia-navy hover:underline font-semibold"
            >
              Sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

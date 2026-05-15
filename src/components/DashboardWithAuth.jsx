import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Login landing rendered at '/'. Reads auth state from AuthContext rather
// than firing an independent isAuthenticated() call. After successful login,
// triggers checkUserAuth on the context so every other AuthContext consumer
// (AuthGuard, useCurrentUser, etc.) sees the new session immediately.

export default function DashboardWithAuth() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth, authChecked, checkUserAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (authChecked && !isLoadingAuth && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoggingIn(true);

    try {
      await base44.auth.login(email, password);
      // Refresh the context's user/isAuthenticated state so every consumer
      // (AuthGuard, useCurrentUser) re-renders with the new session.
      await checkUserAuth();
      setEmail('');
      setPassword('');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          <span className="text-xs text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#000000' }}
      >
        <Card className="w-full max-w-md mx-4 border-0 shadow-2xl">
          <CardHeader className="text-center space-y-2 pb-8 pt-8">
            <div className="mb-2">
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#F26722' }}>
                Surgical Practice Solutions
              </span>
            </div>
            <h1 className="text-3xl font-bold" style={{ color: '#000000' }}>
              Operations Hub
            </h1>
            <p className="text-sm" style={{ color: '#666666' }}>
              Internal Operations Platform
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loggingIn}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loggingIn}
                />
              </div>

              {error && (
                <div className="p-3 rounded-md" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loggingIn}
              >
                {loggingIn ? 'Logging in…' : 'Log In'}
              </Button>
            </form>

            <p className="text-xs text-center" style={{ color: '#999999' }}>
              Contact your administrator to create an account
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated state — useEffect navigates away.
  return null;
}
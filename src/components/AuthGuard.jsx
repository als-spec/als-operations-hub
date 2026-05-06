import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

// Redirects unauthenticated users to '/' (the login landing). Reads from
// AuthContext rather than firing its own auth.isAuthenticated() — the
// context's auth.me() check is the single source of truth for session state.

export default function AuthGuard({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth, authChecked } = useAuth();

  useEffect(() => {
    if (authChecked && !isLoadingAuth && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [authChecked, isLoadingAuth, isAuthenticated, navigate]);

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

  if (!isAuthenticated) return null;

  return children;
}

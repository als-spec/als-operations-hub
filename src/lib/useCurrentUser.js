import { useAuth } from '@/lib/AuthContext';

// Reads the authenticated user from AuthContext rather than firing its own
// auth.me() call. Originally this hook hit the SDK from every component that
// used it (11+ sites pre-merge, 13+ post-merge), producing an N+1 fan-out on
// every page load. Now it's a thin selector over the shared context.

export function useCurrentUser() {
  const { user, isLoadingAuth } = useAuth();

  return {
    user,
    loading: isLoadingAuth,
    isFounder: user?.role === 'founder' || user?.role === 'admin',
    isOperator: user?.role === 'operator',
    isVA: user?.role === 'va',
    isAnalyst: user?.role === 'analyst',
  };
}

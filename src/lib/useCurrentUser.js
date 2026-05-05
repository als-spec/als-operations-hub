import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isFounder = user?.role === 'founder' || user?.role === 'admin';
  const isOperator = user?.role === 'operator';
  const isAnalyst = user?.role === 'analyst';

  return { user, loading, isFounder, isOperator, isAnalyst };
}
import { useEffect, useState } from 'react';
import { callPublicFunction, getSessionId } from '@/api/publicClient';

// Drives a public page's lifecycle:
//   loading -> {valid + verified}     (render content)
//           -> {valid + !verified}    (render verification gate)
//           -> {!valid}               (render expired/invalid page)
//
// The hook never touches the actual record — only the token's metadata. The
// content fetch is the responsibility of the page (PublicSowReview, ClientPortal).

export function usePublicTokenSession(token) {
  const [state, setState] = useState({
    loading: true,
    valid: null,
    reason: null,
    recipientHint: '',
    resourceType: null,
    verified: false,
  });

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState((s) => ({ ...s, loading: false, valid: false, reason: 'invalid' }));
      return;
    }

    (async () => {
      try {
        const data = await callPublicFunction('publicCheckToken', { token });
        if (cancelled) return;
        if (!data?.ok) {
          setState({
            loading: false,
            valid: false,
            reason: data?.reason || 'invalid',
            recipientHint: '',
            resourceType: null,
            verified: false,
          });
          return;
        }
        setState({
          loading: false,
          valid: true,
          reason: null,
          recipientHint: data.recipient_email_hint || '',
          resourceType: data.resource_type || null,
          verified: !!getSessionId(token),
        });
      } catch (_err) {
        if (cancelled) return;
        setState({
          loading: false,
          valid: false,
          reason: 'invalid',
          recipientHint: '',
          resourceType: null,
          verified: false,
        });
      }
    })();

    return () => { cancelled = true; };
  }, [token]);

  const markVerified = () => setState((s) => ({ ...s, verified: true }));

  return { ...state, markVerified };
}

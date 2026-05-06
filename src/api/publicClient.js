import { base44 } from '@/api/base44Client';

// Wrapper around Base44 functions for unauthenticated public pages.
//
// Public pages cannot import @/api/base44Client directly (ESLint guard); they go
// through this module. We re-use the SDK transport for now and surface a typed
// error so call sites get consistent shape across success/failure.
//
// Verified-session lifecycle:
//   1. EmailVerificationGate calls verifyCode -> server returns session_id
//   2. setSessionId(token, session_id) caches it in sessionStorage (per-tab)
//   3. Future guarded calls send {token, session_id, ...} via callGuardedPublicFunction
//   4. Server looks up VerifiedSession entity to authorize each guarded call

const SS_PREFIX = 'als-vs:';

export class PublicFunctionError extends Error {
  constructor(status, body) {
    super(body?.error || (status ? `HTTP ${status}` : 'Network error'));
    this.status = status;
    this.body = body;
  }
}

export async function callPublicFunction(name, body = {}) {
  try {
    const res = await base44.functions.invoke(name, body);
    return res;
  } catch (err) {
    const status = err?.status || err?.response?.status || 500;
    const data = err?.data || err?.response?.data || { error: err?.message };
    throw new PublicFunctionError(status, data);
  }
}

export async function callGuardedPublicFunction(name, token, extra = {}) {
  const session_id = getSessionId(token);
  if (!session_id) {
    throw new PublicFunctionError(401, { error: 'Verification required', requires_verification: true });
  }
  return callPublicFunction(name, { token, session_id, ...extra });
}

export function getSessionId(token) {
  try { return sessionStorage.getItem(SS_PREFIX + token); } catch { return null; }
}

export function setSessionId(token, sessionId) {
  try { sessionStorage.setItem(SS_PREFIX + token, sessionId); } catch { /* ignore */ }
}

export function clearSessionId(token) {
  try { sessionStorage.removeItem(SS_PREFIX + token); } catch { /* ignore */ }
}

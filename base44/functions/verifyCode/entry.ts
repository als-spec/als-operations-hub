import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const SESSION_TTL_HOURS = 24;
const MAX_ATTEMPTS = 5;

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSessionId(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Constant-time comparison to make timing attacks against the hash useless.
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) {
    r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return r === 0;
}

Deno.serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || '';
  const ua = req.headers.get('user-agent') || '';

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => null);
    const token = body?.token;
    const code = body?.code;

    if (!token || typeof token !== 'string' || !code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return Response.json({ error: 'Invalid code format' }, { status: 400 });
    }

    const tokens = await base44.entities.PublicAccessToken.filter({ token });
    if (!tokens.length) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
    const t = tokens[0];

    if (
      t.revoked ||
      (t.expires_at && new Date(t.expires_at) < new Date()) ||
      (t.single_use && t.consumed_at)
    ) {
      return Response.json({ error: 'Link no longer valid' }, { status: 410 });
    }

    // Find most recent unconsumed, unexpired code for this token.
    const allCodes = await base44.entities.EmailVerificationCode.filter({ token_id: t.id });
    const now = new Date();
    const candidates = allCodes
      .filter((c: any) => !c.consumed_at && new Date(c.expires_at) > now)
      .sort((a: any, b: any) =>
        new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime(),
      );

    if (!candidates.length) {
      return Response.json({ error: 'No active code. Request a new one.' }, { status: 410 });
    }

    const candidate = candidates[0];

    if ((candidate.attempts || 0) >= MAX_ATTEMPTS) {
      return Response.json(
        { error: 'Too many failed attempts. Request a new code.' },
        { status: 429 },
      );
    }

    const inputHash = await sha256Hex(code);
    const valid = constantTimeEqual(inputHash, candidate.code_hash || '');

    if (!valid) {
      const newAttempts = (candidate.attempts || 0) + 1;
      const updates: any = { attempts: newAttempts };
      // Burn the code at max attempts so further tries fail without consulting the hash.
      if (newAttempts >= MAX_ATTEMPTS) {
        updates.consumed_at = new Date().toISOString();
      }
      await base44.entities.EmailVerificationCode.update(candidate.id, updates).catch(() => {});

      await base44.entities.PublicAccessEvent.create({
        token_id: t.id,
        resource_type: t.resource_type,
        resource_id: t.resource_id,
        action: 'verify_failure',
        ts: new Date().toISOString(),
        ip, user_agent: ua,
        success: false,
        metadata: { attempts: newAttempts },
      }).catch(() => {});

      return Response.json(
        { error: 'Incorrect code', attempts_remaining: Math.max(0, MAX_ATTEMPTS - newAttempts) },
        { status: 401 },
      );
    }

    // Success — burn the code, mint a session.
    await base44.entities.EmailVerificationCode.update(candidate.id, {
      consumed_at: new Date().toISOString(),
      attempts: (candidate.attempts || 0) + 1,
    }).catch(() => {});

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();
    const issuedAt = new Date().toISOString();

    await base44.entities.VerifiedSession.create({
      session_id: sessionId,
      token_id: t.id,
      verified_email: t.recipient_email,
      issued_at: issuedAt,
      expires_at: expiresAt,
      ip,
      user_agent: ua,
    });

    await base44.entities.PublicAccessEvent.create({
      token_id: t.id,
      resource_type: t.resource_type,
      resource_id: t.resource_id,
      action: 'verify_success',
      ts: issuedAt,
      ip, user_agent: ua,
      success: true,
      metadata: {},
    }).catch(() => {});

    return Response.json({
      success: true,
      session_id: sessionId,
      expires_at: expiresAt,
      verified_email: t.recipient_email,
    });
  } catch (err) {
    console.error('verifyCode failed:', err);
    return Response.json({ error: 'Verification failed.' }, { status: 500 });
  }
});

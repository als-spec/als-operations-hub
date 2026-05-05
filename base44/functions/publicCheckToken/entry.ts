import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 1) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const masked = local.length <= 2 ? local[0] + '*' : local.slice(0, 2) + '***';
  return `${masked}@${domain}`;
}

// Always returns 200 with {ok: bool}. Status-code response would otherwise leak
// whether a token exists vs. is expired vs. is malformed.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => null);
    const token = body?.token;

    if (!token || typeof token !== 'string') {
      return Response.json({ ok: false, reason: 'invalid' });
    }

    const tokens = await base44.entities.PublicAccessToken.filter({ token });
    if (!tokens.length) {
      return Response.json({ ok: false, reason: 'invalid' });
    }
    const t = tokens[0];

    if (t.revoked) return Response.json({ ok: false, reason: 'revoked' });
    if (t.expires_at && new Date(t.expires_at) < new Date()) {
      return Response.json({ ok: false, reason: 'expired' });
    }
    if (t.single_use && t.consumed_at) {
      return Response.json({ ok: false, reason: 'consumed' });
    }

    // Log a view event but don't increment access_count — that's bookkeeping for
    // the actual content fetch, not for tab opens / status checks.
    await base44.entities.PublicAccessEvent.create({
      token_id: t.id,
      resource_type: t.resource_type,
      resource_id: t.resource_id,
      action: 'view',
      ts: new Date().toISOString(),
      ip: req.headers.get('x-forwarded-for') || '',
      user_agent: req.headers.get('user-agent') || '',
      success: true,
      metadata: {},
    }).catch(() => {});

    return Response.json({
      ok: true,
      resource_type: t.resource_type,
      recipient_email_hint: maskEmail(t.recipient_email || ''),
      single_use: !!t.single_use,
    });
  } catch (err) {
    console.error('publicCheckToken failed:', err);
    return Response.json({ ok: false, reason: 'invalid' });
  }
});

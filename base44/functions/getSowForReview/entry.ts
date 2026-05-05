import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

// Guarded read for the SOW review page. Validates the (token, session_id) pair
// and the sign scope, then returns ONLY the fields the public page needs.
// Strict allowlist projection — never spread the source record.

const ALLOWED_RECORD_FIELDS = [
  'facility_name', 'admin_name',
  'sow_generated_url', 'sow_generated_date',
  'proposed_fee', 'proposed_kickoff_window',
  'sow_signed_at', 'sow_signed_by_name', 'sow_signed_url',
];

function projectRecord(record: any) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED_RECORD_FIELDS) out[k] = record?.[k] ?? null;
  return out;
}

Deno.serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || '';
  const ua = req.headers.get('user-agent') || '';

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => null);
    const token = body?.token;
    const session_id = body?.session_id;

    if (!token || typeof token !== 'string' || !session_id || typeof session_id !== 'string') {
      return Response.json(
        { error: 'Verification required', requires_verification: true },
        { status: 401 },
      );
    }

    const tokens = await base44.entities.PublicAccessToken.filter({ token });
    if (!tokens.length) return Response.json({ error: 'Invalid request' }, { status: 400 });
    const t = tokens[0];

    if (t.resource_type !== 'sow') {
      return Response.json({ error: 'Wrong resource type' }, { status: 400 });
    }
    if (t.revoked) return Response.json({ error: 'Link no longer valid' }, { status: 410 });
    if (t.expires_at && new Date(t.expires_at) < new Date()) {
      return Response.json({ error: 'Link no longer valid' }, { status: 410 });
    }
    if (t.single_use && t.consumed_at) {
      return Response.json({ error: 'Already signed' }, { status: 410 });
    }
    if (!Array.isArray(t.scope) || !t.scope.includes('read')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sessions = await base44.entities.VerifiedSession.filter({ session_id });
    const sess = sessions?.[0];
    if (!sess || sess.token_id !== t.id) {
      return Response.json(
        { error: 'Verification expired', requires_verification: true },
        { status: 401 },
      );
    }
    if (sess.expires_at && new Date(sess.expires_at) < new Date()) {
      return Response.json(
        { error: 'Verification expired', requires_verification: true },
        { status: 401 },
      );
    }
    if (
      (sess.verified_email || '').toLowerCase().trim() !==
      (t.recipient_email || '').toLowerCase().trim()
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const records = await base44.entities.PipelineRecord.filter({ id: t.resource_id });
    if (!records.length) {
      return Response.json({ error: 'Record not found' }, { status: 404 });
    }
    const record = records[0];

    await base44.entities.PublicAccessToken.update(t.id, {
      access_count: (t.access_count || 0) + 1,
      last_accessed_at: new Date().toISOString(),
    }).catch(() => {});

    await base44.entities.PublicAccessEvent.create({
      token_id: t.id,
      resource_type: t.resource_type,
      resource_id: t.resource_id,
      action: 'view',
      ts: new Date().toISOString(),
      ip,
      user_agent: ua,
      success: true,
      metadata: { fetched: 'sow' },
    }).catch(() => {});

    return Response.json({
      record: projectRecord(record),
      can_sign: Array.isArray(t.scope) && t.scope.includes('sign') && !t.consumed_at,
      already_signed: !!record.sow_signed_at,
      recipient_email: t.recipient_email,
      recipient_name: t.recipient_name || '',
    });
  } catch (err) {
    console.error('getSowForReview failed:', err);
    return Response.json({ error: 'Failed to load SOW' }, { status: 500 });
  }
});

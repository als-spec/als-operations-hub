import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

// Guarded read for the client portal. Returns ONLY the curated client-safe
// slice of an Engagement; every field is on an explicit allowlist. Internal
// fields (fee, internal_notes, guarantee_*, freshbooks_*, deposit_*,
// balance_*, operator_id) are never returned.
//
// Sub-array projections (milestones, deliverables, data_requests) are
// also field-level allowlists — internal `notes` on each are stripped.

const ALLOWED_ENGAGEMENT_FIELDS = [
  'facility_name',
  'kickoff_date', 'delivery_target', 'on_site_date',
  'status',
  'operator_name',
  'findings_delivered',
  'sow_signed_url', 'sow_signed_date', 'sow_signed_by_name', 'sow_signed_at',
  'findings_deck_url', 'findings_deck_delivered_date',
  'dashboard_url', 'dashboard_delivered_date',
  'roadmap_url', 'roadmap_delivered_date',
];

const ALLOWED_MILESTONE_FIELDS = ['type', 'completed', 'completed_date'];
const ALLOWED_DATA_REQUEST_FIELDS = ['item_name', 'status', 'due_date'];
const ALLOWED_DELIVERABLE_FIELDS = ['name', 'status', 'file_url', 'delivery_date'];

function pick<T extends Record<string, unknown>>(src: any, fields: string[]): T {
  const out: any = {};
  for (const k of fields) out[k] = src?.[k] ?? null;
  return out as T;
}

function projectEngagement(record: any) {
  const base = pick(record, ALLOWED_ENGAGEMENT_FIELDS);
  return {
    ...base,
    milestones: Array.isArray(record?.milestones)
      ? record.milestones.map((m: any) => pick(m, ALLOWED_MILESTONE_FIELDS))
      : [],
    data_requests: Array.isArray(record?.data_requests)
      ? record.data_requests.map((d: any) => pick(d, ALLOWED_DATA_REQUEST_FIELDS))
      : [],
    deliverables: Array.isArray(record?.deliverables)
      ? record.deliverables.map((d: any) => pick(d, ALLOWED_DELIVERABLE_FIELDS))
      : [],
  };
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

    if (t.resource_type !== 'portal') {
      return Response.json({ error: 'Wrong resource type' }, { status: 400 });
    }
    if (t.revoked) return Response.json({ error: 'Link no longer valid' }, { status: 410 });
    if (t.expires_at && new Date(t.expires_at) < new Date()) {
      return Response.json({ error: 'Link no longer valid' }, { status: 410 });
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

    const records = await base44.entities.Engagement.filter({ id: t.resource_id });
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
      metadata: { fetched: 'portal' },
    }).catch(() => {});

    return Response.json({
      engagement: projectEngagement(record),
      scope: t.scope,
      can_upload: t.scope.includes('upload'),
      can_acknowledge: t.scope.includes('acknowledge'),
      recipient_email: t.recipient_email,
      recipient_name: t.recipient_name || '',
    });
  } catch (err) {
    console.error('getClientPortalView failed:', err);
    return Response.json({ error: 'Failed to load portal' }, { status: 500 });
  }
});

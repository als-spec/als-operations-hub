import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const SOW_DEFAULT_DAYS = 14;
const SOW_MAX_DAYS = 30;
const PORTAL_DEFAULT_DAYS = 90;
const PORTAL_MAX_DAYS = 365;
const ALLOWED_ROLES = new Set(['founder', 'operator', 'admin']);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ALLOWED_ROLES.has(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return Response.json({ error: 'Invalid request body' }, { status: 400 });

    const { resource_type, resource_id, recipient_email, recipient_name, expires_in_days } = body;

    if (resource_type !== 'sow' && resource_type !== 'portal') {
      return Response.json({ error: 'resource_type must be "sow" or "portal"' }, { status: 400 });
    }
    if (!resource_id || typeof resource_id !== 'string') {
      return Response.json({ error: 'resource_id required' }, { status: 400 });
    }
    if (!recipient_email || typeof recipient_email !== 'string' || !EMAIL_RE.test(recipient_email)) {
      return Response.json({ error: 'Valid recipient_email required' }, { status: 400 });
    }

    // Verify the linked resource actually exists (fail loud rather than issuing a dangling token)
    if (resource_type === 'sow') {
      const records = await base44.entities.PipelineRecord.filter({ id: resource_id });
      if (!records.length) return Response.json({ error: 'PipelineRecord not found' }, { status: 404 });
    } else {
      const records = await base44.entities.Engagement.filter({ id: resource_id });
      if (!records.length) return Response.json({ error: 'Engagement not found' }, { status: 404 });
    }

    const max_days = resource_type === 'sow' ? SOW_MAX_DAYS : PORTAL_MAX_DAYS;
    const default_days = resource_type === 'sow' ? SOW_DEFAULT_DAYS : PORTAL_DEFAULT_DAYS;
    const requested = Number.isFinite(expires_in_days) ? Math.floor(expires_in_days) : default_days;
    const days = Math.min(Math.max(1, requested), max_days);
    const expires_at = new Date(Date.now() + days * 86400000).toISOString();

    const scope = resource_type === 'sow' ? ['read', 'sign'] : ['read', 'upload', 'acknowledge'];
    const single_use = resource_type === 'sow';
    const normalized_email = recipient_email.toLowerCase().trim();

    // Auto-revoke prior unconsumed tokens for the same (resource, recipient).
    // Issuing a fresh link should retire stale ones to avoid two valid links in the wild.
    const existing = await base44.entities.PublicAccessToken.filter({
      resource_id,
      resource_type,
      revoked: false,
    });
    const now_iso = new Date().toISOString();
    for (const t of existing) {
      const same_email = (t.recipient_email || '').toLowerCase().trim() === normalized_email;
      if (same_email && !t.consumed_at) {
        await base44.entities.PublicAccessToken.update(t.id, {
          revoked: true,
          revoked_at: now_iso,
          revoked_by: `${user.email} (auto: superseded)`,
        });
      }
    }

    const token = generateToken();
    const public_url = `/p/${resource_type}/${token}`;
    const created = await base44.entities.PublicAccessToken.create({
      token,
      public_url,
      resource_type,
      resource_id,
      scope,
      recipient_email: normalized_email,
      recipient_name: typeof recipient_name === 'string' ? recipient_name.slice(0, 200) : '',
      issued_by: user.email,
      issued_at: now_iso,
      expires_at,
      single_use,
      revoked: false,
      access_count: 0,
    });

    // The frontend prepends its origin to public_url to get the absolute URL.
    // public_url is also persisted on the entity so the operator panel can
    // reconstruct copy links on revisit without reading the raw token field.
    return Response.json({
      success: true,
      token_id: created.id,
      token,
      public_url,
      public_path: public_url,
      expires_at,
      scope,
      single_use,
    });
  } catch (err) {
    console.error('issuePublicToken failed:', err);
    return Response.json({ error: 'Failed to issue token' }, { status: 500 });
  }
});

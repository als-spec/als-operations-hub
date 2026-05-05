import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const ALLOWED_ROLES = new Set(['founder', 'operator', 'admin']);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ALLOWED_ROLES.has(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const token_id = body?.token_id;
    if (!token_id || typeof token_id !== 'string') {
      return Response.json({ error: 'token_id required' }, { status: 400 });
    }

    const tokens = await base44.entities.PublicAccessToken.filter({ id: token_id });
    if (!tokens.length) return Response.json({ error: 'Not found' }, { status: 404 });

    const t = tokens[0];
    if (t.revoked) {
      return Response.json({ success: true, already_revoked: true });
    }

    await base44.entities.PublicAccessToken.update(token_id, {
      revoked: true,
      revoked_at: new Date().toISOString(),
      revoked_by: user.email,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('revokePublicToken failed:', err);
    return Response.json({ error: 'Failed to revoke token' }, { status: 500 });
  }
});

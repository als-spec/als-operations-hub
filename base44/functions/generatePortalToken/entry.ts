import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Generate a portal token for an engagement.
 * Called when engagement stage reaches "SOW Signed" (after portal_token added to engagement record).
 * Generates a UUID v4 token, hashes it, stores hash in DB, returns full portal URL.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'founder') {
      return Response.json({ error: 'Unauthorized — founder access required' }, { status: 403 });
    }

    const { engagement_id } = await req.json();

    if (!engagement_id) {
      return Response.json({ error: 'engagement_id required' }, { status: 400 });
    }

    // Fetch engagement to confirm it exists
    const engagement = await base44.asServiceRole.entities.Engagement.filter({ id: engagement_id });
    if (!engagement || engagement.length === 0) {
      return Response.json({ error: 'Engagement not found' }, { status: 404 });
    }

    // Generate UUID v4 token (32 char random string)
    const token = crypto.randomUUID().replace(/-/g, '');

    // Hash the token using SubtleCrypto (async in Deno)
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Build full portal URL
    const appDomain = Deno.env.get('APP_DOMAIN') || 'app.alsprofessional.com';
    const portalUrl = `https://${appDomain}/portal/${token}`;

    // Store hashed token and URL on engagement
    await base44.asServiceRole.entities.Engagement.update(engagement_id, {
      portal_token: hashedToken,
      portal_url: portalUrl,
      portal_active: true,
      portal_created_at: new Date().toISOString(),
    });

    return Response.json({
      token,
      portal_url: portalUrl,
      hashed_token: hashedToken,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
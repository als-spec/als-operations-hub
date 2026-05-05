import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Validate a portal token and return engagement data (read-only, no fee/BANT/notes exposed).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Hash the provided token
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Find engagement with matching hashed token
    const engagements = await base44.asServiceRole.entities.Engagement.filter({
      portal_token: hashedToken,
      portal_active: true,
    });

    if (!engagements || engagements.length === 0) {
      return Response.json({ error: 'Token invalid or expired' }, { status: 410 });
    }

    const engagement = engagements[0];

    // Check if engagement is closed (portal should be inactive)
    if (engagement.status === 'Complete') {
      await base44.asServiceRole.entities.Engagement.update(engagement.id, { portal_active: false });
      return Response.json({ error: 'Portal access expired' }, { status: 410 });
    }

    // Fetch prospect for facility name
    const prospect = await base44.asServiceRole.entities.Prospect.filter({ id: engagement.prospect_id });
    const facilityName = prospect && prospect.length > 0 ? prospect[0].facility_name : engagement.facility_name;

    // Update last viewed timestamp
    await base44.asServiceRole.entities.Engagement.update(engagement.id, {
      portal_last_viewed_at: new Date().toISOString(),
    });

    // Return only non-sensitive fields
    return Response.json({
      engagement_id: engagement.id,
      facility_name: facilityName,
      kickoff_date: engagement.kickoff_date,
      delivery_target: engagement.delivery_target,
      on_site_date: engagement.on_site_date,
      status: engagement.status,
      milestones: engagement.milestones || [],
      data_requests: engagement.data_requests || [],
      deliverables: engagement.deliverables || [],
      findings_deck_url: engagement.findings_deck_url,
      dashboard_url: engagement.dashboard_url,
      roadmap_url: engagement.roadmap_url,
      findings_delivered: engagement.findings_delivered,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
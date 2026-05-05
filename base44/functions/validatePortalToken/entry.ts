import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Validate a portal token and return engagement or retainer data (read-only, no sensitive data).
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

    // Try to find engagement with matching token
    const engagements = await base44.asServiceRole.entities.Engagement.filter({
      portal_token: hashedToken,
      portal_active: true,
    });

    if (engagements && engagements.length > 0) {
      const engagement = engagements[0];

      // Check if engagement is closed
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

      // Return engagement portal data
      return Response.json({
        type: 'engagement',
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
    }

    // Try to find retainer with matching token
    const retainers = await base44.asServiceRole.entities.Retainer.filter({
      portal_token: hashedToken,
      portal_active: true,
    });

    if (retainers && retainers.length > 0) {
      const retainer = retainers[0];

      // Check if retainer is closed
      if (retainer.status === 'Churned') {
        await base44.asServiceRole.entities.Retainer.update(retainer.id, { portal_active: false });
        return Response.json({ error: 'Portal access expired' }, { status: 410 });
      }

      // Fetch prospect for facility name
      const prospect = await base44.asServiceRole.entities.Prospect.filter({ id: retainer.prospect_id });
      const facilityName = prospect && prospect.length > 0 ? prospect[0].facility_name : retainer.facility_name;

      // Fetch next calendar event (QBR or monthly review)
      const upcomingEvents = await base44.asServiceRole.entities.CalendarEvent.filter({
        linked_record_id: retainer.id,
        linked_record_type: 'retainer',
      });

      // Find next upcoming event
      const now = new Date();
      const nextEvent = upcomingEvents
        .filter(e => new Date(e.scheduled_date) >= now)
        .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))[0];

      // Calculate total savings realized
      const totalSavings = (retainer.savings_realized || []).reduce((sum, item) => sum + (item.amount || 0), 0);

      // Update last viewed timestamp
      await base44.asServiceRole.entities.Retainer.update(retainer.id, {
        portal_last_viewed_at: new Date().toISOString(),
      });

      // Return retainer portal data
      return Response.json({
        type: 'retainer',
        retainer_id: retainer.id,
        facility_name: facilityName,
        mrr: retainer.mrr,
        dashboard_url: '', // Would be populated in retainer record if needed
        next_event: nextEvent ? {
          type: nextEvent.type,
          date: nextEvent.scheduled_date,
          time: nextEvent.scheduled_time,
          call_link: nextEvent.call_link,
        } : null,
        total_savings: totalSavings,
        status: retainer.status,
      });
    }

    // Token not found in either table
    return Response.json({ error: 'Token invalid or expired' }, { status: 410 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
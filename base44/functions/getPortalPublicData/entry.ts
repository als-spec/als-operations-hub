import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { token } = await req.json();

    if (!token) {
      return Response.json({ error: 'Invalid token' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Find engagement with this portal token
    const engagements = await base44.asServiceRole.entities.Engagement.filter({
      portal_token: token
    });

    if (!engagements || engagements.length === 0) {
      return Response.json({ error: 'Token not found' }, { status: 410 });
    }

    const engagement = engagements[0];

    // Fetch prospect for facility name
    const prospect = engagement.prospect_id
      ? (await base44.asServiceRole.entities.Prospect.filter({ id: engagement.prospect_id }))[0]
      : null;

    // Fetch milestones
    const milestones = await base44.asServiceRole.entities.EngagementMilestone.filter({
      engagement_id: engagement.id
    });

    // Fetch data requests
    const dataRequests = await base44.asServiceRole.entities.EngagementDataRequest.filter({
      engagement_id: engagement.id
    });

    // Fetch settings for contact info
    const settings = (await base44.asServiceRole.entities.PracticeSettings.filter({}))[0];

    // Return only public portal data
    return Response.json({
      success: true,
      data: {
        facility_name: prospect?.facility_name || '',
        practice_name: settings?.practice_name || '',
        kickoff_date: engagement.kickoff_date || '',
        on_site_date: engagement.on_site_date || '',
        delivery_target: engagement.dashboard_delivered_date || '',
        findings_deck_url: engagement.findings_deck_url || '',
        dashboard_url: engagement.dashboard_url || '',
        roadmap_url: engagement.roadmap_url || '',
        contact_email: settings?.contact_email || '',
        contact_phone: settings?.contact_phone || '',
        milestones: milestones.map(m => ({
          type: m.milestone_type,
          completed: m.completed,
          completed_date: m.completed_date
        })) || [],
        data_requests: dataRequests.map(d => ({
          item_name: d.item_name,
          status: d.status
        })) || []
      }
    });
  } catch (error) {
    console.error('Error fetching portal public data:', error);
    return Response.json({ error: 'Failed to fetch portal data' }, { status: 500 });
  }
});
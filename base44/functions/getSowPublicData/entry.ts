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

    // Find pipeline record with this sow token
    const records = await base44.asServiceRole.entities.PipelineRecord.filter({
      sow_generated_url: `sow-${token}.pdf`
    });

    if (!records || records.length === 0) {
      return Response.json({ error: 'Token not found' }, { status: 410 });
    }

    const record = records[0];

    // Fetch prospect
    const prospect = record.prospect_id
      ? (await base44.asServiceRole.entities.Prospect.filter({ id: record.prospect_id }))[0]
      : null;

    // Fetch settings
    const settings = (await base44.asServiceRole.entities.PracticeSettings.filter({}))[0];

    // Return only public SOW data
    return Response.json({
      success: true,
      data: {
        client_name: prospect?.facility_name || '',
        admin_name: prospect?.admin_name || '',
        facility_address: prospect?.address || '',
        procedure_types: prospect?.specialty_focus || '',
        scope_exclusions: record.scope_exclusions || [],
        engagement_fee: record.proposed_fee || 0,
        deposit_amount: Math.round((record.proposed_fee || 0) * 0.5 * 100) / 100,
        balance_amount: Math.round((record.proposed_fee || 0) * 0.5 * 100) / 100,
        kickoff_date: record.proposed_kickoff_window || '',
        onsite_date: '',
        governing_county: settings?.governing_county || '',
        founder_name: settings?.founder_name || '',
        operator_name: settings?.operator_name || '',
        practice_name: settings?.practice_name || '',
        contact_email: settings?.contact_email || '',
        contact_phone: settings?.contact_phone || '',
      }
    });
  } catch (error) {
    console.error('Error fetching SOW public data:', error);
    return Response.json({ error: 'Failed to fetch SOW data' }, { status: 500 });
  }
});
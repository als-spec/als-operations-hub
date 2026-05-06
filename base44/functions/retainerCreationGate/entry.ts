import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 11: RETAINER CREATION GATE
 * Enforces business rule 2 — no retainer until engagement = "Complete"
 * Trigger: BEFORE CREATE on Retainer
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { record } = await req.json();

    if (!record.engagement_id) {
      return Response.json({
        allow: false,
        error: "Retainer must be linked to an engagement."
      }, { status: 400 });
    }

    const engagements = await base44.asServiceRole.entities.Engagement.filter({
      id: record.engagement_id
    });
    const engagement = engagements?.[0];

    if (!engagement) {
      return Response.json({
        allow: false,
        error: "Linked engagement not found."
      }, { status: 404 });
    }

    // Rule 2: findings must be delivered
    if (!engagement.findings_delivered) {
      return Response.json({
        allow: false,
        error: `Cannot create retainer. Engagement findings have not been delivered yet. Current status: "${engagement.status}".`
      }, { status: 400 });
    }

    // Auto-populate from engagement
    record.prospect_id = record.prospect_id || engagement.prospect_id;

    return Response.json({ allow: true, record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 5: GUARANTEE TRACKER AUTO-CALCULATOR
 * Auto-calculates weighted_amount and updates parent engagement guarantee_status
 * Trigger: BEFORE UPDATE on EngagementGuaranteeItem
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { record } = await req.json();

    const confidenceWeight = {
      "High": 1.0,
      "Medium": 0.5
    };

    const stated = record.stated_amount || 0;
    const weight = confidenceWeight[record.confidence] ?? 0.5;
    record.weighted_amount = Math.round(stated * weight * 100) / 100;

    // Update parent engagement guarantee_status
    if (record.engagement_id) {
      const allItems = await base44.asServiceRole.entities.EngagementGuaranteeItem.filter({
        engagement_id: record.engagement_id
      });

      let weightedTotal = 0;
      for (const item of allItems || []) {
        if (item.id === record.id) {
          weightedTotal += record.weighted_amount;
        } else {
          weightedTotal += item.weighted_amount || 0;
        }
      }

      const engagements = await base44.asServiceRole.entities.Engagement.filter({
        id: record.engagement_id
      });

      if (engagements?.[0]) {
        const engagement = engagements[0];
        const threshold = (engagement.fee || 0) * 3;
        const newStatus = weightedTotal >= threshold ? "Met" : "Not Met";

        await base44.asServiceRole.entities.Engagement.update(record.engagement_id, {
          guarantee_status: newStatus
        });
      }
    }

    return Response.json({ allow: true, record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
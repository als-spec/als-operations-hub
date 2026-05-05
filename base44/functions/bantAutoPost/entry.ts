import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 10: BANT SCORE POST AUTO-TRIGGER
 * Auto-post INT-03 to #pipeline when BANT score is filled
 * Trigger: AFTER UPDATE on PipelineRecord
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { record, previousRecord } = body;

    const oldScore = previousRecord?.bant_score || 0;
    const newScore = record.bant_score || 0;

    if (oldScore === newScore || newScore === 0) {
      return Response.json({ success: true });
    }

    // Fetch prospect
    let facilityName = "Unknown Facility";
    if (record.prospect_id) {
      const prospects = await base44.asServiceRole.entities.Prospect.filter({
        id: record.prospect_id
      });
      if (prospects?.[0]) facilityName = prospects[0].facility_name;
    }

    const bantFormat = (val) => {
      if (val === "Pass") return "✅ Pass";
      if (val === "Conditional") return "⚡ Conditional";
      if (val === "Fail") return "❌ Fail";
      return "—";
    };

    const message = `📊 **BANT Score Updated: ${facilityName}**\n\n` +
      `**Overall Score:** ${newScore}/4\n` +
      `Budget: ${bantFormat(record.bant_budget)}\n` +
      `Authority: ${bantFormat(record.bant_authority)}\n` +
      `Need: ${bantFormat(record.bant_need)}\n` +
      `Timeline: ${bantFormat(record.bant_timeline)}\n\n` +
      `**Verbatim Pain Point:**\n> ${record.verbatim_pain_point || "(not recorded)"}\n\n` +
      `**Next Action:** ${record.next_action || "(not set)"}${record.next_action_date ? ` — due ${record.next_action_date}` : ""}`;

    await base44.asServiceRole.entities.Message.create({
      channel: "pipeline",
      content: message,
      author_name: "Operations Hub",
      author_email: "system"
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
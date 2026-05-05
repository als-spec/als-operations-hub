import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 4: ENGAGEMENT POST-CREATE — SEED MILESTONES + DATA REQUESTS
 * Auto-creates 5 milestone records and 6 data request records
 * Trigger: AFTER CREATE on Engagement
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { record, user } = body;
    const engagementId = record.id;

    // Create 5 milestones
    const milestoneTypes = [
      { type: "Kickoff Call", order: 1 },
      { type: "On-Site Walkthrough", order: 2 },
      { type: "Data Received", order: 3 },
      { type: "Analysis Complete", order: 4 },
      { type: "Findings Delivered", order: 5 }
    ];

    for (const m of milestoneTypes) {
      await base44.asServiceRole.entities.EngagementMilestone.create({
        engagement_id: engagementId,
        milestone_type: m.type,
        sort_order: m.order,
        completed: false
      });
    }

    // Create 6 data request items
    const dataItems = [
      "Purchase order line-item data",
      "Vendor contracts (top 20)",
      "GPO membership documentation",
      "Case volume report",
      "PAR level inventory list",
      "Preference cards"
    ];

    const addBusinessDays = (dateStr, days) => {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      let added = 0;
      while (added < days) {
        date.setDate(date.getDate() + 1);
        const dow = date.getDay();
        if (dow !== 0 && dow !== 6) added++;
      }
      return date.toISOString().split("T")[0];
    };

    const dataDueDate = record.kickoff_date ? addBusinessDays(record.kickoff_date, 5) : null;

    for (const item of dataItems) {
      await base44.asServiceRole.entities.EngagementDataRequest.create({
        engagement_id: engagementId,
        item_name: item,
        status: "Not Requested",
        due_date: dataDueDate
      });
    }

    // Advance pipeline to "Active Engagement"
    if (record.pipeline_record_id) {
      const pipelines = await base44.asServiceRole.entities.PipelineRecord.filter({
        id: record.pipeline_record_id
      });
      const pipeline = pipelines?.[0];

      if (pipeline) {
        if (!pipeline.stage_history) pipeline.stage_history = [];
        pipeline.stage_history.push({
          stage: "Active Engagement",
          date: new Date().toISOString(),
          changed_by: user?.email || "system"
        });

        await base44.asServiceRole.entities.PipelineRecord.update(record.pipeline_record_id, {
          stage: "Active Engagement",
          stage_history: pipeline.stage_history
        });
      }
    }

    // Auto-post INT-02 to #active-engagements
    let facilityName = "New Client";
    if (record.prospect_id) {
      const prospects = await base44.asServiceRole.entities.Prospect.filter({
        id: record.prospect_id
      });
      if (prospects?.[0]) facilityName = prospects[0].facility_name;
    }

    await base44.asServiceRole.entities.Message.create({
      channel: "active-engagements",
      content: `🟢 **New Engagement Opened: ${facilityName}**\n\n` +
        `**Fee:** $${record.fee?.toLocaleString() || "TBD"}\n` +
        `**Kickoff:** ${record.kickoff_date || "TBD"}\n` +
        `**Delivery Target:** ${record.delivery_target || "TBD"}\n\n` +
        `_Engagement record created. Milestones and data requests initialized._`,
      author_name: "Operations Hub",
      author_email: "system"
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
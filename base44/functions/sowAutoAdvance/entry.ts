import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 6: SOW AUTO-ADVANCE
 * When SOW PDF is generated or signed, auto-advance stage
 * Trigger: AFTER UPDATE on PipelineRecord
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { record, previousRecord, user } = body;

    // SOW Generated → auto-advance to "SOW Sent"
    if (record.sow_generated_url?.trim() &&
        !previousRecord?.sow_generated_url?.trim() &&
        record.stage === "Proposal Presented") {

      const newStage = "SOW Sent";
      if (!record.stage_history) record.stage_history = [];
      record.stage_history.push({
        stage: newStage,
        date: new Date().toISOString(),
        changed_by: "system (SOW generated)"
      });

      await base44.asServiceRole.entities.PipelineRecord.update(record.id, {
        stage: newStage,
        stage_history: record.stage_history
      });
    }

    // SOW Signed PDF uploaded → auto-advance to "SOW Signed" + generate token
    if (record.sow_signed_url?.trim() &&
        !previousRecord?.sow_signed_url?.trim() &&
        (record.stage === "SOW Sent" || record.stage === "Proposal Presented")) {

      const newStage = "SOW Signed";
      if (!record.stage_history) record.stage_history = [];
      record.stage_history.push({
        stage: newStage,
        date: new Date().toISOString(),
        changed_by: "system (signed SOW uploaded)"
      });

      const portalToken = crypto.randomUUID();

      const settings = await base44.asServiceRole.entities.PracticeSettings.filter({});
      const domain = settings?.[0]?.practice_domain || "app.example.com";
      const portalUrl = `https://app.${domain}/portal/${portalToken}`;

      await base44.asServiceRole.entities.PipelineRecord.update(record.id, {
        stage: newStage,
        stage_history: record.stage_history,
        sow_signed_date: record.sow_signed_date || new Date().toISOString().split("T")[0],
        _portal_token: portalToken,
        _portal_url: portalUrl
      });

      // Log to prospect activity
      if (record.prospect_id) {
        await base44.asServiceRole.entities.ProspectActivity.create({
          prospect_id: record.prospect_id,
          type: "stage_change",
          content: "Pipeline advanced to SOW Signed. Portal link generated.",
          metadata: {
            old_stage: previousRecord?.stage,
            new_stage: newStage,
            portal_url: portalUrl
          }
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
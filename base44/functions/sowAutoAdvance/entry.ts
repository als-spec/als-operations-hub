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

    // SOW Signed PDF uploaded → auto-advance to "SOW Signed".
    //
    // NOTE: prior to the public-portal hardening, this branch also generated a
    // bare-UUID portal token and wrote it onto the record. That has been
    // removed: portal access is now issued explicitly via PublicLinkPanel ->
    // issuePublicToken (scoped, expirable, revocable, audit-logged via
    // PublicAccessToken / PublicAccessEvent). The auto-advance itself remains
    // useful — it covers the case where a signed SOW is uploaded out of band
    // (i.e. not via the clickwrap flow). When clickwrap submitSowSignature
    // runs, it advances the stage atomically so the condition below is a
    // no-op (`record.stage === "SOW Signed"` skips this branch).
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

      await base44.asServiceRole.entities.PipelineRecord.update(record.id, {
        stage: newStage,
        stage_history: record.stage_history,
        sow_signed_date: record.sow_signed_date || new Date().toISOString().split("T")[0]
      });

      if (record.prospect_id) {
        await base44.asServiceRole.entities.ProspectActivity.create({
          prospect_id: record.prospect_id,
          type: "stage_change",
          content: "Pipeline advanced to SOW Signed.",
          metadata: {
            old_stage: previousRecord?.stage,
            new_stage: newStage
          }
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
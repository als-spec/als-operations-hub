import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 1: PIPELINE STAGE GATE
 * Enforces business rules for pipeline stage advancement
 * Trigger: BEFORE UPDATE on PipelineRecord
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { record, previousRecord, user } = await req.json();

    const STAGE_ORDER = [
      "Discovery Call Scheduled", 0, "Discovery Complete", 1,
      "Proposal Call Scheduled", 2, "Proposal Presented", 3,
      "SOW Sent", 4, "SOW Signed", 5, "Deposit Received", 6,
      "Active Engagement", 7
    ];

    const stages = ["Discovery Call Scheduled", "Discovery Complete", "Proposal Call Scheduled", 
      "Proposal Presented", "SOW Sent", "SOW Signed", "Deposit Received", "Active Engagement"];

    const oldStage = previousRecord?.stage;
    const newStage = record?.stage;

    if (oldStage === newStage) return Response.json({ allow: true });

    const oldIndex = stages.indexOf(oldStage);
    const newIndex = stages.indexOf(newStage);

    // Rule 3 + 4: BANT + verbatim required before advancing past Discovery Complete
    if (newIndex >= 2 && oldIndex <= 1) {
      const bantScore = record.bant_score || 0;
      const painPoint = record.verbatim_pain_point?.trim();

      if (bantScore < 1) {
        return Response.json({
          allow: false,
          error: "BANT score must be at least 1 before advancing past Discovery Complete."
        }, { status: 400 });
      }

      if (!painPoint) {
        return Response.json({
          allow: false,
          error: "Verbatim pain point is required before advancing past Discovery Complete."
        }, { status: 400 });
      }
    }

    // Rule 21: SOW generated URL required for "SOW Sent"
    if (newStage === "SOW Sent" && !record.sow_generated_url?.trim()) {
      return Response.json({
        allow: false,
        error: "Generate the SOW first before marking as SOW Sent."
      }, { status: 400 });
    }

    // Rule 22: Signed SOW required for "SOW Signed"
    if (newStage === "SOW Signed" && !record.sow_signed_url?.trim()) {
      return Response.json({
        allow: false,
        error: "Upload the signed SOW PDF before advancing to SOW Signed."
      }, { status: 400 });
    }

    // Rule 23: Deposit paid date required for "Deposit Received"
    if (newStage === "Deposit Received") {
      if (!record.freshbooks_deposit_invoice_url?.trim() ||
          !record.freshbooks_deposit_invoice_number?.trim()) {
        return Response.json({
          allow: false,
          error: "FreshBooks deposit invoice URL and number must be filled."
        }, { status: 400 });
      }
    }

    // Rule 16: SOW-related stages — Founder only
    if (newIndex >= 4 && user?.role !== "founder" && user?.role !== "admin") {
      return Response.json({
        allow: false,
        error: "Only the Founder can advance to SOW stages."
      }, { status: 403 });
    }

    // Auto-log stage change to stage_history
    if (!record.stage_history) record.stage_history = [];
    record.stage_history.push({
      stage: newStage,
      date: new Date().toISOString(),
      changed_by: user?.email || "system"
    });

    return Response.json({ allow: true, record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
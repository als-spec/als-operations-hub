import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 3: ENGAGEMENT CREATION GATE
 * Enforces business rule 1 — no engagement until pipeline = "Deposit Received"
 * Trigger: BEFORE CREATE on Engagement
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { record } = await req.json();
    const pipelineId = record.pipeline_record_id;

    if (!pipelineId) {
      return Response.json({
        allow: false,
        error: "Engagement must be linked to a pipeline record."
      }, { status: 400 });
    }

    // Fetch linked pipeline record
    const pipelines = await base44.asServiceRole.entities.PipelineRecord.filter({ id: pipelineId });
    const pipeline = pipelines?.[0];

    if (!pipeline) {
      return Response.json({
        allow: false,
        error: "Linked pipeline record not found."
      }, { status: 404 });
    }

    // Rule 1: Stage must be "Deposit Received"
    if (pipeline.stage !== "Deposit Received" && pipeline.stage !== "Active Engagement") {
      return Response.json({
        allow: false,
        error: `Cannot create engagement. Pipeline stage is "${pipeline.stage}" — must be "Deposit Received" first.`
      }, { status: 400 });
    }

    // Rule 23: Deposit invoice fields must be filled
    if (!pipeline.freshbooks_deposit_invoice_url?.trim() ||
        !pipeline.freshbooks_deposit_invoice_number?.trim()) {
      return Response.json({
        allow: false,
        error: "FreshBooks deposit invoice fields must be filled on the pipeline record."
      }, { status: 400 });
    }

    // Auto-populate from pipeline
    record.prospect_id = record.prospect_id || pipeline.prospect_id;
    record.fee = record.fee || pipeline.proposed_fee;
    record.sow_signed_url = pipeline.sow_signed_url;
    record.sow_signed_date = pipeline.sow_signed_date;
    record.freshbooks_deposit_invoice_url = pipeline.freshbooks_deposit_invoice_url;
    record.freshbooks_deposit_invoice_number = pipeline.freshbooks_deposit_invoice_number;

    // Auto-calculate delivery_target (15 business days from kickoff)
    if (record.kickoff_date && !record.delivery_target) {
      const addBusinessDays = (dateStr, days) => {
        const date = new Date(dateStr);
        let added = 0;
        while (added < days) {
          date.setDate(date.getDate() + 1);
          const dow = date.getDay();
          if (dow !== 0 && dow !== 6) added++;
        }
        return date.toISOString().split("T")[0];
      };
      record.delivery_target = addBusinessDays(record.kickoff_date, 15);
    }

    return Response.json({ allow: true, record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
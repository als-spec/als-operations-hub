import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 7: EMAIL SEND GATE VALIDATOR
 * Enforces send gates for PC-03b, DD-07b, RT-01
 * Trigger: HTTP POST /api/email-send-gate
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const user = await base44.auth.me();

    const { template_code, linked_record_id, linked_record_type } = body;

    // Rule 12: VA cannot send
    if (user?.role === "va") {
      return Response.json({
        allowed: false,
        blockers: ["VA role cannot send emails. Only Founder and Operator can send."],
        gate_status: {}
      }, { status: 403 });
    }

    const blockers = [];
    const gateStatus = {};

    // PC-03b: Deposit Invoice Email
    if (template_code === "PC-03b") {
      const pipelines = await base44.asServiceRole.entities.PipelineRecord.filter({
        id: linked_record_id
      });
      const pipeline = pipelines?.[0];

      if (!pipeline) {
        blockers.push("Pipeline record not found.");
      } else {
        gateStatus["SOW Signed PDF Uploaded"] = !!pipeline.sow_signed_url?.trim();
        if (!gateStatus["SOW Signed PDF Uploaded"]) {
          blockers.push("Upload the signed SOW PDF.");
        }

        gateStatus["FreshBooks Deposit Invoice URL"] = !!pipeline.freshbooks_deposit_invoice_url?.trim();
        if (!gateStatus["FreshBooks Deposit Invoice URL"]) {
          blockers.push("Add the FreshBooks deposit invoice URL.");
        }

        gateStatus["FreshBooks Deposit Invoice Number"] = !!pipeline.freshbooks_deposit_invoice_number?.trim();
        if (!gateStatus["FreshBooks Deposit Invoice Number"]) {
          blockers.push("Add the FreshBooks deposit invoice number.");
        }
      }
    }

    // DD-07b: Balance Invoice Email
    if (template_code === "DD-07b") {
      const engagements = await base44.asServiceRole.entities.Engagement.filter({
        id: linked_record_id
      });
      const engagement = engagements?.[0];

      if (!engagement) {
        blockers.push("Engagement record not found.");
      } else {
        gateStatus["Findings Deck Uploaded"] = !!engagement.findings_deck_url?.trim();
        if (!gateStatus["Findings Deck Uploaded"]) {
          blockers.push("Upload the findings deck.");
        }

        gateStatus["FreshBooks Balance Invoice URL"] = !!engagement.freshbooks_balance_invoice_url?.trim();
        if (!gateStatus["FreshBooks Balance Invoice URL"]) {
          blockers.push("Add the FreshBooks balance invoice URL.");
        }

        gateStatus["FreshBooks Balance Invoice Number"] = !!engagement.freshbooks_balance_invoice_number?.trim();
        if (!gateStatus["FreshBooks Balance Invoice Number"]) {
          blockers.push("Add the FreshBooks balance invoice number.");
        }
      }
    }

    // RT-01: Monthly Retainer Invoice
    if (template_code === "RT-01") {
      const retainers = await base44.asServiceRole.entities.Retainer.filter({
        id: linked_record_id
      });
      const retainer = retainers?.[0];

      if (!retainer) {
        blockers.push("Retainer record not found.");
      } else {
        const emailsSent = await base44.asServiceRole.entities.EmailSent.filter({
          linked_record_id: linked_record_id,
          template_used: "RT-01"
        });

        const isFirstMonth = !emailsSent || emailsSent.length === 0;

        if (isFirstMonth) {
          gateStatus["Retainer Agreement Uploaded"] = !!retainer.retainer_agreement_url?.trim();
          if (!gateStatus["Retainer Agreement Uploaded"]) {
            blockers.push("Upload the signed retainer agreement.");
          }

          gateStatus["FreshBooks Recurring Invoice URL"] = !!retainer.freshbooks_recurring_invoice_url?.trim();
          if (!gateStatus["FreshBooks Recurring Invoice URL"]) {
            blockers.push("Add the FreshBooks recurring invoice URL.");
          }
        }
      }
    }

    return Response.json({
      allowed: blockers.length === 0,
      blockers,
      gate_status: gateStatus
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
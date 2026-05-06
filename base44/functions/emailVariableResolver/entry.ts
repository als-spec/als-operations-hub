import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 8: EMAIL VARIABLE RESOLVER
 * Resolves auto-fill variables in email templates
 * Trigger: HTTP POST /api/resolve-email-template
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { template_code, linked_record_id, linked_record_type } = body;

    // Fetch template
    const templates = await base44.asServiceRole.entities.EmailTemplate.filter({
      code: template_code
    });
    const template = templates?.[0];

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    const vars = {};

    // Fetch practice settings
    const settings = await base44.asServiceRole.entities.PracticeSettings.filter({});
    if (settings?.[0]) {
      const s = settings[0];
      vars["PRACTICE_NAME"] = s.practice_name || "";
      vars["FOUNDER_NAME"] = s.founder_name || "";
      vars["OPERATOR_NAME"] = s.operator_name || "";
      vars["PHONE"] = s.contact_phone || "";
      vars["EMAIL"] = s.contact_email || "";
      vars["CALENDAR_LINK"] = s.calendar_link || "";
      vars["OPERATOR_EMAIL"] = s.operator_email || "";
      vars["OPERATOR_PHONE"] = s.operator_phone || "";
    }

    let prospectId = null;
    let toAddress = "";
    let toName = "";

    // Fetch linked record
    if (linked_record_type === "prospect" && linked_record_id) {
      const prospects = await base44.asServiceRole.entities.Prospect.filter({
        id: linked_record_id
      });
      if (prospects?.[0]) {
        const p = prospects[0];
        prospectId = p.id;
        vars["FACILITY_NAME"] = p.facility_name || "";
        vars["ADMIN_NAME"] = p.admin_name || "";
        toAddress = p.admin_email || "";
        toName = p.admin_name || "";
      }
    }

    if (linked_record_type === "pipeline" && linked_record_id) {
      const pipelines = await base44.asServiceRole.entities.PipelineRecord.filter({
        id: linked_record_id
      });
      if (pipelines?.[0]) {
        const p = pipelines[0];
        prospectId = p.prospect_id;
        vars["FEE"] = p.proposed_fee ? `$${p.proposed_fee.toLocaleString()}` : "";
        vars["DEPOSIT_AMOUNT"] = p.deposit_amount ? `$${p.deposit_amount.toLocaleString()}` : "";
        vars["INVOICE_NUMBER"] = p.freshbooks_deposit_invoice_number || "";
      }
    }

    if (linked_record_type === "engagement" && linked_record_id) {
      const engagements = await base44.asServiceRole.entities.Engagement.filter({
        id: linked_record_id
      });
      if (engagements?.[0]) {
        const e = engagements[0];
        prospectId = e.prospect_id;
        vars["FEE"] = e.fee ? `$${e.fee.toLocaleString()}` : "";
        vars["KICKOFF_DATE"] = e.kickoff_date || "";
        vars["DELIVERY_DATE"] = e.delivery_target || "";
        vars["ON_SITE_DATE"] = e.on_site_date || "";
        vars["PORTAL_LINK"] = e.portal_url || "";
        vars["INVOICE_AMOUNT"] = e.fee ? `$${e.fee.toLocaleString()}` : "";
        vars["INVOICE_NUMBER"] = e.freshbooks_balance_invoice_number || "";

        // Guarantee vars
        const items = await base44.asServiceRole.entities.EngagementGuaranteeItem.filter({
          engagement_id: e.id
        });
        const weightedTotal = (items || []).reduce((sum, item) => sum + (item.weighted_amount || 0), 0);
        const totalOpp = (items || []).reduce((sum, item) => sum + (item.stated_amount || 0), 0);
        vars["WEIGHTED_TOTAL"] = `$${weightedTotal.toLocaleString()}`;
        vars["TOTAL_OPPORTUNITY"] = `$${totalOpp.toLocaleString()}`;
        vars["GUARANTEE_THRESHOLD"] = e.fee ? `$${(e.fee * 3).toLocaleString()}` : "";
      }
    }

    if (linked_record_type === "retainer" && linked_record_id) {
      const retainers = await base44.asServiceRole.entities.Retainer.filter({
        id: linked_record_id
      });
      if (retainers?.[0]) {
        const r = retainers[0];
        prospectId = r.prospect_id;
        vars["MONTHLY_FEE"] = r.mrr ? `$${r.mrr.toLocaleString()}` : "";
        vars["RENEWAL_DATE"] = r.renewal_date || "";
        vars["INVOICE_NUMBER"] = r.freshbooks_recurring_invoice_number || "";
        vars["INVOICE_AMOUNT"] = r.mrr ? `$${r.mrr.toLocaleString()}` : "";
      }
    }

    // Fetch prospect for facility/admin
    if (prospectId) {
      const prospects = await base44.asServiceRole.entities.Prospect.filter({
        id: prospectId
      });
      if (prospects?.[0]) {
        const p = prospects[0];
        vars["FACILITY_NAME"] = vars["FACILITY_NAME"] || p.facility_name || "";
        vars["ADMIN_NAME"] = vars["ADMIN_NAME"] || p.admin_name || "";
        toAddress = toAddress || p.admin_email || "";
        toName = toName || p.admin_name || "";
      }
    }

    // Render template
    let renderedSubject = template.subject_template || "";
    let renderedBody = template.body_template || "";

    for (const [key, value] of Object.entries(vars)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      renderedSubject = renderedSubject.replace(pattern, value);
      renderedBody = renderedBody.replace(pattern, value);
    }

    // Find unfilled manual variables
    const unfilledPattern = /\{\{(\w+)\}\}/g;
    const unfilled = [];
    const combined = renderedSubject + renderedBody;
    let match;
    while ((match = unfilledPattern.exec(combined)) !== null) {
      if (!unfilled.includes(match[1])) {
        unfilled.push(match[1]);
      }
    }

    return Response.json({
      subject: renderedSubject,
      body: renderedBody,
      unfilled_vars: unfilled,
      sender: template.default_sender,
      to_address: toAddress,
      to_name: toName,
      send_gate: template.send_gate || null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
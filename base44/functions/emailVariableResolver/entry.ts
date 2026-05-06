import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 8: EMAIL VARIABLE RESOLVER
 * Resolves auto-fill variables in email templates
 * Trigger: HTTP POST /api/resolve-email-template
 */

// Picks the most recent active PublicAccessToken for the given resource and
// builds an absolute public URL using PracticeSettings.practice_domain. The
// React-side EmailComposer already does the equivalent client-side; this
// resolver covers any path that renders templates via the platform.
async function getActivePublicUrl(
  base44: any,
  resource_type: 'sow' | 'portal',
  resource_id: string,
  practice_domain: string,
): Promise<string> {
  if (!resource_id) return '';
  try {
    const tokens = await base44.asServiceRole.entities.PublicAccessToken.filter({
      resource_type,
      resource_id,
      revoked: false,
    });
    const now = Date.now();
    const candidates = (tokens || [])
      .filter((t: any) => !t.consumed_at)
      .filter((t: any) => !t.expires_at || new Date(t.expires_at).getTime() > now)
      .sort((a: any, b: any) =>
        new Date(b.issued_at || 0).getTime() - new Date(a.issued_at || 0).getTime(),
      );
    const token = candidates[0];
    if (!token) return '';
    const path = token.public_url || `/p/${resource_type}/${token.token}`;
    if (!practice_domain) return path; // Last-resort: relative path.
    const origin = practice_domain.startsWith('http')
      ? practice_domain.replace(/\/$/, '')
      : `https://${practice_domain.replace(/\/$/, '')}`;
    return `${origin}${path}`;
  } catch (err) {
    console.error('getActivePublicUrl failed:', err);
    return '';
  }
}

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

    const vars: Record<string, string> = {};

    // Fetch practice settings (also yields the domain for public URLs).
    let practice_domain = '';
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
      practice_domain = s.practice_domain || '';
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
        // SOW review link: pull the most recent active sow-scoped token for this pipeline record.
        vars["SOW_REVIEW_LINK"] = await getActivePublicUrl(base44, 'sow', linked_record_id, practice_domain);
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
        vars["INVOICE_AMOUNT"] = e.fee ? `$${e.fee.toLocaleString()}` : "";
        vars["INVOICE_NUMBER"] = e.freshbooks_balance_invoice_number || "";

        // Portal link: prefer the most recent active portal-scoped token.
        // Fall back to the legacy engagement.portal_url field for back-compat
        // with engagements created before PublicAccessToken existed.
        const portalLinkFromToken = await getActivePublicUrl(base44, 'portal', linked_record_id, practice_domain);
        vars["PORTAL_LINK"] = portalLinkFromToken || e.portal_url || "";

        // Guarantee vars
        const items = await base44.asServiceRole.entities.EngagementGuaranteeItem.filter({
          engagement_id: e.id
        });
        const weightedTotal = (items || []).reduce((sum: number, item: any) => sum + (item.weighted_amount || 0), 0);
        const totalOpp = (items || []).reduce((sum: number, item: any) => sum + (item.stated_amount || 0), 0);
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
    const unfilled: string[] = [];
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

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * FUNCTION 12: SOW PDF GENERATOR
 * Generates SOW HTML (browser renders to PDF)
 * Trigger: HTTP POST /api/generate-sow
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "founder" && user?.role !== "admin") {
      return Response.json({
        error: "Only the Founder can generate Service Agreements."
      }, { status: 403 });
    }

    const body = await req.json();
    const { pipeline_record_id, sow_fields } = body;

    const pipelines = await base44.asServiceRole.entities.PipelineRecord.filter({
      id: pipeline_record_id
    });
    const pipeline = pipelines?.[0];

    if (!pipeline) {
      return Response.json({ error: "Pipeline record not found" }, { status: 404 });
    }

    if (pipeline.stage !== "Proposal Presented" && pipeline.stage !== "SOW Sent") {
      return Response.json({
        error: `SOW can only be generated at "Proposal Presented" stage. Current: "${pipeline.stage}".`
      }, { status: 400 });
    }

    const prospects = await base44.asServiceRole.entities.Prospect.filter({
      id: pipeline.prospect_id
    });
    const prospect = prospects?.[0];

    const settings = await base44.asServiceRole.entities.PracticeSettings.filter({});

    const sowData = {
      client_name: sow_fields?.client_name || prospect?.facility_name || "",
      admin_name: sow_fields?.admin_name || prospect?.admin_name || "",
      admin_title: sow_fields?.admin_title || "Administrator",
      facility_address: sow_fields?.facility_address || prospect?.address || "",
      procedure_types: sow_fields?.procedure_types || prospect?.specialty_focus || "",
      scope_exclusions: sow_fields?.scope_exclusions || pipeline.scope_exclusions || [],
      engagement_fee: sow_fields?.engagement_fee || pipeline.proposed_fee || 0,
      deposit_amount: sow_fields?.deposit_amount || pipeline.deposit_amount || 0,
      balance_amount: sow_fields?.balance_amount || pipeline.balance_amount || 0,
      kickoff_date: sow_fields?.kickoff_date || pipeline.proposed_kickoff_window || "",
      delivery_target: sow_fields?.delivery_target || "",
      onsite_date: sow_fields?.onsite_date || "",
      practice_name: settings?.[0]?.practice_name || "ALS Professional Services GA",
      governing_county: sow_fields?.governing_county || settings?.[0]?.governing_county || "",
      founder_name: settings?.[0]?.founder_name || "",
      section_6_text: settings?.[0]?.sow_section_6_text || "[GUARANTEE LANGUAGE NOT CONFIGURED]",
      generated_date: new Date().toISOString().split("T")[0]
    };

    const exclusionsList = (sowData.scope_exclusions || [])
      .map((e) => `<li>${e}</li>`)
      .join("\n");

    const sowHtml = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Inter', Arial, sans-serif; max-width: 750px; margin: 40px auto; color: #1E293B; line-height: 1.6; font-size: 14px; }
  h1 { font-size: 22px; color: #0A2540; border-bottom: 2px solid #1DE9B6; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #0A2540; margin-top: 28px; margin-bottom: 8px; }
  .header { text-align: center; margin-bottom: 32px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  td { padding: 6px 12px; border: 1px solid #E2E8F0; font-size: 13px; }
  td:first-child { font-weight: 600; width: 200px; background: #F8FAFC; }
  .section-6 { background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
  .section-6 .lock { color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
</style>
</head>
<body>
<div class="header">
  <h1>Service Agreement</h1>
  <p>${sowData.practice_name}</p>
  <p>Generated ${sowData.generated_date}</p>
</div>
<h2>Section 1 — Parties</h2>
<table>
  <tr><td>Provider</td><td>${sowData.practice_name}</td></tr>
  <tr><td>Client Facility</td><td>${sowData.client_name}</td></tr>
  <tr><td>Administrator</td><td>${sowData.admin_name}, ${sowData.admin_title}</td></tr>
  <tr><td>Facility Address</td><td>${sowData.facility_address}</td></tr>
</table>
<h2>Section 2 — Scope of Services</h2>
<p>Provider will conduct a comprehensive supply chain diagnostic for the Client's surgical facility, focusing on: <strong>${sowData.procedure_types}</strong>.</p>
${exclusionsList ? `<h2>Section 3 — Scope Exclusions</h2><ul>${exclusionsList}</ul>` : ""}
<h2>Section 4 — Engagement Fee & Payment</h2>
<table>
  <tr><td>Total Engagement Fee</td><td>$${sowData.engagement_fee.toLocaleString()}</td></tr>
  <tr><td>Deposit (due upon signing)</td><td>$${sowData.deposit_amount.toLocaleString()}</td></tr>
  <tr><td>Balance (due upon findings delivery)</td><td>$${sowData.balance_amount.toLocaleString()}</td></tr>
</table>
<h2>Section 5 — Timeline</h2>
<table>
  <tr><td>Proposed Kickoff Date</td><td>${sowData.kickoff_date}</td></tr>
  <tr><td>On-Site Walkthrough Date</td><td>${sowData.onsite_date || "TBD"}</td></tr>
  <tr><td>Findings Delivery Target</td><td>${sowData.delivery_target || "15 business days from kickoff"}</td></tr>
</table>
<h2>Section 6 — Savings Guarantee</h2>
<div class="section-6">
  <div class="lock">🔒 Fixed per practice policy — contact your attorney to modify</div>
  <p>${sowData.section_6_text}</p>
</div>
<h2>Section 7 — Governing Law</h2>
<p>This Agreement shall be governed by the laws of the State of Georgia, ${sowData.governing_county}.</p>
</body>
</html>`;

    return Response.json({
      success: true,
      sow_html: sowHtml,
      sow_data: sowData,
      message: "SOW generated. Use browser print-to-PDF to save."
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
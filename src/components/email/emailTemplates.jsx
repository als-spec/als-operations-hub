/**
 * Complete ALS Professional Network Email Template Library
 * 31 templates across 6 series
 *
 * Variable types:
 * - AUTO: pulled from linked CRM record automatically (🔄)
 * - MANUAL: must be filled by user before send (⚠️) — composer blocks send if unfilled
 *
 * In body text: {{AUTO:VAR_NAME}} and {{MANUAL:VAR_NAME}}
 */

export const AUTO_VARS = [
  'PRACTICE_NAME', 'FOUNDER_NAME', 'OPERATOR_NAME', 'PHONE', 'EMAIL',
  'CALENDAR_LINK', 'FACILITY_NAME', 'ADMIN_NAME', 'OPERATOR_EMAIL',
  'OPERATOR_PHONE', 'FEE', 'KICKOFF_DATE', 'DELIVERY_DATE', 'ON_SITE_DATE',
  'DATA_DUE_DATE', 'CALL_LINK', 'RENEWAL_DATE', 'INVOICE_NUMBER',
  'INVOICE_AMOUNT', 'DUE_DATE', 'MONTHLY_FEE', 'GUARANTEE_THRESHOLD',
  'WEIGHTED_TOTAL', 'TOTAL_OPPORTUNITY', 'PORTAL_LINK', 'SOW_REVIEW_LINK',
];

export const EMAIL_TEMPLATES = [
  // ── SERIES AE — Prospect Outreach ──────────────────────────────────────────
  {
    id: 'AE-01',
    series: 'AE',
    name: 'Cold Outreach — Primary Vertical',
    trigger: 'First contact, Tier A/B',
    default_sender: 'founder',
    subject: 'Supply Chain Optimization for {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

I hope this message finds you well. My name is {{AUTO:FOUNDER_NAME}} with ALS Professional Network, a healthcare supply chain consulting firm specializing in physician-owned ASCs.

We've helped facilities like {{AUTO:FACILITY_NAME}} identify significant cost savings through PPI variance analysis, GPO tier optimization, and off-contract spend recovery — typically achieving 3–5× ROI on our diagnostic fee.

I'd love to schedule a brief 30-minute discovery call to explore whether there might be a fit.

{{AUTO:CALENDAR_LINK}}

Best regards,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network
{{AUTO:PHONE}} · {{AUTO:EMAIL}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'CALENDAR_LINK', 'PHONE', 'EMAIL'],
    manual_vars: [],
  },
  {
    id: 'AE-02',
    series: 'AE',
    name: 'LinkedIn Connection Request',
    trigger: 'First LinkedIn contact',
    default_sender: 'founder',
    subject: 'Connecting — Supply Chain for Physician-Owned ASCs',
    body: `Hi {{AUTO:ADMIN_NAME}},

I came across {{AUTO:FACILITY_NAME}} and wanted to connect. I work with ALS Professional Network, focused exclusively on supply chain optimization for physician-owned orthopedic ASCs.

We surface savings that consistently offset our fee by 3× or more. Happy to share a brief case example if you're open to it.

{{AUTO:FOUNDER_NAME}}
ALS Professional Network`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME'],
    manual_vars: [],
  },
  {
    id: 'AE-02b',
    series: 'AE',
    name: 'LinkedIn Follow-Up DM',
    trigger: 'Connection accepted',
    default_sender: 'founder',
    subject: 'Thanks for connecting, {{AUTO:ADMIN_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thanks for connecting. As I mentioned, we specialize in diagnostic engagements for physician-owned orthopedic ASCs — typically uncovering {{MANUAL:ESTIMATED_SAVINGS}} in addressable savings.

Would you be open to a quick 20-minute call? I'm happy to share a few relevant case examples specific to {{AUTO:FACILITY_NAME}}.

{{AUTO:CALENDAR_LINK}}

{{AUTO:FOUNDER_NAME}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'CALENDAR_LINK'],
    manual_vars: ['ESTIMATED_SAVINGS'],
  },
  {
    id: 'AE-03',
    series: 'AE',
    name: 'Warm Introduction Request',
    trigger: 'Asking mutual for intro',
    default_sender: 'founder',
    subject: 'Quick favor — introduction to {{AUTO:ADMIN_NAME}} at {{AUTO:FACILITY_NAME}}',
    body: `Hi {{MANUAL:MUTUAL_CONTACT_NAME}},

Hope you're doing well. I'm reaching out because I've been looking to connect with {{AUTO:ADMIN_NAME}} at {{AUTO:FACILITY_NAME}} regarding supply chain optimization work we do with physician-owned ASCs.

Given your connection, I thought I'd ask if you'd be comfortable making a brief introduction. I'd keep it short — just a 20-minute conversation to see if there's a fit.

Happy to draft something for you if that's easier.

Thanks so much,
{{AUTO:FOUNDER_NAME}}
{{AUTO:PHONE}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'PHONE'],
    manual_vars: ['MUTUAL_CONTACT_NAME'],
  },
  {
    id: 'AE-04',
    series: 'AE',
    name: '24-Hour Discovery Follow-Up',
    trigger: 'After discovery call',
    default_sender: 'founder',
    subject: 'Great connecting today, {{AUTO:ADMIN_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you for taking the time to speak with us today. It was great to learn more about {{AUTO:FACILITY_NAME}} and the opportunities you're navigating.

As discussed, our next step is {{MANUAL:NEXT_STEP}}. I'll have that over to you by {{MANUAL:FOLLOW_UP_DATE}}.

In the meantime, please don't hesitate to reach out with any questions.

Looking forward to moving forward together.

Best regards,
{{AUTO:FOUNDER_NAME}}
{{AUTO:EMAIL}} · {{AUTO:PHONE}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'EMAIL', 'PHONE'],
    manual_vars: ['NEXT_STEP', 'FOLLOW_UP_DATE'],
  },
  {
    id: 'AE-05',
    series: 'AE',
    name: 'Kickoff Confirmation',
    trigger: 'Deposit cleared',
    default_sender: 'founder',
    subject: 'Kickoff Confirmation — {{AUTO:FACILITY_NAME}} Diagnostic Engagement',
    body: `Hi {{AUTO:ADMIN_NAME}},

We're excited to officially kick off our engagement with {{AUTO:FACILITY_NAME}}!

This confirms our kickoff call scheduled for {{AUTO:KICKOFF_DATE}} via: {{AUTO:CALL_LINK}}

To prepare, please have the following data items ready:
• Accounts payable / vendor spend by category (last 12 months)
• Current GPO affiliation and contract tier documentation
• Preference card data (top 5 procedure types)
• Current vendor contracts (where available)

All data should be submitted by {{AUTO:DATA_DUE_DATE}}. Our Operator, {{AUTO:OPERATOR_NAME}}, will send a secure upload link separately.

You can track the progress of your engagement here: {{AUTO:PORTAL_LINK}}

We're looking forward to getting started.

Best regards,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network
{{AUTO:EMAIL}} · {{AUTO:PHONE}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'KICKOFF_DATE', 'CALL_LINK', 'DATA_DUE_DATE', 'OPERATOR_NAME', 'EMAIL', 'PHONE', 'PORTAL_LINK'],
    manual_vars: [],
  },
  {
    id: 'AE-06',
    series: 'AE',
    name: 'Day-7 Follow-Up',
    trigger: 'No reply after 7 days',
    default_sender: 'founder',
    subject: 'Following up — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

I wanted to follow up on my message from last week regarding supply chain optimization for {{AUTO:FACILITY_NAME}}.

I understand you're busy — I'll be brief. We typically surface {{MANUAL:SAVINGS_RANGE}} in recoverable savings for facilities similar to yours. Happy to share specifics on a 20-minute call.

Would any of these times work?

{{AUTO:CALENDAR_LINK}}

Best,
{{AUTO:FOUNDER_NAME}}
{{AUTO:PHONE}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'CALENDAR_LINK', 'PHONE'],
    manual_vars: ['SAVINGS_RANGE'],
  },
  {
    id: 'AE-07',
    series: 'AE',
    name: '6-Month Re-Engagement',
    trigger: 'Stale 6-Month stage',
    default_sender: 'founder',
    subject: 'Checking back in — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

It's been a few months since we last connected, and I wanted to reach back out. A lot has changed in the ASC supply chain landscape — GPO structures, vendor pricing, and PPI contracts are all in flux.

We've recently completed engagements with {{MANUAL:RECENT_CLIENT_TYPE}} facilities and surfaced meaningful savings in areas that often go unexamined.

If the timing is better now, I'd welcome the chance to reconnect.

{{AUTO:CALENDAR_LINK}}

Best regards,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'CALENDAR_LINK'],
    manual_vars: ['RECENT_CLIENT_TYPE'],
  },

  // ── SERIES DQ — Discovery & Qualification ──────────────────────────────────
  {
    id: 'DQ-05b',
    series: 'DQ',
    name: 'Graceful Exit',
    trigger: 'BANT 0–1, not a fit',
    default_sender: 'founder',
    subject: 'Thank you, {{AUTO:ADMIN_NAME}} — following up on our conversation',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you again for your time during our discovery call. After reviewing the details of {{AUTO:FACILITY_NAME}}'s current situation, I don't believe we'd be able to deliver the level of impact our engagement is designed to produce — and I'd rather be upfront than overpromise.

We'd be happy to reconnect if circumstances change. I'll keep {{AUTO:FACILITY_NAME}} on our radar and reach out if we see something specifically relevant.

I wish you and your team continued success.

Best regards,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME'],
    manual_vars: [],
  },
  {
    id: 'DQ-06',
    series: 'DQ',
    name: '90-Day Nurture Check-In',
    trigger: 'BANT 2, 90 days later',
    default_sender: 'founder',
    subject: 'Checking in — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

It's been about 90 days since we last spoke, and I wanted to check back in.

When we connected, {{MANUAL:ORIGINAL_OBSTACLE}} was the primary reason the timing wasn't right. I'm curious whether anything has shifted since then.

We've continued to see strong results across similar facilities — happy to share an updated case example if useful.

{{AUTO:CALENDAR_LINK}}

Best,
{{AUTO:FOUNDER_NAME}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'CALENDAR_LINK'],
    manual_vars: ['ORIGINAL_OBSTACLE'],
  },

  // ── SERIES PC — Proposal & Close ───────────────────────────────────────────
  {
    id: 'PC-02b',
    series: 'PC',
    name: 'SOW Transmittal',
    trigger: 'Same day as verbal yes',
    default_sender: 'founder',
    subject: 'Statement of Work — {{AUTO:FACILITY_NAME}} Diagnostic Engagement',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you for the positive response today — we're excited to move forward with {{AUTO:FACILITY_NAME}}.

Attached is our Statement of Work for the diagnostic engagement. Key details:

• Engagement fee: {{AUTO:FEE}}
• Proposed kickoff window: {{MANUAL:KICKOFF_WINDOW}}
• Guarantee threshold: {{AUTO:GUARANTEE_THRESHOLD}}
• Deliverables: findings presentation, analytics dashboard, 90-day savings roadmap

Please review and sign at your convenience. Once signed, we'll issue the deposit invoice to get officially scheduled.

Please don't hesitate to reach out with any questions.

Best regards,
{{AUTO:FOUNDER_NAME}}
{{AUTO:EMAIL}} · {{AUTO:PHONE}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'FEE', 'GUARANTEE_THRESHOLD', 'EMAIL', 'PHONE'],
    manual_vars: ['KICKOFF_WINDOW'],
  },
  {
    id: 'PC-03b',
    series: 'PC',
    name: 'Deposit Invoice',
    trigger: 'SOW signed',
    default_sender: 'founder',
    subject: 'Deposit Invoice — {{AUTO:FACILITY_NAME}} Engagement',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you for signing the Statement of Work. We're one step away from getting started.

Please find your deposit invoice attached:

Invoice #: {{AUTO:INVOICE_NUMBER}}
Amount due: {{AUTO:INVOICE_AMOUNT}}
Due date: {{AUTO:DUE_DATE}}
Payment: ACH or check payable to ALS Professional Network

Once your deposit is received, we'll confirm your kickoff date and begin scheduling.

Thank you,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'INVOICE_NUMBER', 'INVOICE_AMOUNT', 'DUE_DATE'],
    manual_vars: [],
  },
  {
    id: 'PC-04b',
    series: 'PC',
    name: 'Deposit Received Confirmation',
    trigger: 'Deposit cleared',
    default_sender: 'founder',
    subject: 'Deposit Received — {{AUTO:FACILITY_NAME}} Engagement Confirmed',
    body: `Hi {{AUTO:ADMIN_NAME}},

We've received your deposit — thank you. Your engagement is now officially confirmed.

Here's what happens next:

1. You'll receive a kickoff confirmation email with your scheduled call date and data request list.
2. Our kickoff call is set for {{AUTO:KICKOFF_DATE}}.
3. Our Operator, {{AUTO:OPERATOR_NAME}}, will send a secure upload link for your data items.

We're looking forward to getting started. Don't hesitate to reach out with any questions in the meantime.

Best,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'KICKOFF_DATE', 'OPERATOR_NAME'],
    manual_vars: [],
  },

  // ── SERIES DD — Engagement Delivery ────────────────────────────────────────
  {
    id: 'DD-01b',
    series: 'DD',
    name: 'Post-Kickoff Recap',
    trigger: 'Same day as kickoff call',
    default_sender: 'founder',
    subject: 'Kickoff Recap — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you for a productive kickoff call today. Here's a quick summary of what we covered and what comes next:

Key discussion points:
• {{MANUAL:DISCUSSION_POINT_1}}
• {{MANUAL:DISCUSSION_POINT_2}}

Data items needed by {{AUTO:DATA_DUE_DATE}}:
• AP/vendor spend by category (last 12 months)
• GPO affiliation and contract tier documentation
• Preference card data (top 5 procedures)
• Current vendor contracts

Our on-site walkthrough is scheduled for {{AUTO:ON_SITE_DATE}}.
Findings delivery target: {{AUTO:DELIVERY_DATE}}.

You can track progress here: {{AUTO:PORTAL_LINK}}

{{AUTO:OPERATOR_NAME}} ({{AUTO:OPERATOR_EMAIL}}) is your day-to-day contact for data coordination.

Best,
{{AUTO:FOUNDER_NAME}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'DATA_DUE_DATE', 'ON_SITE_DATE', 'DELIVERY_DATE', 'OPERATOR_NAME', 'OPERATOR_EMAIL', 'PORTAL_LINK'],
    manual_vars: ['DISCUSSION_POINT_1', 'DISCUSSION_POINT_2'],
  },
  {
    id: 'DD-02b',
    series: 'DD',
    name: 'On-Site Confirmation',
    trigger: '48 hrs before on-site',
    default_sender: 'founder',
    subject: 'On-Site Visit Confirmation — {{AUTO:FACILITY_NAME}}, {{AUTO:ON_SITE_DATE}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

This is a confirmation for our on-site walkthrough at {{AUTO:FACILITY_NAME}} scheduled for {{AUTO:ON_SITE_DATE}}.

Our Operator, {{AUTO:OPERATOR_NAME}}, will arrive at {{MANUAL:ARRIVAL_TIME}}. Please plan for approximately {{MANUAL:ESTIMATED_DURATION}}.

During the visit, we'll review:
• OR layout and workflow
• Supply storage and distribution points
• Preference card process
• Any outstanding data items

Please ensure the following are available: {{MANUAL:REQUIRED_CONTACTS}}.

Drive time from Woodstock is approximately {{MANUAL:DRIVE_TIME}}.

Looking forward to the visit.

Best,
{{AUTO:OPERATOR_NAME}}
{{AUTO:OPERATOR_EMAIL}} · {{AUTO:OPERATOR_PHONE}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'ON_SITE_DATE', 'OPERATOR_NAME', 'OPERATOR_EMAIL', 'OPERATOR_PHONE'],
    manual_vars: ['ARRIVAL_TIME', 'ESTIMATED_DURATION', 'REQUIRED_CONTACTS', 'DRIVE_TIME'],
  },
  {
    id: 'DD-03b',
    series: 'DD',
    name: 'Secure Upload Link',
    trigger: 'Within 24 hrs of kickoff',
    default_sender: 'operator',
    subject: 'Secure Data Upload Link — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Following up on our kickoff call — here is the secure link to upload your data items:

{{MANUAL:UPLOAD_LINK}}

Please submit all items by {{AUTO:DATA_DUE_DATE}}. The required files are:
• AP/vendor spend by category (last 12 months)
• GPO affiliation and contract tier documentation
• Preference card data (top 5 procedure types)
• Current vendor contracts (where available)
• Charge capture data (if available)
• OR utilization / case volume report

If you have questions about file formats or what's needed, please reply directly to this email.

Thank you,
{{AUTO:OPERATOR_NAME}}
{{AUTO:OPERATOR_EMAIL}} · {{AUTO:OPERATOR_PHONE}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'OPERATOR_NAME', 'OPERATOR_EMAIL', 'OPERATOR_PHONE', 'DATA_DUE_DATE'],
    manual_vars: ['UPLOAD_LINK'],
  },
  {
    id: 'DD-04b',
    series: 'DD',
    name: 'Data Receipt Confirmation',
    trigger: 'All data received',
    default_sender: 'operator',
    subject: 'Data Received — {{AUTO:FACILITY_NAME}} Engagement',
    body: `Hi {{AUTO:ADMIN_NAME}},

We've received all required data items for the {{AUTO:FACILITY_NAME}} engagement — thank you for your prompt response.

Our analysis phase is now underway. You can expect to hear from us with findings scheduling once analysis is complete, on or before {{AUTO:DELIVERY_DATE}}.

In the meantime, please don't hesitate to reach out if you think of anything additional that may be helpful.

Thank you,
{{AUTO:OPERATOR_NAME}}
{{AUTO:OPERATOR_EMAIL}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'OPERATOR_NAME', 'OPERATOR_EMAIL', 'DELIVERY_DATE'],
    manual_vars: [],
  },
  {
    id: 'DD-05b',
    series: 'DD',
    name: 'Data Incomplete Notice',
    trigger: 'Data partial/missing',
    default_sender: 'operator',
    subject: 'Outstanding Data Items — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you for the data submitted so far. We're still missing a few items needed to complete our analysis:

Outstanding items:
{{MANUAL:MISSING_ITEMS}}

We'd like to receive these by {{MANUAL:REVISED_DUE_DATE}} to stay on track for our {{AUTO:DELIVERY_DATE}} delivery target.

Please reply to this email or upload directly to the secure link previously provided. Let me know if you have any questions.

Thank you,
{{AUTO:OPERATOR_NAME}}
{{AUTO:OPERATOR_EMAIL}} · {{AUTO:OPERATOR_PHONE}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'OPERATOR_NAME', 'OPERATOR_EMAIL', 'OPERATOR_PHONE', 'DELIVERY_DATE'],
    manual_vars: ['MISSING_ITEMS', 'REVISED_DUE_DATE'],
  },
  {
    id: 'DD-06b',
    series: 'DD',
    name: 'Findings Presentation Confirmation',
    trigger: 'Analysis complete',
    default_sender: 'founder',
    subject: 'Findings Ready — Scheduling Presentation for {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Our analysis for {{AUTO:FACILITY_NAME}} is complete and we're ready to present findings.

I'd like to schedule a 90-minute presentation call at a time that works for you and your physician-owners. Please use the link below to select a time:

{{AUTO:CALENDAR_LINK}}

We'll cover:
• Total opportunity summary ({{AUTO:TOTAL_OPPORTUNITY}} across all categories)
• Category-by-category breakdown with confidence levels
• 90-day implementation roadmap

Please plan to have {{MANUAL:REQUIRED_ATTENDEES}} on the call.

Looking forward to sharing what we found.

Best,
{{AUTO:FOUNDER_NAME}}
{{AUTO:EMAIL}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'CALENDAR_LINK', 'TOTAL_OPPORTUNITY', 'EMAIL'],
    manual_vars: ['REQUIRED_ATTENDEES'],
  },
  {
    id: 'DD-07b',
    series: 'DD',
    name: 'Balance Invoice',
    trigger: 'Findings delivered',
    default_sender: 'founder',
    subject: 'Balance Invoice — {{AUTO:FACILITY_NAME}} Engagement Complete',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you for a productive findings presentation. We're pleased with the results we were able to surface for {{AUTO:FACILITY_NAME}}.

Please find your balance invoice attached:

Invoice #: {{AUTO:INVOICE_NUMBER}}
Amount due: {{AUTO:INVOICE_AMOUNT}}
Due date: {{AUTO:DUE_DATE}}

Payment by ACH or check payable to ALS Professional Network.

Our total documented opportunity came to {{AUTO:WEIGHTED_TOTAL}}, which {{MANUAL:THRESHOLD_STATUS}} our {{AUTO:GUARANTEE_THRESHOLD}} guarantee threshold.

Thank you for the opportunity to serve {{AUTO:FACILITY_NAME}}.

Best regards,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'INVOICE_NUMBER', 'INVOICE_AMOUNT', 'DUE_DATE', 'WEIGHTED_TOTAL', 'GUARANTEE_THRESHOLD'],
    manual_vars: ['THRESHOLD_STATUS'],
  },

  // ── SERIES FD — Findings & Post-Delivery ───────────────────────────────────
  {
    id: 'FD-01',
    series: 'FD',
    name: 'Findings Follow-Up — Threshold Met',
    trigger: 'After findings call, threshold met',
    default_sender: 'founder',
    subject: 'Next Steps — {{AUTO:FACILITY_NAME}} Findings',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you for your time during our findings presentation. I'm glad we were able to demonstrate {{AUTO:WEIGHTED_TOTAL}} in documented opportunity — exceeding our {{AUTO:GUARANTEE_THRESHOLD}} guarantee threshold.

As discussed, the next logical step is beginning implementation. The fastest and most cost-effective path is our ongoing retainer arrangement, which provides:

• Monthly variance monitoring and reporting
• Vendor negotiation support
• Quarterly business reviews
• Direct access to our full team

Monthly retainer: {{MANUAL:RETAINER_FEE}}

I'll follow up with a formal retainer proposal, but wanted to gauge your interest first. Would you be open to a brief call this week?

{{AUTO:CALENDAR_LINK}}

Best,
{{AUTO:FOUNDER_NAME}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'WEIGHTED_TOTAL', 'GUARANTEE_THRESHOLD', 'CALENDAR_LINK'],
    manual_vars: ['RETAINER_FEE'],
  },
  {
    id: 'FD-02',
    series: 'FD',
    name: 'Below-Threshold Professional Close',
    trigger: 'After findings call, threshold not met',
    default_sender: 'founder',
    subject: 'Thank You — {{AUTO:FACILITY_NAME}} Engagement',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you for your partnership through our diagnostic engagement. While our documented findings came in below our guarantee threshold of {{AUTO:GUARANTEE_THRESHOLD}}, we want to honor our commitment.

As a result, we will {{MANUAL:REMEDY_DESCRIPTION}}.

Your 90-day implementation roadmap is attached. Even at this level, the identified savings represent meaningful impact if pursued diligently.

We remain available if you have questions about implementation, and we hope to have the opportunity to work with you again in the future.

Best regards,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'GUARANTEE_THRESHOLD'],
    manual_vars: ['REMEDY_DESCRIPTION'],
  },
  {
    id: 'FD-03',
    series: 'FD',
    name: 'Retainer Proposal Follow-Up',
    trigger: 'No retainer decision at Day 5',
    default_sender: 'founder',
    subject: 'Retainer Proposal — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Following up on our findings conversation. I wanted to formally outline our retainer offering for {{AUTO:FACILITY_NAME}}.

Our monthly retainer includes:
• Variance monitoring dashboard (updated monthly)
• Monthly review call with our full team
• Active vendor negotiation support
• Quarterly business reviews
• Unlimited email and phone access

Monthly fee: {{MANUAL:RETAINER_FEE}}
Initial term: 12 months
Start date (proposed): {{MANUAL:PROPOSED_START_DATE}}

Given the {{AUTO:WEIGHTED_TOTAL}} in identified opportunities, the retainer pays for itself in implementation tracking alone.

Happy to answer any questions or schedule a brief call.

{{AUTO:CALENDAR_LINK}}

Best,
{{AUTO:FOUNDER_NAME}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'WEIGHTED_TOTAL', 'CALENDAR_LINK'],
    manual_vars: ['RETAINER_FEE', 'PROPOSED_START_DATE'],
  },
  {
    id: 'FD-04',
    series: 'FD',
    name: 'Retainer Welcome',
    trigger: 'Retainer signed + deposit received',
    default_sender: 'founder',
    subject: 'Welcome to ALS Professional Network — {{AUTO:FACILITY_NAME}} Retainer',
    body: `Hi {{AUTO:ADMIN_NAME}},

Welcome — we're thrilled to have {{AUTO:FACILITY_NAME}} as an ongoing partner.

Your retainer officially begins on {{AUTO:KICKOFF_DATE}}. Here's what to expect:

Monthly rhythm:
• Invoice issued on the 1st of each month ({{AUTO:MONTHLY_FEE}}/month)
• Dashboard updated by the 10th
• Monthly review call scheduled in the third week
• Monthly summary email following the call

Quarterly:
• Contract compliance audit
• Active vendor negotiation update
• Formal QBR with physician-owners (optional)

Your primary contact for day-to-day matters is {{AUTO:OPERATOR_NAME}} ({{AUTO:OPERATOR_EMAIL}}).

We look forward to a long and productive partnership.

Best regards,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'KICKOFF_DATE', 'MONTHLY_FEE', 'OPERATOR_NAME', 'OPERATOR_EMAIL'],
    manual_vars: [],
  },

  // ── SERIES RT — Retainer Cadence ───────────────────────────────────────────
  {
    id: 'RT-01',
    series: 'RT',
    name: 'Monthly Retainer Invoice',
    trigger: '1st of each month',
    default_sender: 'operator',
    subject: '{{MANUAL:MONTH_YEAR}} Retainer Invoice — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Please find your monthly retainer invoice attached.

Invoice #: {{AUTO:INVOICE_NUMBER}}
Period: {{MANUAL:MONTH_YEAR}}
Amount: {{AUTO:MONTHLY_FEE}}
Due date: {{AUTO:DUE_DATE}}

Payment by ACH or check payable to ALS Professional Network.

Thank you,
{{AUTO:OPERATOR_NAME}}
{{AUTO:OPERATOR_EMAIL}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'OPERATOR_NAME', 'OPERATOR_EMAIL', 'INVOICE_NUMBER', 'MONTHLY_FEE', 'DUE_DATE'],
    manual_vars: ['MONTH_YEAR'],
  },
  {
    id: 'RT-02',
    series: 'RT',
    name: 'Monthly Dashboard Delivery',
    trigger: 'Dashboard updated',
    default_sender: 'operator',
    subject: '{{MANUAL:MONTH_YEAR}} Dashboard — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Your updated supply chain dashboard for {{MANUAL:MONTH_YEAR}} is ready.

{{MANUAL:DASHBOARD_LINK}}

Key highlights this month:
• {{MANUAL:HIGHLIGHT_1}}
• {{MANUAL:HIGHLIGHT_2}}
• {{MANUAL:HIGHLIGHT_3}}

Please review ahead of our monthly call. Let me know if anything needs clarification.

{{AUTO:OPERATOR_NAME}}
{{AUTO:OPERATOR_EMAIL}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'OPERATOR_NAME', 'OPERATOR_EMAIL'],
    manual_vars: ['MONTH_YEAR', 'DASHBOARD_LINK', 'HIGHLIGHT_1', 'HIGHLIGHT_2', 'HIGHLIGHT_3'],
  },
  {
    id: 'RT-03',
    series: 'RT',
    name: 'Monthly Review Call Confirmation',
    trigger: 'Scheduling monthly call',
    default_sender: 'operator',
    subject: 'Monthly Review Call — {{AUTO:FACILITY_NAME}}, {{MANUAL:CALL_DATE}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

This confirms our monthly review call:

Date: {{MANUAL:CALL_DATE}}
Time: {{MANUAL:CALL_TIME}}
Link: {{AUTO:CALL_LINK}}
Duration: 60 minutes

Agenda:
1. Dashboard review (15 min)
2. Variance updates and action items (20 min)
3. Vendor negotiation status (15 min)
4. Questions / open items (10 min)

Please come prepared with any specific items you'd like to address.

See you then,
{{AUTO:OPERATOR_NAME}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'OPERATOR_NAME', 'CALL_LINK'],
    manual_vars: ['CALL_DATE', 'CALL_TIME'],
  },
  {
    id: 'RT-04',
    series: 'RT',
    name: 'Monthly Summary',
    trigger: 'After monthly call',
    default_sender: 'operator',
    subject: '{{MANUAL:MONTH_YEAR}} Monthly Summary — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you for a productive monthly review call. Here's a summary of what we covered:

Action items:
• {{MANUAL:ACTION_1}}
• {{MANUAL:ACTION_2}}

Savings documented this month: {{MANUAL:SAVINGS_THIS_MONTH}}
Cumulative savings to date: {{MANUAL:CUMULATIVE_SAVINGS}}

Vendor updates: {{MANUAL:VENDOR_NOTES}}

Next call: {{MANUAL:NEXT_CALL_DATE}}

As always, reach out if anything comes up between now and then.

{{AUTO:OPERATOR_NAME}}
{{AUTO:OPERATOR_EMAIL}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'OPERATOR_NAME', 'OPERATOR_EMAIL'],
    manual_vars: ['MONTH_YEAR', 'ACTION_1', 'ACTION_2', 'SAVINGS_THIS_MONTH', 'CUMULATIVE_SAVINGS', 'VENDOR_NOTES', 'NEXT_CALL_DATE'],
  },
  {
    id: 'RT-05',
    series: 'RT',
    name: 'QBR Scheduling',
    trigger: '14 days before quarter end',
    default_sender: 'founder',
    subject: 'Q{{MANUAL:QUARTER}} QBR Scheduling — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

We're approaching the end of Q{{MANUAL:QUARTER}} and I'd like to schedule our Quarterly Business Review for {{AUTO:FACILITY_NAME}}.

QBRs run approximately 90 minutes and typically include physician-owner attendance when available. We'll cover:

• Cumulative savings realized vs. target
• Contract compliance and vendor negotiation status
• 90-day roadmap progress
• Renewal discussion (if applicable)

Please use the link below to select a time that works for you and any physician-owners who'd like to attend:

{{AUTO:CALENDAR_LINK}}

Looking forward to it.

Best,
{{AUTO:FOUNDER_NAME}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'CALENDAR_LINK'],
    manual_vars: ['QUARTER'],
  },
  {
    id: 'RT-06',
    series: 'RT',
    name: 'QBR Follow-Up',
    trigger: 'Same day after QBR',
    default_sender: 'founder',
    subject: 'QBR Summary & Next Steps — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Thank you for a productive QBR today. Here's a summary:

Cumulative savings realized: {{MANUAL:CUMULATIVE_SAVINGS}}
Vs. target: {{MANUAL:SAVINGS_VS_TARGET}}

Key decisions / action items:
• {{MANUAL:ACTION_1}}
• {{MANUAL:ACTION_2}}

Renewal discussion notes: {{MANUAL:RENEWAL_NOTES}}

Next QBR target: {{MANUAL:NEXT_QBR_DATE}}

Thank you for your continued partnership. We look forward to another strong quarter.

Best regards,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME'],
    manual_vars: ['CUMULATIVE_SAVINGS', 'SAVINGS_VS_TARGET', 'ACTION_1', 'ACTION_2', 'RENEWAL_NOTES', 'NEXT_QBR_DATE'],
  },
  {
    id: 'RT-07',
    series: 'RT',
    name: 'Renewal Reminder',
    trigger: '60 days before renewal date',
    default_sender: 'founder',
    subject: 'Retainer Renewal — {{AUTO:FACILITY_NAME}} ({{AUTO:RENEWAL_DATE}})',
    body: `Hi {{AUTO:ADMIN_NAME}},

Your current retainer with ALS Professional Network is set to renew on {{AUTO:RENEWAL_DATE}} — approximately 60 days from now.

Current terms: {{AUTO:MONTHLY_FEE}}/month

I'd like to schedule a brief call to discuss renewal terms, any scope adjustments, and the roadmap for the coming year. Based on results to date, we also have a few ideas for deepening the engagement.

{{AUTO:CALENDAR_LINK}}

We value our partnership with {{AUTO:FACILITY_NAME}} and look forward to continuing.

Best,
{{AUTO:FOUNDER_NAME}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'RENEWAL_DATE', 'MONTHLY_FEE', 'CALENDAR_LINK'],
    manual_vars: [],
  },
  {
    id: 'RT-08',
    series: 'RT',
    name: 'Late Payment Notice',
    trigger: 'Invoice 7 days overdue',
    default_sender: 'founder',
    subject: 'Past Due Notice — {{AUTO:FACILITY_NAME}} Invoice {{AUTO:INVOICE_NUMBER}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

I wanted to follow up regarding invoice {{AUTO:INVOICE_NUMBER}} for {{AUTO:INVOICE_AMOUNT}}, which was due on {{AUTO:DUE_DATE}} and appears to still be outstanding.

If payment has already been sent, please disregard this notice and let us know so we can update our records.

If there's a question or issue with the invoice, please reply to this email and we'll resolve it promptly.

Payment can be made by ACH or check payable to ALS Professional Network.

Thank you,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network
{{AUTO:PHONE}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'INVOICE_NUMBER', 'INVOICE_AMOUNT', 'DUE_DATE', 'PHONE'],
    manual_vars: [],
  },

  // ── Public-link templates (Phase 8 wiring) ─────────────────────────────────
  {
    id: 'PC-SOW-LINK',
    series: 'PC',
    name: 'SOW Ready for Review',
    trigger: 'After issuing a SOW review link from the pipeline record',
    default_sender: 'founder',
    subject: 'SOW for {{AUTO:FACILITY_NAME}} — ready for your review',
    body: `Hi {{AUTO:ADMIN_NAME}},

The Statement of Work for {{AUTO:FACILITY_NAME}} is ready for your review.

Please use the secure link below to read the SOW and sign electronically. The link will email you a 6-digit verification code before granting access:

{{AUTO:SOW_REVIEW_LINK}}

This link is valid for 14 days and is single-use — once you sign, it cannot be reused. If you have any questions about the terms, please reply directly to this email.

Best regards,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network
{{AUTO:PHONE}} · {{AUTO:EMAIL}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'SOW_REVIEW_LINK', 'PHONE', 'EMAIL'],
    manual_vars: [],
  },
  {
    id: 'DD-PORTAL-LINK',
    series: 'DD',
    name: 'Engagement Portal Access',
    trigger: 'After kickoff, alongside data request package',
    default_sender: 'operator',
    subject: 'Your engagement portal — {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

Now that we are kicked off, here is your secure engagement portal where you can track milestones, upload requested data files, and review deliverables as they are ready:

{{AUTO:PORTAL_LINK}}

The first time you open it you will be asked to enter a 6-digit verification code we will email to you. The link will remain active for the duration of the engagement and you can return to it any time.

Please let me know if you have any trouble accessing it.

Best,
{{AUTO:OPERATOR_NAME}}
ALS Professional Network
{{AUTO:OPERATOR_EMAIL}}`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'OPERATOR_NAME', 'OPERATOR_EMAIL', 'PORTAL_LINK'],
    manual_vars: [],
  },
  {
    id: 'FD-PORTAL-FINDINGS',
    series: 'FD',
    name: 'Findings Ready in Portal',
    trigger: 'When findings deck/dashboard/roadmap are uploaded',
    default_sender: 'founder',
    subject: 'Findings ready for {{AUTO:FACILITY_NAME}}',
    body: `Hi {{AUTO:ADMIN_NAME}},

The findings deliverables for {{AUTO:FACILITY_NAME}} are ready. You can review the findings deck, analytics dashboard, and 90-day roadmap in your engagement portal:

{{AUTO:PORTAL_LINK}}

When you are done reviewing, please click "Acknowledge findings" in the portal so we have a record of receipt. We will then schedule a call to discuss next steps.

Looking forward to walking through the results with you.

Best,
{{AUTO:FOUNDER_NAME}}
ALS Professional Network`,
    auto_vars: ['ADMIN_NAME', 'FACILITY_NAME', 'FOUNDER_NAME', 'PORTAL_LINK'],
    manual_vars: [],
  },
];

/**
 * Build auto-variable map from a linked CRM record.
 *
 * `publicLinks` (optional) supplies the absolute URLs for {{AUTO:SOW_REVIEW_LINK}}
 * and {{AUTO:PORTAL_LINK}}. The EmailComposer queries PublicAccessToken for the
 * linked record and builds the URLs before calling this function. If
 * publicLinks is empty, PORTAL_LINK falls back to the legacy
 * record.portal_url field for back-compat with older portal data.
 */
export function buildAutoVars(record, recordType, user, publicLinks = {}) {
  if (!record) return {};
  const vars = {
    PRACTICE_NAME: 'ALS Professional Network',
    FOUNDER_NAME: 'ALS Founder', // override with real user data
    OPERATOR_NAME: 'ALS Operator',
    EMAIL: user?.email || '',
    PHONE: '',
    CALENDAR_LINK: '[CALENDAR LINK]',
    OPERATOR_EMAIL: '',
    OPERATOR_PHONE: '',
    FACILITY_NAME: record.facility_name || '',
    ADMIN_NAME: record.admin_name || '',
    FEE: record.fee ? `$${Number(record.fee).toLocaleString()}` : record.proposed_fee ? `$${Number(record.proposed_fee).toLocaleString()}` : '',
    KICKOFF_DATE: record.kickoff_date || record.start_date || '',
    DELIVERY_DATE: record.delivery_target || '',
    ON_SITE_DATE: record.on_site_date || '',
    DATA_DUE_DATE: '',
    CALL_LINK: '',
    RENEWAL_DATE: record.renewal_date || '',
    INVOICE_NUMBER: '',
    INVOICE_AMOUNT: record.mrr ? `$${Number(record.mrr).toLocaleString()}` : '',
    DUE_DATE: '',
    MONTHLY_FEE: record.mrr ? `$${Number(record.mrr).toLocaleString()}` : '',
    GUARANTEE_THRESHOLD: record.fee ? `$${(Number(record.fee) * 3).toLocaleString()}` : '',
    WEIGHTED_TOTAL: '',
    TOTAL_OPPORTUNITY: '',
    PORTAL_LINK: publicLinks.portalLink || record.portal_url || '',
    SOW_REVIEW_LINK: publicLinks.sowReviewLink || '',
  };
  return vars;
}

/**
 * Apply template variables to text.
 * AUTO vars are replaced with values from autoVars map.
 * MANUAL vars are left as ⚠️[VAR_NAME] placeholders for user to fill.
 */
export function applyTemplate(text, autoVars = {}) {
  let result = text;
  // Replace auto vars
  result = result.replace(/\{\{AUTO:([A-Z_]+)\}\}/g, (_, key) => autoVars[key] || `[${key}]`);
  // Mark manual vars with ⚠️ prefix for highlighting
  result = result.replace(/\{\{MANUAL:([A-Z_]+)\}\}/g, (_, key) => `⚠️[${key}]`);
  return result;
}

/**
 * Count remaining unfilled manual variables (⚠️[...]) in text
 */
export function countUnfilledManualVars(text) {
  const matches = text.match(/⚠️\[[A-Z_]+\]/g);
  return matches ? matches.length : 0;
}

export function getTemplateById(id) {
  return EMAIL_TEMPLATES.find(t => t.id === id) || null;
}

export function getTemplatesBySeries(series) {
  return EMAIL_TEMPLATES.filter(t => t.series === series);
}

export const SERIES_LABELS = {
  AE: 'AE — Prospect Outreach',
  DQ: 'DQ — Discovery & Qualification',
  PC: 'PC — Proposal & Close',
  DD: 'DD — Engagement Delivery',
  FD: 'FD — Findings & Post-Delivery',
  RT: 'RT — Retainer Cadence',
};
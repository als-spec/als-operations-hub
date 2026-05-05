export const EMAIL_TEMPLATES = [
  {
    id: 'AE-01',
    name: 'AE-01: Cold Outreach — Primary Vertical',
    subject: 'Supply Chain Optimization for [FACILITY]',
    body: `Hi [NAME],

I hope this message finds you well. My name is [SENDER], and I work with ALS Professional Network, a healthcare supply chain consulting firm specializing in physician-owned ASCs.

We've helped facilities like yours identify significant cost savings through PPI variance analysis, GPO tier optimization, and off-contract spend recovery — typically achieving 3–5× ROI on our diagnostic fee.

I'd love to schedule a brief 30-minute discovery call to explore whether there might be a fit. Would any of the following times work for you?

[CALENDAR_LINK]

Looking forward to connecting.

Best regards,
ALS Professional Network`,
  },
  {
    id: 'AE-02',
    name: 'AE-02: LinkedIn Follow-Up',
    subject: 'Following up — Supply Chain Opportunity at [FACILITY]',
    body: `Hi [NAME],

I wanted to follow up on my recent LinkedIn message regarding supply chain optimization for [FACILITY].

I understand your time is valuable, so I'll be brief: we specialize in diagnostic engagements for physician-owned orthopedic ASCs and have a strong track record of surfacing savings that offset our fee by 3× or more.

If you'd be open to a quick 20-minute call, I'd be happy to share a few relevant case examples.

[CALENDAR_LINK]

Thank you for your time.

Best,
ALS Professional Network`,
  },
  {
    id: 'AE-04',
    name: 'AE-04: 24-Hour Discovery Follow-Up',
    subject: 'Great connecting with you, [NAME]',
    body: `Hi [NAME],

Thank you for taking the time to speak with us today. It was great to learn more about [FACILITY] and the challenges you're navigating.

As discussed, our next step is [NEXT_STEP]. I'll have that over to you by [DATE].

In the meantime, please don't hesitate to reach out with any questions.

Looking forward to moving forward together.

Best regards,
ALS Professional Network`,
  },
  {
    id: 'AE-05',
    name: 'AE-05: Kickoff Confirmation',
    subject: 'Kickoff Confirmation — [FACILITY] Diagnostic Engagement',
    body: `Hi [NAME],

We're excited to officially kick off our engagement with [FACILITY]!

This email confirms our kickoff call scheduled for [DATE] at [TIME] via Zoom: [CALENDAR_LINK]

To prepare, we'll need the following data items in advance:
• Accounts payable / vendor spend by category (last 12 months)
• Current GPO affiliation and contract tier documentation
• Preference card data (top 5 procedure types)
• Current vendor contracts (where available)

Please feel free to reply with any questions before our call. We look forward to getting started.

Best regards,
ALS Professional Network`,
  },
];

export function applyTemplate(text, vars = {}) {
  let result = text;
  Object.entries(vars).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
  });
  return result;
}
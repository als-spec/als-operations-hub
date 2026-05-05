import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'hello@alsoperations.com';
const FROM_NAME = Deno.env.get('FROM_NAME') || 'ALS Professional Network';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to_address, to_name, subject, body, linked_record_id, linked_record_type, linked_record_name, template_used } = await req.json();

    if (!to_address || !subject || !body) {
      return Response.json({ error: 'to_address, subject, and body are required' }, { status: 400 });
    }

    // Send via Resend
    let resendResult = null;
    if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [to_name ? `${to_name} <${to_address}>` : to_address],
          subject,
          html: body.replace(/\n/g, '<br>'),
        }),
      });
      resendResult = await res.json();
      if (!res.ok) {
        return Response.json({ error: 'Email delivery failed', details: resendResult }, { status: 502 });
      }
    }

    // Log the sent email
    const emailLog = await base44.entities.EmailSent.create({
      to_address,
      to_name: to_name || '',
      subject,
      body,
      linked_record_id: linked_record_id || '',
      linked_record_type: linked_record_type || '',
      linked_record_name: linked_record_name || '',
      template_used: template_used || '',
      sent_at: new Date().toISOString(),
      sent_by: user.email,
      replied: false,
    });

    return Response.json({ success: true, email_id: emailLog.id, resend_id: resendResult?.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
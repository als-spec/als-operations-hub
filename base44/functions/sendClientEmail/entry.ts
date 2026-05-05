import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to_address, to_name, subject, body, linked_record_id, linked_record_type, linked_record_name, template_used } = await req.json();

    if (!to_address || !subject || !body) {
      return Response.json({ error: 'to_address, subject, and body are required' }, { status: 400 });
    }

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Build RFC 2822 message
    const toHeader = to_name ? `${to_name} <${to_address}>` : to_address;
    const htmlBody = body.replace(/\n/g, '<br>');

    const mimeMessage = [
      `To: ${toHeader}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      htmlBody,
    ].join('\r\n');

    // Base64url encode
    const encoded = btoa(unescape(encodeURIComponent(mimeMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    });

    const gmailData = await gmailRes.json();
    if (!gmailRes.ok) {
      return Response.json({ error: 'Gmail send failed', details: gmailData }, { status: 502 });
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

    return Response.json({ success: true, email_id: emailLog.id, gmail_id: gmailData.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
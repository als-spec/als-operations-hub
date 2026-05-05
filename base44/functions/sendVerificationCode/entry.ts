import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

const CODE_TTL_MIN = 15;
const MAX_CODES_PER_HOUR = 3;

function generateCode(): string {
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  const num = ((buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | buf[3]) >>> 0;
  return (num % 1000000).toString().padStart(6, '0');
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 1) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const masked = local.length <= 2 ? local[0] + '*' : local.slice(0, 2) + '***';
  return `${masked}@${domain}`;
}

Deno.serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || '';
  const ua = req.headers.get('user-agent') || '';

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => null);
    const token = body?.token;

    if (!token || typeof token !== 'string') {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const tokens = await base44.entities.PublicAccessToken.filter({ token });
    if (!tokens.length) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
    const t = tokens[0];

    if (
      t.revoked ||
      (t.expires_at && new Date(t.expires_at) < new Date()) ||
      (t.single_use && t.consumed_at)
    ) {
      return Response.json({ error: 'Link no longer valid' }, { status: 410 });
    }

    // Rate limit: max 3 codes per token per hour.
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const allCodes = await base44.entities.EmailVerificationCode.filter({ token_id: t.id });
    const recent = allCodes.filter((c: any) => (c.issued_at || '') >= oneHourAgo);
    if (recent.length >= MAX_CODES_PER_HOUR) {
      await base44.entities.PublicAccessEvent.create({
        token_id: t.id,
        resource_type: t.resource_type,
        resource_id: t.resource_id,
        action: 'denied_rate_limit',
        ts: new Date().toISOString(),
        ip, user_agent: ua,
        success: false,
        metadata: { recent_codes: recent.length },
      }).catch(() => {});
      return Response.json(
        { error: 'Too many code requests. Please wait an hour and try again.' },
        { status: 429 },
      );
    }

    const code = generateCode();
    const code_hash = await sha256Hex(code);
    const now_iso = new Date().toISOString();
    const expires_at = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000).toISOString();

    await base44.entities.EmailVerificationCode.create({
      token_id: t.id,
      email: t.recipient_email,
      code_hash,
      expires_at,
      issued_at: now_iso,
      attempts: 0,
      issuer_ip: ip,
    });

    // Send via Gmail connector (same pattern as sendClientEmail).
    const recipient = t.recipient_email;
    const recipient_name = (t.recipient_name || '') as string;
    const to_header = recipient_name ? `${recipient_name} <${recipient}>` : recipient;
    const subject = 'Your verification code for ALS Operations Hub';
    const greeting = recipient_name ? escapeHtml(recipient_name.split(' ')[0]) : 'there';
    const html = [
      `<p>Hi ${greeting},</p>`,
      `<p>Your verification code is:</p>`,
      `<p style="font-size:24px;font-weight:bold;letter-spacing:4px;margin:20px 0;">${code}</p>`,
      `<p>This code expires in ${CODE_TTL_MIN} minutes. If you didn't request this, you can ignore this email.</p>`,
      `<p>&mdash; ALS Professional Network</p>`,
    ].join('\n');

    const mime = [
      `To: ${to_header}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      html,
    ].join('\r\n');

    const encoded = btoa(unescape(encodeURIComponent(mime)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const gmailRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: encoded }),
      },
    );

    if (!gmailRes.ok) {
      console.error('Gmail send failed:', gmailRes.status, await gmailRes.text().catch(() => ''));
      return Response.json(
        { error: 'Could not send verification email. Please try again.' },
        { status: 502 },
      );
    }

    await base44.entities.PublicAccessEvent.create({
      token_id: t.id,
      resource_type: t.resource_type,
      resource_id: t.resource_id,
      action: 'verify_request',
      ts: now_iso,
      ip, user_agent: ua,
      success: true,
      metadata: {},
    }).catch(() => {});

    return Response.json({
      success: true,
      expires_in_seconds: CODE_TTL_MIN * 60,
      sent_to_hint: maskEmail(recipient),
    });
  } catch (err) {
    console.error('sendVerificationCode failed:', err);
    return Response.json({ error: 'Could not send verification email.' }, { status: 500 });
  }
});

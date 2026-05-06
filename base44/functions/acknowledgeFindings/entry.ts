import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

// Guarded action: client confirms they have reviewed the findings deliverables.
// Idempotent — re-submission returns 409 with the existing acknowledgment so
// the UI can render the receipt without producing duplicate records.

const NOTES_MAX = 2000;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}

async function sendAckEmail(
  base44: any,
  to: { name: string; email: string },
  cc_email: string | null,
  data: {
    facility_name: string;
    by_name: string;
    acknowledged_at: string;
    notes: string;
    findings_deck_url: string;
  },
) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const safe = {
      facility: escapeHtml(data.facility_name),
      by: escapeHtml(data.by_name),
      ts: escapeHtml(data.acknowledged_at),
      notes: escapeHtml(data.notes),
      deck: escapeHtml(data.findings_deck_url || ''),
    };

    const notes_block = data.notes
      ? `<p style="margin-top:12px;"><strong>Comments:</strong></p><blockquote style="margin:6px 0 12px;padding:8px 12px;border-left:3px solid #ccc;color:#444;white-space:pre-wrap;">${safe.notes}</blockquote>`
      : '';

    const deck_link = data.findings_deck_url
      ? `<p>Findings deck: <a href="${safe.deck}">${safe.deck}</a></p>`
      : '';

    const html = [
      `<p>This confirms that <strong>${safe.by}</strong> acknowledged the findings for`,
      `<strong>${safe.facility}</strong> on ${safe.ts}.</p>`,
      deck_link,
      notes_block,
      `<p style="font-size:12px;color:#666;margin-top:20px;">`,
      `Keep this email for your records.</p>`,
      `<p>&mdash; ALS Professional Network</p>`,
    ].join('\n');

    const to_header = to.name ? `${to.name} <${to.email}>` : to.email;
    const headers = [
      `To: ${to_header}`,
      `Subject: Findings acknowledged — ${data.facility_name}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
    ];
    if (cc_email && cc_email !== to.email) headers.splice(1, 0, `Cc: ${cc_email}`);
    const mime = headers.concat(['', html]).join('\r\n');
    const encoded = btoa(unescape(encodeURIComponent(mime)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: encoded }),
      },
    );
    if (!res.ok) {
      console.error('Ack email send failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('Ack email failed:', err);
  }
}

Deno.serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || '';
  const ua = req.headers.get('user-agent') || '';

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => null);
    const token = body?.token;
    const session_id = body?.session_id;
    const accepted = body?.accepted === true;
    const notes_raw = body?.notes;

    if (!token || typeof token !== 'string' || !session_id || typeof session_id !== 'string') {
      return Response.json(
        { error: 'Verification required', requires_verification: true },
        { status: 401 },
      );
    }
    if (!accepted) {
      return Response.json({ error: 'You must check the acknowledgment box.' }, { status: 400 });
    }
    const notes =
      typeof notes_raw === 'string' ? notes_raw.slice(0, NOTES_MAX).trim() : '';

    const tokens = await base44.entities.PublicAccessToken.filter({ token });
    if (!tokens.length) return Response.json({ error: 'Invalid request' }, { status: 400 });
    const t = tokens[0];

    if (t.resource_type !== 'portal') {
      return Response.json({ error: 'Wrong resource type' }, { status: 400 });
    }
    if (t.revoked) return Response.json({ error: 'Link no longer valid' }, { status: 410 });
    if (t.expires_at && new Date(t.expires_at) < new Date()) {
      return Response.json({ error: 'Link no longer valid' }, { status: 410 });
    }
    if (!Array.isArray(t.scope) || !t.scope.includes('acknowledge')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sessions = await base44.entities.VerifiedSession.filter({ session_id });
    const sess = sessions?.[0];
    if (!sess || sess.token_id !== t.id) {
      return Response.json(
        { error: 'Verification expired', requires_verification: true },
        { status: 401 },
      );
    }
    if (sess.expires_at && new Date(sess.expires_at) < new Date()) {
      return Response.json(
        { error: 'Verification expired', requires_verification: true },
        { status: 401 },
      );
    }
    if (
      (sess.verified_email || '').toLowerCase().trim() !==
      (t.recipient_email || '').toLowerCase().trim()
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const engagements = await base44.entities.Engagement.filter({ id: t.resource_id });
    if (!engagements.length) return Response.json({ error: 'Record not found' }, { status: 404 });
    const engagement = engagements[0];

    if (!engagement.findings_delivered) {
      return Response.json(
        { error: 'Findings have not been delivered yet.' },
        { status: 409 },
      );
    }

    if (engagement.findings_acknowledged_at) {
      return Response.json({
        error: 'Already acknowledged',
        acknowledged_at: engagement.findings_acknowledged_at,
        acknowledged_by_name: engagement.findings_acknowledged_by_name || '',
        notes: engagement.findings_acknowledgment_notes || '',
      }, { status: 409 });
    }

    const by_name = (t.recipient_name || '').trim() || t.recipient_email;
    const acknowledged_at = new Date().toISOString();

    // Service-role write — recipient is unauthenticated; if Engagement has
    // any update-side gate or RLS, user-context write would be rejected.
    await base44.asServiceRole.entities.Engagement.update(engagement.id, {
      findings_acknowledged_at: acknowledged_at,
      findings_acknowledged_by_name: by_name,
      findings_acknowledged_by_email: t.recipient_email,
      findings_acknowledgment_ip: ip,
      findings_acknowledgment_user_agent: ua,
      findings_acknowledgment_notes: notes,
      findings_acknowledgment_token_id: t.id,
    });

    await base44.entities.PublicAccessToken.update(t.id, {
      access_count: (t.access_count || 0) + 1,
      last_accessed_at: acknowledged_at,
    }).catch(() => {});

    await base44.entities.PublicAccessEvent.create({
      token_id: t.id,
      resource_type: t.resource_type,
      resource_id: t.resource_id,
      action: 'acknowledge',
      ts: acknowledged_at,
      ip, user_agent: ua,
      success: true,
      metadata: { has_notes: notes.length > 0, notes_length: notes.length },
    }).catch(() => {});

    await sendAckEmail(
      base44,
      { name: by_name, email: t.recipient_email },
      t.issued_by || null,
      {
        facility_name: engagement.facility_name || '',
        by_name,
        acknowledged_at,
        notes,
        findings_deck_url: engagement.findings_deck_url || '',
      },
    );

    return Response.json({
      success: true,
      acknowledged_at,
      acknowledged_by_name: by_name,
      notes,
    });
  } catch (err) {
    console.error('acknowledgeFindings failed:', err);
    return Response.json({ error: 'Could not record acknowledgment.' }, { status: 500 });
  }
});

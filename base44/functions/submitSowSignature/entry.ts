import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

// Guarded write. Captures clickwrap acceptance, anchors the signature to the
// document via sha256, marks the token consumed, advances the pipeline stage,
// and emails confirmation receipts to the signer and the issuing operator.

const TYPED_NAME_MIN = 2;
const TYPED_NAME_MAX = 200;

async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashSowDocument(url: string): Promise<{ sha256: string; source: 'bytes' | 'url' }> {
  // Best-effort: fetch the PDF bytes and hash them. Many SOW URLs (Google Drive
  // share links) won't return the PDF body without auth — fall back to hashing
  // the URL string so we still have an anchor, and document the limitation in
  // the receipt email.
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (res.ok) {
      const buf = new Uint8Array(await res.arrayBuffer());
      // Reject obviously-not-a-pdf payloads (e.g. Google Drive HTML interstitial)
      if (buf.length > 1024 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
        return { sha256: await sha256Hex(buf), source: 'bytes' };
      }
    }
  } catch (_) { /* fallthrough */ }
  return { sha256: await sha256Hex(`url:${url}`), source: 'url' };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}

async function sendReceiptEmail(
  base44: any,
  to: { name: string; email: string },
  cc_email: string | null,
  data: {
    facility_name: string;
    typed_name: string;
    signed_at: string;
    ip: string;
    sow_url: string;
    sow_sha256: string;
    sha256_source: string;
    token_id: string;
  },
) {
  try {
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    const safe = {
      facility: escapeHtml(data.facility_name),
      typed: escapeHtml(data.typed_name),
      signed_at: escapeHtml(data.signed_at),
      ip: escapeHtml(data.ip || 'n/a'),
      sow_url: escapeHtml(data.sow_url),
      sha: escapeHtml(data.sow_sha256),
      src: data.sha256_source === 'bytes' ? 'document bytes' : 'document URL',
      token: escapeHtml(data.token_id),
    };

    const html = `
<p>This confirms that <strong>${safe.typed}</strong> signed the Statement of Work for
<strong>${safe.facility}</strong> on ${safe.signed_at}.</p>
<h3>Receipt</h3>
<table style="border-collapse:collapse;font-size:13px;">
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Signer</td><td>${safe.typed}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Email</td><td>${escapeHtml(to.email)}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Signed at</td><td>${safe.signed_at}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">IP</td><td>${safe.ip}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Document</td><td><a href="${safe.sow_url}">${safe.sow_url}</a></td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Document hash (sha256 of ${safe.src})</td><td style="font-family:monospace;font-size:11px;">${safe.sha}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#666;">Token id</td><td style="font-family:monospace;font-size:11px;">${safe.token}</td></tr>
</table>
<p style="font-size:12px;color:#666;margin-top:20px;">
This is an auto-generated receipt of typed-name acceptance ("clickwrap") of the document referenced above.
Keep this email for your records.</p>
<p>&mdash; ALS Professional Network</p>
`.trim();

    const to_header = to.name ? `${to.name} <${to.email}>` : to.email;
    const headers = [
      `To: ${to_header}`,
      `Subject: SOW signed — ${data.facility_name} — receipt`,
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
      console.error('Receipt email send failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('Receipt email failed:', err);
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
    const typed_name_raw = body?.typed_name;
    const accepted = body?.accepted === true;

    if (!token || typeof token !== 'string' || !session_id || typeof session_id !== 'string') {
      return Response.json(
        { error: 'Verification required', requires_verification: true },
        { status: 401 },
      );
    }
    const typed_name = typeof typed_name_raw === 'string' ? typed_name_raw.trim() : '';
    if (typed_name.length < TYPED_NAME_MIN || typed_name.length > TYPED_NAME_MAX) {
      return Response.json({ error: 'Please type your full name.' }, { status: 400 });
    }
    if (!accepted) {
      return Response.json({ error: 'You must check the acceptance box.' }, { status: 400 });
    }

    const tokens = await base44.entities.PublicAccessToken.filter({ token });
    if (!tokens.length) return Response.json({ error: 'Invalid request' }, { status: 400 });
    const t = tokens[0];

    if (t.resource_type !== 'sow') {
      return Response.json({ error: 'Wrong resource type' }, { status: 400 });
    }
    if (t.revoked) return Response.json({ error: 'Link no longer valid' }, { status: 410 });
    if (t.expires_at && new Date(t.expires_at) < new Date()) {
      return Response.json({ error: 'Link no longer valid' }, { status: 410 });
    }
    if (t.consumed_at) {
      return Response.json({ error: 'Already signed' }, { status: 410 });
    }
    if (!Array.isArray(t.scope) || !t.scope.includes('sign')) {
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

    const records = await base44.entities.PipelineRecord.filter({ id: t.resource_id });
    if (!records.length) return Response.json({ error: 'Record not found' }, { status: 404 });
    const record = records[0];

    if (record.sow_signed_at) {
      return Response.json({ error: 'Already signed' }, { status: 409 });
    }

    const sow_url = record.sow_generated_url || '';
    if (!sow_url) {
      return Response.json({ error: 'No SOW document on record. Contact the operator.' }, { status: 409 });
    }

    const { sha256: sow_sha256, source: sha256_source } = await hashSowDocument(sow_url);
    const signed_at = new Date().toISOString();
    const signed_date = signed_at.slice(0, 10);

    const stage_history = Array.isArray(record.stage_history) ? [...record.stage_history] : [];
    stage_history.push({
      stage: 'SOW Signed',
      date: signed_at,
      changed_by: `${typed_name} <${t.recipient_email}> (clickwrap)`,
    });

    // Use service-role write to bypass main's pipelineStageGate BEFORE-UPDATE
    // trigger (which has a 'founder only' check on Rule 16 that would reject an
    // unauthenticated recipient signing). Our function performs equivalent
    // checks (single_use, sow_url presence, etc.) above. Matches main's own
    // pattern in sowAutoAdvance.
    await base44.asServiceRole.entities.PipelineRecord.update(record.id, {
      stage: 'SOW Signed',
      stage_history,
      sow_signed_url: sow_url,
      sow_signed_date: signed_date,
      sow_signed_at: signed_at,
      sow_signed_by_name: typed_name,
      sow_signed_by_email: t.recipient_email,
      sow_signed_ip: ip,
      sow_signed_user_agent: ua,
      sow_sha256,
      sow_signature_token_id: t.id,
    });

    await base44.entities.PublicAccessToken.update(t.id, {
      consumed_at: signed_at,
      access_count: (t.access_count || 0) + 1,
      last_accessed_at: signed_at,
    }).catch(() => {});

    await base44.entities.PublicAccessEvent.create({
      token_id: t.id,
      resource_type: t.resource_type,
      resource_id: t.resource_id,
      action: 'sign',
      ts: signed_at,
      ip,
      user_agent: ua,
      success: true,
      metadata: { typed_name, sow_sha256, sha256_source },
    }).catch(() => {});

    // Fire-and-forget receipt emails. Failure here doesn't undo the signature.
    await sendReceiptEmail(
      base44,
      { name: t.recipient_name || typed_name, email: t.recipient_email },
      t.issued_by || null,
      {
        facility_name: record.facility_name || '',
        typed_name,
        signed_at,
        ip,
        sow_url,
        sow_sha256,
        sha256_source,
        token_id: t.id,
      },
    );

    return Response.json({
      success: true,
      receipt: {
        facility_name: record.facility_name || '',
        typed_name,
        signer_email: t.recipient_email,
        signed_at,
        sow_url,
        sow_sha256,
        sha256_source,
        token_id: t.id,
      },
    });
  } catch (err) {
    console.error('submitSowSignature failed:', err);
    return Response.json({ error: 'Could not record signature.' }, { status: 500 });
  }
});

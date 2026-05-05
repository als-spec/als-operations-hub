import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

// Guarded upload from a client-portal token. Receives the file as a base64
// blob inside JSON (avoids multipart/form-data complexity in Deno serverless),
// enforces per-token quotas, uploads via service-role, registers a Document
// row, and flips the matching data_request item status to 'Received'.

const MAX_BYTES_PER_FILE = 25 * 1024 * 1024;     // 25 MB
const MAX_BYTES_PER_TOKEN = 250 * 1024 * 1024;   // 250 MB total
const MAX_FILES_PER_TOKEN = 25;
const MAX_UPLOADS_PER_HOUR = 10;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/png',
  'image/jpeg',
]);

function decodeBase64(b64: string): Uint8Array {
  // Strip any data URL prefix the client may have included.
  const clean = b64.includes(',') ? b64.split(',', 2)[1] : b64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function sanitizeFilename(name: string): string {
  // Keep alnum, dot, dash, underscore, space; cap length.
  const safe = (name || 'upload').replace(/[^A-Za-z0-9._\- ]/g, '_').slice(0, 200);
  return safe || 'upload';
}

Deno.serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || '';
  const ua = req.headers.get('user-agent') || '';

  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => null);
    const token = body?.token;
    const session_id = body?.session_id;
    const item_name_raw = body?.item_name;
    const file_name_raw = body?.file_name;
    const content_type = body?.content_type;
    const file_base64 = body?.file_base64;

    if (!token || typeof token !== 'string' || !session_id || typeof session_id !== 'string') {
      return Response.json(
        { error: 'Verification required', requires_verification: true },
        { status: 401 },
      );
    }
    if (typeof item_name_raw !== 'string' || !item_name_raw.trim()) {
      return Response.json({ error: 'item_name required' }, { status: 400 });
    }
    if (typeof file_name_raw !== 'string' || !file_name_raw.trim()) {
      return Response.json({ error: 'file_name required' }, { status: 400 });
    }
    if (typeof content_type !== 'string' || !ALLOWED_MIME.has(content_type)) {
      return Response.json(
        { error: 'Unsupported file type. Allowed: PDF, DOCX, XLSX, CSV, PNG, JPG, TXT.' },
        { status: 400 },
      );
    }
    if (typeof file_base64 !== 'string' || !file_base64) {
      return Response.json({ error: 'file_base64 required' }, { status: 400 });
    }

    const item_name = item_name_raw.trim();
    const file_name = sanitizeFilename(file_name_raw);

    let bytes: Uint8Array;
    try {
      bytes = decodeBase64(file_base64);
    } catch {
      return Response.json({ error: 'Invalid file encoding' }, { status: 400 });
    }
    if (bytes.length === 0) {
      return Response.json({ error: 'Empty file' }, { status: 400 });
    }
    if (bytes.length > MAX_BYTES_PER_FILE) {
      return Response.json(
        { error: `File exceeds ${MAX_BYTES_PER_FILE / (1024 * 1024)} MB limit.` },
        { status: 413 },
      );
    }

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
    if (!Array.isArray(t.scope) || !t.scope.includes('upload')) {
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

    // Per-token quota: count + size.
    const priorDocs = await base44.entities.Document.filter({ via_public_token_id: t.id });
    if (priorDocs.length >= MAX_FILES_PER_TOKEN) {
      return Response.json(
        { error: `Upload limit reached (${MAX_FILES_PER_TOKEN} files). Contact the operator.` },
        { status: 413 },
      );
    }
    const priorBytes = priorDocs.reduce(
      (s: number, d: any) => s + ((d.file_size_kb || 0) * 1024),
      0,
    );
    if (priorBytes + bytes.length > MAX_BYTES_PER_TOKEN) {
      return Response.json(
        { error: `Total upload size limit reached (${MAX_BYTES_PER_TOKEN / (1024 * 1024)} MB). Contact the operator.` },
        { status: 413 },
      );
    }

    // Per-hour rate limit, derived from prior upload events for this token.
    const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
    const events = await base44.entities.PublicAccessEvent.filter({
      token_id: t.id,
      action: 'upload',
    });
    const recentUploads = events.filter((e: any) => (e.ts || '') >= oneHourAgo);
    if (recentUploads.length >= MAX_UPLOADS_PER_HOUR) {
      await base44.entities.PublicAccessEvent.create({
        token_id: t.id,
        resource_type: t.resource_type,
        resource_id: t.resource_id,
        action: 'denied_rate_limit',
        ts: new Date().toISOString(),
        ip, user_agent: ua,
        success: false,
        metadata: { recent_uploads: recentUploads.length, item_name },
      }).catch(() => {});
      return Response.json(
        { error: 'Too many uploads in the last hour. Please wait and try again.' },
        { status: 429 },
      );
    }

    // Validate item_name against the engagement's data_requests.
    const engagements = await base44.entities.Engagement.filter({ id: t.resource_id });
    if (!engagements.length) {
      return Response.json({ error: 'Engagement not found' }, { status: 404 });
    }
    const engagement = engagements[0];
    const data_requests = Array.isArray(engagement.data_requests) ? engagement.data_requests : [];
    const matchIdx = data_requests.findIndex((d: any) => (d.item_name || '') === item_name);
    if (matchIdx < 0) {
      return Response.json({ error: 'Unknown data request item' }, { status: 400 });
    }

    // Upload via service-role.
    const blob = new Blob([bytes], { type: content_type });
    const file = new File([blob], file_name, { type: content_type });
    const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const file_url: string = uploadRes?.file_url || '';
    if (!file_url) {
      throw new Error('Upload returned no file_url');
    }

    const file_size_kb = Math.round(bytes.length / 1024);
    const now_iso = new Date().toISOString();

    await base44.entities.Document.create({
      name: file_name.replace(/\.[^/.]+$/, ''),
      category: 'Client Submitted',
      description: `Submitted via client portal for: ${item_name}`,
      linked_record_id: t.resource_id,
      linked_record_type: 'engagement',
      linked_record_name: engagement.facility_name || '',
      file_url,
      file_name,
      file_size_kb,
      uploaded_by: t.recipient_email,
      via_public_token_id: t.id,
      data_request_item_name: item_name,
      last_updated_date: now_iso.slice(0, 10),
    });

    // Flip the matching data_request item to 'Received'.
    const updated = data_requests.map((d: any, i: number) =>
      i === matchIdx ? { ...d, status: 'Received' } : d,
    );
    await base44.entities.Engagement.update(engagement.id, { data_requests: updated });

    await base44.entities.PublicAccessToken.update(t.id, {
      access_count: (t.access_count || 0) + 1,
      last_accessed_at: now_iso,
    }).catch(() => {});

    await base44.entities.PublicAccessEvent.create({
      token_id: t.id,
      resource_type: t.resource_type,
      resource_id: t.resource_id,
      action: 'upload',
      ts: now_iso,
      ip, user_agent: ua,
      success: true,
      metadata: { item_name, file_name, file_size_kb, content_type },
    }).catch(() => {});

    return Response.json({ success: true, file_size_kb, file_name, item_name });
  } catch (err) {
    console.error('clientPortalUpload failed:', err);
    return Response.json({ error: 'Upload failed.' }, { status: 500 });
  }
});

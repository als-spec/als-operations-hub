import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity, Eye, Mail, ShieldCheck, ShieldAlert, FileSignature, Upload,
  CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, format, parseISO } from 'date-fns';

// Lightweight activity feed. Reads PublicAccessEvent rows for tokens linked
// to this resource and renders the most recent N. Founder/admin only — the
// caller is responsible for the role gate.

const ACTION_DISPLAY = {
  view:                  { icon: Eye,           tone: 'text-muted-foreground', label: 'Viewed link' },
  verify_request:        { icon: Mail,          tone: 'text-primary',          label: 'Requested verification code' },
  verify_success:        { icon: ShieldCheck,   tone: 'text-success',          label: 'Verified' },
  verify_failure:        { icon: ShieldAlert,   tone: 'text-warning',          label: 'Verification failed' },
  sign:                  { icon: FileSignature, tone: 'text-success',          label: 'Signed' },
  upload:                { icon: Upload,        tone: 'text-primary',          label: 'Uploaded file' },
  acknowledge:           { icon: CheckCircle2,  tone: 'text-success',          label: 'Acknowledged findings' },
  denied_expired:        { icon: AlertTriangle, tone: 'text-warning',          label: 'Denied — expired' },
  denied_revoked:        { icon: AlertTriangle, tone: 'text-warning',          label: 'Denied — revoked' },
  denied_invalid:        { icon: AlertTriangle, tone: 'text-warning',          label: 'Denied — invalid' },
  denied_consumed:       { icon: AlertTriangle, tone: 'text-warning',          label: 'Denied — already used' },
  denied_scope:          { icon: AlertTriangle, tone: 'text-warning',          label: 'Denied — scope' },
  denied_email_mismatch: { icon: AlertTriangle, tone: 'text-warning',          label: 'Denied — email mismatch' },
  denied_rate_limit:     { icon: AlertTriangle, tone: 'text-destructive',      label: 'Rate limited' },
};

function relativeTime(iso) {
  if (!iso) return '';
  try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }); } catch { return iso; }
}
function fullTime(iso) {
  if (!iso) return '';
  try { return format(parseISO(iso), 'MMM d, yyyy h:mm:ss a'); } catch { return iso; }
}

function describeMetadata(action, meta) {
  if (!meta || typeof meta !== 'object') return '';
  if (action === 'sign' && meta.typed_name) return ` · "${meta.typed_name}"`;
  if (action === 'upload' && meta.file_name) return ` · ${meta.file_name}${meta.item_name ? ` (${meta.item_name})` : ''}`;
  if (action === 'acknowledge' && meta.has_notes) return ` · with comments`;
  if (action === 'denied_rate_limit') {
    if (typeof meta.recent_codes === 'number') return ` · ${meta.recent_codes} codes recently`;
    if (typeof meta.recent_uploads === 'number') return ` · ${meta.recent_uploads} uploads recently`;
  }
  if (action === 'verify_failure' && typeof meta.attempts === 'number') return ` · attempt ${meta.attempts}`;
  return '';
}

export default function PublicLinkActivity({ resourceType, resourceId, limit = 25 }) {
  const queryKey = ['public-access-events', resourceType, resourceId];
  const { data: events = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => base44.entities.PublicAccessEvent.filter(
      { resource_type: resourceType, resource_id: resourceId },
      '-ts',
      limit,
    ),
    enabled: !!resourceId,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4" /> Public Link Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No public access yet.</p>
        ) : (
          <div className="space-y-1.5">
            {events.map((e) => {
              const display = ACTION_DISPLAY[e.action] || {
                icon: Activity, tone: 'text-muted-foreground', label: e.action || 'event',
              };
              const Icon = display.icon;
              return (
                <div
                  key={e.id}
                  className="flex items-start gap-2 p-2 rounded-md bg-secondary/30"
                  title={fullTime(e.ts)}
                >
                  <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${display.tone}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-medium">{display.label}</span>
                      <span className="text-muted-foreground">{describeMetadata(e.action, e.metadata)}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {relativeTime(e.ts)}
                      {e.ip ? ` · ${e.ip}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

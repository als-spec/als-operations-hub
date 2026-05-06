import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Loader2, ExternalLink, Calendar, User, Briefcase, FileCheck,
  CheckCircle2, Clock, FileText, BarChart3, Map, ChevronRight, Upload, ShieldCheck,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO } from 'date-fns';
import EmailVerificationGate from '@/components/public/EmailVerificationGate';
import PublicLinkExpired from '@/pages/public/PublicLinkExpired';
import { usePublicTokenSession } from '@/hooks/usePublicTokenSession';
import { safeHref } from '@/lib/utils';
import {
  callGuardedPublicFunction,
  clearSessionId,
  PublicFunctionError,
} from '@/api/publicClient';

export default function ClientPortal() {
  const { token } = useParams();
  const session = usePublicTokenSession(token);

  if (session.loading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  if (!session.valid) return <PublicLinkExpired />;
  if (!session.verified) {
    return (
      <EmailVerificationGate
        token={token}
        recipientHint={session.recipientHint}
        resourceType="portal"
        onVerified={() => session.markVerified()}
      />
    );
  }
  return <PortalContent token={token} />;
}

function fmtDate(value, pattern = 'MMM d, yyyy') {
  if (!value) return null;
  try { return format(parseISO(value), pattern); } catch { return value; }
}

function PortalContent({ token }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['client-portal', token],
    queryFn: () => callGuardedPublicFunction('getClientPortalView', token),
    retry: false,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    if (error instanceof PublicFunctionError && error.body?.requires_verification) {
      clearSessionId(token);
      window.location.reload();
      return null;
    }
    return <PublicLinkExpired />;
  }

  const e = data?.engagement || {};

  return (
    <div className="space-y-4">
      <OverviewCard engagement={e} />
      <ProgressCard milestones={e.milestones || []} />
      <DataRequestsCard
        items={e.data_requests || []}
        canUpload={!!data?.can_upload}
        token={token}
      />
      <DeliverablesCard items={e.deliverables || []} />
      {e.findings_delivered && (
        <FindingsCard
          engagement={e}
          canAcknowledge={!!data?.can_acknowledge}
          token={token}
        />
      )}
      <SowReferenceCard engagement={e} />
    </div>
  );
}

function OverviewCard({ engagement }) {
  const e = engagement;
  const statusTone = e.status === 'Active'
    ? 'bg-primary/10 text-primary'
    : e.status === 'Complete'
      ? 'bg-success/10 text-success'
      : 'bg-secondary text-secondary-foreground';

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">{e.facility_name || 'Engagement'}</h1>
            <p className="text-xs text-muted-foreground">Engagement portal</p>
          </div>
          {e.status && <Badge className={statusTone}>{e.status}</Badge>}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-t border-border pt-3">
          {e.kickoff_date && (
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Kickoff
              </dt>
              <dd className="font-medium">{fmtDate(e.kickoff_date)}</dd>
            </div>
          )}
          {e.delivery_target && (
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Delivery target
              </dt>
              <dd className="font-medium">{fmtDate(e.delivery_target)}</dd>
            </div>
          )}
          {e.on_site_date && (
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> On-site
              </dt>
              <dd className="font-medium">{fmtDate(e.on_site_date)}</dd>
            </div>
          )}
          {e.operator_name && (
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> Operator
              </dt>
              <dd className="font-medium">{e.operator_name}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

function ProgressCard({ milestones }) {
  if (!milestones.length) return null;
  const completed = milestones.filter((m) => m.completed).length;
  const pct = Math.round((completed / milestones.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Progress
          </CardTitle>
          <span className="text-xs text-muted-foreground">{completed}/{milestones.length} complete</span>
        </div>
        <Progress value={pct} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="space-y-1.5">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30">
            {m.completed ? (
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className={`text-sm flex-1 ${m.completed ? 'text-muted-foreground' : 'font-medium'}`}>
              {m.type || '—'}
            </span>
            {m.completed_date && (
              <span className="text-[10px] text-muted-foreground">{fmtDate(m.completed_date, 'MMM d')}</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const DATA_STATUS_TONE = {
  'Not Requested': 'bg-secondary text-secondary-foreground',
  'Requested': 'bg-primary/10 text-primary',
  'Received': 'bg-success/10 text-success',
  'Incomplete': 'bg-warning/10 text-warning',
};

const ACCEPT_ATTR = '.pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg,.txt';
const MAX_BYTES = 25 * 1024 * 1024;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const idx = typeof dataUrl === 'string' ? dataUrl.indexOf(',') : -1;
      resolve(idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl);
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function DataRequestsCard({ items, canUpload, token }) {
  if (!items.length) return null;
  const received = items.filter((d) => d.status === 'Received').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileCheck className="w-4 h-4" /> Data Requests
          </CardTitle>
          <span className="text-xs text-muted-foreground">{received}/{items.length} received</span>
        </div>
        {canUpload && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Click <strong>Upload</strong> on any row to submit a file. PDF / DOCX / XLSX / CSV / PNG / JPG, up to 25 MB each.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((d, i) => (
          <DataRequestRow
            key={`${d.item_name || i}-${i}`}
            item={d}
            canUpload={canUpload}
            token={token}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function DataRequestRow({ item, canUpload, token }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [error, setError] = useState('');

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const file_base64 = await fileToBase64(file);
      return callGuardedPublicFunction('clientPortalUpload', token, {
        item_name: item.item_name,
        file_name: file.name,
        content_type: file.type || 'application/octet-stream',
        file_base64,
      });
    },
    onSuccess: () => {
      setError('');
      qc.invalidateQueries({ queryKey: ['client-portal', token] });
    },
    onError: (err) => {
      setError(err?.message || 'Upload failed.');
    },
  });

  const onPick = () => {
    setError('');
    fileRef.current?.click();
  };
  const onChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError(`File exceeds ${MAX_BYTES / (1024 * 1024)} MB.`);
      return;
    }
    uploadMutation.mutate(file);
  };

  const showUpload =
    canUpload && item.status !== 'Received' && !!item.item_name;

  return (
    <div className="p-2 rounded-md bg-secondary/30 space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{item.item_name || '—'}</p>
          {item.due_date && (
            <p className="text-[10px] text-muted-foreground">due {fmtDate(item.due_date, 'MMM d')}</p>
          )}
        </div>
        <Badge
          className={`text-[10px] ${DATA_STATUS_TONE[item.status] || DATA_STATUS_TONE['Not Requested']}`}
        >
          {item.status || 'Not Requested'}
        </Badge>
        {showUpload && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              disabled={uploadMutation.isPending}
              onClick={onPick}
            >
              {uploadMutation.isPending ? (
                <><Loader2 className="w-3 h-3 animate-spin" />Uploading&hellip;</>
              ) : (
                <><Upload className="w-3 h-3" />Upload</>
              )}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT_ATTR}
              onChange={onChange}
              className="hidden"
            />
          </>
        )}
      </div>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

const DELIVERABLE_TONE = {
  'Complete': 'bg-success/10 text-success',
  'In Progress': 'bg-primary/10 text-primary',
  'Not Started': 'bg-secondary text-secondary-foreground',
};

function DeliverablesCard({ items }) {
  if (!items.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4" /> Deliverables
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-md bg-secondary/30">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{d.name || '—'}</p>
              {d.delivery_date && (
                <p className="text-[10px] text-muted-foreground">delivered {fmtDate(d.delivery_date, 'MMM d')}</p>
              )}
            </div>
            <Badge className={`text-[10px] ${DELIVERABLE_TONE[d.status] || DELIVERABLE_TONE['Not Started']}`}>
              {d.status || 'Not Started'}
            </Badge>
            {d.file_url && d.status === 'Complete' && (
              <a
                href={safeHref(d.file_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FindingsCard({ engagement, canAcknowledge, token }) {
  const e = engagement;
  const items = [
    { label: 'Findings deck', url: e.findings_deck_url, date: e.findings_deck_delivered_date, icon: FileText },
    { label: 'Analytics dashboard', url: e.dashboard_url, date: e.dashboard_delivered_date, icon: BarChart3 },
    { label: '90-day roadmap', url: e.roadmap_url, date: e.roadmap_delivered_date, icon: Map },
  ].filter((it) => it.url);

  if (!items.length) return null;

  return (
    <Card className="border-success/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" /> Findings Delivered
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          {items.map(({ label, url, date, icon: Icon }) => (
            <a
              key={label}
              href={safeHref(url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 p-2.5 rounded-md bg-secondary/30 hover:bg-secondary/60 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium truncate">{label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {date && <span className="text-[10px] text-muted-foreground">{fmtDate(date, 'MMM d')}</span>}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </a>
          ))}
        </div>

        <FindingsAcknowledgment
          engagement={e}
          canAcknowledge={canAcknowledge}
          token={token}
        />
      </CardContent>
    </Card>
  );
}

function FindingsAcknowledgment({ engagement, canAcknowledge, token }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const ackMutation = useMutation({
    mutationFn: (payload) => callGuardedPublicFunction('acknowledgeFindings', token, payload),
    onSuccess: () => {
      setError('');
      setExpanded(false);
      qc.invalidateQueries({ queryKey: ['client-portal', token] });
    },
    onError: (err) => {
      // 409 = already acknowledged. Refetch so the UI flips to the receipt state.
      if (err?.status === 409) {
        qc.invalidateQueries({ queryKey: ['client-portal', token] });
        return;
      }
      setError(err?.message || 'Could not record acknowledgment.');
    },
  });

  if (engagement.findings_acknowledged_at) {
    return (
      <div className="border-t border-border pt-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-success" />
          <p className="text-sm">
            <span className="font-medium">Findings acknowledged</span>
            {engagement.findings_acknowledged_by_name && (
              <> by {engagement.findings_acknowledged_by_name}</>
            )}
            <span className="text-xs text-muted-foreground">
              {' '}on {fmtDate(engagement.findings_acknowledged_at, 'PPp')}
            </span>
          </p>
        </div>
        {engagement.findings_acknowledgment_notes && (
          <blockquote className="text-xs text-muted-foreground border-l-2 border-border pl-3 ml-6 whitespace-pre-wrap">
            {engagement.findings_acknowledgment_notes}
          </blockquote>
        )}
      </div>
    );
  }

  if (!canAcknowledge) return null;

  if (!expanded) {
    return (
      <div className="border-t border-border pt-3">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setExpanded(true)}
        >
          <ShieldCheck className="w-4 h-4" /> Acknowledge findings
        </Button>
      </div>
    );
  }

  return (
    <form
      className="border-t border-border pt-3 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!accepted) {
          setError('Please confirm by checking the box.');
          return;
        }
        setError('');
        ackMutation.mutate({ accepted: true, notes });
      }}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          id="ack"
          checked={accepted}
          onCheckedChange={(v) => setAccepted(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="ack" className="text-sm leading-snug cursor-pointer">
          I have reviewed the findings deliverables for{' '}
          <span className="font-medium">{engagement.facility_name || 'this engagement'}</span>{' '}
          and acknowledge receipt on behalf of the facility.
        </Label>
      </div>
      <div>
        <Label htmlFor="ack-notes" className="text-xs">Comments (optional)</Label>
        <Textarea
          id="ack-notes"
          rows={3}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything you want to flag for the operator…"
          className="mt-1 text-sm"
        />
        <p className="text-[10px] text-muted-foreground mt-1">{notes.length}/2000</p>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => { setExpanded(false); setAccepted(false); setNotes(''); setError(''); }}
          disabled={ackMutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={ackMutation.isPending || !accepted} className="gap-2">
          {ackMutation.isPending ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" />Submitting&hellip;</>
          ) : 'Submit acknowledgment'}
        </Button>
      </div>
    </form>
  );
}

function SowReferenceCard({ engagement }) {
  const e = engagement;
  if (!e.sow_signed_url && !e.sow_signed_date) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FileCheck className="w-4 h-4" /> Signed SOW
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {e.sow_signed_by_name && (
          <p>
            <span className="text-muted-foreground text-xs">Signed by </span>
            <span className="font-medium">{e.sow_signed_by_name}</span>
            {e.sow_signed_at && (
              <span className="text-xs text-muted-foreground"> on {fmtDate(e.sow_signed_at, 'PPp')}</span>
            )}
          </p>
        )}
        {e.sow_signed_url && (
          <a
            href={safeHref(e.sow_signed_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" /> Open signed SOW
          </a>
        )}
      </CardContent>
    </Card>
  );
}

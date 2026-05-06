import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Link2, Copy, Check, Trash2, Plus, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import IssueLinkDialog from '@/components/sharing/IssueLinkDialog';

const RESOURCE_LABELS = {
  sow: { title: 'SOW Review Link', cta: 'Issue SOW Review Link' },
  portal: { title: 'Client Portal Link', cta: 'Issue Portal Link' },
};

function buildPublicUrl(public_path) {
  const base = (appParams.appBaseUrl || window.location.origin).replace(/\/$/, '');
  return `${base}${public_path}`;
}

function tokenStatus(t) {
  if (t.revoked) return { label: 'Revoked', tone: 'bg-secondary text-secondary-foreground' };
  if (t.consumed_at) return { label: 'Used', tone: 'bg-success/10 text-success' };
  if (t.expires_at && new Date(t.expires_at) < new Date()) {
    return { label: 'Expired', tone: 'bg-destructive/10 text-destructive' };
  }
  return { label: 'Active', tone: 'bg-primary/10 text-primary' };
}

function CopyButton({ url }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail in non-secure contexts; fall back to selection prompt.
      window.prompt('Copy link:', url);
    }
  };
  return (
    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onCopy}>
      {copied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
    </Button>
  );
}

export default function PublicLinkPanel({
  resourceType,
  resourceId,
  defaultRecipientEmail = '',
  defaultRecipientName = '',
  disabled = false,
  disabledReason = '',
}) {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [latestIssued, setLatestIssued] = useState(null); // { token_id, full_url } shown briefly after issue

  const queryKey = ['public-tokens', resourceType, resourceId];

  const { data: tokens = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => base44.entities.PublicAccessToken.filter({
      resource_type: resourceType,
      resource_id: resourceId,
    }),
    enabled: !!resourceId,
  });

  const issueMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('issuePublicToken', payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey });
      if (data?.public_path) {
        setLatestIssued({ token_id: data.token_id, full_url: buildPublicUrl(data.public_url || data.public_path) });
      }
      setShowDialog(false);
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (token_id) => base44.functions.invoke('revokePublicToken', { token_id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setRevokingId(null);
    },
  });

  const sortedTokens = [...tokens].sort((a, b) =>
    new Date(b.issued_at || 0) - new Date(a.issued_at || 0)
  );
  const activeTokens = sortedTokens.filter(t => !t.revoked && !t.consumed_at &&
    (!t.expires_at || new Date(t.expires_at) > new Date()));
  const inactiveTokens = sortedTokens.filter(t => !activeTokens.includes(t));

  const labels = RESOURCE_LABELS[resourceType] || RESOURCE_LABELS.portal;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Link2 className="w-4 h-4" /> {labels.title}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setShowDialog(true)}
            disabled={disabled}
            title={disabled ? disabledReason : ''}
          >
            <Plus className="w-3 h-3" /> New Link
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {disabled && (
          <p className="text-xs text-muted-foreground italic">{disabledReason}</p>
        )}

        {latestIssued && (
          <div className="p-2.5 rounded-md border border-success/30 bg-success/5 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-success">Link issued</p>
            <p className="text-xs break-all font-mono">{latestIssued.full_url}</p>
            <div className="flex gap-2">
              <CopyButton url={latestIssued.full_url} />
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setLatestIssued(null)}>
                Dismiss
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Recipient must verify their email before they can {resourceType === 'sow' ? 'review or sign' : 'access the portal'}.
            </p>
          </div>
        )}

        {issueMutation.isError && (
          <p className="text-xs text-destructive">
            {issueMutation.error?.response?.data?.error || 'Failed to issue link.'}
          </p>
        )}
        {revokeMutation.isError && (
          <p className="text-xs text-destructive">
            {revokeMutation.error?.response?.data?.error || 'Failed to revoke link.'}
          </p>
        )}

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : activeTokens.length === 0 && inactiveTokens.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No links issued yet.</p>
        ) : (
          <>
            {activeTokens.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active</p>
                {activeTokens.map(t => (
                  <TokenRow
                    key={t.id}
                    token={t}
                    onCopy={buildPublicUrl(t.public_url || `/p/${t.resource_type}/${t.token}`)}
                    onRevoke={() => setRevokingId(t.id)}
                  />
                ))}
              </div>
            )}
            {inactiveTokens.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  History ({inactiveTokens.length})
                </summary>
                <div className="space-y-2 mt-2">
                  {inactiveTokens.map(t => (
                    <TokenRow key={t.id} token={t} historical />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </CardContent>

      {showDialog && (
        <IssueLinkDialog
          resourceType={resourceType}
          defaultRecipientEmail={defaultRecipientEmail}
          defaultRecipientName={defaultRecipientName}
          submitting={issueMutation.isPending}
          onCancel={() => setShowDialog(false)}
          onSubmit={(payload) => issueMutation.mutate({
            resource_type: resourceType,
            resource_id: resourceId,
            ...payload,
          })}
        />
      )}

      <AlertDialog open={!!revokingId} onOpenChange={(open) => !open && setRevokingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this link?</AlertDialogTitle>
            <AlertDialogDescription>
              The recipient will no longer be able to access this resource. Issuing a new link to the
              same recipient also revokes the prior one automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={revokeMutation.isPending}
              onClick={() => revokeMutation.mutate(revokingId)}
            >
              {revokeMutation.isPending ? 'Revoking…' : 'Revoke'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function TokenRow({ token, onCopy, onRevoke, historical = false }) {
  const status = tokenStatus(token);
  const expiresIn = token.expires_at
    ? Math.max(0, Math.ceil((new Date(token.expires_at) - new Date()) / 86400000))
    : null;

  return (
    <div className="p-2.5 rounded-md bg-secondary/30 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium truncate">{token.recipient_name || token.recipient_email}</p>
          {token.recipient_name && (
            <p className="text-[10px] text-muted-foreground truncate">{token.recipient_email}</p>
          )}
        </div>
        <Badge className={`text-[10px] ${status.tone}`}>{status.label}</Badge>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        {expiresIn !== null && !historical && (
          <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />
            {expiresIn === 0 ? 'expires today' : `${expiresIn}d left`}
          </span>
        )}
        {token.access_count > 0 && (
          <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" />{token.access_count} view{token.access_count !== 1 ? 's' : ''}</span>
        )}
        {historical && token.consumed_at && (
          <span>used {format(new Date(token.consumed_at), 'MMM d')}</span>
        )}
        {historical && token.revoked_at && !token.consumed_at && (
          <span>revoked {format(new Date(token.revoked_at), 'MMM d')}</span>
        )}
      </div>
      {!historical && onCopy && (
        <div className="flex gap-1 -ml-2">
          <CopyButton url={onCopy} />
          {onRevoke && (
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive" onClick={onRevoke}>
              <Trash2 className="w-3 h-3" /> Revoke
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

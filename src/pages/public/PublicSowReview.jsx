import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import EmailVerificationGate from '@/components/public/EmailVerificationGate';
import PublicLinkExpired from '@/pages/public/PublicLinkExpired';
import { usePublicTokenSession } from '@/hooks/usePublicTokenSession';
import {
  callGuardedPublicFunction,
  clearSessionId,
  PublicFunctionError,
} from '@/api/publicClient';

export default function PublicSowReview() {
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
        resourceType="sow"
        onVerified={() => session.markVerified()}
      />
    );
  }

  return <SowReviewContent token={token} />;
}

function formatTimestamp(iso) {
  if (!iso) return '';
  try { return format(parseISO(iso), 'PPpp'); } catch { return iso; }
}

function SowReviewContent({ token }) {
  const [receipt, setReceipt] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['sow-review', token],
    queryFn: () => callGuardedPublicFunction('getSowForReview', token),
    retry: false,
  });

  const signMutation = useMutation({
    mutationFn: (payload) => callGuardedPublicFunction('submitSowSignature', token, payload),
    onSuccess: (res) => {
      if (res?.receipt) setReceipt(res.receipt);
    },
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
      // Stale verification; bounce back to gate.
      clearSessionId(token);
      window.location.reload();
      return null;
    }
    return <PublicLinkExpired />;
  }

  if (receipt) {
    return <SignedConfirmation receipt={receipt} />;
  }

  if (data?.already_signed) {
    return <SignedConfirmation receipt={{
      facility_name: data?.record?.facility_name || '',
      typed_name: data?.record?.sow_signed_by_name || '',
      signer_email: data?.recipient_email || '',
      signed_at: data?.record?.sow_signed_at || '',
      sow_url: data?.record?.sow_signed_url || '',
      sow_sha256: '',
      sha256_source: '',
      token_id: '',
    }} previouslySigned />;
  }

  return (
    <ReviewAndSignForm
      data={data}
      submitting={signMutation.isPending}
      error={signMutation.error?.message}
      onSubmit={(payload) => signMutation.mutate(payload)}
      onRefetch={refetch}
    />
  );
}

function ReviewAndSignForm({ data, submitting, error, onSubmit }) {
  const r = data?.record || {};
  const [typedName, setTypedName] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [touched, setTouched] = useState(false);

  const nameValid = typedName.trim().length >= 2;
  const canSubmit = nameValid && accepted && data?.can_sign && !submitting;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({ typed_name: typedName.trim(), accepted: true });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Statement of Work — {r.facility_name || 'Review'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Facility</dt>
              <dd className="font-medium">{r.facility_name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Administrator</dt>
              <dd className="font-medium">{r.admin_name || '—'}</dd>
            </div>
            {r.proposed_fee != null && (
              <div>
                <dt className="text-xs text-muted-foreground">Proposed fee</dt>
                <dd className="font-medium">${Number(r.proposed_fee).toLocaleString()}</dd>
              </div>
            )}
            {r.proposed_kickoff_window && (
              <div>
                <dt className="text-xs text-muted-foreground">Kickoff window</dt>
                <dd className="font-medium">{r.proposed_kickoff_window}</dd>
              </div>
            )}
            {r.sow_generated_date && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">SOW dated</dt>
                <dd className="font-medium">{r.sow_generated_date}</dd>
              </div>
            )}
          </dl>

          {r.sow_generated_url ? (
            <a
              href={r.sow_generated_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-4 h-4" /> Open SOW PDF
            </a>
          ) : (
            <p className="text-xs text-warning">
              No SOW document is attached to this record. Please contact the operator.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Acceptance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="typed_name" className="text-xs">Type your full name *</Label>
              <Input
                id="typed_name"
                className="mt-1"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="e.g. Jane A. Smith"
                autoComplete="name"
              />
              {touched && !nameValid && (
                <p className="text-[11px] text-destructive mt-1">Please type your full name.</p>
              )}
            </div>
            <div className="flex items-start gap-2">
              <Checkbox
                id="accept"
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="accept" className="text-sm leading-snug cursor-pointer">
                I have read the Statement of Work for{' '}
                <span className="font-medium">{r.facility_name || 'this facility'}</span> and agree
                to its terms on behalf of the facility. I understand my typed name and the
                timestamp of this submission constitute my electronic signature.
              </Label>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {!data?.can_sign && (
              <p className="text-xs text-warning">
                This link is read-only. Contact the operator if you need a new signing link.
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={!canSubmit} className="gap-2">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Recording signature&hellip;</>
                ) : 'Sign SOW'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SignedConfirmation({ receipt, previouslySigned = false }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <h1 className="text-base font-semibold">
              {previouslySigned ? 'This SOW has been signed.' : 'Signature recorded. Thank you.'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {previouslySigned
                ? 'A receipt was emailed at signing time. Keep it for your records.'
                : 'A receipt has been emailed to you. Keep it for your records.'}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Receipt
          </p>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-1.5 text-xs">
            <dt className="text-muted-foreground">Facility</dt>
            <dd>{receipt.facility_name || '—'}</dd>
            <dt className="text-muted-foreground">Signer</dt>
            <dd>{receipt.typed_name || '—'}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{receipt.signer_email || '—'}</dd>
            <dt className="text-muted-foreground">Signed at</dt>
            <dd>{formatTimestamp(receipt.signed_at)}</dd>
            {receipt.sow_url && (
              <>
                <dt className="text-muted-foreground">Document</dt>
                <dd className="break-all">
                  <a
                    href={receipt.sow_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {receipt.sow_url}
                  </a>
                </dd>
              </>
            )}
            {receipt.sow_sha256 && (
              <>
                <dt className="text-muted-foreground">Doc hash</dt>
                <dd className="font-mono text-[10px] break-all">
                  {receipt.sow_sha256}
                  {receipt.sha256_source && (
                    <span className="text-muted-foreground"> ({receipt.sha256_source})</span>
                  )}
                </dd>
              </>
            )}
            {receipt.token_id && (
              <>
                <dt className="text-muted-foreground">Token</dt>
                <dd className="font-mono text-[10px] break-all">{receipt.token_id}</dd>
              </>
            )}
          </dl>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { callPublicFunction, setSessionId } from '@/api/publicClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ShieldCheck, Loader2 } from 'lucide-react';

const RESOURCE_LABELS = {
  sow: 'the SOW',
  portal: 'the client portal',
};

export default function EmailVerificationGate({ token, recipientHint, resourceType, onVerified }) {
  const [stage, setStage] = useState('request');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const handleSendCode = async () => {
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const res = await callPublicFunction('sendVerificationCode', { token });
      setStage('enter-code');
      setInfo(`Code sent to ${res?.sent_to_hint || recipientHint}.`);
      setResendIn(60);
    } catch (err) {
      setError(err.message || 'Could not send code.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await callPublicFunction('verifyCode', { token, code: code.trim() });
      if (res?.session_id) {
        setSessionId(token, res.session_id);
        onVerified?.({ email: res.verified_email });
      } else {
        setError('Verification failed.');
      }
    } catch (err) {
      setError(err.message || 'Invalid code.');
    } finally {
      setBusy(false);
    }
  };

  const label = RESOURCE_LABELS[resourceType] || 'this resource';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Verify your email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stage === 'request' ? (
          <>
            <p className="text-sm text-muted-foreground">
              To access {label}, we&apos;ll send a 6-digit verification code to{' '}
              <span className="font-medium text-foreground">{recipientHint}</span>.
            </p>
            <Button onClick={handleSendCode} disabled={busy} className="w-full gap-2">
              {busy ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Sending&hellip;</>
              ) : (
                <><Mail className="w-4 h-4" />Send code</>
              )}
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-[11px] text-muted-foreground">
              If this email isn&apos;t yours, please disregard the link.
            </p>
          </>
        ) : (
          <form onSubmit={handleVerify} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to your email. The code expires in 15 minutes.
            </p>
            {info && <p className="text-xs text-success">{info}</p>}
            <div>
              <Label htmlFor="vcode" className="text-xs">Verification code</Label>
              <Input
                id="vcode"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                className="mt-1 text-lg tracking-[0.5em] font-mono text-center"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
                autoComplete="one-time-code"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" disabled={busy || code.length !== 6} className="w-full gap-2">
              {busy ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Verifying&hellip;</>
              ) : 'Verify'}
            </Button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => { setStage('request'); setCode(''); setError(''); setInfo(''); }}
              >
                &larr; Start over
              </button>
              <button
                type="button"
                className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                onClick={handleSendCode}
                disabled={busy || resendIn > 0}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

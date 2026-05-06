import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TYPE_COPY = {
  sow: {
    title: 'Issue SOW Review Link',
    description: 'Recipient will be emailed a 6-digit code to verify their address before they can review or sign. Single-use: signing consumes the link.',
    defaultDays: 14,
    maxDays: 30,
  },
  portal: {
    title: 'Issue Client Portal Link',
    description: 'Recipient will be emailed a 6-digit code to verify their address. They can revisit until the link expires or is revoked.',
    defaultDays: 90,
    maxDays: 365,
  },
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function IssueLinkDialog({
  resourceType,
  defaultRecipientEmail = '',
  defaultRecipientName = '',
  submitting = false,
  onCancel,
  onSubmit,
}) {
  const copy = TYPE_COPY[resourceType] || TYPE_COPY.portal;
  const [email, setEmail] = useState(defaultRecipientEmail);
  const [name, setName] = useState(defaultRecipientName);
  const [days, setDays] = useState(copy.defaultDays);
  const [touched, setTouched] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const daysValid = Number.isFinite(Number(days)) && Number(days) >= 1 && Number(days) <= copy.maxDays;
  const canSubmit = emailValid && daysValid && !submitting;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      recipient_email: email.trim(),
      recipient_name: name.trim(),
      expires_in_days: Number(days),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Recipient email *</Label>
              <Input
                type="email"
                className="mt-1 h-8 text-sm"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="admin@facility.com"
                autoFocus
              />
              {touched && !emailValid && (
                <p className="text-[11px] text-destructive mt-1">Enter a valid email address.</p>
              )}
            </div>
            <div>
              <Label className="text-xs">Recipient name</Label>
              <Input
                className="mt-1 h-8 text-sm"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Dr. Jane Smith"
              />
            </div>
            <div>
              <Label className="text-xs">Expires in (days) *</Label>
              <Input
                type="number"
                min="1"
                max={copy.maxDays}
                className="mt-1 h-8 text-sm"
                value={days}
                onChange={e => setDays(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Default {copy.defaultDays}d, max {copy.maxDays}d.
              </p>
              {touched && !daysValid && (
                <p className="text-[11px] text-destructive mt-1">Must be between 1 and {copy.maxDays}.</p>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
              Issuing replaces any prior unused link to the same recipient.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? 'Issuing…' : 'Issue Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

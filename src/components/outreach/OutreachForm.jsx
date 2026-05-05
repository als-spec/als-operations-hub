import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

export default function OutreachForm({ prospects, onClose, onSaved }) {
  const [form, setForm] = useState({
    prospect_id: '', facility_name: '', channel: 'Email',
    template_used: '', subject_line: '', sent_date: new Date().toISOString().split('T')[0],
    status: 'Sent', touch_number: '', next_follow_up_date: '', notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleProspectSelect = (pid) => {
    const p = prospects.find(x => x.id === pid);
    set('prospect_id', pid);
    if (p) set('facility_name', p.facility_name);
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OutreachSequence.create(data),
    onSuccess: onSaved,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, touch_number: parseInt(form.touch_number) || 1 });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Log Outreach Touch</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Prospect *</Label>
              <Select value={form.prospect_id} onValueChange={handleProspectSelect} required>
                <SelectTrigger><SelectValue placeholder="Select prospect…" /></SelectTrigger>
                <SelectContent>
                  {prospects.map(p => <SelectItem key={p.id} value={p.id}>{p.facility_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={v => set('channel', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="Mail">Mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Touch #</Label>
                <Input type="number" min="1" value={form.touch_number} onChange={e => set('touch_number', e.target.value)} placeholder="1" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Subject / Template</Label>
              <Input value={form.subject_line} onChange={e => set('subject_line', e.target.value)} placeholder="Subject line or template name…" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sent Date *</Label>
                <Input type="date" value={form.sent_date} onChange={e => set('sent_date', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Opened">Opened</SelectItem>
                    <SelectItem value="Replied">Replied</SelectItem>
                    <SelectItem value="No Response">No Response</SelectItem>
                    <SelectItem value="Bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Next Follow-up Date</Label>
              <Input type="date" value={form.next_follow_up_date} onChange={e => set('next_follow_up_date', e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="h-20 text-sm" placeholder="Any notes on the outreach…" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Saving…' : 'Log Touch'}</Button>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
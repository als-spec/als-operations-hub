import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Send, Eye, EyeOff } from 'lucide-react';
import { EMAIL_TEMPLATES, applyTemplate } from '@/components/email/emailTemplates';

export default function EmailComposer({ prefill, prospects, engagements, retainers, onSent, onCancel }) {
  const [form, setForm] = useState({
    to_address: prefill?.to_address || '',
    to_name: prefill?.to_name || '',
    subject: prefill?.subject || '',
    body: prefill?.body || '',
    template_used: '',
    linked_record_id: prefill?.linked_record_id || '',
    linked_record_type: prefill?.linked_record_type || '',
    linked_record_name: prefill?.linked_record_name || '',
  });
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleTemplateSelect = (templateId) => {
    if (!templateId) return;
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const vars = {
      NAME: form.to_name || '[Name]',
      FACILITY: form.linked_record_name || '[Facility]',
      CALENDAR_LINK: '[Calendar Link]',
    };
    set('template_used', templateId);
    set('subject', applyTemplate(template.subject, vars));
    set('body', applyTemplate(template.body, vars));
  };

  const handleLinkedRecord = (type, id) => {
    set('linked_record_type', type);
    set('linked_record_id', id);
    if (!id) { set('linked_record_name', ''); return; }
    if (type === 'prospect') {
      const p = prospects.find(x => x.id === id);
      if (p) { set('linked_record_name', p.facility_name); set('to_address', p.admin_email || form.to_address); set('to_name', p.admin_name || form.to_name); }
    } else if (type === 'engagement') {
      const e = engagements.find(x => x.id === id);
      if (e) { set('linked_record_name', e.facility_name); set('to_address', e.admin_email || form.to_address); set('to_name', e.admin_name || form.to_name); }
    } else if (type === 'retainer') {
      const r = retainers.find(x => x.id === id);
      if (r) { set('linked_record_name', r.facility_name); set('to_address', r.admin_email || form.to_address); set('to_name', r.admin_name || form.to_name); }
    }
  };

  const handleSend = async () => {
    if (!form.to_address || !form.subject || !form.body) {
      setError('To, Subject, and Body are required.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await base44.functions.invoke('sendClientEmail', form);
      onSent();
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  const recordOptions = {
    prospect: prospects,
    engagement: engagements,
    retainer: retainers,
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />New Email
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPreview(v => !v)}>
              {preview ? <><EyeOff className="w-3 h-3 mr-1" />Edit</> : <><Eye className="w-3 h-3 mr-1" />Preview</>}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}><X className="w-4 h-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template selector */}
        <div>
          <Label className="text-xs text-muted-foreground">Template</Label>
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select a template…" /></SelectTrigger>
            <SelectContent>
              {EMAIL_TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              <SelectItem value="blank">— Blank —</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Linked record */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Link to</Label>
            <Select value={form.linked_record_type} onValueChange={v => { set('linked_record_type', v); set('linked_record_id', ''); set('linked_record_name', ''); }}>
              <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="retainer">Retainer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.linked_record_type && (
            <div>
              <Label className="text-xs text-muted-foreground">Record</Label>
              <Select value={form.linked_record_id} onValueChange={v => handleLinkedRecord(form.linked_record_type, v)}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {(recordOptions[form.linked_record_type] || []).map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.facility_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* To */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">To Name</Label>
            <Input className="mt-1 h-8 text-xs" placeholder="Dr. Jane Smith" value={form.to_name} onChange={e => set('to_name', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">To Email *</Label>
            <Input className="mt-1 h-8 text-xs" type="email" placeholder="admin@facility.com" value={form.to_address} onChange={e => set('to_address', e.target.value)} />
          </div>
        </div>

        {/* Subject */}
        <div>
          <Label className="text-xs text-muted-foreground">Subject *</Label>
          <Input className="mt-1 h-8 text-xs" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Subject line…" />
        </div>

        {/* Body */}
        <div>
          <Label className="text-xs text-muted-foreground">Body *</Label>
          {preview ? (
            <div className="mt-1 border border-border rounded-md p-3 text-sm whitespace-pre-wrap bg-secondary/20 min-h-[160px]">{form.body}</div>
          ) : (
            <Textarea className="mt-1 text-sm min-h-[160px]" value={form.body} onChange={e => set('body', e.target.value)} placeholder="Email body…" />
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Sending…' : 'Send Email'}
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
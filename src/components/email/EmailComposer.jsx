import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Send, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import {
  EMAIL_TEMPLATES, applyTemplate, buildAutoVars,
  countUnfilledManualVars, SERIES_LABELS,
} from '@/components/email/emailTemplates';

// Group templates by series for the selector
const GROUPED = Object.entries(SERIES_LABELS).map(([series, label]) => ({
  series, label,
  templates: EMAIL_TEMPLATES.filter(t => t.series === series),
}));

export default function EmailComposer({ prefill, prospects, engagements, retainers, onSent, onCancel, currentUser }) {
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

  const getLinkedRecord = () => {
    const { linked_record_type, linked_record_id } = form;
    if (!linked_record_id) return null;
    if (linked_record_type === 'prospect') return prospects?.find(x => x.id === linked_record_id);
    if (linked_record_type === 'engagement') return engagements?.find(x => x.id === linked_record_id);
    if (linked_record_type === 'retainer') return retainers?.find(x => x.id === linked_record_id);
    return null;
  };

  const handleTemplateSelect = (templateId) => {
    if (!templateId || templateId === 'blank') {
      set('template_used', '');
      return;
    }
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const record = getLinkedRecord();
    const autoVars = buildAutoVars(record, form.linked_record_type, currentUser);
    set('template_used', templateId);
    set('subject', applyTemplate(template.subject, autoVars));
    set('body', applyTemplate(template.body, autoVars));
  };

  const handleLinkedRecord = (type, id) => {
    set('linked_record_type', type);
    set('linked_record_id', id);
    if (!id) { set('linked_record_name', ''); return; }
    const lists = { prospect: prospects, engagement: engagements, retainer: retainers };
    const rec = (lists[type] || []).find(x => x.id === id);
    if (rec) {
      set('linked_record_name', rec.facility_name);
      set('to_address', rec.admin_email || form.to_address);
      set('to_name', rec.admin_name || form.to_name);
    }
  };

  // Re-apply template when linked record changes
  useEffect(() => {
    if (form.template_used) handleTemplateSelect(form.template_used);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.linked_record_id, form.linked_record_type]);

  const unfilledCount = countUnfilledManualVars(form.body) + countUnfilledManualVars(form.subject);
  const canSend = form.to_address && form.subject && form.body && unfilledCount === 0;

  const handleSend = async () => {
    if (!canSend) return;
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

  const recordOptions = { prospect: prospects, engagement: engagements, retainer: retainers };

  // Render body with ⚠️ vars highlighted
  const renderHighlightedBody = (text) => {
    const parts = text.split(/(⚠️\[[A-Z_]+\])/g);
    return parts.map((part, i) =>
      /^⚠️\[/.test(part)
        ? <mark key={i} className="bg-warning/20 text-warning font-semibold rounded px-0.5">{part}</mark>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            New Email
            {unfilledCount > 0 && (
              <Badge className="bg-warning/10 text-warning border-warning/30 text-[10px] gap-1">
                <AlertTriangle className="w-3 h-3" />{unfilledCount} unfilled {unfilledCount === 1 ? 'variable' : 'variables'}
              </Badge>
            )}
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
        {/* Template selector — grouped by series */}
        <div>
          <Label className="text-xs text-muted-foreground">Template</Label>
          <Select value={form.template_used} onValueChange={handleTemplateSelect}>
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue placeholder="Select a template…" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="blank">— Blank —</SelectItem>
              {GROUPED.map(group => (
                <React.Fragment key={group.series}>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 border-t border-border">
                    {group.label}
                  </div>
                  {group.templates.map(t => (
                    <SelectItem key={t.id} value={t.id} className="pl-4 text-xs">
                      {t.id} — {t.name}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
          {form.template_used && (() => {
            const tmpl = EMAIL_TEMPLATES.find(t => t.id === form.template_used);
            return tmpl ? (
              <p className="text-[11px] text-muted-foreground mt-1">
                Trigger: {tmpl.trigger} · Default sender: <span className="capitalize font-medium">{tmpl.default_sender}</span>
                {tmpl.manual_vars.length > 0 && <> · <span className="text-warning">⚠️ {tmpl.manual_vars.length} manual {tmpl.manual_vars.length === 1 ? 'var' : 'vars'} required</span></>}
              </p>
            ) : null;
          })()}
        </div>

        {/* Linked record */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Link to</Label>
            <Select value={form.linked_record_type || 'none'} onValueChange={v => {
              const type = v === 'none' ? '' : v;
              set('linked_record_type', type);
              set('linked_record_id', '');
              set('linked_record_name', '');
            }}>
              <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
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
          {preview ? (
            <div className="mt-1 border rounded-md px-3 py-2 text-xs bg-secondary/20 min-h-[32px]">
              {renderHighlightedBody(form.subject)}
            </div>
          ) : (
            <Input className="mt-1 h-8 text-xs" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Subject line…" />
          )}
        </div>

        {/* Body */}
        <div>
          <Label className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Body *</span>
            {unfilledCount > 0 && !preview && (
              <span className="text-warning text-[11px] font-normal">Replace all ⚠️[VARIABLE] placeholders to enable send</span>
            )}
          </Label>
          {preview ? (
            <div className="mt-1 border border-border rounded-md p-3 text-sm whitespace-pre-wrap bg-secondary/20 min-h-[200px] leading-relaxed">
              {renderHighlightedBody(form.body)}
            </div>
          ) : (
            <Textarea
              className="mt-1 text-sm min-h-[200px] font-mono text-xs leading-relaxed"
              value={form.body}
              onChange={e => set('body', e.target.value)}
              placeholder="Email body…"
            />
          )}
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handleSend}
            disabled={sending || !canSend}
            className="gap-2"
            title={unfilledCount > 0 ? `Fill in ${unfilledCount} required variable(s) before sending` : ''}
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Sending…' : 'Send Email'}
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          {!canSend && !sending && unfilledCount > 0 && (
            <span className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {unfilledCount} {unfilledCount === 1 ? 'variable' : 'variables'} must be filled before sending
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
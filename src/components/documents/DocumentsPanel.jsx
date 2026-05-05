import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, ExternalLink, Upload, Check, Pencil, X } from 'lucide-react';
import { format } from 'date-fns';

/**
 * DocumentsPanel — reusable panel for Pipeline, Engagement, and Retainer records.
 *
 * Props:
 *   record       — the current record object
 *   recordType   — 'pipeline' | 'engagement' | 'retainer'
 *   onSave       — async fn(updatedFields) — persists changes to the parent record
 *   readOnly     — boolean (VA / Analyst see this as read-only)
 */

// Field definitions per record type
const PIPELINE_FIELDS = [
  { key: 'capabilities_deck_url',       label: 'Capabilities Deck',           type: 'url',    dateKey: 'capabilities_deck_sent_date',   dateLabel: 'Sent date',     required_before: 'Proposal Call Scheduled' },
  { key: 'sample_diagnostic_url',       label: 'Sample Diagnostic',           type: 'url',    dateKey: 'sample_diagnostic_sent_date',   dateLabel: 'Sent date',     required_before: 'Proposal Call Scheduled' },
  { key: 'sow_generated_url',           label: 'SOW — Generated',             type: 'url',    dateKey: 'sow_generated_date',            dateLabel: 'Generated',     readOnly: true },
  { key: 'sow_signed_url',              label: 'SOW — Signed',                type: 'upload', dateKey: 'sow_signed_date',               dateLabel: 'Signed date',   required_before: 'SOW Signed' },
  { key: 'freshbooks_deposit_invoice_url',    label: 'FreshBooks Deposit Invoice',  type: 'url',                                                                    required_before: 'PC-03b send' },
  { key: 'freshbooks_deposit_invoice_number', label: 'Deposit Invoice Number',      type: 'text',                                                                   required_before: 'PC-03b send' },
];

const ENGAGEMENT_FIELDS = [
  { key: 'sow_signed_url',                   label: 'SOW — Signed',                  type: 'url',    dateKey: 'sow_signed_date',               dateLabel: 'Signed date',   readOnly: true },
  { key: 'freshbooks_deposit_invoice_url',   label: 'FreshBooks Deposit Invoice',    type: 'url',    readOnly: true },
  { key: 'freshbooks_deposit_invoice_number',label: 'Deposit Invoice Number',         type: 'text',   readOnly: true },
  { key: 'deposit_paid_date',                label: 'Deposit Paid Date',              type: 'date' },
  { key: 'freshbooks_balance_invoice_url',   label: 'FreshBooks Balance Invoice',     type: 'url',    required_before: 'DD-07b send' },
  { key: 'freshbooks_balance_invoice_number',label: 'Balance Invoice Number',          type: 'text',   required_before: 'DD-07b send' },
  { key: 'balance_paid_date',                label: 'Balance Paid Date',              type: 'date' },
  { key: 'findings_deck_url',                label: 'Findings Deck',                  type: 'upload', dateKey: 'findings_deck_delivered_date',  dateLabel: 'Delivered',     required_before: 'DD-07b send' },
  { key: 'dashboard_url',                    label: 'Analytics Dashboard',            type: 'url',    dateKey: 'dashboard_delivered_date',      dateLabel: 'Delivered' },
  { key: 'roadmap_url',                      label: '90-Day Roadmap',                 type: 'upload', dateKey: 'roadmap_delivered_date',        dateLabel: 'Delivered' },
];

const RETAINER_FIELDS = [
  { key: 'retainer_agreement_url',            label: 'Retainer Agreement — Signed',   type: 'upload', dateKey: 'retainer_agreement_signed_date', dateLabel: 'Signed date',  required_before: 'RT-01 send' },
  { key: 'freshbooks_client_url',             label: 'FreshBooks Client Link',         type: 'url' },
  { key: 'freshbooks_recurring_invoice_url',  label: 'FreshBooks Recurring Invoice',   type: 'url',    required_before: 'RT-01 send' },
  { key: 'freshbooks_recurring_invoice_number', label: 'Recurring Invoice Number',     type: 'text' },
];

const FIELDS_MAP = {
  pipeline:   PIPELINE_FIELDS,
  engagement: ENGAGEMENT_FIELDS,
  retainer:   RETAINER_FIELDS,
};

function FieldRow({ fieldDef, value, dateValue, readOnly, onChange, onUpload, uploading }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [dateDraft, setDateDraft] = useState(dateValue || '');

  const isReadOnly = readOnly || fieldDef.readOnly;

  const handleSave = () => {
    const updates = { [fieldDef.key]: draft };
    if (fieldDef.dateKey) updates[fieldDef.dateKey] = dateDraft;
    onChange(updates);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value || '');
    setDateDraft(dateValue || '');
    setEditing(false);
  };

  const displayValue = value || dateValue;

  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground">{fieldDef.label}</span>
          {fieldDef.required_before && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground">
              req. before {fieldDef.required_before}
            </Badge>
          )}
          {fieldDef.readOnly && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">auto</Badge>
          )}
        </div>

        {editing && !isReadOnly ? (
          <div className="mt-1.5 space-y-1.5">
            {fieldDef.type === 'upload' ? (
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept=".pdf,.docx,.xlsx,.png,.jpg"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const url = await onUpload(file);
                      setDraft(url);
                    }}
                  />
                  <span className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 hover:bg-secondary cursor-pointer">
                    <Upload className="w-3 h-3" /> Choose file
                  </span>
                </label>
                {draft && <span className="text-xs text-muted-foreground truncate max-w-[160px]">File ready</span>}
              </div>
            ) : (
              <Input
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={fieldDef.type === 'date' ? '' : fieldDef.type === 'text' ? 'Enter value…' : 'https://…'}
                type={fieldDef.type === 'date' ? 'date' : 'text'}
                className="h-7 text-xs"
              />
            )}
            {fieldDef.dateKey && fieldDef.type !== 'date' && (
              <Input type="date" value={dateDraft} onChange={e => setDateDraft(e.target.value)} className="h-7 text-xs w-40" />
            )}
            <div className="flex gap-1.5">
              <Button size="sm" className="h-6 text-xs px-2" onClick={handleSave}>Save</Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={handleCancel}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="mt-0.5">
            {(fieldDef.type === 'url' || fieldDef.type === 'upload') && value ? (
              <a href={value} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline">
                <ExternalLink className="w-3 h-3" /> Open link
              </a>
            ) : fieldDef.type === 'date' && value ? (
              <span className="text-xs text-foreground">{format(new Date(value), 'MMM d, yyyy')}</span>
            ) : value ? (
              <span className="text-xs text-foreground">{value}</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Not set</span>
            )}
            {dateValue && fieldDef.dateKey && fieldDef.type !== 'date' && (
              <span className="text-[10px] text-muted-foreground ml-2">
                ({fieldDef.dateLabel}: {format(new Date(dateValue), 'MMM d, yyyy')})
              </span>
            )}
          </div>
        )}
      </div>

      {!isReadOnly && !editing && (
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 mt-0.5" onClick={() => { setDraft(value || ''); setDateDraft(dateValue || ''); setEditing(true); }}>
          <Pencil className="w-3 h-3 text-muted-foreground" />
        </Button>
      )}
      {!isReadOnly && value && !editing && (
        <Check className="w-3.5 h-3.5 text-success shrink-0 mt-1" />
      )}
    </div>
  );
}

export default function DocumentsPanel({ record, recordType, onSave, readOnly = false }) {
  const [uploading, setUploading] = useState(false);
  const fields = FIELDS_MAP[recordType] || [];

  const handleChange = (updates) => {
    onSave(updates);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading(false);
    return file_url;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" /> Documents
          {readOnly && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">Read only</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {fields.map(fieldDef => (
          <FieldRow
            key={fieldDef.key}
            fieldDef={fieldDef}
            value={record?.[fieldDef.key] || ''}
            dateValue={fieldDef.dateKey ? (record?.[fieldDef.dateKey] || '') : ''}
            readOnly={readOnly}
            onChange={handleChange}
            onUpload={handleUpload}
            uploading={uploading}
          />
        ))}
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const EMPTY = {
  invoice_number: '',
  prospect_id: '',
  linked_record_type: '',
  linked_record_id: '',
  description: '',
  amount: '',
  invoice_type: 'Monthly Retainer',
  status: 'Draft',
  issue_date: new Date().toISOString().split('T')[0],
  due_date: '',
  paid_date: '',
  payment_method: '',
  notes: '',
};

export default function InvoiceForm({ invoice, onSubmit, onCancel }) {
  const [form, setForm] = useState(invoice ? { ...invoice } : EMPTY);

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects-select'],
    queryFn: () => base44.entities.Prospect.list('facility_name', 200),
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements-select'],
    queryFn: () => base44.entities.Engagement.list('-created_date', 200),
  });

  const { data: retainers = [] } = useQuery({
    queryKey: ['retainers-select'],
    queryFn: () => base44.entities.Retainer.list('-created_date', 200),
  });

  const linkedOptions = form.linked_record_type === 'engagement'
    ? engagements.filter(e => !form.prospect_id || e.prospect_id === form.prospect_id)
    : form.linked_record_type === 'retainer'
    ? retainers.filter(r => !form.prospect_id || r.prospect_id === form.prospect_id)
    : [];

  const set = (field, value) => setForm(f => {
    const updated = { ...f, [field]: value };
    // Due date must not be before issue date
    if (field === 'issue_date' && updated.due_date && updated.due_date < value) {
      updated.due_date = value;
    }
    // Reset linked record when type changes
    if (field === 'linked_record_type') {
      updated.linked_record_id = '';
    }
    // Reset linked record when prospect changes
    if (field === 'prospect_id') {
      updated.linked_record_id = '';
    }
    return updated;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedProspect = prospects.find(p => p.id === form.prospect_id);
    onSubmit({
      ...form,
      amount: parseFloat(form.amount) || 0,
      facility_name: selectedProspect?.facility_name || form.facility_name || '',
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{invoice ? 'Edit Invoice' : 'New Invoice'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Invoice #</Label>
              <Input placeholder="INV-2024-001" value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Facility *</Label>
              <Select value={form.prospect_id || ''} onValueChange={v => set('prospect_id', v)} required>
                <SelectTrigger><SelectValue placeholder="Select facility…" /></SelectTrigger>
                <SelectContent>
                  {prospects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.facility_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount *</Label>
              <Input required type="number" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Link to Record</Label>
              <Select value={form.linked_record_type || ''} onValueChange={v => set('linked_record_type', v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="retainer">Retainer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.linked_record_type && (
              <div className="space-y-1 md:col-span-2">
                <Label>{form.linked_record_type === 'engagement' ? 'Engagement' : 'Retainer'}</Label>
                <Select value={form.linked_record_id || ''} onValueChange={v => set('linked_record_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {linkedOptions.length === 0
                      ? <SelectItem value={null} disabled>No records found</SelectItem>
                      : linkedOptions.map(r => {
                          const prospect = prospects.find(p => p.id === r.prospect_id);
                          const label = form.linked_record_type === 'engagement'
                            ? `${prospect?.facility_name || 'Unknown'} — $${(r.fee || 0).toLocaleString()} (${r.status})`
                            : `${prospect?.facility_name || 'Unknown'} — $${(r.mrr || 0).toLocaleString()}/mo (${r.status})`;
                          return <SelectItem key={r.id} value={r.id}>{label}</SelectItem>;
                        })
                    }
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Invoice Type</Label>
              <Select value={form.invoice_type} onValueChange={v => set('invoice_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Deposit','Balance','Monthly Retainer','Ad Hoc'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v, paid_date: v === 'Paid' ? (f.paid_date || new Date().toISOString().split('T')[0]) : '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Draft','Sent','Paid','Overdue','Void'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Payment Method</Label>
              <Select value={form.payment_method || ''} onValueChange={v => set('payment_method', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {['ACH','Check','Wire','Credit Card','Other'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Issue Date</Label>
              <Input type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} min={form.issue_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Paid Date</Label>
              <Input type="date" value={form.paid_date || ''} disabled={form.status !== 'Paid'} onChange={e => set('paid_date', e.target.value)} />
              {form.status !== 'Paid' && <p className="text-[11px] text-muted-foreground">Set when status is Paid</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description / Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional description or notes..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">{invoice ? 'Save Changes' : 'Create Invoice'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
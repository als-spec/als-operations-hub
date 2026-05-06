import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { addBusinessDays, format } from 'date-fns';

export default function EngagementForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const [form, setForm] = useState({
    facility_name: params.get('facility_name') || '',
    admin_name: params.get('admin_name') || '',
    admin_email: '',
    fee: params.get('fee') || '',
    prospect_id: params.get('prospect_id') || '',
    pipeline_record_id: params.get('pipeline_record_id') || '',
    // Carry forward document links from pipeline record
    sow_signed_url: params.get('sow_signed_url') || '',
    sow_signed_date: params.get('sow_signed_date') || '',
    // Carry forward clickwrap signing audit fields. Source of truth stays on
    // the pipeline record; engagement gets a copy so the operator UI on the
    // engagement can show the receipt without re-querying pipeline.
    sow_signed_at: params.get('sow_signed_at') || '',
    sow_signed_by_name: params.get('sow_signed_by_name') || '',
    sow_signed_by_email: params.get('sow_signed_by_email') || '',
    sow_signed_ip: params.get('sow_signed_ip') || '',
    sow_signed_user_agent: params.get('sow_signed_user_agent') || '',
    sow_sha256: params.get('sow_sha256') || '',
    sow_signature_token_id: params.get('sow_signature_token_id') || '',
    sow_signature_receipt_url: params.get('sow_signature_receipt_url') || '',
    freshbooks_deposit_invoice_url: params.get('freshbooks_deposit_invoice_url') || '',
    freshbooks_deposit_invoice_number: params.get('freshbooks_deposit_invoice_number') || '',
    kickoff_date: '', on_site_date: '', operator_name: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => base44.entities.Prospect.list('-facility_name', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Engagement.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['engagements'] });
      navigate('/engagements');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const deliveryTarget = form.kickoff_date
      ? format(addBusinessDays(new Date(form.kickoff_date), 15), 'yyyy-MM-dd')
      : '';
    createMutation.mutate({
      ...form,
      fee: form.fee ? Number(form.fee) : 0,
      delivery_target: deliveryTarget,
      status: 'Active',
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/engagements')}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold tracking-tight">New Engagement</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-xs">Facility *</Label>
              {form.facility_name && !prospects.length ? (
                <Input value={form.facility_name} readOnly className="mt-1 bg-muted" />
              ) : (
                <Select
                  value={form.prospect_id || ''}
                  onValueChange={v => {
                    const p = prospects.find(x => x.id === v);
                    setForm(f => ({ ...f, prospect_id: v, facility_name: p?.facility_name || '', admin_name: p?.admin_name || f.admin_name, admin_email: p?.admin_email || f.admin_email }));
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder={form.facility_name || 'Select a prospect…'} /></SelectTrigger>
                  <SelectContent>
                    {prospects.map(p => <SelectItem key={p.id} value={p.id}>{p.facility_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className="text-xs">Administrator</Label><Input value={form.admin_name} onChange={e => set('admin_name', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Admin Email</Label><Input type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label className="text-xs">Engagement Fee *</Label><Input type="number" value={form.fee} onChange={e => set('fee', e.target.value)} required className="mt-1" placeholder="$" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className="text-xs">Kickoff Date</Label><Input type="date" value={form.kickoff_date} onChange={e => set('kickoff_date', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">On-Site Date</Label><Input type="date" value={form.on_site_date} onChange={e => set('on_site_date', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label className="text-xs">Operator Assigned</Label><Input value={form.operator_name} onChange={e => set('operator_name', e.target.value)} className="mt-1" /></div>
            {form.kickoff_date && (
              <p className="text-xs text-muted-foreground">Delivery target auto-set to {format(addBusinessDays(new Date(form.kickoff_date), 15), 'MMM d, yyyy')} (15 business days)</p>
            )}
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/engagements')}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating…' : 'Create Engagement'}</Button>
        </div>
      </form>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

export default function RetainerForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const prefill = {
    facility_name: params.get('facility_name') || '',
    admin_name: params.get('admin_name') || '',
    admin_email: params.get('admin_email') || '',
    engagement_id: params.get('engagement_id') || '',
    prospect_id: params.get('prospect_id') || '',
  };
  const isConversion = !!prefill.engagement_id;

  const [form, setForm] = useState({
    ...prefill,
    mrr: '', start_date: new Date().toISOString().split('T')[0], renewal_date: '', next_qbr_date: '',
    status: 'Active', health_score: 'Green', notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => base44.entities.Prospect.list('-facility_name', 200),
    enabled: !isConversion,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Retainer.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['retainers'] }); navigate('/retainers'); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, mrr: parseFloat(form.mrr) || 0 });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/retainers')}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">New Retainer</h1>
          <p className="text-sm text-muted-foreground">{isConversion ? `Converting engagement: ${prefill.facility_name}` : 'Add a post-engagement recurring client'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Client Info</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Facility *</Label>
              {isConversion ? (
                <Input value={form.facility_name} readOnly className="bg-muted" />
              ) : (
                <Select
                  value={form.prospect_id || ''}
                  onValueChange={v => {
                    const p = prospects.find(x => x.id === v);
                    setForm(f => ({ ...f, prospect_id: v, facility_name: p?.facility_name || '', admin_name: p?.admin_name || f.admin_name, admin_email: p?.admin_email || f.admin_email }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select a prospect…" /></SelectTrigger>
                  <SelectContent>
                    {prospects.map(p => <SelectItem key={p.id} value={p.id}>{p.facility_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Admin Name</Label>
              <Input value={form.admin_name} onChange={e => set('admin_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Admin Email</Label>
              <Input type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Retainer Details</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Monthly Retainer Fee ($) *</Label>
              <Input type="number" value={form.mrr} onChange={e => set('mrr', e.target.value)} required placeholder="2500" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="At Risk">At Risk</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Renewal Date</Label>
              <Input type="date" value={form.renewal_date} onChange={e => set('renewal_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Next QBR Date</Label>
              <Input type="date" value={form.next_qbr_date} onChange={e => set('next_qbr_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Health Score</Label>
              <Select value={form.health_score} onValueChange={v => set('health_score', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Green">Green</SelectItem>
                  <SelectItem value="Yellow">Yellow</SelectItem>
                  <SelectItem value="Red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Saving…' : 'Create Retainer'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/retainers')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
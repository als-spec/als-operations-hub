import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

export default function PipelineForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const params = new URLSearchParams(window.location.search);
  const prospectId = params.get('prospect_id');

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => base44.entities.Prospect.list('-facility_name', 200),
  });

  const prospect = prospects.find(p => p.id === prospectId) || null;

  const [form, setForm] = useState({
    prospect_id: prospectId || '',
    facility_name: '',
    admin_name: '',
    proposed_fee: '',
    proposed_kickoff_window: '',
    stage: 'Discovery Call Scheduled',
  });

  useEffect(() => {
    if (prospect) {
      setForm(f => ({
        ...f,
        prospect_id: prospect.id,
        facility_name: prospect.facility_name || '',
        admin_name: prospect.admin_name || '',
      }));
    }
  }, [prospect]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PipelineRecord.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline-records'] });
      navigate('/pipeline');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      proposed_fee: form.proposed_fee ? Number(form.proposed_fee) : undefined,
      stage_history: [{ stage: form.stage, date: new Date().toISOString() }],
    };
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pipeline')}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold tracking-tight">New Pipeline Deal</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-xs">Facility *</Label>
              <Select
                value={form.prospect_id}
                onValueChange={v => {
                  const p = prospects.find(x => x.id === v);
                  setForm(f => ({ ...f, prospect_id: v, facility_name: p?.facility_name || '', admin_name: p?.admin_name || f.admin_name }));
                }}
                required
              >
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select a prospect…" /></SelectTrigger>
                <SelectContent>
                  {prospects.map(p => <SelectItem key={p.id} value={p.id}>{p.facility_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Administrator Name</Label><Input value={form.admin_name} onChange={e => set('admin_name', e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Proposed Diagnostic Fee</Label><Input type="number" value={form.proposed_fee} onChange={e => set('proposed_fee', e.target.value)} className="mt-1" placeholder="$" /></div>
            <div><Label className="text-xs">Proposed Kickoff Window</Label><Input value={form.proposed_kickoff_window} onChange={e => set('proposed_kickoff_window', e.target.value)} className="mt-1" placeholder="e.g. Jan 15–30" /></div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/pipeline')}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating…' : 'Create Deal'}</Button>
        </div>
      </form>
    </div>
  );
}
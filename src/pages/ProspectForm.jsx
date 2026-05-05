import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

export default function ProspectForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    facility_name: '', address: '', county: '', drive_time_woodstock: '',
    or_count: '', specialty_focus: '', admin_name: '', admin_email: '',
    admin_phone: '', admin_linkedin: '', gpo_affiliation: '',
    estimated_supply_spend: '', tier: 'C', stage: 'Target',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Prospect.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospects'] });
      navigate('/prospects');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (data.or_count) data.or_count = Number(data.or_count);
    if (data.estimated_supply_spend) data.estimated_supply_spend = Number(data.estimated_supply_spend);
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/prospects')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">New Prospect</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-sm">Facility Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className="text-xs">Facility Name *</Label><Input value={form.facility_name} onChange={e => set('facility_name', e.target.value)} required className="mt-1" /></div>
              <div><Label className="text-xs">County</Label><Input value={form.county} onChange={e => set('county', e.target.value)} className="mt-1" /></div>
              <div className="sm:col-span-2"><Label className="text-xs">Address</Label><Input value={form.address} onChange={e => set('address', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Drive Time from Woodstock</Label><Input value={form.drive_time_woodstock} onChange={e => set('drive_time_woodstock', e.target.value)} className="mt-1" placeholder="e.g. 45 min" /></div>
              <div><Label className="text-xs"># Operating Rooms</Label><Input type="number" value={form.or_count} onChange={e => set('or_count', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Specialty Focus</Label><Input value={form.specialty_focus} onChange={e => set('specialty_focus', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">GPO Affiliation</Label><Input value={form.gpo_affiliation} onChange={e => set('gpo_affiliation', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Est. Annual Supply Spend</Label><Input type="number" value={form.estimated_supply_spend} onChange={e => set('estimated_supply_spend', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Tier</Label>
                <Select value={form.tier} onValueChange={v => set('tier', v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="A">A</SelectItem><SelectItem value="B">B</SelectItem><SelectItem value="C">C</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className="text-xs">Administrator Name</Label><Input value={form.admin_name} onChange={e => set('admin_name', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.admin_phone} onChange={e => set('admin_phone', e.target.value)} className="mt-1" /></div>
              <div><Label className="text-xs">LinkedIn URL</Label><Input value={form.admin_linkedin} onChange={e => set('admin_linkedin', e.target.value)} className="mt-1" /></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/prospects')}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create Prospect'}
          </Button>
        </div>
      </form>
    </div>
  );
}
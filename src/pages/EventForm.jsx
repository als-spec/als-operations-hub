import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';

const EVENT_TYPES = ['Discovery Call', 'Proposal Call', 'Kickoff Call', 'On-Site Walkthrough', 'Findings Presentation', 'Retainer Review', 'QBR', 'Other'];
const DEFAULT_DURATIONS = {
  'Discovery Call': 30, 'Proposal Call': 45, 'Kickoff Call': 60,
  'On-Site Walkthrough': 480, 'Findings Presentation': 90,
  'Retainer Review': 60, 'QBR': 90, 'Other': 30,
};

export default function EventForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const params = new URLSearchParams(window.location.search);

  const [form, setForm] = useState({
    type: params.get('type') || 'Discovery Call',
    title: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 30,
    attendees: '',
    call_link: '',
    location: '',
    notes: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
      navigate('/schedule');
    },
  });

  const handleTypeChange = (type) => {
    set('type', type);
    set('duration_minutes', DEFAULT_DURATIONS[type] || 30);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, status: 'Scheduled' });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/schedule')}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold tracking-tight">New Event</h1>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <Label className="text-xs">Event Type</Label>
              <Select value={form.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => set('title', e.target.value)} required className="mt-1" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className="text-xs">Date *</Label><Input type="date" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} required className="mt-1" /></div>
              <div><Label className="text-xs">Time</Label><Input type="time" value={form.scheduled_time} onChange={e => set('scheduled_time', e.target.value)} className="mt-1" /></div>
            </div>
            <div><Label className="text-xs">Duration (minutes)</Label><Input type="number" value={form.duration_minutes} onChange={e => set('duration_minutes', Number(e.target.value))} className="mt-1" /></div>
            <div><Label className="text-xs">Attendees</Label><Input value={form.attendees} onChange={e => set('attendees', e.target.value)} className="mt-1" placeholder="Comma-separated names" /></div>
            <div><Label className="text-xs">Call Link (Zoom)</Label><Input value={form.call_link} onChange={e => set('call_link', e.target.value)} className="mt-1" placeholder="https://zoom.us/..." /></div>
            <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={e => set('location', e.target.value)} className="mt-1" /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="mt-1 text-sm" /></div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/schedule')}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating…' : 'Create Event'}</Button>
        </div>
      </form>
    </div>
  );
}
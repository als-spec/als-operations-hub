import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus } from 'lucide-react';
import { format } from 'date-fns';

const healthColors = { Green: 'bg-success/10 text-success', Yellow: 'bg-warning/10 text-warning', Red: 'bg-destructive/10 text-destructive' };
const statusColors = { Active: 'bg-teal/10 text-teal', 'At Risk': 'bg-warning/10 text-warning', Churned: 'bg-destructive/10 text-destructive', Paused: 'bg-secondary text-secondary-foreground' };

export default function RetainerDetail() {
  const id = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const { data: retainer, isLoading } = useQuery({
    queryKey: ['retainer', id],
    queryFn: async () => {
      const list = await base44.entities.Retainer.filter({ id });
      return list[0];
    },
    enabled: !!id && id !== 'new',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Retainer.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['retainer', id] }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!retainer) return <div className="text-center py-20 text-muted-foreground">Retainer not found</div>;

  const log = retainer.monthly_check_in_log || [];

  const addNote = () => {
    if (!noteText.trim()) return;
    const updated = [{ date: new Date().toISOString().split('T')[0], notes: noteText.trim(), author: 'Me' }, ...log];
    updateMutation.mutate({ monthly_check_in_log: updated });
    setNoteText('');
    setAddingNote(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/retainers')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{retainer.facility_name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{retainer.admin_name} · ${retainer.mrr?.toLocaleString()}/mo MRR</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${healthColors[retainer.health_score || 'Green']}`}>{retainer.health_score || 'Green'}</Badge>
          <Badge className={`${statusColors[retainer.status]}`}>{retainer.status}</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Check-in Log */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Monthly Check-in Log</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setAddingNote(true)}><Plus className="w-3 h-3 mr-1" />Add Note</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {addingNote && (
                <div className="space-y-2 p-3 rounded-md border bg-secondary/30">
                  <Textarea placeholder="Check-in notes..." value={noteText} onChange={e => setNoteText(e.target.value)} className="text-sm h-20" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addNote}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setAddingNote(false); setNoteText(''); }}>Cancel</Button>
                  </div>
                </div>
              )}
              {log.length === 0 && !addingNote ? (
                <p className="text-sm text-muted-foreground text-center py-4">No check-in notes yet.</p>
              ) : (
                log.map((entry, i) => (
                  <div key={i} className="border-l-2 border-sidebar-border pl-3 py-1">
                    <p className="text-[11px] text-muted-foreground mb-0.5">{entry.date} · {entry.author}</p>
                    <p className="text-sm">{entry.notes}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Start Date</p><p>{retainer.start_date ? format(new Date(retainer.start_date), 'MMM d, yyyy') : '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Renewal Date</p><p>{retainer.renewal_date ? format(new Date(retainer.renewal_date), 'MMM d, yyyy') : '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Next QBR</p><p>{retainer.next_qbr_date ? format(new Date(retainer.next_qbr_date), 'MMM d, yyyy') : '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Services</p><p>{retainer.services?.join(', ') || '—'}</p></div>
              {retainer.notes && <div><p className="text-xs text-muted-foreground">Notes</p><p>{retainer.notes}</p></div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Update Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Health</p>
                <Select value={retainer.health_score || 'Green'} onValueChange={v => updateMutation.mutate({ health_score: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Green">Green</SelectItem>
                    <SelectItem value="Yellow">Yellow</SelectItem>
                    <SelectItem value="Red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                <Select value={retainer.status} onValueChange={v => updateMutation.mutate({ status: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="At Risk">At Risk</SelectItem>
                    <SelectItem value="Paused">Paused</SelectItem>
                    <SelectItem value="Churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
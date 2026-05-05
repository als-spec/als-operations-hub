import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, ExternalLink } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

import MonthlyCadenceTracker from '@/components/retainer/MonthlyCadenceTracker';
import QuarterlyDeliverablesTracker from '@/components/retainer/QuarterlyDeliverablesTracker';
import SavingsTracker from '@/components/retainer/SavingsTracker';
import ReferralLog from '@/components/retainer/ReferralLog';

const healthColors = { Green: 'bg-success/10 text-success', Yellow: 'bg-warning/10 text-warning', Red: 'bg-destructive/10 text-destructive' };
const statusColors = { Active: 'bg-teal/10 text-teal', 'At Risk': 'bg-warning/10 text-warning', Churned: 'bg-destructive/10 text-destructive', Paused: 'bg-secondary text-secondary-foreground' };

export default function RetainerDetail() {
  const id = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [editingRenewalNotes, setEditingRenewalNotes] = useState(false);
  const [renewalNotesDraft, setRenewalNotesDraft] = useState('');

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
  const daysToRenewal = retainer.renewal_date ? differenceInDays(new Date(retainer.renewal_date), new Date()) : null;

  const addNote = () => {
    if (!noteText.trim()) return;
    const updated = [{ date: new Date().toISOString().split('T')[0], notes: noteText.trim(), author: 'Me' }, ...log];
    updateMutation.mutate({ monthly_check_in_log: updated });
    setNoteText('');
    setAddingNote(false);
  };

  const handleUpdate = (data) => updateMutation.mutate(data);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/retainers')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{retainer.facility_name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{retainer.admin_name} · <span className="font-semibold text-foreground">${retainer.mrr?.toLocaleString()}/mo</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={healthColors[retainer.health_score || 'Green']}>{retainer.health_score || 'Green'}</Badge>
          <Badge className={statusColors[retainer.status]}>{retainer.status}</Badge>
        </div>
      </div>

      {/* Renewal alert */}
      {daysToRenewal !== null && daysToRenewal <= 60 && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${daysToRenewal <= 30 ? 'bg-destructive/5 border-destructive/20 text-destructive' : 'bg-warning/5 border-warning/20 text-warning'}`}>
          ⚠ Renewal in {daysToRenewal} days — {retainer.renewal_date ? format(new Date(retainer.renewal_date), 'MMM d, yyyy') : ''}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Monthly Cadence */}
          <MonthlyCadenceTracker retainer={retainer} onUpdate={handleUpdate} />

          {/* Quarterly Deliverables */}
          <QuarterlyDeliverablesTracker retainer={retainer} onUpdate={handleUpdate} />

          {/* Savings Realized */}
          <SavingsTracker retainer={retainer} onUpdate={handleUpdate} />

          {/* Referral Log */}
          <ReferralLog retainer={retainer} onUpdate={handleUpdate} />

          {/* Monthly Check-in Log */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Monthly Check-in Log</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddingNote(true)}>
                  <Plus className="w-3 h-3 mr-1" />Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {addingNote && (
                <div className="space-y-2 p-3 rounded-md border bg-secondary/30">
                  <Textarea placeholder="Check-in notes…" value={noteText} onChange={e => setNoteText(e.target.value)} className="text-sm h-20" />
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
                  <div key={i} className="border-l-2 border-border pl-3 py-1">
                    <p className="text-[11px] text-muted-foreground mb-0.5">{entry.date} · {entry.author}</p>
                    <p className="text-sm">{entry.notes}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Renewal Notes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Renewal Notes</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                  setRenewalNotesDraft(retainer.renewal_notes || '');
                  setEditingRenewalNotes(v => !v);
                }}>Edit</Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingRenewalNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={renewalNotesDraft}
                    onChange={e => setRenewalNotesDraft(e.target.value)}
                    className="text-sm min-h-[80px]"
                    placeholder="Upsell opportunities, scope changes, red flags for renewal discussion…"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { handleUpdate({ renewal_notes: renewalNotesDraft }); setEditingRenewalNotes(false); }}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingRenewalNotes(false)}>Cancel</Button>
                  </div>
                </div>
              ) : retainer.renewal_notes ? (
                <p className="text-sm whitespace-pre-wrap">{retainer.renewal_notes}</p>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">No renewal notes yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Contract Details */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Contract Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-xs text-muted-foreground">MRR</p><p className="text-xl font-bold">${retainer.mrr?.toLocaleString()}</p></div>
              <div><p className="text-xs text-muted-foreground">Start Date</p><p>{retainer.start_date ? format(new Date(retainer.start_date), 'MMM d, yyyy') : '—'}</p></div>
              <div>
                <p className="text-xs text-muted-foreground">Renewal Date</p>
                <p className={daysToRenewal !== null && daysToRenewal <= 30 ? 'text-destructive font-semibold' : ''}>
                  {retainer.renewal_date ? format(new Date(retainer.renewal_date), 'MMM d, yyyy') : '—'}
                </p>
                {daysToRenewal !== null && <p className="text-[10px] text-muted-foreground">{daysToRenewal}d away</p>}
              </div>
              <div><p className="text-xs text-muted-foreground">Next QBR</p><p>{retainer.next_qbr_date ? format(new Date(retainer.next_qbr_date), 'MMM d, yyyy') : '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Admin Email</p><p className="text-xs break-all">{retainer.admin_email || '—'}</p></div>
              {retainer.services?.length > 0 && (
                <div><p className="text-xs text-muted-foreground">Services</p><p className="text-xs">{retainer.services.join(', ')}</p></div>
              )}
              {retainer.prospect_id && (
                <Link to={`/prospects/${retainer.prospect_id}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />View Prospect Record
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Update Status */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Health Score</Label>
                <Select value={retainer.health_score || 'Green'} onValueChange={v => handleUpdate({ health_score: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Green">🟢 Green</SelectItem>
                    <SelectItem value="Yellow">🟡 Yellow</SelectItem>
                    <SelectItem value="Red">🔴 Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Retainer Status</Label>
                <Select value={retainer.status} onValueChange={v => handleUpdate({ status: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
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

          {/* Quick edit dates */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Update Dates</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Renewal Date</Label>
                <Input type="date" defaultValue={retainer.renewal_date || ''} className="mt-1 h-8 text-xs"
                  onBlur={e => e.target.value && handleUpdate({ renewal_date: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Next QBR Date</Label>
                <Input type="date" defaultValue={retainer.next_qbr_date || ''} className="mt-1 h-8 text-xs"
                  onBlur={e => e.target.value && handleUpdate({ next_qbr_date: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
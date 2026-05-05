import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, DollarSign, User, Shield, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import DocumentsPanel from '@/components/documents/DocumentsPanel';

const DEFAULT_MILESTONES = [
  { type: 'Kickoff Call', completed: false, completed_date: '', notes: '' },
  { type: 'On-Site Walkthrough', completed: false, completed_date: '', notes: '' },
  { type: 'Data Received', completed: false, completed_date: '', notes: '' },
  { type: 'Analysis Complete', completed: false, completed_date: '', notes: '' },
  { type: 'Findings Delivered', completed: false, completed_date: '', notes: '' },
];

const DEFAULT_DATA_REQUESTS = [
  { item_name: 'Supply spend by category (12 months)', status: 'Not Requested', due_date: '', notes: '' },
  { item_name: 'GPO contract documentation', status: 'Not Requested', due_date: '', notes: '' },
  { item_name: 'Current vendor list with pricing', status: 'Not Requested', due_date: '', notes: '' },
  { item_name: 'Implant usage & preference cards', status: 'Not Requested', due_date: '', notes: '' },
  { item_name: 'Charge master (relevant codes)', status: 'Not Requested', due_date: '', notes: '' },
  { item_name: 'Inventory management reports', status: 'Not Requested', due_date: '', notes: '' },
];

const DEFAULT_DELIVERABLES = [
  { name: 'Findings Deck', status: 'Not Started', file_url: '', delivery_date: '' },
  { name: 'Analytics Dashboard', status: 'Not Started', file_url: '', delivery_date: '' },
  { name: '90-Day Roadmap', status: 'Not Started', file_url: '', delivery_date: '' },
  { name: 'Final Invoice', status: 'Not Started', file_url: '', delivery_date: '' },
];

const dataStatusColors = {
  'Not Requested': 'bg-secondary text-secondary-foreground',
  'Requested': 'bg-primary/10 text-primary',
  'Received': 'bg-success/10 text-success',
  'Incomplete': 'bg-warning/10 text-warning',
};

export default function EngagementDetail() {
  const id = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [showGuaranteeForm, setShowGuaranteeForm] = useState(false);
  const [newGuarantee, setNewGuarantee] = useState({ category: '', stated_amount: '', confidence: 'High', notes: '' });

  const { data: engagement, isLoading } = useQuery({
    queryKey: ['engagement', id],
    queryFn: async () => {
      const list = await base44.entities.Engagement.filter({ id });
      return list[0];
    },
    enabled: !!id && id !== 'new',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Engagement.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['engagement', id] }),
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!engagement) return <div className="text-center py-20 text-muted-foreground">Engagement not found</div>;

  const milestones = engagement.milestones?.length ? engagement.milestones : DEFAULT_MILESTONES;
  const dataRequests = engagement.data_requests?.length ? engagement.data_requests : DEFAULT_DATA_REQUESTS;
  const deliverables = engagement.deliverables?.length ? engagement.deliverables : DEFAULT_DELIVERABLES;
  const guaranteeItems = engagement.guarantee_items || [];

  const completedMs = milestones.filter(m => m.completed).length;
  const progress = Math.round((completedMs / milestones.length) * 100);
  const receivedData = dataRequests.filter(d => d.status === 'Received').length;
  const dataProgress = Math.round((receivedData / dataRequests.length) * 100);

  const addNote = () => {
    if (!noteText.trim()) return;
    const notes = [...(engagement.internal_notes ? [engagement.internal_notes] : [])];
    const ts = new Date().toLocaleString();
    const updated = (engagement.internal_notes || '') + (engagement.internal_notes ? '\n\n' : '') + `[${ts}]\n${noteText}`;
    updateMutation.mutate({ internal_notes: updated });
    setNoteText('');
  };

  const addGuaranteeItem = () => {
    if (!newGuarantee.category || !newGuarantee.stated_amount) return;
    const weight = newGuarantee.confidence === 'High' ? 1.0 : 0.5;
    const item = { ...newGuarantee, stated_amount: Number(newGuarantee.stated_amount), weighted_amount: Number(newGuarantee.stated_amount) * weight };
    updateMutation.mutate({ guarantee_items: [...guaranteeItems, item] });
    setNewGuarantee({ category: '', stated_amount: '', confidence: 'High', notes: '' });
    setShowGuaranteeForm(false);
  };

  const removeGuaranteeItem = (index) => {
    updateMutation.mutate({ guarantee_items: guaranteeItems.filter((_, i) => i !== index) });
  };

  const cycleDeliverableStatus = (index) => {
    const statuses = ['Not Started', 'In Progress', 'Complete'];
    const current = statuses.indexOf(deliverables[index].status);
    const next = statuses[(current + 1) % statuses.length];
    const updated = deliverables.map((d, i) => i === index ? { ...d, status: next } : d);
    updateMutation.mutate({ deliverables: updated });
  };

  const toggleMilestone = (index) => {
    const updated = milestones.map((m, i) => i === index ? { ...m, completed: !m.completed, completed_date: !m.completed ? new Date().toISOString().split('T')[0] : '' } : m);
    updateMutation.mutate({ milestones: updated });
  };

  const cycleDataStatus = (index) => {
    const statuses = ['Not Requested', 'Requested', 'Received', 'Incomplete'];
    const current = statuses.indexOf(dataRequests[index].status);
    const next = statuses[(current + 1) % statuses.length];
    const updated = dataRequests.map((d, i) => i === index ? { ...d, status: next } : d);
    updateMutation.mutate({ data_requests: updated });
  };

  // Guarantee calculations
  const weightedTotal = guaranteeItems.reduce((sum, item) => {
    const weight = item.confidence === 'High' ? 1.0 : 0.5;
    return sum + (item.stated_amount || 0) * weight;
  }, 0);
  const threshold = (engagement.fee || 0) * 3;
  const guaranteeMet = weightedTotal >= threshold && threshold > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/engagements')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{engagement.facility_name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${engagement.fee?.toLocaleString()}</span>
              {engagement.kickoff_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(engagement.kickoff_date), 'MMM d')} → {engagement.delivery_target ? format(new Date(engagement.delivery_target), 'MMM d') : '—'}</span>}
              {engagement.operator_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{engagement.operator_name}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={engagement.status === 'Active' ? 'bg-teal/10 text-teal' : 'bg-success/10 text-success'}>{engagement.status}</Badge>
          {engagement.findings_delivered && (
            <Button size="sm" variant="outline" onClick={() => {
              const params = new URLSearchParams({
                facility_name: engagement.facility_name || '',
                admin_name: engagement.admin_name || '',
                admin_email: engagement.admin_email || '',
                engagement_id: engagement.id || '',
                prospect_id: engagement.prospect_id || '',
              });
              window.location.href = `/retainers/new?${params.toString()}`;
            }}>
              <RefreshCw className="w-3 h-3 mr-1" /> Convert to Retainer
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Status Tracker</CardTitle>
                <span className="text-xs text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5 mt-2" />
            </CardHeader>
            <CardContent className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-md hover:bg-secondary/50 transition-colors">
                  <Checkbox checked={m.completed} onCheckedChange={() => toggleMilestone(i)} />
                  <div className="flex-1">
                    <span className={`text-sm ${m.completed ? 'line-through text-muted-foreground' : 'font-medium'}`}>{m.type}</span>
                  </div>
                  {m.completed_date && <span className="text-[10px] text-muted-foreground">{m.completed_date}</span>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data Request Tracker */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Data Requests</CardTitle>
                <span className="text-xs text-muted-foreground">{receivedData}/{dataRequests.length} received</span>
              </div>
              <Progress value={dataProgress} className="h-1.5 mt-2" />
            </CardHeader>
            <CardContent className="space-y-2">
              {dataRequests.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-md hover:bg-secondary/50 transition-colors">
                  <span className="text-sm">{d.item_name}</span>
                  <Badge className={`text-[10px] cursor-pointer ${dataStatusColors[d.status]}`} onClick={() => cycleDataStatus(i)}>{d.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Guarantee Tracker */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Guarantee Tracker
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={guaranteeMet ? 'bg-success/10 text-success' : threshold === 0 ? 'bg-secondary' : 'bg-destructive/10 text-destructive'}>
                    {threshold === 0 ? 'Pending' : guaranteeMet ? 'Met' : 'Not Met'}
                  </Badge>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowGuaranteeForm(v => !v)}>
                    <Plus className="w-3 h-3 mr-1" />Add Item
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showGuaranteeForm && (
                <div className="mb-4 p-3 rounded-md border bg-secondary/30 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Input className="mt-1 h-8 text-sm" placeholder="e.g. PPI Variance" value={newGuarantee.category} onChange={e => setNewGuarantee(g => ({ ...g, category: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="text-xs">Stated Amount ($)</Label>
                      <Input className="mt-1 h-8 text-sm" type="number" placeholder="0" value={newGuarantee.stated_amount} onChange={e => setNewGuarantee(g => ({ ...g, stated_amount: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Confidence</Label>
                    <Select value={newGuarantee.confidence} onValueChange={v => setNewGuarantee(g => ({ ...g, confidence: v }))}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High (1.0×)</SelectItem>
                        <SelectItem value="Medium">Medium (0.5×)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addGuaranteeItem} className="h-7 text-xs">Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowGuaranteeForm(false)} className="h-7 text-xs">Cancel</Button>
                  </div>
                </div>
              )}
              {guaranteeItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No guarantee items entered yet</p>
              ) : (
                <div className="space-y-2">
                  {guaranteeItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded-md bg-secondary/30">
                      <span>{item.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">${item.stated_amount?.toLocaleString()}</span>
                        <Badge variant="secondary" className="text-[10px]">{item.confidence}</Badge>
                        <span className="font-medium text-xs">${item.weighted_amount?.toLocaleString()}</span>
                        <button onClick={() => removeGuaranteeItem(i)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t mt-2 text-sm font-medium">
                    <span>Weighted Total</span>
                    <span>${weightedTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3× Fee Threshold</span>
                    <span>${threshold.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Internal Notes</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a timestamped note…" className="text-sm min-h-[60px]" />
                <Button size="sm" onClick={addNote} disabled={!noteText.trim()} className="self-end">Add</Button>
              </div>
              {engagement.internal_notes ? (
                <pre className="text-xs whitespace-pre-wrap text-muted-foreground bg-secondary/30 rounded-md p-3">{engagement.internal_notes}</pre>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">No notes yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Deliverables */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Deliverables</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {deliverables.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md bg-secondary/30">
                  <span className="text-sm">{d.name}</span>
                  <Badge
                    className={`text-[10px] cursor-pointer ${
                      d.status === 'Complete' ? 'bg-success/10 text-success' :
                      d.status === 'In Progress' ? 'bg-primary/10 text-primary' :
                      'bg-secondary text-secondary-foreground'
                    }`}
                    onClick={() => cycleDeliverableStatus(i)}
                  >{d.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <DocumentsPanel
            record={engagement}
            recordType="engagement"
            onSave={(updates) => updateMutation.mutate(updates)}
          />

          {/* On-Site Logistics */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">On-Site Logistics</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><p className="text-xs text-muted-foreground">Date</p><p>{engagement.on_site_date ? format(new Date(engagement.on_site_date), 'MMM d, yyyy') : 'Not scheduled'}</p></div>
              <div><p className="text-xs text-muted-foreground">Operator</p><p>{engagement.operator_name || '—'}</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
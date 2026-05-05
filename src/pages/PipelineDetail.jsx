import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, ExternalLink, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';
import DocumentsPanel from '@/components/documents/DocumentsPanel';
import PublicLinkPanel from '@/components/sharing/PublicLinkPanel';

const STAGES = [
  'Discovery Call Scheduled', 'Discovery Complete', 'Proposal Call Scheduled',
  'Proposal Presented', 'SOW Sent', 'SOW Signed', 'Deposit Received', 'Active Engagement'
];

export default function PipelineDetail() {
  const id = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isOperator, isVA } = useCurrentUser();
  const [showBant, setShowBant] = useState(false);
  const [callNote, setCallNote] = useState('');

  const { data: record, isLoading } = useQuery({
    queryKey: ['pipeline-record', id],
    queryFn: async () => {
      const list = await base44.entities.PipelineRecord.filter({ id });
      return list[0];
    },
    enabled: !!id && id !== 'new',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.PipelineRecord.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline-record', id] }),
  });

  const handleStageChange = (stage) => {
    const postDiscoveryStages = ['Proposal Call Scheduled', 'Proposal Presented', 'SOW Sent', 'SOW Signed', 'Deposit Received', 'Active Engagement'];
    if (postDiscoveryStages.includes(stage) && (!record.bant_score || record.bant_score === 0)) {
      setShowBant(true);
      return;
    }
    const history = [...(record.stage_history || []), { stage, date: new Date().toISOString(), changed_by: '' }];
    updateMutation.mutate({ stage, stage_history: history });
  };

  const handleBantSubmit = (bant) => {
    const score = ['bant_budget', 'bant_authority', 'bant_need', 'bant_timeline']
      .reduce((s, k) => s + (bant[k] === 'Pass' ? 1 : 0), 0);
    updateMutation.mutate({ ...bant, bant_score: score });
    setShowBant(false);
  };

  const handleAddCallNote = () => {
    if (!callNote.trim()) return;
    const notes = [...(record.call_notes || []), { date: new Date().toISOString(), notes: callNote, type: 'call', author: '' }];
    updateMutation.mutate({ call_notes: notes });
    setCallNote('');
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!record) return <div className="text-center py-20 text-muted-foreground">Record not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/pipeline')}><ArrowLeft className="w-4 h-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{record.facility_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge>{record.stage}</Badge>
              {record.prospect_id && (
                <Link to={`/prospects/${record.prospect_id}`} className="text-xs text-primary flex items-center gap-1">
                  View Prospect <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isVA && record.stage === 'Deposit Received' && (
            <Button size="sm" onClick={() => {
              const params = new URLSearchParams({
                prospect_id: record.prospect_id || '',
                pipeline_record_id: record.id,
                facility_name: record.facility_name,
                admin_name: record.admin_name || '',
                fee: record.proposed_fee || '',
                sow_signed_url: record.sow_signed_url || '',
                sow_signed_date: record.sow_signed_date || '',
                freshbooks_deposit_invoice_url: record.freshbooks_deposit_invoice_url || '',
                freshbooks_deposit_invoice_number: record.freshbooks_deposit_invoice_number || '',
              });
              navigate(`/engagements/new?${params.toString()}`);
            }}>
              <Briefcase className="w-3.5 h-3.5 mr-1" /> Start Engagement
            </Button>
          )}
          {!isVA && (
            <Select value={record.stage} onValueChange={handleStageChange} disabled={isOperator && ['SOW Sent', 'SOW Signed'].includes(record.stage)}>
              <SelectTrigger className="w-52 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {isVA && <Badge variant="outline" className="text-xs">{record.stage}</Badge>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* BANT Score — hidden from VA */}
          {!isVA && <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">BANT Score</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">{record.bant_score || 0}/4</span>
                <Button size="sm" variant="outline" onClick={() => setShowBant(true)}>Edit BANT</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: 'budget', label: 'Budget' },
                  { key: 'authority', label: 'Authority' },
                  { key: 'need', label: 'Need' },
                  { key: 'timeline', label: 'Timeline' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <Badge variant="secondary" className={`text-xs mt-1 ${
                      record[`bant_${key}`] === 'Pass' ? 'bg-success/10 text-success' :
                      record[`bant_${key}`] === 'Fail' ? 'bg-destructive/10 text-destructive' :
                      record[`bant_${key}`] === 'Conditional' ? 'bg-warning/10 text-warning' : ''
                    }`}>
                      {record[`bant_${key}`] || 'Not scored'}
                    </Badge>
                    {record[`bant_${key}_notes`] && <p className="text-xs text-muted-foreground mt-1">{record[`bant_${key}_notes`]}</p>}
                  </div>
                ))}
              </div>
              {record.verbatim_pain_point && (
                <div className="mt-4 p-3 rounded-md bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Verbatim Pain Point</p>
                  <p className="text-sm italic">"{record.verbatim_pain_point}"</p>
                </div>
              )}
            </CardContent>
          </Card>}

          {/* Call Notes */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Call Notes</CardTitle></CardHeader>
            <CardContent>
              {!isVA && (
                <div className="flex gap-2 mb-4">
                  <Textarea value={callNote} onChange={e => setCallNote(e.target.value)} placeholder="Add call notes…" className="text-sm min-h-[60px]" />
                  <Button size="sm" onClick={handleAddCallNote} className="self-end">Add</Button>
                </div>
              )}
              {(record.call_notes || []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No call notes yet</p>
              ) : (
                <div className="space-y-3">
                  {(record.call_notes || []).sort((a, b) => new Date(b.date) - new Date(a.date)).map((note, i) => (
                    <div key={i} className="p-3 rounded-md bg-secondary/50">
                      <p className="text-xs text-muted-foreground">{note.date ? format(new Date(note.date), 'MMM d, yyyy h:mm a') : ''}</p>
                      <p className="text-sm mt-1">{note.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stage History */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Stage History</CardTitle></CardHeader>
            <CardContent>
              {(record.stage_history || []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No stage changes recorded</p>
              ) : (
                <div className="space-y-2">
                  {(record.stage_history || []).sort((a, b) => new Date(b.date) - new Date(a.date)).map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{entry.date ? format(new Date(entry.date), 'MMM d') : ''}</span>
                      <Badge variant="secondary" className="text-[10px]">{entry.stage}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Deal Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Contact</p><p className="font-medium">{record.admin_name || '—'}</p></div>
              {!isVA && <div><p className="text-xs text-muted-foreground">Proposed Fee</p><p className="font-medium">{record.proposed_fee ? `$${record.proposed_fee.toLocaleString()}` : '—'}</p></div>}
              <div><p className="text-xs text-muted-foreground">Kickoff Window</p><p>{record.proposed_kickoff_window || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Assigned To</p><p>{record.assigned_to || '—'}</p></div>
              <div><p className="text-xs text-muted-foreground">Next Action</p><p>{record.next_action || '—'}</p></div>
              {record.next_action_date && (
                <div><p className="text-xs text-muted-foreground">Due</p><p>{format(new Date(record.next_action_date), 'MMM d, yyyy')}</p></div>
              )}
            </CardContent>
          </Card>

          <DocumentsPanel
            record={record}
            recordType="pipeline"
            onSave={(updates) => updateMutation.mutate(updates)}
            readOnly={isVA}
          />

          {!isVA && (
            <PublicLinkPanel
              resourceType="sow"
              resourceId={record.id}
              defaultRecipientEmail={record.admin_email || ''}
              defaultRecipientName={record.admin_name || ''}
              disabled={!record.sow_generated_url}
              disabledReason="Upload the SOW PDF (set sow_generated_url) before issuing a review link."
            />
          )}

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Decision Makers</CardTitle></CardHeader>
            <CardContent>
              {(record.decision_makers || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">None added</p>
              ) : (
                <div className="space-y-2">
                  {record.decision_makers.map((dm, i) => (
                    <div key={i} className="text-sm"><p className="font-medium">{dm.name}</p><p className="text-xs text-muted-foreground">{dm.role}</p></div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BANT Modal */}
      {showBant && <BantForm record={record} onSubmit={handleBantSubmit} onClose={() => setShowBant(false)} />}
    </div>
  );
}

function BantForm({ record, onSubmit, onClose }) {
  const [form, setForm] = useState({
    bant_budget: record.bant_budget || '',
    bant_budget_notes: record.bant_budget_notes || '',
    bant_authority: record.bant_authority || '',
    bant_authority_notes: record.bant_authority_notes || '',
    bant_need: record.bant_need || '',
    bant_need_notes: record.bant_need_notes || '',
    bant_timeline: record.bant_timeline || '',
    bant_timeline_notes: record.bant_timeline_notes || '',
    verbatim_pain_point: record.verbatim_pain_point || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.verbatim_pain_point.trim()) return;
    onSubmit(form);
  };

  const criteria = [
    { key: 'budget', label: 'Budget' },
    { key: 'authority', label: 'Authority' },
    { key: 'need', label: 'Need' },
    { key: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader><CardTitle>BANT Scoring</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {criteria.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-medium">{label}</Label>
                <RadioGroup value={form[`bant_${key}`]} onValueChange={v => set(`bant_${key}`, v)} className="flex gap-4">
                  {['Pass', 'Conditional', 'Fail'].map(opt => (
                    <div key={opt} className="flex items-center gap-1.5">
                      <RadioGroupItem value={opt} id={`${key}-${opt}`} />
                      <Label htmlFor={`${key}-${opt}`} className="text-xs">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <Input placeholder="Notes…" value={form[`bant_${key}_notes`]} onChange={e => set(`bant_${key}_notes`, e.target.value)} className="text-sm" />
              </div>
            ))}
            <div>
              <Label className="text-sm font-medium">Verbatim Pain Point *</Label>
              <Textarea value={form.verbatim_pain_point} onChange={e => set('verbatim_pain_point', e.target.value)} placeholder="Exact words the prospect used…" className="mt-1 text-sm" required />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save BANT</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
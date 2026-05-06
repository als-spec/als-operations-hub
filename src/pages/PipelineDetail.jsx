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
import { ArrowLeft, ExternalLink, Briefcase, FileText, ShieldCheck } from 'lucide-react';
import { safeHref } from '@/lib/utils';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';
import DocumentsPanel from '@/components/documents/DocumentsPanel';
import PublicLinkPanel from '@/components/sharing/PublicLinkPanel';
import PublicLinkActivity from '@/components/sharing/PublicLinkActivity';
import SowGenerator from '@/components/pipeline/SowGenerator';

const STAGES = [
  'Discovery Call Scheduled', 'Discovery Complete', 'Proposal Call Scheduled',
  'Proposal Presented', 'SOW Sent', 'SOW Signed', 'Deposit Received', 'Active Engagement'
];

export default function PipelineDetail() {
  const id = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isOperator, isVA, isFounder, user } = useCurrentUser();
  const [showBant, setShowBant] = useState(false);
  const [showSowGenerator, setShowSowGenerator] = useState(false);
  const [callNote, setCallNote] = useState('');

  const { data: record, isLoading } = useQuery({
    queryKey: ['pipeline-record', id],
    queryFn: async () => {
      const list = await base44.entities.PipelineRecord.filter({ id });
      return list[0];
    },
    enabled: !!id && id !== 'new',
  });

  const { data: prospect } = useQuery({
    queryKey: ['prospect', record?.prospect_id],
    queryFn: async () => {
      if (!record?.prospect_id) return null;
      const list = await base44.entities.Prospect.filter({ id: record.prospect_id });
      return list[0];
    },
    enabled: !!record?.prospect_id,
  });

  const { data: settings } = useQuery({
    queryKey: ['practice-settings'],
    queryFn: async () => {
      const list = await base44.entities.PracticeSettings.filter({});
      return list[0];
    },
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
          {/* SOW generation hidden once a signature exists, to prevent overwriting
              the document the recipient agreed to. The sow_sha256 audit field
              anchors the bytes (or URL) at sign time; replacing the URL after
              would silently desync the audit trail. */}
          {user?.role === 'founder' && record.stage === 'Proposal Presented' && !record.sow_signed_at && (
            <Button size="sm" variant="outline" onClick={() => setShowSowGenerator(true)}>
              <FileText className="w-3.5 h-3.5 mr-1" /> Generate Service Agreement
            </Button>
          )}
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
                // Clickwrap audit fields — carry forward to engagement so the
                // signature receipt remains visible alongside delivery work.
                sow_signed_at: record.sow_signed_at || '',
                sow_signed_by_name: record.sow_signed_by_name || '',
                sow_signed_by_email: record.sow_signed_by_email || '',
                sow_signed_ip: record.sow_signed_ip || '',
                sow_signed_user_agent: record.sow_signed_user_agent || '',
                sow_sha256: record.sow_sha256 || '',
                sow_signature_token_id: record.sow_signature_token_id || '',
                sow_signature_receipt_url: record.sow_signature_receipt_url || '',
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

          {!isVA && record.sow_signed_at && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success" /> Signature Receipt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="grid grid-cols-[7rem_1fr] gap-y-1.5">
                  <span className="text-muted-foreground">Signed by</span>
                  <span className="font-medium">{record.sow_signed_by_name || '—'}</span>
                  <span className="text-muted-foreground">Email</span>
                  <span>{record.sow_signed_by_email || '—'}</span>
                  <span className="text-muted-foreground">Signed at</span>
                  <span>{format(new Date(record.sow_signed_at), 'PPpp')}</span>
                  {record.sow_signed_ip && (
                    <>
                      <span className="text-muted-foreground">IP</span>
                      <span className="font-mono text-[10px]">{record.sow_signed_ip}</span>
                    </>
                  )}
                  {record.sow_sha256 && (
                    <>
                      <span className="text-muted-foreground">Doc hash</span>
                      <span className="font-mono text-[10px] break-all">{record.sow_sha256}</span>
                    </>
                  )}
                  {record.sow_signature_token_id && (
                    <>
                      <span className="text-muted-foreground">Token</span>
                      <span className="font-mono text-[10px] break-all">{record.sow_signature_token_id}</span>
                    </>
                  )}
                </div>
                {record.sow_signature_receipt_url && (
                  <div className="pt-2 border-t border-border">
                    <a
                      href={safeHref(record.sow_signature_receipt_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Download receipt PDF
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isFounder && (
            <PublicLinkActivity
              resourceType="sow"
              resourceId={record.id}
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

      {/* SOW Generator Modal */}
      {showSowGenerator && (
        <SowGenerator
          record={record}
          prospect={prospect}
          settings={settings}
          onClose={() => setShowSowGenerator(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['pipeline-record', id] });
            setShowSowGenerator(false);
          }}
        />
      )}
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
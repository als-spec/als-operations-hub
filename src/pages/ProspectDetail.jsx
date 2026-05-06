import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Phone, Mail, Linkedin, Clock, Plus, ExternalLink, Send, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';

const stages = ['Target', 'Outreach Sent', 'Replied', 'Discovery Call Scheduled', 'In Pipeline', 'Stale 90-Day', 'Stale 6-Month', 'Disqualified'];
const tierColors = { A: 'bg-teal text-navy', B: 'bg-primary text-white', C: 'bg-secondary text-secondary-foreground' };

const EDITABLE_FIELDS = [
  'admin_name', 'admin_email', 'admin_phone', 'admin_linkedin',
  'or_count', 'specialty_focus', 'estimated_supply_spend', 'gpo_affiliation', 'county',
];

const pickEditable = (p) => EDITABLE_FIELDS.reduce((acc, k) => {
  acc[k] = p?.[k] ?? '';
  return acc;
}, {});

export default function ProspectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const prospectId = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [noteText, setNoteText] = useState('');
  const [formData, setFormData] = useState(pickEditable(null));

  const { data: prospect, isLoading } = useQuery({
    queryKey: ['prospect', prospectId],
    queryFn: async () => {
      const list = await base44.entities.Prospect.filter({ id: prospectId });
      return list[0];
    },
    enabled: !!prospectId && prospectId !== 'new',
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['prospect-activities', prospectId],
    queryFn: () => base44.entities.ProspectActivity.filter({ prospect_id: prospectId }, '-created_date', 50),
    enabled: !!prospectId && prospectId !== 'new',
  });

  const { data: outreachHistory = [] } = useQuery({
    queryKey: ['prospect-outreach', prospectId],
    queryFn: () => base44.entities.OutreachSequence.filter({ prospect_id: prospectId }, '-sent_date', 20),
    enabled: !!prospectId && prospectId !== 'new',
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Prospect.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prospect', prospectId] }),
  });

  useEffect(() => {
    if (prospect) setFormData(pickEditable(prospect));
  }, [prospect]);

  const isDirty = useMemo(() => {
    if (!prospect) return false;
    const baseline = pickEditable(prospect);
    return EDITABLE_FIELDS.some(k => String(formData[k] ?? '') !== String(baseline[k] ?? ''));
  }, [formData, prospect]);

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!isDirty) return;
    const payload = {};
    EDITABLE_FIELDS.forEach(k => {
      let val = formData[k];
      if (k === 'or_count' || k === 'estimated_supply_spend') {
        val = val === '' || val === null || val === undefined ? null : parseInt(val, 10);
        if (Number.isNaN(val)) val = null;
      } else if (val === '') {
        val = null;
      }
      payload[k] = val;
    });
    updateMutation.mutate({ id: prospectId, data: payload });
  };

  const handleCancel = () => {
    setFormData(pickEditable(prospect));
  };

  const addActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.ProspectActivity.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospect-activities', prospectId] });
      setNoteText('');
    },
  });

  const handleStageChange = (stage) => {
    updateMutation.mutate({ id: prospectId, data: { stage } });
    addActivityMutation.mutate({
      prospect_id: prospectId,
      type: 'stage_change',
      content: `Stage changed to ${stage}`,
    });
  };

  const handleTierChange = (tier) => {
    updateMutation.mutate({ id: prospectId, data: { tier } });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addActivityMutation.mutate({
      prospect_id: prospectId,
      type: 'note',
      content: noteText,
    });
  };

  const handleMoveToPipeline = () => {
    handleStageChange('In Pipeline');
    navigate(`/pipeline/new?prospect_id=${prospectId}`);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!prospect) {
    return <div className="text-center py-20 text-muted-foreground">Prospect not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/prospects')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{prospect.facility_name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {prospect.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {prospect.address}
                </span>
              )}
              {prospect.county && <span>· {prospect.county} County</span>}
              {prospect.drive_time_woodstock && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {prospect.drive_time_woodstock} from Woodstock
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={prospect.tier || 'C'} onValueChange={handleTierChange}>
            <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Tier A</SelectItem>
              <SelectItem value="B">Tier B</SelectItem>
              <SelectItem value="C">Tier C</SelectItem>
            </SelectContent>
          </Select>
          <Select value={prospect.stage || 'Target'} onValueChange={handleStageChange}>
            <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isDirty && (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-2 rounded-md border border-primary/30 bg-primary/5 shadow-sm">
          <p className="text-sm text-foreground">You have unsaved changes</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={updateMutation.isPending}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="w-4 h-4 mr-1" /> {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-sm font-semibold">Contact Information</CardTitle>
             </CardHeader>
             <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
               <div>
                 <p className="text-xs text-muted-foreground">Administrator</p>
                 <Input
                   value={formData.admin_name ?? ''}
                   onChange={(e) => handleFieldChange('admin_name', e.target.value)}
                   className="text-sm mt-1"
                   placeholder="Name"
                 />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">Email</p>
                 <Input
                   value={formData.admin_email ?? ''}
                   onChange={(e) => handleFieldChange('admin_email', e.target.value)}
                   className="text-sm mt-1"
                   placeholder="Email"
                 />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">Phone</p>
                 <Input
                   value={formData.admin_phone ?? ''}
                   onChange={(e) => handleFieldChange('admin_phone', e.target.value)}
                   className="text-sm mt-1"
                   placeholder="Phone"
                 />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">LinkedIn</p>
                 <Input
                   value={formData.admin_linkedin ?? ''}
                   onChange={(e) => handleFieldChange('admin_linkedin', e.target.value)}
                   className="text-sm mt-1"
                   placeholder="LinkedIn URL"
                 />
               </div>
             </CardContent>
           </Card>

          {/* Facility Profile */}
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-sm font-semibold">Facility Profile</CardTitle>
             </CardHeader>
             <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
               <div>
                 <p className="text-xs text-muted-foreground">Operating Rooms</p>
                 <Input
                   type="number"
                   value={formData.or_count ?? ''}
                   onChange={(e) => handleFieldChange('or_count', e.target.value)}
                   className="text-sm mt-1"
                   placeholder="Count"
                 />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">Specialty Focus</p>
                 <Input
                   value={formData.specialty_focus ?? ''}
                   onChange={(e) => handleFieldChange('specialty_focus', e.target.value)}
                   className="text-sm mt-1"
                   placeholder="Specialty"
                 />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">Est. Supply Spend</p>
                 <Input
                   type="number"
                   value={formData.estimated_supply_spend ?? ''}
                   onChange={(e) => handleFieldChange('estimated_supply_spend', e.target.value)}
                   className="text-sm mt-1"
                   placeholder="Amount"
                 />
               </div>
               <div>
                 <p className="text-xs text-muted-foreground">GPO Affiliation</p>
                 <Input
                   value={formData.gpo_affiliation ?? ''}
                   onChange={(e) => handleFieldChange('gpo_affiliation', e.target.value)}
                   className="text-sm mt-1"
                   placeholder="GPO"
                 />
               </div>
               <div className="sm:col-span-2">
                 <p className="text-xs text-muted-foreground">County</p>
                 <Input
                   value={formData.county ?? ''}
                   onChange={(e) => handleFieldChange('county', e.target.value)}
                   className="text-sm mt-1"
                   placeholder="County"
                 />
               </div>
             </CardContent>
           </Card>

          {/* Outreach History */}
          {outreachHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Send className="w-4 h-4" /> Outreach History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {outreachHistory.map((o, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-secondary/30 text-sm">
                    <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded flex-shrink-0">
                      {o.channel} #{o.touch_number || '?'}
                    </span>
                    <p className="flex-1 truncate text-xs">{o.subject_line || '—'}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{o.sent_date ? format(new Date(o.sent_date), 'MMM d') : ''}</span>
                    <Badge className={`text-[10px] flex-shrink-0 ${
                      o.status === 'Replied' ? 'bg-success/10 text-success' :
                      o.status === 'Opened' ? 'bg-primary/10 text-primary' :
                      o.status === 'Bounced' ? 'bg-destructive/10 text-destructive' :
                      'bg-secondary text-secondary-foreground'
                    }`}>{o.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Textarea
                  placeholder="Add a note…"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  className="text-sm min-h-[60px]"
                />
                <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()} className="self-end">Add</Button>
              </div>
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activities.map(a => (
                    <div key={a.id} className="flex gap-3 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {a.created_date ? format(new Date(a.created_date), 'MMM d, yyyy h:mm a') : ''} · {a.type}
                          {a.created_by && ` · ${a.created_by}`}
                        </p>
                        <p className="mt-0.5">{a.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm" onClick={() => {
                addActivityMutation.mutate({ prospect_id: prospectId, type: 'outreach', content: 'Outreach logged' });
                base44.entities.OutreachSequence.create({
                  prospect_id: prospectId,
                  facility_name: prospect.facility_name,
                  channel: 'Email',
                  sent_date: new Date().toISOString().split('T')[0],
                  status: 'Sent',
                  touch_number: 1,
                });
                if (prospect.stage === 'Target') handleStageChange('Outreach Sent');
              }}>Log Outreach</Button>
              <Button variant="outline" className="w-full justify-start text-sm" onClick={() => navigate(`/schedule/new?prospect_id=${prospectId}&type=Discovery Call`)}>Schedule Call</Button>
              <Button variant="outline" className="w-full justify-start text-sm" onClick={handleMoveToPipeline}>Move to Pipeline</Button>
              <Button variant="outline" className="w-full justify-start text-sm text-destructive" onClick={() => handleStageChange('Disqualified')}>Mark Unqualified</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Current Stage</p>
                <Badge className="mt-1">{prospect.stage || 'Target'}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tier</p>
                <Badge className={`mt-1 ${tierColors[prospect.tier] || tierColors.C}`}>{prospect.tier || 'C'}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Contact</p>
                <p>{prospect.last_contact_date ? format(new Date(prospect.last_contact_date), 'MMM d, yyyy') : 'Never'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Action</p>
                <p>{prospect.next_action_date ? format(new Date(prospect.next_action_date), 'MMM d, yyyy') : 'None set'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Phone, Mail, Linkedin, Building, Clock, Plus, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/lib/useCurrentUser';

const stages = ['Target', 'Outreach Sent', 'Replied', 'Discovery Call Scheduled', 'In Pipeline', 'Stale 90-Day', 'Stale 6-Month', 'Disqualified'];
const tierColors = { A: 'bg-teal text-navy', B: 'bg-primary text-white', C: 'bg-secondary text-secondary-foreground' };

export default function ProspectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const prospectId = window.location.pathname.split('/').pop();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const [noteText, setNoteText] = useState('');

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Prospect.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prospect', prospectId] }),
  });

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
                <p className="font-medium">{prospect.admin_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                {prospect.admin_email ? (
                  <a href={`mailto:${prospect.admin_email}`} className="text-primary flex items-center gap-1">{prospect.admin_email} <Mail className="w-3 h-3" /></a>
                ) : <p>—</p>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p>{prospect.admin_phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">LinkedIn</p>
                {prospect.admin_linkedin ? (
                  <a href={prospect.admin_linkedin} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1">Profile <ExternalLink className="w-3 h-3" /></a>
                ) : <p>—</p>}
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
                <p className="font-medium">{prospect.or_count || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Specialty Focus</p>
                <p className="font-medium">{prospect.specialty_focus || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Supply Spend</p>
                <p className="font-medium">{prospect.estimated_supply_spend ? `$${prospect.estimated_supply_spend.toLocaleString()}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">GPO Affiliation</p>
                <p className="font-medium">{prospect.gpo_affiliation || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Physician Owners</p>
                {prospect.physician_owners?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {prospect.physician_owners.map((po, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{po.name}</Badge>
                    ))}
                  </div>
                ) : <p>—</p>}
              </div>
            </CardContent>
          </Card>

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
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Send, Search, Mail, Linkedin, Phone, LayoutList, Users } from 'lucide-react';
import { format } from 'date-fns';
import OutreachForm from '@/components/outreach/OutreachForm';

const statusColors = {
  Sent: 'bg-secondary text-secondary-foreground',
  Opened: 'bg-primary/10 text-primary',
  Replied: 'bg-success/10 text-success',
  Bounced: 'bg-destructive/10 text-destructive',
  'No Response': 'bg-warning/10 text-warning',
};

const channelIcons = {
  Email: Mail,
  LinkedIn: Linkedin,
  Phone: Phone,
  Mail: Mail,
};

export default function Outreach() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [groupByProspect, setGroupByProspect] = useState(false);

  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ['outreach'],
    queryFn: () => base44.entities.OutreachSequence.list('-sent_date'),
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => base44.entities.Prospect.list('-created_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OutreachSequence.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outreach'] }),
  });

  const filtered = sequences.filter(s => {
    const matchSearch = !search || s.facility_name?.toLowerCase().includes(search.toLowerCase()) || s.subject_line?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: sequences.length,
    replied: sequences.filter(s => s.status === 'Replied').length,
    open: sequences.filter(s => s.status === 'Opened').length,
    pending: sequences.filter(s => s.next_follow_up_date && new Date(s.next_follow_up_date) <= new Date()).length,
  };

  const cycleStatus = (seq) => {
    const statuses = ['Sent', 'Opened', 'Replied', 'No Response', 'Bounced'];
    const next = statuses[(statuses.indexOf(seq.status) + 1) % statuses.length];
    updateMutation.mutate({ id: seq.id, data: { status: next } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Prospect contact sequences and follow-up cadence</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setGroupByProspect(g => !g)}>
            {groupByProspect ? <LayoutList className="w-4 h-4 mr-1" /> : <Users className="w-4 h-4 mr-1" />}
            {groupByProspect ? 'Flat' : 'By Prospect'}
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Log Outreach
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Touches</p><p className="text-2xl font-bold mt-1">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Replies</p><p className="text-2xl font-bold mt-1 text-success">{stats.replied}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Opened</p><p className="text-2xl font-bold mt-1 text-primary">{stats.open}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Follow-ups Due</p><p className="text-2xl font-bold mt-1 text-warning">{stats.pending}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search facility or subject…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Opened">Opened</SelectItem>
            <SelectItem value="Replied">Replied</SelectItem>
            <SelectItem value="No Response">No Response</SelectItem>
            <SelectItem value="Bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Send className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No outreach logged yet.</p>
        </div>
      ) : groupByProspect ? (
        // Grouped view
        <div className="space-y-4">
          {Object.entries(
            filtered.reduce((acc, seq) => {
              const key = seq.facility_name || 'Unknown';
              if (!acc[key]) acc[key] = [];
              acc[key].push(seq);
              return acc;
            }, {})
          ).sort(([a], [b]) => a.localeCompare(b)).map(([facility, touches]) => (
            <Card key={facility}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{facility}</CardTitle>
                  <span className="text-xs text-muted-foreground">{touches.length} touch{touches.length !== 1 ? 'es' : ''}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {touches.sort((a, b) => (a.touch_number || 0) - (b.touch_number || 0)).map(seq => {
                    const Icon = channelIcons[seq.channel] || Mail;
                    const isFollowUpDue = seq.next_follow_up_date && new Date(seq.next_follow_up_date) <= new Date();
                    return (
                      <div key={seq.id} className="flex items-center gap-4 px-4 py-2.5 hover:bg-secondary/30 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {seq.touch_number && <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">#{seq.touch_number}</span>}
                            {seq.subject_line && <p className="text-xs text-muted-foreground truncate">{seq.subject_line}</p>}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground flex-shrink-0">{seq.sent_date ? format(new Date(seq.sent_date), 'MMM d') : '—'}</p>
                        {seq.next_follow_up_date && (
                          <p className={`text-[10px] flex-shrink-0 ${isFollowUpDue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            FU: {format(new Date(seq.next_follow_up_date), 'MMM d')}
                          </p>
                        )}
                        <Badge className={`text-[10px] cursor-pointer flex-shrink-0 ${statusColors[seq.status]}`} onClick={() => cycleStatus(seq)}>{seq.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Flat view
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filtered.map(seq => {
                const Icon = channelIcons[seq.channel] || Mail;
                const isFollowUpDue = seq.next_follow_up_date && new Date(seq.next_follow_up_date) <= new Date();
                return (
                  <div key={seq.id} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/30 transition-colors">
                    <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{seq.facility_name}</p>
                        {seq.touch_number && <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">Touch #{seq.touch_number}</span>}
                      </div>
                      {seq.subject_line && <p className="text-xs text-muted-foreground truncate">{seq.subject_line}</p>}
                    </div>
                    <div className="text-right space-y-1 flex-shrink-0">
                      <p className="text-xs text-muted-foreground">{seq.sent_date ? format(new Date(seq.sent_date), 'MMM d') : '—'}</p>
                      {seq.next_follow_up_date && (
                        <p className={`text-[10px] ${isFollowUpDue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          FU: {format(new Date(seq.next_follow_up_date), 'MMM d')}
                        </p>
                      )}
                    </div>
                    <Badge className={`text-[10px] cursor-pointer flex-shrink-0 ${statusColors[seq.status]}`} onClick={() => cycleStatus(seq)}>{seq.status}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <OutreachForm
          prospects={prospects}
          onClose={() => setShowForm(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['outreach'] }); setShowForm(false); }}
        />
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Search, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function EmailLog({ emails, isLoading, onRefetch }) {
  const [search, setSearch] = useState('');
  const [filterTemplate, setFilterTemplate] = useState('');
  const [filterReplied, setFilterReplied] = useState('');
  const [expanded, setExpanded] = useState(null);
  const qc = useQueryClient();

  const markRepliedMutation = useMutation({
    mutationFn: ({ id, replied }) => base44.entities.EmailSent.update(id, { replied, reply_date: replied ? new Date().toISOString().split('T')[0] : '' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emails-sent'] }); onRefetch(); },
  });

  const filtered = emails.filter(e => {
    const matchSearch = !search || e.to_address?.toLowerCase().includes(search.toLowerCase()) || e.subject?.toLowerCase().includes(search.toLowerCase()) || e.linked_record_name?.toLowerCase().includes(search.toLowerCase());
    const matchTemplate = !filterTemplate || e.template_used === filterTemplate;
    const matchReplied = !filterReplied || (filterReplied === 'replied' ? e.replied : !e.replied);
    return matchSearch && matchTemplate && matchReplied;
  });

  const templates = [...new Set(emails.map(e => e.template_used).filter(Boolean))];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4" />Sent Email Log
            <Badge variant="secondary" className="text-[10px]">{emails.length}</Badge>
          </CardTitle>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input className="pl-8 h-8 text-xs" placeholder="Search emails…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterTemplate} onValueChange={setFilterTemplate}>
            <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="All Templates" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Templates</SelectItem>
              {templates.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterReplied} onValueChange={setFilterReplied}>
            <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="no-reply">No Reply</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No emails found.</p>
        ) : (
          <div className="space-y-1">
            {filtered.map(email => (
              <div key={email.id} className="border border-border rounded-md overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                  onClick={() => setExpanded(expanded === email.id ? null : email.id)}
                >
                  {expanded === email.id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{email.subject}</span>
                      {email.replied && <Badge className="bg-success/10 text-success text-[10px]">Replied</Badge>}
                      {email.template_used && <Badge variant="outline" className="text-[10px]">{email.template_used}</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      To: {email.to_name || email.to_address}
                      {email.linked_record_name && ` · ${email.linked_record_name}`}
                      {email.sent_at && ` · ${format(new Date(email.sent_at), 'MMM d, yyyy h:mm a')}`}
                    </p>
                  </div>
                </button>
                {expanded === email.id && (
                  <div className="border-t border-border px-4 py-3 bg-secondary/10 space-y-3">
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p><span className="font-medium text-foreground">To:</span> {email.to_name ? `${email.to_name} <${email.to_address}>` : email.to_address}</p>
                      <p><span className="font-medium text-foreground">Sent by:</span> {email.sent_by}</p>
                      {email.linked_record_name && <p><span className="font-medium text-foreground">Linked to:</span> {email.linked_record_name} ({email.linked_record_type})</p>}
                    </div>
                    <div className="bg-card border border-border rounded p-3 text-sm whitespace-pre-wrap">{email.body}</div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={email.replied ? 'secondary' : 'outline'}
                        className="h-7 text-xs gap-1"
                        onClick={() => markRepliedMutation.mutate({ id: email.id, replied: !email.replied })}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {email.replied ? 'Mark Not Replied' : 'Mark as Replied'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
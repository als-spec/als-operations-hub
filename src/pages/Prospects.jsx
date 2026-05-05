import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const tierColors = { A: 'bg-teal text-navy', B: 'bg-primary text-white', C: 'bg-secondary text-secondary-foreground' };
const stageColors = {
  'Target': 'bg-secondary text-secondary-foreground',
  'Outreach Sent': 'bg-cobalt/10 text-cobalt',
  'Replied': 'bg-teal/10 text-teal',
  'Discovery Call Scheduled': 'bg-navy/10 text-navy',
  'In Pipeline': 'bg-success/10 text-success',
  'Stale 90-Day': 'bg-warning/10 text-warning',
  'Stale 6-Month': 'bg-destructive/10 text-destructive',
  'Disqualified': 'bg-muted text-muted-foreground',
};

export default function Prospects() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');
  const [sortField, setSortField] = useState('facility_name');
  const [sortDir, setSortDir] = useState(1);

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => base44.entities.Prospect.list('-updated_date', 200),
  });

  const counties = useMemo(() => {
    const all = prospects.map(p => p.county).filter(Boolean);
    return [...new Set(all)].sort();
  }, [prospects]);

  const filtered = useMemo(() => {
    let result = prospects.filter(p => {
      const matchesSearch = !search ||
        p.facility_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.admin_name?.toLowerCase().includes(search.toLowerCase());
      const matchesTier = tierFilter === 'all' || p.tier === tierFilter;
      const matchesStage = stageFilter === 'all' || p.stage === stageFilter;
      const matchesCounty = countyFilter === 'all' || p.county === countyFilter;
      return matchesSearch && matchesTier && matchesStage && matchesCounty;
    });
    result.sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      return (aVal > bVal ? 1 : -1) * sortDir;
    });
    return result;
  }, [prospects, search, tierFilter, stageFilter, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d * -1);
    else { setSortField(field); setSortDir(1); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prospects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{prospects.length} facilities tracked</p>
        </div>
        <Button onClick={() => navigate('/prospects/new')} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Prospect
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search facilities or contacts…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-28 h-9 text-sm"><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="A">Tier A</SelectItem>
            <SelectItem value="B">Tier B</SelectItem>
            <SelectItem value="C">Tier C</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.keys(stageColors).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={countyFilter} onValueChange={setCountyFilter}>
          <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="County" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counties</SelectItem>
            {counties.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('facility_name')}>
                <span className="flex items-center gap-1">Facility <ArrowUpDown className="w-3 h-3" /></span>
              </TableHead>
              <TableHead>County</TableHead>
              <TableHead>ORs</TableHead>
              <TableHead>Administrator</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('last_contact_date')}>
                <span className="flex items-center gap-1">Last Contact <ArrowUpDown className="w-3 h-3" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('next_action_date')}>
                <span className="flex items-center gap-1">Next Action <ArrowUpDown className="w-3 h-3" /></span>
              </TableHead>
              <TableHead>Stale?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">No prospects found</TableCell></TableRow>
            ) : (
              filtered.map(p => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-sm">
                    <button onClick={() => navigate(`/prospects/${p.id}`)} className="text-cobalt hover:underline cursor-pointer">
                      {p.facility_name}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.county || '—'}</TableCell>
                  <TableCell className="text-sm">{p.or_count || '—'}</TableCell>
                  <TableCell className="text-sm">{p.admin_name || '—'}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${tierColors[p.tier] || tierColors.C}`}>{p.tier || 'C'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] ${stageColors[p.stage] || ''}`}>{p.stage || 'Target'}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                   {p.last_contact_date ? format(new Date(p.last_contact_date), 'MMM d') : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                  {p.next_action_date ? format(new Date(p.next_action_date), 'MMM d') : '—'}
                  </TableCell>
                  <TableCell>
                   {(() => {
                     if (!p.last_contact_date) return null;
                     const days = differenceInDays(new Date(), new Date(p.last_contact_date));
                     if (days >= 180) return <Badge className="text-[10px] bg-destructive/10 text-destructive">Stale 180d</Badge>;
                     if (days >= 90) return <Badge className="text-[10px] bg-warning/10 text-warning">Stale 90d</Badge>;
                     return null;
                   })()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
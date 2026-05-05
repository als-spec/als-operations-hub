import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const healthColors = {
  Green: 'bg-success/10 text-success',
  Yellow: 'bg-warning/10 text-warning',
  Red: 'bg-destructive/10 text-destructive',
};

const statusColors = {
  Active: 'bg-teal/10 text-teal',
  'At Risk': 'bg-warning/10 text-warning',
  Churned: 'bg-destructive/10 text-destructive',
  Paused: 'bg-secondary text-secondary-foreground',
};

export default function Retainers() {
  const navigate = useNavigate();
  const { data: retainers = [], isLoading } = useQuery({
    queryKey: ['retainers'],
    queryFn: () => base44.entities.Retainer.list('-created_date'),
  });

  const active = retainers.filter(r => r.status === 'Active');
  const totalMRR = active.reduce((sum, r) => sum + (r.mrr || 0), 0);
  const atRisk = retainers.filter(r => r.status === 'At Risk').length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Retainers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Post-engagement recurring client relationships</p>
        </div>
        <Button size="sm" onClick={() => navigate('/retainers/new')}>
          <Plus className="w-4 h-4 mr-1" /> New Retainer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Retainers</p>
          <p className="text-2xl font-bold mt-1">{active.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total MRR</p>
          <p className="text-2xl font-bold mt-1">${totalMRR.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">At Risk</p>
          <p className="text-2xl font-bold mt-1 text-warning">{atRisk}</p>
        </CardContent></Card>
      </div>

      {/* Retainer Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : retainers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No retainers yet. Convert a completed engagement to start.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {retainers.map(r => {
            const daysToRenewal = r.renewal_date ? differenceInDays(new Date(r.renewal_date), new Date()) : null;
            return (
              <Link key={r.id} to={`/retainers/${r.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm leading-tight">{r.facility_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.admin_name}</p>
                      </div>
                      <Badge className={`text-[10px] flex-shrink-0 ${statusColors[r.status]}`}>{r.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">MRR</p>
                        <p className="text-xl font-bold">${r.mrr?.toLocaleString()}</p>
                      </div>
                      <Badge className={`text-[10px] ${healthColors[r.health_score || 'Green']}`}>{r.health_score || 'Green'}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-3">
                      <div>
                        <p className="font-medium text-foreground">Renewal</p>
                        <p>{r.renewal_date ? format(new Date(r.renewal_date), 'MMM d, yyyy') : '—'}</p>
                        {daysToRenewal !== null && daysToRenewal <= 60 && (
                          <p className={`font-medium mt-0.5 ${daysToRenewal <= 30 ? 'text-destructive' : 'text-warning'}`}>
                            {daysToRenewal}d away
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Next QBR</p>
                        <p>{r.next_qbr_date ? format(new Date(r.next_qbr_date), 'MMM d, yyyy') : '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
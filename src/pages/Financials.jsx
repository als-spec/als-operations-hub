import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, TrendingUp, DollarSign, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Financials() {
  const { isFounder } = useCurrentUser();

  const { data: retainers = [] } = useQuery({
    queryKey: ['retainers'],
    queryFn: () => base44.entities.Retainer.list('-created_date'),
    enabled: isFounder,
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements'],
    queryFn: () => base44.entities.Engagement.list('-created_date'),
    enabled: isFounder,
  });

  const { data: pipeline = [] } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => base44.entities.PipelineRecord.list('-created_date'),
    enabled: isFounder,
  });

  if (!isFounder) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Lock className="w-8 h-8 mb-3" />
        <p className="text-sm font-medium">Access Restricted</p>
        <p className="text-xs mt-1">This module is only available to the Founder role.</p>
      </div>
    );
  }

  const activeRetainers = retainers.filter(r => r.status === 'Active');
  const mrr = activeRetainers.reduce((s, r) => s + (r.mrr || 0), 0);
  const mrrTarget = 25000;

  const activeEngagements = engagements.filter(e => e.status === 'Active');
  const depositPending = activeEngagements.filter(e => !e.deposit_received);
  const balancePending = activeEngagements.filter(e => e.deposit_received && !e.balance_received);
  const outstandingAR = [
    ...depositPending.map(e => ({ label: `${e.facility_name} — Deposit`, amount: (e.fee || 0) * 0.5 })),
    ...balancePending.map(e => ({ label: `${e.facility_name} — Balance`, amount: (e.fee || 0) * 0.5 })),
  ];
  const totalAR = outstandingAR.reduce((s, i) => s + i.amount, 0);

  const pipelineValue = pipeline.reduce((s, p) => s + (p.proposed_fee || 0), 0);

  const completedEngagements = engagements.filter(e => e.status === 'Complete');
  const ytdRevenue = completedEngagements.reduce((s, e) => s + (e.fee || 0), 0) + (mrr * 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financials</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Live revenue view — FreshBooks remains the source of truth for invoicing</p>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Current MRR</p>
            <p className="text-2xl font-bold mt-1">${mrr.toLocaleString()}</p>
            <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((mrr / mrrTarget) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{Math.round((mrr / mrrTarget) * 100)}% of ${mrrTarget.toLocaleString()} target</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pipeline Value</p>
            <p className="text-2xl font-bold mt-1">${pipelineValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{pipeline.length} active deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Outstanding AR</p>
            <p className="text-2xl font-bold mt-1">${totalAR.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{outstandingAR.length} open invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">YTD Revenue (est.)</p>
            <p className="text-2xl font-bold mt-1">${ytdRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{completedEngagements.length} completed engagements</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Outstanding AR Detail */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" /> Outstanding AR
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outstandingAR.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No outstanding invoices</p>
            ) : (
              <div className="space-y-2">
                {outstandingAR.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <p className="text-sm">{item.label}</p>
                    <p className="text-sm font-semibold">${item.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retainer MRR Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Retainer MRR Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeRetainers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active retainers</p>
            ) : (
              <div className="space-y-2">
                {activeRetainers.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{r.facility_name}</p>
                      <p className="text-xs text-muted-foreground">{r.renewal_date ? `Renews ${format(new Date(r.renewal_date), 'MMM yyyy')}` : 'No renewal set'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={r.health_score === 'Green' ? 'bg-success/10 text-success' : r.health_score === 'Yellow' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}>
                        {r.health_score}
                      </Badge>
                      <p className="text-sm font-semibold">${r.mrr?.toLocaleString()}/mo</p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-semibold text-sm">
                  <span>Total MRR</span>
                  <span>${mrr.toLocaleString()}/mo</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
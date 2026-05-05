import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export default function Financials() {
  const { isFounder } = useCurrentUser();

  if (!isFounder) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Lock className="w-8 h-8 mb-3" />
        <p className="text-sm font-medium">Access Restricted</p>
        <p className="text-xs mt-1">This module is only available to the Founder role.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financials</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Revenue tracking and invoice management</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Current MRR</p><p className="text-2xl font-bold mt-1">$0</p><p className="text-xs text-muted-foreground">Target: $25,000</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pipeline Value</p><p className="text-2xl font-bold mt-1">$0</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Outstanding AR</p><p className="text-2xl font-bold mt-1">$0</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">YTD Revenue</p><p className="text-2xl font-bold mt-1">$0</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Financial data will populate as engagements and retainers are tracked.
          <br />
          <span className="text-xs">This is an operations view — FreshBooks remains the financial source of truth.</span>
        </CardContent>
      </Card>
    </div>
  );
}
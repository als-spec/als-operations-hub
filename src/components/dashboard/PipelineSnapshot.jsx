import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

const stageOrder = [
  'Discovery Call Scheduled', 'Discovery Complete', 'Proposal Call Scheduled',
  'Proposal Presented', 'SOW Sent', 'SOW Signed', 'Deposit Received'
];

export default function PipelineSnapshot({ records }) {
  const stageCounts = {};
  let totalValue = 0;
  stageOrder.forEach(s => { stageCounts[s] = 0; });
  records.forEach(r => {
    if (r.stage && r.stage !== 'Active Engagement') {
      stageCounts[r.stage] = (stageCounts[r.stage] || 0) + 1;
      totalValue += r.proposed_fee || 0;
    }
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            Pipeline
          </CardTitle>
          <span className="text-sm font-bold text-primary">${totalValue.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {stageOrder.map(stage => {
            const count = stageCounts[stage] || 0;
            const shortLabel = stage.replace('Call Scheduled', 'Call').replace('Scheduled', 'Sched.');
            return (
              <div key={stage} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate">{shortLabel}</span>
                <span className={`font-medium ${count > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
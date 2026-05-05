import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STAGE_PROBABILITY = {
  'Discovery Call Scheduled': 0.10,
  'Discovery Complete': 0.20,
  'Proposal Call Scheduled': 0.35,
  'Proposal Presented': 0.50,
  'SOW Sent': 0.70,
  'SOW Signed': 0.85,
  'Deposit Received': 0.95,
  'Active Engagement': 1.0,
};

export default function RevenueForecast({ pipeline, retainers }) {
  const activeMRR = retainers.filter(r => r.status === 'Active').reduce((s, r) => s + (r.mrr || 0), 0);

  const pipelineData = useMemo(() => {
    return pipeline.map(p => ({
      facility: p.facility_name,
      stage: p.stage,
      fee: p.proposed_fee || 0,
      probability: STAGE_PROBABILITY[p.stage] || 0,
      weighted: Math.round((p.proposed_fee || 0) * (STAGE_PROBABILITY[p.stage] || 0)),
    })).sort((a, b) => b.weighted - a.weighted);
  }, [pipeline]);

  const totalPipeline = pipelineData.reduce((s, p) => s + p.fee, 0);
  const weightedPipeline = pipelineData.reduce((s, p) => s + p.weighted, 0);

  const chartData = Object.entries(STAGE_PROBABILITY).map(([stage, prob]) => {
    const items = pipelineData.filter(p => p.stage === stage);
    return {
      stage: stage.replace(' ', '\n'),
      value: items.reduce((s, p) => s + p.weighted, 0),
      count: items.length,
    };
  }).filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Recurring MRR</p>
            <p className="text-2xl font-bold text-primary">${activeMRR.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">from active retainers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Pipeline Value</p>
            <p className="text-2xl font-bold">${totalPipeline.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{pipelineData.length} opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Weighted Forecast</p>
            <p className="text-2xl font-bold text-success">${weightedPipeline.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">probability-adjusted</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pipeline by Stage (Weighted Value)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Weighted Value']} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {pipelineData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pipeline Detail</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0">
              {pipelineData.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{p.facility}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{p.stage}</span>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="font-semibold">${p.weighted.toLocaleString()}</span>
                    <span className="text-muted-foreground text-xs ml-1">({Math.round(p.probability * 100)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
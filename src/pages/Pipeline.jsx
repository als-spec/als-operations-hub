import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LayoutGrid, List, Clock, DollarSign } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';

const STAGES = [
  'Discovery Call Scheduled', 'Discovery Complete', 'Proposal Call Scheduled',
  'Proposal Presented', 'SOW Sent', 'SOW Signed', 'Deposit Received'
];

const stageShort = {
  'Discovery Call Scheduled': 'Discovery Sched.',
  'Discovery Complete': 'Discovery Done',
  'Proposal Call Scheduled': 'Proposal Sched.',
  'Proposal Presented': 'Presented',
  'SOW Sent': 'SOW Sent',
  'SOW Signed': 'SOW Signed',
  'Deposit Received': 'Deposit Recv.'
};

export default function Pipeline() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [view, setView] = useState('board');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['pipeline-records'],
    queryFn: () => base44.entities.PipelineRecord.list('-updated_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PipelineRecord.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipeline-records'] }),
  });

  const activeRecords = records.filter(r => r.stage !== 'Active Engagement');

  const getStageColor = (record) => {
    const days = differenceInCalendarDays(new Date(), new Date(record.updated_date));
    if (days >= 10) return 'border-l-destructive';
    if (days >= 5) return 'border-l-warning';
    return 'border-l-success';
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeRecords.length} deals · ${activeRecords.reduce((s, r) => s + (r.proposed_fee || 0), 0).toLocaleString()} total value
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={setView}>
            <TabsList className="h-8">
              <TabsTrigger value="board" className="text-xs px-2"><LayoutGrid className="w-3.5 h-3.5" /></TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-2"><List className="w-3.5 h-3.5" /></TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => navigate('/pipeline/new')} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Deal
          </Button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageRecords = activeRecords.filter(r => r.stage === stage);
            return (
              <div key={stage} className="min-w-[240px] w-[240px] flex-shrink-0">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stageShort[stage]}</h3>
                  <Badge variant="secondary" className="text-[10px]">{stageRecords.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageRecords.map(record => (
                    <Card
                      key={record.id}
                      className={`p-3 cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getStageColor(record)}`}
                      onClick={() => navigate(`/pipeline/${record.id}`)}
                    >
                      <p className="text-sm font-medium mb-1">{record.facility_name}</p>
                      <p className="text-xs text-muted-foreground">{record.admin_name || '—'}</p>
                      <div className="flex items-center justify-between mt-2">
                        {record.proposed_fee ? (
                          <span className="text-xs font-medium flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />{record.proposed_fee.toLocaleString()}
                          </span>
                        ) : <span />}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {differenceInCalendarDays(new Date(), new Date(record.updated_date))}d
                        </span>
                      </div>
                    </Card>
                  ))}
                  {stageRecords.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Facility</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Contact</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Stage</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Fee</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">BANT</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Days</th>
              </tr>
            </thead>
            <tbody>
              {activeRecords.map(r => (
                <tr key={r.id} className="border-b cursor-pointer hover:bg-muted/50">
                   <td className="p-3 font-medium">
                     <button onClick={() => navigate(`/pipeline/${r.id}`)} className="text-cobalt hover:underline cursor-pointer">
                       {r.facility_name}
                     </button>
                   </td>
                  <td className="p-3 text-muted-foreground">{r.admin_name || '—'}</td>
                  <td className="p-3"><Badge variant="secondary" className="text-[10px]">{stageShort[r.stage]}</Badge></td>
                  <td className="p-3 font-medium">{r.proposed_fee ? `$${r.proposed_fee.toLocaleString()}` : '—'}</td>
                  <td className="p-3">{r.bant_score || 0}/4</td>
                  <td className="p-3 text-muted-foreground">{differenceInCalendarDays(new Date(), new Date(r.updated_date))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
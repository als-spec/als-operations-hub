import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import TodaySchedule from '@/components/dashboard/TodaySchedule';
import PipelineSnapshot from '@/components/dashboard/PipelineSnapshot';
import ActiveEngagements from '@/components/dashboard/ActiveEngagements';
import UpcomingTasks from '@/components/dashboard/UpcomingTasks';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Briefcase } from 'lucide-react';

export default function Dashboard() {
  const { user, isFounder } = useCurrentUser();

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => base44.entities.CalendarEvent.list('-scheduled_date', 50),
  });

  const { data: pipelineRecords = [] } = useQuery({
    queryKey: ['pipeline-records'],
    queryFn: () => base44.entities.PipelineRecord.list('-updated_date', 50),
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements'],
    queryFn: () => base44.entities.Engagement.list('-updated_date', 50),
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects-count'],
    queryFn: () => base44.entities.Prospect.list('-updated_date', 50),
  });

  const activeEngagements = engagements.filter(e => e.status === 'Active');
  const totalPipelineValue = pipelineRecords
    .filter(r => r.stage !== 'Active Engagement')
    .reduce((sum, r) => sum + (r.proposed_fee || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Prospects</p>
                <p className="text-2xl font-bold mt-1">{prospects.length}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pipeline Value</p>
                <p className="text-2xl font-bold mt-1">${totalPipelineValue.toLocaleString()}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-teal" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Engagements</p>
                <p className="text-2xl font-bold mt-1">{activeEngagements.length}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        {isFounder && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">MRR Target</p>
                  <p className="text-2xl font-bold mt-1">$0</p>
                  <p className="text-[10px] text-muted-foreground">of $25K target</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TodaySchedule events={events} />
          <ActiveEngagements engagements={engagements} />
        </div>
        <div className="space-y-6">
          <PipelineSnapshot records={pipelineRecords} />
          <UpcomingTasks events={events} pipelineRecords={pipelineRecords} />
        </div>
      </div>
    </div>
  );
}
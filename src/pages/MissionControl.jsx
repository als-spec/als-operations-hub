import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CommandView from '@/components/mission/CommandView';
import DiagnosticPanel from '@/components/mission/DiagnosticPanel';
import HealthMonitor from '@/components/mission/HealthMonitor';
import ActionLogPanel from '@/components/mission/ActionLogPanel';

export default function MissionControl() {
  const queryClient = useQueryClient();

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['mc-calendar-events'],
    queryFn: () => base44.entities.CalendarEvent.list('-scheduled_date', 200),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['mc-invoices'],
    queryFn: () => base44.entities.Invoice.list('-issue_date', 200),
  });

  const { data: pipelineRecords = [] } = useQuery({
    queryKey: ['mc-pipeline'],
    queryFn: () => base44.entities.PipelineRecord.list('-created_date', 200),
  });

  const { data: outreachSequences = [] } = useQuery({
    queryKey: ['mc-outreach'],
    queryFn: () => base44.entities.OutreachSequence.list('-sent_date', 200),
  });

  const { data: weeklyChecks = [], refetch: refetchWeekly } = useQuery({
    queryKey: ['mc-weekly-checks'],
    queryFn: () => base44.entities.WeeklyHealthCheck.list('-week_ending', 20),
  });

  const { data: actionLogs = [], refetch: refetchActions } = useQuery({
    queryKey: ['mc-action-logs'],
    queryFn: () => base44.entities.ActionLog.list('-review_date', 100),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-8 rounded-sm bg-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Surgical Practice Solutions — KPI Command Center
          </p>
        </div>
      </div>

      {/* Section 1 */}
      <CommandView
        calendarEvents={calendarEvents}
        invoices={invoices}
        pipelineRecords={pipelineRecords}
        weeklyChecks={weeklyChecks}
        onStoryUpdate={refetchWeekly}
      />

      {/* Section 2 */}
      <DiagnosticPanel
        calendarEvents={calendarEvents}
        pipelineRecords={pipelineRecords}
        outreachSequences={outreachSequences}
      />

      {/* Section 3 */}
      <HealthMonitor
        weeklyChecks={weeklyChecks}
        onRefetch={refetchWeekly}
      />

      {/* Section 4 */}
      <ActionLogPanel
        actionLogs={actionLogs}
        onRefetch={refetchActions}
      />
    </div>
  );
}
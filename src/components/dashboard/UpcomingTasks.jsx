import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';
import { format, isBefore, addDays, startOfDay } from 'date-fns';

export default function UpcomingTasks({ events, pipelineRecords }) {
  const now = startOfDay(new Date());
  const weekOut = addDays(now, 7);

  const tasks = [];

  events.forEach(e => {
    if (e.status === 'Scheduled' && e.scheduled_date) {
      const d = new Date(e.scheduled_date);
      // Include overdue (past) OR within next 7 days
      if (isBefore(d, now) || isBefore(d, weekOut)) {
        tasks.push({ id: e.id, label: e.title, date: e.scheduled_date, type: 'event', overdue: isBefore(d, now) });
      }
    }
  });

  pipelineRecords.forEach(p => {
    if (p.next_action_date && p.next_action) {
      const d = new Date(p.next_action_date);
      // Include overdue (past) OR within next 7 days
      if (isBefore(d, now) || isBefore(d, weekOut)) {
        tasks.push({ id: p.id, label: `${p.facility_name}: ${p.next_action}`, date: p.next_action_date, type: 'pipeline', overdue: isBefore(d, now) });
      }
    }
  });

  tasks.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          Upcoming Tasks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">All clear for the week</p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 8).map(task => (
              <div key={task.id} className="flex items-start gap-2 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${task.overdue ? 'bg-destructive' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${task.overdue ? 'text-destructive' : ''}`}>{task.label}</p>
                  <p className={`${task.overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    {task.overdue ? `Overdue · ${format(new Date(task.date), 'MMM d')}` : format(new Date(task.date), 'MMM d')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
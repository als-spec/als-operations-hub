import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { differenceInCalendarDays } from 'date-fns';
import { Link } from 'react-router-dom';

export default function ActiveEngagements({ engagements }) {
  const active = engagements.filter(e => e.status === 'Active');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Active Engagements
          <span className="ml-auto text-xs font-normal text-muted-foreground">{active.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No active engagements</p>
        ) : (
          <div className="space-y-3">
            {active.map(eng => {
              const completedMilestones = (eng.milestones || []).filter(m => m.completed).length;
              const totalMilestones = (eng.milestones || []).length || 5;
              const progress = Math.round((completedMilestones / totalMilestones) * 100);
              const daysLeft = eng.delivery_target ? differenceInCalendarDays(new Date(eng.delivery_target), new Date()) : null;

              return (
                <Link to={`/engagements/${eng.id}`} key={eng.id} className="block p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium">{eng.facility_name}</span>
                    {daysLeft !== null && (
                      <span className={`text-[10px] font-medium ${daysLeft < 3 ? 'text-destructive' : daysLeft < 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    )}
                  </div>
                  <Progress value={progress} className="h-1.5" />
                  <span className="text-[10px] text-muted-foreground mt-1 block">{progress}% complete</span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
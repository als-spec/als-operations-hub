import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Calendar, User, DollarSign } from 'lucide-react';
import { differenceInCalendarDays, format } from 'date-fns';

const statusColors = {
  'Active': 'bg-teal/10 text-teal border-teal/20',
  'Complete': 'bg-success/10 text-success border-success/20',
  'On Hold': 'bg-warning/10 text-warning border-warning/20',
};

export default function Engagements() {
  const navigate = useNavigate();

  const { data: engagements = [], isLoading } = useQuery({
    queryKey: ['engagements'],
    queryFn: () => base44.entities.Engagement.list('-updated_date', 100),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Engagements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {engagements.filter(e => e.status === 'Active').length} active
          </p>
        </div>
        <Button onClick={() => navigate('/engagements/new')} size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Engagement
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : engagements.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">No engagements yet</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {engagements.map(eng => {
            const completedMs = (eng.milestones || []).filter(m => m.completed).length;
            const totalMs = (eng.milestones || []).length || 5;
            const progress = Math.round((completedMs / totalMs) * 100);
            const daysLeft = eng.delivery_target ? differenceInCalendarDays(new Date(eng.delivery_target), new Date()) : null;
            const currentWeek = eng.kickoff_date ? Math.max(1, Math.ceil(differenceInCalendarDays(new Date(), new Date(eng.kickoff_date)) / 7)) : null;

            return (
              <Card key={eng.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/engagements/${eng.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                     <div>
                       <button onClick={() => navigate(`/engagements/${eng.id}`)} className="font-semibold text-sm text-cobalt hover:underline cursor-pointer">
                         {eng.facility_name}
                       </button>
                      <Badge variant="outline" className={`text-[10px] mt-1 ${statusColors[eng.status] || ''}`}>{eng.status}</Badge>
                    </div>
                    {currentWeek && <Badge variant="secondary" className="text-[10px]">Week {currentWeek}</Badge>}
                  </div>

                  <div className="space-y-2 mb-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {eng.kickoff_date ? format(new Date(eng.kickoff_date), 'MMM d') : '—'}
                      {eng.delivery_target && <> → {format(new Date(eng.delivery_target), 'MMM d')}</>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3" />{eng.fee ? `$${eng.fee.toLocaleString()}` : '—'}
                    </div>
                    {eng.operator_name && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3" />{eng.operator_name}
                      </div>
                    )}
                  </div>

                  <Progress value={progress} className="h-1.5" />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{progress}% complete</span>
                    {daysLeft !== null && (
                      <span className={`text-[10px] font-medium ${daysLeft < 0 ? 'text-destructive' : daysLeft < 5 ? 'text-warning' : 'text-muted-foreground'}`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video } from 'lucide-react';
import { format } from 'date-fns';

const typeColors = {
  'Discovery Call': 'bg-navy text-white',
  'Proposal Call': 'bg-cobalt text-white',
  'Kickoff Call': 'bg-teal text-navy',
  'On-Site Walkthrough': 'bg-success text-white',
  'Findings Presentation': 'bg-warning text-white',
  'Retainer Review': 'bg-purple-600 text-white',
  'QBR': 'bg-muted text-muted-foreground',
  'Other': 'bg-secondary text-secondary-foreground',
};

export default function TodaySchedule({ events }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEvents = events.filter(e => e.scheduled_date === today);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No events today</p>
        ) : (
          <div className="space-y-2">
            {todayEvents.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-2.5 rounded-md bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="text-xs font-medium text-muted-foreground w-12">{event.scheduled_time || '—'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{event.title}</p>
                  <Badge className={`text-[10px] mt-1 ${typeColors[event.type] || typeColors['Other']}`}>
                    {event.type}
                  </Badge>
                </div>
                {event.call_link && <Video className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
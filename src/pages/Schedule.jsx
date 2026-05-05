import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ChevronLeft, ChevronRight, Video, MapPin } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday
} from 'date-fns';

const typeColors = {
  'Discovery Call': 'bg-navy text-white',
  'Proposal Call': 'bg-cobalt text-white',
  'Kickoff Call': 'bg-teal text-navy',
  'On-Site Walkthrough': 'bg-success text-white',
  'Findings Presentation': 'bg-warning text-white',
  'Retainer Review': 'bg-purple-600 text-white',
  'QBR': 'bg-muted-foreground text-white',
  'Other': 'bg-secondary text-secondary-foreground',
};

const typeDots = {
  'Discovery Call': 'bg-navy',
  'Proposal Call': 'bg-cobalt',
  'Kickoff Call': 'bg-teal',
  'On-Site Walkthrough': 'bg-success',
  'Findings Presentation': 'bg-warning',
  'Retainer Review': 'bg-purple-600',
  'QBR': 'bg-muted-foreground',
  'Other': 'bg-secondary-foreground',
};

export default function Schedule() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => base44.entities.CalendarEvent.list('-scheduled_date', 200),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (e.scheduled_date) {
        const key = e.scheduled_date;
        if (!map[key]) map[key] = [];
        map[key].push(e);
      }
    });
    return map;
  }, [events]);

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedEvents = selectedDateStr ? (eventsByDate[selectedDateStr] || []) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <Button onClick={() => navigate('/schedule/new')} size="sm" className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Event
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                <h2 className="text-sm font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
                <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="w-4 h-4" /></Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDate[dateStr] || [];
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const today = isToday(day);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[80px] p-1.5 text-left flex flex-col transition-colors ${
                        isSelected ? 'bg-primary/5' : 'bg-card hover:bg-secondary/50'
                      } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                    >
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        today ? 'bg-primary text-primary-foreground' : ''
                      }`}>
                        {format(day, 'd')}
                      </span>
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((e, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${typeDots[e.type] || typeDots['Other']}`} />
                        ))}
                        {dayEvents.length > 3 && <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Detail Panel */}
        <div>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">
                {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}
              </h3>
              {!selectedDate ? (
                <p className="text-xs text-muted-foreground">Click a date to see events</p>
              ) : selectedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No events on this day</p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map(event => (
                    <div key={event.id} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-[10px] ${typeColors[event.type] || typeColors['Other']}`}>{event.type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{event.status}</Badge>
                      </div>
                      <p className="text-sm font-medium">{event.title}</p>
                      {event.scheduled_time && <p className="text-xs text-muted-foreground">{event.scheduled_time} · {event.duration_minutes || 30} min</p>}
                      {event.attendees && <p className="text-xs text-muted-foreground">{event.attendees}</p>}
                      <div className="flex gap-2">
                        {event.call_link && (
                          <a href={event.call_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1"><Video className="w-3 h-3" />Join</a>
                        )}
                        {event.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
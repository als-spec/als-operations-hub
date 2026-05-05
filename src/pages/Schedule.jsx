import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ChevronLeft, ChevronRight, Video, MapPin, ExternalLink, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  addWeeks, subWeeks, isToday, parseISO
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

const PRE_CALL_CHECKLISTS = {
  'Discovery Call': ['Review prospect profile & tier', 'Check LinkedIn activity', 'Prepare BANT questions', 'Test Zoom link'],
  'Proposal Call': ['Prepare sample diagnostic screenshare', 'Confirm physician-owner attendees', 'Review pain point notes', 'Test Zoom link'],
  'Kickoff Call': ['Send data request package', 'Confirm on-site date', 'Share engagement timeline', 'Test Zoom link'],
  'On-Site Walkthrough': ['Print facility map', 'Prepare walkthrough checklist (6 items)', 'Confirm drive time from Woodstock', 'Bring data request forms', 'Review OR count & specialty focus', 'Dress code: business casual'],
  'Findings Presentation': ['Confirm guarantee threshold status', 'Prepare retainer proposal if threshold met', 'Confirm physician-owner attendance', 'Test screenshare'],
  'Retainer Review': ['Pull latest dashboard data', 'Review savings realized', 'Prepare agenda', 'Test Zoom link'],
  'QBR': ['Prepare savings summary', 'Review contract compliance audit', 'Prepare QBR deck', 'Confirm all attendees'],
};

export default function Schedule() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => base44.entities.CalendarEvent.list('-scheduled_date', 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });

  // Month view days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const monthDays = eachDayOfInterval({ start: calStart, end: calEnd });

  // Week view days
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (e.scheduled_date) {
        if (!map[e.scheduled_date]) map[e.scheduled_date] = [];
        map[e.scheduled_date].push(e);
      }
    });
    return map;
  }, [events]);

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedEvents = selectedDateStr ? (eventsByDate[selectedDateStr] || []) : [];

  const handlePrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setSelectedEvent(null);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  const handleMarkComplete = (event) => {
    updateMutation.mutate({ id: event.id, data: { status: 'Completed' } });
    setSelectedEvent(ev => ev?.id === event.id ? { ...ev, status: 'Completed' } : ev);
  };

  const toggleChecklist = (eventId, idx) => {
    setCheckedItems(prev => {
      const key = `${eventId}-${idx}`;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const periodLabel = viewMode === 'month'
    ? format(currentDate, 'MMMM yyyy')
    : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

  const displayEvent = selectedEvent || (selectedEvents.length === 1 ? selectedEvents[0] : null);
  const checklist = displayEvent ? (PRE_CALL_CHECKLISTS[displayEvent.type] || []) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border overflow-hidden text-sm">
            <button
              className={`px-3 py-1.5 ${viewMode === 'month' ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
              onClick={() => setViewMode('month')}
            >Month</button>
            <button
              className={`px-3 py-1.5 border-l ${viewMode === 'week' ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
              onClick={() => setViewMode('week')}
            >Week</button>
          </div>
          <Button onClick={() => navigate('/schedule/new')} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Event
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              {/* Nav */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={handlePrev}><ChevronLeft className="w-4 h-4" /></Button>
                <h2 className="text-sm font-semibold">{periodLabel}</h2>
                <Button variant="ghost" size="icon" onClick={handleNext}><ChevronRight className="w-4 h-4" /></Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Month view */}
              {viewMode === 'month' && (
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {monthDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate[dateStr] || [];
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDayClick(day)}
                        className={`min-h-[80px] p-1.5 text-left flex flex-col transition-colors ${
                          isSelected ? 'bg-primary/5' : 'bg-card hover:bg-secondary/50'
                        } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                      >
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday(day) ? 'bg-primary text-primary-foreground' : ''
                        }`}>{format(day, 'd')}</span>
                        <div className="flex flex-col gap-0.5 mt-1 w-full">
                          {dayEvents.slice(0, 2).map((e, i) => (
                            <button
                              key={i}
                              onClick={(ev) => handleEventClick(ev, e)}
                              className={`text-[9px] truncate rounded px-1 py-0.5 text-left font-medium ${typeColors[e.type] || typeColors['Other']}`}
                            >{e.title}</button>
                          ))}
                          {dayEvents.length > 2 && <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 2} more</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Week view */}
              {viewMode === 'week' && (
                <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                  {weekDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDate[dateStr] || [];
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <button
                        key={dateStr}
                        onClick={() => handleDayClick(day)}
                        className={`min-h-[140px] p-2 text-left flex flex-col gap-1 transition-colors ${
                          isSelected ? 'bg-primary/5' : 'bg-card hover:bg-secondary/50'
                        }`}
                      >
                        <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full self-center ${
                          isToday(day) ? 'bg-primary text-primary-foreground' : ''
                        }`}>{format(day, 'd')}</span>
                        {dayEvents.map((e, i) => (
                          <button
                            key={i}
                            onClick={(ev) => handleEventClick(ev, e)}
                            className={`text-[9px] truncate rounded px-1 py-0.5 text-left font-medium w-full ${typeColors[e.type] || typeColors['Other']}`}
                          >
                            {e.scheduled_time && <span className="mr-1 opacity-80">{e.scheduled_time}</span>}
                            {e.title}
                          </button>
                        ))}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event Detail Panel */}
        <div>
          <Card className="sticky top-20">
            <CardContent className="p-4">
              {!displayEvent && !selectedDate ? (
                <>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Select a date</h3>
                  <p className="text-xs text-muted-foreground">Click a date or event to see details</p>
                </>
              ) : !displayEvent && selectedEvents.length === 0 ? (
                <>
                  <h3 className="text-sm font-semibold mb-2">{selectedDate ? format(selectedDate, 'EEEE, MMM d') : ''}</h3>
                  <p className="text-xs text-muted-foreground">No events on this day</p>
                  <Button size="sm" variant="outline" className="mt-3 w-full text-xs" onClick={() => navigate('/schedule/new')}>
                    <Plus className="w-3 h-3 mr-1" />Add Event
                  </Button>
                </>
              ) : !displayEvent && selectedEvents.length > 1 ? (
                <>
                  <h3 className="text-sm font-semibold mb-3">{selectedDate ? format(selectedDate, 'EEEE, MMM d') : ''}</h3>
                  <div className="space-y-2">
                    {selectedEvents.map(event => (
                      <button key={event.id} onClick={() => setSelectedEvent(event)}
                        className="w-full text-left p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeDots[event.type] || 'bg-secondary-foreground'}`} />
                          <span className="text-xs font-medium truncate">{event.title}</span>
                        </div>
                        {event.scheduled_time && <p className="text-[10px] text-muted-foreground mt-0.5 ml-4">{event.scheduled_time}</p>}
                      </button>
                    ))}
                  </div>
                </>
              ) : displayEvent ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    {selectedEvents.length > 1 && (
                      <button onClick={() => setSelectedEvent(null)} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
                    )}
                    <Badge className={`text-[10px] ${typeColors[displayEvent.type] || typeColors['Other']}`}>{displayEvent.type}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${displayEvent.status === 'Completed' ? 'text-success border-success' : ''}`}>{displayEvent.status}</Badge>
                  </div>
                  <p className="text-sm font-semibold">{displayEvent.title}</p>
                  {displayEvent.scheduled_time && (
                    <p className="text-xs text-muted-foreground">{displayEvent.scheduled_time} · {displayEvent.duration_minutes || 30} min</p>
                  )}
                  {displayEvent.attendees && (
                    <p className="text-xs text-muted-foreground">👥 {displayEvent.attendees}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {displayEvent.call_link && (
                      <a href={displayEvent.call_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
                        <Video className="w-3 h-3" />Join Call
                      </a>
                    )}
                    {displayEvent.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{displayEvent.location}</span>
                    )}
                    {displayEvent.linked_record_id && displayEvent.linked_record_type && (
                      <Link
                        to={`/${displayEvent.linked_record_type === 'prospect' ? 'prospects' : displayEvent.linked_record_type === 'pipeline' ? 'pipeline' : displayEvent.linked_record_type === 'retainer' ? 'retainers' : 'engagements'}/${displayEvent.linked_record_id}`}
                        className="text-xs text-primary flex items-center gap-1"
                      ><ExternalLink className="w-3 h-3" />View Record</Link>
                    )}
                  </div>

                  {/* Pre-call checklist */}
                  {checklist.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pre-Call Checklist</p>
                      <div className="space-y-1.5">
                        {checklist.map((item, idx) => {
                          const key = `${displayEvent.id}-${idx}`;
                          return (
                            <div key={idx} className="flex items-start gap-2">
                              <Checkbox
                                id={key}
                                checked={!!checkedItems[key]}
                                onCheckedChange={() => toggleChecklist(displayEvent.id, idx)}
                                className="mt-0.5 h-3.5 w-3.5"
                              />
                              <label htmlFor={key} className={`text-xs cursor-pointer ${checkedItems[key] ? 'line-through text-muted-foreground' : ''}`}>{item}</label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {displayEvent.notes && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                      <p className="text-xs text-muted-foreground">{displayEvent.notes}</p>
                    </div>
                  )}

                  {/* Post-event action prompts */}
                  {displayEvent.status !== 'Completed' && (
                    <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => handleMarkComplete(displayEvent)}>
                      ✓ Mark as Completed
                    </Button>
                  )}
                  {displayEvent.status === 'Completed' && displayEvent.type === 'Discovery Call' && displayEvent.linked_record_id && (
                    <div className="p-2.5 rounded-md bg-primary/5 border border-primary/20">
                      <p className="text-[10px] font-medium text-primary mb-1.5">Post-Call Action</p>
                      <Link to={`/pipeline/${displayEvent.linked_record_id}`} className="text-xs text-primary underline">
                        → Complete BANT Scoring on Pipeline Record
                      </Link>
                    </div>
                  )}
                  {displayEvent.status === 'Completed' && displayEvent.type === 'Findings Presentation' && displayEvent.linked_record_id && (
                    <div className="p-2.5 rounded-md bg-teal/5 border border-teal/20">
                      <p className="text-[10px] font-medium text-teal mb-1.5">Post-Presentation Action</p>
                      <Link to={`/engagements/${displayEvent.linked_record_id}`} className="text-xs text-teal underline">
                        → Review Guarantee Status & Convert to Retainer
                      </Link>
                    </div>
                  )}
                  {displayEvent.status === 'Completed' && displayEvent.type === 'Proposal Call' && displayEvent.linked_record_id && (
                    <div className="p-2.5 rounded-md bg-warning/5 border border-warning/20">
                      <p className="text-[10px] font-medium text-warning mb-1.5">Post-Call Action</p>
                      <Link to={`/pipeline/${displayEvent.linked_record_id}`} className="text-xs text-warning underline">
                        → Update Pipeline Stage
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
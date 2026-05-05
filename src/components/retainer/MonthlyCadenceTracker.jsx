import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const DEFAULT_CADENCE_ITEMS = [
  'Auto-debit invoice',
  'Dashboard update',
  'Variance review',
  'Review call',
  'Monthly summary email',
];

const statusIcon = {
  Complete: <CheckCircle2 className="w-4 h-4 text-success" />,
  Pending: <Circle className="w-4 h-4 text-muted-foreground" />,
  Overdue: <AlertCircle className="w-4 h-4 text-destructive" />,
};

const statusColors = {
  Complete: 'bg-success/10 text-success',
  Pending: 'bg-secondary text-secondary-foreground',
  Overdue: 'bg-destructive/10 text-destructive',
};

const cycleStatus = (current) => {
  if (current === 'Pending') return 'Complete';
  if (current === 'Complete') return 'Pending';
  if (current === 'Overdue') return 'Complete';
  return 'Pending';
};

export default function MonthlyCadenceTracker({ retainer, onUpdate }) {
  const now = new Date();
  const currentMonth = format(now, 'MMMM yyyy');

  // Ensure cadence is initialized with default items
  const cadence = (retainer.monthly_cadence && retainer.monthly_cadence.length > 0)
    ? retainer.monthly_cadence
    : DEFAULT_CADENCE_ITEMS.map(item => ({ item, status: 'Pending', due_date: '', completed_date: '' }));

  const allDone = cadence.every(c => c.status === 'Complete');
  const overdue = cadence.filter(c => c.status === 'Overdue').length;

  const handleToggle = (idx) => {
    const updated = cadence.map((c, i) => {
      if (i !== idx) return c;
      const newStatus = cycleStatus(c.status);
      return {
        ...c,
        status: newStatus,
        completed_date: newStatus === 'Complete' ? now.toISOString().split('T')[0] : '',
      };
    });
    onUpdate({ monthly_cadence: updated });
  };

  const handleMarkAllOverdue = () => {
    const updated = cadence.map(c => c.status === 'Pending' ? { ...c, status: 'Overdue' } : c);
    onUpdate({ monthly_cadence: updated });
  };

  const handleResetMonth = () => {
    const reset = DEFAULT_CADENCE_ITEMS.map(item => ({ item, status: 'Pending', due_date: '', completed_date: '' }));
    onUpdate({ monthly_cadence: reset });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Monthly Cadence</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">{currentMonth}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={allDone ? 'bg-success/10 text-success' : overdue > 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}>
              {allDone ? 'On Track' : overdue > 0 ? `${overdue} Overdue` : `${cadence.filter(c => c.status === 'Complete').length}/${cadence.length}`}
            </Badge>
            <button onClick={handleResetMonth} className="text-[10px] text-muted-foreground hover:text-foreground underline">Reset</button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {cadence.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-md bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
            onClick={() => handleToggle(idx)}
          >
            <div className="flex items-center gap-2.5">
              {statusIcon[item.status] || statusIcon['Pending']}
              <span className={`text-sm ${item.status === 'Complete' ? 'line-through text-muted-foreground' : ''}`}>{item.item}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.completed_date && <span className="text-[10px] text-muted-foreground">{item.completed_date}</span>}
              <Badge className={`text-[10px] cursor-pointer ${statusColors[item.status] || statusColors['Pending']}`}>
                {item.status}
              </Badge>
            </div>
          </div>
        ))}
        {!allDone && (
          <button onClick={handleMarkAllOverdue} className="text-[11px] text-destructive hover:underline mt-1">
            Mark incomplete as overdue
          </button>
        )}
      </CardContent>
    </Card>
  );
}
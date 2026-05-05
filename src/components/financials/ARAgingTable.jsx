import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, parseISO } from 'date-fns';

const BUCKETS = [
  { label: 'Current (0–30)', min: 0, max: 30, color: 'bg-success/10 text-success' },
  { label: '31–60 Days', min: 31, max: 60, color: 'bg-warning/10 text-warning' },
  { label: '61–90 Days', min: 61, max: 90, color: 'bg-orange-100 text-orange-700' },
  { label: '90+ Days', min: 91, max: Infinity, color: 'bg-destructive/10 text-destructive' },
];

export default function ARAgingTable({ invoices }) {
  const aging = useMemo(() => {
    const open = invoices.filter(i => ['Sent', 'Overdue'].includes(i.status) && i.due_date);
    const today = new Date();

    const bucketed = BUCKETS.map(b => ({
      ...b,
      items: open.filter(i => {
        const days = differenceInDays(today, parseISO(i.due_date));
        return days >= b.min && days <= b.max;
      }),
    }));

    return bucketed;
  }, [invoices]);

  const total = invoices.filter(i => ['Sent', 'Overdue'].includes(i.status)).reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {aging.map(b => (
          <Card key={b.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{b.label}</p>
              <p className="text-xl font-bold">${b.items.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{b.items.length} invoice{b.items.length !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {aging.map(b => b.items.length > 0 && (
        <Card key={b.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge className={b.color}>{b.label}</Badge>
              <span className="font-normal text-muted-foreground">${b.items.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {b.items.map(inv => (
                <div key={inv.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div>
                    <span className="font-medium">{inv.facility_name}</span>
                    {inv.invoice_number && <span className="text-muted-foreground ml-2">#{inv.invoice_number}</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">${(inv.amount || 0).toLocaleString()}</span>
                    <span className="text-muted-foreground text-xs ml-2">due {inv.due_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {total === 0 && (
        <div className="text-center py-12 text-muted-foreground">No open invoices — AR is clear!</div>
      )}
    </div>
  );
}
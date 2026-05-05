import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

export default function RetainerAlerts({ retainers = [] }) {
  const today = new Date();

  const alerts = retainers
    .filter(r => r.status === 'Active' || r.status === 'At Risk')
    .flatMap(r => {
      const items = [];
      if (r.status === 'At Risk') items.push({ id: r.id, label: r.facility_name, msg: 'At Risk', level: 'red' });
      if (r.renewal_date) {
        const days = differenceInDays(new Date(r.renewal_date), today);
        if (days <= 60 && days >= 0) items.push({ id: r.id, label: r.facility_name, msg: `Renews in ${days}d`, level: days <= 30 ? 'red' : 'yellow' });
      }
      if (r.next_qbr_date) {
        const days = differenceInDays(new Date(r.next_qbr_date), today);
        if (days <= 14 && days >= 0) items.push({ id: r.id, label: r.facility_name, msg: `QBR in ${days}d`, level: 'yellow' });
      }
      if (r.health_score === 'Red') items.push({ id: r.id, label: r.facility_name, msg: 'Health: Red', level: 'red' });
      return items;
    });

  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" /> Retainer Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((a, i) => (
          <Link key={i} to={`/retainers/${a.id}`} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors">
            <p className="text-xs font-medium truncate">{a.label}</p>
            <Badge className={`text-[10px] flex-shrink-0 ml-2 ${a.level === 'red' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
              {a.msg}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
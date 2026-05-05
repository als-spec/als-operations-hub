import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const QUARTERLY_ITEMS = ['Contract compliance audit', 'Vendor negotiation(s)', 'QBR'];

const statusColors = {
  Pending: 'bg-secondary text-secondary-foreground',
  'In Progress': 'bg-primary/10 text-primary',
  Complete: 'bg-success/10 text-success',
};

const statusIcon = {
  Pending: <Circle className="w-3.5 h-3.5 text-muted-foreground" />,
  'In Progress': <Clock className="w-3.5 h-3.5 text-primary" />,
  Complete: <CheckCircle2 className="w-3.5 h-3.5 text-success" />,
};

export default function QuarterlyDeliverablesTracker({ retainer, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ item: '', quarter: '', status: 'Pending', notes: '' });

  const deliverables = retainer.quarterly_deliverables || [];

  const currentQuarter = (() => {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${q} ${now.getFullYear()}`;
  })();

  const currentQ = deliverables.filter(d => d.quarter === currentQuarter);

  const handleCycleStatus = (idx) => {
    const updated = deliverables.map((d, i) => {
      if (i !== idx) return d;
      const next = d.status === 'Pending' ? 'In Progress' : d.status === 'In Progress' ? 'Complete' : 'Pending';
      return { ...d, status: next, completed_date: next === 'Complete' ? new Date().toISOString().split('T')[0] : '' };
    });
    onUpdate({ quarterly_deliverables: updated });
  };

  const handleAddItem = () => {
    if (!newItem.item || !newItem.quarter) return;
    onUpdate({ quarterly_deliverables: [...deliverables, newItem] });
    setNewItem({ item: '', quarter: '', status: 'Pending', notes: '' });
    setShowAdd(false);
  };

  const initCurrentQuarter = () => {
    const existing = deliverables.filter(d => d.quarter === currentQuarter);
    const existingItems = existing.map(d => d.item);
    const missing = QUARTERLY_ITEMS.filter(i => !existingItems.includes(i)).map(item => ({
      item, quarter: currentQuarter, status: 'Pending', notes: '',
    }));
    if (missing.length > 0) onUpdate({ quarterly_deliverables: [...deliverables, ...missing] });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Quarterly Deliverables</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">{currentQuarter}</p>
          </div>
          <div className="flex items-center gap-2">
            {currentQ.length === 0 && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={initCurrentQuarter}>
                Init {currentQuarter}
              </Button>
            )}
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAdd(v => !v)}>
              <Plus className="w-3 h-3 mr-1" />Add
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAdd && (
          <div className="p-3 rounded-md border bg-secondary/30 space-y-2 mb-3">
            <Select value={newItem.item} onValueChange={v => setNewItem(i => ({ ...i, item: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select item…" /></SelectTrigger>
              <SelectContent>
                {QUARTERLY_ITEMS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input className="h-8 text-xs" placeholder="Quarter (e.g. Q2 2026)" value={newItem.quarter} onChange={e => setNewItem(i => ({ ...i, quarter: e.target.value }))} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddItem} className="h-7 text-xs">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="h-7 text-xs">Cancel</Button>
            </div>
          </div>
        )}
        {deliverables.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No quarterly deliverables yet. Click "Init {currentQuarter}" to add standard items.</p>
        ) : (
          deliverables.map((d, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-md bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => handleCycleStatus(idx)}
            >
              <div className="flex items-center gap-2">
                {statusIcon[d.status] || statusIcon['Pending']}
                <div>
                  <span className={`text-sm ${d.status === 'Complete' ? 'line-through text-muted-foreground' : ''}`}>{d.item}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">{d.quarter}</span>
                </div>
              </div>
              <Badge className={`text-[10px] ${statusColors[d.status] || statusColors['Pending']}`}>{d.status}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, TrendingUp } from 'lucide-react';

const CATEGORIES = ['PPI Variance', 'Off-Contract', 'GPO Tier Upgrade', 'Inventory Reduction', 'Charge Capture', 'Vendor Renegotiation', 'Other'];

export default function SavingsTracker({ retainer, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ category: '', amount: '', period: '', notes: '' });

  const savings = retainer.savings_realized || [];
  const total = savings.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

  const handleAdd = () => {
    if (!newEntry.category || !newEntry.amount) return;
    onUpdate({ savings_realized: [...savings, { ...newEntry, amount: parseFloat(newEntry.amount) }] });
    setNewEntry({ category: '', amount: '', period: '', notes: '' });
    setShowAdd(false);
  };

  const handleRemove = (idx) => {
    onUpdate({ savings_realized: savings.filter((_, i) => i !== idx) });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-success" /> Savings Realized
            </CardTitle>
            <p className="text-lg font-bold text-success mt-0.5">${total.toLocaleString()}</p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAdd(v => !v)}>
            <Plus className="w-3 h-3 mr-1" />Add Entry
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAdd && (
          <div className="p-3 rounded-md border bg-secondary/30 space-y-2 mb-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={newEntry.category} onValueChange={v => setNewEntry(e => ({ ...e, category: v }))}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input className="mt-1 h-8 text-xs" type="number" placeholder="0" value={newEntry.amount} onChange={e => setNewEntry(n => ({ ...n, amount: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Period (e.g. Q1 2026)</Label>
              <Input className="mt-1 h-8 text-xs" value={newEntry.period} onChange={e => setNewEntry(n => ({ ...n, period: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input className="mt-1 h-8 text-xs" value={newEntry.notes} onChange={e => setNewEntry(n => ({ ...n, notes: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="h-7 text-xs">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="h-7 text-xs">Cancel</Button>
            </div>
          </div>
        )}
        {savings.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No savings entries yet. Add entries at each QBR.</p>
        ) : (
          <>
            {savings.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-md bg-secondary/30">
                <div>
                  <p className="text-sm font-medium">{s.category}</p>
                  {s.period && <p className="text-[10px] text-muted-foreground">{s.period}</p>}
                  {s.notes && <p className="text-[10px] text-muted-foreground italic">{s.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-success">${parseFloat(s.amount || 0).toLocaleString()}</span>
                  <button onClick={() => handleRemove(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t text-sm font-semibold">
              <span>Total Savings Realized</span>
              <span className="text-success">${total.toLocaleString()}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
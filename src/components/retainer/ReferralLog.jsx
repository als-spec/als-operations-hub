import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users } from 'lucide-react';

export default function ReferralLog({ retainer, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newRef, setNewRef] = useState({ name: '', facility: '', date: '', status: '' });

  const referrals = retainer.referral_log || [];

  const handleAdd = () => {
    if (!newRef.name) return;
    onUpdate({ referral_log: [...referrals, { ...newRef, date: newRef.date || new Date().toISOString().split('T')[0] }] });
    setNewRef({ name: '', facility: '', date: '', status: '' });
    setShowAdd(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Referral Log
          </CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAdd(v => !v)}>
            <Plus className="w-3 h-3 mr-1" />Add Referral
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showAdd && (
          <div className="p-3 rounded-md border bg-secondary/30 space-y-2 mb-2">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Contact Name</Label><Input className="mt-1 h-8 text-xs" value={newRef.name} onChange={e => setNewRef(r => ({ ...r, name: e.target.value }))} /></div>
              <div><Label className="text-xs">Facility</Label><Input className="mt-1 h-8 text-xs" value={newRef.facility} onChange={e => setNewRef(r => ({ ...r, facility: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Date</Label><Input type="date" className="mt-1 h-8 text-xs" value={newRef.date} onChange={e => setNewRef(r => ({ ...r, date: e.target.value }))} /></div>
              <div><Label className="text-xs">Status</Label><Input className="mt-1 h-8 text-xs" placeholder="e.g. Contacted" value={newRef.status} onChange={e => setNewRef(r => ({ ...r, status: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="h-7 text-xs">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="h-7 text-xs">Cancel</Button>
            </div>
          </div>
        )}
        {referrals.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No referrals logged yet.</p>
        ) : (
          referrals.map((r, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-md bg-secondary/30">
              <div>
                <p className="text-sm font-medium">{r.name}</p>
                {r.facility && <p className="text-[11px] text-muted-foreground">{r.facility}</p>}
              </div>
              <div className="text-right">
                {r.status && <p className="text-xs text-primary">{r.status}</p>}
                {r.date && <p className="text-[10px] text-muted-foreground">{r.date}</p>}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
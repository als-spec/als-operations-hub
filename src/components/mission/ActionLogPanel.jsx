import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';

const REVIEW_TYPE_STYLES = {
  Weekly: 'bg-blue-500/20 text-blue-400',
  Monthly: 'bg-orange-500/20 text-orange-400',
  Quarterly: 'bg-teal-500/20 text-teal-400',
};

const STATUS_STYLES = {
  Open: 'bg-orange-500/20 text-orange-400',
  'In Progress': 'bg-blue-500/20 text-blue-400',
  Done: 'bg-emerald-500/20 text-emerald-400',
  Dropped: 'bg-white/10 text-white/40',
};

const OWNER_OPTIONS = ['Alexia', 'Jackson', 'Alexa'];
const REVIEW_TYPE_OPTIONS = ['Weekly', 'Monthly', 'Quarterly'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Done', 'Dropped'];

const defaultForm = {
  review_type: 'Weekly',
  observation: '',
  decision: '',
  owner: 'Alexia',
  status: 'Open',
  review_date: new Date().toISOString().split('T')[0],
};

function Badge({ label, className }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
}

export default function ActionLogPanel({ actionLogs, onRefetch }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null); // { id, value }

  const sorted = [...actionLogs].sort((a, b) => new Date(b.review_date || b.created_date) - new Date(a.review_date || a.created_date));

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.ActionLog.create(form);
    setSaving(false);
    setShowForm(false);
    setForm(defaultForm);
    onRefetch?.();
  };

  const handleStatusSave = async (id, status) => {
    await base44.entities.ActionLog.update(id, { status });
    setEditingStatus(null);
    onRefetch?.();
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Section 4</span>
          <span className="text-sm font-semibold text-foreground">Action Log</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Action
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-xl bg-[#111] border border-primary/40 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">New Action Log Entry</p>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white/70">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-widest">Date</label>
                <input
                  type="date"
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary"
                  value={form.review_date}
                  onChange={e => setField('review_date', e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-widest">Review Type</label>
                <select
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary"
                  value={form.review_type}
                  onChange={e => setField('review_type', e.target.value)}
                >
                  {REVIEW_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-widest">Owner</label>
                <select
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary"
                  value={form.owner}
                  onChange={e => setField('owner', e.target.value)}
                >
                  {OWNER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-widest">Status</label>
                <select
                  className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary"
                  value={form.status}
                  onChange={e => setField('status', e.target.value)}
                >
                  {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-widest">Observation</label>
              <textarea
                required
                rows={2}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary resize-none"
                placeholder="What was noticed in the data…"
                value={form.observation}
                onChange={e => setField('observation', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-widest">Decision</label>
              <textarea
                required
                rows={2}
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary resize-none"
                placeholder="What action is being taken…"
                value={form.decision}
                onChange={e => setField('decision', e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-[#111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[10px] text-white/40 uppercase tracking-wider px-4 py-3 font-medium whitespace-nowrap">Date</th>
                <th className="text-left text-[10px] text-white/40 uppercase tracking-wider px-3 py-3 font-medium whitespace-nowrap">Type</th>
                <th className="text-left text-[10px] text-white/40 uppercase tracking-wider px-3 py-3 font-medium">Observation</th>
                <th className="text-left text-[10px] text-white/40 uppercase tracking-wider px-3 py-3 font-medium">Decision</th>
                <th className="text-left text-[10px] text-white/40 uppercase tracking-wider px-3 py-3 font-medium whitespace-nowrap">Owner</th>
                <th className="text-left text-[10px] text-white/40 uppercase tracking-wider px-3 py-3 font-medium whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-white/30 text-xs py-8">
                    No action log entries yet. Click "Add Action" to get started.
                  </td>
                </tr>
              )}
              {sorted.map((log, i) => (
                <tr key={log.id} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                  <td className="px-4 py-3 text-white/60 text-xs whitespace-nowrap">
                    {log.review_date ? format(new Date(log.review_date), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <Badge label={log.review_type} className={REVIEW_TYPE_STYLES[log.review_type] || 'bg-white/10 text-white/40'} />
                  </td>
                  <td className="px-3 py-3 text-white/70 text-xs max-w-xs">{log.observation}</td>
                  <td className="px-3 py-3 text-white/70 text-xs max-w-xs">{log.decision}</td>
                  <td className="px-3 py-3 text-white/60 text-xs whitespace-nowrap">{log.owner}</td>
                  <td className="px-3 py-3">
                    {editingStatus?.id === log.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          autoFocus
                          className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white outline-none focus:border-primary"
                          value={editingStatus.value}
                          onChange={e => setEditingStatus({ id: log.id, value: e.target.value })}
                        >
                          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <button
                          onClick={() => handleStatusSave(log.id, editingStatus.value)}
                          className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-medium"
                        >✓</button>
                        <button
                          onClick={() => setEditingStatus(null)}
                          className="px-2 py-0.5 rounded bg-white/10 text-white/50 text-[10px]"
                        >✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingStatus({ id: log.id, value: log.status })}
                        className="group flex items-center gap-1"
                      >
                        <Badge label={log.status} className={STATUS_STYLES[log.status] || 'bg-white/10 text-white/40'} />
                        <span className="text-[10px] text-white/20 group-hover:text-white/40 transition-colors">edit</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
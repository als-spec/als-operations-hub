import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X } from 'lucide-react';
import { format } from 'date-fns';

const FLAG_STYLES = {
  'On Track': 'bg-emerald-500/20 text-emerald-400',
  'Watch': 'bg-yellow-500/20 text-yellow-400',
  'Off Track': 'bg-red-500/20 text-red-400',
};

const FLAG_OPTIONS = ['On Track', 'Watch', 'Off Track'];

const METRIC_FIELDS = [
  { label: 'LinkedIn Outreach', value: 'linkedin_outreach_sent', target: 'linkedin_outreach_target', flag: 'linkedin_outreach_flag' },
  { label: 'Email Touches', value: 'email_touches_sent', target: 'email_touches_target', flag: 'email_touches_flag' },
  { label: 'New Prospects', value: 'new_prospects_added', target: 'new_prospects_target', flag: 'new_prospects_flag' },
  { label: 'Fit Calls', value: 'fit_calls_booked', target: 'fit_calls_target', flag: 'fit_calls_flag' },
  { label: 'LinkedIn Posts', value: 'linkedin_posts_published', target: 'linkedin_posts_target', flag: 'linkedin_posts_flag' },
];

const defaultForm = {
  week_ending: '',
  linkedin_outreach_sent: 0,
  linkedin_outreach_target: 25,
  email_touches_sent: 0,
  email_touches_target: 20,
  new_prospects_added: 0,
  new_prospects_target: 6,
  fit_calls_booked: 0,
  fit_calls_target: 2,
  linkedin_posts_published: 0,
  linkedin_posts_target: 2,
  linkedin_outreach_flag: 'On Track',
  email_touches_flag: 'On Track',
  new_prospects_flag: 'On Track',
  fit_calls_flag: 'On Track',
  linkedin_posts_flag: 'On Track',
  weekly_note: '',
};

function FlagBadge({ flag }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${FLAG_STYLES[flag] || 'bg-white/10 text-white/40'}`}>
      {flag}
    </span>
  );
}

export default function HealthMonitor({ weeklyChecks, onRefetch }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const sorted = [...weeklyChecks].sort((a, b) => new Date(b.week_ending) - new Date(a.week_ending));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.WeeklyHealthCheck.create(form);
    setSaving(false);
    setShowForm(false);
    setForm(defaultForm);
    onRefetch?.();
  };

  const setField = (field, value) => setForm(f => ({ ...f, [field]: value }));

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Section 3</span>
          <span className="text-sm font-semibold text-foreground">Health Monitor</span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Week
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-xl bg-[#111] border border-primary/40 p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">New Weekly Entry</p>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white/70">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-widest">Week Ending</label>
              <input
                type="date"
                required
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary"
                value={form.week_ending}
                onChange={e => setField('week_ending', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {METRIC_FIELDS.map(mf => (
                <div key={mf.value} className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest">{mf.label}</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      className="w-1/2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-primary"
                      placeholder="Actual"
                      value={form[mf.value]}
                      onChange={e => setField(mf.value, Number(e.target.value))}
                    />
                    <input
                      type="number"
                      min={0}
                      className="w-1/2 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white/50 outline-none focus:border-primary"
                      placeholder="Target"
                      value={form[mf.target]}
                      onChange={e => setField(mf.target, Number(e.target.value))}
                    />
                  </div>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-primary"
                    value={form[mf.flag]}
                    onChange={e => setField(mf.flag, e.target.value)}
                  >
                    {FLAG_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label className="text-[10px] text-white/40 uppercase tracking-widest">Weekly Note</label>
              <input
                type="text"
                className="mt-1 w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-primary"
                placeholder="One-line observation or flag…"
                value={form.weekly_note}
                onChange={e => setField('weekly_note', e.target.value)}
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
                <th className="text-left text-[10px] text-white/40 uppercase tracking-wider px-4 py-3 font-medium">Week Ending</th>
                {METRIC_FIELDS.map(mf => (
                  <th key={mf.value} className="text-center text-[10px] text-white/40 uppercase tracking-wider px-3 py-3 font-medium">{mf.label}</th>
                ))}
                <th className="text-left text-[10px] text-white/40 uppercase tracking-wider px-4 py-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={METRIC_FIELDS.length + 2} className="text-center text-white/30 text-xs py-8">
                    No weekly entries yet. Click "Add Week" to get started.
                  </td>
                </tr>
              )}
              {sorted.map((chk, i) => (
                <tr key={chk.id} className={i % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                  <td className="px-4 py-3 text-white/70 text-xs whitespace-nowrap">
                    {chk.week_ending ? format(new Date(chk.week_ending), 'MMM d, yyyy') : '—'}
                  </td>
                  {METRIC_FIELDS.map(mf => (
                    <td key={mf.value} className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-white text-xs font-medium">
                          {chk[mf.value] ?? 0}<span className="text-white/30">/{chk[mf.target] ?? '—'}</span>
                        </span>
                        <FlagBadge flag={chk[mf.flag]} />
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-white/50 text-xs max-w-xs truncate">{chk.weekly_note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
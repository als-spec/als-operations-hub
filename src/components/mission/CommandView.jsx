import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, DollarSign, GitBranch, CalendarCheck } from 'lucide-react';

function getMonthRange(monthOffset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);
  return { start, end };
}

function inRange(dateStr, { start, end }) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function TrendArrow({ current, previous }) {
  if (previous === 0 && current === 0) return <Minus className="w-4 h-4 text-gray-400" />;
  if (current > previous) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (current < previous) return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

function HeroCard({ title, value, subtext, trend, icon: Icon, accent }) {
  return (
    <div className={`relative rounded-2xl p-6 flex flex-col gap-3 bg-[#111] border border-white/10 overflow-hidden`}>
      <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top right, ${accent}, transparent 70%)` }} />
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}22` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        {trend}
      </div>
      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest font-medium">{title}</p>
        <p className="text-4xl font-bold text-white mt-1">{value}</p>
        {subtext && <p className="text-xs text-white/40 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

export default function CommandView({ calendarEvents, invoices, pipelineRecords, weeklyChecks, onStoryUpdate }) {
  const thisMonth = getMonthRange(0);
  const lastMonth = getMonthRange(-1);

  // Qualified Discovery Calls
  const discoveryCalls = (events, range) =>
    events.filter(e => e.type === 'Discovery Call' && e.status === 'Completed' && inRange(e.scheduled_date, range));
  const discThisMonth = discoveryCalls(calendarEvents, thisMonth).length;
  const discLastMonth = discoveryCalls(calendarEvents, lastMonth).length;

  // Revenue Booked (paid invoices this month)
  const revenueThisMonth = invoices
    .filter(inv => inv.status === 'Paid' && inRange(inv.paid_date || inv.issue_date, thisMonth))
    .reduce((s, inv) => s + (inv.amount || 0), 0);

  // Active Pipeline Value
  const excludedStages = ['Discovery Call Scheduled', 'Active Engagement'];
  const activePipeline = pipelineRecords.filter(r => !excludedStages.includes(r.stage));
  const activePipelineValue = activePipeline.reduce((s, r) => s + (r.proposed_fee || 0), 0);

  // This Month's Story
  const sortedChecks = [...weeklyChecks].sort((a, b) => new Date(b.week_ending) - new Date(a.week_ending));
  const latestCheck = sortedChecks[0];
  const [story, setStory] = useState(latestCheck?.this_months_story || '');
  const [saving, setSaving] = useState(false);

  const handleStorySave = async () => {
    if (!latestCheck?.id) return;
    setSaving(true);
    await base44.entities.WeeklyHealthCheck.update(latestCheck.id, { this_months_story: story });
    setSaving(false);
    onStoryUpdate?.();
  };

  // sync story when latestCheck changes
  React.useEffect(() => {
    setStory(latestCheck?.this_months_story || '');
  }, [latestCheck?.id]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Section 1</span>
        <span className="text-sm font-semibold text-foreground">Command View</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Booked */}
        <HeroCard
          title="Revenue Booked"
          value={`$${revenueThisMonth.toLocaleString()}`}
          subtext="Paid invoices this month"
          icon={DollarSign}
          accent="#F26722"
          trend={null}
        />

        {/* Hero: Discovery Calls */}
        <div className="relative rounded-2xl p-6 flex flex-col gap-3 bg-black border-2 border-primary overflow-hidden md:scale-105 md:z-10 shadow-xl shadow-primary/20">
          <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at top right, #F26722, transparent 70%)' }} />
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-1 text-xs text-white/50">
              <TrendArrow current={discThisMonth} previous={discLastMonth} />
              <span>vs last mo: {discLastMonth}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-primary/80 uppercase tracking-widest font-bold">Qualified Discovery Calls</p>
            <p className="text-6xl font-black text-white mt-1">{discThisMonth}</p>
            <p className="text-xs text-white/40 mt-1">Completed this month</p>
          </div>
        </div>

        {/* Active Pipeline Value */}
        <HeroCard
          title="Active Pipeline Value"
          value={`$${activePipelineValue.toLocaleString()}`}
          subtext={`${activePipeline.length} open records`}
          icon={GitBranch}
          accent="#2A9D8F"
          trend={null}
        />
      </div>

      {/* This Month's Story */}
      <div className="mt-5 rounded-xl bg-[#111] border border-white/10 p-4">
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">This Month's Story</p>
        <div className="flex gap-3 items-start">
          <textarea
            className="flex-1 bg-transparent text-white/80 text-sm resize-none outline-none placeholder:text-white/20 min-h-[40px]"
            placeholder="Write a one-line narrative for the month…"
            value={story}
            onChange={e => setStory(e.target.value)}
            rows={2}
          />
          <button
            onClick={handleStorySave}
            disabled={saving || !latestCheck}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {!latestCheck && (
          <p className="text-xs text-white/30 mt-1">Add a Weekly Health Check entry first to enable this field.</p>
        )}
      </div>
    </section>
  );
}
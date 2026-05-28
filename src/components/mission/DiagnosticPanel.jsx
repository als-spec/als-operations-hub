import React from 'react';

function getMonthRange(monthOffset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);
  return { start, end };
}

function getQuarterRange() {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), q * 3, 1);
  const end = new Date(now.getFullYear(), q * 3 + 3, 0);
  return { start, end };
}

function inRange(dateStr, { start, end }) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function statusBadge(value, thresholds) {
  // thresholds: { green, yellow } where green >= green, yellow >= yellow, else red
  if (value === null || value === undefined || isNaN(value)) {
    return { label: 'N/A', color: 'bg-white/10 text-white/40' };
  }
  if (value >= thresholds.green) return { label: 'On Track', color: 'bg-emerald-500/20 text-emerald-400' };
  if (value >= thresholds.yellow) return { label: 'Watch', color: 'bg-yellow-500/20 text-yellow-400' };
  return { label: 'Off Track', color: 'bg-red-500/20 text-red-400' };
}

function statusBadgeLow(value, thresholds) {
  // For "days" metrics: lower is better. green <= green, yellow <= yellow, else red
  if (value === null || value === undefined || isNaN(value)) {
    return { label: 'N/A', color: 'bg-white/10 text-white/40' };
  }
  if (value <= thresholds.green) return { label: 'On Track', color: 'bg-emerald-500/20 text-emerald-400' };
  if (value <= thresholds.yellow) return { label: 'Watch', color: 'bg-yellow-500/20 text-yellow-400' };
  return { label: 'Off Track', color: 'bg-red-500/20 text-red-400' };
}

function MetricCard({ title, value, displayValue, badge, subtitle }) {
  return (
    <div className="rounded-xl bg-[#111] border border-white/10 p-4 flex flex-col gap-3">
      <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold leading-tight">{title}</p>
      <div>
        <p className="text-3xl font-bold text-white">{displayValue ?? (value !== null && value !== undefined && !isNaN(value) ? `${value}%` : '—')}</p>
        {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
      </div>
      <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
        {badge.label}
      </span>
    </div>
  );
}

const SOW_SIGNED_AND_BEYOND = ['SOW Signed', 'Deposit Received', 'Active Engagement'];
const PROPOSAL_AND_BEYOND = ['Proposal Presented', 'SOW Sent', 'SOW Signed', 'Deposit Received', 'Active Engagement'];

export default function DiagnosticPanel({ calendarEvents, pipelineRecords, outreachSequences }) {
  const thisMonth = getMonthRange(0);
  const quarter = getQuarterRange();

  // 1. Fit→Discovery Rate
  const discoveryCallsThisMonth = calendarEvents.filter(
    e => e.type === 'Discovery Call' && inRange(e.created_date || e.scheduled_date, thisMonth)
  );
  const completedDiscovery = discoveryCallsThisMonth.filter(e => e.status === 'Completed');
  const fitToDiscovery = discoveryCallsThisMonth.length > 0
    ? Math.round((completedDiscovery.length / discoveryCallsThisMonth.length) * 100)
    : null;

  // 2. Discovery→Proposal Rate
  const pipelineThisMonth = pipelineRecords.filter(r => inRange(r.created_date, thisMonth));
  const reachedProposal = pipelineThisMonth.filter(r => PROPOSAL_AND_BEYOND.includes(r.stage));
  const discToProposal = pipelineThisMonth.length > 0
    ? Math.round((reachedProposal.length / pipelineThisMonth.length) * 100)
    : null;

  // 3. Proposal→Close Rate
  const proposalAndBeyond = pipelineRecords.filter(r => PROPOSAL_AND_BEYOND.includes(r.stage));
  const closedRecords = proposalAndBeyond.filter(r => SOW_SIGNED_AND_BEYOND.includes(r.stage));
  const proposalToClose = proposalAndBeyond.length > 0
    ? Math.round((closedRecords.length / proposalAndBeyond.length) * 100)
    : null;

  // 4. Avg Days to SOW
  const signedThisQuarter = pipelineRecords.filter(
    r => r.sow_signed_date && inRange(r.sow_signed_date, quarter)
  );
  let avgDaysToSow = null;
  if (signedThisQuarter.length > 0) {
    const totalDays = signedThisQuarter.reduce((sum, r) => {
      const created = new Date(r.created_date);
      const signed = new Date(r.sow_signed_date);
      return sum + Math.max(0, Math.round((signed - created) / (1000 * 60 * 60 * 24)));
    }, 0);
    avgDaysToSow = Math.round(totalDays / signedThisQuarter.length);
  }

  // 5. Outreach Response Rate
  const outreachThisMonth = outreachSequences.filter(o => inRange(o.sent_date, thisMonth));
  const replied = outreachThisMonth.filter(o => o.status === 'Replied');
  const outreachRate = outreachThisMonth.length > 0
    ? Math.round((replied.length / outreachThisMonth.length) * 100)
    : null;

  const metrics = [
    {
      title: 'Fit → Discovery Rate',
      value: fitToDiscovery,
      subtitle: `${completedDiscovery.length} of ${discoveryCallsThisMonth.length} calls completed`,
      badge: statusBadge(fitToDiscovery, { green: 60, yellow: 40 }),
    },
    {
      title: 'Discovery → Proposal Rate',
      value: discToProposal,
      subtitle: `${reachedProposal.length} of ${pipelineThisMonth.length} reached proposal`,
      badge: statusBadge(discToProposal, { green: 50, yellow: 30 }),
    },
    {
      title: 'Proposal → Close Rate',
      value: proposalToClose,
      subtitle: `${closedRecords.length} of ${proposalAndBeyond.length} closed`,
      badge: statusBadge(proposalToClose, { green: 40, yellow: 25 }),
    },
    {
      title: 'Avg Days to SOW',
      value: avgDaysToSow,
      displayValue: avgDaysToSow !== null ? `${avgDaysToSow}d` : '—',
      subtitle: `Based on ${signedThisQuarter.length} signed this quarter`,
      badge: statusBadgeLow(avgDaysToSow, { green: 30, yellow: 45 }),
    },
    {
      title: 'Outreach Response Rate',
      value: outreachRate,
      subtitle: `${replied.length} replies of ${outreachThisMonth.length} sent`,
      badge: statusBadge(outreachRate, { green: 10, yellow: 5 }),
    },
  ];

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Section 2</span>
        <span className="text-sm font-semibold text-foreground">Diagnostic Panel</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map(m => (
          <MetricCard key={m.title} {...m} />
        ))}
      </div>
    </section>
  );
}
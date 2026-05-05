import React from 'react';
import { cn } from '@/lib/utils';
import { Hash } from 'lucide-react';

const CHANNELS = [
  { id: 'general', label: 'general', founderOnly: false },
  { id: 'daily-standup', label: 'daily-standup', founderOnly: false },
  { id: 'pipeline', label: 'pipeline', founderOnly: false },
  { id: 'active-engagements', label: 'active-engagements', founderOnly: false },
  { id: 'retainers', label: 'retainers', founderOnly: false },
  { id: 'finance', label: 'finance', founderOnly: true },
  { id: 'legal-compliance', label: 'legal-compliance', founderOnly: false },
  { id: 'tools-and-tech', label: 'tools-and-tech', founderOnly: false },
];

export default function ChannelSidebar({ activeChannel, onSelectChannel, isFounder, messages }) {
  const unreadCounts = {}; // future: track unread per channel

  const visible = CHANNELS.filter(c => !c.founderOnly || isFounder);

  return (
    <div className="w-52 flex-shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <span className="text-xs font-bold uppercase tracking-widest text-sidebar-muted-foreground">Channels</span>
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {visible.map(ch => (
          <button
            key={ch.id}
            onClick={() => onSelectChannel(ch.id)}
            className={cn(
              'w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-left',
              activeChannel === ch.id
                ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
            )}
          >
            <Hash className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{ch.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
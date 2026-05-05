import React from 'react';
import { format } from 'date-fns';
import { X, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PinnedMessages({ messages, onClose, onUnpin }) {
  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2"><Pin className="w-4 h-4 text-warning" />Pinned Messages</h3>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pinned messages.</p>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold">{msg.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">{msg.created_date ? format(new Date(msg.created_date), 'MMM d, h:mm a') : ''}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
                <button onClick={() => onUnpin(msg)} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">Unpin</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
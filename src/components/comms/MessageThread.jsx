import React, { useState, useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Pin, MessageSquare, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_EMOJIS = ['👍', '✅', '🎉', '🔥', '👀', '❓'];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d');
}

function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  [...messages].reverse().forEach(msg => {
    const d = msg.created_date ? new Date(msg.created_date).toDateString() : 'Unknown';
    if (d !== lastDate) { groups.push({ date: d, label: formatDate(msg.created_date), messages: [] }); lastDate = d; }
    groups[groups.length - 1].messages.push(msg);
  });
  return groups;
}

function MessageItem({ msg, currentUser, onReact, onPin, onOpenThread, isThread }) {
  const [showEmoji, setShowEmoji] = React.useState(false);
  const isMe = msg.author_email === currentUser?.email;

  return (
    <div className="group flex gap-3 px-4 py-2 hover:bg-secondary/30 rounded-md transition-colors">
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
        {(msg.author_name || 'U')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{msg.author_name || 'Unknown'}</span>
          <span className="text-[10px] text-muted-foreground">
            {msg.created_date ? format(new Date(msg.created_date), 'h:mm a') : ''}
          </span>
          {msg.pinned && <span className="text-[10px] text-warning">📌</span>}
        </div>
        <p className="text-sm whitespace-pre-wrap break-words mt-0.5 leading-relaxed">{msg.content}</p>
        {msg.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {msg.attachments.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline border border-border px-2 py-0.5 rounded">
                📎 {a.name}
              </a>
            ))}
          </div>
        )}
        {/* Reactions */}
        {msg.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {msg.reactions.map((r, i) => (
              <button key={i} onClick={() => onReact(msg, r.emoji)}
                className="flex items-center gap-1 text-xs bg-secondary hover:bg-secondary/80 rounded-full px-2 py-0.5 border border-border transition-colors">
                <span>{r.emoji}</span>
                <span className="text-muted-foreground">{r.users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Hover actions */}
      <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 relative">
        <div className="relative">
          <button onClick={() => setShowEmoji(v => !v)} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors">
            <Smile className="w-3.5 h-3.5" />
          </button>
          {showEmoji && (
            <div className="absolute right-0 top-7 bg-card border border-border rounded-lg shadow-lg p-2 flex gap-1 z-20">
              {QUICK_EMOJIS.map(e => (
                <button key={e} onClick={() => { onReact(msg, e); setShowEmoji(false); }}
                  className="text-base hover:bg-secondary rounded p-1 transition-colors">{e}</button>
              ))}
            </div>
          )}
        </div>
        {!isThread && onOpenThread && (
          <button onClick={() => onOpenThread(msg.id)} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={() => onPin(msg)} className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors">
          <Pin className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function MessageThread({ messages, currentUser, onReact, onPin, onOpenThread, isLoading, isThread }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const groups = groupByDate(messages);

  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-1 min-h-0">
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No messages yet. Be the first to say something!</div>
      ) : (
        groups.map((g, gi) => (
          <div key={gi}>
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted-foreground font-medium">{g.label}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {g.messages.map(msg => (
              <MessageItem
                key={msg.id}
                msg={msg}
                currentUser={currentUser}
                onReact={onReact}
                onPin={onPin}
                onOpenThread={onOpenThread}
                isThread={isThread}
              />
            ))}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
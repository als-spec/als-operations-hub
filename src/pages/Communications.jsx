import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import ChannelSidebar from '@/components/comms/ChannelSidebar';
import MessageThread from '@/components/comms/MessageThread';
import MessageInput from '@/components/comms/MessageInput';
import PinnedMessages from '@/components/comms/PinnedMessages';

export default function Communications() {
  const { user, isFounder } = useCurrentUser();
  const [activeChannel, setActiveChannel] = useState('general');
  const [showThread, setShowThread] = useState(null); // message id for thread view
  const [showPinned, setShowPinned] = useState(false);
  const qc = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', activeChannel],
    queryFn: () => base44.entities.Message.filter({ channel: activeChannel }, '-created_date', 100),
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', activeChannel] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Message.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', activeChannel] }),
  });

  const handleSend = (content, attachments = []) => {
    if (!content.trim()) return;
    createMutation.mutate({
      channel: activeChannel,
      content,
      attachments,
      author_name: user?.full_name || 'Me',
      author_email: user?.email || '',
      reactions: [],
      pinned: false,
    });
  };

  const handleReply = (parentId, content) => {
    if (!content.trim()) return;
    createMutation.mutate({
      channel: activeChannel,
      content,
      thread_parent_id: parentId,
      author_name: user?.full_name || 'Me',
      author_email: user?.email || '',
      reactions: [],
      pinned: false,
    });
  };

  const handleReact = (message, emoji) => {
    const reactions = message.reactions || [];
    const existing = reactions.find(r => r.emoji === emoji);
    let updated;
    if (existing) {
      const userAlready = existing.users.includes(user?.email);
      updated = reactions.map(r => r.emoji === emoji
        ? { ...r, users: userAlready ? r.users.filter(u => u !== user?.email) : [...r.users, user?.email] }
        : r
      ).filter(r => r.users.length > 0);
    } else {
      updated = [...reactions, { emoji, users: [user?.email] }];
    }
    updateMutation.mutate({ id: message.id, data: { reactions: updated } });
  };

  const handlePin = (message) => {
    updateMutation.mutate({ id: message.id, data: { pinned: !message.pinned } });
  };

  // Finance channel only for founders
  const threadMessages = showThread
    ? messages.filter(m => m.thread_parent_id === showThread || m.id === showThread)
    : [];

  const rootMessages = messages.filter(m => !m.thread_parent_id);
  const pinnedMessages = messages.filter(m => m.pinned);

  return (
    <div className="h-[calc(100vh-4rem)] flex -m-6 overflow-hidden">
      {/* Channel Sidebar */}
      <ChannelSidebar
        activeChannel={activeChannel}
        onSelectChannel={(ch) => { setActiveChannel(ch); setShowThread(null); setShowPinned(false); }}
        isFounder={isFounder}
        messages={messages}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        <div className="h-14 border-b border-border px-5 flex items-center justify-between bg-card flex-shrink-0">
          <div>
            <span className="font-semibold text-sm">#{activeChannel}</span>
            {pinnedMessages.length > 0 && (
              <span className="ml-2 text-[10px] text-muted-foreground">{pinnedMessages.length} pinned</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pinnedMessages.length > 0 && (
              <button
                onClick={() => setShowPinned(v => !v)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-secondary"
              >
                📌 Pinned
              </button>
            )}
            {showThread && (
              <button onClick={() => setShowThread(null)} className="text-xs text-primary hover:underline">
                ← Back to channel
              </button>
            )}
          </div>
        </div>

        {showPinned ? (
          <PinnedMessages messages={pinnedMessages} onClose={() => setShowPinned(false)} onUnpin={handlePin} />
        ) : showThread ? (
          <div className="flex-1 flex flex-col min-h-0">
            <MessageThread
              messages={threadMessages}
              currentUser={user}
              onReact={handleReact}
              onPin={handlePin}
              isThread
            />
            <MessageInput onSend={(content) => handleReply(showThread, content)} placeholder="Reply in thread…" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <MessageThread
              messages={rootMessages}
              currentUser={user}
              onReact={handleReact}
              onPin={handlePin}
              onOpenThread={(id) => setShowThread(id)}
              isLoading={isLoading}
            />
            <MessageInput onSend={handleSend} placeholder={`Message #${activeChannel}…`} />
          </div>
        )}
      </div>
    </div>
  );
}
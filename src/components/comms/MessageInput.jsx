import React, { useState, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function MessageInput({ onSend, placeholder = 'Type a message…' }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const fileRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const submit = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSend(text, attachments);
    setText('');
    setAttachments([]);
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachments(a => [...a, { name: file.name, url: file_url }]);
    } finally {
      setUploading(false);
    }
    e.target.value = '';
  };

  return (
    <div className="flex-shrink-0 border-t border-border bg-card p-4">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-1 bg-secondary rounded px-2 py-0.5 text-xs">
              <span>📎 {a.name}</span>
              <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive ml-1">×</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <input type="file" ref={fileRef} onChange={handleFile} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors flex-shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring min-h-[38px] max-h-32 overflow-y-auto"
          style={{ height: 'auto' }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'; }}
        />
        <button
          onClick={submit}
          disabled={!text.trim() && attachments.length === 0}
          className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 pl-10">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
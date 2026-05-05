import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import EmailComposer from '@/components/email/EmailComposer';
import EmailLog from '@/components/email/EmailLog';

export default function ClientEmail() {
  const { user, isVA } = useCurrentUser();
  const [showComposer, setShowComposer] = useState(false);
  const [prefill, setPrefill] = useState(null);

  const { data: sentEmails = [], isLoading, refetch } = useQuery({
    queryKey: ['emails-sent'],
    queryFn: () => base44.entities.EmailSent.list('-sent_at', 100),
  });

  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => base44.entities.Prospect.list('-updated_date', 100),
  });

  const { data: engagements = [] } = useQuery({
    queryKey: ['engagements'],
    queryFn: () => base44.entities.Engagement.list('-updated_date', 50),
  });

  const { data: retainers = [] } = useQuery({
    queryKey: ['retainers'],
    queryFn: () => base44.entities.Retainer.list('-created_date', 50),
  });

  const handleSent = () => {
    setShowComposer(false);
    setPrefill(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Email</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Template-based outbound email with full send log</p>
        </div>
        {!isVA && (
          <Button size="sm" onClick={() => { setPrefill(null); setShowComposer(true); }}>
            <Plus className="w-4 h-4 mr-1" />Compose
          </Button>
        )}
      </div>

      {showComposer && !isVA && (
        <EmailComposer
          prefill={prefill}
          prospects={prospects}
          engagements={engagements}
          retainers={retainers}
          currentUser={user}
          onSent={handleSent}
          onCancel={() => { setShowComposer(false); setPrefill(null); }}
        />
      )}

      <EmailLog
        emails={sentEmails}
        isLoading={isLoading}
        onRefetch={refetch}
        onCompose={isVA ? undefined : (p) => { setPrefill(p); setShowComposer(true); }}
      />
    </div>
  );
}
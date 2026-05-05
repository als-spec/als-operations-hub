import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import EmailVerificationGate from '@/components/public/EmailVerificationGate';
import PublicLinkExpired from '@/pages/public/PublicLinkExpired';
import { usePublicTokenSession } from '@/hooks/usePublicTokenSession';

export default function ClientPortal() {
  const { token } = useParams();
  const session = usePublicTokenSession(token);

  if (session.loading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!session.valid) return <PublicLinkExpired />;

  if (!session.verified) {
    return (
      <EmailVerificationGate
        token={token}
        recipientHint={session.recipientHint}
        resourceType="portal"
        onVerified={() => session.markVerified()}
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-8 text-center space-y-2">
        <h1 className="text-lg font-semibold">Client Portal</h1>
        <p className="text-sm text-muted-foreground">
          Email verified. Phases 5&ndash;7 will render engagement details, uploads, and findings
          acknowledgment here.
        </p>
      </CardContent>
    </Card>
  );
}

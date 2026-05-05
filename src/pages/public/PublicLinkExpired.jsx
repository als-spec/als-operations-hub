import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function PublicLinkExpired() {
  return (
    <Card>
      <CardContent className="p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-warning/10 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-warning" />
        </div>
        <h1 className="text-lg font-semibold">This link is no longer valid</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          The link you followed has expired, been revoked, or already been used.
          If you still need access, please reply to the email it came from and we will issue a new one.
        </p>
      </CardContent>
    </Card>
  );
}

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ExternalLink, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function RetainerPortal() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        setLoading(true);
        const token = window.location.pathname.split('/').pop();

        if (!token) {
          setError('Invalid portal link');
          setLoading(false);
          return;
        }

        const response = await base44.functions.invoke('validatePortalToken', { token });
        
        if (response.data.type !== 'retainer') {
          setError('This link is for a different engagement type.');
          setLoading(false);
          return;
        }

        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.status === 410 ? 'This link is no longer active.' : 'Unable to load portal.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-muted border-t-teal rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading retainer status…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <p className="font-medium text-sm mb-1">{error || 'Portal not found'}</p>
              <p className="text-xs text-muted-foreground mb-4">Questions? Contact us at support@alsprofessional.com or (555) 123-4567</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-baseline border-b pb-4">
          <p className="text-xs text-muted-foreground">ALS Professional Network</p>
          <p className="text-xs text-muted-foreground">{data.facility_name}</p>
        </div>

        {/* Monthly Dashboard */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Your Latest Dashboard</CardTitle></CardHeader>
          <CardContent>
            {data.dashboard_url ? (
              <a href={data.dashboard_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-secondary transition-colors">
                <span className="text-sm font-medium">Supply Chain Dashboard</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">Dashboard link coming soon</p>
            )}
          </CardContent>
        </Card>

        {/* Next Touchpoint */}
        {data.next_event && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Next Touchpoint</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className="font-medium text-sm">{data.next_event.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scheduled</p>
                  <p className="font-medium text-sm">{format(new Date(data.next_event.date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              {data.next_event.call_link && (
                <a href={data.next_event.call_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-secondary transition-colors">
                  <span className="text-sm font-medium">Join Call</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
            </CardContent>
          </Card>
        )}

        {/* Savings Realized */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Savings Identified</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <DollarSign className="w-5 h-5 text-teal flex-shrink-0" />
              <p className="text-2xl font-bold text-foreground">{data.total_savings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">identified and in progress</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Strip */}
        <div className="border-t pt-6 text-center">
          <p className="text-xs text-muted-foreground">Questions? Contact us at support@alsprofessional.com or (555) 123-4567</p>
        </div>
      </div>
    </div>
  );
}
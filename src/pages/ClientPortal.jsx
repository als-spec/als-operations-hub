import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, AlertCircle, Download, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const MILESTONE_LABELS = [
  'Kickoff Call',
  'On-Site Walkthrough',
  'Data Received',
  'Analysis Complete',
  'Findings Ready',
];

const MILESTONE_MESSAGES = {
  'Kickoff Call': 'Your diagnostic is underway. Here\'s where things stand.',
  'On-Site Walkthrough': 'On-site walkthrough complete. Analysis in progress.',
  'Data Received': 'All data received. We\'re deep in the analysis.',
  'Analysis Complete': 'Analysis complete. Preparing your findings.',
  'Findings Delivered': 'Your findings have been delivered. See your documents below.',
};

export default function ClientPortal() {
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
          <p className="text-sm text-muted-foreground">Loading engagement status…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <p className="font-medium text-sm mb-2">{error || 'Portal not found'}</p>
            <p className="text-xs text-gray-600">Questions? Contact us at support@alsprofessional.com or (555) 123-4567</p>
          </div>
        </div>
      </div>
    );
  }

  const currentMilestoneIndex = data.milestones?.findIndex(m => !m.completed) ?? 4;
  const welcomeMsg = MILESTONE_LABELS[Math.min(currentMilestoneIndex, 4)];
  const welcomeText = MILESTONE_MESSAGES[welcomeMsg] || MILESTONE_MESSAGES['Kickoff Call'];

  const dataReceivedCount = data.data_requests?.filter(r => r.status === 'Received').length || 0;
  const totalDataItems = data.data_requests?.length || 0;

  const deliverables = (data.deliverables || []).filter(d => d.status === 'Complete');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-8" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Header */}
        <div className="flex justify-between items-baseline border-b pb-4">
          <p className="text-xs text-gray-600">{data.practice_name || 'ALS Professional Services'}</p>
          <p className="text-xs text-gray-600">{data.facility_name}</p>
        </div>

        {/* Welcome Statement */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Status Update</p>
          <p className="text-base font-medium text-gray-900">{welcomeText}</p>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Progress Timeline</h3>
          <div className="space-y-3">
            {data.milestones?.map((m, i) => {
              const isCompleted = m.completed;
              const isInProgress = !isCompleted && data.milestones.slice(0, i).every(x => x.completed);
              const label = MILESTONE_LABELS[i] || m.type;

              return (
                <div key={i} className="flex items-center gap-3">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#1DE9B6' }} />
                  ) : isInProgress ? (
                    <Circle className="w-5 h-5 animate-pulse flex-shrink-0" style={{ color: '#1DE9B6' }} />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    {isCompleted && m.completed_date && (
                      <p className="text-xs text-gray-600">Completed {format(new Date(m.completed_date), 'MMM d')}</p>
                    )}
                    {isInProgress && <p className="text-xs" style={{ color: '#1DE9B6' }}>In progress</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Request Status — only show if analysis not complete */}
        {data.milestones && !data.milestones[3]?.completed && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Data Request Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600">{dataReceivedCount} of {totalDataItems} items received</p>
                </div>
                <Progress value={totalDataItems > 0 ? (dataReceivedCount / totalDataItems) * 100 : 0} className="h-2" />
              </div>
              <div className="space-y-2">
                {data.data_requests?.map((req, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-900">{req.item_name}</span>
                    <div className="text-xs px-2 py-1 rounded" style={{
                      backgroundColor: req.status === 'Received' ? '#D0FAF1' : '#F0F0F0',
                      color: req.status === 'Received' ? '#0A7560' : '#666'
                    }}>
                      {req.status === 'Received' ? '✓ Received' : 'Awaiting'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Key Dates */}
        <div className="grid sm:grid-cols-3 gap-4">
          {data.kickoff_date && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Engagement Start</p>
              <p className="font-medium text-sm text-gray-900">{format(new Date(data.kickoff_date), 'MMM d, yyyy')}</p>
            </div>
          )}
          {data.on_site_date && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Data Deadline</p>
              <p className="font-medium text-sm text-gray-900">{format(new Date(data.on_site_date), 'MMM d, yyyy')}</p>
            </div>
          )}
          {data.delivery_target && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-600 mb-1">Findings Target</p>
              <p className="font-medium text-sm text-gray-900">{format(new Date(data.delivery_target), 'MMM d, yyyy')}</p>
            </div>
          )}
        </div>

        {/* Deliverables — only show when available */}
        {deliverables.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Your Deliverables</h3>
            <div className="space-y-2">
              {data.findings_deck_url && (
                <a href={data.findings_deck_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-900">Findings Report</span>
                  <Download className="w-4 h-4 text-gray-600" />
                </a>
              )}
              {data.dashboard_url && (
                <a href={data.dashboard_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-900">Analytics Dashboard</span>
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </a>
              )}
              {data.roadmap_url && (
                <a href={data.roadmap_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-900">Implementation Roadmap</span>
                  <Download className="w-4 h-4 text-gray-600" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Contact Strip */}
        <div className="border-t pt-6 text-center">
          <p className="text-xs text-gray-600">Questions? Contact us at support@alsprofessional.com or (555) 123-4567</p>
        </div>
      </div>
    </div>
  );
}
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/AuthGuard';
import DashboardWithAuth from '@/components/DashboardWithAuth';
import Prospects from '@/pages/Prospects';
import ProspectDetail from '@/pages/ProspectDetail';
import ProspectForm from '@/pages/ProspectForm';
import Pipeline from '@/pages/Pipeline';
import PipelineDetail from '@/pages/PipelineDetail';
import PipelineForm from '@/pages/PipelineForm';
import Engagements from '@/pages/Engagements';
import EngagementDetail from '@/pages/EngagementDetail';
import EngagementForm from '@/pages/EngagementForm';
import Schedule from '@/pages/Schedule';
import EventForm from '@/pages/EventForm';
import Financials from '@/pages/Financials';
import Retainers from '@/pages/Retainers';
import RetainerDetail from '@/pages/RetainerDetail';
import RetainerForm from '@/pages/RetainerForm';
import Outreach from '@/pages/Outreach';
import Communications from '@/pages/Communications';
import ClientEmail from '@/pages/ClientEmail';
import Documents from '@/pages/Documents';
import Settings from '@/pages/Settings';
import ClientPortal from '@/pages/ClientPortal';
import RetainerPortal from '@/pages/RetainerPortal';
import SowPublicView from '@/pages/SowPublicView';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          <span className="text-xs text-muted-foreground">Loading Operations Hub…</span>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Login landing page — shows login form or dashboard */}
      <Route path="/" element={<DashboardWithAuth />} />
      
      {/* Internal pages — wrapped with auth guard */}
      <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
        <Route path="/dashboard" element={<DashboardWithAuth />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/prospects/new" element={<ProspectForm />} />
        <Route path="/prospects/:id" element={<ProspectDetail />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/pipeline/new" element={<PipelineForm />} />
        <Route path="/pipeline/:id" element={<PipelineDetail />} />
        <Route path="/engagements" element={<Engagements />} />
        <Route path="/engagements/new" element={<EngagementForm />} />
        <Route path="/engagements/:id" element={<EngagementDetail />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/schedule/new" element={<EventForm />} />
        <Route path="/financials" element={<Financials />} />
        <Route path="/retainers" element={<Retainers />} />
        <Route path="/retainers/new" element={<RetainerForm />} />
        <Route path="/retainers/:id" element={<RetainerDetail />} />
        <Route path="/outreach" element={<Outreach />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/email" element={<ClientEmail />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/portal/:token" element={<ClientPortal />} />
      <Route path="/retainer-portal/:token" element={<RetainerPortal />} />
      <Route path="/sow/:token" element={<SowPublicView />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
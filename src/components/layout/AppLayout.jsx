import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} userRole={user?.role} />
      <div className={cn("transition-all duration-200", collapsed ? "ml-16" : "ml-56")}>
        <TopBar user={user} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
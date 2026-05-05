import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GitBranch, Briefcase, Calendar,
  ChevronLeft, ChevronRight, DollarSign, Send, RefreshCw, MessageSquare, Mail, FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['founder', 'operator', 'analyst', 'admin'] },
  { label: 'Prospects', path: '/prospects', icon: Users, roles: ['founder', 'operator', 'admin'] },
  { label: 'Outreach', path: '/outreach', icon: Send, roles: ['founder', 'operator', 'admin'] },
  { label: 'Pipeline', path: '/pipeline', icon: GitBranch, roles: ['founder', 'operator', 'admin'] },
  { label: 'Engagements', path: '/engagements', icon: Briefcase, roles: ['founder', 'operator', 'admin'] },
  { label: 'Retainers', path: '/retainers', icon: RefreshCw, roles: ['founder', 'operator', 'admin'] },
  { label: 'Schedule', path: '/schedule', icon: Calendar, roles: ['founder', 'operator', 'analyst', 'admin'] },
  { label: 'Communications', path: '/communications', icon: MessageSquare, roles: ['founder', 'operator', 'analyst', 'admin'] },
  { label: 'Client Email', path: '/email', icon: Mail, roles: ['founder', 'operator', 'admin'] },
  { label: 'Financials', path: '/financials', icon: DollarSign, roles: ['founder', 'admin'] },
  { label: 'Documents', path: '/documents', icon: FolderOpen, roles: ['founder', 'operator', 'analyst', 'admin'] },
];

export default function Sidebar({ collapsed, setCollapsed, userRole }) {
  const location = useLocation();
  const role = userRole || 'operator';

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col z-40 transition-all duration-200",
      collapsed ? "w-16" : "w-56"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wide text-white">Operations Hub</span>
            <span className="text-[10px] text-sidebar-muted-foreground tracking-widest uppercase">ALS Professional</span>
          </div>
        )}
        {collapsed && <span className="text-lg font-bold text-sidebar-primary mx-auto">A</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {filteredNav.map(item => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-12 flex items-center justify-center border-t border-sidebar-border text-sidebar-muted-foreground hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
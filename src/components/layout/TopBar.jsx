import React, { useState } from 'react';
import { Bell, Plus, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const roleLabels = {
  founder: 'Founder',
  operator: 'Operator',
  analyst: 'Analyst',
  admin: 'Admin',
};

const roleBadgeColors = {
  founder: 'bg-cobalt text-white',
  admin: 'bg-cobalt text-white',
  operator: 'bg-teal text-navy',
  analyst: 'bg-secondary text-secondary-foreground',
};

export default function TopBar({ user }) {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <div />

      <div className="flex items-center gap-3">
        {/* Quick Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Quick Add</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/prospects/new')}>New Prospect</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/schedule/new')}>New Event</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
        </Button>

        {/* User Info */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {user?.full_name?.[0] || 'U'}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-medium leading-tight">{user?.full_name || 'User'}</span>
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-4 ${roleBadgeColors[user?.role] || ''}`}>
                  {roleLabels[user?.role] || 'User'}
                </Badge>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => base44.auth.logout()}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
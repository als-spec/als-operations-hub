import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, RefreshCw, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ROLE_LABELS = { founder: 'Founder', operator: 'Operator', va: 'VA', analyst: 'Analyst', admin: 'Admin' };
const ROLE_COLORS = {
  founder: 'bg-cobalt text-white',
  admin: 'bg-cobalt text-white',
  operator: 'bg-teal text-navy',
  va: 'bg-warning text-white',
  analyst: 'bg-secondary text-secondary-foreground',
};

export default function Settings() {
  const { user, isFounder } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('operator');
  const [inviting, setInviting] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.User.update(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Role updated' });
    },
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    // SDK only accepts "user" or "admin"; custom role is stored on the User entity
    const sdkRole = (inviteRole === 'founder' || inviteRole === 'admin') ? 'admin' : 'user';
    await base44.users.inviteUser(inviteEmail, sdkRole);
    setInviting(false);
    setInviteEmail('');
    toast({ title: 'Invitation sent', description: `${inviteEmail} has been invited as ${ROLE_LABELS[inviteRole]}. Their role can be updated once they accept.` });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  if (!isFounder) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">You do not have access to Settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage team members and application configuration</p>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{u.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.id === user?.id ? (
                    <Badge className={`text-xs ${ROLE_COLORS[u.role] || ''}`}>{ROLE_LABELS[u.role] || u.role}</Badge>
                  ) : (
                    <Select
                      value={u.role}
                      onValueChange={(role) => updateRoleMutation.mutate({ id: u.id, role })}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="founder">Founder</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="va">VA</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Invite User */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label>Email Address</Label>
              <Input
                type="email"
                required
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1 w-40">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="va">VA</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="founder">Founder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={inviting} className="gap-2">
              {inviting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Send Invite
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Practice Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Practice Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Practice Name</Label>
              <Input defaultValue="ALS Professional Network" disabled />
            </div>
            <div className="space-y-1">
              <Label>App Name</Label>
              <Input defaultValue="Operations Hub" disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Contact your admin to update practice-level settings.</p>
        </CardContent>
      </Card>
    </div>
  );
}
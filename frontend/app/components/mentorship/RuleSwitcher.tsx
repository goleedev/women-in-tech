'use client';

import { RefreshCw } from 'lucide-react';

import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function RoleSwitcher() {
  // Authentication context
  const { user, activeRole, switchRole } = useAuth();

  // Function to handle role switching
  const handleSwitchRole = () => {
    // Check if user exists, if not, return
    if (!user) return;

    // Determine the new role based on the current active role
    const newRole = activeRole === user.role ? user.secondary_role : user.role;

    // If a new role is determined, switch to that role
    if (newRole) switchRole(newRole);
  };

  // Check if the user has a secondary role
  // If the user does not have a secondary role and the active role is the same as the user's role, hide the button
  if (!user?.secondary_role && activeRole === user?.role) return null;

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSwitchRole}
        className="flex items-center bg-blue-50 border-blue-200"
      >
        <span className="mr-1">
          You are in {activeRole === 'mentor' ? 'Mentor' : 'Mentee'} mode
        </span>
        <RefreshCw size={14} />
      </Button>
    </div>
  );
}

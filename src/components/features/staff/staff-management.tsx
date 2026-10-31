"use client";

import * as React from "react";
import { StaffTable } from "@/components/features/staff/staff-table";
import { StaffInviteDialog } from "@/components/features/staff/staff-invite-dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import type { StaffProfile } from "@/lib/services/staff";

export function StaffManagement({
  initialStaff,
  currentUserId,
}: {
  initialStaff: StaffProfile[];
  currentUserId: string;
}) {
  const [inviteOpen, setInviteOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Staff Administration
          </h1>
          <p className="text-sm text-slate-500">
            Invite, configure and manage internal staff access and account activation.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="flex items-center gap-1.5">
          <UserPlus className="h-4 w-4" />
          <span>Invite Staff</span>
        </Button>
      </div>

      <StaffTable
        staffMembers={initialStaff}
        currentUserId={currentUserId}
        onInviteClick={() => setInviteOpen(true)}
      />

      <StaffInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </div>
  );
}


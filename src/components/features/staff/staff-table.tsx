"use client";

import * as React from "react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { updateStaffAction } from "@/app/actions/staff";
import { useToast } from "@/components/ui/use-toast";
import type { StaffProfile } from "@/lib/services/staff";

interface StaffTableProps {
  staffMembers: StaffProfile[];
  currentUserId: string;
  onInviteClick?: () => void;
}

export function StaffTable({
  staffMembers,
  currentUserId,
  onInviteClick,
}: StaffTableProps) {
  const { toast } = useToast();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  const handleToggleStatus = async (staff: StaffProfile) => {
    if (staff.id === currentUserId) {
      toast({
        title: "Warning",
        description: "You cannot deactivate your own account.",
        variant: "destructive",
      });
      return;
    }

    setLoadingId(staff.id);
    const formData = new FormData();
    formData.append("id", staff.id);
    formData.append("fullName", staff.full_name || "");
    formData.append("phone", staff.phone || "");
    formData.append("isActive", (!staff.is_active).toString());

    const res = await updateStaffAction(formData);
    setLoadingId(null);

    if (!res.success) {
      toast({
        title: "Error",
        description: res.error || "Failed to update staff status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: `Staff member ${staff.is_active ? "deactivated" : "activated"}`,
      });
    }
  };

  const columns: Column<StaffProfile>[] = [
    {
      key: "full_name",
      header: "Staff Member",
      sortable: true,
      cell: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {item.full_name || "Unnamed"}
          </span>
          <span className="text-xs text-slate-500">{item.email}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (item) => <span>{item.phone || "—"}</span>,
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      cell: (item) => <StatusBadge status={item.is_active} />,
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      cell: (item) => (
        <span className="text-xs text-slate-500">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      cell: (item) => {
        const isSelf = item.id === currentUserId;
        return (
          <Button
            variant="outline"
            size="sm"
            disabled={isSelf || loadingId === item.id}
            onClick={() => handleToggleStatus(item)}
            className="h-7 text-xs"
          >
            {loadingId === item.id
              ? "Saving..."
              : item.is_active
              ? "Deactivate"
              : "Activate"}
          </Button>
        );
      },
    },
  ];

  return (
    <DataTable
      data={staffMembers}
      columns={columns}
      keyExtractor={(item) => item.id}
      searchKey="full_name"
      searchPlaceholder="Search staff by name..."
      emptyTitle="No staff members found"
      emptyDescription="No staff records match your criteria."
      emptyAction={
        onInviteClick ? (
          <Button onClick={onInviteClick} size="sm">
            Invite Staff Member
          </Button>
        ) : undefined
      }
    />
  );
}


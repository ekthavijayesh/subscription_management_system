import { requireRole } from "@/lib/auth/authorization";
import { getAllStaffMembers } from "@/lib/services/staff";
import { StaffManagement } from "@/components/features/staff/staff-management";

export default async function AdminStaffPage() {
  const session = await requireRole(["admin"]);
  const staff = await getAllStaffMembers();

  return <StaffManagement initialStaff={staff} currentUserId={session.profile.id} />;
}


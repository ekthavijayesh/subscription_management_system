import { z } from "zod";

export const staffInviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum(["staff", "admin"]).default("staff"),
});

export const staffUpdateSchema = z.object({
  id: z.string().uuid("Invalid staff ID"),
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().max(20).optional().nullable(),
  isActive: z.boolean(),
});

export type StaffInviteInput = z.infer<typeof staffInviteSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;


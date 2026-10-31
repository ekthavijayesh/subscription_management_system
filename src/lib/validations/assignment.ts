import { z } from "zod";

export const assignmentCreateSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),
  staffId: z.string().uuid("Invalid staff ID"),
  permissions: z.array(z.string()).default([]),
});

export const assignmentToggleSchema = z.object({
  assignmentId: z.string().uuid("Invalid assignment ID"),
  isActive: z.boolean(),
});

export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
export type AssignmentToggleInput = z.infer<typeof assignmentToggleSchema>;


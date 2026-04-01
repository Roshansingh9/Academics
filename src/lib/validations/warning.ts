import { z } from "zod";

export const createWarningSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
});

export type CreateWarningInput = z.infer<typeof createWarningSchema>;

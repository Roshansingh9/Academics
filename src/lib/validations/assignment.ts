import { z } from "zod";

export const createAssignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  dueDate: z.string().min(1, "Due date is required"),
  target: z.enum(["SPECIFIC", "ALL"]),
  studentIds: z.array(z.string()).optional(),
  relevantLinks: z.array(z.string().url("Must be a valid URL")).optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const reviewSubmissionSchema = z.object({
  mentorComment: z.string().optional(),
  status: z.enum(["REVIEWED", "ACCEPTED"]),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;

import { z } from "zod";

export const createStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  course: z.string().optional(),
  batch: z.string().optional(),
  mentorId: z.string().min(1, "Mentor is required"),
  initialPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number"),
  avatarUrl: z.string().url().optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  course: z.string().optional(),
  batch: z.string().optional(),
  mentorId: z.string().optional(),
  status: z.enum(["ACTIVE", "PASSED_OUT", "DROPPED_OUT"]).optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

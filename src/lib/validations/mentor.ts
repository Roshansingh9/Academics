import { z } from "zod";

export const createMentorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  initialPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number"),
  avatarUrl: z.string().url().optional(),
});

export const updateMentorSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateMentorInput = z.infer<typeof createMentorSchema>;
export type UpdateMentorInput = z.infer<typeof updateMentorSchema>;

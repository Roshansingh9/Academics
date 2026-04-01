import { z } from "zod";

export const createNotificationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  body: z.string().min(5, "Body must be at least 5 characters"),
  target: z.enum(["SPECIFIC", "ALL"]),
  studentId: z.string().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

import { z } from "zod";
import { PaginationSchema } from "./shared.schema";

export const StudentListQuerySchema = PaginationSchema.extend({
  branch:         z.string().optional(),
  graduationYear: z.coerce.number().int().optional(),
  q:              z.string().max(200).trim().optional(),
});

export const UpdateStudentProfileSchema = z.object({
  name:  z.string().min(1).max(200).trim().optional(),
  phone: z.string().regex(/^\+?[0-9\s\-()]{7,20}$/).optional().nullable(),
});

export type StudentListQuery        = z.infer<typeof StudentListQuerySchema>;
export type UpdateStudentProfileInput = z.infer<typeof UpdateStudentProfileSchema>;

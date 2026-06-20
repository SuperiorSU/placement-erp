import { z } from "zod";
import { PaginationSchema } from "./shared.schema";

export const CreateInternshipSchema = z.object({
  studentId:      z.string().min(1, "Student is required"),
  placementId:    z.string().min(1, "Placement record is required"),
  startDate:      z.string().min(1, "Start date is required"),
  durationMonths: z.coerce.number().int().min(1).max(24),
  followUpNotes:  z.string().max(1000).trim().optional(),
});

export const UpdateInternshipSchema = z.object({
  outcome:        z.enum(["ONGOING", "CONVERTED", "EXTENDED", "NOT_CONVERTED"]).optional(),
  followUpNotes:  z.string().max(1000).trim().optional(),
  startDate:      z.string().optional(),
  durationMonths: z.coerce.number().int().min(1).max(24).optional(),
});

export const InternshipListQuerySchema = PaginationSchema.extend({
  outcome:      z.enum(["ONGOING", "CONVERTED", "EXTENDED", "NOT_CONVERTED"]).optional(),
  branch:       z.string().optional(),
  academicYear: z.string().optional(),
  endingSoon:   z.enum(["true", "false"]).optional(),
  q:            z.string().max(200).trim().optional(),
});

export type CreateInternshipInput = z.infer<typeof CreateInternshipSchema>;
export type UpdateInternshipInput = z.infer<typeof UpdateInternshipSchema>;
export type InternshipListQuery   = z.infer<typeof InternshipListQuerySchema>;

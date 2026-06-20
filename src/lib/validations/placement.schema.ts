import { z } from "zod";
import { PaginationSchema } from "./shared.schema";

export const CreateManualPlacementSchema = z.object({
  studentId:      z.string().min(1, "Student is required"),
  company:        z.string().min(1, "Company is required").max(200).trim(),
  jobRole:        z.string().min(1, "Job role is required").max(200).trim(),
  ctc:            z.coerce.number().positive("CTC must be positive"),
  referralSource: z.string().min(1, "Referral source is required").max(200).trim(),
  joiningDate:    z.string().optional().nullable(),
  type:           z.enum(["Intern", "Full-time", "PPO"]),
  academicYear:   z.string().regex(/^\d{4}-\d{4}$/, "Format must be YYYY-YYYY (e.g. 2025-2026)"),
});

export const PlacementListQuerySchema = PaginationSchema.extend({
  type:         z.enum(["CAMPUS", "MANUAL", "PPO"]).optional(),
  academicYear: z.string().optional(),
  branch:       z.string().optional(),
  q:            z.string().max(200).trim().optional(),
});

export const ManualPlacementListQuerySchema = PaginationSchema.extend({
  academicYear: z.string().optional(),
  branch:       z.string().optional(),
  q:            z.string().max(200).trim().optional(),
});

export type CreateManualPlacementInput = z.infer<typeof CreateManualPlacementSchema>;
export type PlacementListQuery         = z.infer<typeof PlacementListQuerySchema>;
export type ManualPlacementListQuery   = z.infer<typeof ManualPlacementListQuerySchema>;

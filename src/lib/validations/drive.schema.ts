import { z } from "zod";
import { PaginationSchema } from "./shared.schema";

export const CreateDriveSchema = z.object({
  companyId:           z.string().min(1, "Company is required"),
  jobRole:             z.string().min(1, "Job role is required").max(200).trim(),
  ctc:                 z.coerce.number().positive("CTC must be a positive number"),
  jobLocation:         z.string().min(1, "Location is required").max(200).trim(),
  eligibleBranches:    z.array(z.string().min(1)).min(1, "Select at least one eligible branch"),
  minCgpa:             z.coerce.number().min(0).max(10, "CGPA must be between 0 and 10"),
  driveDate:           z.string().min(1, "Drive date is required"),
  applicationDeadline: z.string().optional().nullable(),
  status:              z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]).default("UPCOMING"),
  academicYear:        z.string().regex(/^\d{4}-\d{4}$/, "Format must be YYYY-YYYY (e.g. 2025-2026)"),
  description:         z.string().max(2000).trim().optional(),
});

export const UpdateDriveSchema = CreateDriveSchema.partial();

export const DriveListQuerySchema = PaginationSchema.extend({
  status:       z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  companyId:    z.string().optional(),
  academicYear: z.string().optional(),
  q:            z.string().max(200).trim().optional(),
});

export const EnrollStudentSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  notes:     z.string().max(500).trim().optional(),
});

export const ApplicationListQuerySchema = PaginationSchema.extend({
  stage:  z.enum(["REGISTERED", "SHORTLISTED", "INTERVIEWED", "OFFERED", "NOT_SELECTED"]).optional(),
  branch: z.string().optional(),
  q:      z.string().max(200).trim().optional(),
});

export const UpdateFunnelStageSchema = z.object({
  stage:           z.enum(["REGISTERED", "SHORTLISTED", "INTERVIEWED", "OFFERED", "NOT_SELECTED"]),
  notes:           z.string().max(500).trim().optional(),
  joiningDate:     z.string().optional().nullable(),
  offerLetterUrl:  z.string().optional().nullable(),
  offerLetterName: z.string().optional().nullable(),
});

export const DriveParticipantQuerySchema = PaginationSchema.extend({
  branch:  z.string().optional(),
  stage:   z.enum(["REGISTERED", "SHORTLISTED", "INTERVIEWED", "OFFERED", "NOT_SELECTED"]).optional(),
  jobRole: z.string().max(200).trim().optional(),
  minCtc:  z.coerce.number().min(0).optional(),
  maxCtc:  z.coerce.number().min(0).optional(),
  q:       z.string().max(200).trim().optional(),
});

export const CompanyDriveHistoryQuerySchema = PaginationSchema.extend({
  year:   z.string().regex(/^\d{4}-\d{4}$/).optional(),
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
});

export type CreateDriveInput            = z.infer<typeof CreateDriveSchema>;
export type UpdateDriveInput            = z.infer<typeof UpdateDriveSchema>;
export type DriveListQuery              = z.infer<typeof DriveListQuerySchema>;
export type EnrollStudentInput          = z.infer<typeof EnrollStudentSchema>;
export type ApplicationListQuery        = z.infer<typeof ApplicationListQuerySchema>;
export type UpdateFunnelStageInput      = z.infer<typeof UpdateFunnelStageSchema>;
export type DriveParticipantQuery       = z.infer<typeof DriveParticipantQuerySchema>;
export type CompanyDriveHistoryQuery    = z.infer<typeof CompanyDriveHistoryQuerySchema>;

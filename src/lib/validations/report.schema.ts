import { z } from "zod";

export const CompanyReportQuerySchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  year:      z.string().regex(/^\d{4}-\d{4}$/).optional(),
  month:     z.coerce.number().int().min(0).max(11).optional(),
});

export const BranchReportQuerySchema = z.object({
  branch: z.string().min(1, "Branch is required"),
  year:   z.string().regex(/^\d{4}-\d{4}$/).optional(),
});

export const DriveReportQuerySchema = z.object({
  driveId: z.string().min(1, "Drive ID is required"),
  branch:  z.string().optional(),
  stage:   z.enum(["REGISTERED", "SHORTLISTED", "INTERVIEWED", "OFFERED", "NOT_SELECTED"]).optional(),
  jobRole: z.string().max(200).trim().optional(),
  minCtc:  z.coerce.number().min(0).optional(),
  maxCtc:  z.coerce.number().min(0).optional(),
});

export const YearlyCompaniesQuerySchema = z.object({
  year: z.string().regex(/^\d{4}-\d{4}$/, "Format must be YYYY-YYYY"),
});

export type CompanyReportQuery    = z.infer<typeof CompanyReportQuerySchema>;
export type BranchReportQuery     = z.infer<typeof BranchReportQuerySchema>;
export type DriveReportQuery      = z.infer<typeof DriveReportQuerySchema>;
export type YearlyCompaniesQuery  = z.infer<typeof YearlyCompaniesQuerySchema>;

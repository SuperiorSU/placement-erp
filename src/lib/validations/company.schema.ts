import { z } from "zod";
import { PaginationSchema } from "./shared.schema";

export const CreateCompanySchema = z.object({
  name:        z.string().min(1, "Name is required").max(200).trim(),
  industry:    z.string().min(1, "Industry is required").max(100).trim(),
  hrName:      z.string().min(1, "HR name is required").max(100).trim(),
  hrEmail:     z.string().email("Invalid email").toLowerCase(),
  hrPhone:     z.string().regex(/^\+?[0-9\s\-(]{7,20}$/, "Invalid phone number").optional(),
  website:     z.string().url("Invalid URL").optional().or(z.literal("")),
  category:    z.enum(["PRIME", "AVERAGE", "BELOW_AVERAGE"]),
  description: z.string().max(2000).trim().optional(),
});

export const UpdateCompanySchema = CreateCompanySchema.partial();

export const CompanyListQuerySchema = PaginationSchema.extend({
  category: z.enum(["PRIME", "AVERAGE", "BELOW_AVERAGE"]).optional(),
  q:        z.string().max(200).trim().optional(),
});

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
export type CompanyListQuery   = z.infer<typeof CompanyListQuerySchema>;

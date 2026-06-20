import { z } from "zod";
import { PaginationSchema } from "./shared.schema";

export const CreateConsentFormSchema = z.object({
  title:     z.string().min(1, "Title is required").max(300).trim(),
  content:   z.string().min(1, "Content is required").max(50000).trim(),
  driveId:   z.string().optional().nullable(),
  isGeneric: z.boolean().default(false),
  isActive:  z.boolean().default(true),
});

export const UpdateConsentFormSchema = CreateConsentFormSchema.partial();

export const ConsentFormListQuerySchema = PaginationSchema.extend({
  driveId:   z.string().optional(),
  isGeneric: z.enum(["true", "false"]).optional(),
  isActive:  z.enum(["true", "false"]).optional(),
  q:         z.string().max(200).trim().optional(),
});

export const SignConsentFormSchema = z.object({
  signatureData: z.string().min(1, "Signature is required").max(200000),
  signatureType: z.enum(["draw", "typed"]),
});

export const ConsentSignatureListQuerySchema = PaginationSchema.extend({
  status: z.enum(["PENDING", "SIGNED", "DECLINED"]).optional(),
});

export type CreateConsentFormInput    = z.infer<typeof CreateConsentFormSchema>;
export type UpdateConsentFormInput    = z.infer<typeof UpdateConsentFormSchema>;
export type ConsentFormListQuery      = z.infer<typeof ConsentFormListQuerySchema>;
export type SignConsentFormInput      = z.infer<typeof SignConsentFormSchema>;
export type ConsentSignatureListQuery = z.infer<typeof ConsentSignatureListQuerySchema>;

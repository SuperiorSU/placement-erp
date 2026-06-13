import { z } from "zod";

export const PaginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort:  z.string().optional(),
  dir:   z.enum(["asc", "desc"]).default("desc"),
});

export const SearchSchema = PaginationSchema.extend({
  q: z.string().max(200).optional(),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
export type SearchInput     = z.infer<typeof SearchSchema>;

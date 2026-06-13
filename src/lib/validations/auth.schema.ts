import { z } from "zod";

export const LoginSchema = z.object({
  email:    z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  email:          z.string().email("Invalid email address").toLowerCase().trim(),
  password:       z.string()
                    .min(8,   "Password must be at least 8 characters")
                    .max(128, "Password too long"),
  role:           z.enum(["SUPER_ADMIN", "ADMIN", "STUDENT"]),
  name:           z.string().min(1).max(200).trim(),
  // Admin-specific
  phone:          z.string().regex(/^\+?[0-9\s\-(]{7,20}$/).optional(),
  department:     z.string().max(100).trim().optional(),
  // Student-specific
  rollNumber:     z.string().min(1).max(50).trim().optional(),
  branch:         z.string().min(1).max(100).trim().optional(),
  cgpa:           z.number().min(0).max(10).optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
});

export type LoginInput    = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;

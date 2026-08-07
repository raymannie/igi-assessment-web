import { z } from "zod";

/**
 * Mirrors the backend auth DTOs (SPEC.md §6 Auth, §8 Security).
 * Field names and constraints must match the server exactly — if they drift,
 * the user gets a toast where an inline field error belonged.
 */

/** SPEC §8: min 8 chars with a letter and a number. */
export const passwordSchema = z
  .string()
  .min(8, "Must be at least 8 characters")
  .regex(/[A-Za-z]/, "Must contain a letter")
  .regex(/[0-9]/, "Must contain a number");

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  // The backend lowercases on write; do the same so the two agree.
  .transform((value) => value.trim().toLowerCase());

/**
 * Login deliberately does *not* apply the password policy — an existing account
 * failing a client-side rule would be unloggable, and the server decides here.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/** What the server receives (post-transform). */
export type LoginInput = z.infer<typeof loginSchema>;
/** What the form holds (pre-transform) — the `useForm` field type. */
export type LoginFormValues = z.input<typeof loginSchema>;

/** `POST /auth/register` — creates a CUSTOMER only. */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(2, "Enter your full name")
    .max(120, "Must be 120 characters or fewer")
    .transform((value) => value.trim()),
  phone: z
    .string()
    .max(32, "Must be 32 characters or fewer")
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  policyNumber: z
    .string()
    .max(64, "Must be 64 characters or fewer")
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterFormValues = z.input<typeof registerSchema>;

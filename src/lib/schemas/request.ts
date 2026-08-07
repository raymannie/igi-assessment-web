import { z } from "zod";

import {
  COMMENT_REQUIRED,
  officerCanTransition,
} from "@/lib/constants/statuses";

/**
 * Mirrors the backend request DTOs (SPEC.md §5 `requests`, §6 Requests, §7 uploads).
 */

export const requestTypeSchema = z.enum([
  "INSURANCE_CLAIM",
  "HMO_PRE_AUTHORIZATION",
]);

export const productCategorySchema = z.enum([
  "MOTOR",
  "HEALTH",
  "TRAVEL",
  "LIFE",
  "PROPERTY",
  "MARINE",
]);

export const requestStatusSchema = z.enum([
  "SUBMITTED",
  "ASSIGNED",
  "UNDER_REVIEW",
  "NEEDS_ADDITIONAL_INFO",
  "APPROVED",
  "DENIED",
  "WITHDRAWN",
]);

// ---------------------------------------------------------------------------
// §7 File uploads
// ---------------------------------------------------------------------------

export const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES_PER_UPLOAD = 5;

/**
 * `File` only exists in the browser, so this is lazy — importing this module in a
 * Server Component must not touch the global.
 */
export const documentFileSchema = z
  .custom<File>(
    (value) => typeof File !== "undefined" && value instanceof File,
    "Select a file"
  )
  .refine(
    (file) =>
      (ACCEPTED_MIME_TYPES as readonly string[]).includes(file.type) &&
      ACCEPTED_EXTENSIONS.some((extension) =>
        file.name.toLowerCase().endsWith(extension)
      ),
    "Only PDF, JPG and PNG files are accepted"
  )
  .refine((file) => file.size <= MAX_FILE_SIZE, "Each file must be under 5 MB");

export const documentFilesSchema = z
  .array(documentFileSchema)
  .max(MAX_FILES_PER_UPLOAD, `Attach at most ${MAX_FILES_PER_UPLOAD} files`);

// ---------------------------------------------------------------------------
// POST /requests
// ---------------------------------------------------------------------------

/** Today as `yyyy-MM-dd` — lexicographic comparison is safe in that format. */
function todayInputValue(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Input is form-shaped (every field a string, as HTML inputs always are) and
 * output is exactly `CreateRequestBody`. One schema serves both the form and the
 * API boundary, so the two cannot drift.
 */
export const createRequestSchema = z
  .object({
    requestType: z
      .string()
      .min(1, "Select a request type")
      .pipe(requestTypeSchema),
    productCategory: z
      .string()
      .min(1, "Select a product category")
      .pipe(productCategorySchema),
    policyNumber: z
      .string()
      .min(1, "Policy number is required")
      .max(64, "Must be 64 characters or fewer")
      .transform((value) => value.trim()),
    description: z
      .string()
      .trim()
      .min(10, "Describe what happened in at least 10 characters")
      .max(2000, "Must be 2000 characters or fewer"),
    incidentDate: z
      .string()
      .min(1, "Select the incident date")
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "Enter a valid date"
      )
      .refine(
        (value) => value <= todayInputValue(),
        "The incident date cannot be in the future"
      )
      // The API stores a Date; send a full ISO string.
      .transform((value) => new Date(value).toISOString()),
    /** Required for HMO — enforced in the superRefine below. */
    serviceProvider: z
      .string()
      .max(160, "Must be 160 characters or fewer")
      .optional()
      .transform((value) => (value?.trim() ? value.trim() : undefined)),
    /** NGN. */
    estimatedAmount: z
      .string()
      .min(1, "Enter the estimated amount")
      .refine(
        (value) => /^\d+(\.\d{1,2})?$/.test(value.trim()),
        "Enter a valid amount in naira"
      )
      .transform((value) => Number(value.trim()))
      .refine((amount) => amount > 0, "Must be greater than zero"),
  })
  .superRefine((value, ctx) => {
    // SPEC §4: serviceProvider is required for HMO pre-authorizations, optional
    // otherwise. Enforced on both sides.
    if (
      value.requestType === "HMO_PRE_AUTHORIZATION" &&
      !value.serviceProvider
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["serviceProvider"],
        message: "Service provider is required for pre-authorizations",
      });
    }
  });

/** Post-transform — matches `CreateRequestBody`. */
export type CreateRequestInput = z.infer<typeof createRequestSchema>;
/** Pre-transform — the `useForm` field type. */
export type CreateRequestFormValues = z.input<typeof createRequestSchema>;

// ---------------------------------------------------------------------------
// PATCH /requests/:id/status
// ---------------------------------------------------------------------------

/**
 * `fromStatus` is not sent to the server; it's context so the schema can check
 * the transition and the COMMENT_REQUIRED rule locally.
 */
export const statusChangeSchema = z
  .object({
    fromStatus: requestStatusSchema,
    status: requestStatusSchema,
    comment: z
      .string()
      .max(2000, "Must be 2000 characters or fewer")
      .optional()
      .transform((value) => (value?.trim() ? value.trim() : undefined)),
  })
  .superRefine((value, ctx) => {
    // Officer-only table: PATCH /status is an officer endpoint, and the
    // customer's NEEDS_ADDITIONAL_INFO → UNDER_REVIEW goes through /respond.
    if (!officerCanTransition(value.fromStatus, value.status)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "That is not a permitted transition",
      });
      return;
    }

    if (COMMENT_REQUIRED.includes(value.status) && !value.comment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["comment"],
        message: "A comment is required for this decision",
      });
    }
  });

export type StatusChangeInput = z.infer<typeof statusChangeSchema>;

// ---------------------------------------------------------------------------
// POST /requests/:id/respond
// ---------------------------------------------------------------------------

export const respondSchema = z.object({
  message: z
    .string()
    .min(1, "Enter a response")
    .max(2000, "Must be 2000 characters or fewer"),
  documents: documentFilesSchema.optional(),
});

export type RespondInput = z.infer<typeof respondSchema>;

// ---------------------------------------------------------------------------
// POST /requests/:id/documents
// ---------------------------------------------------------------------------

export const uploadDocumentsSchema = z.object({
  files: documentFilesSchema.min(1, "Select at least one file"),
});

export type UploadDocumentsInput = z.infer<typeof uploadDocumentsSchema>;

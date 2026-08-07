"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SpinnerIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/common/field";
import { SelectField } from "@/components/common/select-field";
import { DocumentUploader } from "@/components/requests/document-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PRODUCT_CATEGORY_OPTIONS,
  REQUEST_TYPE_OPTIONS,
} from "@/lib/constants/statuses";
import { applyServerFieldErrors, isNormalizedApiError } from "@/lib/form-errors";
import {
  createRequestSchema,
  type CreateRequestFormValues,
  type CreateRequestInput,
} from "@/lib/schemas/request";
import {
  useCreateRequestMutation,
  useUploadDocumentsMutation,
} from "@/store/api/requestsApi";
import type { User } from "@/types";

const FIELDS = [
  "requestType",
  "productCategory",
  "policyNumber",
  "description",
  "incidentDate",
  "serviceProvider",
  "estimatedAmount",
] as const;

function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-4 border-t pt-4 first:border-t-0 first:pt-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-col gap-0.5">
        <h2 className="font-heading text-sm font-medium">{legend}</h2>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      {children}
    </fieldset>
  );
}

export function RequestForm({ user }: { user: User }) {
  const router = useRouter();
  const [createRequest, { isLoading: creating }] = useCreateRequestMutation();
  const [uploadDocuments, { isLoading: uploading }] =
    useUploadDocumentsMutation();

  // Files sit outside RHF — the uploader owns its own type/size validation and
  // they go to a separate endpoint after the request exists.
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CreateRequestFormValues, unknown, CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    mode: "onBlur",
    defaultValues: {
      requestType: "",
      productCategory: "",
      policyNumber: user.policyNumber ?? "",
      description: "",
      incidentDate: "",
      serviceProvider: "",
      estimatedAmount: "",
    },
  });

  // `useWatch` rather than `watch()` — the latter returns an unmemoizable
  // function that makes the React Compiler skip this whole component.
  const requestType = useWatch({ control, name: "requestType" });
  const isHmo = requestType === "HMO_PRE_AUTHORIZATION";
  const pending = creating || uploading;

  const onSubmit = async (values: CreateRequestInput) => {
    try {
      const created = await createRequest(values).unwrap();

      if (files.length) {
        try {
          await uploadDocuments({ id: created._id, files }).unwrap();
        } catch (uploadError) {
          // The request exists — don't lose it over a failed attachment.
          const message = isNormalizedApiError(uploadError)
            ? uploadError.message
            : "the upload failed";
          toast.warning(
            `${created.requestNumber} was submitted, but ${message}. You can attach the documents from the request page.`
          );
          router.push(`/requests/${created._id}`);
          return;
        }
      }

      toast.success(`${created.requestNumber} submitted`);
      router.push(`/requests/${created._id}`);
    } catch (error) {
      if (!isNormalizedApiError(error)) {
        toast.error("Could not submit this request. Please try again.");
        return;
      }
      if (!applyServerFieldErrors(error, setError, FIELDS)) {
        toast.error(error.message);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <Fieldset
        legend="Request details"
        hint="Tell us what kind of request this is and which policy it falls under."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Request type"
            htmlFor="requestType"
            error={errors.requestType?.message}
          >
            <SelectField
              control={control}
              name="requestType"
              id="requestType"
              options={REQUEST_TYPE_OPTIONS}
              placeholder="Select a type"
              invalid={Boolean(errors.requestType)}
            />
          </Field>

          <Field
            label="Product category"
            htmlFor="productCategory"
            error={errors.productCategory?.message}
          >
            <SelectField
              control={control}
              name="productCategory"
              id="productCategory"
              options={PRODUCT_CATEGORY_OPTIONS}
              placeholder="Select a category"
              invalid={Boolean(errors.productCategory)}
            />
          </Field>

          <Field
            label="Policy number"
            htmlFor="policyNumber"
            error={errors.policyNumber?.message}
          >
            <Input
              id="policyNumber"
              placeholder="IGI-POL-0001"
              aria-invalid={Boolean(errors.policyNumber)}
              {...register("policyNumber")}
            />
          </Field>

          <Field
            label="Estimated amount"
            htmlFor="estimatedAmount"
            error={errors.estimatedAmount?.message}
            hint="In naira (NGN)."
          >
            <Input
              id="estimatedAmount"
              inputMode="decimal"
              placeholder="95000"
              aria-invalid={Boolean(errors.estimatedAmount)}
              {...register("estimatedAmount")}
            />
          </Field>
        </div>

        {/* Only meaningful for pre-authorizations, and required when shown. */}
        {isHmo ? (
          <Field
            label="Service provider"
            htmlFor="serviceProvider"
            error={errors.serviceProvider?.message}
            hint="The hospital or clinic that will provide the treatment."
          >
            <Input
              id="serviceProvider"
              placeholder="Reddington Hospital, Victoria Island"
              aria-invalid={Boolean(errors.serviceProvider)}
              {...register("serviceProvider")}
            />
          </Field>
        ) : null}
      </Fieldset>

      <Fieldset
        legend="Incident details"
        hint="When it happened, and what happened."
      >
        <Field
          label="Incident date"
          htmlFor="incidentDate"
          error={errors.incidentDate?.message}
          className="sm:max-w-56"
        >
          <Input
            id="incidentDate"
            type="date"
            aria-invalid={Boolean(errors.incidentDate)}
            {...register("incidentDate")}
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          error={errors.description?.message}
          hint="Between 10 and 2000 characters."
        >
          <Textarea
            id="description"
            rows={5}
            placeholder="Describe what happened, including anything an assessor would need to know."
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
          />
        </Field>
      </Fieldset>

      <Fieldset
        legend="Documents"
        hint="Optional now — you can attach more later while the request is open."
      >
        <DocumentUploader
          files={files}
          onChange={setFiles}
          disabled={pending}
          uploading={uploading}
        />
      </Fieldset>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <SpinnerIcon className="animate-spin" aria-hidden />
              {uploading ? "Attaching documents…" : "Submitting…"}
            </>
          ) : (
            "Submit request"
          )}
        </Button>
      </div>
    </form>
  );
}

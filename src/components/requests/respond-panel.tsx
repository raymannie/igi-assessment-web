"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PaperPlaneTiltIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Field } from "@/components/common/field";
import { DocumentUploader } from "@/components/requests/document-uploader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { applyServerFieldErrors, isNormalizedApiError } from "@/lib/form-errors";
import { respondSchema } from "@/lib/schemas/request";
import { useRespondToRequestMutation } from "@/store/api/requestsApi";
import type { PortalRequest } from "@/types";
import type { z } from "zod";

type RespondFormValues = Pick<z.input<typeof respondSchema>, "message">;

const messageOnlySchema = respondSchema.pick({ message: true });

/**
 * Only rendered when `customerActions(status).canRespond`. Responding moves the
 * request back to UNDER_REVIEW server-side — SPEC §3 forbids setting that status
 * directly, which is why this posts to `/respond` rather than `/status`.
 */
export function RespondPanel({ request }: { request: PortalRequest }) {
  const [respond, { isLoading }] = useRespondToRequestMutation();
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RespondFormValues>({
    resolver: zodResolver(messageOnlySchema),
    mode: "onBlur",
    defaultValues: { message: "" },
  });

  const onSubmit = async (values: RespondFormValues) => {
    try {
      await respond({
        id: request._id,
        message: values.message,
        files: files.length ? files : undefined,
      }).unwrap();

      toast.success("Response sent — your request is back under review");
      reset({ message: "" });
      setFiles([]);
    } catch (error) {
      if (!isNormalizedApiError(error)) {
        toast.error("Could not send your response. Please try again.");
        return;
      }
      if (!applyServerFieldErrors(error, setError, ["message"])) {
        toast.error(error.message);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <Field
        label="Your response"
        htmlFor="message"
        error={errors.message?.message}
        hint="The reviewing officer will see this on the request timeline."
      >
        <Textarea
          id="message"
          rows={4}
          placeholder="Provide the information the officer asked for."
          aria-invalid={Boolean(errors.message)}
          {...register("message")}
        />
      </Field>

      <DocumentUploader
        files={files}
        onChange={setFiles}
        disabled={isLoading}
        uploading={isLoading}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <SpinnerIcon className="animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            <>
              <PaperPlaneTiltIcon aria-hidden />
              Send response
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

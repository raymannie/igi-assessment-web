"use client";

import { PaperclipIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

import { DocumentUploader } from "@/components/requests/document-uploader";
import { Button } from "@/components/ui/button";
import { isNormalizedApiError } from "@/lib/form-errors";
import { useUploadDocumentsMutation } from "@/store/api/requestsApi";
import type { PortalRequest } from "@/types";

/**
 * Attaching files to an existing request. Available to whoever the caller decides
 * — SPEC §7 allows uploads while a request is not terminal, which is what
 * `customerActions`/`officerActions` expose as `canUploadDocuments`.
 */
export function DocumentUploadPanel({ request }: { request: PortalRequest }) {
  const [uploadDocuments, { isLoading }] = useUploadDocumentsMutation();
  const [files, setFiles] = useState<File[]>([]);

  const submit = async () => {
    if (!files.length) return;
    try {
      await uploadDocuments({ id: request._id, files }).unwrap();
      toast.success(
        files.length === 1 ? "Document attached" : `${files.length} documents attached`
      );
      setFiles([]);
    } catch (error) {
      toast.error(
        isNormalizedApiError(error)
          ? error.message
          : "Could not attach the documents. Please try again."
      );
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs text-muted-foreground">Attach documents</span>

      <DocumentUploader
        files={files}
        onChange={setFiles}
        disabled={isLoading}
        uploading={isLoading}
      />

      {files.length ? (
        <div className="flex justify-end">
          <Button size="sm" disabled={isLoading} onClick={submit}>
            {isLoading ? (
              <>
                <SpinnerIcon className="animate-spin" aria-hidden />
                Attaching…
              </>
            ) : (
              <>
                <PaperclipIcon aria-hidden />
                Attach {files.length === 1 ? "file" : `${files.length} files`}
              </>
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

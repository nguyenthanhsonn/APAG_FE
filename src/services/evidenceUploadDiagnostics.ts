export type EvidenceUploadStage = 'prepare-form' | 'cloudinary-upload' | 'link-evidence';

/** Only log diagnostic fields; never include request headers, tokens or file contents. */
export function logEvidenceUploadError(
  stage: EvidenceUploadStage,
  error: unknown,
  context: {
    evaluationFormId?: string | null;
    criteriaCode?: string;
    fileType?: string;
    fileSize?: number;
  } = {},
) {
  const detail = error as { message?: string; statusCode?: number; errors?: unknown } | null;
  console.error('[evidence-upload]', {
    stage,
    ...context,
    statusCode: detail?.statusCode,
    message: detail?.message || String(error),
    errors: detail?.errors,
  });
}

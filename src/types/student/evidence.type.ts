export interface Evidence {
  id: string;
  evaluationFormId?: string;
  evaluationVersion?: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  criteriaId: string;
  uploadDate: string;
  aiVerification?: 'verified' | 'suspicious' | 'manual_review';
}

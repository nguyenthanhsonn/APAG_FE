export interface EvidenceFile {
  evaluationFormId?: string;
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url?: string;
  criteriaId: string;
  uploadDate: string;
  aiVerification?: 'verified' | 'suspicious' | 'manual_review';
}

export type UploadedEvidenceFile = {
  id?: string;
  name: string;
  url: string;
  type?: string;
};

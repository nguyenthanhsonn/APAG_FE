export interface EvidenceFile {
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
  name: string;
  url: string;
  type?: string;
};

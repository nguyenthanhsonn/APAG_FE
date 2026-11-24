import { axiosInstance, buildQueryParams, get } from './api';
import type { AdminEvaluationItem, AdminEvaluationListQuery, PaginatedResponse } from '../types';

export interface FacultyClassEvaluation {
  id: string;
  evaluationId?: string;
  studentId?: string;
  code: string;
  name: string;
  status: string;
  score: number | null;
  rank: string | null;
  submittedAt: string | null;
}

export interface FacultyClassEvaluationPage extends PaginatedResponse<FacultyClassEvaluation> {
  page: number;
  limit: number;
  totalStudents: number;
  submittedCount: number;
  approvedCount: number;
  canSubmitToTrainingDepartment: boolean;
}

export type FacultyReportExportFormat = 'excel' | 'word';

async function normalizeBlobError(error: any) {
  const blob = error?.response?.data;
  if (!(blob instanceof Blob)) {
    throw error;
  }

  const text = await blob.text();
  let message = text || error?.message || 'Không thể xuất biên bản họp khoa.';
  let errors: unknown;

  try {
    const parsed = JSON.parse(text);
    const parsedMessage = parsed?.message;
    message = Array.isArray(parsedMessage) ? parsedMessage.join('\n') : parsedMessage || message;
    errors = parsed?.errors;
  } catch {
    // BE may return plain text for binary endpoints.
  }

  const normalizedError = new Error(message) as Error & { statusCode?: number; errors?: unknown };
  normalizedError.statusCode = error?.response?.status;
  normalizedError.errors = errors;
  throw normalizedError;
}

/**
 * API chuyên biệt cho vai trò Khoa / Trợ lý Khoa
 */
export const API_Faculty = {
  getClassStudentEvaluations: (
    classId: string,
    query: { page: number; limit: number; search?: string; status?: string },
  ) =>
    get<FacultyClassEvaluationPage>(`/classes/${classId}/student-evaluations`, {
      params: buildQueryParams(query),
    }),

  /** Khoa lấy danh sách phiếu trong phạm vi khoa được phân công */
  getFacultyEvaluations: (facultyId: string, query?: AdminEvaluationListQuery) => {
    return get<AdminEvaluationItem[]>(
      '/training-evaluations',
      { params: buildQueryParams({ facultyId, ...query }) },
    );
  },

  /** Khoa xuất biên bản họp khoa theo template từ BE */
  exportBienBanHopKhoa: async (format: FacultyReportExportFormat, payload: unknown) => {
    try {
      const res = await axiosInstance.post<Blob>(
        `/reports/export/${format}/bien-ban-hop-khoa`,
        payload,
        { responseType: 'blob' },
      );

      return res;
    } catch (error) {
      await normalizeBlobError(error);
      throw error;
    }
  },
};

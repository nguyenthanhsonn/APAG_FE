import { axiosInstance, buildQueryParams, get, post } from './api';
import type { AdminEvaluationItem, AdminEvaluationListQuery } from '../types';

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
  /** Khoa lấy danh sách phiếu trong phạm vi khoa được phân công */
  getFacultyEvaluations: (facultyId: string, query?: AdminEvaluationListQuery) => {
    return get<AdminEvaluationItem[]>(
      '/training-evaluations',
      { params: buildQueryParams({ facultyId, ...query }) },
    );
  },

  /** Khoa duyệt một phiếu đã được CVHT chốt */
  approveFacultyEvaluation: (id: string) => {
    return post<AdminEvaluationItem>(`/training-evaluations/${id}/review`, { action: 'approve' });
  },

  /** Khoa trả phiếu về CVHT kèm lý do */
  rejectFacultyEvaluation: (id: string, reason: string) => {
    return post<AdminEvaluationItem>(`/training-evaluations/${id}/review`, { action: 'reject', comment: reason });
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

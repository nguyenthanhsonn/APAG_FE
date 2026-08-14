import { axiosInstance, post } from './api';
import { API_Shared } from './API_Shared';
import type {
  AdminEvaluationListQuery,
  SubmitClassEvaluationPayload,
  SubmitClassEvaluationResponse,
} from '../types';

export type ClassLeaderReportExportFormat = 'excel' | 'word';

async function normalizeBlobError(error: any) {
  const blob = error?.response?.data;
  if (!(blob instanceof Blob)) {
    throw error;
  }

  const text = await blob.text();
  let message = text || error?.message || 'Không thể xuất biên bản họp lớp.';
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
 * API chuyên biệt cho vai trò Lớp trưởng
 */
export const API_ClassLeader = {
  /** Lớp trưởng lấy danh sách phiếu đánh giá của lớp được phân công */
  getClassLeaderEvaluations: (classId: string, query?: AdminEvaluationListQuery) => {
    return API_Shared.getTrainingEvaluations({ classId, ...query });
  },

  /** Lớp trưởng duyệt phiếu đánh giá cho sinh viên trong lớp */
  approveClassLeaderEvaluation: (id: string, score?: number) => {
    if (score) {
      // Keep score reference
    }
    return API_Shared.reviewEvaluation(id, { action: 'approve' });
  },

  /** Lớp trưởng xác nhận đã đánh giá 1 phiếu */
  confirmReview: (id: string) => {
    return API_Shared.confirmReview(id);
  },

  /** Lớp trưởng gửi danh sách phiếu trong lớp lên Cố vấn học tập */
  submitClassToAdvisor: (
    classId: string,
    payload: SubmitClassEvaluationPayload = {},
  ) => {
    return post<SubmitClassEvaluationResponse>(
      `/training-evaluations/classes/${classId}/submit-to-advisor`,
      payload,
    );
  },

  /** Lớp trưởng xuất biên bản họp lớp theo template từ BE */
  exportBienBanHopLop: async (format: ClassLeaderReportExportFormat, payload: unknown) => {
    try {
      const res = await axiosInstance.post<Blob>(
        `/reports/export/${format}/bien-ban-hop-lop`,
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

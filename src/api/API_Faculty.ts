import { buildQueryParams, get, post } from './api';
import type { AdminEvaluationItem, AdminEvaluationListQuery } from '../types';

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
};

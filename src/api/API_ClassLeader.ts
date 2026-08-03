import { post } from './api';
import { API_Shared } from './API_Shared';
import type {
  AdminEvaluationListQuery,
  SubmitClassEvaluationPayload,
  SubmitClassEvaluationResponse,
} from '../types';

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
};

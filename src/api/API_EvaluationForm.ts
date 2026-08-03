import { get, patch, post } from './api';
import { API_Shared, type ReviewScoresPayload, type ReviewEvaluationPayload } from './API_Shared';
import type {
  AdminEvaluationItem,
  BulkFinalizeEvaluationsPayload,
  FinalizeEvaluationPayload,
  FinalizeEvaluationsByFilterPayload,
  ReopenEvaluationPayload,
} from '../types';

/**
 * API chuyên biệt cho Phiếu đánh giá rèn luyện (Evaluation Form)
 */
export const API_EvaluationForm = {
  /** Lấy chi tiết thông tin phiếu đánh giá rèn luyện theo ID */
  getEvaluationDetail: (id: string) => {
    return get<AdminEvaluationItem>(`/training-evaluations/${id}`);
  },

  /** Cập nhật / Chấm điểm chi tiết theo các mục tiêu chí */
  reviewScores: (evaluationId: string, data: ReviewScoresPayload) => {
    return API_Shared.reviewScores(evaluationId, data);
  },

  /** Duyệt hoặc Trả lại phiếu đánh giá rèn luyện */
  reviewEvaluation: (evaluationId: string, data: ReviewEvaluationPayload) => {
    return API_Shared.reviewEvaluation(evaluationId, data);
  },

  /** Mở lại phiếu đánh giá đã nộp */
  reopenEvaluation: (id: string, payload?: ReopenEvaluationPayload) => {
    return post<AdminEvaluationItem>(`/training-evaluations/${id}/reopen`, payload);
  },

  /** Ghi nhận điểm Hội đồng tự chấm cho lớp */
  reviewScoresByClassCouncil: (id: string, payload: ReviewScoresPayload) => {
    return API_Shared.reviewScores(id, payload);
  },

  /** Admin phê duyệt cuối cùng phiếu đánh giá */
  finalizeEvaluation: (id: string, payload: FinalizeEvaluationPayload = {}) => {
    return patch<AdminEvaluationItem>(`/admin/training-evaluations/${id}/finalize`, payload);
  },

  /** Admin phê duyệt hàng loạt phiếu đánh giá đã chọn */
  bulkFinalizeEvaluations: (payload: BulkFinalizeEvaluationsPayload) => {
    return patch<{ finalizedCount?: number; items?: AdminEvaluationItem[] }>(
      '/admin/evaluations/bulk-finalize',
      payload,
    );
  },

  /** Admin phê duyệt tất cả phiếu theo bộ lọc hiện tại */
  finalizeEvaluationsByFilter: (payload: FinalizeEvaluationsByFilterPayload) => {
    return post<{ finalizedCount?: number; total?: number }>(
      '/admin/evaluations/finalize-by-filter',
      payload,
    );
  },
};

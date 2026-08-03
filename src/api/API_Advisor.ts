import { post } from './api';
import { API_Shared } from './API_Shared';
import type {
  AdminEvaluationItem,
  ReturnEvaluationToStudentPayload,
  SubmitClassEvaluationPayload,
  SubmitClassEvaluationResponse,
} from '../types';

/**
 * API chuyên biệt cho vai trò Cố vấn học tập (CVHT)
 */
export const API_Advisor = {
  /** Lấy thông tin lớp phụ trách của CVHT */
  getAdvisorClassById: (classId: string) => {
    return API_Shared.getClassDetails(classId);
  },

  /** CVHT xác nhận đã đánh giá 1 phiếu */
  confirmReview: (id: string) => {
    return API_Shared.confirmReview(id);
  },

  /** CVHT nộp toàn bộ danh sách phiếu đánh giá của lớp lên Khoa */
  submitClassToFaculty: (
    classId: string,
    payload: SubmitClassEvaluationPayload = {},
  ) => {
    return post<SubmitClassEvaluationResponse>(
      `/training-evaluations/classes/${classId}/submit-to-faculty`,
      payload,
    );
  },

  /** CVHT gửi trả phiếu đánh giá về cho sinh viên kèm lý do */
  returnEvaluationToStudent: (
    id: string,
    payload: ReturnEvaluationToStudentPayload,
  ) => {
    return post<AdminEvaluationItem>(
      `/training-evaluations/${id}/return-to-student`,
      payload,
    );
  },
};

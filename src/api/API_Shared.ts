import { get, patch, post, buildQueryParams } from './api';
import type {
  AdminClass,
  AdminEvaluationItem,
  AdminMajor,
  AdminUser,
  PaginatedResponse,
} from '../types';

export interface SharedStudentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface SharedFacultyQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface SharedEvaluationQueryParams {
  page?: number;
  limit?: number;
  facultyId?: string;
  classId?: string;
  semesterId?: string;
  status?: string;
  search?: string;
}

export interface ReviewScoreItem {
  criteriaCode: string;
  classScore: number;
  reviewerNote?: string;
}

export interface ReviewScoresPayload {
  scores?: ReviewScoreItem[];
  classScore?: number;
  advisorScore?: number;
  classLeaderScore?: number;
  score?: number;
  note?: string;
  comment?: string;
  [key: string]: unknown;
}

export interface ReviewEvaluationPayload {
  action: 'approve' | 'reject';
  comment?: string;
}

export const API_Shared = {
  /** 1. Lấy thông tin chi tiết lớp học (Dùng cho Admin, Khoa, CVHT, Lớp trưởng) */
  getClassDetails: async (classId: string) => {
    try {
      return await get<AdminClass>(`/classes/${classId}`);
    } catch (err: any) {
      const status = err?.response?.status || err?.statusCode || err?.status;
      if (status === 403 || status === 404) {
        return null;
      }
      throw err;
    }
  },

  /** 2. Lấy danh sách sinh viên theo lớp (Dùng cho Admin, Khoa, CVHT, Lớp trưởng) */
  getClassStudents: async (classId: string, params?: SharedStudentQueryParams) => {
    try {
      return await get<PaginatedResponse<AdminUser> | AdminUser[]>(`/classes/${classId}/students`, {
        params: buildQueryParams(params),
      });
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.statusCode === 404 || err?.status === 404) {
        try {
          const evals = await API_Shared.getTrainingEvaluations({
            classId,
            page: params?.page || 1,
            limit: params?.limit || 100,
          });
          const items = Array.isArray(evals) ? evals : (evals as any)?.data || [];
          return items.map((item: any) => ({
            id: item.studentId || item.student?.id || item.user?.id || item.id,
            studentCode:
              item.studentCode ||
              item.student?.studentCode ||
              item.student?.code ||
              item.user?.studentCode ||
              item.user?.code ||
              '-',
            fullName: item.studentName || item.student?.fullName || item.user?.fullName || 'Sinh viên',
            ...item.student,
          }));
        } catch {
          return [];
        }
      }
      throw err;
    }
  },

  /** 3. Lấy danh sách ngành thuộc khoa (Dùng cho Admin, Khoa) */
  getFacultyMajors: (facultyId: string, params?: SharedFacultyQueryParams) => {
    return get<PaginatedResponse<AdminMajor> | AdminMajor[]>(`/faculties/${facultyId}/majors`, {
      params: buildQueryParams(params),
    });
  },

  /** 3b. Lấy danh sách thống kê lớp thuộc khoa cho Dashboard Khoa (Dùng cho Khoa, Admin) */
  getFacultyClassStats: (facultyId: string, semesterId?: string) => {
    return get<{ totalClasses: number; items: any[] }>(`/faculties/${facultyId}/class-stats`, {
      params: buildQueryParams({ semesterId }),
    });
  },

  /** 3c. Lấy danh sách đánh giá sinh viên trong lớp cho Biên bản Hội đồng Khoa (Dùng cho Khoa, Admin) */
  getFacultyCouncilReview: (facultyId: string, classId: string, semesterId?: string) => {
    return get<{ classId: string; className: string; totalStudents: number; items: any[] }>(
      `/faculties/${facultyId}/classes/${classId}/council-review`,
      { params: buildQueryParams({ semesterId }) },
    );
  },

  /** 4. Lấy danh sách lớp thuộc ngành (Dùng cho Admin, Khoa) */
  getMajorClasses: (majorId: string, params?: SharedFacultyQueryParams) => {
    return get<PaginatedResponse<AdminClass> | AdminClass[]>(`/majors/${majorId}/classes`, {
      params: buildQueryParams(params),
    });
  },

  /** 5. Danh sách phiếu ĐRL thuộc phạm vi quản lý (Dùng cho Admin, CVHT, Lớp trưởng) */
  getTrainingEvaluations: async (params?: SharedEvaluationQueryParams) => {
    try {
      return await get<PaginatedResponse<AdminEvaluationItem> | AdminEvaluationItem[]>(`/training-evaluations`, {
        params: buildQueryParams(params),
      });
    } catch (err: any) {
      const status = err?.response?.status || err?.statusCode || err?.status;
      if (status === 403 || status === 404) {
        return [];
      }
      throw err;
    }
  },

  /** 6. Chấm / Chỉnh sửa điểm ĐRL cho sinh viên (Dùng cho CVHT, Lớp trưởng) */
  reviewScores: (evaluationId: string, data: ReviewScoresPayload) => {
    const maxScoreMap: Record<string, number> = { TC1: 20, TC2: 25, TC3: 20, TC4: 25, TC5: 10 };
    const cleanPayload = {
      scores: (Array.isArray(data.scores) ? data.scores : []).map((item) => {
        const criteriaCode = String(item.criteriaCode || '').trim();
        const rawScore = Number(item.classScore);
        const max = maxScoreMap[criteriaCode] || 100;
        const clampedScore = Math.min(max, Math.max(0, Number.isNaN(rawScore) ? 0 : rawScore));

        const scoreItem: { criteriaCode: string; classScore: number; reviewerNote?: string } = {
          criteriaCode,
          classScore: clampedScore,
        };

        const note = item.reviewerNote;
        if (typeof note === 'string' && note.trim() !== '') {
          scoreItem.reviewerNote = note.trim();
        }

        return scoreItem;
      }).filter((item) => item.criteriaCode),
    };

    return patch<AdminEvaluationItem>(`/training-evaluations/${evaluationId}/review-scores`, cleanPayload);
  },

  /** 7. Phê duyệt / Trả lại phiếu ĐRL (Dùng cho Admin, CVHT, Lớp trưởng) */
  reviewEvaluation: (evaluationId: string, data: ReviewEvaluationPayload) => {
    const raw: Record<string, unknown> = { ...(data as any) };
    const cleanPayload: Record<string, unknown> = {};

    if (raw.action === 'approve' || raw.action === 'reject') {
      cleanPayload.action = raw.action;
    }
    if (typeof raw.comment === 'string' && raw.comment.trim() !== '') {
      cleanPayload.comment = raw.comment.trim();
    }

    return post<AdminEvaluationItem>(`/training-evaluations/${evaluationId}/review`, cleanPayload);
  },

  /** 8. Xác nhận đã đánh giá một phiếu (Dùng cho ClassLeader, CVHT) */
  confirmReview: (evaluationId: string, payload?: { scores?: Array<{ criteriaCode: string; classScore: number; reviewerNote?: string }> }) => {
    if (!payload?.scores?.length) {
      return post<AdminEvaluationItem>(`/training-evaluations/${evaluationId}/confirm-review`, {});
    }

    return post<AdminEvaluationItem>(`/training-evaluations/${evaluationId}/confirm-review`, {
      scores: payload.scores.map((item) => ({
        criteriaCode: item.criteriaCode,
        classScore: item.classScore,
        ...(item.reviewerNote ? { reviewerNote: item.reviewerNote } : {}),
      })),
    });
  },
};

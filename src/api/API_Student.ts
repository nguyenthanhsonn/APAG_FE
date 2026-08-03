import { buildQueryParams, del, get, patch, post } from './api';

import type {
  AcademicYear,
  Class,
  CreateEvaluationPayload,
  EvaluationPopupResponse,
  Faculty,
  LinkEvidenceUrlPayload,
  Major,
  NotificationListQuery,
  NotificationListResponse,
  ScoreSectionPayload,
  ScoreSectionResponse,
  Semester,
  StudentEvaluation,
  StudentEvidence,
  StudentProfile,
  StudentProfileUpdatePayload,
  UpdateEvaluationNotePayload,
} from '../types';

/** Lấy hồ sơ sinh viên. */
async function getMyProfile(_accessToken?: string) {
  void _accessToken;
  return get<StudentProfile>('/profile');
}

/** Cập nhật hồ sơ sinh viên. */
async function updateMyProfile(payload: StudentProfileUpdatePayload) {
  return patch<StudentProfile>('/profile', payload);
}

/** Lấy danh sách phiếu của sinh viên. */
async function getMyEvaluationList(_accessToken?: string) {
  void _accessToken;
  return get<StudentEvaluation[]>('/training-evaluations/me');
}

/** Lấy danh sách học kỳ. */
async function getSemesters() {
  return get<Semester[]>('/semesters');
}

/** Lấy học kỳ đang mở. */
async function getCurrentSemester() {
  return get<Semester>('/semesters/current');
}

/** Lấy trạng thái popup nhắc nhở đánh giá rèn luyện cho sinh viên. */
async function getEvaluationPopup() {
  return get<EvaluationPopupResponse>('/semesters/evaluation-popup');
}

/** Lấy danh sách năm học. */
async function getAcademicYears() {
  return get<AcademicYear[]>('/academic-years');
}

/** Lấy danh sách khoa. */
async function getFaculties() {
  return get<Faculty[]>('/metadata/faculties');
}

/** Lấy danh sách ngành. */
async function getMajors(facultyId?: string) {
  return get<Major[]>('/metadata/majors', { params: buildQueryParams({ facultyId }) });
}

/** Lấy danh sách lớp. */
async function getClasses(majorId?: string) {
  return get<Class[]>('/metadata/classes', { params: buildQueryParams({ majorId }) });
}

/** Tạo phiếu đánh giá mới. */
async function createEvaluation(_accessTokenOrPayload: string | CreateEvaluationPayload, semester?: string, academicYear?: string) {
  const payload =
    typeof _accessTokenOrPayload === 'string'
      ? ({ semester: semester || '', academicYear: academicYear || '' } satisfies CreateEvaluationPayload)
      : _accessTokenOrPayload;

  return post<StudentEvaluation>('/training-evaluations', payload);
}

/** Lấy phiếu đánh giá của sinh viên. */
async function getMyEvaluations(_accessToken?: string) {
  void _accessToken;
  return get<StudentEvaluation[]>('/training-evaluations/me');
}

/** Lấy chi tiết phiếu đánh giá. */
async function getEvaluationDetail(_accessTokenOrId: string, id?: string) {
  return get<StudentEvaluation>(`/training-evaluations/${id || _accessTokenOrId}`);
}

/** Cập nhật ghi chú phiếu đánh giá. */
async function updateEvaluationNote(
  _accessTokenOrId: string,
  idOrPayload: string | UpdateEvaluationNotePayload,
  payload?: UpdateEvaluationNotePayload
) {
  const id = typeof idOrPayload === 'string' ? idOrPayload : _accessTokenOrId;
  const data = typeof idOrPayload === 'string' ? payload : idOrPayload;

  return patch<StudentEvaluation>(`/training-evaluations/${id}`, data);
}

/** Cập nhật điểm học tập. */
async function updateStudyScore(_accessTokenOrId: string, idOrPayload: string | ScoreSectionPayload, payload?: ScoreSectionPayload) {
  return updateScoreSection(_accessTokenOrId, idOrPayload, payload, 'study-score');
}

/** Cập nhật điểm chấp hành nội quy. */
async function updateDisciplineScore(
  _accessTokenOrId: string,
  idOrPayload: string | ScoreSectionPayload,
  payload?: ScoreSectionPayload
) {
  return updateScoreSection(_accessTokenOrId, idOrPayload, payload, 'discipline-score');
}

/** Cập nhật điểm hoạt động. */
async function updateActivityScore(_accessTokenOrId: string, idOrPayload: string | ScoreSectionPayload, payload?: ScoreSectionPayload) {
  return updateScoreSection(_accessTokenOrId, idOrPayload, payload, 'activity-score');
}

/** Cập nhật điểm ý thức cộng đồng. */
async function updateCommunityScore(
  _accessTokenOrId: string,
  idOrPayload: string | ScoreSectionPayload,
  payload?: ScoreSectionPayload
) {
  return updateScoreSection(_accessTokenOrId, idOrPayload, payload, 'community-score');
}

/** Cập nhật điểm vai trò và thành tích. */
async function updateRoleScore(_accessTokenOrId: string, idOrPayload: string | ScoreSectionPayload, payload?: ScoreSectionPayload) {
  return updateScoreSection(_accessTokenOrId, idOrPayload, payload, 'role-score');
}

/** Nộp phiếu đánh giá. */
async function submitEvaluation(id: string) {
  return post<StudentEvaluation>(`/training-evaluations/${id}/submit`);
}

/** Thêm minh chứng bằng đường dẫn (tự động thử các định dạng mã tiêu chí hoa/thường/TC1..TC5 nếu backend báo không tìm thấy tiêu chí). */
async function linkEvidenceUrl(payload: LinkEvidenceUrlPayload) {
  const rawCode = payload.criteriaCode?.trim();
  const imageUrl = payload.imageUrl?.trim();
  const publicId = payload.publicId?.trim();

  if (!rawCode || rawCode.length > 20) {
    throw new Error('Mã tiêu chí minh chứng không hợp lệ.');
  }

  if (!imageUrl || (!imageUrl.startsWith('https://res.cloudinary.com/') && !imageUrl.startsWith('http'))) {
    throw new Error('URL minh chứng không hợp lệ.');
  }

  if (publicId && publicId.length > 500) {
    throw new Error('Public ID minh chứng không được vượt quá 500 ký tự.');
  }

  const altMap: Record<string, string[]> = {
    'I.2.a': ['I.2.A', 'TC1', 'I.2'],
    'I.2.b': ['I.2.B', 'TC1', 'I.2'],
    'I.2.c': ['I.2.C', 'TC1', 'I.2'],
    'I.2.A': ['I.2.a', 'TC1', 'I.2'],
    'I.2.B': ['I.2.b', 'TC1', 'I.2'],
    'I.2.C': ['I.2.c', 'TC1', 'I.2'],
    'III.5': ['TC3'],
    'IV.1': ['TC4'],
    'IV.2': ['TC4'],
    'V.A.2': ['TC5', 'V.B.2'],
    'V.B.2': ['TC5', 'V.A.2'],
    'TC1': ['I.2.A', 'I.2.a', 'I.2'],
    'TC2': ['II.1'],
    'TC3': ['III.5'],
    'TC4': ['IV.1', 'IV.2'],
    'TC5': ['V.B.2', 'V.A.2'],
  };

  const candidates = Array.from(
    new Set([
      rawCode,
      rawCode.toUpperCase(),
      rawCode.toLowerCase(),
      ...(altMap[rawCode] || []),
      ...(altMap[rawCode.toUpperCase()] || []),
    ])
  );

  let lastError: any = null;

  // Thử lần lượt các mã tiêu chí khả dĩ với route chính /evidences/link-url
  for (const criteriaCode of candidates) {
    try {
      return await post<StudentEvidence>('/evidences/link-url', {
        criteriaCode,
        imageUrl,
        ...(publicId ? { publicId } : {}),
      });
    } catch (err: any) {
      lastError = err;
      const status = err?.statusCode || err?.response?.status;
      const message = String(err?.response?.data?.message || err?.message || '');

      // Nếu lỗi 404 do "Không tìm thấy tiêu chí", tiếp tục thử mã tiêu chí dạng khác (ví dụ I.2.A thay vì I.2.a)
      if (status === 404 && (message.includes('tiêu chí') || message.includes('criteria') || message.includes('Không tìm thấy'))) {
        continue;
      }
      break;
    }
  }

  // Thử các endpoint fallback khác nếu vắng route
  const fallbackEndpoints = ['/evidences', '/training-evaluations/evidences'];
  for (const endpoint of fallbackEndpoints) {
    for (const criteriaCode of candidates) {
      try {
        return await post<StudentEvidence>(endpoint, {
          criteriaCode,
          imageUrl,
          ...(publicId ? { publicId } : {}),
        });
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  throw lastError;
}

/** Lấy minh chứng của sinh viên. */
async function getMyEvidences() {
  try {
    return await get<StudentEvidence[]>('/evidences/my');
  } catch (err: any) {
    const status = err?.statusCode || err?.response?.status;
    if (status === 404) {
      return await get<StudentEvidence[]>('/evidences');
    }
    throw err;
  }
}

/** Xóa minh chứng. */
async function deleteEvidence(id: string) {
  try {
    return await del<null>(`/evidences/${id}`);
  } catch (err: any) {
    const status = err?.statusCode || err?.response?.status;
    if (status === 404) {
      return await del<null>(`/training-evaluations/evidences/${id}`);
    }
    throw err;
  }
}

/** Lấy danh sách thông báo. */
async function getNotifications(query?: NotificationListQuery) {
  return get<NotificationListResponse>('/notifications', { params: buildQueryParams(query) });
}

/** Lấy số thông báo chưa đọc. */
async function getUnreadCount() {
  return get<{ unreadCount: number }>('/notifications/unread-count');
}

/** Đánh dấu một thông báo đã đọc. */
async function markAsRead(id: string) {
  return patch<null>(`/notifications/${id}/read`);
}

/** Đánh dấu tất cả thông báo đã đọc. */
async function markAllAsRead() {
  return patch<null>('/notifications/read-all');
}

function updateScoreSection(
  accessTokenOrId: string,
  idOrPayload: string | ScoreSectionPayload,
  payload: ScoreSectionPayload | undefined,
  section: string
) {
  const id = typeof idOrPayload === 'string' ? idOrPayload : accessTokenOrId;
  const data = typeof idOrPayload === 'string' ? payload : idOrPayload;

  return patch<ScoreSectionResponse>(`/training-evaluations/${id}/${section}`, data);
}

/** Lấy hồ sơ sinh viên cho màn cũ. */
async function getProfile(_accessToken?: string) {
  void _accessToken;
  return getMyProfile();
}

/** Cập nhật hồ sơ sinh viên cho màn cũ. */
async function updateProfile(_accessToken: string, phone: string) {
  void _accessToken;
  return updateMyProfile({ phone });
}

/** Lấy danh sách phiếu cho màn cũ. */
async function getEvaluations(_accessToken?: string) {
  void _accessToken;
  return getMyEvaluationList();
}

export const API_Student = {
  getMyProfile,
  updateMyProfile,
  getMyEvaluationList,
  getSemesters,
  getCurrentSemester,
  getEvaluationPopup,
  getAcademicYears,
  getFaculties,
  getMajors,
  getClasses,
  createEvaluation,
  getMyEvaluations,
  getEvaluationDetail,
  updateEvaluationNote,
  updateEvaluationDraft: updateEvaluationNote,
  updateStudyScore,
  updateDisciplineScore,
  updateActivityScore,
  updateCommunityScore,
  updateRoleScore,
  submitEvaluation,
  linkEvidenceUrl,
  getMyEvidences,
  deleteEvidence,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getProfile,
  updateProfile,
  getEvaluations,
};

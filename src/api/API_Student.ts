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

/** Thêm minh chứng bằng đường dẫn. */
async function linkEvidenceUrl(payload: LinkEvidenceUrlPayload) {
  return post<StudentEvidence>('/evidences/link-url', payload);
}

/** Lấy minh chứng của sinh viên. */
async function getMyEvidences() {
  return get<StudentEvidence[]>('/evidences/my');
}

/** Xóa minh chứng. */
async function deleteEvidence(id: string) {
  return del<null>(`/evidences/${id}`);
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

import { axiosInstance, buildQueryParams, del, get, patch, post } from './api';
import { API_Faculty } from './API_Faculty';
import { API_Advisor } from './API_Advisor';
import { API_ClassLeader } from './API_ClassLeader';
import { API_EvaluationForm } from './API_EvaluationForm';

import type {
  AddStudentToClassPayload,
  AdminClass,
  AdminEvaluationItem,
  AdminEvaluationListQuery,
  AdminFaculty,
  AdminMajor,
  AdminSemester,
  AdminStudentListQuery,
  AdminTreeListQuery,
  AdminUser,
  BulkFinalizeEvaluationsPayload,
  ConfirmImportPayload,
  CreateStudentPayload,
  CreateUserPayload,
  FinalizeEvaluationPayload,
  FinalizeEvaluationsByFilterPayload,
  FacultyPayload,
  ImportFacultiesResult,
  ImportStudentsPayload,
  ImportMajorsResult,
  ImportStudentsResult,
  MajorPayload,
  PaginatedResponse,
  Post,
  PostPayload,
  ReopenEvaluationPayload,
  ReportQuery,
  ReportsOverview,
  ReviewEvaluationPayload,
  ReviewScoresPayload,
  ReturnEvaluationToStudentPayload,
  SemesterPayload,
  SemesterQuery,
  StatusPayload,
  SubmitClassEvaluationPayload,
  SubmitFacultyEvaluationPayload,
  SubmitFacultyEvaluationResponse,
  TrainingResultsReport,
  UpdateUserPayload,
  UserListQuery,
} from '../types';

/** Tạo tài khoản người dùng. */
async function createUser(_accessTokenOrPayload: string | CreateUserPayload, payload?: CreateUserPayload) {
  return post<AdminUser>('/admin/users', payload || _accessTokenOrPayload);
}

/** Tạo sinh viên thủ công. */
async function createStudent(payload: CreateStudentPayload) {
  return post<AdminUser>('/admin/students', payload);
}

/** Lấy danh sách sinh viên. */
async function getStudents(query?: AdminStudentListQuery) {
  return get<PaginatedResponse<AdminUser> | AdminUser[]>('/admin/students', {
    params: buildQueryParams(query),
  });
}

/** Lấy danh sách người dùng. */
async function getUsers(_accessTokenOrQuery?: string | UserListQuery, query?: UserListQuery) {
  return get<PaginatedResponse<AdminUser> | AdminUser[]>('/admin/users', {
    params: buildQueryParams(query || (typeof _accessTokenOrQuery === 'object' ? _accessTokenOrQuery : undefined)),
  });
}

/** Lấy thông tin người dùng. */
async function getUserById(_accessTokenOrId: string, id?: string) {
  return get<AdminUser>(`/admin/users/${id || _accessTokenOrId}`);
}

/** Cập nhật thông tin tài khoản admin/cố vấn. */
async function updateUser(id: string, payload: UpdateUserPayload) {
  return patch<AdminUser>(`/admin/users/${id}`, payload);
}

/** Xóa tài khoản admin/cố vấn. */
async function deleteUser(id: string) {
  return del<null>(`/admin/users/${id}`);
}

/** Cập nhật trạng thái tài khoản admin/cố vấn. */
async function updateUserStatus(id: string, payload: StatusPayload) {
  return patch<AdminUser>(`/admin/users/${id}/lock`, { locked: !payload.isActive });
}

/** Xóa tài khoản sinh viên. */
async function deleteStudent(id: string) {
  return del<null>(`/admin/students/${id}`);
}

/** Cập nhật trạng thái tài khoản sinh viên. */
async function updateStudentStatus(id: string, payload: StatusPayload) {
  return patch<AdminUser>(`/admin/students/${id}`, payload);
}

/** Xóa tài khoản theo vai trò. */
async function deleteAccount(id: string, role?: string) {
  return role === 'student' ? deleteStudent(id) : deleteUser(id);
}

/** Khóa/mở khóa tài khoản theo vai trò. */
async function updateAccountStatus(id: string, role: string | undefined, payload: StatusPayload) {
  return role === 'student'
    ? updateStudentStatus(id, payload)
    : updateUserStatus(id, payload);
}

/** Lấy danh sách phiếu đánh giá. */
async function getAdminEvaluationList(query?: AdminEvaluationListQuery) {
  return get<PaginatedResponse<AdminEvaluationItem>>('/training-evaluations', { params: buildQueryParams(query) });
}

/** Lấy danh sách phiếu đánh giá cho admin duyệt cuối. */
async function getAdminEvaluations(query?: AdminEvaluationListQuery) {
  return get<PaginatedResponse<AdminEvaluationItem> | AdminEvaluationItem[]>('/admin/evaluations', {
    params: buildQueryParams(query),
  });
}

/** Lấy chi tiết phiếu đánh giá bằng route chung cho các vai trò. */
async function getEvaluationDetail(id: string) {
  return get<AdminEvaluationItem>(`/training-evaluations/${id}`);
}

/** Lấy danh sách học kỳ. */
async function getSemesters(query?: SemesterQuery) {
  return get<PaginatedResponse<AdminSemester> | AdminSemester[]>('/admin/semesters', { params: buildQueryParams(query) });
}

/** Lấy chi tiết học kỳ. */
async function getSemesterById(id: string) {
  return get<AdminSemester>(`/admin/semesters/${id}`);
}

/** Tạo học kỳ. */
async function createSemester(payload: SemesterPayload) {
  return post<AdminSemester>('/admin/semesters', payload);
}

/** Cập nhật học kỳ. */
async function updateSemester(id: string, payload: SemesterPayload) {
  return patch<AdminSemester>(`/admin/semesters/${id}`, payload);
}

/** Bật/tắt học kỳ. */
async function toggleSemesterActive(id: string, payload: StatusPayload) {
  return patch<AdminSemester>(`/admin/semesters/${id}/toggle-active`, payload);
}

/** Mở lại phiếu đánh giá. */
async function reopenEvaluation(id: string, payload?: ReopenEvaluationPayload) {
  return API_EvaluationForm.reopenEvaluation(id, payload);
}

/** Ghi nhận điểm hội đồng lớp. */
async function reviewScoresByClassCouncil(id: string, payload: ReviewScoresPayload) {
  return API_EvaluationForm.reviewScoresByClassCouncil(id, payload as any);
}

/** Duyệt hoặc từ chối phiếu đánh giá. */
async function reviewEvaluation(id: string, payload: ReviewEvaluationPayload) {
  return API_EvaluationForm.reviewEvaluation(id, payload);
}

/** CVHT gửi lại phiếu đánh giá cho sinh viên kèm lý do. */
async function returnEvaluationToStudent(
  id: string,
  payload: ReturnEvaluationToStudentPayload,
) {
  return post<AdminEvaluationItem>(
    `/training-evaluations/${id}/return-to-student`,
    payload,
  );
}

/** Admin phê duyệt cuối phiếu đánh giá. */
async function finalizeEvaluation(id: string, payload: FinalizeEvaluationPayload = {}) {
  return patch<AdminEvaluationItem>(`/training-department/evaluations/${id}/finalize`, payload);
}

/** Admin phê duyệt nhiều phiếu đã chọn. */
async function bulkFinalizeEvaluations(payload: BulkFinalizeEvaluationsPayload) {
  return patch<{ finalizedCount?: number; items?: AdminEvaluationItem[] }>('/admin/evaluations/bulk-finalize', payload);
}

/** Admin phê duyệt tất cả phiếu theo bộ lọc hiện tại. */
async function finalizeEvaluationsByFilter(payload: FinalizeEvaluationsByFilterPayload) {
  return post<{ finalizedCount?: number; total?: number }>('/admin/evaluations/finalize-by-filter', payload);
}

/** Lấy danh sách khoa. */
async function getFaculties(query?: AdminTreeListQuery) {
  return get<PaginatedResponse<AdminFaculty> | AdminFaculty[]>('/admin/faculties', {
    params: buildQueryParams(query),
  });
}

/** Lấy danh sách khoa dạng metadata cho dropdown/chọn phân công. */
async function getMetadataFaculties() {
  return get<AdminFaculty[]>('/metadata/faculties');
}

/** Lấy thông tin khoa. */
async function getFacultyById(id: string) {
  return get<AdminFaculty>(`/admin/faculties/${id}`);
}

/** Tạo khoa mới. */
async function createFaculty(payload: FacultyPayload) {
  return post<AdminFaculty>('/admin/faculties', payload);
}

/** Cập nhật khoa. */
async function updateFaculty(id: string, payload: Partial<FacultyPayload>) {
  return patch<AdminFaculty>(`/admin/faculties/${id}`, payload);
}

/** Cập nhật trạng thái khoa. */
async function updateFacultyStatus(id: string, payload: StatusPayload) {
  return patch<AdminFaculty>(`/admin/faculties/${id}/status`, payload);
}

/** Xóa khoa. */
async function deleteFaculty(id: string) {
  return del<null>(`/admin/faculties/${id}`);
}

/** Tải file mẫu nhập khoa. */
async function downloadFacultyImportTemplate() {
  const res = await axiosInstance.get<Blob>('/admin/faculties/import-template', {
    responseType: 'blob',
  });
  return res.data;
}

/** Nhập danh sách khoa từ Excel. */
async function importFaculties(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return post<ImportFacultiesResult>('/admin/faculties/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Xác nhận nhập khoa sau preview nếu backend trả importToken. */
async function confirmImportFaculties(payload: ConfirmImportPayload) {
  return post<ImportFacultiesResult>('/admin/faculties/import/confirm', payload);
}

/** Lấy danh sách ngành. */
async function getMajors() {
  return get<AdminMajor[]>('/admin/majors');
}

/** Lấy thông tin ngành. */
async function getMajorById(id: string) {
  return get<AdminMajor>(`/admin/majors/${id}`);
}

/** Lấy danh sách ngành thuộc một khoa để dựng cây Khoa -> Ngành. */
async function getFacultyMajors(facultyId: string, query?: AdminTreeListQuery) {
  return get<PaginatedResponse<AdminMajor> | AdminMajor[]>(`/faculties/${facultyId}/majors`, {
    params: buildQueryParams(query),
  });
}

/** Tạo ngành mới. */
async function createMajor(payload: MajorPayload) {
  return post<AdminMajor>('/admin/majors', payload);
}

/** Cập nhật ngành. */
async function updateMajor(id: string, payload: Partial<MajorPayload>) {
  return patch<AdminMajor>(`/admin/majors/${id}`, payload);
}

/** Cập nhật trạng thái ngành. */
async function updateMajorStatus(id: string, payload: StatusPayload) {
  return patch<AdminMajor>(`/admin/majors/${id}/status`, payload);
}

/** Xóa ngành. */
async function deleteMajor(id: string) {
  return del<null>(`/admin/majors/${id}`);
}

/** Tải file mẫu nhập ngành. */
async function downloadMajorImportTemplate() {
  const res = await axiosInstance.get<Blob>('/admin/majors/import-template', {
    responseType: 'blob',
  });
  return res.data;
}

/** Preview nhập danh sách ngành từ Excel. */
async function importMajors(file: File, facultyId?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (facultyId) {
    formData.append('facultyId', facultyId);
  }

  return post<ImportMajorsResult>('/admin/majors/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Xác nhận nhập ngành sau preview. */
async function confirmImportMajors(payload: ConfirmImportPayload) {
  return post<ImportMajorsResult>('/admin/majors/import/confirm', payload);
}

/** Lấy danh sách lớp. */
async function getClasses(query?: AdminTreeListQuery) {
  return get<PaginatedResponse<AdminClass> | AdminClass[]>('/admin/classes', {
    params: buildQueryParams(query),
  });
}

/** Lấy danh sách lớp thuộc một ngành để dựng cây Ngành -> Lớp. */
async function getMajorClasses(majorId: string, query?: AdminTreeListQuery) {
  return get<PaginatedResponse<AdminClass> | AdminClass[]>(`/majors/${majorId}/classes`, {
    params: buildQueryParams(query),
  });
}

/** Lấy chi tiết lớp. */
async function getClassById(id: string) {
  return get<AdminClass>(`/classes/${id}`);
}

/** Lấy chi tiết lớp mà cố vấn học tập được phân công phụ trách. */
async function getAdvisorClassById(id: string) {
  return getClassById(id);
}

/** Gán lại toàn bộ danh sách cố vấn học tập phụ trách lớp. */
async function updateClassAdvisors(classId: string, payload: { userIds: string[] }) {
  return patch<AdminClass>(`/admin/classes/${classId}/advisors`, payload);
}

/** Khoa lấy danh sách phiếu trong phạm vi khoa được phân công. */
async function getFacultyEvaluations(facultyId: string, query?: AdminEvaluationListQuery) {
  return API_Faculty.getFacultyEvaluations(facultyId, query);
}

/** Khoa duyệt một phiếu đã được CVHT chốt. */
async function approveFacultyEvaluation(id: string) {
  return API_Faculty.approveFacultyEvaluation(id);
}

/** Khoa trả phiếu về CVHT kèm lý do. */
async function rejectFacultyEvaluation(id: string, reason: string) {
  return API_Faculty.rejectFacultyEvaluation(id, reason);
}

/** Lớp trưởng chốt một phiếu đang chờ xử lý nếu backend cho phép theo luồng hiện tại. */
async function approveClassLeaderEvaluation(id: string, score: number) {
  return API_ClassLeader.approveClassLeaderEvaluation(id, score);
}

/** Lớp trưởng gửi toàn bộ phiếu trong lớp lên CVHT. */
async function submitClassToAdvisor(
  classId: string,
  payload: SubmitClassEvaluationPayload = {},
) {
  return API_ClassLeader.submitClassToAdvisor(classId, payload);
}

/** CVHT gửi toàn bộ phiếu trong lớp lên khoa. */
async function submitClassToFaculty(
  classId: string,
  payload: SubmitClassEvaluationPayload = {},
) {
  return API_Advisor.submitClassToFaculty(classId, payload);
}

/** Khoa gửi toàn bộ phiếu lên Phòng Đào tạo. */
async function submitFacultyToTrainingDepartment(
  facultyId: string,
  payload: SubmitFacultyEvaluationPayload = {},
) {
  return post<SubmitFacultyEvaluationResponse>(
    `/training-evaluations/faculties/${facultyId}/submit-to-training-department`,
    payload,
  );
}

/** Phòng Đào tạo lấy danh sách phiếu toàn trường đang chờ duyệt cuối. */
async function getTrainingDepartmentEvaluations(query?: AdminEvaluationListQuery) {
  return get<PaginatedResponse<AdminEvaluationItem> | AdminEvaluationItem[]>(
    '/training-department/evaluations',
    { params: buildQueryParams(query) },
  );
}

/** Phòng Đào tạo duyệt cuối một phiếu. */
async function approveTrainingDepartmentEvaluation(id: string) {
  return patch<AdminEvaluationItem>(`/training-department/evaluations/${id}/finalize`);
}

/** Lấy sinh viên trong lớp bằng route chung cho admin/CVHT/lớp trưởng/khoa. */
async function getClassStudents(classId: string, query?: AdminTreeListQuery) {
  try {
    return await get<PaginatedResponse<AdminUser> | AdminUser[]>(`/classes/${classId}/students`, {
      params: buildQueryParams(query),
    });
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.statusCode === 404 || err?.status === 404) {
      try {
        const evals = await getAdminEvaluationList({
          classId,
          page: query?.page || 1,
          limit: query?.limit || 100,
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
}

/** Thêm sinh viên vào lớp. */
async function addStudentToClass(classId: string, payload: AddStudentToClassPayload) {
  return post<AdminUser>(`/admin/classes/${classId}/students`, payload);
}

/** Xóa sinh viên khỏi lớp. */
async function removeStudentFromClass(classId: string, studentId: string) {
  return del<null>(`/admin/classes/${classId}/students/${studentId}`);
}

/** Tải file mẫu nhập sinh viên. */
async function downloadImportTemplate() {
  const res = await axiosInstance.get<Blob>('/admin/students/import-template', {
    responseType: 'blob',
  });
  return res.data;
}

/** Nhập danh sách sinh viên. */
async function importStudents(payload: ImportStudentsPayload) {
  const formData = new FormData();
  formData.append('file', payload.file);

  return post<ImportStudentsResult>('/admin/students/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Xác nhận nhập danh sách sinh viên sau preview. */
async function confirmImportStudents(payload: ConfirmImportPayload) {
  return post<ImportStudentsResult>('/admin/students/import/confirm', payload);
}

/** Nhập sinh viên vào lớp theo cách cũ. */
async function importStudentsToClass(classId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return post<ImportStudentsResult>(`/admin/classes/${classId}/students/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Lấy số liệu báo cáo tổng quan. */
async function getReportsOverview(query?: ReportQuery) {
  return get<ReportsOverview>('/admin/reports/overview', { params: buildQueryParams(query) });
}

/** Lấy báo cáo kết quả rèn luyện. */
async function getTrainingResultsReport(query?: ReportQuery) {
  return get<TrainingResultsReport>('/admin/reports/training-results', { params: buildQueryParams(query) });
}

/** Lấy báo cáo theo lớp. */
async function getReportsByClass(query?: ReportQuery) {
  return get<TrainingResultsReport>('/admin/reports/classes', { params: buildQueryParams(query) });
}

/** Lấy báo cáo theo khoa. */
async function getReportsByFaculty(query?: ReportQuery) {
  return get<TrainingResultsReport>('/admin/reports/faculties', { params: buildQueryParams(query) });
}

/** Xuất báo cáo Excel. */
async function exportReportExcel(query?: ReportQuery) {
  const res = await axiosInstance.get<Blob>('/admin/reports/export/excel', {
    params: buildQueryParams(query),
    responseType: 'blob',
  });
  return res.data;
}

/** Xuất báo cáo PDF. */
async function exportReportPdf(query?: ReportQuery) {
  const res = await axiosInstance.get<Blob>('/admin/reports/export/pdf', {
    params: buildQueryParams(query),
    responseType: 'blob',
  });
  return res.data;
}

/** Tạo bài viết. */
async function createPost(_accessTokenOrPayload: string | PostPayload, payload?: PostPayload) {
  return post<Post>('/posts', payload || _accessTokenOrPayload);
}

/** Lấy danh sách bài viết. */
async function getPosts(_accessToken?: string) {
  void _accessToken;
  return get<Post[]>('/posts');
}

export const API_Admin = {
  createUser,
  createStudent,
  getStudents,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  deleteStudent,
  updateStudentStatus,
  deleteAccount,
  updateAccountStatus,
  getAdminEvaluationList,
  getAdminEvaluations,
  getEvaluationDetail,
  getSemesters,
  getSemesterById,
  createSemester,
  updateSemester,
  toggleSemesterActive,
  reopenEvaluation,
  reviewScoresByClassCouncil,
  reviewEvaluation,
  returnEvaluationToStudent,
  finalizeEvaluation,
  bulkFinalizeEvaluations,
  finalizeEvaluationsByFilter,
  getFaculties,
  getMetadataFaculties,
  getFacultyById,
  createFaculty,
  updateFaculty,
  updateFacultyStatus,
  deleteFaculty,
  downloadFacultyImportTemplate,
  importFaculties,
  confirmImportFaculties,
  getMajors,
  getMajorById,
  getFacultyMajors,
  createMajor,
  updateMajor,
  updateMajorStatus,
  deleteMajor,
  downloadMajorImportTemplate,
  importMajors,
  confirmImportMajors,
  getClasses,
  getMajorClasses,
  getClassById,
  getAdvisorClassById,
  updateClassAdvisors,
  getFacultyEvaluations,
  approveFacultyEvaluation,
  rejectFacultyEvaluation,
  approveClassLeaderEvaluation,
  submitClassToAdvisor,
  submitClassToFaculty,
  submitFacultyToTrainingDepartment,
  getTrainingDepartmentEvaluations,
  approveTrainingDepartmentEvaluation,
  getClassStudents,
  addStudentToClass,
  removeStudentFromClass,
  downloadImportTemplate,
  importStudents,
  confirmImportStudents,
  importStudentsToClass,
  getReportsOverview,
  getTrainingResultsReport,
  getReportsByClass,
  getReportsByFaculty,
  exportReportExcel,
  exportReportPdf,
  createPost,
  getPosts,
};

/**
 * permissionHelpers.ts
 *
 * Helpers for Training Evaluation permissions matching exact backend business logic.
 */

export function isClassLeaderRole(role?: string): boolean {
  const normRole = String(role || '').toLowerCase();
  return (
    normRole === 'class' ||
    normRole === 'class_leader' ||
    normRole === 'classleader'
  );
}

export function isAdvisorRole(role?: string): boolean {
  const normRole = String(role || '').toLowerCase();
  return normRole === 'advisor' || normRole === 'adv';
}

export function isFacultyRole(role?: string): boolean {
  const normRole = String(role || '').toLowerCase();
  return normRole === 'faculty';
}

export function isTrainingDeptRole(role?: string): boolean {
  const normRole = String(role || '').toLowerCase();
  return normRole === 'training_department' || normRole === 'training' || normRole === 'admin';
}

export function canEditReviewScores(role?: string, status?: string): boolean {
  const normStatus = String(status || '').trim().toLowerCase();
  const isCL = isClassLeaderRole(role);
  const isAdv = isAdvisorRole(role);
  const isFac = isFacultyRole(role);
  const isTD = isTrainingDeptRole(role);

  return (
    (isCL && normStatus === 'submitted') ||
    (isAdv && normStatus === 'class_leader_approved') ||
    (isFac && (normStatus === 'class_approved' || normStatus === 'faculty_approved')) ||
    (isTD && (normStatus === 'faculty_approved' || normStatus === 'finalized'))
  );
}

export function canConfirmReview(role?: string, form?: any): boolean {
  if (!form) return false;
  return !form.isLocked && canEditReviewScores(role, form.workflowStatus || form.status);
}

export function canSelectForSubmitToAdvisor(role?: string, form?: any): boolean {
  if (!form) return false;
  const normStatus = String(form.workflowStatus || form.status || '').trim().toLowerCase();
  return (
    isClassLeaderRole(role) &&
    normStatus === 'submitted' &&
    !form.isLocked &&
    Boolean(form.classLeaderReviewedAt || form.classLeaderConfirmedAt || form.review?.classLeaderReviewedAt)
  );
}

export function canSelectForSubmitToFaculty(role?: string, form?: any): boolean {
  if (!form) return false;
  const normStatus = String(form.workflowStatus || form.status || '').trim().toLowerCase();
  return (
    isAdvisorRole(role) &&
    normStatus === 'class_leader_approved' &&
    typeof form.classScore === 'number' &&
    !form.isLocked &&
    Boolean(form.classReviewedAt || form.review?.classReviewedAt || form.advisorReviewedAt || form.advisorConfirmedAt)
  );
}

export function getCheckboxDisabledReason(role?: string, form?: any): string {
  if (!form) return 'Không thể chọn phiếu này';
  const normStatus = String(form.workflowStatus || form.status || '').trim().toLowerCase();
  const isCL = isClassLeaderRole(role);
  const isAdv = isAdvisorRole(role);

  if (normStatus === 'not_submitted' || normStatus === 'draft') {
    return 'Phiếu chưa nộp';
  }

  if (isCL) {
    if (normStatus !== 'submitted') {
      return 'Phiếu đã được gửi lên cấp tiếp theo';
    }
    if (form.isLocked) return 'Phiếu đã khóa';
    if (!canSelectForSubmitToAdvisor(role, form)) {
      return 'Cần lớp trưởng xác nhận điểm trước khi gửi CVHT';
    }
  }

  if (isAdv) {
    if (normStatus !== 'class_leader_approved') {
      return 'Chỉ chọn phiếu đang ở bước CVHT xử lý';
    }
    if (form.isLocked) return 'Phiếu đã khóa';
    if (!canSelectForSubmitToFaculty(role, form)) {
      return 'Cần xác nhận điểm trước khi gửi Khoa';
    }
  }

  return 'Không thể chọn phiếu này';
}

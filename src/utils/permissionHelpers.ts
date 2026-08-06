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

export function canEditReviewScores(role?: string, status?: string): boolean {
  const normStatus = String(status || '').trim().toLowerCase();
  const isCL = isClassLeaderRole(role);
  const isAdv = isAdvisorRole(role);

  return (
    (isCL && normStatus === 'submitted') ||
    (isAdv && normStatus === 'class_leader_approved')
  );
}

export function canConfirmReview(role?: string, form?: any): boolean {
  if (!form) return false;
  const normStatus = String(form?.status || form?.workflowStatus || '').trim().toLowerCase();
  const isCL = isClassLeaderRole(role);
  const isAdv = isAdvisorRole(role);

  if (isCL) {
    return normStatus === 'submitted';
  }

  if (isAdv) {
    return normStatus === 'class_leader_approved';
  }

  return false;
}

export function canSelectForSubmitToAdvisor(role?: string, form?: any): boolean {
  if (!form) return false;
  const normStatus = String(form?.status || form?.workflowStatus || '').trim().toLowerCase();
  const isCL = isClassLeaderRole(role) || (!isAdvisorRole(role) && String(role || '').toLowerCase() !== 'student');

  const hasConfirmed = Boolean(
    form?.classLeaderReviewedAt ||
    form?.classLeaderConfirmedAt ||
    form?.review?.classLeaderReviewedAt ||
    form?.isConfirmed ||
    form?.statusLabel === 'Đã xác nhận'
  );

  return isCL && normStatus === 'submitted' && hasConfirmed;
}

export function canSelectForSubmitToFaculty(role?: string, form?: any): boolean {
  if (!form) return false;
  const normStatus = String(form?.status || form?.workflowStatus || '').trim().toLowerCase();
  const isAdv = isAdvisorRole(role);

  const isConfirmed = Boolean(
    form?.classLeaderReviewedAt ||
    form?.classLeaderConfirmedAt ||
    form?.classReviewedAt ||
    form?.advisorReviewedAt ||
    form?.advisorConfirmedAt ||
    form?.isConfirmed ||
    form?.statusLabel === 'Đã xác nhận'
  );

  const isValidStatus = ['submitted', 'class_leader_approved'].includes(normStatus);

  return isAdv && isValidStatus && isConfirmed;
}

export function getCheckboxDisabledReason(role?: string, form?: any): string {
  if (!form) return 'Không thể chọn phiếu này';
  const normStatus = String(form?.status || form?.workflowStatus || '').trim().toLowerCase();
  const isCL = isClassLeaderRole(role) || (!isAdvisorRole(role) && String(role || '').toLowerCase() !== 'student');
  const isAdv = isAdvisorRole(role);

  if (normStatus === 'not_submitted' || normStatus === 'draft') {
    return 'Phiếu chưa nộp';
  }

  if (isCL) {
    if (normStatus !== 'submitted') {
      return 'Phiếu đã được gửi lên cấp tiếp theo';
    }
    const hasConfirmed = Boolean(
      form?.classLeaderReviewedAt ||
      form?.classLeaderConfirmedAt ||
      form?.reviewedAt ||
      form?.isConfirmed
    );
    if (!hasConfirmed) {
      return 'Cần lớp trưởng xác nhận trước khi gửi CVHT';
    }
  }

  if (isAdv) {
    const isValidStatus = ['submitted', 'class_leader_approved'].includes(normStatus);
    if (!isValidStatus) {
      return 'Phiếu chưa ở trạng thái chờ CVHT xử lý';
    }
    const isConfirmed = Boolean(
      form?.classLeaderReviewedAt ||
      form?.classLeaderConfirmedAt ||
      form?.classReviewedAt ||
      form?.advisorReviewedAt ||
      form?.advisorConfirmedAt ||
      form?.isConfirmed
    );
    if (!isConfirmed) {
      return 'Cần xác nhận điểm trước khi gửi Khoa';
    }
  }

  return 'Không thể chọn phiếu này';
}

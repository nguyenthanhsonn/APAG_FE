'use client';

import { CheckCircle2, Circle, Clock3, XCircle } from 'lucide-react';
import type { EvaluationStepStatus, EvaluationWorkflowStep, EvaluationStatusStepperProps } from '@/types/common';

const defaultSteps: EvaluationWorkflowStep[] = [
  { key: 'student_submit', label: '1. SV nộp phiếu', status: 'pending' },
  { key: 'class_leader_review', label: '2. Lớp trưởng duyệt', status: 'pending' },
  { key: 'advisor_review', label: '3. CVHT duyệt', status: 'pending' },
  { key: 'faculty_review', label: '4. Khoa duyệt', status: 'pending' },
  { key: 'admin_finalization', label: '5. PĐT duyệt cuối', status: 'pending' },
];

export function normalizeEvaluationStatus(status?: string | null) {
  return String(status || 'draft').trim().toLowerCase();
}

export function getEvaluationStatusLabel(status?: string | null, fallback?: string | null) {
  const normalized = normalizeEvaluationStatus(status);
  const labels: Record<string, string> = {
    not_submitted: 'Chưa nộp',
    draft: 'Đang điền',
    submitted: 'Chờ Lớp trưởng duyệt',
    class_leader_approved: 'Chờ CVHT duyệt',
    class_approved: 'Chờ Khoa duyệt',
    advisor_approved: 'Chờ Khoa duyệt',
    faculty_approved: 'Chờ PĐT duyệt cuối',
    finalized: 'Đã hoàn tất',
    rejected: 'Bị trả về',
  };

  return labels[normalized] || fallback || 'Đang điền';
}

export function deriveEvaluationSteps(status?: string | null): EvaluationWorkflowStep[] {
  const normalized = normalizeEvaluationStatus(status);

  if (normalized === 'finalized' || normalized === 'admin_approved') {
    return defaultSteps.map((step) => ({ ...step, status: 'completed' }));
  }

  if (normalized === 'faculty_approved') {
    return defaultSteps.map((step) => ({
      ...step,
      status: step.key === 'admin_finalization' ? 'current' : 'completed',
    }));
  }

  if (normalized === 'class_approved' || normalized === 'advisor_approved') {
    return defaultSteps.map((step) => ({
      ...step,
      status: step.key === 'faculty_review' ? 'current' : step.key === 'admin_finalization' ? 'pending' : 'completed',
    }));
  }

  if (normalized === 'class_leader_approved') {
    return defaultSteps.map((step) => ({
      ...step,
      status: step.key === 'advisor_review' ? 'current' : ['faculty_review', 'admin_finalization'].includes(step.key) ? 'pending' : 'completed',
    }));
  }

  if (normalized === 'submitted') {
    return defaultSteps.map((step) => ({
      ...step,
      status: step.key === 'student_submit' ? 'completed' : step.key === 'class_leader_review' ? 'current' : 'pending',
    }));
  }

  if (normalized === 'rejected') {
    return defaultSteps.map((step) => ({
      ...step,
      status: step.key === 'student_submit' ? 'rejected' : 'pending',
    }));
  }

  return defaultSteps.map((step) => ({
    ...step,
    status: step.key === 'student_submit' ? 'current' : 'pending',
  }));
}

function getStepClasses(status: EvaluationStepStatus) {
  if (status === 'completed') {
    return {
      dot: 'border-green-200 bg-green-50 text-green-600',
      text: 'text-green-700',
      line: 'bg-green-200',
      icon: CheckCircle2,
    };
  }

  if (status === 'current') {
    return {
      dot: 'border-blue-200 bg-blue-50 text-blue-600',
      text: 'text-blue-700',
      line: 'bg-blue-200',
      icon: Clock3,
    };
  }

  if (status === 'rejected') {
    return {
      dot: 'border-red-200 bg-red-50 text-red-600',
      text: 'text-red-700',
      line: 'bg-red-200',
      icon: XCircle,
    };
  }

  return {
    dot: 'border-gray-200 bg-gray-50 text-gray-400',
    text: 'text-gray-500',
    line: 'bg-gray-200',
    icon: Circle,
  };
}

function formatCompletedAt(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
}

export default function EvaluationStatusStepper({
  status,
  statusLabel,
  steps,
  compact = false,
  className = '',
}: EvaluationStatusStepperProps) {
  const renderedSteps = (steps?.length ? steps : deriveEvaluationSteps(status)).map((step, index) => ({
    ...defaultSteps[index],
    ...step,
  }));
  const label = getEvaluationStatusLabel(status, statusLabel);

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Tiến trình phiếu</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{label}</span>
        </div>
      )}

      <div className={compact ? 'flex items-center gap-2' : 'grid gap-2 sm:grid-cols-5'}>
        {renderedSteps.map((step, index) => {
          const classes = getStepClasses(step.status);
          const Icon = classes.icon;
          const completedAt = formatCompletedAt(step.completedAt);

          return (
            <div key={`${step.key}-${index}`} className={compact ? 'flex min-w-0 items-center gap-2' : 'min-w-0'}>
              <div className={compact ? 'flex items-center gap-2' : 'flex items-start gap-2 rounded-xl border border-gray-100 bg-white p-3'}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${classes.dot}`}>
                  <Icon size={compact ? 14 : 16} />
                </span>
                {!compact && (
                  <div className="min-w-0">
                    <p className={`text-sm font-bold leading-tight ${classes.text}`}>{step.label}</p>
                    <p className="mt-0.5 text-xs font-semibold text-gray-400">
                      {step.status === 'completed' ? completedAt || 'Đã xong' : step.status === 'current' ? 'Đang xử lý' : step.status === 'rejected' ? 'Cần chỉnh sửa' : 'Chưa tới bước'}
                    </p>
                  </div>
                )}
              </div>
              {compact && index < renderedSteps.length - 1 && <span className={`h-0.5 w-5 shrink-0 ${classes.line}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

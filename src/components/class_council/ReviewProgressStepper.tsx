'use client';

import { CheckCircle2, Circle, Clock, XCircle } from 'lucide-react';
import type { EvaluationWorkflowStep, EvaluationStepStatus } from '@/types/common';
import { deriveEvaluationSteps, getEvaluationStatusLabel } from '@/components/common/EvaluationStatusStepper';

export interface ReviewProgressStepperProps {
  status?: string | null;
  statusLabel?: string | null;
  steps?: EvaluationWorkflowStep[];
  className?: string;
}

function getStepMeta(status: EvaluationStepStatus) {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle2,
        iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-300',
        lineClass: 'bg-emerald-500',
        titleClass: 'text-gray-900 font-bold',
        subtitle: 'Đã hoàn thành',
      };
    case 'current':
      return {
        icon: Clock,
        iconClass: 'bg-indigo-50 text-indigo-600 border-indigo-500 ring-4 ring-indigo-50',
        lineClass: 'bg-indigo-200',
        titleClass: 'text-indigo-700 font-bold',
        subtitle: 'Đang xử lý',
      };
    case 'rejected':
      return {
        icon: XCircle,
        iconClass: 'bg-red-50 text-red-600 border-red-300',
        lineClass: 'bg-red-200',
        titleClass: 'text-red-700 font-bold',
        subtitle: 'Cần chỉnh sửa',
      };
    case 'pending':
    default:
      return {
        icon: Circle,
        iconClass: 'bg-gray-50 text-gray-400 border-gray-200',
        lineClass: 'bg-gray-200',
        titleClass: 'text-gray-500 font-semibold',
        subtitle: 'Chưa tới bước',
      };
  }
}

export function ReviewProgressStepper({
  status,
  statusLabel,
  steps,
  className = '',
}: ReviewProgressStepperProps) {
  const renderedSteps = (steps?.length ? steps : deriveEvaluationSteps(status));
  const mainLabel = getEvaluationStatusLabel(status, statusLabel);

  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-5 shadow-2xs space-y-4 ${className}`} aria-labelledby="stepper-heading">
      {/* Header with Title & Status Badge */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 id="stepper-heading" className="text-sm font-bold uppercase tracking-wider text-gray-700">
            Tiến trình phiếu
          </h2>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
            {mainLabel}
          </span>
        </div>
      </div>

      {/* Desktop Stepper (> 640px) */}
      <div className="hidden sm:flex items-center justify-between relative px-2 py-1">
        {renderedSteps.map((step, index) => {
          const meta = getStepMeta(step.status);
          const Icon = meta.icon;
          const isLast = index === renderedSteps.length - 1;
          const isCurrent = step.status === 'current';

          return (
            <div
              key={step.key || index}
              className="flex-1 flex items-center relative"
              aria-current={isCurrent ? 'step' : undefined}
            >
              {/* Step Circle & Details */}
              <div className="flex items-center gap-3 z-10 bg-white pr-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${meta.iconClass}`}>
                  <Icon size={18} />
                </span>
                <div>
                  <p className={`text-xs ${meta.titleClass}`}>{step.label}</p>
                  <p className="text-[11px] text-gray-400 font-medium">{meta.subtitle}</p>
                </div>
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div className={`h-0.5 flex-1 mx-2 rounded-full ${meta.lineClass}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Stepper (< 640px) */}
      <div className="flex flex-col gap-3 sm:hidden pt-1">
        {renderedSteps.map((step, index) => {
          const meta = getStepMeta(step.status);
          const Icon = meta.icon;
          const isCurrent = step.status === 'current';

          return (
            <div
              key={step.key || index}
              className="flex items-center gap-3"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${meta.iconClass}`}>
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-xs ${meta.titleClass}`}>{step.label}</p>
                <p className="text-[11px] text-gray-400 font-medium">{meta.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ReviewProgressStepper;

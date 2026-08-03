'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Plus, Minus, Lock } from 'lucide-react';

const DEDUCTION_WEIGHTS = [10, 3, 5, 5, 5, 5, 5, 10, 20];

interface DeductionStepperProps {
  isSv: boolean;
  index: number;
  value: number;
  onChange: (val: number) => void;
  disabled: boolean;
  weight: number;
  noViolationScore: number;
  allDeductions: number[];
  currentUserRole: 'student' | 'class';
  isReadOnly: boolean;
}

const DeductionStepper = ({
  isSv,
  index,
  value,
  onChange,
  disabled,
  weight,
  noViolationScore,
  allDeductions,
  currentUserRole,
  isReadOnly
}: DeductionStepperProps) => {
  const sumOtherDeductions = allDeductions.reduce((sum, count, idx) => {
    if (idx === index) return sum;
    return sum + (Number(count) || 0) * DEDUCTION_WEIGHTS[idx];
  }, 0);

  const baseScore = Number(noViolationScore) || 0;
  const remainingScore = Math.max(0, baseScore - sumOtherDeductions);
  const maxTimes = weight > 0 ? Math.floor(remainingScore / weight) : 0;

  const disabledPlus = disabled || value >= maxTimes;
  const disabledMinus = disabled || value <= 0;

  const [localVal, setLocalVal] = useState<string>(String(value));

  useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  const parsedVal = parseInt(localVal.trim(), 10);
  const isInvalidInput = localVal.trim() !== '' && (
    isNaN(parsedVal) ||
    parsedVal < 0 ||
    parsedVal > maxTimes ||
    !/^\d+$/.test(localVal.trim())
  );

  const handleBlurOrEnter = () => {
    let num = parseInt(localVal.trim(), 10);
    if (isNaN(num)) {
      num = 0;
    }
    const clamped = Math.min(maxTimes, Math.max(0, num));
    setLocalVal(String(clamped));
    onChange(clamped);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlurOrEnter();
      e.currentTarget.blur();
    }
  };

  const handleIncrement = () => {
    if (!disabledPlus && value < maxTimes) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (!disabledMinus && value > 0) {
      onChange(value - 1);
    }
  };

  const isColumnRoleLocked = disabled && !isReadOnly && (
    (currentUserRole === 'student' && !isSv) || (currentUserRole === 'class' && isSv)
  );

  const currentCount = isInvalidInput ? (isNaN(parsedVal) ? 0 : Math.max(0, parsedVal)) : value;
  const deductedPoints = Math.min(baseScore, currentCount * weight);

  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[10px] font-bold ${isSv ? 'text-blue-600' : 'text-indigo-600'}`}>
        {isSv ? 'SV lần:' : 'Lớp lần:'}
      </span>
      
      {isColumnRoleLocked ? (
        <div className="flex items-center gap-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg px-2 py-1.5 h-8 select-none">
          <Lock size={12} className="text-gray-400 shrink-0" />
          <span className="text-[11px] font-semibold">{value} lần (−{deductedPoints}đ)</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={disabledMinus}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 transition duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              <Minus size={12} />
            </button>

            <input
              type="text"
              inputMode="numeric"
              value={localVal}
              onChange={(e) => setLocalVal(e.target.value)}
              onBlur={handleBlurOrEnter}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className={`w-12 h-8 text-center text-xs border-y outline-none font-bold disabled:bg-gray-100 disabled:text-gray-400 transition ${
                isInvalidInput
                  ? 'border-red-500 text-red-600 bg-red-50 focus:border-red-500 ring-1 ring-red-500'
                  : 'border-gray-300 bg-white text-gray-800 focus:border-blue-500'
              }`}
            />

            <button
              type="button"
              onClick={handleIncrement}
              disabled={disabledPlus}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:hover:bg-transparent min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 transition duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus size={12} />
            </button>
          </div>

          <span className={`text-xs font-semibold whitespace-nowrap ${deductedPoints > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
            −{deductedPoints}đ
          </span>
        </div>
      )}
    </div>
  );
};

interface EvaluationSection2Props {
  expanded: boolean;
  onToggle: () => void;
  currentUserRole: 'student' | 'class';
  setIsClassEdited: (val: boolean) => void;
  // Student values
  svNoViolationScore: number;
  setSvNoViolationScore: (val: number) => void;
  svDeductions: number[];
  handleDeductionChange: (isSv: boolean, idx: number, val: number) => void;
  // Class values
  classNoViolationScore: number;
  setClassNoViolationScore: (val: number) => void;
  classDeductions: number[];
  // Shared helper lists
  deductionLabels: string[];
  // Live Score summaries
  svSec2Score: number;
  classSec2Score: number;
  // Section violation checkbox
  isSvViolationSec2: boolean;
  setIsSvViolationSec2: (val: boolean) => void;
  isClassViolationSec2: boolean;
  setIsClassViolationSec2: (val: boolean) => void;
  isReadOnly?: boolean;
}

export const EvaluationSection2 = ({
  expanded,
  onToggle,
  currentUserRole,
  setIsClassEdited,
  svNoViolationScore,
  setSvNoViolationScore,
  svDeductions,
  handleDeductionChange,
  classNoViolationScore,
  setClassNoViolationScore,
  classDeductions,
  deductionLabels,
  svSec2Score,
  classSec2Score,
  isSvViolationSec2,
  setIsSvViolationSec2,
  isClassViolationSec2,
  setIsClassViolationSec2,
  isReadOnly = false
}: EvaluationSection2Props) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gray-50 border-b border-gray-100 hover:bg-gray-100/70 transition cursor-pointer"
        onClick={onToggle}
      >
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Mục II: Chấp hành nội quy, quy chế nhà trường
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Điểm tối đa: 25đ</p>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0 select-none">
          <div className="flex gap-2 text-xs font-bold text-gray-700">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">SV: {svSec2Score}đ</span>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">Lớp: {classSec2Score}đ</span>
          </div>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Section Violation override */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row gap-4 justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isSvViolationSec2}
                onChange={(e) => {
                  if (currentUserRole === 'student') {
                    setIsSvViolationSec2(e.target.checked);
                  }
                }}
                disabled={currentUserRole !== 'student'}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500"
              />
              [SV] Vi phạm nghiêm trọng quy chế thi / kỷ luật khác (Hủy điểm Mục II)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isClassViolationSec2}
                onChange={(e) => {
                  if (currentUserRole === 'class') {
                    setIsClassEdited(true);
                    setIsClassViolationSec2(e.target.checked);
                  }
                }}
                disabled={currentUserRole !== 'class'}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500"
              />
              [Lớp] Xác nhận SV vi phạm quy chế nghiêm trọng (Hủy điểm Mục II)
            </label>
          </div>

          {/* Cộng điểm chấp hành tốt */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800">2.1 Chấp hành tốt, không vi phạm (Tối đa: 25đ)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Điểm cộng tối đa cho sinh viên chấp hành tốt mọi nội quy học đường.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {/* SV Column */}
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Sinh viên tự nhập điểm cộng</label>
                <input
                  type="number"
                  max={25}
                  min={0}
                  value={svNoViolationScore}
                  onChange={(e) => setSvNoViolationScore(Math.min(25, Math.max(0, parseInt(e.target.value) || 0)))}
                  disabled={currentUserRole !== 'student' || isSvViolationSec2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                />
              </div>

              {/* Class Column */}
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1">Lớp nhập điểm cộng</label>
                <input
                  type="number"
                  max={25}
                  min={0}
                  value={classNoViolationScore}
                  onChange={(e) => {
                    setIsClassEdited(true);
                    setClassNoViolationScore(Math.min(25, Math.max(0, parseInt(e.target.value) || 0)));
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Trừ điểm vi phạm */}
          <div>
            <h3 className="text-sm font-bold text-gray-800">2. Phần trừ điểm: Sinh viên vi phạm một số lỗi trong nội quy, quy chế, quy định</h3>
            <p className="text-xs text-gray-500 mt-0.5">Nhập số lần vi phạm. Điểm trừ được tính tự động (Dưới hạn tối thiểu 0đ).</p>

            <div className="mt-4 space-y-4">
              {deductionLabels.map((label, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100">
                  <span className="text-xs font-semibold text-gray-700 leading-relaxed">{label}</span>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    {/* SV Violation count */}
                    <DeductionStepper
                      isSv={true}
                      index={index}
                      value={svDeductions[index]}
                      onChange={(val) => handleDeductionChange(true, index, val)}
                      disabled={currentUserRole !== 'student' || isSvViolationSec2 || isReadOnly}
                      weight={DEDUCTION_WEIGHTS[index]}
                      noViolationScore={svNoViolationScore}
                      allDeductions={svDeductions}
                      currentUserRole={currentUserRole}
                      isReadOnly={isReadOnly}
                    />

                    {/* Class Violation count */}
                    <DeductionStepper
                      isSv={false}
                      index={index}
                      value={classDeductions[index]}
                      onChange={(val) => handleDeductionChange(false, index, val)}
                      disabled={currentUserRole !== 'class' || isClassViolationSec2 || isReadOnly}
                      weight={DEDUCTION_WEIGHTS[index]}
                      noViolationScore={classNoViolationScore}
                      allDeductions={classDeductions}
                      currentUserRole={currentUserRole}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

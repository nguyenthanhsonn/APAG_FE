'use client';

import { ChangeEvent, useState } from 'react';
import { CheckCircle, Download, FileSpreadsheet, FileText, Loader2, Send, Upload, X, XCircle } from 'lucide-react';
import { API_Admin } from '../../api/API_Admin';
import type { ImportStudentPreviewItem, ImportStudentsResult, ModalImportExcelProps } from '../../types';
import { getUserFriendlyError } from '../../utils/adminData';

const emptyResult: ImportStudentsResult = {
  totalRows: 0,
  successCount: 0,
  skippedCount: 0,
  createdAccountCount: 0,
  createdAccounts: [],
  previewStudents: [],
  students: [],
  items: [],
  validRows: [],
  createdStudents: [],
  failedCount: 0,
  errors: [],
};

function normalizeImportResult(raw: any): ImportStudentsResult {
  return {
    ...emptyResult,
    ...raw,
    totalRows: raw?.totalRows ?? raw?.total ?? 0,
    successCount: raw?.successCount ?? raw?.success ?? 0,
    skippedCount: raw?.skippedCount ?? 0,
    createdAccountCount: raw?.createdAccountCount ?? raw?.createdAccounts?.length ?? 0,
    createdAccounts: raw?.createdAccounts ?? [],
    previewStudents: raw?.previewStudents ?? [],
    students: raw?.students ?? [],
    items: raw?.items ?? [],
    validRows: raw?.validRows ?? [],
    createdStudents: raw?.createdStudents ?? [],
    failedCount: raw?.failedCount ?? raw?.failed ?? 0,
    errors: raw?.errors ?? [],
  };
}

function getPreviewStudents(result: ImportStudentsResult): ImportStudentPreviewItem[] {
  const candidates = [
    result.previewStudents,
    result.students,
    result.items,
    result.validRows,
    result.createdStudents,
  ];
  const rows = candidates.find((items) => Array.isArray(items) && items.length > 0);

  if (rows?.length) {
    return rows;
  }

  return [];
}

function getStudentValue(row: ImportStudentPreviewItem, keys: Array<keyof ImportStudentPreviewItem>, fallback = '—') {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function getActionLabel(action?: ImportStudentPreviewItem['action']) {
  switch (action) {
    case 'create':
      return 'Tạo tài khoản';
    case 'enroll':
      return 'Gắn vào lớp';
    case 'skip':
      return 'Bỏ qua';
    default:
      return '—';
  }
}

function getActionClass(action?: ImportStudentPreviewItem['action']) {
  switch (action) {
    case 'create':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'enroll':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    case 'skip':
      return 'bg-amber-50 text-amber-700 border-amber-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

export default function ModalImportExcel({ isOpen, onClose, onSuccess, classId }: ModalImportExcelProps) {
  const [importResult, setImportResult] = useState<ImportStudentsResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setImportResult(null);
    setSelectedFileName('');
    setLoading(false);
    setConfirming(false);
    setConfirmed(false);
    setErrorMsg('');
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const blob = await API_Admin.downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mau_nhap_sinh_vien.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải file mẫu Excel.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setLoading(true);
      setErrorMsg('');
      setConfirmed(false);
      setImportResult(null);
      setSelectedFileName(file.name);

      const res = classId
        ? await API_Admin.importStudentsToClass(classId, file)
        : await API_Admin.importStudents({ file });

      setImportResult(normalizeImportResult(res));
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        setImportResult(normalizeImportResult({
          ...err.response.data,
          failedCount: err.response.data.errors.length,
        }));
      }
      setErrorMsg(getUserFriendlyError(err, 'Không thể import danh sách sinh viên.'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importResult?.importToken) {
      setErrorMsg('Phiên import không hợp lệ, vui lòng tải lại file.');
      return;
    }

    try {
      setConfirming(true);
      setErrorMsg('');
      const res = await API_Admin.confirmImportStudents({ importToken: importResult.importToken });
      setImportResult(normalizeImportResult(res));
      setConfirmed(true);
      onSuccess?.();
    } catch (err: any) {
      if (err?.response?.data?.errors) {
        setImportResult(normalizeImportResult({
          ...err.response.data,
          failedCount: err.response.data.errors.length,
        }));
      }
      setErrorMsg(getUserFriendlyError(err, 'Không thể xác nhận import sinh viên.'));
    } finally {
      setConfirming(false);
    }
  };

  const errors = importResult?.errors || [];
  const createdAccounts = importResult?.createdAccounts || [];
  const previewStudents = importResult ? getPreviewStudents(importResult) : [];
  const canConfirm = !!importResult?.importToken && !confirmed && importResult.failedCount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" onClick={handleClose}>
      <div className="relative w-full max-w-[860px] rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {classId ? 'Import sinh viên vào lớp' : 'Import danh sách người dùng'}
            </h2>
            <p className="mt-1 text-xs font-medium text-gray-500">
              Upload file để xem preview trước, sau đó xác nhận mới ghi dữ liệu.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <h3 className="mb-1 text-sm font-bold text-gray-800">1. Tải file mẫu</h3>
            <p className="mb-3 text-xs text-gray-500">
              Vui lòng tải file mẫu và điền thông tin sinh viên theo đúng định dạng quy định.
            </p>
            <button
              onClick={handleDownloadTemplate}
              disabled={loading || confirming}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Tải mẫu Excel
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <h3 className="mb-3 text-sm font-bold text-gray-800">2. Upload file để preview</h3>

            <div className="flex h-[150px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-4">
              {loading ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <Loader2 className="animate-spin text-blue-600" size={28} />
                  <p className="text-xs text-gray-500">Đang kiểm tra dữ liệu trong file...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <Upload className="mb-2 text-gray-400" size={28} />
                  <p className="mb-3 text-xs text-gray-600">
                    {selectedFileName || 'Kéo thả file vào đây hoặc click để chọn file'}
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="modal-file-upload"
                  />
                  <label
                    htmlFor="modal-file-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    <FileSpreadsheet size={14} />
                    Chọn file từ máy
                  </label>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <XCircle size={16} className="shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {importResult && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">
                    {confirmed ? 'Kết quả import' : 'Preview import'}
                  </h3>
                </div>
                {confirmed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    <CheckCircle size={14} />
                    Đã xác nhận
                  </span>
                )}
              </div>

              {errors.length > 0 && (
                <div className="max-h-[110px] overflow-y-auto rounded-xl border border-red-100 bg-red-50/50 p-3">
                  <h4 className="mb-1.5 text-xs font-bold text-red-900">Chi tiết lỗi:</h4>
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-start gap-1 text-[11px] font-medium text-red-600">
                        <FileText size={12} className="mt-0.5 shrink-0" />
                        <span>{[error.field, error.error].filter(Boolean).join(': ') || 'Dữ liệu không hợp lệ'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewStudents.length > 0 ? (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-sm font-bold text-blue-900">Danh sách sinh viên trong file Excel</h4>
                    <span className="text-xs font-semibold text-blue-700">{previewStudents.length} dòng</span>
                  </div>
                  <div className="grid max-h-[320px] gap-3 overflow-y-auto pr-1">
                    {previewStudents.map((student, index) => (
                      <div
                        key={`${getStudentValue(student, ['studentCode', 'code'], String(index))}-${index}`}
                        className="rounded-xl border border-blue-100 bg-white p-3 text-xs"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">
                              {getStudentValue(student, ['fullName', 'name'])}
                            </p>
                            <p className="font-mono text-[11px] font-semibold text-blue-700">
                              {getStudentValue(student, ['studentCode', 'code'])}
                            </p>
                          </div>
                          <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${getActionClass(student.action)}`}>
                            {getActionLabel(student.action)}
                          </span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Dòng</p>
                            <p className="truncate text-gray-700">{student.row ?? index + 1}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Email</p>
                            <p className="truncate text-gray-700">{getStudentValue(student, ['email'])}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Lớp</p>
                            <p className="truncate text-gray-700">
                              {student.class?.name || student.class?.code || getStudentValue(student, ['className', 'classCode'])}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Ngày sinh</p>
                            <p className="truncate text-gray-700">{getStudentValue(student, ['dateOfBirth', 'birthday'])}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Ngành / Khoa</p>
                            <p className="truncate text-gray-700">
                              {[student.majorName, student.facultyName].filter(Boolean).join(' - ') || '—'}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Năm tuyển</p>
                            <p className="truncate text-gray-700">{student.enrollmentYear ?? '—'}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">SĐT</p>
                            <p className="truncate text-gray-700">{getStudentValue(student, ['phoneNumber', 'phone'])}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Username</p>
                            <p className="truncate font-mono font-semibold text-gray-800">{student.username || '—'}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Password</p>
                            <p className="truncate font-mono font-semibold text-gray-800">{student.password || '—'}</p>
                          </div>
                          <div className="min-w-0 sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Ghi chú</p>
                            <p className="break-words text-gray-600">{student.note || '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                importResult.successCount > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                    BE chưa trả <span className="font-mono">previewStudents</span>, nên FE chưa có dữ liệu để hiển thị bảng preview.
                  </div>
                )
              )}

              {createdAccounts.length > 0 && (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <h4 className="mb-3 text-sm font-bold text-emerald-900">
                    Các tài khoản vừa được tạo
                  </h4>
                  <p className="mb-3 text-xs font-medium text-emerald-800">
                    Chỉ sinh viên chưa có tài khoản mới nằm trong danh sách này. Username và password được lấy nguyên từ response import lần này.
                  </p>
                  <div className="grid max-h-[260px] gap-3 overflow-y-auto pr-1">
                    {createdAccounts.map((account, index) => (
                      <div key={`${account.studentCode}-${index}`} className="rounded-xl border border-emerald-100 bg-white p-3 text-xs">
                        <div className="mb-2 min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">{account.fullName}</p>
                          <p className="font-mono text-[11px] font-semibold text-emerald-700">{account.studentCode}</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Email</p>
                            <p className="truncate text-gray-700">{account.email}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Username</p>
                            <p className="truncate font-mono font-bold text-gray-900">{account.username}</p>
                          </div>
                          <div className="min-w-0 sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Password</p>
                            <p className="break-words font-mono font-bold text-gray-900">{account.password}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {confirmed && (
                <div className="mt-4 space-y-2">
                  <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                    Đã import thành công. Email đã gửi: {importResult.emailSentCount ?? 0}, gửi lỗi: {importResult.emailFailedCount ?? 0}.
                  </div>
                  {importResult.emailErrors && importResult.emailErrors.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs">
                      <p className="font-bold text-amber-900 mb-1">Chi tiết lỗi gửi email ({importResult.emailErrors.length}):</p>
                      <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                        {importResult.emailErrors.map((eErr, idx) => (
                          <div key={idx} className="flex items-start gap-1 text-[11px] text-amber-800">
                            <span className="font-mono font-semibold shrink-0">{eErr.email || '—'}:</span>
                            <span>{eErr.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-900">Lưu ý quan trọng</h3>
            <ul className="grid grid-cols-1 gap-1 text-xs font-medium text-blue-800">
              <li>• File phải đúng định dạng theo mẫu</li>
              <li>• Mã sinh viên không được trùng lặp</li>
              <li>• Các trường bắt buộc: Mã SV, Họ tên, Ngày sinh, Lớp</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <button
            onClick={handleClose}
            className="cursor-pointer rounded-xl px-4 py-2 text-xs font-bold text-gray-500 transition hover:bg-gray-50"
          >
            Đóng
          </button>
          {importResult && !confirmed && (
            <button
              onClick={handleConfirmImport}
              disabled={confirming || !canConfirm}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {confirming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {importResult.importToken ? `Xác nhận import ${importResult.successCount} sinh viên` : 'Thiếu importToken'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

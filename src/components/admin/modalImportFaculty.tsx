'use client';

import { ChangeEvent, useState } from 'react';
import { CheckCircle, Download, FileSpreadsheet, FileText, Loader2, Send, Upload, X, XCircle } from 'lucide-react';
import { API_Admin } from '../../api/API_Admin';
import type { ImportFacultiesResult, ModalImportFacultyProps } from '../../types';
import { getUserFriendlyError } from '../../utils/adminData';

const getRows = (result: ImportFacultiesResult) =>
  result.previewFaculties?.length
    ? result.previewFaculties
    : result.createdFaculties || [];

const getActionLabel = (action?: string) => {
  if (action === 'create') return 'Tạo mới';
  if (action === 'skip') return 'Bỏ qua';
  return '—';
};

const getActionClass = (action?: string) => {
  if (action === 'create') return 'border-emerald-100 bg-emerald-50 text-emerald-700';
  if (action === 'skip') return 'border-amber-100 bg-amber-50 text-amber-700';
  return 'border-gray-100 bg-gray-50 text-gray-600';
};

export default function ModalImportFaculty({ isOpen, onClose, onSuccess }: ModalImportFacultyProps) {
  const [result, setResult] = useState<ImportFacultiesResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setResult(null);
    setSelectedFileName('');
    setErrorMsg('');
    setLoading(false);
    setDownloading(false);
    setConfirming(false);
    setConfirmed(false);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true);
      setErrorMsg('');
      const blob = await API_Admin.downloadFacultyImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mau_khoa.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải file mẫu khoa. Vui lòng thử lại.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setLoading(true);
      setErrorMsg('');
      setResult(null);
      setConfirmed(false);
      setSelectedFileName(file.name);

      const res = await API_Admin.importFaculties(file);
      setResult(res);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể import khoa. Vui lòng kiểm tra lại file Excel.'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result?.importToken || confirming) return;

    try {
      setConfirming(true);
      setErrorMsg('');
      const res = await API_Admin.confirmImportFaculties({ importToken: result.importToken });
      setResult(res);
      setConfirmed(true);
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể xác nhận import khoa. Vui lòng tải lại file và thử lại.'));
    } finally {
      setConfirming(false);
    }
  };

  const rows = result ? getRows(result) : [];
  const errors = result?.errors || [];
  const canConfirm = !!result?.importToken && !confirmed && result.failedCount === 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" onClick={resetAndClose}>
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Import khoa từ Excel</h2>
            <p className="mt-0.5 text-xs font-medium text-gray-500">
              File mẫu gồm 2 cột: Mã khoa và Tên khoa.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[72vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">1. Tải file mẫu</h3>
                <p className="mt-1 text-xs font-medium text-gray-500">Điền đúng Mã khoa và Tên khoa theo mẫu.</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                disabled={downloading || loading || confirming}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Tải mẫu Excel
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <h3 className="text-sm font-bold text-gray-900">2. Upload file</h3>
            <div className="mt-3 flex min-h-[150px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white p-4 text-center">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 size={28} className="animate-spin text-blue-600" />
                  <p className="text-xs font-semibold text-gray-500">Đang kiểm tra dữ liệu trong file...</p>
                </div>
              ) : (
                <>
                  <Upload className="mb-2 text-gray-400" size={28} />
                  <p className="mb-3 text-xs font-medium text-gray-600">
                    {selectedFileName || 'Chọn file .xlsx hoặc .xls để import khoa'}
                  </p>
                  <input
                    id="faculty-import-file"
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="faculty-import-file"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    <FileSpreadsheet size={14} />
                    Chọn file từ máy
                  </label>
                </>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <XCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {confirmed ? 'Kết quả import' : 'Preview import'}
                  </h3>
                  {!result.importToken && !confirmed && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      API chưa trả importToken nên FE chỉ hiển thị được dữ liệu đã upload, chưa thể gọi bước xác nhận.
                    </p>
                  )}
                </div>
                {confirmed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    <CheckCircle size={14} />
                    Hoàn tất
                  </span>
                )}
              </div>

              {rows.length > 0 && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                  <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-sm font-bold text-blue-900">Danh sách khoa trong file Excel</h4>
                    <span className="text-xs font-semibold text-blue-700">{rows.length} dòng</span>
                  </div>
                  <div className="grid max-h-[320px] gap-3 overflow-y-auto pr-1">
                    {rows.map((row, index) => (
                      <div key={`${row.code}-${index}`} className="rounded-xl border border-blue-100 bg-white p-3 text-xs">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-gray-900">{row.name}</p>
                            <p className="font-mono text-[11px] font-semibold text-blue-700">{row.code}</p>
                          </div>
                          <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${getActionClass(row.action)}`}>
                            {getActionLabel(row.action)}
                          </span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400">Dòng</p>
                            <p className="text-gray-700">{row.row ?? index + 1}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase text-gray-400">Ghi chú</p>
                            <p className="break-words text-gray-600">{row.note || '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="mt-4 max-h-[120px] overflow-y-auto rounded-xl border border-red-100 bg-red-50 p-3">
                  <h4 className="mb-2 text-xs font-bold text-red-900">Chi tiết lỗi</h4>
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs font-medium text-red-700">
                        <FileText size={13} className="mt-0.5 shrink-0" />
                        <span>{[error.field, error.error].filter(Boolean).join(': ') || 'Dữ liệu không hợp lệ'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={resetAndClose}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Đóng
          </button>
          {result && !confirmed && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm || confirming}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0B3A82] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#104E92] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {confirming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {result.importToken ? `Xác nhận import ${result.successCount} khoa` : 'Thiếu importToken'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

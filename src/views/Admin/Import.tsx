'use client';

import { useState, ChangeEvent } from 'react';
import { Upload, FileSpreadsheet, FileText, CheckCircle, XCircle, Download, Loader2, Send } from 'lucide-react';
import { API_Admin } from '../../api/API_Admin';
import type { ImportStudentsResult } from '../../types';
import { getUserFriendlyError } from '../../utils/errorHelper';

export const AdminImport = () => {
  const [importResult, setImportResult] = useState<ImportStudentsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmed, setConfirmed] = useState(false);

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

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setImportResult(null);
    setConfirmed(false);

    try {
      const res = await API_Admin.importStudents({ file });
      setImportResult(res);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể import danh sách sinh viên.'));
    } finally {
      setLoading(false);
      e.target.value = '';
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
      setImportResult(res);
      setConfirmed(true);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể xác nhận import sinh viên.'));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto w-full flex-1 flex flex-col overflow-hidden h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] px-2 sm:px-4">
      {/* Vùng tiêu đề cố định */}
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Import danh sách lớp</h1>
      </div>

      {/* Vùng cuộn danh sách card */}
      <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 py-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        
        {/* Card 1: Tải file mẫu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2">Tải file mẫu</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-3.5">
            Vui lòng tải file mẫu và điền thông tin sinh viên theo đúng định dạng quy định bên dưới.
          </p>
          <button
            onClick={handleDownloadTemplate}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download size={16} />
            Tải mẫu Excel
          </button>
        </div>

        {/* Card 2: Upload file danh sách */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3.5">Upload file danh sách</h2>
          
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 flex flex-col justify-center items-center h-[180px] sm:h-[200px] bg-gray-50/50">
            {loading ? (
              <div className="text-center flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <p className="text-xs text-gray-500">Đang tải và xử lý tệp tin từ hệ thống...</p>
              </div>
            ) : (
              <div className="text-center flex flex-col items-center">
                <Upload className="mb-2 text-gray-400" size={32} />
                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  Kéo thả file vào đây hoặc click để chọn file
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition"
                >
                  <FileSpreadsheet size={16} />
                  Chọn file từ máy
                </label>
                <p className="text-[11px] text-gray-500 mt-2.5">
                  Hỗ trợ các định dạng: Excel (.xlsx, .xls)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Thông báo lỗi kết nối */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2">
            <XCircle size={18} className="shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Card 3: Kết quả import */}
        {importResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3.5">
              {confirmed ? 'Kết quả import' : 'Preview import'}
            </h2>
            
            {importResult.importToken && !confirmed && (
              <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                File hợp lệ. Dữ liệu chưa được ghi vào hệ thống, vui lòng kiểm tra và bấm xác nhận import.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={20} />
                  <span className="text-xs font-semibold text-green-900">Thành công</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{importResult.successCount}</p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900">Tổng dòng</span>
                <p className="text-2xl font-bold text-blue-600">{importResult.totalRows}</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-900">Bỏ qua</span>
                <p className="text-2xl font-bold text-amber-600">{importResult.skippedCount}</p>
              </div>
              
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="text-red-600" size={20} />
                  <span className="text-xs font-semibold text-red-900">Thất bại</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{importResult.failedCount}</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50/50 rounded-lg p-3 border border-red-100 max-h-[120px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-red-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                <h3 className="text-xs font-bold text-red-900 mb-2">Chi tiết lỗi:</h3>
                <div className="space-y-1.5">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="flex items-start gap-1.5 text-xs text-red-600 font-medium">
                      <FileText size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{[error.field, error.error].filter(Boolean).join(': ') || 'Dữ liệu không hợp lệ'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.createdAccounts.length > 0 && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                <h3 className="mb-3 text-sm font-bold text-emerald-900">Các tài khoản vừa được tạo</h3>
                <p className="mb-3 text-xs font-medium text-emerald-800">
                  Chỉ sinh viên chưa có tài khoản mới nằm trong danh sách này. Username và password được lấy nguyên từ response import lần này.
                </p>
                <div className="max-h-[260px] overflow-auto rounded-lg border border-emerald-100 bg-white">
                  <table className="w-full min-w-[720px] text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-3 py-2 font-bold">Mã SV</th>
                        <th className="px-3 py-2 font-bold">Họ tên</th>
                        <th className="px-3 py-2 font-bold">Email</th>
                        <th className="px-3 py-2 font-bold">Username</th>
                        <th className="px-3 py-2 font-bold">Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.createdAccounts.map((account, index) => (
                        <tr key={`${account.studentCode}-${index}`} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-mono text-gray-700">{account.studentCode}</td>
                          <td className="px-3 py-2 text-gray-700">{account.fullName}</td>
                          <td className="px-3 py-2 text-gray-700">{account.email}</td>
                          <td className="px-3 py-2 font-mono font-bold text-gray-900">{account.username}</td>
                          <td className="px-3 py-2 font-mono font-bold text-gray-900">{account.password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {confirmed && (
              <div className="mt-4 rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                Đã import thành công. Email đã gửi: {importResult.emailSentCount ?? 0}, gửi lỗi: {importResult.emailFailedCount ?? 0}.
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleConfirmImport}
                disabled={confirming || confirmed || !importResult.importToken || importResult.failedCount > 0}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {confirmed ? 'Đã xác nhận import' : `Xác nhận import ${importResult.successCount} sinh viên`}
              </button>
            </div>
          </div>
        )}

        {/* Card 4: Lưu ý quan trọng */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
          <h3 className="font-bold text-blue-900 text-xs sm:text-sm mb-3.5 uppercase tracking-wide">Lưu ý quan trọng</h3>
          <ul className="text-xs sm:text-sm text-blue-800 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 font-medium">
            <li>• File phải đúng định dạng theo mẫu</li>
            <li>• Mã sinh viên không được trùng lặp</li>
            <li>• Các trường bắt buộc: Mã SV, Họ tên, Ngày sinh, Lớp</li>
            <li>• Ngày sinh phải đúng định dạng DD/MM/YYYY</li>
            <li className="sm:col-span-2">• Hệ thống sẽ kiểm tra và báo lỗi nếu dữ liệu không hợp lệ</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default AdminImport;

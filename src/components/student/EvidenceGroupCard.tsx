import { Upload, File, CheckCircle, AlertCircle, Eye, Trash2 } from 'lucide-react';
import { EvidenceGroupCardProps } from '../../types';

export const EvidenceGroupCard = ({
  group,
  groupEvidences,
  handleFileUpload,
  handleDelete,
  formatFileSize,
}: EvidenceGroupCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800">{group.name}</h2>
        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition text-sm font-semibold w-full sm:w-auto">
          <Upload size={16} />
          Tải lên
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => handleFileUpload(e, group.id)}
            className="hidden"
          />
        </label>
      </div>

      {groupEvidences.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <File size={48} className="mx-auto mb-2 opacity-50" />
          <p>Chưa có minh chứng</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupEvidences.map((evidence) => (
            <div
              key={evidence.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3 min-w-0 w-full">
                <div className="flex-shrink-0">
                  {evidence.fileType.startsWith('image/') ? (
                    <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                      <File className="text-blue-600" size={24} />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                      <File className="text-red-600" size={24} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{evidence.fileName}</p>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(evidence.fileSize)} • {evidence.uploadDate}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {evidence.aiVerification === 'verified' && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={14} />
                        Đã kiểm tra
                      </span>
                    )}
                    {evidence.aiVerification === 'suspicious' && (
                      <span className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertCircle size={14} />
                        Nghi ngờ không khớp
                      </span>
                    )}
                    {evidence.aiVerification === 'manual_review' && (
                      <span className="flex items-center gap-1 text-xs text-blue-600">
                        <AlertCircle size={14} />
                        Cần kiểm tra thủ công
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => evidence.url && window.open(evidence.url, '_blank', 'noopener,noreferrer')}
                  disabled={!evidence.url}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Eye size={20} />
                </button>
                <button
                  onClick={() => handleDelete(evidence.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

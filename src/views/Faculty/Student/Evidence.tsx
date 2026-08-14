'use client';

import { useCallback, useEffect, useState, ChangeEvent } from 'react';
import { EvidenceFile } from '../../../types';
import { EvidenceGuidelines } from '../../../components/student/EvidenceGuidelines';
import { EvidenceGroupCard } from '../../../components/student/EvidenceGroupCard';
import { API_Student } from '../../../api/API_Student';
import { uploadEvidenceFile } from '../../../services/cloudinaryUpload';
import { getUserFriendlyError } from '../../../utils/errorHelper';
import { CRITERIA_CODES } from '../../../constants/evaluationEnums';

export const StudentEvidence = () => {
  const [evidences, setEvidences] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingGroup, setUploadingGroup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getEvidenceUrl = useCallback(
    (item: any) => item.imageUrl || item.secureUrl || item.fileUrl || item.downloadUrl || item.url || item.storageKey || '',
    [],
  );

  const mapEvidence = useCallback((item: any): EvidenceFile => ({
    id: item.id,
    fileName: item.fileName || item.title || item.publicId || 'Minh chứng',
    fileType: item.fileType || item.mimeType || 'application/octet-stream',
    fileSize: item.fileSize || item.size || 0,
    url: getEvidenceUrl(item),
    criteriaId: item.criteriaId || item.criteriaCode || 'TC1',
    uploadDate: item.uploadDate || item.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
    aiVerification: item.aiVerification || 'manual_review',
  }), [getEvidenceUrl]);

  const mapEvidenceCriteriaCode = (criteriaId: string) => {
    const map: Record<string, string> = {
      TC1: CRITERIA_CODES.SECTION_1.NCKH_PARTICIPATION,
      TC2: CRITERIA_CODES.SECTION_2.NO_VIOLATION,
      TC3: CRITERIA_CODES.SECTION_3.REWARD,
      TC4: CRITERIA_CODES.SECTION_4.LAW_COMPLIANCE,
      TC5: CRITERIA_CODES.SECTION_5.SPECIAL_ACHIEVEMENT,
    };

    return map[criteriaId] || criteriaId;
  };

  const loadEvidences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await API_Student.getMyEvidences();
      setEvidences((data || []).map(mapEvidence));
    } catch (err: any) {
      setError(getUserFriendlyError(err, 'Không thể tải danh sách minh chứng.'));
    } finally {
      setLoading(false);
    }
  }, [mapEvidence]);

  useEffect(() => {
    loadEvidences();
  }, [loadEvidences]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, criteriaId: string) => {
    const files = e.target.files;
    if (!files) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const fileList = Array.from(files);
    const invalidFile = fileList.find((file) => !allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024);
    if (invalidFile) {
      setError('Chỉ nhận file JPG, PNG hoặc PDF, dung lượng tối đa 10MB.');
      e.target.value = '';
      return;
    }

    try {
      setUploadingGroup(criteriaId);
      setError(null);

      // Upload song song toàn bộ file — tích hợp compression tự động trong uploadEvidenceFile
      const results = await Promise.allSettled(
        fileList.map(async (file) => {
          const { secureUrl, publicId } = await uploadEvidenceFile(file);
          const evidenceCriteriaCode = mapEvidenceCriteriaCode(criteriaId);
          try {
            await API_Student.linkEvidenceUrl({
              criteriaCode: evidenceCriteriaCode,
              imageUrl: secureUrl,
              publicId,
            });
          } catch (linkErr) {
            console.warn('Backend linkEvidenceUrl failed:', linkErr);
          }
        })
      );

      // Thông báo file lỗi nếu có
      const failedNames = results
        .map((r, i) => (r.status === 'rejected' ? fileList[i].name : null))
        .filter(Boolean) as string[];

      if (failedNames.length > 0) {
        setError(`Không thể tải lên: ${failedNames.join(', ')}. Vui lòng thử lại.`);
      }

      // Reload danh sách từ server để đảm bảo đồng bộ
      await loadEvidences();
    } catch (err: any) {
      setError(getUserFriendlyError(err, 'Không thể tải minh chứng. Vui lòng thử lại.'));
    } finally {
      setUploadingGroup(null);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa minh chứng này?')) {
      try {
        setError(null);
        await API_Student.deleteEvidence(id);
        setEvidences((prev) => prev.filter((e) => e.id !== id));
      } catch (err: any) {
        setError(getUserFriendlyError(err, 'Không thể xóa minh chứng.'));
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const criteriaGroups = [
    { id: 'TC1', name: 'Ý thức tham gia học tập' },
    { id: 'TC2', name: 'Ý thức chấp hành nội quy, quy chế' },
    { id: 'TC3', name: 'Hoạt động chính trị - xã hội' },
    { id: 'TC4', name: 'Ý thức công dân trong quan hệ cộng đồng' },
    { id: 'TC5', name: 'Vai trò, trách nhiệm trong tập thể' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Quản lý minh chứng</h1>

      <EvidenceGuidelines />

      {loading && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          Đang tải danh sách minh chứng...
        </div>
      )}

      {uploadingGroup && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          Đang tải minh chứng lên...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {criteriaGroups.map((group) => {
        const groupEvidences = evidences.filter((e) => e.criteriaId === group.id);

        return (
          <EvidenceGroupCard
            key={group.id}
            group={group}
            groupEvidences={groupEvidences}
            handleFileUpload={handleFileUpload}
            handleDelete={handleDelete}
            formatFileSize={formatFileSize}
          />
        );
      })}
    </div>
  );
};

export default StudentEvidence;

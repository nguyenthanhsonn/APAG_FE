'use client';

import { createEvaluationTransport } from '../../../api/api';

import { useCallback, useEffect, useState, useRef, ChangeEvent } from 'react';
import { EvidenceFile } from '../../../types';
import { EvidenceGuidelines } from '../../../components/student/EvidenceGuidelines';
import { EvidenceGroupCard } from '../../../components/student/EvidenceGroupCard';
import { createStudentApi } from '../../../api/API_Student';
import { uploadEvidenceFile } from '../../../services/cloudinaryUpload';
import { logEvidenceUploadError, type EvidenceUploadStage } from '../../../services/evidenceUploadDiagnostics';
import { getUserFriendlyError } from '../../../utils/errorHelper';
import { CRITERIA_CODES } from '../../../constants/evaluationEnums';

export const StudentEvidence = () => {
  const [versionContext] = useState(() => createEvaluationTransport('student-evidence'));
  const [API_Student] = useState(() => createStudentApi(versionContext));
  const [forms, setForms] = useState<Array<{ id: string; label: string; editable: boolean }>>([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [formReady, setFormReady] = useState(false);
  const mutationLock = useRef(false);
  const [busy, setBusy] = useState(false);
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
    evaluationFormId: item.evaluationFormId,
    criteriaId: (() => {
      const code = item.criterion?.code || item.criteriaCode || item.criteriaId || '';
      if (/^(I\.|TC1)/.test(code)) return 'TC1';
      if (/^(II\.|TC2)/.test(code)) return 'TC2';
      if (/^(III\.|TC3)/.test(code)) return 'TC3';
      if (/^(IV\.|TC4)/.test(code)) return 'TC4';
      if (/^(V\.|TC5)/.test(code)) return 'TC5';
      return code;
    })(),
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
  }, [mapEvidence, API_Student]);

  useEffect(() => {
    loadEvidences();
    API_Student.getMyEvaluations().then(items => setForms(items.map(item => ({
      id: item.id,
      label: `${typeof item.semester === 'object' ? item.semester.semester : item.semester || ''} / ${item.academicYear || (typeof item.semester === 'object' ? item.semester.year : '')} — ${item.status}`,
      editable: ['draft', 'rejected'].includes(item.status) && !item.isLocked && item.semesterIsActive !== false,
    })))).catch(err => setError(getUserFriendlyError(err)));
  }, [loadEvidences, API_Student]);

  useEffect(() => {
    let cancelled = false;
    setFormReady(false);
    if (selectedFormId) API_Student.getEvaluationDetail(selectedFormId)
      .then(() => { if (!cancelled) setFormReady(true); })
      .catch(err => { if (!cancelled) setError(getUserFriendlyError(err)); });
    return () => { cancelled = true; };
  }, [selectedFormId, API_Student]);
  const editable = formReady && Boolean(forms.find(form => form.id === selectedFormId)?.editable);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, criteriaId: string) => {
    const files = e.target.files;
    if (!files || mutationLock.current || !editable) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const fileList = Array.from(files);
    const invalidFile = fileList.find((file) => !allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024);
    if (invalidFile) {
      setError('Chỉ nhận file JPG, PNG hoặc PDF, dung lượng tối đa 10MB.');
      e.target.value = '';
      return;
    }

    try {
      mutationLock.current = true;
      setBusy(true);
      setUploadingGroup(criteriaId);
      setError(null);

      // Upload song song toàn bộ file — tích hợp compression tự động trong uploadEvidenceFile
      const results = await Promise.allSettled(
        fileList.map(async (file) => {
          const evidenceCriteriaCode = mapEvidenceCriteriaCode(criteriaId);
          let stage: EvidenceUploadStage = 'cloudinary-upload';
          try {
            const { secureUrl, publicId } = await uploadEvidenceFile(file);
            stage = 'link-evidence';
            await API_Student.linkEvidenceUrl({
              evaluationFormId: selectedFormId,
              criteriaCode: evidenceCriteriaCode,
              imageUrl: secureUrl,
              publicId,
            });
          } catch (error) {
            logEvidenceUploadError(stage, error, {
              evaluationFormId: selectedFormId,
              criteriaCode: evidenceCriteriaCode,
              fileType: file.type,
              fileSize: file.size,
            });
            throw error;
          }
        })
      );

      // Thông báo file lỗi nếu có
      const failedNames = results
        .map((r, i) => (r.status === 'rejected' ? `${fileList[i].name}: ${getUserFriendlyError(r.reason, 'Tải tệp thất bại. Xem Console để biết chi tiết.')}` : null))
        .filter(Boolean) as string[];

      // Chỉ tải lại nếu có tệp đã lưu; hiển thị lỗi sau để không bị xóa khi reload.
      if (results.some(result => result.status === 'fulfilled')) await loadEvidences();
      if (failedNames.length > 0) {
        setError(`Không thể tải lên: ${failedNames.join('; ')}`);
      }
    } catch (err: any) {
      setError(getUserFriendlyError(err, 'Không thể tải minh chứng. Vui lòng thử lại.'));
    } finally {
      mutationLock.current = false;
      setBusy(false);
      setUploadingGroup(null);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (mutationLock.current || !editable) return;
    if (confirm('Bạn có chắc muốn xóa minh chứng này?')) {
      mutationLock.current = true;
      setBusy(true);
      try {
        setError(null);
        await API_Student.deleteEvidence(id);
        setEvidences((prev) => prev.filter((e) => e.id !== id));
      } catch (err: any) {
        setError(getUserFriendlyError(err, 'Không thể xóa minh chứng.'));
      } finally { mutationLock.current = false; setBusy(false); }
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

      <label className="block text-sm font-semibold text-gray-700">
        Phiếu đánh giá
        <select aria-label="Phiếu đánh giá" value={selectedFormId} disabled={busy} onChange={event => setSelectedFormId(event.target.value)} className="mt-2 block w-full rounded-lg border p-3">
          <option value="">Chọn phiếu cần xem hoặc thêm minh chứng</option>
          {forms.map(form => <option key={form.id} value={form.id}>{form.label}</option>)}
        </select>
      </label>
      {selectedFormId && !editable && <p className="text-sm text-amber-700">Phiếu đang tải hoặc không còn được chỉnh sửa.</p>}
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
        const groupEvidences = evidences.filter((e) => e.criteriaId === group.id && (e as EvidenceFile & { evaluationFormId?: string }).evaluationFormId === selectedFormId);

        return (
          <EvidenceGroupCard
            key={group.id}
            group={group}
            disabled={!editable || busy}
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

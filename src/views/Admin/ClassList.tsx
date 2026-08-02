'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, AlertCircle, ArrowLeft, UserPlus, X } from 'lucide-react';
import { API_Admin } from '../../api/API_Admin';
import { ClassListStudentItem, Class, Faculty, Major, StudentManagementItem, AdminClassListProps } from '../../types';
import ModalConfirm from '../../components/common/modalConfirm';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import DataTable, { type Column } from '../../components/admin/DataTable';
import ModalAddStudent from '../../components/admin/modalAddStudent';
import { getUserFriendlyError, toArray } from '../../utils/adminData';
import { useAdminUrlState } from '../../utils/adminUrlState';

const normalizeFaculty = (f: any): Faculty => ({
  id: f.id || f._id || '',
  code: f.code || '',
  name: f.name || '',
  isActive: f.isActive ?? true,
});

const normalizeMajor = (m: any): Major => ({
  id: m.id || m._id || '',
  code: m.code || '',
  name: m.name || '',
  facultyId: m.facultyId || m.faculty_id || m.faculty?.id || m.faculty?._id || '',
  faculty: m.faculty,
  isActive: m.isActive ?? true,
});

const normalizeClass = (c: any): Class => {
  const majorId = c.majorId || c.major_id || c.major?.id || c.major?._id || '';
  const facultyId =
    c.facultyId ||
    c.faculty_id ||
    c.faculty?.id ||
    c.faculty?._id ||
    c.major?.facultyId ||
    c.major?.faculty_id ||
    c.major?.faculty?.id ||
    c.major?.faculty?._id ||
    '';

  return {
    id: c.id || c._id || '',
    code: c.code || '',
    name: c.name || '',
    facultyId,
    majorId,
    major: c.major,
    faculty: c.faculty || c.major?.faculty,
    enrollmentYear: c.enrollmentYear,
    studentCount: c.studentCount,
    classLeaders: c.classLeaders || [],
    advisors: c.advisors || [],
    isActive: c.isActive ?? true,
  };
};

export const AdminClassList = ({ preSelectedClassId, onBack }: AdminClassListProps) => {
  const { getPage, getValue, setQuery } = useAdminUrlState();
  const [selectedFaculty, setSelectedFaculty] = useState(() => getValue('facultyId'));
  const [selectedMajor, setSelectedMajor] = useState(() => getValue('majorId'));
  const [selectedClass, setSelectedClass] = useState(() => preSelectedClassId || getValue('classId'));
  const [searchTerm, setSearchTerm] = useState(() => getValue('search'));
  const [page, setPage] = useState(() => getPage());
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classDetail, setClassDetail] = useState<Class | null>(null);
  const [students, setStudents] = useState<ClassListStudentItem[]>([]);
  const [advisors, setAdvisors] = useState<StudentManagementItem[]>([]);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('');
  const [advisorsSaving, setAdvisorsSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteStudent, setPendingDeleteStudent] = useState<ClassListStudentItem | null>(null);

  // Chỉ tải danh sách khoa ban đầu; ngành/lớp được tải theo API cây khi người dùng chọn.
  useEffect(() => {
    const loadFaculties = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const facs = await API_Admin.getFaculties();
        setFaculties(toArray(facs as any).map(normalizeFaculty));
      } catch (err: any) {
        setErrorMsg(getUserFriendlyError(err, 'Không thể tải thông tin danh mục. Vui lòng thử lại sau.'));
      } finally {
        setLoading(false);
      }
    };

    loadFaculties();
  }, []);

  useEffect(() => {
    const loadMajorsByFaculty = async () => {
      if (!selectedFaculty) {
        setMajors([]);
        setClasses([]);
        return;
      }

      try {
        setErrorMsg('');
        const data = await API_Admin.getFacultyMajors(selectedFaculty, { page: 1, limit: 1000, isActive: true, includeDeleted: false });
        setMajors(toArray(data as any).map(normalizeMajor));
      } catch (err) {
        setMajors([]);
        setErrorMsg(getUserFriendlyError(err, 'Không thể tải danh sách ngành trong khoa. Vui lòng thử lại sau.'));
      }
    };

    loadMajorsByFaculty();
  }, [selectedFaculty]);

  useEffect(() => {
    const loadClassesByMajor = async () => {
      if (!selectedMajor) {
        setClasses([]);
        return;
      }

      try {
        setErrorMsg('');
        const data = await API_Admin.getMajorClasses(selectedMajor, { page: 1, limit: 1000, isActive: true, includeDeleted: false });
        setClasses(toArray(data as any).map(normalizeClass));
      } catch (err) {
        setClasses([]);
        setErrorMsg(getUserFriendlyError(err, 'Không thể tải danh sách lớp trong ngành. Vui lòng thử lại sau.'));
      }
    };

    loadClassesByMajor();
  }, [selectedMajor]);

  const loadStudents = async (classId: string) => {
    if (!classId) {
      setStudents([]);
      return;
    }

    try {
      setStudentsLoading(true);
      setErrorMsg('');
      const data = await API_Admin.getClassStudents(classId, { page: 1, limit: 1000 });
      const normalized: ClassListStudentItem[] = toArray(data as any).map((s: any) => ({
        id: s.studentId || s.userId || s.id,
        studentCode: s.studentCode || '',
        fullName: s.fullName || '',
        dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
        phoneNumber: s.phone || s.phoneNumber || '',
        email: s.email,
        role: s.role || 'student',
        isActive: s.isActive ?? true,
        isClassLeader: !!s.isClassLeader,
        classLeaderAssignment: s.classLeaderAssignment || null,
        enrolledAt: s.enrolledAt,
      }));
      setStudents(normalized);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải danh sách sinh viên. Vui lòng thử lại sau.'));
    } finally {
      setStudentsLoading(false);
    }
  };

  const loadClassDetail = useCallback(async (classId: string) => {
    if (!classId) {
      setClassDetail(null);
      return;
    }

    try {
      const data = await API_Admin.getClassById(classId);
      const detail = normalizeClass(data as any);
      setClassDetail(detail);
    } catch (err: any) {
      setClassDetail(null);
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải chi tiết lớp. Vui lòng thử lại sau.'));
    }
  }, []);

  useEffect(() => {
    loadStudents(selectedClass);
    loadClassDetail(selectedClass);
  }, [loadClassDetail, selectedClass]);

  useEffect(() => {
    const loadAdvisors = async () => {
      try {
        const data = await API_Admin.getUsers({ role: 'advisor', page: 1, limit: 100, includeDeleted: false });
        setAdvisors(toArray(data as any));
      } catch {
        setAdvisors([]);
      }
    };

    loadAdvisors();
  }, []);

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (student: ClassListStudentItem) => {
    setPendingDeleteStudent(student);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteStudent || !selectedClass) return;

    try {
      setErrorMsg('');
      await API_Admin.removeStudentFromClass(selectedClass, pendingDeleteStudent.id);
      setConfirmOpen(false);
      setPendingDeleteStudent(null);
      await loadStudents(selectedClass);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể xóa sinh viên khỏi lớp. Vui lòng thử lại sau.'));
      setConfirmOpen(false);
      setPendingDeleteStudent(null);
    }
  };

  const handleAddStudentSubmit = async (newStudentData: Omit<ClassListStudentItem, 'id'> & { classId: string }) => {
    try {
      setErrorMsg('');
      await API_Admin.addStudentToClass(selectedClass, {
        studentId: newStudentData.studentCode,
      });
      setAddModalOpen(false);
      await loadStudents(selectedClass);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể thêm sinh viên vào lớp. Mã sinh viên có thể không tồn tại hoặc đã trong lớp khác.'));
    }
  };

  const columns: Column<ClassListStudentItem>[] = [
    {
      key: 'studentCode',
      label: 'Mã SV',
      width: '20%',
      render: (val) => <span className="font-mono text-sm text-[#3B5BDB]">{val as string}</span>,
    },
    {
      key: 'fullName',
      label: 'Họ và tên',
      width: '35%',
      render: (val) => <span className="font-medium text-gray-900">{val as string}</span>,
    },
    {
      key: 'dateOfBirth',
      label: 'Ngày sinh',
      width: '20%',
      render: (val) => {
        try {
          return <span>{val ? new Date(val as string).toLocaleDateString('vi-VN') : '—'}</span>;
        } catch { return <span>{val as string}</span>; }
      },
    },
    {
      key: 'phoneNumber',
      label: 'Số ĐT',
      width: '15%',
      render: (val) => <span className="text-gray-600">{val as string}</span>,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      width: '10%',
      render: (_, row) => (
        <button
          onClick={() => handleDeleteClick(row)}
          className="p-2 cursor-pointer text-red-600 hover:bg-red-50 rounded-lg"
          title="Xóa khỏi lớp"
        >
          <Trash2 size={18} />
        </button>
      ),
    },
  ];

  const activeClassDetails = classes.find((c) => c.id === selectedClass);
  const displayedClass = classDetail || activeClassDetails || null;
  const displayedMajor = displayedClass?.major?.name || majors.find((m) => m.id === displayedClass?.majorId)?.name || '—';
  const displayedFaculty =
    displayedClass?.faculty?.name ||
    displayedClass?.major?.faculty?.name ||
    faculties.find((f) => f.id === displayedClass?.facultyId)?.name ||
    '—';
  const assignedAdvisorUserIds = new Set((displayedClass?.advisors || []).map((item) => item.userId));
  const availableAdvisors = advisors.filter((item) => item.isActive && !assignedAdvisorUserIds.has(item.id));
  const displayedClassLeaders = displayedClass?.classLeaders || [];

  const updateAdvisorUsers = async (userIds: string[]) => {
    if (!selectedClass) return;

    try {
      setAdvisorsSaving(true);
      setErrorMsg('');
      const updatedClass = await API_Admin.updateClassAdvisors(selectedClass, { userIds });
      const detail = updatedClass as any;
      setClassDetail((prev) => ({
        ...(prev || {
          id: detail.id || selectedClass,
          code: detail.code || '',
          name: detail.name || '',
          facultyId: detail.facultyId || detail.faculty?.id || '',
          majorId: detail.majorId || detail.major?.id || '',
          isActive: detail.isActive ?? true,
        }),
        ...detail,
        advisors: detail.advisors || [],
      }));
    } catch (err) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể cập nhật cố vấn học tập phụ trách. Vui lòng thử lại sau.'));
    } finally {
      setAdvisorsSaving(false);
    }
  };

  const handleAssignAdvisor = async () => {
    if (!selectedAdvisorId) return;

    const currentIds = (displayedClass?.advisors || []).map((item) => item.userId);
    await updateAdvisorUsers([...currentIds, selectedAdvisorId]);
    setSelectedAdvisorId('');
  };

  const handleRemoveAdvisor = async (userId: string) => {
    const nextIds = (displayedClass?.advisors || []).map((item) => item.userId).filter((id) => id !== userId);
    await updateAdvisorUsers(nextIds);
  };

  const handleFacultyChange = (value: string) => {
    setSelectedFaculty(value);
    setSelectedMajor('');
    setSelectedClass('');
    setPage(1);
    setQuery({ facultyId: value, majorId: null, classId: null }, { resetPage: true });
  };

  const handleMajorChange = (value: string) => {
    setSelectedMajor(value);
    setSelectedClass('');
    setPage(1);
    setQuery({ majorId: value, classId: null }, { resetPage: true });
  };

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setPage(1);
    setQuery({ classId: value }, { resetPage: true });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    setQuery({ search: value }, { resetPage: true });
  };

  const handlePageChange = (value: number) => {
    setPage(value);
    setQuery({ page: value });
  };

  return (
    <div className="flex flex-col px-4 sm:px-6 py-4 sm:py-6 bg-[#F8F9FA] gap-4">
      <div className="flex items-center justify-between">
        {onBack ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex cursor-pointer items-center gap-1.5 px-3 py-1.5 border border-[#DEE2E6] hover:bg-[#F8F9FA] text-[#495057] rounded-xl font-bold text-xs transition"
            >
              <ArrowLeft size={14} />
              Quay lại quản lý lớp
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Sinh viên lớp: {displayedClass?.name || '—'}
            </h1>
          </div>
        ) : (
          <h1 className="text-xl font-bold text-gray-900">Danh sách lớp</h1>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs sm:text-sm font-semibold">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2.5 bg-white rounded-xl shadow-sm border p-6">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-xs text-gray-500 font-semibold">Đang tải thông tin danh mục...</p>
        </div>
      ) : (
        <>
          {!preSelectedClassId && (
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="text-sm font-semibold mb-3 text-gray-800">Chọn lớp</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Khoa</label>
                  <select
                    value={selectedFaculty}
                    onChange={(e) => handleFacultyChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white"
                  >
                    <option value="">-- Chọn khoa --</option>
                    {faculties.filter((f) => f.isActive).map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Ngành</label>
                  <select
                    value={selectedMajor}
                    onChange={(e) => handleMajorChange(e.target.value)}
                    disabled={!selectedFaculty}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="">{selectedFaculty ? '-- Chọn ngành --' : '-- Chọn khoa trước --'}</option>
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Lớp</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    disabled={!selectedMajor}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="">{selectedMajor ? '-- Chọn lớp --' : '-- Chọn ngành trước --'}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {selectedClass && (
            <div className="flex-1 flex flex-col gap-3">
              {displayedClass && (
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Mã lớp</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-[#3B5BDB]">{displayedClass.code || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Tên lớp</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{displayedClass.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Ngành</p>
                      <p className="mt-1 text-sm text-gray-700">{displayedMajor}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Khoa</p>
                      <p className="mt-1 text-sm text-gray-700">{displayedFaculty}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Năm nhập học</p>
                      <p className="mt-1 text-sm text-gray-700">{displayedClass.enrollmentYear || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Số sinh viên</p>
                      <p className="mt-1 text-sm text-gray-700">{displayedClass.studentCount ?? students.length}</p>
                    </div>
                    <div className="sm:col-span-2 xl:col-span-1">
                      <p className="text-xs font-semibold uppercase text-gray-500">Lớp trưởng</p>
                      <p className="mt-1 truncate text-sm text-gray-700">
                        {displayedClassLeaders.length > 0
                          ? displayedClassLeaders.map((item) => item.fullName || item.username).join(', ')
                          : students.find((item) => item.isClassLeader)?.fullName || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Trạng thái</p>
                      <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${displayedClass.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {displayedClass.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {displayedClass && (
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Cố vấn học tập phụ trách</h2>
                      <p className="mt-0.5 text-xs font-medium text-gray-500">
                        Gán cố vấn học tập cho lớp tại đây. Danh sách này dùng cho quyền CVHT xem và duyệt lớp phụ trách.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={selectedAdvisorId}
                        onChange={(e) => setSelectedAdvisorId(e.target.value)}
                        disabled={advisorsSaving || availableAdvisors.length === 0}
                        className="h-10 min-w-[240px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                      >
                        <option value="">-- Chọn CVHT --</option>
                        {availableAdvisors.map((item) => (
                          <option key={item.id} value={item.id}>
                            {[item.fullName, item.username].filter(Boolean).join(' - ')}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAssignAdvisor}
                        disabled={!selectedAdvisorId || advisorsSaving}
                        className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0B3A82] px-4 text-sm font-semibold text-white transition hover:bg-[#104E92] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {advisorsSaving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                        Gán CVHT
                      </button>
                    </div>
                  </div>

                  {(displayedClass.advisors || []).length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {displayedClass.advisors?.map((item) => (
                        <div
                          key={item.id || item.userId}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{item.fullName || item.username}</p>
                            <p className="truncate text-xs font-medium text-gray-500">{item.email || item.username}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdvisor(item.userId)}
                            disabled={advisorsSaving}
                            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Gỡ cố vấn"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500">
                      Lớp này chưa có cố vấn học tập phụ trách.
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Danh sách sinh viên</h2>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5 bg-[#0B3A82] hover:bg-[#104E92] text-white rounded-lg font-semibold text-xs transition"
                >
                  <Plus size={14} />
                  Thêm sinh viên
                </button>
              </div>

              <SearchFilterBar
                searchValue={searchTerm}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Tìm kiếm sinh viên..."
              />

              {studentsLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
                  <Loader2 className="animate-spin text-blue-600" size={28} />
                  <p className="text-xs text-gray-400 font-semibold">Đang tải danh sách sinh viên...</p>
                </div>
              ) : (
                <div className="flex-1">
                  <DataTable
                    columns={columns}
                    data={filteredStudents}
                    pageSize={5}
                    emptyText="Không có dữ liệu sinh viên"
                    minHeight={260}
                    currentPage={page}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      <ModalConfirm
        isOpen={confirmOpen}
        title="Xóa sinh viên khỏi lớp"
        message={`Bạn có chắc chắn muốn xóa sinh viên ${pendingDeleteStudent?.fullName} ra khỏi lớp học hiện tại không?`}
        targetName={pendingDeleteStudent?.fullName}
        type="danger"
        confirmText="Xóa khỏi lớp"
        cancelText="Hủy bỏ"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteStudent(null);
        }}
      />

      <ModalAddStudent
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddStudentSubmit}
        defaultClassId={selectedClass}
        classes={classes}
        onImportSuccess={() => loadStudents(selectedClass)}
      />
    </div>
  );
};

export default AdminClassList;

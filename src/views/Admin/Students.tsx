'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Lock, Plus, Trash2, Unlock, Upload } from 'lucide-react';
import ModalCreateManualStudent from '../../components/admin/modalCreateManualStudent';
import ModalImportExcel from '../../components/admin/modalImportExcel';
import ModalConfirm from '../../components/common/modalConfirm';
import DataTable, { type Column } from '../../components/admin/DataTable';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import { API_Admin } from '../../api/API_Admin';
import { useToast } from '../../components/common/ToastProvider';
import { getUserFriendlyError, toArray } from '../../utils/adminData';
import { useAdminUrlState } from '../../utils/adminUrlState';
import type { Class, CreateStudentPayload, StudentManagementItem } from '../../types';

export const AdminStudents = () => {
  const toast = useToast();
  const pageSize = 10;
  const [students, setStudents] = useState<StudentManagementItem[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmType, setConfirmType] = useState<'delete' | 'lock' | 'unlock' | null>(null);
  const [pendingStudent, setPendingStudent] = useState<StudentManagementItem | null>(null);
  const [lockReason, setLockReason] = useState('');
  const { getPage, getValue, setQuery } = useAdminUrlState();
  const [searchTerm, setSearchTerm] = useState(() => getValue('search'));
  const [page, setPage] = useState(() => getPage());

  const fetchStudents = async () => {
    try {
      setErrorMsg('');
      const response = await API_Admin.getStudents({
        page,
        limit: pageSize,
        keyword: searchTerm.trim() || undefined,
        includeDeleted: false,
      });
      const raw = response as any;
      const mapped = toArray(raw).map((u: any): StudentManagementItem => ({
        id: u.id,
        username: u.username || (u.email ? u.email.split('@')[0] : 'unknown'),
        fullName: u.fullName || '',
        role: 'student',
        email: u.email,
        phone: u.phone,
        dateOfBirth: u.dateOfBirth,
        studentCode: u.studentCode || '',
        facultyId: u.facultyId,
        majorId: u.majorId,
        classId: u.classId,
        admissionYear: u.admissionYear,
        isActive: u.isActive,
      }));
      setStudents(mapped);
      setTotalStudents(typeof raw?.total === 'number' ? raw.total : mapped.length);
    } catch (err) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải danh sách sinh viên. Vui lòng thử lại sau.'));
      setStudents([]);
      setTotalStudents(0);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await API_Admin.getClasses();
        setClassesList(toArray(data as any));
      } catch {
        setClassesList([]);
      }
    };

    loadClasses();
  }, []);

  const handleCreateManualStudent = async (values: CreateStudentPayload) => {
    try {
      setErrorMsg('');
      const created = await API_Admin.createStudent(values);
      await fetchStudents();
      if (created.accountEmailSent === false && created.accountEmailError) {
        toast.error('Tài khoản đã tạo, nhưng email chưa được gửi.');
      } else {
        toast.success('Tạo sinh viên thành công.');
      }
    } catch (err) {
      const friendlyMessage = getUserFriendlyError(err, 'Không thể tạo sinh viên. Vui lòng kiểm tra lại thông tin đã nhập.');
      setErrorMsg(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const handleToggleActive = (student: StudentManagementItem) => {
    setPendingStudent(student);
    setConfirmType(student.isActive ? 'lock' : 'unlock');
  };

  const handleDelete = (student: StudentManagementItem) => {
    setPendingStudent(student);
    setConfirmType('delete');
  };

  const handleConfirmAction = async () => {
    if (!pendingStudent || !confirmType) return;

    try {
      setErrorMsg('');
      if (confirmType === 'delete') {
        await API_Admin.deleteAccount(pendingStudent.id, pendingStudent.role);
        toast.success('Đã xóa sinh viên.');
      } else {
        const nextIsActive = confirmType === 'unlock';
        await API_Admin.updateAccountStatus(pendingStudent.id, pendingStudent.role, { isActive: nextIsActive });
        toast.success(nextIsActive ? 'Đã mở khóa tài khoản sinh viên.' : 'Đã khóa tài khoản sinh viên.');
      }
      await fetchStudents();
    } catch (err) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể cập nhật sinh viên. Vui lòng thử lại sau.'));
    } finally {
      setConfirmType(null);
      setPendingStudent(null);
      setLockReason('');
    }
  };

  const columns: Column<StudentManagementItem>[] = [
    {
      key: 'studentCode',
      label: 'Mã SV',
      width: '15%',
      render: (val) => <span className="font-mono font-semibold text-gray-800">{(val as string) || '—'}</span>,
    },
    {
      key: 'fullName',
      label: 'Họ tên',
      width: '30%',
      render: (val) => <span className="font-medium text-[#1A1B1E]">{val as string}</span>,
    },
    {
      key: 'email',
      label: 'Email',
      width: '25%',
      render: (val) => <span className="text-sm text-gray-600">{(val as string) || '—'}</span>,
    },
    {
      key: 'isActive',
      label: 'Trạng thái',
      width: '15%',
      render: (val) => (
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {val ? 'Hoạt động' : 'Khóa'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      width: '15%',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleActive(row)}
            className="cursor-pointer rounded-lg p-2 text-orange-600 hover:bg-orange-50"
            title={row.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
          >
            {row.isActive ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="cursor-pointer rounded-lg p-2 text-red-600 hover:bg-red-50"
            title="Xóa"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

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
    <div className="relative flex flex-col px-4 sm:px-6 py-4 sm:py-6 bg-[#F8F9FA] pb-28 sm:pb-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý sinh viên</h1>
        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Tên hoặc mã sinh viên"
          variant="inline"
        />
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 sm:text-sm">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex-1 mt-4">
        <DataTable
          columns={columns}
          data={students}
          pageSize={pageSize}
          totalItems={totalStudents}
          emptyText="Không tìm thấy sinh viên nào"
          minHeight={400}
          showSummary={false}
          paginationAlign="left"
          currentPage={page}
          onPageChange={handlePageChange}
        />
      </div>

      <div className="fixed bottom-8 right-8 z-20 flex flex-col items-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700"
        >
          <Upload size={18} />
          Nhập Excel
        </button>
        <button
          type="button"
          onClick={() => setStudentModalOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#0B3A82] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/25 transition hover:bg-[#104E92]"
        >
          <Plus size={18} />
          Thêm sinh viên
        </button>
      </div>

      <ModalCreateManualStudent
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onSubmit={handleCreateManualStudent}
        classes={classesList}
      />

      <ModalImportExcel
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={fetchStudents}
      />

      <ModalConfirm
        isOpen={confirmType !== null}
        title={
          confirmType === 'delete'
            ? 'Xác nhận xóa sinh viên'
            : confirmType === 'lock'
            ? 'Xác nhận khóa tài khoản'
            : 'Xác nhận mở khóa tài khoản'
        }
        message={
          confirmType === 'delete'
            ? `Bạn có chắc muốn xóa vĩnh viễn sinh viên ${pendingStudent?.fullName}?`
            : confirmType === 'lock'
            ? `Bạn có chắc muốn tạm khóa tài khoản sinh viên ${pendingStudent?.fullName}? Sinh viên này sẽ không thể đăng nhập vào hệ thống.`
            : `Xác nhận mở khóa hoạt động trở lại cho sinh viên ${pendingStudent?.fullName}?`
        }
        targetName={pendingStudent?.fullName}
        type={confirmType === 'delete' ? 'danger' : 'warning'}
        hasReasonInput={confirmType === 'lock'}
        reasonValue={lockReason}
        onReasonChange={setLockReason}
        confirmText={confirmType === 'delete' ? 'Xóa sinh viên' : confirmType === 'lock' ? 'Khóa tài khoản' : 'Mở khóa'}
        cancelText="Hủy bỏ"
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setConfirmType(null);
          setPendingStudent(null);
          setLockReason('');
        }}
      />
    </div>
  );
};

export default AdminStudents;

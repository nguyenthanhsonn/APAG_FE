'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Lock, Unlock, AlertCircle, ChevronDown } from 'lucide-react';
import ModalCreateStudent from '../../components/admin/modalCreateStudent';
import ModalCreateManualStudent from '../../components/admin/modalCreateManualStudent';
import ModalImportExcel from '../../components/admin/modalImportExcel';
import { Class, CreateStudentPayload, StudentManagementItem, StudentFormValues } from '../../types';
import ModalConfirm from '../../components/common/modalConfirm';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import DataTable, { type Column } from '../../components/admin/DataTable';
import { AddActionsDropdown } from '../../components/admin/AddActionsDropdown';
import { API_Admin } from '../../api/API_Admin';
import { useToast } from '../../components/common/ToastProvider';
import { getUserFriendlyError, toArray } from '../../utils/adminData';
import { useAdminUrlState } from '../../utils/adminUrlState';

export const AdminUsers = () => {
  const toast = useToast();
  const pageSize = 10;
  const [students, setStudents] = useState<StudentManagementItem[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentFormValues | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [classesList, setClassesList] = useState<Class[]>([]);
  const { getPage, getValue, setQuery } = useAdminUrlState({ status: 'all', role: 'all' });
  const [searchTerm, setSearchTerm] = useState(() => getValue('search'));

  // Confirmation state
  const [confirmType, setConfirmType] = useState<'delete' | 'lock' | 'unlock' | null>(null);
  const [pendingStudent, setPendingStudent] = useState<StudentManagementItem | null>(null);
  const [lockReason, setLockReason] = useState('');

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    () => getValue('status', 'all') as 'all' | 'active' | 'inactive'
  );
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin' | 'class_council'>(
    () => getValue('role', 'all') as 'all' | 'student' | 'admin' | 'class_council'
  );
  const [page, setPage] = useState(() => getPage());

  const fetchStudents = async () => {
    try {
      setErrorMsg('');
      const usersRes = await API_Admin.getUsers({
        page,
        limit: pageSize,
        keyword: searchTerm.trim() || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        isActive:
          statusFilter === 'all'
            ? undefined
            : statusFilter === 'active',
        includeDeleted: false,
      });

      const response = usersRes as any;
      const list = toArray(response);
      const mapped = list.map((u: any) => ({
        id: u.id,
        username: u.username || (u.email ? u.email.split('@')[0] : 'unknown'),
        fullName: u.fullName || '',
        role: u.role,
        email: u.email,
        phone: u.phone,
        dateOfBirth: u.dateOfBirth,
        studentCode: u.studentCode || '',
        isActive: u.isActive,
      }));
      setStudents(mapped);
      setTotalUsers(typeof response?.total === 'number' ? response.total : mapped.length);
    } catch (err) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải danh sách người dùng. Vui lòng thử lại sau.'));
      setStudents([]);
      setTotalUsers(0);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, statusFilter, roleFilter]);

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

  const handleToggleActive = (id: string) => {
    const s = students.find((item) => item.id === id);
    if (!s) return;
    setPendingStudent(s);
    setConfirmType(s.isActive ? 'lock' : 'unlock');
  };

  const handleDelete = (id: string) => {
    const s = students.find((item) => item.id === id);
    if (!s) return;
    setPendingStudent(s);
    setConfirmType('delete');
  };

  const handleConfirmAction = async () => {
    if (!pendingStudent || !confirmType) return;

    try {
      setErrorMsg('');

      if (confirmType === 'delete') {
        await API_Admin.deleteUser(pendingStudent.id);
        toast.success('Đã xóa tài khoản.');
      } else {
        const nextIsActive = confirmType === 'unlock';
        await API_Admin.updateUserStatus(pendingStudent.id, { isActive: nextIsActive });
        toast.success(nextIsActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      }

      await fetchStudents();
    } catch (err) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể cập nhật tài khoản. Vui lòng thử lại sau.'));
    } finally {
      setConfirmType(null);
      setPendingStudent(null);
      setLockReason('');
    }
  };

  const handleOpenEdit = (s: StudentManagementItem) => {
    if (s.role === 'student') {
      setErrorMsg('Sinh viên được quản lý ở trang riêng, không chỉnh sửa trong modal người dùng.');
      return;
    }

    setEditingStudent({
      username: s.username,
      fullName: s.fullName,
      password: '',
      email: s.email ?? '',
      phone: s.phone ?? '',
      dateOfBirth: s.dateOfBirth ?? '',
      studentCode: s.studentCode ?? '',
      facultyId: s.facultyId ?? '',
      majorId: s.majorId ?? '',
      classId: s.classId ?? '',
      admissionYear: s.admissionYear ?? String(new Date().getFullYear()),
      role: s.role as 'admin' | 'class_council',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
  };

  const handleSubmitModal = async (values: StudentFormValues) => {
    try {
      if (editingStudent) {
        // TODO: Nối API PATCH /admin/users/:id khi backend hoàn thiện
        setStudents((prev) =>
          prev.map((s) =>
            s.username === editingStudent.username
              ? { ...s, ...values }
              : s
          )
        );
      } else {
        const res = await API_Admin.createUser({
          username: values.username,
          email: values.email,
          fullName: values.fullName,
          password: values.password,
          role: values.role,
          phone: values.phone || undefined,
          dateOfBirth: values.dateOfBirth || undefined,
        });
        const created = res.data || res;
        
        const newStudent: StudentManagementItem = {
          id: created.id || String(Date.now()),
          username: created.username || (created.email ? created.email.split('@')[0] : values.username),
          fullName: created.fullName || values.fullName,
          role: created.role || values.role,
          email: created.email || values.email,
          phone: created.phone || values.phone,
          dateOfBirth: created.dateOfBirth || values.dateOfBirth,
          studentCode: values.studentCode,
          facultyId: values.facultyId,
          majorId: values.majorId,
          classId: values.classId,
          admissionYear: values.admissionYear,
          isActive: created.isActive ?? true,
        };
        setStudents((prev) => [...prev, newStudent]);

        if (values.role === 'class_council') {
          if (created.accountEmailSent === true) {
            toast.success('Tạo tài khoản và gửi email thành công.');
          } else if (created.accountEmailSent === false && created.accountEmailError) {
            toast.error('Tạo tài khoản thành công nhưng chưa gửi được email.');
          } else {
            toast.success('Tạo tài khoản thành công.');
          }
        } else {
          toast.success('Tạo tài khoản thành công.');
        }
      }
      setShowModal(false);
      setEditingStudent(null);
    } catch (err) {
      const friendlyMessage = getUserFriendlyError(err, 'Không thể lưu thông tin người dùng. Vui lòng kiểm tra lại thông tin đã nhập.');
      setErrorMsg(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  const handleCreateManualStudent = async (values: CreateStudentPayload) => {
    try {
      setErrorMsg('');
      const created = await API_Admin.createStudent(values);
      const newStudent: StudentManagementItem = {
        id: created.id || String(Date.now()),
        username: created.username || values.username,
        fullName: created.fullName || values.fullName,
        role: 'student',
        email: created.email || values.email,
        phone: created.phone || values.phone,
        dateOfBirth: created.dateOfBirth || values.dateOfBirth,
        studentCode: created.studentCode || values.studentCode,
        classId: values.classId,
        isActive: created.isActive ?? true,
      };
      setStudents((prev) => [...prev, newStudent]);
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

  const roleBadgeConfig = {
    admin: { label: 'Quản trị viên', className: 'bg-purple-100 text-purple-700' },
    class_council: { label: 'Cố vấn học tập', className: 'bg-orange-100 text-orange-700' },
    student: { label: 'Sinh viên', className: 'bg-blue-100 text-blue-700' },
  } as const;

  const columns: Column<StudentManagementItem>[] = [
    {
      key: 'fullName',
      label: 'Họ tên',
      width: '40%',
      render: (val) => <span className="font-medium text-[#1A1B1E]">{val as string}</span>,
    },
    {
      key: 'role',
      label: 'Vai trò',
      width: '15%',
      render: (val) => {
        const config = roleBadgeConfig[(val as keyof typeof roleBadgeConfig) || 'student'] || roleBadgeConfig.student;
        return (
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      label: 'Trạng thái',
      width: '20%',
      render: (val) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            val
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
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
            onClick={() => handleOpenEdit(row)}
            className="p-2 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Chỉnh sửa"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleToggleActive(row.id)}
            className="p-2 cursor-pointer text-orange-600 hover:bg-orange-50 rounded-lg"
            title={row.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
          >
            {row.isActive ? <Lock size={18} /> : <Unlock size={18} />}
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 cursor-pointer text-red-600 hover:bg-red-50 rounded-lg"
            title="Xóa"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  const statusFilterOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Hoạt động', value: 'active' },
    { label: 'Đang khóa', value: 'inactive' },
  ];
  const roleFilterOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Sinh viên', value: 'student' },
    { label: 'Cố vấn học tập', value: 'class_council' },
    { label: 'Quản trị viên', value: 'admin' },
  ];

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    setQuery({ search: value }, { resetPage: true });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as 'all' | 'active' | 'inactive');
    setPage(1);
    setQuery({ status: value }, { resetPage: true });
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value as 'all' | 'student' | 'admin' | 'class_council');
    setPage(1);
    setQuery({ role: value }, { resetPage: true });
  };

  const handlePageChange = (value: number) => {
    setPage(value);
    setQuery({ page: value });
  };

  return (
    <div className="relative flex flex-col px-4 sm:px-6 py-4 sm:py-6 bg-[#F8F9FA] pb-28 sm:pb-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          filterValue={statusFilter}
          onFilterChange={handleStatusChange}
          searchPlaceholder="Tên người dùng"
          filterOptions={statusFilterOptions}
          filterLabel="Trạng thái"
          variant="inline"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Vai trò:</span>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400 transition cursor-pointer"
              >
                {roleFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
            </div>
          </div>
        </SearchFilterBar>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs sm:text-sm font-semibold">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex-1 mt-4">
        <DataTable
          columns={columns}
          data={students}
          pageSize={pageSize}
          totalItems={totalUsers}
          emptyText="Không tìm thấy người dùng nào"
          minHeight={400}
          showSummary={false}
          paginationAlign="left"
          currentPage={page}
          onPageChange={handlePageChange}
        />
      </div>

      <div className="fixed bottom-8 right-8 z-20">
        <AddActionsDropdown
          onAddStudent={() => setStudentModalOpen(true)}
          onImportExcel={() => setImportOpen(true)}
          onAddUser={() => { setEditingStudent(null); setShowModal(true); }}
        />
      </div>

      <ModalCreateStudent
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        editData={editingStudent}
      />

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
            ? 'Xác nhận xóa tài khoản'
            : confirmType === 'lock'
            ? 'Xác nhận khóa tài khoản'
            : 'Xác nhận mở khóa tài khoản'
        }
        message={
          confirmType === 'delete'
            ? `Bạn có chắc muốn xóa vĩnh viễn tài khoản của người dùng ${pendingStudent?.fullName}?`
            : confirmType === 'lock'
            ? `Bạn có chắc muốn tạm khóa tài khoản của người dùng ${pendingStudent?.fullName}? Người dùng này sẽ không thể đăng nhập vào hệ thống.`
            : `Xác nhận mở khóa hoạt động trở lại cho người dùng ${pendingStudent?.fullName}?`
        }
        targetName={pendingStudent?.fullName}
        type={confirmType === 'delete' ? 'danger' : 'warning'}
        hasReasonInput={confirmType === 'lock'}
        reasonValue={lockReason}
        onReasonChange={setLockReason}
        confirmText={
          confirmType === 'delete'
            ? 'Xóa tài khoản'
            : confirmType === 'lock'
            ? 'Khóa tài khoản'
            : 'Mở khóa'
        }
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

export default AdminUsers;

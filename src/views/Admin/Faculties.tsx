'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { API_Admin } from '../../api/API_Admin';
import type { Faculty, FacultyFormValues } from '../../types';
import ModalCreateFaculty from '../../components/admin/modalCreateFaculty';
import ModalConfirm from '../../components/common/modalConfirm';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import DataTable, { type Column } from '../../components/admin/DataTable';
import { getUserFriendlyError, toArray } from '../../utils/adminData';
import { useAdminUrlState } from '../../utils/adminUrlState';

export const AdminFaculties = () => {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { getPage, getValue, setQuery } = useAdminUrlState({ status: 'all' });

  const [searchTerm, setSearchTerm] = useState(() => getValue('search'));
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState(() => getValue('status', 'all'));
  const [page, setPage] = useState(() => getPage());

  const loadFaculties = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await API_Admin.getFaculties();
      // Ensure the returned data has appropriate defaults for Faculty type
      const normalized: Faculty[] = toArray(data as any).map((f: any) => ({
        id: f.id,
        code: f.code || '',
        name: f.name || '',
        isActive: f.isActive ?? true,
      }));
      setFaculties(normalized);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải danh sách khoa. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculties();
  }, []);

  const filteredFaculties = faculties.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? f.isActive
        : !f.isActive;

    return matchSearch && matchStatus;
  });

  const handleToggleActive = async (id: string) => {
    const faculty = faculties.find((f) => f.id === id);
    if (!faculty || actionLoading) return;

    try {
      setActionLoading(true);
      setErrorMsg('');
      await API_Admin.updateFacultyStatus(id, { isActive: !faculty.isActive });
      await loadFaculties();
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể cập nhật trạng thái khoa. Vui lòng thử lại.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId || actionLoading) return;

    try {
      setActionLoading(true);
      setErrorMsg('');
      await API_Admin.deleteFaculty(pendingDeleteId);
      setConfirmOpen(false);
      setPendingDeleteId(null);
      await loadFaculties();
    } catch (err: any) {
      setErrorMsg(
        getUserFriendlyError(err, 'Không thể xóa khoa này. Khoa có thể đã có ngành học hoặc phân công hội đồng liên kết.')
      );
      setConfirmOpen(false);
      setPendingDeleteId(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenModal = (faculty?: Faculty) => {
    if (faculty) {
      setEditingFaculty(faculty);
    } else {
      setEditingFaculty(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFaculty(null);
  };

  const handleSubmitModal = async (values: FacultyFormValues) => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setErrorMsg('');
      if (editingFaculty) {
        await API_Admin.updateFaculty(editingFaculty.id, values);
      } else {
        await API_Admin.createFaculty(values);
      }
      setShowModal(false);
      setEditingFaculty(null);
      await loadFaculties();
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể lưu thông tin khoa. Vui lòng kiểm tra lại mã khoa.'));
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Faculty>[] = [
    {
      key: 'code',
      label: 'Mã khoa',
      width: '20%',
      render: (val) => <span className="font-mono">{val as string}</span>,
    },
    {
      key: 'name',
      label: 'Tên khoa',
      width: '40%',
      render: (val) => <span className="font-medium">{val as string}</span>,
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
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {val ? 'Hoạt động' : 'Ẩn'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      width: '20%',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="p-2 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Chỉnh sửa"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleToggleActive(row.id)}
            className="p-2 cursor-pointer text-orange-600 hover:bg-orange-50 rounded-lg"
            title={row.isActive ? 'Ẩn khoa' : 'Hiện khoa'}
          >
            {row.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
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

  const filterOptions = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Hoạt động', value: 'active' },
    { label: 'Đang ẩn', value: 'inactive' },
  ];

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    setQuery({ search: value }, { resetPage: true });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    setQuery({ status: value }, { resetPage: true });
  };

  const handlePageChange = (value: number) => {
    setPage(value);
    setQuery({ page: value });
  };

  return (
    <div className="relative flex flex-col px-4 sm:px-6 py-4 sm:py-6 bg-[#F8F9FA] pb-28 sm:pb-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Khoa</h1>
        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          filterValue={statusFilter}
          onFilterChange={handleStatusChange}
          searchPlaceholder="Tên khoa"
          filterOptions={filterOptions}
          filterLabel="Trạng thái"
          variant="inline"
        />
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs sm:text-sm font-semibold">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2.5">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-xs text-gray-500 font-semibold">Đang tải danh sách khoa...</p>
        </div>
      ) : (
        <div className="flex-1 mt-4">
          <DataTable
            columns={columns}
            data={filteredFaculties}
            pageSize={8}
            emptyText="Không tìm thấy khoa nào"
            minHeight={400}
            showSummary={false}
            paginationAlign="left"
            currentPage={page}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-8 right-8 z-20 flex cursor-pointer items-center gap-2 rounded-full bg-[#0B3A82] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#104E92]"
      >
        <Plus size={18} />
        Thêm khoa
      </button>

      <ModalCreateFaculty
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        editData={editingFaculty}
        onImported={loadFaculties}
      />

      <ModalConfirm
        isOpen={confirmOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa khoa ${faculties.find((f) => f.id === pendingDeleteId)?.name}? Dữ liệu đã xóa không thể khôi phục.`}
        targetName={faculties.find((f) => f.id === pendingDeleteId)?.name}
        type="danger"
        confirmText="Xóa ngay"
        cancelText="Hủy bỏ"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
};

export default AdminFaculties;

'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { API_Admin } from '../../api/API_Admin';
import type { Faculty, Major, MajorFormValues } from '../../types';
import ModalCreateMajor from '../../components/admin/modelCreateMajor';
import ModalConfirm from '../../components/common/modalConfirm';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import DataTable, { type Column } from '../../components/admin/DataTable';
import { getUserFriendlyError, toArray } from '../../utils/adminData';
import { useAdminUrlState } from '../../utils/adminUrlState';

export const AdminMajors = () => {
  const [majors, setMajors] = useState<Major[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { getPage, getValue, setQuery } = useAdminUrlState();

  const [searchTerm, setSearchTerm] = useState(() => getValue('search'));
  const [showModal, setShowModal] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [facultyFilter, setFacultyFilter] = useState(() => getValue('facultyId'));
  const [page, setPage] = useState(() => getPage());

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [facs, majs] = await Promise.all([
        API_Admin.getFaculties(),
        API_Admin.getMajors(),
      ]);

      const normalizedFacs: Faculty[] = toArray(facs as any).map((f: any) => ({
        id: f.id,
        code: f.code || '',
        name: f.name || '',
        isActive: f.isActive ?? true,
      }));

      const normalizedMajs: Major[] = toArray(majs as any).map((m: any) => ({
        id: m.id,
        code: m.code || '',
        name: m.name || '',
        facultyId: m.facultyId || m.faculty_id || m.faculty?.id || m.faculty?._id || '',
        isActive: m.isActive ?? true,
      }));

      setFaculties(normalizedFacs);
      setMajors(normalizedMajs);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải danh sách ngành học. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMajors = majors.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFaculty = facultyFilter ? m.facultyId === facultyFilter : true;

    return matchSearch && matchFaculty;
  });

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId || actionLoading) return;

    try {
      setActionLoading(true);
      setErrorMsg('');
      await API_Admin.deleteMajor(pendingDeleteId);
      setConfirmOpen(false);
      setPendingDeleteId(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(
        getUserFriendlyError(err, 'Không thể xóa ngành học này. Ngành có thể đã có lớp học hoặc phân công hội đồng liên kết.')
      );
      setConfirmOpen(false);
      setPendingDeleteId(null);
    } finally {
      setActionLoading(false);
    }
  };

  const getFacultyName = (facultyId: string) => {
    return faculties.find((f) => f.id === facultyId)?.name || '';
  };

  const handleOpenModal = (major?: Major) => {
    if (major) {
      setEditingMajor(major);
    } else {
      setEditingMajor(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMajor(null);
  };

  const handleSubmitModal = async (values: MajorFormValues) => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      setErrorMsg('');
      if (editingMajor) {
        await API_Admin.updateMajor(editingMajor.id, values);
      } else {
        await API_Admin.createMajor(values);
      }
      setShowModal(false);
      setEditingMajor(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể lưu thông tin ngành học. Vui lòng kiểm tra lại mã ngành.'));
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Major>[] = [
    {
      key: 'code',
      label: 'Mã ngành',
      width: '20%',
      render: (val) => <span className="font-mono">{val as string}</span>,
    },
    {
      key: 'name',
      label: 'Tên ngành',
      width: '40%',
      render: (val) => <span className="font-medium">{val as string}</span>,
    },
    {
      key: 'facultyId',
      label: 'Khoa',
      width: '20%',
      render: (val) => <span className="text-gray-600">{getFacultyName(val as string)}</span>,
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

  const facultyFilterOptions = [
    { label: 'Tất cả', value: '' },
    ...faculties
      .filter((f) => f.isActive)
      .map((f) => ({ label: f.name, value: f.id })),
  ];

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
    setQuery({ search: value }, { resetPage: true });
  };

  const handleFacultyChange = (value: string) => {
    setFacultyFilter(value);
    setPage(1);
    setQuery({ facultyId: value }, { resetPage: true });
  };

  const handlePageChange = (value: number) => {
    setPage(value);
    setQuery({ page: value });
  };

  return (
    <div className="relative flex flex-col px-4 sm:px-6 py-4 sm:py-6 bg-[#F8F9FA] pb-28 sm:pb-6">
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Ngành học</h1>
        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          filterValue={facultyFilter}
          onFilterChange={handleFacultyChange}
          searchPlaceholder="Tên ngành"
          filterOptions={facultyFilterOptions}
          filterLabel="Khoa"
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
          <p className="text-xs text-gray-500 font-semibold">Đang tải danh sách ngành học...</p>
        </div>
      ) : (
        <div className="flex-1 mt-4">
          <DataTable
            columns={columns}
            data={filteredMajors}
            pageSize={8}
            emptyText="Không tìm thấy ngành học nào"
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
        Thêm ngành
      </button>

      <ModalCreateMajor
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        editData={editingMajor}
        faculties={faculties}
        onImported={loadData}
      />

      <ModalConfirm
        isOpen={confirmOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa ngành học ${majors.find((m) => m.id === pendingDeleteId)?.name}? Tất cả các lớp thuộc ngành học này cũng có thể bị ảnh hưởng.`}
        targetName={majors.find((m) => m.id === pendingDeleteId)?.name}
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

export default AdminMajors;

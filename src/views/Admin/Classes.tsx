'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { API_Admin } from '../../api/API_Admin';
import type { Class, ClassFormValues, Faculty, Major, ClassTableRow } from '../../types';
import ModalCreateClass from '../../components/admin/modalCreateClass';
import ModalConfirm from '../../components/common/modalConfirm';
import SearchFilterBar from '../../components/admin/SearchFilterBar';
import DataTable, { type Column } from '../../components/admin/DataTable';
import { getUserFriendlyError, toArray } from '../../utils/adminData';
import { AdminClassList } from './ClassList';
import { useAdminUrlState } from '../../utils/adminUrlState';

export const AdminClasses = () => {
  const [classes, setClasses] = useState<ClassTableRow[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const { getPage, getValue, setQuery } = useAdminUrlState();

  const [searchTerm, setSearchTerm] = useState(() => getValue('search'));
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [facultyFilter, setFacultyFilter] = useState(() => getValue('facultyId'));
  const [majorFilter, setMajorFilter] = useState(() => getValue('majorId'));
  const [page, setPage] = useState(() => getPage());

  const [viewingClassId, setViewingClassId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [facs, majs, clss] = await Promise.all([
        API_Admin.getFaculties(),
        API_Admin.getMajors(),
        API_Admin.getClasses(),
      ]);

      const normalizedFaculties = toArray(facs as any).map((f: any) => ({
        id: f.id || f._id || '',
        code: f.code || '',
        name: f.name || '',
        isActive: f.isActive ?? true,
      }));

      const normalizedMajors = toArray(majs as any).map((m: any) => ({
        id: m.id || m._id || '',
        code: m.code || '',
        name: m.name || '',
        facultyId: m.facultyId || m.faculty_id || m.faculty?.id || m.faculty?._id || '',
        isActive: m.isActive ?? true,
      }));

      const normalizedClasses = toArray(clss as any).map((c: any) => {
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
          normalizedMajors.find((m) => m.id === majorId)?.facultyId ||
          '';
        const majorName = c.major?.name || normalizedMajors.find((m) => m.id === majorId)?.name || '—';
        const facultyName =
          c.major?.faculty?.name ||
          c.faculty?.name ||
          normalizedFaculties.find((f) => f.id === facultyId)?.name ||
          '—';

        return {
          id: c.id || c._id || '',
          code: c.code || '',
          name: c.name || '',
          facultyId,
          majorId,
          major: c.major,
          majorName,
          facultyName,
          enrollmentYear: c.enrollmentYear,
          isActive: c.isActive ?? true,
        };
      });

      setFaculties(normalizedFaculties);
      setMajors(normalizedMajors);
      setClasses(normalizedClasses);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải thông tin lớp học. Vui lòng thử lại sau.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClasses = classes.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFaculty = facultyFilter ? c.facultyId === facultyFilter : true;
    const matchMajor = majorFilter ? c.majorId === majorFilter : true;

    return matchSearch && matchFaculty && matchMajor;
  });

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setErrorMsg('Chưa có API xóa lớp học.');
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  const handleOpenEdit = (cls: Class) => {
    setEditingClass(cls);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
  };

  const handleSubmitModal = (_values: ClassFormValues) => {
    setErrorMsg('Chưa có API tạo/cập nhật lớp học.');
  };

  const columns: Column<ClassTableRow>[] = [
    {
      key: 'code',
      label: 'Mã lớp',
      width: '15%',
      render: (val) => <span className="font-mono text-sm text-[#3B5BDB]">{val as string}</span>,
    },
    {
      key: 'name',
      label: 'Tên lớp',
      width: '25%',
      render: (val) => <span className="font-medium">{val as string}</span>,
    },
    {
      key: 'majorName',
      label: 'Ngành',
      width: '20%',
      render: (val) => <span className="text-gray-600">{val as string}</span>,
    },
    {
      key: 'facultyName',
      label: 'Khoa',
      width: '20%',
      render: (val) => <span className="text-gray-600">{val as string}</span>,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      width: '20%',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleOpenEdit(row);
            }}
            className="p-2 cursor-pointer text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Chỉnh sửa"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleDelete(row.id);
            }}
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
    setMajorFilter('');
    setPage(1);
    setQuery({ facultyId: value, majorId: null }, { resetPage: true });
  };

  const handleMajorChange = (value: string) => {
    setMajorFilter(value);
    setPage(1);
    setQuery({ majorId: value }, { resetPage: true });
  };

  const handlePageChange = (value: number) => {
    setPage(value);
    setQuery({ page: value });
  };

  if (viewingClassId) {
    return (
      <AdminClassList
        preSelectedClassId={viewingClassId}
        onBack={() => setViewingClassId(null)}
      />
    );
  }

  return (
    <div className="relative flex flex-col px-4 sm:px-6 py-4 sm:py-6 bg-[#F8F9FA] pb-28 sm:pb-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản lý Lớp</h1>
        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          filterValue={facultyFilter}
          onFilterChange={handleFacultyChange}
          searchPlaceholder="Tên lớp..."
          filterOptions={facultyFilterOptions}
          filterLabel="Khoa"
          variant="inline"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Ngành:</span>
            <div className="relative shrink-0">
              <select
                value={majorFilter}
                onChange={(e) => handleMajorChange(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!facultyFilter}
              >
                <option value="">Tất cả</option>
                {majors
                  .filter((m) => m.isActive && (!facultyFilter || m.facultyId === facultyFilter))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
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

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-2.5">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-xs text-gray-500 font-semibold">Đang tải danh sách lớp học...</p>
        </div>
      ) : (
        <>
          <div className="flex-1 mt-4">
            <DataTable
              columns={columns}
              data={filteredClasses}
              pageSize={8}
              emptyText="Không tìm thấy lớp nào"
              minHeight={400}
              showSummary={false}
              paginationAlign="left"
              currentPage={page}
              onPageChange={handlePageChange}
              onRowClick={(row) => setViewingClassId(row.id)}
            />
          </div>
        </>
      )}

      <button
        onClick={() => { setEditingClass(null); setShowModal(true); }}
        className="fixed bottom-8 right-8 z-20 flex cursor-pointer items-center gap-2 rounded-full bg-[#0B3A82] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#104E92]"
      >
        <Plus size={18} />
        Thêm lớp
      </button>

      <ModalCreateClass
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitModal}
        editData={editingClass}
        faculties={faculties}
        majors={majors}
      />

      <ModalConfirm
        isOpen={confirmOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa lớp học ${classes.find((c) => c.id === pendingDeleteId)?.name}? Tất cả dữ liệu của lớp bao gồm cả sinh viên sẽ bị mất.`}
        targetName={classes.find((c) => c.id === pendingDeleteId)?.name}
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

export default AdminClasses;

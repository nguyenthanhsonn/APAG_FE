'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Edit2,
  FolderOpen,
  GraduationCap,
  Hash,
  Loader2,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { API_Admin } from '../../api/API_Admin';
import { getUserFriendlyError, toArray } from '../../utils/adminData';
import type { Class, ClassListStudentItem } from '../../types';

// Custom Card Component
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
    {children}
  </div>
);

// Custom Badge Component
const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'success' | 'secondary' | 'default' }) => {
  const styles =
    variant === 'success'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles}`}>
      {children}
    </span>
  );
};

// Reusable StudentTable Component
interface StudentTableProps {
  students: ClassListStudentItem[];
  loading: boolean;
  onEdit: (student: ClassListStudentItem) => void;
  onDelete: (student: ClassListStudentItem) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
}

export const StudentTable = ({
  students,
  loading,
  onEdit,
  onDelete,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
}: StudentTableProps) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Handle local state for debouncing
  const [tempSearch, setTempSearch] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(tempSearch);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [tempSearch, setSearchTerm]);

  // Filter students based on search and status
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? s.isActive
          : !s.isActive;
      return matchSearch && matchStatus;
    });
  }, [students, searchTerm, statusFilter]);

  // Pagination calculations
  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = Math.min(currentPage * itemsPerPage, totalItems);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-[#4B6BFB]" size={32} />
        <p className="text-sm text-gray-500 font-medium">Đang tải danh sách sinh viên...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã sinh viên..."
            value={tempSearch}
            onChange={(e) => setTempSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-800 outline-none focus:border-[#4B6BFB] focus:ring-2 focus:ring-[#4B6BFB]/20 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#4B6BFB] focus:ring-2 focus:ring-[#4B6BFB]/20 transition"
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Users className="text-gray-300 mb-3" size={48} />
          <p className="text-sm font-semibold text-gray-600">Không tìm thấy sinh viên nào</p>
          <p className="text-xs text-gray-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Mã sinh viên</th>
                  <th className="px-6 py-4">Họ và tên</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedStudents.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/admin/students/${s.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-[#4B6BFB] hover:underline">
                        {s.studentCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{s.fullName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.email || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      {s.phoneNumber ? (
                        <span className="text-gray-700">{s.phoneNumber}</span>
                      ) : (
                        <span className="text-gray-400 italic">Chưa cập nhật</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {s.isClassLeader ? (
                        <span className="inline-flex items-center gap-1 rounded bg-[#EBF4FF] px-2 py-1 text-xs font-bold text-[#1E40AF]">
                          Lớp trưởng
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Sinh viên</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(s)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          aria-label={`Sửa thông tin sinh viên ${s.fullName}`}
                          title="Sửa thông tin"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(s)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          aria-label={`Xóa sinh viên ${s.fullName}`}
                          title="Xóa sinh viên"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (< 640px) */}
          <div className="block sm:hidden space-y-3">
            {paginatedStudents.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/admin/students/${s.id}`)}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm active:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                  <span className="font-mono text-sm font-bold text-[#4B6BFB]">{s.studentCode}</span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onEdit(s)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      aria-label={`Sửa sinh viên ${s.fullName}`}
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      aria-label={`Xóa sinh viên ${s.fullName}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Họ và tên:</span>
                    <span className="font-semibold text-gray-900">{s.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-gray-700">{s.email || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số điện thoại:</span>
                    <span>
                      {s.phoneNumber ? (
                        <span className="text-gray-700">{s.phoneNumber}</span>
                      ) : (
                        <span className="text-gray-400 italic">Chưa cập nhật</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Vai trò:</span>
                    {s.isClassLeader ? (
                      <span className="inline-flex items-center gap-1 rounded bg-[#EBF4FF] px-2 py-0.5 text-xs font-bold text-[#1E40AF]">
                        Lớp trưởng
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Sinh viên</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2">
            <p className="text-sm text-gray-500 font-medium">
              Hiển thị <span className="font-bold text-gray-700">{rangeStart}-{rangeEnd}</span> trong tổng số{' '}
              <span className="font-bold text-gray-700">{totalItems}</span> sinh viên
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 rounded px-2.5 text-sm font-semibold border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 transition"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`h-8 w-8 rounded text-sm font-bold transition ${
                      currentPage === idx + 1
                        ? 'bg-[#0B3A82] text-white'
                        : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 rounded px-2.5 text-sm font-semibold border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 transition"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Main Reusable Page View
export default function ClassDetailPage({ classId }: { classId: string }) {
  const router = useRouter();
  const [classDetail, setClassDetail] = useState<Class | null>(null);
  const [students, setStudents] = useState<ClassListStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadData = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setErrorMsg('');

      // Fetch class details and students
      const [classRes, studentsRes] = await Promise.all([
        API_Admin.getClassById(classId),
        API_Admin.getClassStudents(classId, { page: 1, limit: 100 }),
      ]);

      setClassDetail(classRes as any);

      const normalizedStudents: ClassListStudentItem[] = toArray(studentsRes as any).map((s: any) => ({
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
      setStudents(normalizedStudents);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể tải chi tiết lớp học. Vui lòng quay lại thử lại.'));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEdit = (student: ClassListStudentItem) => {
    // Router push to student edit page or modal (depending on workflow)
    router.push(`/admin/students/${student.id}`);
  };

  const handleDelete = async (student: ClassListStudentItem) => {
    // Standard alert placeholder as request details asked for no code update on operations without API
    if (confirm(`Bạn có chắc muốn xóa sinh viên ${student.fullName} khỏi lớp này không?`)) {
      try {
        await API_Admin.deleteStudent(student.id);
        setStudents((prev) => prev.filter((s) => s.id !== student.id));
      } catch (err: any) {
        alert(getUserFriendlyError(err, 'Không thể xóa sinh viên. Vui lòng thử lại sau.'));
      }
    }
  };

  const displayedClassLeaders = classDetail?.classLeaders || [];

  return (
    <div className="relative flex flex-col px-4 sm:px-6 py-6 bg-[#F8F9FA] pb-24">
      {/* Breadcrumb & Navigation */}
      <div className="mb-6 flex flex-col gap-2">
        <Link
          href="/admin/classes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft size={16} /> Quay lại quản lý lớp
        </Link>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Lớp {classDetail?.name || '...'}
          </h1>
          {classDetail && (
            <Badge variant={classDetail.isActive ? 'success' : 'secondary'}>
              {classDetail.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
            </Badge>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Class Info Block - Refactored Card Grid */}
      <div className="mb-8">
        <Card className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#EBF4FF] text-[#1E40AF] shrink-0">
              <Hash size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Mã Lớp</p>
              <p className="mt-0.5 text-sm font-bold text-gray-800">{classDetail?.code || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700 shrink-0">
              <FolderOpen size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Tên Lớp</p>
              <p className="mt-0.5 text-sm font-bold text-gray-800">{classDetail?.name || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 shrink-0">
              <GraduationCap size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Ngành Học</p>
              <p className="mt-0.5 text-sm font-bold text-gray-800">{classDetail?.major?.name || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Khoa</p>
              <p className="mt-0.5 text-sm font-bold text-gray-800">
                {classDetail?.faculty?.name || classDetail?.major?.faculty?.name || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
              <CalendarDays size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Năm Nhập Học</p>
              <p className="mt-0.5 text-sm font-bold text-gray-800">{classDetail?.enrollmentYear || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-pink-50 text-pink-700 shrink-0">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Tổng Số Sinh Viên</p>
              <p className="mt-0.5 text-sm font-bold text-gray-800">
                {students.length} sinh viên
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700 shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-gray-400">Lớp Trưởng</p>
              <p className="mt-0.5 text-sm font-bold text-gray-800 truncate">
                {displayedClassLeaders.length > 0
                  ? displayedClassLeaders.map((item) => item.fullName || item.username).join(', ')
                  : '—'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 shrink-0">
              <Shield size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-gray-400">Cố vấn học tập</p>
              <p className="mt-0.5 text-sm font-bold text-gray-800 truncate">
                {classDetail?.advisors && classDetail.advisors.length > 0
                  ? classDetail.advisors.map((item) => item.fullName || item.username).join(', ')
                  : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Student List Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Danh sách sinh viên</h2>
        <Card>
          <StudentTable
            students={students}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </Card>
      </div>
    </div>
  );
}

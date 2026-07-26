'use client';

import { useState, useEffect } from 'react';
import { Users, GraduationCap, Building2, School, UserCog, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { API_Admin } from '../../api/API_Admin';
import { AdminStatsGrid } from '../../components/admin/AdminStatsGrid';
import { AdminFacultyStatsCard } from '../../components/admin/AdminFacultyStatsCard';

const toArray = <T,>(value: any): T[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.items)) return value.data.items;
  return [];
};

const formatNumber = (value: unknown) => Number(value ?? 0).toLocaleString('vi-VN');

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    totalFaculties: 0,
    totalMajors: 0,
    totalClasses: 0,
  });
  const [facultyStats, setFacultyStats] = useState<{ name: string; students: number }[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const [usersRes, studentsRes, facsRes, majsRes, clssRes] = await Promise.all([
          API_Admin.getUsers({ page: 1, limit: 100, includeDeleted: false }),
          API_Admin.getStudents({ page: 1, limit: 100, includeDeleted: false }),
          API_Admin.getFaculties(),
          API_Admin.getMajors(),
          API_Admin.getClasses(),
        ]);

        const usersList = toArray<any>(usersRes);
        const studentsList = toArray<any>(studentsRes);
        const userTotal = typeof (usersRes as any)?.total === 'number' ? (usersRes as any).total : usersList.length;
        const studentTotal = typeof (studentsRes as any)?.total === 'number' ? (studentsRes as any).total : studentsList.length;

        const facs = toArray<any>(facsRes);
        const majs = toArray<any>(majsRes);
        const clss = toArray<any>(clssRes);

        setStatsData({
          totalUsers: userTotal + studentTotal,
          totalStudents: studentTotal,
          totalAdmins: userTotal,
          totalFaculties: facs.length,
          totalMajors: majs.length,
          totalClasses: clss.length,
        });

        // Compute faculty stats
        const computedFacs = facs.map((f: any) => {
          // Count students of this faculty
          const stdCount = studentsList.filter((s: any) => s.facultyId === f.id).length;
          return {
            name: f.name || f.code,
            students: stdCount,
          };
        });
        setFacultyStats(computedFacs);
      } catch (err: any) {
        setErrorMsg(err.message || 'Không thể tải dữ liệu dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      icon: Users,
      label: 'Tổng số tài khoản',
      value: formatNumber(statsData.totalUsers),
      borderColor: 'border-t-[#3B5BDB]',
      iconBg: 'bg-[#EDF2FF]',
      iconColor: 'text-[#3B5BDB]',
      sub: 'Toàn hệ thống',
    },
    {
      icon: GraduationCap,
      label: 'Sinh viên',
      value: formatNumber(statsData.totalStudents),
      borderColor: 'border-t-[#2F9E44]',
      iconBg: 'bg-[#EBFBEE]',
      iconColor: 'text-[#2F9E44]',
      sub: 'Đang theo học',
    },
    {
      icon: UserCog,
      label: 'Quản trị viên',
      value: formatNumber(statsData.totalAdmins),
      borderColor: 'border-t-[#6741D9]',
      iconBg: 'bg-[#F3F0FF]',
      iconColor: 'text-[#6741D9]',
      sub: 'Tài khoản admin',
    },
    {
      icon: Building2,
      label: 'Khoa',
      value: formatNumber(statsData.totalFaculties),
      borderColor: 'border-t-[#E67700]',
      iconBg: 'bg-[#FFF9DB]',
      iconColor: 'text-[#E67700]',
      sub: 'Đang hoạt động',
    },
    {
      icon: BookOpen,
      label: 'Ngành học',
      value: formatNumber(statsData.totalMajors),
      borderColor: 'border-t-[#F06595]',
      iconBg: 'bg-[#FFF0F6]',
      iconColor: 'text-[#D6336C]',
      sub: 'Chuyên ngành',
    },
    {
      icon: School,
      label: 'Lớp',
      value: formatNumber(statsData.totalClasses),
      borderColor: 'border-t-[#20C997]',
      iconBg: 'bg-[#E6FCF5]',
      iconColor: 'text-[#0CA678]',
      sub: 'Lớp học phần',
    },
  ];

  const today = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const totalFacultyStudents = facultyStats.reduce((sum, item) => sum + item.students, 0);
  const maxStudents = facultyStats.length > 0 ? Math.max(...facultyStats.map((f) => f.students)) : 0;



  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 w-full p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="ui-page-title">Dashboard</h1>
          <p className="mt-1 text-sm capitalize text-[#868E96]">{today}</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-xs sm:text-sm font-semibold">
          <AlertCircle size={18} className="shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-2.5 bg-white border rounded-xl p-6 shadow-sm">
          <Loader2 className="animate-spin text-blue-600" size={36} />
          <p className="text-xs text-gray-500 font-semibold">Đang tải số liệu hệ thống...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <AdminStatsGrid stats={stats} />

          {/* Row 2: Faculty stats + Activity feed */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Faculty stats */}
            <AdminFacultyStatsCard
              facultyStats={facultyStats}
              totalFacultyStudents={totalFacultyStudents}
              maxStudents={maxStudents}
            />

          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

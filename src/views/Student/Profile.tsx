import { useState, useEffect } from 'react';
import { Save, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { Class, Faculty, Major, Student, ProfileUser } from '../../types';
import { API_Student } from '../../api/API_Student';
import { CustomSelect } from '../../components/common/CustomSelect';
import { useToast } from '../../components/common/ToastProvider';
import { getUserFriendlyError } from '../../utils/errorHelper';

export const StudentProfile = () => {
  const user = useAuthStore((state) => state.user) as ProfileUser | null;
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const isStudent = user?.role === 'student';
  const managedClasses = user?.managedClasses ?? [];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate years for dropdowns
  const currentYear = new Date().getFullYear();
  const admissionYears = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());
  const academicYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return `${year}-${year + 1}`;
  });
  
  // Form state - Thông tin sinh viên
  const [admissionYear, setAdmissionYear] = useState('2021');
  const [facultyId, setFacultyId] = useState('');
  const [majorId, setMajorId] = useState('');
  const [classId, setClassId] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [facultiesList, setFacultiesList] = useState<Faculty[]>([]);
  const [majorsList, setMajorsList] = useState<Major[]>([]);
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState('');

  // Sync state once user is available on the client
  useEffect(() => {
    if (user) {
      const userAdmissionYear = user.class?.enrollmentYear || user.admissionYear;
      if (userAdmissionYear) {
        setAdmissionYear(userAdmissionYear.toString());
      }
      
      setStudentCode(user.studentCode || '');
      setFullName(user.fullName || '');
      
      if (user.dateOfBirth) {
        const dobStr = user.dateOfBirth.includes('T') 
          ? user.dateOfBirth.split('T')[0] 
          : user.dateOfBirth;
        setDateOfBirth(dobStr);
      }
      
      setPhoneNumber(user.phone || user.phoneNumber || '');
      
      if (user.class?.id) {
        setClassId(user.class.id);
      }
      if (user.major && typeof user.major === 'object' && 'id' in user.major) {
        setMajorId(user.major.id);
      }
      if (user.faculty && typeof user.faculty === 'object' && 'id' in user.faculty) {
        setFacultyId(user.faculty.id);
      }
    }
  }, [user]);
  
  // Kỳ đánh giá
  const [semester, setSemester] = useState<'HK1' | 'HK2'>('HK1');
  const [academicYear, setAcademicYear] = useState(academicYears[0]);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadFaculties = async () => {
      if (!isStudent) {
        setFacultiesList([]);
        setMetadataError('');
        return;
      }

      try {
        setMetadataLoading(true);
        setMetadataError('');
        const data = await API_Student.getFaculties();
        setFacultiesList(data || []);
      } catch (err: any) {
        setMetadataError(getUserFriendlyError(err, 'Không thể tải danh mục khoa.'));
      } finally {
        setMetadataLoading(false);
      }
    };

    loadFaculties();
  }, [isStudent]);

  useEffect(() => {
    const loadMajors = async () => {
      if (!isStudent || !facultyId) {
        setMajorsList([]);
        return;
      }

      try {
        setMetadataError('');
        const data = await API_Student.getMajors(facultyId);
        setMajorsList(data || []);
        if (data?.length && !data.some((major) => major.id === majorId)) {
          setMajorId(data[0].id);
        }
      } catch (err: any) {
        setMetadataError(getUserFriendlyError(err, 'Không thể tải danh mục ngành.'));
      }
    };

    loadMajors();
  }, [facultyId, isStudent, majorId]);

  useEffect(() => {
    const loadClasses = async () => {
      if (!isStudent || !majorId) {
        setClassesList([]);
        return;
      }

      try {
        setMetadataError('');
        const data = await API_Student.getClasses(majorId);
        setClassesList(data || []);
        if (data?.length && !data.some((classItem) => classItem.id === classId)) {
          setClassId(data[0].id);
        }
      } catch (err: any) {
        setMetadataError(getUserFriendlyError(err, 'Không thể tải danh mục lớp.'));
      }
    };

    loadClasses();
  }, [classId, isStudent, majorId]);

  useEffect(() => {
    if (!isStudent) return;
    if (facultyId && majorsList.length > 0 && !majorsList.some(m => m.id === majorId)) {
      setMajorId(majorsList[0].id);
    }
  }, [facultyId, isStudent, majorsList, majorId]);

  useEffect(() => {
    if (!isStudent) return;
    if (majorId && classesList.length > 0 && !classesList.some(c => c.id === classId)) {
      setClassId(classesList[0].id);
    }
  }, [majorId, isStudent, classesList, classId]);

  const handleSave = async () => {
    setSaved(false);
    setErrorMsg('');

    try {
      await updateProfile({
        phone: phoneNumber.trim() || null,
      } as Partial<Student>);
      await refreshProfile();
      setSaved(true);
      toast.success('Đã lưu thông tin thành công');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setErrorMsg(getUserFriendlyError(err, 'Không thể cập nhật thông tin liên hệ.'));
    }
  };

  if (!mounted) {
    return <div className="p-5 text-gray-500 bg-white rounded-xl shadow-sm border">Đang tải thông tin...</div>;
  }

  return (
    <div className="p-4 sm:p-5 max-w-6xl mx-auto w-full">
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isStudent ? 'Thông tin cá nhân & Kỳ đánh giá' : 'Thông tin cá nhân'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isStudent
              ? 'Cập nhật hồ sơ sinh viên và kiểm tra thông tin kỳ đánh giá hiện tại.'
              : 'Cập nhật hồ sơ cá nhân và xem thông tin lớp phụ trách.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        
        {/* Left Side: Forms container (spans 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          
          <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3">
            <h2 className="text-sm font-bold text-gray-900">
              {isStudent ? 'Thông tin sinh viên' : 'Thông tin cá nhân'}
            </h2>
          </div>

          <div className="flex flex-col">
              <div className="p-5 space-y-4 flex-1">
                {isStudent && metadataLoading && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                    Đang tải danh mục...
                  </div>
                )}
                {isStudent && metadataError && (
                  <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {metadataError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                  
                  {/* Field: Năm trúng tuyển */}
                  {isStudent && (
                    <CustomSelect
                      value={admissionYear}
	                      onChange={() => undefined}
	                      options={admissionYears.map(year => ({ id: year, name: year }))}
	                      label="Năm trúng tuyển"
	                      disabled
	                    />
                  )}

                  {/* Field: Khoa */}
                  {isStudent && (
                    <CustomSelect
                      value={facultyId}
	                      onChange={() => undefined}
	                      options={facultiesList}
	                      label="Khoa"
	                      disabled
	                    />
                  )}

                  {/* Field: Ngành */}
                  {isStudent && (
                    <CustomSelect
                      value={majorId}
	                      onChange={() => undefined}
	                      options={majorsList}
	                      label="Ngành/chuyên ngành"
	                      disabled
	                    />
                  )}

                  {/* Field: Lớp */}
                  {isStudent && (
                    <CustomSelect
                      value={classId}
	                      onChange={() => undefined}
	                      options={classesList}
	                      label="Lớp học"
	                      disabled
	                    />
                  )}

                  {/* Field: Mã sinh viên */}
                  {isStudent && (
                    <div>
	                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
	                        Mã sinh viên
	                      </label>
                      <input
                        type="text"
                        value={studentCode}
                        readOnly
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg outline-none h-10 bg-gray-100 text-gray-500 cursor-not-allowed"
                        placeholder="Nhập mã sinh viên"
                      />
                    </div>
                  )}

                  {/* Field: Họ và tên */}
                  <div>
	                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
	                      Họ và tên
	                    </label>
                    <input
                      type="text"
                      value={fullName}
                      readOnly
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg outline-none h-10 bg-gray-100 text-gray-500 cursor-not-allowed"
                      placeholder="Họ và tên"
                    />
                  </div>

                  {/* Field: Ngày sinh */}
                  <div>
	                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
	                      Ngày sinh
	                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      readOnly
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-200 rounded-lg outline-none h-10 bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Field: Số điện thoại */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-10 bg-white"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  {saved && (
                    <p className="text-green-600 text-xs sm:text-sm font-semibold flex items-center gap-1.5 animate-fade-in">
                      <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-ping"></span>
                      Lưu thông tin thành công!
                    </p>
                  )}
                  {errorMsg && (
                    <p className="text-red-600 text-xs sm:text-sm font-semibold flex items-center gap-1.5 animate-fade-in">
                      {errorMsg}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer min-h-[40px] shadow-sm shrink-0"
                >
                  <Save size={18} />
                  Lưu thông tin
                </button>
              </div>
            </div>

        </div>

        {/* Right Side: Context card */}
        <div className="space-y-5">
          
          {/* Card: Kỳ đánh giá */}
          {isStudent ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Kỳ đánh giá hiện tại
              </h2>

              <div className="space-y-4">
                
                {/* Field: Học kỳ */}
                <CustomSelect
                  value={semester}
                  onChange={(val) => setSemester(val as 'HK1' | 'HK2')}
                  options={[
                    { id: 'HK1', name: 'Học kỳ I' },
                    { id: 'HK2', name: 'Học kỳ II' }
                  ]}
                  label="Học kỳ"
                  required
                />

                {/* Field: Năm học */}
                <CustomSelect
                  value={academicYear}
                  onChange={(val) => setAcademicYear(val)}
                  options={academicYears.map(year => ({ id: year, name: year }))}
                  label="Năm học"
                  required
                />

                <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl space-y-2">
                  <div className="flex justify-between text-[11px] sm:text-xs">
                    <span className="text-gray-500">Kỳ học:</span>
                    <span className="font-bold text-blue-900">{semester === 'HK1' ? 'Học kỳ I' : 'Học kỳ II'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs">
                    <span className="text-gray-500">Năm học:</span>
                    <span className="font-bold text-blue-900">{academicYear}</span>
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs">
                    <span className="text-gray-500">Trạng thái:</span>
                    <span className="font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Chưa nộp</span>
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs border-t border-blue-100/50 pt-2">
                    <span className="text-gray-500">Hạn nộp:</span>
                    <span className="font-semibold text-red-600">31/12/{academicYear.split('-')[0]}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Lớp phụ trách
              </h2>

              {managedClasses.length > 0 ? (
                <div className="space-y-3">
                  {managedClasses.map((item) => (
                    <div
                      key={item.classId ?? item.classCode ?? item.className}
                      className="rounded-xl border border-blue-100 bg-blue-50/70 p-3"
                    >
                      <p className="text-sm font-bold text-gray-900">{item.className || item.classCode || 'Lớp phụ trách'}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-600">{item.classCode || 'Chưa có mã lớp'}</p>
                      <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between gap-3">
                          <span>Ngành</span>
                          <span className="text-right font-semibold text-gray-800">{item.major?.name || '—'}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Khoa</span>
                          <span className="text-right font-semibold text-gray-800">{item.faculty?.name || '—'}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Sinh viên</span>
                          <span className="font-semibold text-gray-800">{item.studentCount ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-semibold text-gray-600">
                  Tài khoản này chưa được phân công lớp phụ trách.
                </p>
              )}
            </div>
          )}



        </div>
      </div>
    </div>
  );
};

export default StudentProfile;

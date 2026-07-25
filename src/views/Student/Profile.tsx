import { useState, useEffect } from 'react';
import { Save, Calendar, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { Class, Faculty, Major, Student, ProfileUser } from '../../types';
import { API_Student } from '../../api/API_Student';
import { API_Auth } from '../../api/API_Auth';
import { CustomSelect } from '../../components/common/CustomSelect';

export const StudentProfile = () => {
  const user = useAuthStore((state) => state.user) as ProfileUser | null;
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const isStudent = user?.role === 'student';
  const managedClasses = user?.managedClasses ?? [];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen to hash changes in URL to activate corresponding tab
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#change-password') {
        setActiveTab('password');
      } else {
        setActiveTab('profile');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
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
  const [facultyId, setFacultyId] = useState('1');
  const [majorId, setMajorId] = useState('1');
  const [classId, setClassId] = useState('1');
  const [studentCode, setStudentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [facultiesList, setFacultiesList] = useState<Faculty[]>([]);
  const [majorsList, setMajorsList] = useState<Major[]>([]);
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState('');

  // Form state - Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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
        if (data?.length && !data.some((faculty) => faculty.id === facultyId)) {
          setFacultyId(data[0].id);
        }
      } catch (err: any) {
        setMetadataError(err.message || 'Không thể tải danh mục khoa.');
      } finally {
        setMetadataLoading(false);
      }
    };

    loadFaculties();
  }, [facultyId, isStudent]);

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
        setMetadataError(err.message || 'Không thể tải danh mục ngành.');
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
        setMetadataError(err.message || 'Không thể tải danh mục lớp.');
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
    if (!fullName.trim()) {
      setErrorMsg('Họ và tên không được để trống.');
      return;
    }

    try {
      await updateProfile({
        fullName: fullName.trim(),
        phone: phoneNumber.trim() || null,
        dateOfBirth: dateOfBirth || null,
      } as Partial<Student>);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi cập nhật thông tin liên hệ');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!newPassword) {
      setPasswordError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setPasswordLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setPasswordError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      await API_Auth.changePassword(accessToken, currentPassword, newPassword);
      setPasswordSuccess('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        logout();
      }, 1200);
    } catch (err: any) {
      setPasswordError(err.message || 'Đã xảy ra lỗi khi đổi mật khẩu.');
    } finally {
      setPasswordLoading(false);
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
              : 'Cập nhật hồ sơ cá nhân và đổi mật khẩu tài khoản.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        
        {/* Left Side: Forms container (spans 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 bg-gray-50/50 px-5 pt-3">
            <button
              type="button"
              onClick={() => { setActiveTab('profile'); window.location.hash = ''; }}
              className={`border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {isStudent ? 'Thông tin sinh viên' : 'Thông tin cá nhân'}
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('password'); window.location.hash = '#change-password'; }}
              className={`border-b-2 px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                activeTab === 'password'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Đổi mật khẩu
            </button>
          </div>

          {/* Tab Content: Profile */}
          {activeTab === 'profile' && (
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
                      onChange={(val) => setAdmissionYear(val)}
                      options={admissionYears.map(year => ({ id: year, name: year }))}
                      label="Năm trúng tuyển"
                      required
                    />
                  )}

                  {/* Field: Khoa */}
                  {isStudent && (
                    <CustomSelect
                      value={facultyId}
                      onChange={(val) => setFacultyId(val)}
                      options={facultiesList}
                      label="Khoa"
                      required
                    />
                  )}

                  {/* Field: Ngành */}
                  {isStudent && (
                    <CustomSelect
                      value={majorId}
                      onChange={(val) => setMajorId(val)}
                      options={majorsList}
                      label="Ngành/chuyên ngành"
                      required
                    />
                  )}

                  {/* Field: Lớp */}
                  {isStudent && (
                    <CustomSelect
                      value={classId}
                      onChange={(val) => setClassId(val)}
                      options={classesList}
                      label="Lớp học"
                      required
                    />
                  )}

                  {/* Field: Mã sinh viên */}
                  {isStudent && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                        Mã sinh viên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-10 bg-white"
                        placeholder="Nhập mã sinh viên"
                      />
                    </div>
                  )}

                  {/* Field: Họ và tên */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-10 bg-white"
                      placeholder="Họ và tên"
                    />
                  </div>

                  {/* Field: Ngày sinh */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-10 bg-white"
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
          )}

          {/* Tab Content: Change Password */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="flex flex-col">
              <div className="p-5 space-y-4 flex-1">
                
                {/* Success Notification */}
                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
                    <CheckCircle size={16} className="shrink-0 text-emerald-600" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {/* Error Notification */}
                {passwordError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-semibold">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Field: Current Password */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Mật khẩu hiện tại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={passwordLoading}
                        placeholder="Mật khẩu hiện tại"
                        className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5BDB] outline-none h-10 bg-white transition duration-150"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        disabled={passwordLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-0.5 cursor-pointer"
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Field: New Password */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Mật khẩu mới <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={passwordLoading}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5BDB] outline-none h-10 bg-white transition duration-150"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        disabled={passwordLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-0.5 cursor-pointer"
                      >
                        {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Field: Confirm Password */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                      Xác nhận mật khẩu <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={passwordLoading}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full pl-3 pr-9 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5BDB] outline-none h-10 bg-white transition duration-150"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        disabled={passwordLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-0.5 cursor-pointer"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-blue-700 transition cursor-pointer min-h-[40px] min-w-[140px] shadow-sm disabled:opacity-50"
                >
                  {passwordLoading && <Loader2 size={18} className="animate-spin" />}
                  <span>{passwordLoading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}</span>
                </button>
              </div>
            </form>
          )}

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

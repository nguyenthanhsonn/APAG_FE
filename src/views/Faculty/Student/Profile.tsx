import { useState, useEffect } from "react";
import { Save, Calendar, Users } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";
import type { Student, ProfileUser } from "../../../types";
import { resolveProfileAcademicContext } from "../../../utils/profileAcademicContext";
import { CustomSelect } from "../../../components/common/CustomSelect";
import { useToast } from "../../../components/common/ToastProvider";
import { getUserFriendlyError } from "../../../utils/errorHelper";

export const StudentProfile = () => {
  const user = useAuthStore((state) => state.user) as ProfileUser | null;
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const isStudent = user?.role === "student" || user?.role === "class_leader";
  const isFaculty = user?.role === "faculty";
  const isProfileReadOnly = user?.role === "class_leader";
  const managedClasses = user?.managedClasses ?? [];
  const academicContext = resolveProfileAcademicContext(user);
  const managedFaculty =
    (user as any)?.managedFaculty ||
    (user as any)?.managedFaculties?.[0] ||
    (user as any)?.faculty;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate years for dropdowns
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return `${year}-${year + 1}`;
  });

  // Form state - Thông tin sinh viên
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // Sync state once user is available on the client
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");

      setDateOfBirth(user.dateOfBirth?.split("T")[0] || "");

      setPhoneNumber(user.phone || user.phoneNumber || "");
    }
  }, [user]);

  // Kỳ đánh giá
  const [semester, setSemester] = useState<"HK1" | "HK2">("HK1");
  const [academicYear, setAcademicYear] = useState(academicYears[0]);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async () => {
    setSaved(false);
    setErrorMsg("");

    try {
      await updateProfile({
        phone: phoneNumber.trim() || null,
      } as Partial<Student>);
      await refreshProfile();
      setSaved(true);
      toast.success("Đã lưu thông tin thành công");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setErrorMsg(
        getUserFriendlyError(err, "Không thể cập nhật thông tin liên hệ."),
      );
    }
  };

  if (!mounted) {
    return (
      <div className="p-5 text-gray-500 bg-white rounded-xl shadow-sm border">
        Đang tải thông tin...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 max-w-6xl mx-auto w-full">
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isStudent
              ? "Thông tin cá nhân & Kỳ đánh giá"
              : "Thông tin cá nhân"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isStudent
              ? "Cập nhật hồ sơ sinh viên và kiểm tra thông tin kỳ đánh giá hiện tại."
              : isFaculty
                ? "Cập nhật hồ sơ cá nhân và xem khoa phụ trách."
                : "Cập nhật hồ sơ cá nhân và xem thông tin lớp phụ trách."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Left Side: Forms container (spans 2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="border-b border-gray-200 bg-gray-50/50 px-5 py-3">
            <h2 className="text-sm font-bold text-gray-900">
              {isStudent ? "Thông tin sinh viên" : "Thông tin cá nhân"}
            </h2>
          </div>

          <div className="flex flex-col">
            <div className="p-5 space-y-4 flex-1">
              {isStudent && academicContext.source === "assignment" && (
                <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  Thông tin lớp, ngành và khoa lấy từ lớp được phân công phụ
                  trách. Mã sinh viên chỉ hiển thị khi đã được cập nhật trong hồ
                  sơ.
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
                {isStudent && (
                  <>
                    <AcademicField
                      label={
                        academicContext.source === "assignment"
                          ? "Năm tuyển sinh của lớp"
                          : "Năm trúng tuyển"
                      }
                      value={academicContext.admissionYear?.toString()}
                    />
                    <AcademicField
                      label="Khoa"
                      value={academicContext.facultyName}
                    />
                    <AcademicField
                      label="Ngành/chuyên ngành"
                      value={academicContext.majorName}
                    />
                    <AcademicField
                      label="Lớp học"
                      value={academicContext.className}
                    />
                    <AcademicField
                      label="Mã sinh viên"
                      value={academicContext.studentCode}
                    />
                  </>
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
                    readOnly={isProfileReadOnly}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-lg outline-none h-10 ${
                      isProfileReadOnly
                        ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white"
                    }`}
                    placeholder="Số điện thoại"
                  />
                </div>
              </div>
            </div>

            {/* Action Footer */}
            {!isProfileReadOnly && (
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
            )}
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
                  onChange={(val) => setSemester(val as "HK1" | "HK2")}
                  options={[
                    { id: "HK1", name: "Học kỳ I" },
                    { id: "HK2", name: "Học kỳ II" },
                  ]}
                  label="Học kỳ"
                  required
                />

                {/* Field: Năm học */}
                <CustomSelect
                  value={academicYear}
                  onChange={(val) => setAcademicYear(val)}
                  options={academicYears.map((year) => ({
                    id: year,
                    name: year,
                  }))}
                  label="Năm học"
                  required
                />

                <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl space-y-2">
                  <div className="flex justify-between text-[11px] sm:text-xs">
                    <span className="text-gray-500">Kỳ học:</span>
                    <span className="font-bold text-blue-900">
                      {semester === "HK1" ? "Học kỳ I" : "Học kỳ II"}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs">
                    <span className="text-gray-500">Năm học:</span>
                    <span className="font-bold text-blue-900">
                      {academicYear}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs">
                    <span className="text-gray-500">Trạng thái:</span>
                    <span className="font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                      Chưa nộp
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] sm:text-xs border-t border-blue-100/50 pt-2">
                    <span className="text-gray-500">Hạn nộp:</span>
                    <span className="font-semibold text-red-600">
                      31/12/{academicYear.split("-")[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : isFaculty ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Khoa phụ trách
              </h2>

              {managedFaculty && typeof managedFaculty === "object" ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                  <p className="text-sm font-bold text-gray-900">
                    {managedFaculty.name ||
                      managedFaculty.facultyName ||
                      "Khoa phụ trách"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-600">
                    {managedFaculty.code ||
                      managedFaculty.facultyCode ||
                      "Chưa có mã khoa"}
                  </p>
                  {managedFaculty.assignedAt && (
                    <div className="mt-3 flex justify-between gap-3 text-xs text-gray-600">
                      <span>Ngày gán</span>
                      <span className="text-right font-semibold text-gray-800">
                        {new Date(managedFaculty.assignedAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-semibold text-gray-600">
                  Tài khoản này chưa được phân công khoa phụ trách.
                </p>
              )}
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
                      <p className="text-sm font-bold text-gray-900">
                        {item.className || item.classCode || "Lớp phụ trách"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-600">
                        {item.classCode || "Chưa có mã lớp"}
                      </p>
                      <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                        <div className="flex justify-between gap-3">
                          <span>Ngành</span>
                          <span className="text-right font-semibold text-gray-800">
                            {item.major?.name || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Khoa</span>
                          <span className="text-right font-semibold text-gray-800">
                            {item.faculty?.name || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Sinh viên</span>
                          <span className="font-semibold text-gray-800">
                            {item.studentCount ?? 0}
                          </span>
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

          {/* Card: Lớp phụ trách (cho Lớp trưởng) */}
          {user?.role === "class_leader" && managedClasses.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Lớp phụ trách
              </h2>
              <div className="space-y-3">
                {managedClasses.map((item) => (
                  <div
                    key={item.classId ?? item.classCode ?? item.className}
                    className="rounded-xl border border-blue-100 bg-blue-50/70 p-3"
                  >
                    <p className="text-sm font-bold text-gray-900">
                      {item.className || item.classCode || "Lớp phụ trách"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-600">
                      {item.classCode || "Chưa có mã lớp"}
                    </p>
                    <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                      <div className="flex justify-between gap-3">
                        <span>Ngành</span>
                        <span className="text-right font-semibold text-gray-800">
                          {item.major?.name || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Khoa</span>
                        <span className="text-right font-semibold text-gray-800">
                          {item.faculty?.name || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Sinh viên</span>
                        <span className="font-semibold text-gray-800">
                          {item.studentCount ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;

/** Các trường học vụ chỉ đọc; hiển thị dữ liệu hồ sơ trực tiếp, không chọn ngẫu nhiên từ danh mục. */
function AcademicField({ label, value }: { label: string; value?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-600">
        {label}
      </span>
      <input
        aria-label={label}
        value={value || "Chưa cập nhật"}
        readOnly
        className="h-10 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-500 outline-none sm:text-sm"
      />
    </label>
  );
}

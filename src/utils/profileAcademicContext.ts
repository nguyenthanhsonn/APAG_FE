interface AcademicName {
  id?: string;
  code?: string;
  name?: string;
}
interface AcademicClass extends AcademicName {
  enrollmentYear?: number;
  major?: AcademicName & { faculty?: AcademicName };
}
interface ManagedAcademicClass {
  id?: string;
  classId?: string;
  code?: string;
  classCode?: string;
  name?: string;
  className?: string;
  enrollmentYear?: number;
  major?: AcademicName | null;
  faculty?: AcademicName | null;
}
interface AcademicProfile {
  role?: string;
  class?: AcademicClass | null;
  major?: AcademicName | string | null;
  faculty?: AcademicName | string | null;
  admissionYear?: number;
  studentCode?: string | null;
  student?: {
    class?: AcademicClass | null;
    major?: AcademicName | null;
    faculty?: AcademicName | null;
    studentCode?: string | null;
  } | null;
  managedClasses?: ManagedAcademicClass[];
}
const displayName = (value?: AcademicName | string | null) =>
  typeof value === "string" ? value : value?.name || value?.code || "";

/** Assignment là lớp phụ trách, không tạo hồ sơ sinh viên hay suy ra mã SV từ username. */
export function resolveProfileAcademicContext(
  profile?: AcademicProfile | null,
) {
  const enrolledClass = profile?.student?.class ?? profile?.class;
  const studentCode =
    profile?.student?.studentCode ?? profile?.studentCode ?? "";
  if (enrolledClass) {
    const major =
      profile?.student?.major ?? profile?.major ?? enrolledClass.major;
    const faculty =
      profile?.student?.faculty ??
      profile?.faculty ??
      enrolledClass.major?.faculty;
    return {
      source: "enrollment" as const,
      className: displayName(enrolledClass),
      majorName: displayName(major),
      facultyName: displayName(faculty),
      admissionYear: enrolledClass.enrollmentYear ?? profile?.admissionYear,
      studentCode,
    };
  }
  // Chỉ lớp trưởng có một assignment rõ ràng được dùng làm fallback hiển thị.
  // CVHT có thể phụ trách nhiều lớp; không biến lớp phụ trách thành lớp đang học.
  const assignment =
    profile?.role === "class_leader" && profile.managedClasses?.length === 1
      ? profile.managedClasses[0]
      : undefined;
  return {
    source: assignment ? ("assignment" as const) : ("none" as const),
    className:
      assignment?.className ||
      assignment?.name ||
      assignment?.classCode ||
      assignment?.code ||
      "",
    majorName: displayName(assignment?.major),
    facultyName: displayName(assignment?.faculty),
    admissionYear: assignment?.enrollmentYear ?? profile?.admissionYear,
    studentCode,
  };
}

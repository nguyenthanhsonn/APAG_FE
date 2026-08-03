import { AdminFacultyStatsCardProps } from '../../types';

export const AdminFacultyStatsCard = ({
  facultyStats,
  totalFacultyStudents,
  maxStudents,
}: AdminFacultyStatsCardProps) => {
  return (
    <section className="ui-card p-5">
      <div className="mb-5">
        <h2 className="text-base font-bold text-[#1A1B1E]">Thống kê theo khoa</h2>
        <p className="mt-1 text-sm text-[#868E96]">Tổng số sinh viên theo từng khoa</p>
      </div>
      <div className="space-y-5">
        {facultyStats.map((faculty) => {
          const percent = totalFacultyStudents ? (faculty.students / totalFacultyStudents) * 100 : 0;
          const isMax = faculty.students === maxStudents;
          return (
            <div key={faculty.name}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2">
                  {isMax && (
                    <span className="shrink-0 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">
                      TOP
                    </span>
                  )}
                  <span className="truncate text-sm font-semibold text-[#1A1B1E]">{faculty.name}</span>
                </div>
                <span className="shrink-0 text-sm font-bold text-brand-secondary">{faculty.students} SV</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-brand-secondary/10">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1 text-right text-[11px] text-[#ADB5BD]">{percent.toFixed(1)}% tổng SV</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

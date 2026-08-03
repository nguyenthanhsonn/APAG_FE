export type EvaluationOption = {
  value: string;
  label: string;
};

export const REGULAR_SCORE_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: '', label: '0.00 đ - Chưa chọn / Không đạt' },
  { value: 'GTE_9', label: '6.00 đ - Điểm TB học kỳ >= 9' },
  { value: 'FROM_7_TO_UNDER_9', label: '5.00 đ - Điểm TB học kỳ từ 7 đến cận 9' },
  { value: 'FROM_5_TO_UNDER_7', label: '4.00 đ - Điểm TB học kỳ từ 5 đến cận 7' },
  { value: 'FROM_4_TO_UNDER_5', label: '2.00 đ - Điểm TB học kỳ từ 4 đến cận 5' },
  { value: 'FROM_1_TO_UNDER_4', label: '1.00 đ - Điểm TB học kỳ từ 1 đến cận 4' },
];

export const ACADEMIC_RANK_OPTIONS: EvaluationOption[] = [
  { value: '', label: '0.00 đ - Chưa chọn / Không đạt' },
  { value: 'EXCELLENT', label: '8.00 đ - Loại xuất sắc' },
  { value: 'GOOD', label: '7.00 đ - Loại giỏi' },
  { value: 'FAIR', label: '6.00 đ - Loại khá' },
  { value: 'AVERAGE', label: '4.00 đ - Loại trung bình' },
  { value: 'WEAK_NO_WARNING', label: '2.00 đ - Loại yếu nhưng chưa bị cảnh báo' },
  { value: 'WEAK_WARNING_FIRST', label: '1.00 đ - Loại yếu nhưng bị cảnh báo lần 1' },
];

export const POLITICAL_ACTIVITY_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'GOOD_PARTICIPATION', label: '5đ - Tham gia tốt, đầy đủ' },
  { value: 'ABSENT_ONCE', label: '3đ - Vắng 1 lần' },
  { value: 'ABSENT_TWICE', label: '2đ - Vắng 2 lần' },
  { value: 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED', label: '0đ - Vắng trên 2 lần hoặc không tham gia' },
];

export const CULTURE_SPORT_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'FULL_EFFECTIVE_PARTICIPATION', label: '5đ - Tham gia đầy đủ, hiệu quả' },
  { value: 'EFFECTIVE_PARTICIPATION_FROM_HALF', label: '3đ - Tham gia hiệu quả từ một nửa hoạt động' },
  { value: 'ENCOURAGED_OTHERS', label: '2đ - Tích cực vận động, tuyên truyền' },
  { value: 'ABSENT_OVER_HALF', label: '1đ - Vắng trên một nửa hoạt động' },
  { value: 'NOT_PARTICIPATED', label: '0đ - Không tham gia' },
];

export const CLUB_ACTIVITY_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'FULL_EFFECTIVE_PARTICIPATION', label: '5đ - Đạt giải / tổ chức / tham gia đầy đủ' },
  { value: 'ACTIVE_ONE_OR_MORE', label: '3đ - Tích cực tham gia một hoặc nhiều CLB/Đội/Nhóm' },
  { value: 'ACTIVE_SUPPORTER', label: '2đ - Có hỗ trợ, tham gia một phần' },
  { value: 'ABSENT_OVER_HALF', label: '1đ - Vắng trên một nửa hoạt động' },
  { value: 'NOT_PARTICIPATED', label: '0đ - Không tham gia' },
];

export const SOCIAL_PREVENTION_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'MULTIPLE_ACTIVITIES_OR_REPORTING', label: '3đ - Tham gia nhiều hoạt động / báo cáo đúng' },
  { value: 'ONE_EFFECTIVE_ACTIVITY', label: '2đ - Tham gia 1 hoạt động hiệu quả' },
  { value: 'AWARENESS_OR_SUPPORT', label: '1đ - Có ý thức / hỗ trợ' },
  { value: 'REMINDED_VIOLATION', label: '0đ - Vi phạm / bị nhắc nhở' },
];

export const LAW_COMPLIANCE_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'GOOD_WITH_REWARD', label: '10đ - Chấp hành tốt, có khen thưởng' },
  { value: 'GOOD', label: '8đ - Chấp hành tốt' },
  { value: 'AVERAGE', label: '5đ - Chấp hành trung bình' },
  { value: 'VIOLATED', label: '0đ - Vi phạm' },
];

export const VOLUNTEER_ACTIVITY_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'ACTIVE_WITH_REWARD', label: '10đ - Tích cực, có khen thưởng / thành tích đặc biệt' },
  { value: 'ACTIVE', label: '8đ - Tham gia tích cực' },
  { value: 'PARTICIPATED', label: '5đ - Có tham gia / hỗ trợ' },
  { value: 'NOT_PARTICIPATED', label: '0đ - Không tham gia' },
];

export const COMMUNITY_RELATIONSHIP_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'GOOD', label: '5đ - Khai báo/cư trú đúng quy định' },
  { value: 'ONE_WARNING', label: '1đ - Bị nhắc nhở/kiểm điểm 1 lần' },
  { value: 'TWO_WARNINGS', label: '0đ - Bị nhắc nhở/kiểm điểm từ 2 lần' },
];

export const STUDENT_ROLE_TYPE_OPTIONS: EvaluationOption[] = [
  { value: 'CLASS_OFFICER', label: 'Có chức vụ (BCS/Đoàn)' },
  { value: 'NORMAL_STUDENT', label: 'SV thường' },
];

export const POSITION_GROUP_OPTIONS: EvaluationOption[] = [
  { value: 'LEADER_GROUP', label: 'A1 (Lớp trưởng/Bí thư)' },
  { value: 'MEMBER_GROUP', label: 'A2 (Phó lớp, Chi hội trưởng...)' },
  { value: 'NONE', label: 'Không giữ chức vụ' },
];

export const TASK_COMPLETION_LEVEL_A1_OPTIONS: EvaluationOption[] = [
  { value: 'EXCELLENT', label: '7đ - Xuất sắc' },
  { value: 'GOOD', label: '6đ - Tốt' },
  { value: 'FAIR', label: '4đ - Đạt' },
  { value: 'POOR', label: '0đ - Không đạt' },
];

export const TASK_COMPLETION_LEVEL_A2_OPTIONS: EvaluationOption[] = [
  { value: 'EXCELLENT', label: '6đ - Xuất sắc' },
  { value: 'GOOD', label: '5đ - Tốt' },
  { value: 'FAIR', label: '3đ - Đạt' },
  { value: 'POOR', label: '0đ - Không đạt' },
];

export const MANAGEMENT_SKILL_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'HEAD_POSITION', label: '3đ - Trưởng ban' },
  { value: 'DEPUTY_POSITION', label: '2đ - Phó ban' },
  { value: 'MEMBER_POSITION', label: '1đ - Thành viên' },
  { value: '', label: '0đ - Không' },
];

export const SPECIAL_ACHIEVEMENT_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'SCHOOL_LEVEL_OR_HIGHER', label: '7đ - Được khen thưởng từ cấp Học viện trở lên' },
  { value: 'FACULTY_LEVEL', label: '5đ - Đạt khen thưởng từ cấp Khoa trở lên' },
  { value: 'NONE', label: '0đ - Không có' },
];

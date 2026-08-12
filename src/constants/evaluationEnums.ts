export type EvaluationOption = {
  value: string;
  label: string;
};

export const CRITERIA_CODES = {
  SECTION_1: {
    STUDY_ATTITUDE: 'TC1',
    NCKH_PARTICIPATION: 'TC1',
    NCKH_PAPER_OLYMPIC: 'TC1',
    NCKH_AWARD: 'TC1',
    ACADEMIC_RANK: 'TC1',
  },
  SECTION_2: {
    NO_VIOLATION: 'TC2',
    ABSENCE_CLASS_MEETING: 'TC2',
    LATE_CLASS_MEETING: 'TC2',
    ABSENCE_EVENT: 'TC2',
    NO_STUDENT_CARD: 'TC2',
    PROPERTY_VIOLATION: 'TC2',
    LATE_TUITION: 'TC2',
    EXAM_WARNING: 'TC2',
    EXAM_REPRIMAND: 'TC2',
    EXAM_CAUTION: 'TC2',
  },
  SECTION_3: {
    POLITICAL_CULTURE_SPORT: 'TC3',
    SOCIAL_EVILS_PREVENTION: 'TC3',
    UNION_CLASS_ACTIVITIES: 'TC3',
    VOLUNTEER_COMMUNITY: 'TC3',
    REWARD: 'TC3',
  },
  SECTION_4: {
    LAW_COMPLIANCE: 'TC4',
    CHARITY_SOLIDARITY: 'TC4',
    COMMUNITY_PROPAGANDA: 'TC4',
  },
  SECTION_5: {
    CADRE_RESPONSIBILITY: 'TC5',
    CADRE_PERFORMANCE: 'TC5',
    STUDENT_PARTICIPATION: 'TC5',
    SPECIAL_ACHIEVEMENT: 'TC5',
  },
} as const;

export type CriteriaCode =
  | 'TC1'
  | 'TC2'
  | 'TC3'
  | 'TC4'
  | 'TC5';

export const EVIDENCED_CRITERIA_CODES: CriteriaCode[] = [
  CRITERIA_CODES.SECTION_1.STUDY_ATTITUDE,
  CRITERIA_CODES.SECTION_3.REWARD,
  CRITERIA_CODES.SECTION_4.LAW_COMPLIANCE,
  CRITERIA_CODES.SECTION_5.CADRE_RESPONSIBILITY,
];

export const REGULAR_SCORE_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'GTE_9', label: '6.00 đ - Điểm TB đánh giá thường xuyên học kỳ ≥9' },
  { value: 'FROM_7_TO_UNDER_9', label: '5.00 đ - Điểm TB đánh giá thường xuyên học kỳ từ 7 đến cận 9' },
  { value: 'FROM_5_TO_UNDER_7', label: '4.00 đ - Điểm TB đánh giá thường xuyên học kỳ từ 5 đến cận 7' },
  { value: 'FROM_4_TO_UNDER_5', label: '2.00 đ - Điểm TB đánh giá thường xuyên học kỳ từ 4 đến cận 5' },
  { value: 'FROM_1_TO_UNDER_4', label: '1.00 đ - Điểm TB đánh giá thường xuyên học kỳ từ 01 đến cận 04' },
];

export const ACADEMIC_RANK_OPTIONS: EvaluationOption[] = [
  { value: 'EXCELLENT', label: '8.00 đ - Loại xuất sắc' },
  { value: 'GOOD', label: '7.00 đ - Loại giỏi' },
  { value: 'FAIR', label: '6.00 đ - Loại khá' },
  { value: 'AVERAGE', label: '4.00 đ - Loại trung bình' },
  { value: 'WEAK_NO_WARNING', label: '2.00 đ - Loại yếu nhưng chưa bị cảnh báo' },
  { value: 'WEAK_WARNING_FIRST', label: '1.00 đ - Loại yếu nhưng bị cảnh báo lần 1' },
];

export const POLITICAL_ACTIVITY_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'GOOD_PARTICIPATION', label: '5đ - Tham gia và chấp hành tốt các hoạt động' },
  { value: 'ABSENT_ONCE', label: '3đ - Vắng 01 buổi không có lý do' },
  { value: 'ABSENT_TWICE', label: '2đ - Vắng 02 buổi không có lý do' },
  { value: 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED', label: '0đ - Vắng từ 02 buổi trở lên không có lý do hoặc không tham gia' },
];

export const CULTURE_SPORT_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'FULL_EFFECTIVE_PARTICIPATION', label: '5đ - Tham gia đầy đủ, có hiệu quả các hoạt động lớp hoặc các đơn vị tổ chức ghi nhận' },
  { value: 'EFFECTIVE_PARTICIPATION_FROM_HALF', label: '3đ - Tham gia có hiệu quả từ 50% các hoạt động trở lên được lớp hoặc đơn vị tổ chức ghi nhận' },
  { value: 'ENCOURAGED_OTHERS', label: '2đ - Tích cực vận động mọi người tham gia hoặc hưởng ứng tích cực các phong trào' },
  { value: 'ABSENT_OVER_HALF', label: '1đ - Vắng trên 50% số buổi của các hoạt động' },
  { value: 'NOT_PARTICIPATED', label: '0đ - Không tham gia' },
];

export const CLUB_ACTIVITY_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'FULL_EFFECTIVE_PARTICIPATION', label: '5đ - Tham gia đầy đủ, có hiệu quả các hoạt động' },
  { value: 'ACTIVE_ONE_OR_MORE', label: '3đ - Tham gia tích cực, có hiệu quả từ 01 hoạt động trở lên' },
  { value: 'ACTIVE_SUPPORTER', label: '2đ - Là thành viên tích cực hưởng ứng các hoạt động' },
  { value: 'ABSENT_OVER_HALF', label: '1đ - Vắng trên 50% số buổi của các hoạt động' },
  { value: 'NOT_PARTICIPATED', label: '0đ - Không tham gia' },
];

export const SOCIAL_PREVENTION_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'MULTIPLE_ACTIVITIES_OR_REPORTING', label: '3đ - Tham gia tích cực nhiều hoạt động hoặc có ý thức tố giác các TNXH' },
  { value: 'ONE_EFFECTIVE_ACTIVITY', label: '2đ - Tham gia một hoạt động đạt hiệu quả' },
  { value: 'AWARENESS_OR_SUPPORT', label: '1đ - Có ý thức tham gia hoặc hưởng ứng các hoạt động tuyên truyền phòng, chống TNXH' },
  { value: 'REMINDED_VIOLATION', label: '0đ - Bị nhắc nhở 1 lần do vi phạm các TNXH (chưa đến mức xử lý kỷ luật)' },
];

export const LAW_COMPLIANCE_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'GOOD_WITH_REWARD', label: '10đ - Chấp hành đúng và tham gia tuyên truyền tốt, được khen thưởng' },
  { value: 'GOOD', label: '8đ - Chấp hành đúng và tham gia tuyên truyền tốt' },
  { value: 'AVERAGE', label: '5đ - Chấp hành đúng các quy định' },
  { value: 'VIOLATED', label: '0đ - Bị nhắc nhở, lập biên bản do vi phạm các quy định' },
];

export const VOLUNTEER_ACTIVITY_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'ACTIVE_WITH_REWARD', label: '10đ - Tích cực, nhiệt tình tham gia các hoạt động đạt hiệu quả được Học viện, các tổ chức khen thưởng' },
  { value: 'ACTIVE', label: '8đ - Tham gia tích cực các hoạt động được lớp hoặc tập thể ghi nhận' },
  { value: 'PARTICIPATED', label: '5đ - Có ý thức tham gia hoặc hưởng ứng các hoạt động' },
  { value: 'DISUNITY', label: '0đ - Tham gia các hoạt động nhưng gây mất đoàn kết' },
  { value: 'NOT_PARTICIPATED', label: '0đ - Không tham gia' },
];

export const COMMUNITY_RELATIONSHIP_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'GOOD', label: '5đ - Có ý thức xây dựng tập thể lớp đoàn kết, giữ gìn giảng đường, nơi cư trú văn minh, sạch đẹp, thực hiện tốt văn hóa học đường' },
  { value: 'ONE_WARNING', label: '1đ - Bị nhắc nhở hoặc kiểm điểm 1 lần' },
  { value: 'TWO_WARNINGS', label: '0đ - Bị nhắc nhở hoặc kiểm điểm 2 lần' },
];

export const STUDENT_ROLE_TYPE_OPTIONS: EvaluationOption[] = [
  { value: 'CLASS_OFFICER', label: 'Có chức vụ (BCS/Đoàn)' },
  { value: 'NORMAL_STUDENT', label: 'SV thường' },
];

export const POSITION_GROUP_OPTIONS: EvaluationOption[] = [
  { value: 'LEADER_GROUP', label: 'Lớp trưởng, Lớp phó; Bí thư, Phó Bí thư; Chủ nhiệm, Phó Chủ nhiệm các Ban, CLB...' },
  { value: 'MEMBER_GROUP', label: 'Ủy viên BCH chi đoàn; Chi ủy viên; Tổ trưởng, tổ phó các lớp; Ủy viên các Ban, CLB, Đội' },
  { value: 'NONE', label: 'Không giữ chức vụ' },
];

export const TASK_COMPLETION_LEVEL_A1_OPTIONS: EvaluationOption[] = [
  { value: 'EXCELLENT', label: '7đ - Hoàn thành xuất sắc nhiệm vụ (được khen thưởng hoặc được lãnh đạo các đơn vị, CVHT, tập thể ghi nhận)' },
  { value: 'GOOD', label: '6đ - Hoàn thành tốt nhiệm vụ' },
  { value: 'COMPLETED', label: '4đ - Hoàn thành nhiệm vụ' },
  { value: 'POOR', label: '0đ - Không hoàn thành nhiệm vụ' },
];

export const TASK_COMPLETION_LEVEL_A2_OPTIONS: EvaluationOption[] = [
  { value: 'EXCELLENT', label: '6đ - Hoàn thành xuất sắc nhiệm vụ (được khen thưởng hoặc được lãnh đạo các đơn vị, CVHT, tập thể ghi nhận)' },
  { value: 'GOOD', label: '5đ - Hoàn thành tốt nhiệm vụ' },
  { value: 'COMPLETED', label: '3đ - Hoàn thành nhiệm vụ' },
  { value: 'POOR', label: '0đ - Không hoàn thành nhiệm vụ' },
];

export const MANAGEMENT_SKILL_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'HEAD_POSITION', label: '3đ - Cấp trưởng: Liên chi đoàn, Lớp sinh viên, Lớp học phần, chi đoàn, chi bộ, chi hội, Chủ nhiệm các CLB, Đội' },
  { value: 'DEPUTY_POSITION', label: '2đ - Cấp Phó: Liên chi đoàn, Lớp sinh viên, chi đoàn, chi bộ, chi hội, các CLB, Đội' },
  { value: 'MEMBER_POSITION', label: '1đ - Ủy viên: BCH Đoàn, Hội, CLB, Đội' },
  { value: '', label: '0đ - Không' },
];

export const SPECIAL_ACHIEVEMENT_LEVEL_OPTIONS: EvaluationOption[] = [
  { value: 'SCHOOL_LEVEL_OR_HIGHER', label: '7đ - Được khen thưởng từ cấp Học viện trở lên' },
  { value: 'FACULTY_LEVEL', label: '5đ - Đạt khen thưởng từ cấp Khoa trở lên' },
  { value: 'NONE', label: '0đ - Không có' },
];

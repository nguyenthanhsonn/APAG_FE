'use client';

import { useParams } from 'next/navigation';
import { FacultyEvaluationPageView } from '@/views/TrainingDepartment/FacultyEvaluationPageView';

export default function FacultyDetailPage() {
  const params = useParams();
  const facultyId = Array.isArray(params?.facultyId) ? params.facultyId[0] : (params?.facultyId as string) || '';

  return <FacultyEvaluationPageView facultyId={facultyId} />;
}

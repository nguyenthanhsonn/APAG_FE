import { FacultyClassDetailView } from '@/views/Faculty/ClassDetailView';

interface Props {
  params: Promise<{ classId: string }>;
}

export default async function FacultyClassDetailPage({ params }: Props) {
  const { classId } = await params;
  return <FacultyClassDetailView classId={classId} />;
}

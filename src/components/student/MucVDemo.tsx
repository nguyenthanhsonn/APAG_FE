import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import MucVSection, { mucVSchema, MucVFormData } from './MucVSection';

export const MucVDemo: React.FC = () => {
  const methods = useForm<MucVFormData>({
    resolver: zodResolver(mucVSchema) as any,
    defaultValues: {
      cadrePosition: 'NONE',
      cadrePerformance: 'INCOMPLETE',
      managementLevel: 'NONE',
      classParticipation: 3,
      specialAchievement: 'NONE',
      notes: {},
      evidenceFiles: {},
    },
  });

  const onSubmit = (data: any) => {
    console.log('Mục V Submitted Data:', data);
    alert('Lưu dữ liệu Mục V thành công!\n' + JSON.stringify(data, null, 2));
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen font-sans">
      <div className="mb-4 bg-white p-5 rounded-xl border border-gray-300 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">📋 BIỂU MẪU MỤC V (CHUẨN THEO BẢN IN QUY ĐỊNH)</h1>
        <p className="text-xs text-gray-600">
          Hiển thị chuẩn 100% theo layout bảng in văn bản chính thức của Học viện, không dùng nút bấm chuyển nhánh hay button radio giao diện card.
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
          <MucVSection />

          <div className="flex items-center justify-end gap-3 bg-white p-4 rounded-xl border border-gray-300 shadow-sm">
            <button
              type="button"
              onClick={() => methods.reset()}
              className="px-4 py-2 rounded border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Làm mới form
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-blue-700 text-xs font-bold text-white hover:bg-blue-800 shadow transition"
            >
              Lưu đánh giá Mục V
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default MucVDemo;

import type { Metadata } from 'next';
import { ToastProvider } from '@/components/common/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'CSMTS - Đánh giá rèn luyện sinh viên',
    template: '%s | CSMTS',
  },
  description: 'Hệ thống quản lý và đánh giá điểm rèn luyện sinh viên theo quy trình Sinh viên, Lớp trưởng, CVHT, Khoa và Phòng Đào tạo.',
  applicationName: 'CSMTS',
  keywords: ['đánh giá rèn luyện', 'quản lý sinh viên', 'CSMTS', 'điểm rèn luyện'],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'CSMTS - Đánh giá rèn luyện sinh viên',
    description: 'Theo dõi, chấm duyệt và tổng hợp điểm rèn luyện sinh viên theo quy trình nghiệp vụ.',
    type: 'website',
    locale: 'vi_VN',
  },
  icons: {
    icon: '/apag-logo.png',
    shortcut: '/apag-logo.png',
    apple: '/apag-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

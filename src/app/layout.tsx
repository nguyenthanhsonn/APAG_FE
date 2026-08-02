import type { Metadata } from 'next';
import { ToastProvider } from '@/components/common/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Đánh giá rèn luyện',
  description: 'Comprehensive Student Management and Training System',
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

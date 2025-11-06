import type { Metadata } from 'next';
import { Montserrat, Playfair_Display, Inter } from 'next/font/google';
import { SessionProvider } from '@/components/common/providers/SessionProvider';
import { CourseManagementProvider } from '@/app/contexts/CourseManagementContext';
import { ToastProvider } from '@/hooks/useToast';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
});

export const metadata: Metadata = {  title: 'Course Audit',
  description:
    'Web application designed to streamline academic progress management for university students.',
  icons: {
    icon: '/image/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${montserrat.variable} ${playfair.variable} ${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          <SessionProvider>
            <CourseManagementProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </CourseManagementProvider>
          </SessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

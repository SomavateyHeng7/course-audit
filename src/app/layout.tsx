import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { CourseManagementProvider } from '@/app/contexts/CourseManagementContext';
import ConditionalLayout from '@/components/layout/ConditionalLayout';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
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
      <body className={`${roboto.variable} font-sans antialiased`}>
        <SessionProvider>
          <CourseManagementProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </CourseManagementProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

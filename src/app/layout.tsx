import type { Metadata } from 'next'; // Correct import for Metadata
import { Poppins } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';
import { CourseManagementProvider } from './contexts/CourseManagementContext';
import Sidebar from './components/layout/Sidebar';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Course Audit',
  description:
    'Web application designed to streamline academic progress management for university students.',
  icons: {
    icon: '/images/logo.png', // Ensure this path points to a valid image in the `public/` folder
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CourseManagementProvider>
            <div className="relative min-h-screen">
              <Sidebar />
              <main className="pl-56">
                <div className="container py-6">
                  {children}
                </div>
              </main>
            </div>
          </CourseManagementProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

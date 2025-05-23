import type { Metadata } from 'next'; // Correct import for Metadata
import { Poppins } from 'next/font/google';

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
    <html lang="en">
      <body className={`${poppins.variable} font-sans bg-gray-50`}>
        <CourseManagementProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1">
              {children}
            </div>
          </div>
        </CourseManagementProvider>
      </body>
    </html>
  );
}

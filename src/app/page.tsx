'use client';


import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/shared/footer';
import { ThemeProvider } from '@/components/theme-provider';
import SEO from '@/components/SEO';

export default function Home() {
  const router = useRouter();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SEO
        title="EduTrack | Streamline Your Academic Journey"
        description="EduTrack helps university students manage their academic progress efficiently. Track courses, monitor requirements, and stay on top of your degree path."
        keywords="university, course tracking, academic progress, degree management, student, education, curriculum, requirements"
        url="https://your-domain.com/"
        image="/public/image/logo.png"
      />
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="py-10 sm:py-16 px-4 sm:px-8 md:px-16 bg-gray-100 dark:bg-gray-950">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl sm:text-4xl font-semibold mb-2 sm:mb-4 text-emerald-700 dark:text-emerald-400">EduTrack</h1>
            <h2 className="text-xl sm:text-2xl font-medium mb-4 sm:mb-6 text-gray-700 dark:text-gray-200">Streamline Your Academic Journey</h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
              EduTrack helps university students manage their academic progress efficiently. Track courses, monitor requirements, and stay on top of your degree path.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                href="/management" 
                className="px-6 sm:px-8 py-2 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors border border-emerald-600 text-base sm:text-lg text-center"
              >
                Browse Courses (Anonymous)
              </Link>
              <Link 
                href="/auth" 
                className="px-6 sm:px-8 py-2 sm:py-3 border border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-colors text-base sm:text-lg text-center"
              >
                Login for Full Access
              </Link>
            </div>
          </div>
        </section>
        <section className="py-8 sm:py-12 px-4 sm:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-6 sm:mb-10 text-gray-800 dark:text-gray-100">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-gray-700 dark:text-gray-200">Course Tracking</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Easily track your completed courses and remaining requirements.</p>
              </div>
              <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-gray-700 dark:text-gray-200">Progress Analytics</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Visualize your academic progress with intuitive analytics.</p>
              </div>
              <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2 text-gray-700 dark:text-gray-200">Smart Planning</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Plan your course schedule with smart recommendations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* More Information Section */}
        <section className="py-12 px-4 sm:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold text-center mb-12 text-gray-900 dark:text-gray-100">More Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Calendar */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center mb-6">
                  <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor"/>
                    <path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor"/>
                    <circle cx="8" cy="15" r="1" fill="currentColor"/>
                    <circle cx="12" cy="15" r="1" fill="currentColor"/>
                    <circle cx="16" cy="15" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-medium mb-2">Calendar</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">See dates and deadlines for the school year.</p>
                <a href="#" className="px-8 py-3 border border-gray-800 dark:border-gray-200 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">Go to the Calendar</a>
              </div>
              {/* FAQ */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center mb-6">
                  <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor"/>
                    <path d="M9 8h6M9 12h6M9 16h2" stroke="currentColor"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-medium mb-2">Frequently Asked Questions</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Find answers to all your EduTrack questions.</p>
                <a href="#" className="px-8 py-3 border border-gray-800 dark:border-gray-200 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">Go to FAQ</a>
              </div>
              {/* Contact Us */}
              <div className="flex flex-col items-center text-center">
                <div className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center mb-6">
                  <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="7" y="4" width="10" height="16" rx="2" stroke="currentColor"/>
                    <path d="M11 18h2" stroke="currentColor"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-medium mb-2">Contact Us</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Here's how to get in touch with us.</p>
                <a href="#" className="px-8 py-3 border border-gray-800 dark:border-gray-200 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition">Contact Us</a>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </ThemeProvider>
  );
}


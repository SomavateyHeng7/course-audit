'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/shared/footer';
import { ThemeProvider } from '@/components/theme-provider';

export default function Home() {
  const router = useRouter();

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     router.push('/auth');
  //   }, 3000); // 3 seconds

  //   return () => clearTimeout(timer);
  // }, [router]);

  return (
    <>
      <div className="flex flex-col min-h-screen">        {/* Hero Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-8 md:px-16">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              EduTrack
            </h1>
            <h2 className="text-2xl sm:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Streamline Your Academic Journey
            </h2>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
              EduTrack helps university students manage their academic progress efficiently. 
              Track courses, monitor requirements, and stay on top of your degree path.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth" 
                className="px-6 sm:px-8 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors border border-primary text-base sm:text-lg text-center"
              >
                Get Started
              </Link>
              <Link 
                href="/management" 
                className="px-6 sm:px-8 py-2 sm:py-3 border border-primary text-primary dark:text-primary rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-base sm:text-lg text-center"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>        {/* Features Section */}
        <section className="py-10 sm:py-16 px-4 sm:px-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Course Tracking</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Easily track your completed courses and remaining requirements.</p>
              </div>
              <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Progress Analytics</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Visualize your academic progress with intuitive analytics.</p>
              </div>
              <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">Smart Planning</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Plan your course schedule with smart recommendations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 sm:py-16 px-4 sm:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Ready to Take Control of Your Academic Journey?</h2>
            <p className="text-base sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
              Join thousands of students who are already using Course Audit to manage their academic progress.
            </p>
            <Link 
              href="/auth" 
              className="px-6 sm:px-8 py-2 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-block border border-primary text-base sm:text-lg"
            >
              Start Now
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}


'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '@/components/common/shared/footer';
import Navbar from '@/components/common/shared/navbar';
import { ThemeProvider } from '@/components/common/theme-provider';
import SEO from '@/components/common/SEO';
import { image } from 'html2canvas/dist/types/css/types/image';

export default function Home() {
  const router = useRouter();

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SEO
        title="EduTrack | Streamline Your Academic Journey"
        description="EduTrack helps university students manage their academic progress efficiently. Track courses, monitor requirements, and stay on top of your degree path."
        keywords="university, course tracking, academic progress, degree management, student, education, curriculum, requirements"
        url="https://edutracks.site/"
        image="/public/image/logo.png"
      />
      <Navbar />
      <div className="flex flex-col min-h-screen transition-colors duration-300">
        
        {/* Hero Section - Minimalist Design */}
        <section className="pt-20 pb-12 px-4 bg-white dark:bg-gray-950 transition-colors duration-300 min-h-[85vh] flex items-center">
          <div className="max-w-5xl mx-auto text-center relative">
            {/* Main Heading */}
            <h1 className="font-montserrat text-5xl sm:text-7xl font-light mb-6 text-gray-900 dark:text-white tracking-tight">
              Leave it to <span className="font-semibold text-emerald-600 dark:text-emerald-400">EduTrack</span>
            </h1>
            
            {/* Subtitle */}
            <p className="font-montserrat text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed font-light">
              Effortlessly track your academic progress with EduTrack. 
              Monitor requirements, plan your path, and stay on top of your degree journey.
            </p>

            {/* Main Illustration */}
            <div className="relative mb-8 flex justify-center">
              <div className="w-[600px] h-[400px] mx-auto relative">
                {/* Light mode image */}
                <img 
                  src="/image/cover.png" 
                  alt="Student with graduation cap managing academic progress"
                  className="w-full h-full object-contain dark:hidden"
                  style={{ 
                    filter: 'none',
                    background: 'transparent',
                    mixBlendMode: 'multiply'
                  }}
                />
                {/* Dark mode image */}
                <img 
                  src="/image/dark.png" 
                  alt="Student with graduation cap managing academic progress"
                  className="w-full h-full object-contain hidden dark:block"
                  style={{ 
                    filter: 'none',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center">
              <Link 
                href="/student/management" 
                className="font-montserrat inline-flex items-center px-8 py-4 bg-green-700 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Tracking
              </Link>
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="py-8 bg-white dark:bg-gray-950">
          <div className="max-w-6xl mx-auto px-32">
            <hr className="border-t border-gray-200 dark:border-gray-800" />
          </div>
        </div>

        {/* How it Works Section - Clean Steps */}
        <section className="py-24 bg-white dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="font-montserrat text-3xl font-light text-gray-900 dark:text-white mb-4">
                Three Simple Steps To Academic Success
              </h2>
            </div>
            
            <div className="space-y-20">
              {[
                {
                  number: "01",
                  title: "Define Your Program",
                  description: "Explore your curriculum and select courses that match your academic goals.",
                  gradient: "from-blue-200 to-blue-300",
                  image: "/image/computer.gif"
                },
                {
                  number: "02", 
                  title: "Track Progress",
                  description: "Monitor your completed courses and see what requirements remain.",
                  gradient: "from-emerald-200 to-emerald-300",
                  image: "/image/checklist.gif"
                },
                {
                  number: "03",
                  title: "Plan Ahead",
                  description: "Get smart recommendations for your next semester and graduation timeline.",
                  gradient: "from-purple-200 to-purple-300",
                  image: "/image/loading.gif"
                }
              ].map((step, index) => (
                <div key={step.number} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} gap-16 max-w-4xl mx-auto`}>
                  <div className="flex-1">
                    <div className={`text-7xl font-light bg-gradient-to-r ${step.gradient} bg-clip-text text-transparent mb-6`}>
                      {step.number}
                    </div>
                    <h3 className="font-montserrat text-2xl font-medium text-gray-900 dark:text-white mb-4">
                      {step.title}
                    </h3>
                    <p className="font-montserrat text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
                      {step.description}
                    </p>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className={`w-40 h-40 rounded-3xl bg-gradient-to-br ${step.gradient} bg-opacity-20 flex items-center justify-center overflow-hidden`}>
                      <img 
                        src={step.image} 
                        alt={`${step.title} animation`}
                        className="w-30 h-30 object-contain"
                        style={{ 
                          filter: 'none',
                          background: 'transparent'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
      
      {/* Minimal Footer */}
      <Footer />
    </ThemeProvider>
  );
}
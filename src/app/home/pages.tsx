'use client';

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

const HomePage = () => {
    const router = useRouter();

export default function Home() {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <header className="w-full py-4 bg-blue-600 text-white text-center shadow-md">
          <h1 className="text-3xl font-bold">Course Audit System</h1>
        </header>
  
        <main className="flex-grow flex flex-col items-center justify-center text-center p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Welcome to the Course Audit System
          </h2>
          <p className="text-gray-700 mb-6 max-w-xl">
            Manage your academic progress with ease! Track your completed,
            ongoing, and pending courses, create personalized academic roadmaps,
            and monitor your graduation timeline seamlessly.
          </p>
  
          <div className="flex space-x-4">
            <a
              href="/dashboard"
              className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700"
            >
              Go to Dashboard
            </a>
            <a
              href="/about"
              className="px-6 py-2 bg-gray-100 text-blue-600 rounded-md shadow-md hover:bg-gray-200"
            >
              Learn More
            </a>
          </div>
        </main>
  
        <footer className="w-full py-4 bg-gray-800 text-white text-center">
          <p className="text-sm">&copy; 2025 Course Audit System. All Rights Reserved.</p>
        </footer>
      </div>
    );
  }
  
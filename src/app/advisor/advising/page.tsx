"use client";

import { useRef } from "react";

export default function AdvisingDashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex justify-center py-12 px-6">
      <div className="flex flex-col w-full max-w-4xl gap-8">
        {/* Top Section: Advisor + Upload side-by-side */}
        <div className="flex flex-row gap-6 w-full">
          {/* Advisor Card */}
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-8 flex flex-col items-center flex-1">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-border flex items-center justify-center mb-4">
              <span className="material-icons text-gray-400 dark:text-gray-500 text-5xl">person</span>
            </div>
            <div className="text-gray-800 dark:text-foreground font-bold text-xl mb-6">ADVISOR NAME</div>
            <button className="bg-primary text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-primary transition border border-primary">
              Session Ongoing
              <span className="material-icons text-base">arrow_forward</span>
            </button>
          </div>

          {/* Upload Excel File */}
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-8 flex flex-col flex-1">
            <label className="block font-bold text-lg mb-4 text-foreground">Upload Excel File</label>
            <div
              className="h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                className="w-10 h-10 mb-2 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Drag and drop previous Excel report here,<br />
                or click here to upload.
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                ref={fileInputRef}
                className="hidden"
              />            </div>
          </div>
        </div>

        {/* Validated Feedback */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-8 w-full">
          <h2 className="text-primary dark:text-primary/40 font-bold text-lg mb-3">VALIDATED</h2>
          <div className="w-full border border-gray-200 dark:border-border rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 text-gray-500 dark:text-gray-400 min-h-[60px]">
            Feedback...
          </div>
        </div>
      </div>

      {/* Material Icons CDN */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </div>
  );
}

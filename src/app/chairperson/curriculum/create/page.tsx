"use client";
import { useRef } from "react";

export default function CreateCurriculum() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Main Content: Centered Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-12 flex flex-col items-center">
          <h1 className="text-4xl font-extrabold mb-10 text-gray-900 dark:text-foreground">Create Curriculum</h1>
          <form className="flex flex-col gap-6 w-full max-w-md">
            <div>
              <label className="block font-semibold mb-1 text-foreground">Curriculum Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">Total Credits</label>
              <input                type="number"
                placeholder="Enter total credits"
                className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">Concentration</label>
              <select className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground">
                <option>Software Development</option>
                <option>Informatic and Data Science</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition mt-4 w-32 self-start border border-emerald-700"
            >
              Confirm
            </button>
          </form>
          {/* File Upload Section */}
          <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-border mt-10 w-full max-w-md">
            <h2 className="font-bold text-xl mb-4 text-gray-900 dark:text-foreground">Upload Excel File</h2>
            <div
              className="h-52 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-10 h-10 mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
              />
            </div>
          </div>
        </div>
      </div>  
    </div>
  );
}

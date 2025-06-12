"use client";

import { useRef } from "react";

export default function AdvisingDashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-[#f7fafd] flex justify-center py-12 px-6">
      <div className="flex gap-8 w-full max-w-6xl">
        {/* Advisor Card */}
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center w-[420px]">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <span className="material-icons text-gray-400 text-5xl">person</span>
          </div>
          <div className="text-gray-800 font-bold text-xl mb-6">ADVISOR NAME</div>
          <button className="bg-[#4bb89e] text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-[#399e85] transition">
            Request Session
            <span className="material-icons text-base">arrow_forward</span>
          </button>
        </div>

        {/* File Upload Card */}
        <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col w-[420px]">
          <label className="block font-bold text-lg mb-4">Upload Excel File</label>
          <div
            className="h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-10 h-10 mb-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            <p className="text-center text-sm">
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

      {/* Material Icons CDN */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </div>
  );
}

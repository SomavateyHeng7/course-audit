"use client";

import { useRef } from "react";
import ChairPersonSidebar from '@/components/layout/ChairPersonSidebar';

export default function CreateCurriculum() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-[#656565]/30 flex">
      {/* Sidebar */}
      <ChairPersonSidebar />
      {/* Main Content */}
      <div className="flex flex-1 justify-center items-center py-10 pl-64">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md p-12 border border-[#b6e6e0]">
          <div className="flex gap-12">
            {/* Form Section */}
            <div className="w-[400px]">
              <h1 className="text-4xl font-extrabold mb-10 text-gray-900">Create Curriculum</h1>
              <form className="flex flex-col gap-6">
                <div>
                  <label className="block font-semibold mb-1">Curriculum Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb89e]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Total Credits</label>
                  <input
                    type="number"
                    placeholder="Enter your name"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb89e]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Concentration</label>
                  <select className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#4bb89e]">
                    <option>Software Development</option>
                    <option>Informatic and Data Science</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-[#4bb89e] text-white py-2 rounded-lg font-semibold hover:bg-[#399e85] transition mt-4 w-32 self-start"
                >
                  Confirm
                </button>
              </form>
            </div>
            {/* File Upload Section */}
            <div className="flex-1 flex flex-col justify-start">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="font-bold text-xl mb-4 text-gray-900">Upload Excel File</h2>
                <div
                  className="h-52 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-10 h-10 mb-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                  <p className="text-center text-sm text-gray-500">
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
      </div>
    </div>
  );
}

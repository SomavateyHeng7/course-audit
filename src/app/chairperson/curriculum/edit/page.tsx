"use client";

import { useRef } from "react";

export default function EditCurriculum() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-1 min-h-screen bg-[#f7fafd] p-6">
      <div className="flex flex-1 bg-white rounded-2xl shadow-md p-10 w-full">
        <div className="w-full flex gap-12">
          {/* Form Section */}
          <div className="w-[400px]">
            <h1 className="text-3xl font-bold mb-10">
              Edit <span className="text-[#4bb89e]">&gt;</span> Curriculum for 2022
            </h1>
            <form className="flex flex-col gap-6">
              <div>
                <label className="block font-semibold mb-1">Curriculum Name</label>
                <input
                  type="text"
                  value="Curriculum for 2022"
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4bb89e]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Total Credits</label>
                <input
                  type="number"
                  value="132"
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#4bb89e]"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block font-semibold mb-1">Concentration</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 text-gray-400"
                    disabled
                  >
                    <option>Software Development</option>
                  </select>
                </div>
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                  readOnly
                  className="accent-[#4bb89e] mt-6"
                />
              </div>
              <button
                type="submit"
                className="bg-[#4bb89e] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#399e85] transition mt-4 w-32"
              >
                SAVE
              </button>
            </form>
          </div>

          {/* File Upload Section */}
          <div className="flex-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="font-bold text-lg mb-4">Upload Excel File</h2>
              <div
                className="h-52 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  className="w-10 h-10 mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                  />
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
  );
}
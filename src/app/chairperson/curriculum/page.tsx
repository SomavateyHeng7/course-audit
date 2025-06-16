"use client";

import { useRef } from "react";

export default function CreateCurriculum() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <div className="w-full max-w-5xl mx-auto bg-card rounded-2xl border border-border p-12">
          <div className="flex gap-12">
            {/* Form Section */}
            <div className="w-[400px]">
              <h1 className="text-4xl font-extrabold mb-10 text-foreground">Create Curriculum</h1>              <form className="flex flex-col gap-6">
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Curriculum Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Total Credits</label>
                  <input
                    type="number"
                    placeholder="Enter your name"
                    className="w-full border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-foreground">Concentration</label>
                  <select className="w-full border border-input rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                    <option>Software Development</option>
                    <option>Informatic and Data Science</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition mt-4 w-32 self-start"
                >
                  Confirm
                </button>
              </form>
            </div>
            {/* File Upload Section */}
            <div className="flex-1 flex flex-col justify-start">
              <div className="bg-card p-6 rounded-xl border border-border">
                <h2 className="font-bold text-xl mb-4 text-foreground">Upload Excel File</h2>
                <div
                  className="h-52 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="w-10 h-10 mb-2 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                  <p className="text-center text-sm text-muted-foreground">
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

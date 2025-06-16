"use client";
import { useState } from "react";

export default function StudentProfile() {
  const [activeTab, setActiveTab] = useState("student");

  return (
    <div className="bg-gray-50 dark:bg-background min-h-screen p-10">
      <h2 className="text-3xl font-bold mb-8 text-gray-800 dark:text-foreground">PROFILE</h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-300 dark:border-border mb-6">
        <button
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === "student" ? "border-b-4 border-emerald-600 text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("student")}
        >
          STUDENT INFORMATION
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium ${
            activeTab === "advisor" ? "border-b-4 border-emerald-600 text-black dark:text-white" : "text-gray-500 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("advisor")}
        >
          ADVISOR INFORMATION
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "student" && (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-8 w-full max-w-4xl">
          <InfoRow label="Faculty" value="SCIENCE AND TECHNOLOGY" />
          <InfoRow label="Department" value="COMPUTER SCIENCE" />
          <InfoRow label="G.P.A." value="3.45" />
          <InfoRow label="Credit" value="102" />
          <InfoRow label="Scholarship Hour" value="0" />
        </div>
      )}

      {activeTab === "advisor" && (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-8 w-full max-w-4xl">
          <InfoRow label="Name" value="John Doe" />
          <InfoRow label="Faculty" value="SCIENCE AND TECHNOLOGY" />
          <InfoRow label="Department" value="COMPUTER SCIENCE" />
          <InfoRow label="University Email" value="ajarn@gmail.com" />
          <InfoRow label="Office" value="102" />
        </div>
      )}
    </div>
  );
}

// Subcomponent for consistent row layout
function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between py-3 border-b border-gray-200 dark:border-border">
      <span className="font-medium text-gray-600 dark:text-gray-300">{label}</span>
      <span className="text-gray-800 dark:text-foreground font-medium">{value}</span>
    </div>
  );
}

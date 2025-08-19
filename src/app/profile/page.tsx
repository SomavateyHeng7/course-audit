"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function StudentProfile() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [isEditingAdvisor, setIsEditingAdvisor] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [studentInfo, setStudentInfo] = useState({
    faculty: "SCIENCE AND TECHNOLOGY",
    department: "COMPUTER SCIENCE",
    credit: 102,
    scholarshipHour: 0,
  });

  const [selectedAdvisor, setSelectedAdvisor] = useState("John Doe");
  const [advisors, setAdvisors] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProfile() {
  if (!session?.user?.role) return;
  const userRole = String(session.user.role);
  if (userRole !== "CHAIRPERSON" && userRole !== "SUPER_ADMIN") return;
      try {
        const res = await fetch("/api/student-profile");
        if (res.ok) {
          const data = await res.json();
          setStudentInfo(data.studentInfo || studentInfo);
          setSelectedAdvisor(data.advisorInfo?.name || selectedAdvisor);
          setAdvisors(["John Doe", "Jane Smith", "Robert Brown", "Emily Johnson"]); // Replace with dynamic list if needed
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setAdvisors(["John Doe", "Jane Smith", "Robert Brown", "Emily Johnson"]);
      }
    }
    fetchProfile();
  }, [session]);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/student-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentInfo,
          advisorName: selectedAdvisor,
        }),
      });

      if (res.ok) {
        setIsEditingStudent(false);
        setIsEditingAdvisor(false);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        console.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (status === "loading") return <div>Loading...</div>;
  const userRole = String(session?.user?.role);
  if (!session?.user?.role || (userRole !== "CHAIRPERSON" && userRole !== "SUPER_ADMIN")) {
    return <div className="text-center mt-10 text-gray-500">Profile info is only available for Chairperson and Super Admin.</div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-background min-h-screen p-4 sm:p-8 md:p-10">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800 dark:text-foreground text-center sm:text-left">PROFILE</h2>

      {showSuccessMessage && (
        <div className="mb-4 p-4 rounded-md bg-green-100 text-green-800 border border-green-300 text-center text-sm sm:text-base">
          ✅ Changes saved successfully!
        </div>
      )}

      <div className="flex flex-col sm:flex-row border-b border-gray-300 dark:border-border mb-6">
        {['student', 'advisor'].map((tab) => (
          <button
            key={tab}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium ${
              activeTab === tab
                ? "border-b-4 border-emerald-600 text-black dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.toUpperCase().replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Dashboard tab and content removed for chairperson/advisor */}

      {activeTab === "student" && (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-4 sm:p-8 w-full max-w-4xl mx-auto">
          {isEditingStudent ? (
            <>
              <EditableRow label="Faculty" value={studentInfo.faculty} onChange={(val) => setStudentInfo({ ...studentInfo, faculty: val })} />
              <EditableRow label="Department" value={studentInfo.department} onChange={(val) => setStudentInfo({ ...studentInfo, department: val })} />
              <EditableRow label="Credit" value={studentInfo.credit} type="number" onChange={(val) => setStudentInfo({ ...studentInfo, credit: Number(val) })} />
              <EditableRow label="Scholarship Hour" value={studentInfo.scholarshipHour} type="number" min={0} onChange={(val) => {
                const num = Number(val);
                if (num >= 0) setStudentInfo({ ...studentInfo, scholarshipHour: num });
              }} />
            </>
          ) : (
            <>
              <InfoRow label="Faculty" value={studentInfo.faculty} />
              <InfoRow label="Department" value={studentInfo.department} />
              <InfoRow label="Credit" value={studentInfo.credit} />
              <InfoRow label="Scholarship Hour" value={studentInfo.scholarshipHour} />
            </>
          )}
          <div className="flex justify-end mt-6">
            <button
              onClick={() => isEditingStudent ? handleSave() : setIsEditingStudent(true)}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              {isEditingStudent ? "Save" : "Edit"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "advisor" && (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-border p-4 sm:p-8 w-full max-w-4xl mx-auto">
          {isEditingAdvisor ? (
            <>
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Select Advisor</label>
                <select
                  value={selectedAdvisor}
                  onChange={(e) => setSelectedAdvisor(e.target.value)}
                  className="w-full border border-gray-300 dark:border-border rounded-lg p-2 bg-white dark:bg-background text-gray-800 dark:text-white text-xs sm:text-sm"
                >
                  {advisors.map((advisor) => (
                    <option key={advisor} value={advisor}>{advisor}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <InfoRow label="Name" value={selectedAdvisor} />
          )}

          <InfoRow label="Faculty" value="SCIENCE AND TECHNOLOGY" />
          <InfoRow label="Department" value="COMPUTER SCIENCE" />
          <InfoRow label="University Email" value="ajarn@gmail.com" />
          <InfoRow label="Office" value="102" />

          <div className="flex justify-end mt-6">
            <button
              onClick={() => isEditingAdvisor ? handleSave() : setIsEditingAdvisor(true)}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              {isEditingAdvisor ? "Save" : "Edit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between py-2 sm:py-3 border-b border-gray-200 dark:border-border text-xs sm:text-base">
      <span className="font-medium text-gray-600 dark:text-gray-300 mb-1 sm:mb-0">{label}</span>
      <span className="text-gray-800 dark:text-foreground font-medium">{value}</span>
    </div>
  );
}

function EditableRow({ label, value, onChange, type = "text", min }: {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  min?: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 sm:py-3 border-b border-gray-200 dark:border-border">
      <label className="font-medium text-gray-600 dark:text-gray-300 w-full sm:w-1/3 mb-1 sm:mb-0 text-xs sm:text-base">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        className="w-full sm:w-2/3 border border-gray-300 dark:border-border rounded-md px-3 py-2 dark:bg-background dark:text-white text-xs sm:text-base"
      />
    </div>
  );
}

function Dashboard() {
  return <div className="text-gray-500 dark:text-gray-400">Dashboard content here...</div>;
}

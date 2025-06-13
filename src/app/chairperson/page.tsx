'use client';

import React, { useState } from "react";
import Sidebar from "@/components/layout/ChairPersonSidebar";
import CurriculumSetup from "@/components/shared/CurriculumSetup";

const ChairpersonPage: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-blue-50">
      <Sidebar />
      <main className="flex-1 flex flex-col m-8 bg-white rounded-xl shadow-md p-8">
        <CurriculumSetup />
      </main>
    </div>
  );
};

export default ChairpersonPage;

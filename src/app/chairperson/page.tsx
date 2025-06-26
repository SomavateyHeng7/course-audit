'use client';

import React, { useState } from "react";
import CurriculumSetup from "@/components/shared/CurriculumSetup";

const ChairpersonPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8 text-foreground text-center sm:text-left">Chairperson Dashboard</h1>
        <div className="bg-card rounded-xl border border-border p-4 sm:p-8 w-full max-w-3xl mx-auto">
          <CurriculumSetup />
        </div>
      </div>
    </div>
  );
};

export default ChairpersonPage;

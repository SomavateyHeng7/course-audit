'use client';

import React, { useState } from "react";
import CurriculumSetup from "@/components/shared/CurriculumSetup";

const ChairpersonPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Chairperson Dashboard</h1>
        <div className="bg-card rounded-xl border border-border p-8">
          <CurriculumSetup />
        </div>
      </div>
    </div>
  );
};

export default ChairpersonPage;

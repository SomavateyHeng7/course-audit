"use client";

import RouteGuard from "@/components/common/RouteGuard";

export default function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={["ADVISOR"]}>
      {children}
    </RouteGuard>
  );
}

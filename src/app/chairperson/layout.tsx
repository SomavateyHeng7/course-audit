"use client";

import RouteGuard from "@/components/common/RouteGuard";

export default function ChairpersonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={["CHAIRPERSON"]}>
      {children}
    </RouteGuard>
  );
}

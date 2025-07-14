import { ProgressProvider } from "./data-entry/page";

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProgressProvider>
      {children}
    </ProgressProvider>
  );
} 
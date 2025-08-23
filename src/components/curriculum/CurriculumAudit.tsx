import { ProgressProvider } from '@/app/management/data-entry/page';
import DataEntryPage from '@/app/management/data-entry/page';

// This component wraps the DataEntryPage with ProgressProvider for reuse on the home page
export default function CurriculumAudit() {
  return (
    <ProgressProvider>
      <DataEntryPage isHomePage />
    </ProgressProvider>
  );
}

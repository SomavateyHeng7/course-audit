import React from 'react';
import { PencilLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Curriculum } from './types';

interface RenameDialogProps {
  open: boolean;
  curriculum: Curriculum | null;
  editedName: string;
  isSaveDisabled: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  curriculum,
  editedName,
  isSaveDisabled,
  onChange,
  onSave,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="sm:max-w-lg border border-amber-200/70 dark:border-amber-400/30 bg-gradient-to-b from-card via-background/95 to-background shadow-[0_30px_70px_rgba(15,23,42,0.35)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300">
              <PencilLine size={18} />
            </span>
            Rename Curriculum
          </DialogTitle>
        </DialogHeader>

        {curriculum && (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-amber-200/60 dark:border-amber-400/30 bg-amber-50/40 dark:bg-amber-500/5 px-4 py-3 text-sm">
              <div className="font-semibold text-foreground">{curriculum.name}</div>
              <div className="text-muted-foreground text-xs uppercase tracking-wide">
                Current version {curriculum.version} • {curriculum.year}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                New curriculum name
              </label>
              <Input
                value={editedName}
                onChange={(event) => onChange(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !isSaveDisabled) {
                    onSave();
                  }
                }}
                className="h-12 border-amber-200 focus-visible:ring-amber-500/60 dark:border-amber-500/40"
                placeholder="e.g., BSCS (2026 Revision)"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onCancel} className="border-border">
            Cancel
          </Button>
          <Button
            disabled={isSaveDisabled}
            onClick={onSave}
            className="bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Save Name
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

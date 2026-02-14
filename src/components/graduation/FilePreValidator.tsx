'use client';

/**
 * FilePreValidator — REQ-3 File Pre-Validation UI
 *
 * Displays structured validation results as a checklist with
 * expandable error/warning details. Integrates into the student
 * graduation portal upload step.
 */

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  PreValidationResult,
  ValidationCheck,
  FileValidationIssue,
} from '@/lib/utils/filePreValidation';

// ── Props ────────────────────────────────────────────────────────

interface FilePreValidatorProps {
  /** Validation results — null while validation is running */
  result: PreValidationResult | null;
  /** True while validation is in progress */
  isValidating: boolean;
  /** File being validated (for display) */
  file: File | null;
  /** Called when user wants to pick a different file */
  onReupload: () => void;
  /** Called when user wants to proceed (only enabled if canProceed) */
  onContinue: () => void;
}

// ── Status icon helper ───────────────────────────────────────────

function CheckIcon({ status }: { status: ValidationCheck['status'] }) {
  switch (status) {
    case 'pass':
      return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />;
    case 'fail':
      return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />;
    case 'warn':
      return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
    case 'pending':
    default:
      return <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />;
  }
}

// ── Issue severity badge ─────────────────────────────────────────

function IssueBadge({ severity }: { severity: FileValidationIssue['severity'] }) {
  if (severity === 'error') {
    return (
      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 leading-4">
        Error
      </Badge>
    );
  }
  return (
    <Badge className="text-[10px] px-1.5 py-0 leading-4 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100">
      Warning
    </Badge>
  );
}

// ── Component ────────────────────────────────────────────────────

export const FilePreValidator: React.FC<FilePreValidatorProps> = ({
  result,
  isValidating,
  file,
  onReupload,
  onContinue,
}) => {
  const [showIssues, setShowIssues] = useState(true);

  // ── Loading state ──────────────────────────────────────────────
  if (isValidating) {
    return (
      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Validating file…
        </div>
        {file && (
          <p className="text-xs text-muted-foreground pl-6">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>
    );
  }

  if (!result) return null;

  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');
  const hasIssues = result.issues.length > 0;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header: file info */}
      {file && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b">
          <FileSpreadsheet className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            ({(file.size / 1024).toFixed(1)} KB)
          </span>
        </div>
      )}

      {/* Checklist */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
          Validation Checks
        </p>
        {result.checks.map((check) => (
          <div key={check.id} className="flex items-start gap-2">
            <CheckIcon status={check.status} />
            <div className="min-w-0">
              <span className="text-sm font-medium">{check.label}</span>
              {check.detail && (
                <p className="text-xs text-muted-foreground">{check.detail}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Issues section */}
      {hasIssues && (
        <div className="border-t">
          <button
            onClick={() => setShowIssues((prev) => !prev)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-muted/30 transition-colors"
          >
            <span className="flex items-center gap-2">
              {errors.length > 0 ? (
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
              <span className="font-medium">
                {errors.length > 0
                  ? `${errors.length} error${errors.length !== 1 ? 's' : ''}`
                  : ''}
                {errors.length > 0 && warnings.length > 0 ? ', ' : ''}
                {warnings.length > 0
                  ? `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`
                  : ''}
              </span>
            </span>
            {showIssues ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showIssues && (
            <div className="px-4 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
              {result.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs leading-relaxed"
                >
                  <IssueBadge severity={issue.severity} />
                  <span className="text-muted-foreground">
                    {issue.row && (
                      <span className="font-medium text-foreground">
                        Row {issue.row}
                        {issue.column ? ` (${issue.column})` : ''}:{' '}
                      </span>
                    )}
                    {issue.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary + actions */}
      {result.parseResult && result.parseResult.courses.length > 0 && (
        <div className="border-t px-4 py-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span>
              <strong className="text-foreground">{result.parseResult.summary.totalCourses}</strong> courses
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span>
              <strong className="text-foreground">{result.parseResult.summary.totalCredits}</strong> credits
            </span>
            {Object.keys(result.parseResult.summary.byCategory).length > 1 && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span>
                  <strong className="text-foreground">
                    {Object.keys(result.parseResult.summary.byCategory).length}
                  </strong>{' '}
                  categories
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Verdict alert */}
      {!result.canProceed && (
        <div className="px-4 pb-3">
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription className="text-sm">
              Please fix the errors above and re-upload your file.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {result.canProceed && warnings.length > 0 && (
        <div className="px-4 pb-3">
          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-900/20">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
              There are warnings above, but you can still proceed. Review them to make sure your data is correct.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 border-t px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onReupload}
          className="gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-upload
        </Button>
        {result.canProceed && (
          <Button size="sm" onClick={onContinue} className="ml-auto gap-1.5">
            Continue
          </Button>
        )}
      </div>
    </div>
  );
};

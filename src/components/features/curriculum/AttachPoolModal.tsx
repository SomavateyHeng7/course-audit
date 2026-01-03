'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaLink, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type {
  AttachPoolModalProps,
  CreditPool,
  PoolCreditConfig,
} from '@/types/creditPool';

/**
 * Validation errors for the attachment form
 */
interface ValidationErrors {
  pool?: string;
  requiredCredits?: string;
  maxCredits?: string;
}

/**
 * AttachPoolModal Component
 * 
 * Modal for attaching a credit pool to a curriculum with curriculum-specific
 * credit requirements. Displays available pools from the department and prompts
 * for required and optional max credits.
 * 
 * Requirements: 3.2
 */
export default function AttachPoolModal({
  isOpen,
  onClose,
  onAttach,
  availablePools,
  selectedPoolId,
}: AttachPoolModalProps) {
  // Form state
  const [selectedPool, setSelectedPool] = useState<CreditPool | null>(null);
  const [requiredCredits, setRequiredCredits] = useState<string>('');
  const [maxCredits, setMaxCredits] = useState<string>('');
  
  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when modal opens/closes or selected pool changes
  useEffect(() => {
    if (isOpen) {
      // If a pool is pre-selected, find it and set defaults
      if (selectedPoolId) {
        const pool = availablePools.find(p => p.id === selectedPoolId);
        if (pool) {
          setSelectedPool(pool);
          setRequiredCredits(String(pool.minCredits));
          setMaxCredits(pool.maxCredits !== null ? String(pool.maxCredits) : '');
        }
      } else {
        setSelectedPool(null);
        setRequiredCredits('');
        setMaxCredits('');
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, selectedPoolId, availablePools]);

  // Update form when pool selection changes
  const handlePoolSelect = (pool: CreditPool) => {
    setSelectedPool(pool);
    // Pre-fill with pool's default credit range
    setRequiredCredits(String(pool.minCredits));
    setMaxCredits(pool.maxCredits !== null ? String(pool.maxCredits) : '');
    setTouched({});
    setErrors({});
  };

  // Validate form fields
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Pool selection validation
    if (!selectedPool) {
      newErrors.pool = 'Please select a pool to attach';
    }

    // Required credits validation - must be non-negative number
    const requiredCreditsNum = parseFloat(requiredCredits);
    if (requiredCredits.trim() === '' || isNaN(requiredCreditsNum)) {
      newErrors.requiredCredits = 'Required credits is required';
    } else if (requiredCreditsNum < 0) {
      newErrors.requiredCredits = 'Required credits must be a non-negative number';
    }

    // Max credits validation - if provided, must be non-negative and >= required
    if (maxCredits.trim() !== '') {
      const maxCreditsNum = parseFloat(maxCredits);
      if (isNaN(maxCreditsNum) || maxCreditsNum < 0) {
        newErrors.maxCredits = 'Maximum credits must be a non-negative number';
      } else if (!isNaN(requiredCreditsNum) && maxCreditsNum < requiredCreditsNum) {
        newErrors.maxCredits = 'Maximum credits cannot be less than required credits';
      }
    }

    return newErrors;
  }, [selectedPool, requiredCredits, maxCredits]);

  // Update errors when form values change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validateForm());
    }
  }, [selectedPool, requiredCredits, maxCredits, touched, validateForm]);

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Handle form submission
  const handleSubmit = () => {
    // Mark all fields as touched
    setTouched({
      pool: true,
      requiredCredits: true,
      maxCredits: true,
    });

    const validationErrors = validateForm();
    setErrors(validationErrors);

    // If there are errors, don't submit
    if (Object.keys(validationErrors).length > 0 || !selectedPool) {
      return;
    }

    // Build the credit config
    const creditConfig: PoolCreditConfig = {
      requiredCredits: parseFloat(requiredCredits) || 0,
      maxCredits: maxCredits.trim() !== '' ? parseFloat(maxCredits) : null,
    };

    onAttach(selectedPool.id, creditConfig);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  // Check if form is valid for submission
  const isFormValid = selectedPool !== null && 
    requiredCredits.trim() !== '' && 
    Object.keys(validateForm()).length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FaLink className="h-4 w-4" />
            </span>
            Attach Credit Pool
          </DialogTitle>
          <DialogDescription>
            Select a credit pool to attach to this curriculum and configure the credit requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pool Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Select Pool <span className="text-destructive">*</span>
            </Label>
            {availablePools.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No pools available to attach. Create pools in the Config page first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-border p-2">
                {availablePools.map((pool) => (
                  <div
                    key={pool.id}
                    onClick={() => handlePoolSelect(pool)}
                    className={`
                      cursor-pointer rounded-md border p-3 transition-colors
                      ${selectedPool?.id === pool.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{pool.name}</h4>
                        {pool.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {pool.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">
                          {pool.minCredits}
                          {pool.maxCredits !== null ? `-${pool.maxCredits}` : '+'} cr
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{pool.sources.length} source{pool.sources.length !== 1 ? 's' : ''}</span>
                      {pool.allowNonCurriculum && (
                        <span className="text-amber-600 dark:text-amber-400">• Allows external</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {errors.pool && touched.pool && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <FaExclamationCircle className="h-3 w-3" />
                {errors.pool}
              </p>
            )}
          </div>

          {/* Pool Default Reference */}
          {selectedPool && (
            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <div className="flex items-start gap-2">
                <FaInfoCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Pool Default Range</p>
                  <p>
                    This pool requires a minimum of <strong>{selectedPool.minCredits}</strong> credits
                    {selectedPool.maxCredits !== null 
                      ? <> and a maximum of <strong>{selectedPool.maxCredits}</strong> credits</>
                      : <> with no maximum limit</>
                    }.
                  </p>
                  <p className="mt-1">
                    You can customize these values for this specific curriculum below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Credit Requirements */}
          <div className="grid grid-cols-2 gap-4">
            {/* Required Credits */}
            <div className="space-y-2">
              <Label htmlFor="required-credits" className="text-sm font-medium">
                Required Credits <span className="text-destructive">*</span>
              </Label>
              <Input
                id="required-credits"
                type="number"
                min="0"
                step="1"
                value={requiredCredits}
                onChange={(e) => setRequiredCredits(e.target.value)}
                onBlur={() => handleBlur('requiredCredits')}
                placeholder="0"
                disabled={!selectedPool}
                className={errors.requiredCredits && touched.requiredCredits ? 'border-destructive' : ''}
              />
              {errors.requiredCredits && touched.requiredCredits && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <FaExclamationCircle className="h-3 w-3" />
                  {errors.requiredCredits}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum credits needed from this pool
              </p>
            </div>

            {/* Maximum Credits */}
            <div className="space-y-2">
              <Label htmlFor="max-credits" className="text-sm font-medium">
                Maximum Credits
              </Label>
              <Input
                id="max-credits"
                type="number"
                min="0"
                step="1"
                value={maxCredits}
                onChange={(e) => setMaxCredits(e.target.value)}
                onBlur={() => handleBlur('maxCredits')}
                placeholder="No limit"
                disabled={!selectedPool}
                className={errors.maxCredits && touched.maxCredits ? 'border-destructive' : ''}
              />
              {errors.maxCredits && touched.maxCredits && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <FaExclamationCircle className="h-3 w-3" />
                  {errors.maxCredits}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Leave empty for no maximum limit
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Attach Pool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

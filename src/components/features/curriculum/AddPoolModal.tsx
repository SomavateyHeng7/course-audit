'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaLayerGroup, FaExclamationCircle } from 'react-icons/fa';
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
import PoolSourceSelector from './PoolSourceSelector';
import type {
  AddPoolModalProps,
  NewCreditPool,
  PoolSource,
} from '@/types/creditPool';

/**
 * Validation errors for the pool form
 */
interface ValidationErrors {
  name?: string;
  minCredits?: string;
  maxCredits?: string;
  sources?: string;
}

/**
 * AddPoolModal Component
 * 
 * Modal for creating and editing credit pools.
 * Includes fields for name, description, credit requirements, and source selection.
 * Supports both create and edit modes.
 * 
 * Requirements: 1.1, 1.5
 */
export default function AddPoolModal({
  isOpen,
  onClose,
  onSave,
  courseTypes,
  poolLists,
  editingPool,
}: AddPoolModalProps) {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [minCredits, setMinCredits] = useState<string>('0');
  const [maxCredits, setMaxCredits] = useState<string>('');
  const [allowNonCurriculum, setAllowNonCurriculum] = useState(false);
  const [selectedSources, setSelectedSources] = useState<PoolSource[]>([]);
  
  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Determine if we're in edit mode
  const isEditMode = !!editingPool;

  // Reset form when modal opens/closes or editing pool changes
  useEffect(() => {
    if (isOpen) {
      if (editingPool) {
        // Populate form with existing pool data
        setName(editingPool.name);
        setDescription(editingPool.description || '');
        setMinCredits(String(editingPool.minCredits));
        setMaxCredits(editingPool.maxCredits !== null ? String(editingPool.maxCredits) : '');
        setAllowNonCurriculum(editingPool.allowNonCurriculum);
        setSelectedSources(editingPool.sources);
      } else {
        // Reset to defaults for new pool
        setName('');
        setDescription('');
        setMinCredits('0');
        setMaxCredits('');
        setAllowNonCurriculum(false);
        setSelectedSources([]);
      }
      setErrors({});
      setTouched({});
    }
  }, [isOpen, editingPool]);

  // Validate form fields
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Name validation - required and non-empty
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Pool name is required';
    }

    // Min credits validation - must be non-negative number
    const minCreditsNum = parseFloat(minCredits);
    if (isNaN(minCreditsNum) || minCreditsNum < 0) {
      newErrors.minCredits = 'Minimum credits must be a non-negative number';
    }

    // Max credits validation - if provided, must be non-negative and >= min
    if (maxCredits.trim() !== '') {
      const maxCreditsNum = parseFloat(maxCredits);
      if (isNaN(maxCreditsNum) || maxCreditsNum < 0) {
        newErrors.maxCredits = 'Maximum credits must be a non-negative number';
      } else if (!isNaN(minCreditsNum) && maxCreditsNum < minCreditsNum) {
        newErrors.maxCredits = 'Maximum credits cannot be less than minimum credits';
      }
    }

    return newErrors;
  }, [name, minCredits, maxCredits]);

  // Update errors when form values change
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validateForm());
    }
  }, [name, minCredits, maxCredits, touched, validateForm]);

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Handle form submission
  const handleSubmit = () => {
    // Mark all fields as touched
    setTouched({
      name: true,
      minCredits: true,
      maxCredits: true,
    });

    const validationErrors = validateForm();
    setErrors(validationErrors);

    // If there are errors, don't submit
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // Build the pool data
    const poolData: NewCreditPool = {
      name: name.trim(),
      description: description.trim() || undefined,
      minCredits: parseFloat(minCredits) || 0,
      maxCredits: maxCredits.trim() !== '' ? parseFloat(maxCredits) : null,
      allowNonCurriculum,
      sources: selectedSources.map(source => ({
        sourceType: source.sourceType,
        courseTypeId: source.courseTypeId,
        courseListId: source.courseListId,
        sourceName: source.sourceName,
        sourceColor: source.sourceColor,
      })),
    };

    onSave(poolData);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  // Check if form is valid for submission
  const isFormValid = name.trim() !== '' && Object.keys(validateForm()).length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FaLayerGroup className="h-4 w-4" />
            </span>
            {isEditMode ? 'Edit Credit Pool' : 'Create Credit Pool'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the credit pool settings and sources.'
              : 'Create a new credit pool with defined credit requirements and sources.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pool Name */}
          <div className="space-y-2">
            <Label htmlFor="pool-name" className="text-sm font-medium">
              Pool Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pool-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="e.g., Core Engineering, Major Electives"
              className={errors.name && touched.name ? 'border-destructive' : ''}
            />
            {errors.name && touched.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <FaExclamationCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="pool-description" className="text-sm font-medium">
              Description
            </Label>
            <Input
              id="pool-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this credit pool"
            />
          </div>

          {/* Credit Requirements */}
          <div className="grid grid-cols-2 gap-4">
            {/* Minimum Credits */}
            <div className="space-y-2">
              <Label htmlFor="min-credits" className="text-sm font-medium">
                Minimum Credits <span className="text-destructive">*</span>
              </Label>
              <Input
                id="min-credits"
                type="number"
                min="0"
                step="1"
                value={minCredits}
                onChange={(e) => setMinCredits(e.target.value)}
                onBlur={() => handleBlur('minCredits')}
                placeholder="0"
                className={errors.minCredits && touched.minCredits ? 'border-destructive' : ''}
              />
              {errors.minCredits && touched.minCredits && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <FaExclamationCircle className="h-3 w-3" />
                  {errors.minCredits}
                </p>
              )}
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

          {/* Allow Non-Curriculum Courses Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="allow-non-curriculum" className="text-sm font-medium cursor-pointer">
                Allow Non-Curriculum Courses
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, courses not in the curriculum can count toward this pool
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="allow-non-curriculum"
                type="checkbox"
                checked={allowNonCurriculum}
                onChange={(e) => setAllowNonCurriculum(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Source Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Pool Sources
            </Label>
            <p className="text-xs text-muted-foreground mb-3">
              Select course types and/or pool lists that will feed courses into this pool
            </p>
            <div className="rounded-lg border border-border p-4">
              <PoolSourceSelector
                courseTypes={courseTypes}
                poolLists={poolLists}
                selectedSources={selectedSources}
                onSourcesChange={setSelectedSources}
              />
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
            {isEditMode ? 'Save Changes' : 'Create Pool'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

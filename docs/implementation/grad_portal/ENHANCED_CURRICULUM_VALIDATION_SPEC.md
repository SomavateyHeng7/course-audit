# Enhanced Curriculum Validation for Graduation Portal

> **Specification Document for Comprehensive Progress Validation**  
> Created: January 23, 2026

---

## Table of Contents

1. [Problem Analysis](#problem-analysis)
2. [Scope of Work](#scope-of-work)
3. [Validation Requirements](#validation-requirements)
4. [UI/UX Enhancements](#uiux-enhancements)
5. [Export Features](#export-features)
6. [Implementation Plan](#implementation-plan)
7. [API Requirements](#api-requirements)
8. [Data Models](#data-models)

---

## Problem Analysis

### Current State Issues

#### 1. Superficial Validation in Grad Portal
The current graduation portal validation (`validateCacheSubmission`) only performs basic checks:
- ✗ Simple credit counting
- ✗ Basic course matching
- ✗ `can_graduate` based only on total credits and GPA

#### 2. Missing Validation Compared to Progress Page
The Progress page (`courseValidation.ts`) has comprehensive validation including:
- ✓ Constraint validation (min credits per category)
- ✓ Elective rule validation
- ✓ Blacklist combination checks
- ✓ Category-based progress tracking

**But these are NOT used in the Graduation Portal.**

#### 3. Wrong Validation Basis
Current approach treats validation as "pass/fail" when it should be:
- **For students with full credits**: Check if ALL required courses are completed
- **For students with remaining credits**: Show what they STILL NEED to take (not an error if credits aren't full yet)

#### 4. Missing Validation Categories
The following are NOT validated currently:
| Validation Type | Progress Page | Grad Portal |
|-----------------|---------------|-------------|
| Curriculum Constraints | ✅ | ❌ |
| Elective Rules (min credits) | ✅ | ❌ |
| Credit Pool Rules | ❌ | ❌ |
| Concentration Requirements | ❌ | ❌ |
| Blacklist/Banned Combos | ✅ | ❌ |
| Prerequisites (for planned) | ⚠️ Partial | ❌ |
| Corequisites | ❌ | ❌ |
| Course Flags (senior standing, etc.) | ❌ | ❌ |

---

## Scope of Work

### Phase 1: Enhanced Backend Validation (Priority: High)
1. Integrate all curriculum validation rules into the grad portal validation endpoint
2. Proper handling of "planned" vs "required" course logic
3. Return detailed validation breakdown

### Phase 2: CP/Advisor View Enhancements (Priority: High)  
1. Display comprehensive validation results
2. Show curriculum rule compliance
3. Concentration fulfillment display
4. Interactive course/requirement explorer

### Phase 3: Export Features (Priority: Medium)
1. PDF export of validation report
2. Excel export with course data + validation
3. Summary printable view

---

## Validation Requirements

### 1. Credit Pool Validation

Credit pools define hierarchical credit requirements:

```
Pool: "Core Requirements" (45 credits total)
├── Sub-category: "Core Mathematics" (12 credits)
│   └── Attached courses: MATH 101, MATH 102, MATH 201, MATH 202
├── Sub-category: "Core Programming" (15 credits)  
│   └── Attached courses: CS 101, CS 102, CS 201, CS 202, CS 301
└── Sub-category: "Core Theory" (18 credits)
    └── Attached courses: CS 310, CS 320, CS 330, ...
```

**Validation Logic:**
```typescript
interface CreditPoolValidation {
  poolId: string;
  poolName: string;
  requiredCredits: number;
  earnedCredits: number;
  plannedCredits: number;
  isComplete: boolean;
  subCategories: SubCategoryValidation[];
}

interface SubCategoryValidation {
  subCategoryId: string;
  name: string;
  requiredCredits: number;
  earnedCredits: number;
  plannedCredits: number;
  courses: CourseWithStatus[];
  issues: string[]; // e.g., "3 credits short"
}
```

**Validation Rules:**
- ✅ Each sub-category must meet its `requiredCredits` from attached courses
- ⚠️ If student has remaining credits capacity, missing credits = INFO not ERROR
- ❌ If student claims "full" but sub-category incomplete = ERROR

### 2. Elective Rules Validation

Elective rules define category-level requirements:

```json
{
  "electiveRules": [
    { "category": "Major Elective", "requiredCredits": 15 },
    { "category": "Free Elective", "requiredCredits": 6 },
    { "category": "GE Elective", "requiredCredits": 9 }
  ]
}
```

**Validation Logic:**
```typescript
interface ElectiveValidation {
  category: string;
  requiredCredits: number;
  completedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
  remainingCredits: number;
  status: 'complete' | 'on_track' | 'needs_attention' | 'incomplete';
  courses: CourseWithStatus[];
}
```

**Status Calculation:**
- `complete`: completedCredits >= requiredCredits
- `on_track`: completedCredits + inProgressCredits + plannedCredits >= requiredCredits
- `needs_attention`: projected to fall short, but student has credit capacity
- `incomplete`: insufficient credits and no capacity remaining

### 3. Concentration Requirements Validation

If student selected a concentration:

```typescript
interface ConcentrationValidation {
  concentrationId: string;
  concentrationName: string;
  requiredCredits: number;
  requiredCourses: ConcentrationCourse[];
  completedCourses: string[];
  inProgressCourses: string[];
  plannedCourses: string[];
  missingCourses: string[];
  isComplete: boolean;
  status: 'fulfilled' | 'on_track' | 'incomplete';
}
```

**Validation Rules:**
- All required concentration courses must be completed/planned
- Meet minimum concentration credits
- Warn if concentration courses conflict with blacklists

### 4. Constraint Validation

Curriculum-level constraints:

```typescript
interface ConstraintValidation {
  constraintId: string;
  constraintName: string;
  type: 'min_credits' | 'required_course' | 'banned_combination' | 'gpa' | 'senior_standing';
  isMet: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: {
    required?: number;
    current?: number;
    courses?: string[];
  };
}
```

**Constraint Types:**
| Type | Validation Logic |
|------|------------------|
| `min_credits` | Total credits in category >= required |
| `required_course` | Specific course must be completed/planned |
| `banned_combination` | Student cannot have taken multiple courses from list |
| `gpa` | Student GPA >= minimum |
| `senior_standing` | Certain courses require 90+ credits completed first |

### 5. Prerequisite/Corequisite Validation

For each course in submission:

```typescript
interface PrereqValidation {
  courseCode: string;
  courseName: string;
  status: 'completed' | 'in_progress' | 'planned';
  prerequisiteIssues: PrereqIssue[];
  corequisiteIssues: CoreqIssue[];
}

interface PrereqIssue {
  severity: 'error' | 'warning';
  requiredCourse: string;
  requiredCourseStatus: 'not_taken' | 'planned_after' | 'in_progress';
  message: string;
}

interface CoreqIssue {
  severity: 'error' | 'warning';
  requiredCourse: string;
  message: string;
}
```

**Validation Rules:**
| Course Status | Prereq Requirement |
|---------------|-------------------|
| `completed` | All prereqs must be `completed` |
| `in_progress` | All prereqs must be `completed` |
| `planned` | Prereqs can be `planned` in earlier semester (WARNING only) |

### 6. Blacklist Validation

```typescript
interface BlacklistValidation {
  blacklistId: string;
  blacklistName: string;
  description: string;
  violated: boolean;
  takenCourses: string[]; // Courses from this blacklist that student has taken
  message?: string; // e.g., "Cannot take both CS 301 and CS 302"
}
```

---

## UI/UX Enhancements

### CP/Advisor Submission View Page

#### Current Layout Issues:
- Only shows basic pass/fail status
- Courses grouped by category but no rule compliance visible
- No visibility into curriculum requirements

#### Enhanced Layout:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Back] Submission Review                               [Export ▼]       │
│                                                        PDF | Excel      │
├─────────────────────────────────────────────────────────────────────────┤
│ HEADER: Student Info + Status + Expiry Timer                            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│ │ Student ID  │ │ Curriculum  │ │ Credits     │ │ GPA         │        │
│ │ 6512345     │ │ BSCS 2022   │ │ 130/139     │ │ 3.45        │        │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘        │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ GRADUATION ELIGIBILITY                                    [Validate]│ │
│ │ ┌───────────────────────────────────────────────────────────────┐   │ │
│ │ │ ✅ Can Graduate  OR  ❌ Cannot Graduate (X issues)            │   │ │
│ │ └───────────────────────────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ TABS: [Requirements] [Courses] [Issues] [Concentration] [Export]        │
├─────────────────────────────────────────────────────────────────────────┤
│ REQUIREMENTS TAB:                                                       │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Credit Pools                                                        │ │
│ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ │ ▼ Core Requirements (42/45 credits)        [93%] ⚠️             │ │ │
│ │ │   ├── Core Math: 12/12 ✅                                       │ │ │
│ │ │   ├── Core Programming: 15/15 ✅                                │ │ │
│ │ │   └── Core Theory: 15/18 ⚠️ (3 credits remaining)              │ │ │
│ │ ├─────────────────────────────────────────────────────────────────┤ │ │
│ │ │ ▼ Major Electives (12/15 credits)          [80%] ⚠️             │ │ │
│ │ │   Courses: CS 401 (3), CS 402 (3), CS 410 (3), CS 411 (3)      │ │ │
│ │ │   Still need: 3 credits from major electives                    │ │ │
│ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Elective Rules                                                      │ │
│ │ ├── Free Electives: 6/6 credits ✅                                  │ │
│ │ ├── GE Electives: 9/9 credits ✅                                    │ │
│ │ └── Major Electives: 12/15 credits ⚠️                               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Constraints                                                         │ │
│ │ ├── ✅ Minimum GPA (2.0): 3.45 (Met)                                │ │
│ │ ├── ✅ Total Credits (139): 130 + 9 planned (On Track)              │ │
│ │ ├── ✅ Senior Project: Completed                                    │ │
│ │ └── ⚠️ Senior Standing Courses: CS 490 taken at 85 credits          │ │
│ │        (Requires 90 credits - OVERRIDE may be needed)               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ ISSUES TAB:                                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ❌ Errors (2)                                                        │ │
│ │ ├── Missing 3 credits in Core Theory                                │ │
│ │ └── CS 490 taken without senior standing prerequisite              │ │
│ │                                                                     │ │
│ │ ⚠️ Warnings (3)                                                      │ │
│ │ ├── Course XYZ999 not found in curriculum (Free Elective?)         │ │
│ │ ├── Planned course CS 499 requires CS 490 (check sequence)          │ │
│ │ └── 3 credits short of Major Elective requirement                   │ │
│ │                                                                     │ │
│ │ ℹ️ Info (1)                                                          │ │
│ │ └── Concentration "Data Science" not fully specified                │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ COURSES TAB: (Existing course list with category grouping)             │
│ [Search courses...] [Filter: All | Completed | In Progress | Planned]  │
│ ... existing course table with expandable categories ...               │
├─────────────────────────────────────────────────────────────────────────┤
│ CONCENTRATION TAB:                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Selected Concentration: Data Science                                │ │
│ │ Required Credits: 12  |  Earned: 9  |  Status: ⚠️ Incomplete        │ │
│ │                                                                     │ │
│ │ Required Courses:                                                   │ │
│ │ ├── ✅ CS 420 Machine Learning (Completed - A)                       │ │
│ │ ├── ✅ CS 421 Data Mining (Completed - B+)                           │ │
│ │ ├── ✅ CS 422 Big Data Analytics (In Progress)                       │ │
│ │ └── ❌ CS 423 Deep Learning (Not Planned)                            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ ACTIONS:                                                                │
│ ┌────────────────┐ ┌────────────────┐ ┌─────────────────────────────┐  │
│ │ ❌ Reject       │ │ ✅ Approve      │ │ 📄 Add Override Note        │  │
│ └────────────────┘ └────────────────┘ └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Export Features

### 1. PDF Export

**Content Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│ GRADUATION VALIDATION REPORT                                    │
│ Generated: 2026-01-23 14:30:00                                  │
├─────────────────────────────────────────────────────────────────┤
│ STUDENT INFORMATION                                             │
│ Student ID: 6512345                                             │
│ Curriculum: BSCS 2022 (For batch 653 onwards)                   │
│ Department: Computer Science                                    │
│ Faculty: Faculty of Science                                     │
├─────────────────────────────────────────────────────────────────┤
│ SUMMARY                                                         │
│ Total Credits: 130/139 (93.5%)                                  │
│ GPA: 3.45                                                       │
│ Status: ⚠️ PENDING - 2 issues require attention                 │
├─────────────────────────────────────────────────────────────────┤
│ REQUIREMENT COMPLIANCE                                          │
│ [Table of credit pools/elective rules with status]              │
├─────────────────────────────────────────────────────────────────┤
│ ISSUES & WARNINGS                                               │
│ [Categorized list of errors, warnings, info]                    │
├─────────────────────────────────────────────────────────────────┤
│ COURSE LIST                                                     │
│ [Full course table with code, name, credits, grade, status]     │
├─────────────────────────────────────────────────────────────────┤
│ REVIEWED BY: ________________________  DATE: ________________   │
│ SIGNATURE:   ________________________                           │
└─────────────────────────────────────────────────────────────────┘
```

**PDF Library Options:**
- `@react-pdf/renderer` - React-native PDF generation
- `jsPDF` + `html2canvas` - Screenshot-based
- `pdfmake` - Pure JS PDF generation (recommended)

### 2. Excel Export

**Sheets:**

**Sheet 1: Summary**
| Field | Value |
|-------|-------|
| Student ID | 6512345 |
| Curriculum | BSCS 2022 |
| Total Credits | 130/139 |
| GPA | 3.45 |
| Can Graduate | No |
| Issues Count | 2 |

**Sheet 2: Courses**
| Code | Name | Credits | Grade | Status | Category | Semester |
|------|------|---------|-------|--------|----------|----------|
| CS 101 | Intro to Computing | 3 | A | Completed | Core | 1/2022 |
| ... | ... | ... | ... | ... | ... | ... |

**Sheet 3: Requirements**
| Requirement | Type | Required | Completed | Status |
|-------------|------|----------|-----------|--------|
| Core Math | Credit Pool | 12 | 12 | ✅ Complete |
| Major Elective | Elective Rule | 15 | 12 | ⚠️ 3 short |

**Sheet 4: Issues**
| Severity | Type | Message | Course |
|----------|------|---------|--------|
| Error | Credits | Missing 3 credits in Core Theory | - |
| Warning | Prereq | CS 499 requires CS 490 | CS 499 |

**Excel Library:**
- `xlsx` (SheetJS) - Already in project
- `exceljs` - More features for styling

---

## Implementation Plan

### Phase 1: Backend Enhancement (Week 1-2)

#### Task 1.1: Enhanced Validation Endpoint
**File:** Laravel backend - `GraduationSubmissionController@validate`

```php
// Enhanced validation response structure
return [
    'validation' => [
        'can_graduate' => bool,
        'summary' => [...],
        'creditPoolValidation' => [...],
        'electiveRuleValidation' => [...],
        'constraintValidation' => [...],
        'concentrationValidation' => [...],
        'blacklistValidation' => [...],
        'prerequisiteValidation' => [...],
        'errors' => [...],
        'warnings' => [...],
        'info' => [...]
    ]
];
```

#### Task 1.2: Validation Service Classes
Create dedicated validation services:
- `CreditPoolValidator`
- `ElectiveRuleValidator`
- `ConstraintValidator`
- `ConcentrationValidator`
- `BlacklistValidator`
- `PrerequisiteValidator`

#### Task 1.3: Smart Validation Logic
Implement "remaining capacity" logic:
```php
// If student has credit room, missing requirements are INFO not ERROR
$remainingCapacity = $curriculum->total_credits_required - $totalEarned - $totalPlanned;
if ($remainingCapacity > 0) {
    $severity = 'info'; // Student can still add courses
} else {
    $severity = 'error'; // No room, requirement must be met
}
```

### Phase 2: Frontend Enhancement (Week 2-3)

#### Task 2.1: Update TypeScript Types
**File:** `src/lib/api/laravel.ts`

```typescript
interface EnhancedValidationResult {
  can_graduate: boolean;
  summary: ValidationSummary;
  creditPoolValidation: CreditPoolValidation[];
  electiveRuleValidation: ElectiveValidation[];
  constraintValidation: ConstraintValidation[];
  concentrationValidation: ConcentrationValidation | null;
  blacklistValidation: BlacklistValidation[];
  prerequisiteValidation: PrereqValidation[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
}

interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  courseCode?: string;
  details?: Record<string, unknown>;
}
```

#### Task 2.2: Enhanced Submission View Page
**File:** `src/app/chairperson/GraduationPortal/[submissionId]/page.tsx`

New components:
- `<RequirementsTab />` - Credit pools, elective rules, constraints
- `<ConcentrationTab />` - Concentration fulfillment
- `<IssuesTab />` - Categorized issues with details
- `<ExportMenu />` - PDF/Excel export buttons

#### Task 2.3: Validation Result Display Components
**File:** `src/components/graduation/`

```
components/graduation/
├── CreditPoolCard.tsx
├── ElectiveRuleCard.tsx
├── ConstraintCard.tsx
├── ConcentrationCard.tsx
├── BlacklistWarning.tsx
├── PrerequisiteIssue.tsx
├── ValidationSummaryHeader.tsx
└── ExportButton.tsx
```

### Phase 3: Export Implementation (Week 3-4)

#### Task 3.1: PDF Export
**File:** `src/lib/export/pdfExport.ts`

```typescript
export async function exportValidationPDF(
  submission: CacheSubmission,
  validation: EnhancedValidationResult
): Promise<Blob> {
  // Use pdfmake to generate PDF
}
```

#### Task 3.2: Excel Export
**File:** `src/lib/export/excelExport.ts`

```typescript
export async function exportValidationExcel(
  submission: CacheSubmission,
  validation: EnhancedValidationResult
): Promise<Blob> {
  // Use xlsx to generate multi-sheet Excel
}
```

---

## API Requirements

### New/Enhanced Endpoints

#### 1. Enhanced Validate Endpoint
```
POST /api/graduation-portals/{portalId}/cache-submissions/{submissionId}/validate
```

**Enhanced Response:**
```json
{
  "message": "Validation completed",
  "submission": {
    "id": "uuid",
    "status": "has_issues",
    "validation_result": {
      "can_graduate": false,
      "summary": {
        "totalCreditsRequired": 139,
        "creditsCompleted": 130,
        "creditsInProgress": 6,
        "creditsPlanned": 3,
        "gpa": 3.45,
        "issueCount": { "errors": 2, "warnings": 3, "info": 1 }
      },
      "creditPoolValidation": [...],
      "electiveRuleValidation": [...],
      "constraintValidation": [...],
      "concentrationValidation": {...},
      "blacklistValidation": [...],
      "prerequisiteValidation": [...],
      "errors": [...],
      "warnings": [...],
      "info": [...]
    }
  }
}
```

#### 2. Get Curriculum Full Details (For Validation Display)
```
GET /api/public-curricula/{id}?include=pools,constraints,concentrations,blacklists
```

Already exists, may need enhancement for credit pool details.

---

## Data Models

### Frontend Types

```typescript
// src/types/graduationValidation.ts

export interface EnhancedValidationResult {
  can_graduate: boolean;
  summary: ValidationSummary;
  creditPoolValidation: CreditPoolValidation[];
  electiveRuleValidation: ElectiveValidation[];
  constraintValidation: ConstraintValidation[];
  concentrationValidation: ConcentrationValidation | null;
  blacklistValidation: BlacklistValidation[];
  prerequisiteValidation: PrereqValidation[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
}

export interface ValidationSummary {
  totalCreditsRequired: number;
  creditsCompleted: number;
  creditsInProgress: number;
  creditsPlanned: number;
  completionPercentage: number;
  gpa: number | null;
  coursesMatched: number;
  coursesUnmatched: number;
  issueCount: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export interface CreditPoolValidation {
  poolId: string;
  poolName: string;
  requiredCredits: number;
  earnedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
  percentComplete: number;
  isComplete: boolean;
  status: 'complete' | 'on_track' | 'needs_attention' | 'incomplete';
  subCategories: SubCategoryValidation[];
}

export interface SubCategoryValidation {
  subCategoryId: string;
  name: string;
  courseTypeName: string;
  courseTypeColor: string;
  requiredCredits: number;
  earnedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
  courses: CourseWithValidationStatus[];
  issues: string[];
}

export interface CourseWithValidationStatus {
  code: string;
  name: string;
  credits: number;
  grade?: string;
  status: 'completed' | 'in_progress' | 'planned' | 'failed';
  isMatched: boolean;
  issues: string[];
}

export interface ElectiveValidation {
  category: string;
  requiredCredits: number;
  completedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
  remainingCredits: number;
  percentComplete: number;
  status: 'complete' | 'on_track' | 'needs_attention' | 'incomplete';
  courses: CourseWithValidationStatus[];
}

export interface ConstraintValidation {
  constraintId: string;
  constraintName: string;
  type: 'min_credits' | 'required_course' | 'banned_combination' | 'gpa' | 'senior_standing' | 'custom';
  isMet: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: {
    required?: number;
    current?: number;
    courses?: string[];
  };
}

export interface ConcentrationValidation {
  concentrationId: string;
  concentrationName: string;
  description?: string;
  requiredCredits: number;
  earnedCredits: number;
  requiredCourses: {
    code: string;
    name: string;
    credits: number;
    status: 'completed' | 'in_progress' | 'planned' | 'missing';
    grade?: string;
  }[];
  missingCourses: string[];
  isComplete: boolean;
  status: 'fulfilled' | 'on_track' | 'incomplete';
}

export interface BlacklistValidation {
  blacklistId: string;
  blacklistName: string;
  description?: string;
  violated: boolean;
  takenCourses: string[];
  message?: string;
}

export interface PrereqValidation {
  courseCode: string;
  courseName: string;
  status: 'completed' | 'in_progress' | 'planned';
  prerequisiteIssues: {
    severity: 'error' | 'warning';
    requiredCourse: string;
    requiredCourseStatus: 'not_taken' | 'planned_after' | 'in_progress' | 'failed';
    message: string;
  }[];
  corequisiteIssues: {
    severity: 'error' | 'warning';
    requiredCourse: string;
    message: string;
  }[];
}

export interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  courseCode?: string;
  category?: string;
  details?: Record<string, unknown>;
}
```

---

## File Structure

```
src/
├── app/chairperson/GraduationPortal/
│   └── [submissionId]/
│       └── page.tsx                    # Enhanced with tabs
├── components/graduation/
│   ├── validation/
│   │   ├── CreditPoolSection.tsx       # Credit pool display
│   │   ├── ElectiveRulesSection.tsx    # Elective rules display
│   │   ├── ConstraintsSection.tsx      # Constraints display
│   │   ├── ConcentrationSection.tsx    # Concentration display
│   │   ├── IssuesPanel.tsx             # Errors/Warnings/Info
│   │   └── ValidationSummary.tsx       # Header summary
│   └── export/
│       ├── ExportMenu.tsx              # Export dropdown
│       └── PrintableReport.tsx         # Print-friendly layout
├── lib/
│   ├── export/
│   │   ├── pdfExport.ts                # PDF generation
│   │   └── excelExport.ts              # Excel generation
│   └── validation/
│       └── displayHelpers.ts           # Status colors, icons, etc.
└── types/
    └── graduationValidation.ts         # All validation types
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Backend returns comprehensive validation including all rule types
- [ ] "Remaining capacity" logic correctly distinguishes INFO vs ERROR
- [ ] All existing tests pass
- [ ] New validation endpoint documentation added

### Phase 2 Complete When:
- [ ] CP can see credit pool progress with sub-categories
- [ ] CP can see elective rule compliance
- [ ] CP can see all constraint validation results
- [ ] CP can see concentration fulfillment (if applicable)
- [ ] CP can see prerequisite/blacklist issues
- [ ] Issues are categorized by severity

### Phase 3 Complete When:
- [ ] PDF export generates complete validation report
- [ ] Excel export creates multi-sheet workbook
- [ ] Exports include all validation data
- [ ] Exports are properly formatted and readable

---

## Estimated Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Backend | 1-2 weeks | High |
| Phase 2: Frontend | 1-2 weeks | High |
| Phase 3: Export | 1 week | Medium |
| Testing & Polish | 1 week | High |

**Total: 4-6 weeks**

---

## Questions for Stakeholders

1. **Override Mechanism**: Should CPs be able to override specific validation failures with notes?
2. **Concentration Selection**: Is concentration selected during submission or pre-defined per student?
3. **Historical Data**: Should validated submissions be stored permanently or still follow PDPA 30-min rule?
4. **Batch Operations**: Do CPs need to export validation for multiple students at once?
5. **Advisor Role**: Do advisors have same permissions as CPs for validation and approval?

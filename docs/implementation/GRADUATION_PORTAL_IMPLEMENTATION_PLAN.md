# Graduation Portal Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for the Graduation Portal feature, which enables students to submit academic progress files to chairpersons/advisors for graduation validation **without storing sensitive data in the database** (PDPA compliance).

---

## Table of Contents

1. [Requirements Analysis](#1-requirements-analysis)
2. [Architecture Overview](#2-architecture-overview)
3. [Data Flow Strategy](#3-data-flow-strategy)
4. [Technical Implementation](#4-technical-implementation)
5. [Error Handling & Validation](#5-error-handling--validation)
6. [Security Considerations](#6-security-considerations)
7. [UI/UX Enhancements](#7-uiux-enhancements)
8. [Implementation Phases](#8-implementation-phases)
9. [API Endpoints](#9-api-endpoints)
10. [Database Schema](#10-database-schema)

---

## 1. Requirements Analysis

### 1.1 Functional Requirements

#### Student Side
- [ ] Browse available graduation portals (filtered by department/batch)
- [ ] Enter access PIN to unlock portal
- [ ] Upload Excel/CSV files containing academic progress
- [ ] Select target curriculum for validation
- [ ] Input student identifier (name or ID) for the receiver
- [ ] Receive immediate confirmation of submission

#### Chairperson/Advisor Side
- [ ] Create graduation portals with:
  - Portal name and description
  - Target curriculum selection
  - Deadline date
  - Access PIN (auto-generated or custom)
  - Accepted file formats
- [ ] View list of pending submissions
- [ ] Single file processing with detailed validation
- [ ] Batch processing for multiple files
- [ ] View graduation eligibility status
- [ ] View detailed progress breakdown by category
- [ ] See validation errors and warnings
- [ ] Download original file for reference

### 1.2 Non-Functional Requirements

#### PDPA Compliance
- **No permanent storage** of student academic data
- Temporary storage with strict TTL (Time-To-Live)
- Files automatically purged after processing or timeout
- No personal data retained after session ends

#### Performance
- File size limit: 5MB per upload
- Batch processing: Up to 50 files at once
- Processing time: < 30 seconds per file

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              STUDENT BROWSER                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │ Portal List │───▶│  PIN Entry  │───▶│ File Upload │                     │
│  └─────────────┘    └─────────────┘    └──────┬──────┘                     │
└─────────────────────────────────────────────────┼───────────────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS FRONTEND                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     File Parsing (Client-Side)                       │   │
│  │  - Excel/CSV parsing with xlsx/papaparse                            │   │
│  │  - Initial format validation                                         │   │
│  │  - Data extraction to JSON                                           │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ JSON Data (not raw file)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LARAVEL BACKEND                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    WebSocket / SSE Connection                        │   │
│  │           (Real-time submission streaming to CP/Advisor)            │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Temporary Session Store                          │   │
│  │  Option A: Redis with TTL (15-30 minutes)                           │   │
│  │  Option B: Laravel Cache with File Driver + Cron Cleanup            │   │
│  │  Option C: In-Memory Queue (for immediate processing only)          │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Validation Engine                                │   │
│  │  - Curriculum matching                                               │   │
│  │  - Credit calculations                                               │   │
│  │  - Prerequisite checking                                             │   │
│  │  - Blacklist validation                                              │   │
│  │  - Graduation eligibility                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CHAIRPERSON/ADVISOR BROWSER                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Real-time Dashboard                                                 │   │
│  │  - New submission notifications                                      │   │
│  │  - Live processing status                                            │   │
│  │  - Validation results display                                        │   │
│  │  - Download option for processed data                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Recommended Storage Strategy: **Client-Side Processing + Streaming**

After analyzing the requirements and PDPA constraints, the recommended approach is:

#### **Option: Real-Time Streaming (No Server Storage)**

**How it works:**
1. Student uploads file → parsed client-side → sent as JSON via WebSocket/SSE
2. Backend validates against curriculum in real-time
3. Results streamed directly to CP/Advisor dashboard
4. **No file or data stored on server**

**Advantages:**
- ✅ Complete PDPA compliance - no storage at all
- ✅ No cleanup needed
- ✅ Real-time experience
- ✅ No cloud storage costs

**Disadvantages:**
- ❌ Requires CP/Advisor to be online to receive
- ❌ Slightly more complex frontend

**Solution for offline CP/Advisors:**
- Store only submission metadata (timestamp, student ID, curriculum ID)
- Student must re-submit if CP was offline
- OR use short-lived Redis cache (15 minutes TTL) as buffer

---

## 3. Data Flow Strategy

### 3.1 Submission Flow (Student → CP/Advisor)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            STUDENT SUBMISSION FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. SELECT PORTAL                                                            │
│     └─▶ Fetch active portals from API                                       │
│         └─▶ Display portals for student's department/batch                  │
│                                                                              │
│  2. ENTER PIN                                                                │
│     └─▶ Validate PIN against portal's hashed PIN                            │
│         └─▶ Grant temporary session token (15 min TTL)                      │
│                                                                              │
│  3. FILL SUBMISSION FORM                                                     │
│     ├─▶ Student Name/ID (for identification only)                           │
│     ├─▶ Select Curriculum (pre-filtered by portal)                          │
│     └─▶ Upload Excel/CSV file                                               │
│                                                                              │
│  4. CLIENT-SIDE PARSING                                                      │
│     └─▶ Parse file using xlsx/papaparse                                     │
│         └─▶ Extract course data: {code, grade, semester, credits}           │
│             └─▶ Validate format locally (column headers, data types)        │
│                                                                              │
│  5. SUBMIT TO BACKEND                                                        │
│     └─▶ Send JSON payload (NOT the file)                                    │
│         {                                                                    │
│           portalId: "uuid",                                                  │
│           studentIdentifier: "Name or ID",                                   │
│           curriculumId: "uuid",                                              │
│           courses: [{code, grade, status, credits, category}],              │
│           submittedAt: "timestamp"                                           │
│         }                                                                    │
│                                                                              │
│  6. RECEIVE CONFIRMATION                                                     │
│     └─▶ Submission ID for reference                                         │
│         └─▶ Estimated processing time                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Processing Flow (Backend)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND PROCESSING FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. RECEIVE SUBMISSION                                                       │
│     └─▶ Validate session token                                              │
│         └─▶ Store in temporary cache (Redis/Cache) with 15-30 min TTL      │
│                                                                              │
│  2. NOTIFY CP/ADVISOR                                                        │
│     └─▶ WebSocket broadcast to portal owner                                 │
│         └─▶ "New submission received" notification                          │
│             └─▶ Real-time dashboard update                                  │
│                                                                              │
│  3. VALIDATION (On-demand or Immediate)                                      │
│     ├─▶ Load curriculum from database                                       │
│     ├─▶ Match courses against curriculum requirements                       │
│     ├─▶ Calculate credits by category                                       │
│     ├─▶ Check prerequisites                                                 │
│     ├─▶ Validate against blacklists                                         │
│     ├─▶ Check graduation eligibility                                        │
│     └─▶ Generate validation report                                          │
│                                                                              │
│  4. STORE RESULTS (Temporary)                                                │
│     └─▶ Store validation results in cache (same TTL as submission)          │
│         {                                                                    │
│           canGraduate: boolean,                                              │
│           totalCredits: number,                                              │
│           categoryProgress: {...},                                           │
│           issues: [...],                                                     │
│           warnings: [...]                                                    │
│         }                                                                    │
│                                                                              │
│  5. CLEANUP                                                                  │
│     └─▶ Automatic TTL expiration                                            │
│         └─▶ Cron job for cache cleanup (fallback)                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Viewing Flow (CP/Advisor)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CP/ADVISOR VIEWING FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DASHBOARD VIEW                                                           │
│     └─▶ Real-time subscription to portal submissions                        │
│         └─▶ List of pending/processed submissions                           │
│             └─▶ Each shows: identifier, curriculum, time, status            │
│                                                                              │
│  2. SINGLE SUBMISSION VIEW                                                   │
│     └─▶ Click on submission to view details                                 │
│         ├─▶ Student identifier                                               │
│         ├─▶ Graduation eligibility badge                                     │
│         ├─▶ Credit progress overview (donut charts)                         │
│         ├─▶ Category breakdown                                               │
│         ├─▶ Course list with status                                          │
│         ├─▶ Issues and warnings                                              │
│         └─▶ Actions: Approve, Reject, Download Report                       │
│                                                                              │
│  3. BATCH PROCESSING                                                         │
│     └─▶ Select multiple pending submissions                                 │
│         └─▶ "Process All" button                                            │
│             └─▶ Bulk validation                                             │
│                 └─▶ Summary report generation                               │
│                                                                              │
│  4. DOWNLOAD OPTIONS                                                         │
│     ├─▶ Download validation report (PDF)                                    │
│     ├─▶ Download summary (Excel)                                            │
│     └─▶ Export batch results                                                │
│                                                                              │
│  5. DATA EXPIRY WARNING                                                      │
│     └─▶ Show countdown: "Data expires in X minutes"                         │
│         └─▶ Option to extend (if implemented)                               │
│             └─▶ Student notified to re-submit if expired                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technical Implementation

### 4.1 Temporary Storage Options Comparison

| Feature | Redis + TTL | Laravel Cache (File) | In-Memory Queue |
|---------|-------------|---------------------|-----------------|
| **Setup Complexity** | Medium | Low | Low |
| **Scalability** | High | Medium | Low |
| **Persistence** | Optional | Yes | No |
| **Cost** | AWS ElastiCache costs | Disk space | Memory only |
| **Cleanup** | Automatic TTL | Cron job needed | Automatic |
| **Recommended For** | Production | Development/Small | Real-time only |

### 4.2 Recommended: **Laravel Cache with Redis** (or Database for simple setup)

```php
// Laravel config for temporary submission storage
// config/cache.php - Add a dedicated store for submissions

'stores' => [
    'submissions' => [
        'driver' => 'redis',  // or 'database' for simpler setup
        'connection' => 'submissions',
        'prefix' => 'grad_portal:',
    ],
],

// In .env
SUBMISSION_TTL_MINUTES=30
```

### 4.3 Excel/CSV File Format Requirements

The student-uploaded file must contain these columns:

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `Course Code` | ✅ | Course identifier | CS 101, MATH 201 |
| `Course Name` | ⚠️ Optional | Course title | Introduction to Computing |
| `Credits` | ✅ | Credit hours | 3 |
| `Grade` | ✅ | Letter grade or status | A, B+, IP (In Progress), P (Planned) |
| `Semester` | ⚠️ Optional | When taken | 1/2024, 2/2025 |
| `Category` | ⚠️ Optional | Course category | Core, Elective |

**Grade Mappings:**
- `A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F` = Completed
- `IP, IN_PROGRESS, TAKING` = In Progress
- `P, PLANNED, PLANNING` = Planned for future
- `W, WITHDRAWN` = Withdrawn
- `I, INCOMPLETE` = Incomplete

### 4.4 Client-Side File Parsing

```typescript
// src/lib/utils/graduationFileParser.ts

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedCourse {
  code: string;
  name?: string;
  credits: number;
  grade: string;
  status: 'completed' | 'in_progress' | 'planned' | 'failed' | 'withdrawn';
  semester?: string;
  category?: string;
}

export interface ParseResult {
  success: boolean;
  courses: ParsedCourse[];
  errors: string[];
  warnings: string[];
}

export async function parseGraduationFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (['xlsx', 'xls'].includes(extension || '')) {
    return parseExcel(file);
  }
  
  return {
    success: false,
    courses: [],
    errors: ['Unsupported file format. Please upload .xlsx, .xls, or .csv'],
    warnings: []
  };
}

function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        resolve(processRawData(jsonData));
      } catch (error) {
        resolve({
          success: false,
          courses: [],
          errors: ['Failed to parse Excel file. Please check the format.'],
          warnings: []
        });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        resolve(processRawData(results.data));
      },
      error: (error) => {
        resolve({
          success: false,
          courses: [],
          errors: [`CSV parsing error: ${error.message}`],
          warnings: []
        });
      }
    });
  });
}

function processRawData(data: any[]): ParseResult {
  const courses: ParsedCourse[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Column name mappings (case-insensitive)
  const columnMappings = {
    code: ['course code', 'code', 'course_code', 'coursecode', 'subject code'],
    name: ['course name', 'name', 'course_name', 'coursename', 'title', 'subject'],
    credits: ['credits', 'credit', 'credit hours', 'credit_hours', 'units'],
    grade: ['grade', 'letter grade', 'final grade', 'result'],
    semester: ['semester', 'term', 'period', 'academic term'],
    category: ['category', 'type', 'course type', 'course_type']
  };
  
  const findColumn = (row: any, mappings: string[]): string | undefined => {
    const keys = Object.keys(row).map(k => k.toLowerCase().trim());
    for (const mapping of mappings) {
      const index = keys.indexOf(mapping);
      if (index !== -1) {
        return Object.keys(row)[index];
      }
    }
    return undefined;
  };
  
  if (data.length === 0) {
    return { success: false, courses: [], errors: ['File is empty'], warnings: [] };
  }
  
  const sampleRow = data[0];
  const codeCol = findColumn(sampleRow, columnMappings.code);
  const creditsCol = findColumn(sampleRow, columnMappings.credits);
  const gradeCol = findColumn(sampleRow, columnMappings.grade);
  
  if (!codeCol) {
    errors.push('Missing required column: Course Code');
  }
  if (!creditsCol) {
    errors.push('Missing required column: Credits');
  }
  if (!gradeCol) {
    errors.push('Missing required column: Grade');
  }
  
  if (errors.length > 0) {
    return { success: false, courses: [], errors, warnings };
  }
  
  const nameCol = findColumn(sampleRow, columnMappings.name);
  const semesterCol = findColumn(sampleRow, columnMappings.semester);
  const categoryCol = findColumn(sampleRow, columnMappings.category);
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // Account for header row
    
    const code = String(row[codeCol!] || '').trim().toUpperCase();
    const credits = parseFloat(row[creditsCol!]) || 0;
    const grade = String(row[gradeCol!] || '').trim().toUpperCase();
    
    if (!code) {
      warnings.push(`Row ${rowNum}: Missing course code, skipped`);
      continue;
    }
    
    if (credits <= 0) {
      warnings.push(`Row ${rowNum}: Invalid credits for ${code}, defaulting to 3`);
    }
    
    courses.push({
      code,
      name: nameCol ? String(row[nameCol] || '').trim() : undefined,
      credits: credits > 0 ? credits : 3,
      grade,
      status: mapGradeToStatus(grade),
      semester: semesterCol ? String(row[semesterCol] || '').trim() : undefined,
      category: categoryCol ? String(row[categoryCol] || '').trim() : undefined
    });
  }
  
  return {
    success: courses.length > 0,
    courses,
    errors: courses.length === 0 ? ['No valid courses found in file'] : [],
    warnings
  };
}

function mapGradeToStatus(grade: string): ParsedCourse['status'] {
  const normalized = grade.toUpperCase().trim();
  
  // Failed grades
  if (['F', 'FAIL', 'FAILED'].includes(normalized)) return 'failed';
  
  // Withdrawn
  if (['W', 'WD', 'WITHDRAWN', 'DROPPED'].includes(normalized)) return 'withdrawn';
  
  // In Progress
  if (['IP', 'IN_PROGRESS', 'INPROGRESS', 'TAKING', 'CURRENT', 'I'].includes(normalized)) 
    return 'in_progress';
  
  // Planned
  if (['P', 'PLANNED', 'PLANNING', 'FUTURE', '-'].includes(normalized)) return 'planned';
  
  // Completed (letter grades)
  const letterGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'S', 'PASS'];
  if (letterGrades.includes(normalized)) return 'completed';
  
  // Default to completed if it looks like a grade
  if (/^[A-D][+-]?$/.test(normalized)) return 'completed';
  
  return 'completed'; // Default assumption
}
```

---

## 5. Error Handling & Validation

### 5.1 Possible Errors

| Error Type | Source | Message | Severity |
|------------|--------|---------|----------|
| `INVALID_FILE_FORMAT` | Upload | File format not supported | Error |
| `FILE_TOO_LARGE` | Upload | File exceeds 5MB limit | Error |
| `EMPTY_FILE` | Parse | No data found in file | Error |
| `MISSING_COLUMNS` | Parse | Required columns missing | Error |
| `INVALID_COURSE_CODE` | Validation | Course code not in curriculum | Warning |
| `UNKNOWN_COURSE` | Validation | Course {code} not recognized | Warning |
| `CREDIT_MISMATCH` | Validation | Credits for {code} don't match curriculum | Warning |
| `PREREQUISITE_NOT_MET` | Validation | {code} requires {prereq} first | Warning |
| `BLACKLIST_VIOLATION` | Validation | Cannot take both {code1} and {code2} | Error |
| `CREDIT_SHORTAGE` | Graduation | Missing {n} credits for graduation | Error |
| `CATEGORY_INCOMPLETE` | Graduation | {category} requirements not met | Error |
| `PORTAL_EXPIRED` | Session | Portal deadline has passed | Error |
| `INVALID_PIN` | Auth | Incorrect access PIN | Error |
| `SESSION_EXPIRED` | Cache | Submission data expired, please re-submit | Error |

### 5.2 Validation Pipeline

```typescript
// Validation stages (run in order)
const validationPipeline = [
  // Stage 1: Format Validation (Client-side)
  'validateFileFormat',      // Check file type
  'validateFileSize',        // Check < 5MB
  'validateColumns',         // Check required columns exist
  
  // Stage 2: Data Validation (Client-side)
  'validateCourseFormats',   // Check course codes are valid format
  'validateGradeFormats',    // Check grades are recognized
  'validateCredits',         // Check credits are numbers
  
  // Stage 3: Curriculum Validation (Server-side)
  'matchCoursesToCurriculum', // Map submitted courses to curriculum
  'validatePrerequisites',    // Check prerequisite chains
  'validateBlacklists',       // Check for banned combinations
  'validateCorequisites',     // Check co-requisites taken together
  
  // Stage 4: Graduation Calculation (Server-side)
  'calculateCategoryProgress', // Credits per category
  'calculateTotalCredits',     // Total completed/planned
  'evaluateElectiveRules',     // Special elective requirements
  'determineGraduationEligibility' // Final eligibility check
];
```

---

## 6. Security Considerations

### 6.1 PIN Security

```php
// Laravel: PIN hashing and validation

// When creating portal
$portal->pin = bcrypt($rawPin);
$portal->pin_hint = substr($rawPin, 0, 2) . '****'; // Show hint

// When validating
if (!Hash::check($inputPin, $portal->pin)) {
    throw new InvalidPinException();
}

// Rate limiting: Max 5 attempts per portal per IP per 15 min
RateLimiter::tooManyAttempts("portal:{$portalId}:{$ip}", 5);
```

### 6.2 Session Security

```php
// Generate secure session token after PIN validation
$sessionToken = Str::random(64);
Cache::put(
    "submission_session:{$sessionToken}",
    [
        'portal_id' => $portalId,
        'created_at' => now(),
        'ip' => request()->ip(),
    ],
    now()->addMinutes(15)
);

// Validate on each request
$session = Cache::get("submission_session:{$token}");
if (!$session || $session['ip'] !== request()->ip()) {
    throw new SessionInvalidException();
}
```

### 6.3 Data Sanitization

```php
// Sanitize all course data before processing
$courses = collect($request->input('courses'))->map(function ($course) {
    return [
        'code' => Str::upper(Str::limit(preg_replace('/[^A-Za-z0-9 ]/', '', $course['code']), 20)),
        'name' => Str::limit(strip_tags($course['name'] ?? ''), 100),
        'credits' => min(max((int) $course['credits'], 0), 12),
        'grade' => Str::upper(Str::limit(preg_replace('/[^A-Za-z+-]/', '', $course['grade']), 5)),
        'status' => in_array($course['status'], ['completed', 'in_progress', 'planned', 'failed', 'withdrawn']) 
            ? $course['status'] 
            : 'completed',
    ];
});
```

---

## 7. UI/UX Enhancements

### 7.1 Student Side Improvements

1. **Progress Stepper**: Visual steps showing submission progress
2. **File Preview**: Show parsed courses before submission
3. **Validation Feedback**: Real-time validation as user uploads
4. **Template Download**: Provide Excel template with correct columns
5. **Recent Portals**: Remember recently accessed portals

### 7.2 CP/Advisor Side Improvements

1. **Real-time Notifications**: Push notifications for new submissions
2. **Bulk Actions**: Select multiple submissions for batch operations
3. **Sorting & Filtering**: Filter by status, date, eligibility
4. **Export Options**: PDF reports, Excel summaries
5. **Data Expiry Countdown**: Clear visibility of when data will be purged
6. **Submission Statistics**: Dashboard with charts showing stats

### 7.3 Shared Components Needed

```
src/components/graduation-portal/
├── FileParser.tsx           # Excel/CSV parsing component
├── CoursePreview.tsx        # Preview of parsed courses
├── ValidationResults.tsx    # Display validation errors/warnings
├── ProgressDonut.tsx        # Circular progress chart
├── CategoryBreakdown.tsx    # Progress by category
├── GraduationStatus.tsx     # Eligibility badge/card
├── SubmissionCard.tsx       # Submission list item
├── PortalCard.tsx           # Portal list item
├── ExpiryCountdown.tsx      # Time remaining display
└── TemplateDownload.tsx     # Download Excel template button
```

---

## 8. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Create database schema for portals (without submission storage)
- [ ] Implement Laravel cache/Redis for temporary storage
- [ ] Build API endpoints for portal CRUD
- [ ] Create PIN generation and validation
- [ ] Set up WebSocket/SSE for real-time updates

### Phase 2: Student Submission Flow (Week 2)
- [ ] Build file parser utility (client-side)
- [ ] Create submission form with validation
- [ ] Implement curriculum selection
- [ ] Add file preview before submission
- [ ] Connect to backend submission API

### Phase 3: Validation Engine (Week 3)
- [ ] Port existing courseValidation.ts logic to backend
- [ ] Implement category progress calculation
- [ ] Add prerequisite validation
- [ ] Integrate blacklist checking
- [ ] Build graduation eligibility algorithm

### Phase 4: CP/Advisor Dashboard (Week 4)
- [ ] Build real-time submission dashboard
- [ ] Implement single submission detail view
- [ ] Add batch processing capability
- [ ] Create PDF report generation
- [ ] Add export to Excel functionality

### Phase 5: Polish & Testing (Week 5)
- [ ] Add advisor access to portals (role-based)
- [ ] Implement data expiry warnings
- [ ] Add download templates
- [ ] Comprehensive testing
- [ ] Documentation and user guides

---

## 9. API Endpoints

### Portal Management (Authenticated - CP/Advisor only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/graduation-portals` | List portals for user's department |
| `POST` | `/api/graduation-portals` | Create new portal |
| `GET` | `/api/graduation-portals/{id}` | Get portal details |
| `PUT` | `/api/graduation-portals/{id}` | Update portal |
| `DELETE` | `/api/graduation-portals/{id}` | Delete portal |
| `POST` | `/api/graduation-portals/{id}/close` | Close portal |
| `POST` | `/api/graduation-portals/{id}/regenerate-pin` | Generate new PIN |

### Student Submission (PIN-authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/public/graduation-portals` | List active portals (public) |
| `POST` | `/api/graduation-portals/{id}/verify-pin` | Verify PIN, get session |
| `POST` | `/api/graduation-portals/{id}/submit` | Submit course data |
| `GET` | `/api/graduation-portals/{id}/curricula` | Get available curricula |

### Submission Processing (Authenticated - CP/Advisor only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/graduation-portals/{id}/submissions` | List submissions |
| `GET` | `/api/graduation-submissions/{submissionId}` | Get submission details |
| `POST` | `/api/graduation-submissions/{submissionId}/validate` | Trigger validation |
| `POST` | `/api/graduation-submissions/batch-validate` | Batch validation |
| `GET` | `/api/graduation-submissions/{submissionId}/report` | Download PDF report |
| `POST` | `/api/graduation-submissions/{submissionId}/approve` | Approve submission |
| `POST` | `/api/graduation-submissions/{submissionId}/reject` | Reject submission |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `submission.new` | Server → Client | Submission metadata |
| `submission.validated` | Server → Client | Validation results |
| `submission.expired` | Server → Client | Expiry notification |

---

## 10. Database Schema

### 10.1 Persistent Storage (Database)

```sql
-- Only store portal metadata, NOT submission data

CREATE TABLE graduation_portals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id),
    curriculum_id UUID NOT NULL REFERENCES curricula(id),
    created_by UUID NOT NULL REFERENCES users(id),
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    batch VARCHAR(50),
    
    pin_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
    pin_hint VARCHAR(10),            -- e.g., "GR****"
    
    deadline TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',  -- active, closed, archived
    
    accepted_formats JSONB DEFAULT '["xlsx", "xls", "csv"]',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Index for fast lookup
CREATE INDEX idx_graduation_portals_department ON graduation_portals(department_id);
CREATE INDEX idx_graduation_portals_status ON graduation_portals(status);

-- Audit log for portal actions (optional)
CREATE TABLE graduation_portal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_id UUID NOT NULL REFERENCES graduation_portals(id),
    action VARCHAR(50) NOT NULL,  -- created, closed, pin_regenerated, etc.
    performed_by UUID REFERENCES users(id),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10.2 Temporary Storage (Cache/Redis)

```php
// Cache key structure for submissions

// Submission data (TTL: 30 minutes)
"grad_submission:{submission_id}" => [
    'portal_id' => 'uuid',
    'student_identifier' => 'Student Name or ID',
    'curriculum_id' => 'uuid',
    'courses' => [
        ['code' => 'CS101', 'credits' => 3, 'grade' => 'A', 'status' => 'completed'],
        // ...
    ],
    'submitted_at' => '2026-01-20T10:30:00Z',
    'validated' => false,
    'validation_result' => null,
    'expires_at' => '2026-01-20T11:00:00Z'
]

// Session tokens (TTL: 15 minutes)
"submission_session:{token}" => [
    'portal_id' => 'uuid',
    'ip' => '192.168.1.1',
    'created_at' => '2026-01-20T10:30:00Z'
]

// Active submissions list per portal (for dashboard)
"portal_submissions:{portal_id}" => [
    'submission_id_1',
    'submission_id_2',
    // ...
]
```

---

## Summary

This implementation plan provides a PDPA-compliant solution for the Graduation Portal by:

1. **Never storing academic data in the database** - only portal metadata
2. **Using temporary cache storage** with automatic expiration (15-30 minutes)
3. **Processing files client-side** and sending only JSON data
4. **Real-time streaming** to CP/Advisor dashboards
5. **Leveraging existing validation logic** from courseValidation.ts

The main trade-off is that CP/Advisors need to process submissions while they're still in the cache window, or students need to re-submit. This is acceptable for a graduation check workflow where timely review is expected.

---

*Document Version: 1.0*
*Created: January 2026*
*Author: GitHub Copilot*

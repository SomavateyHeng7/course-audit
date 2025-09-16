# Student Course Audit Flow Implementation Plan

## 📋 Overview

This document outlines the implementation plan for enhancing the student course audit system to provide a comprehensive flow from course selection to progress tracking and rule-based recommendations.

## 🎯 Current State Analysis

### **Data Entry Page** (`src/app/management/data-entry/page.tsx`)
**✅ Current Features:**
- Faculty, Department, Curriculum, and Concentration selection
- Course listing organized by default categories (General Education, Core Courses, Major, Major Elective, Free Elective)
- Status tracking for courses: `not_completed`, `completed`, `taking`, `planning`
- Grade assignment for completed courses (A, A-, B+, B, B-, C+, C, C-, D, S)
- Excel export functionality for course data
- Context-based state management shared with progress page

**⚠️ Current Limitations:**
- Uses hardcoded mock data for most curricula (except BSCS 2022 which fetches real data)
- Course categories are hardcoded, not fetched from department-specific course types
- No integration with actual curriculum-based course type assignments
- No prerequisite/corequisite checking or display
- Limited Excel upload functionality (exists but not integrated with this flow)

### **Progress Page** (`src/app/management/progress/page.tsx`)
**✅ Current Features:**
- Visual progress bar with percentage completion
- GPA calculation based on completed courses
- Statistics by category (completed/total courses per type)
- Lists of courses by status (completed, taking, planning, pending)
- PDF export functionality for progress reports
- Credit tracking (earned vs. required)

**⚠️ Current Limitations:**
- Uses same hardcoded mock data as data entry
- No rule-based recommendations
- No prerequisite validation or suggestions
- Static total credit requirement (132 credits hardcoded)

### **Existing API Infrastructure**
**✅ Available APIs:**
- `/api/curricula` - Full curriculum management
- `/api/courses` - Global course pool management
- `/api/course-types` - Department-specific course types
- `/api/course-types/assign` - Bulk course type assignment
- `/api/courses/[courseId]/prerequisites` - Course prerequisites
- `/api/courses/[courseId]/corequisites` - Course corequisites
- `/api/curriculum/[id]/courses/[courseId]/prerequisites` - Curriculum-specific prerequisites
- `/api/curriculum/[id]/courses/[courseId]/corequisites` - Curriculum-specific corequisites

**✅ Excel Upload Infrastructure:**
- `ExcelUpload` component with file processing
- `ExcelUtils` for parsing Excel/CSV files
- Support for course data import with grades and status

## 🚀 Proposed Implementation Plan

### **Phase 1: Core Infrastructure Enhancement**

#### **1.1 Dynamic Course Type Integration**
**Goal:** Replace hardcoded categories with department-specific course types

**Changes Required:**
- **Data Entry Page:**
  ```typescript
  // Replace hardcoded courseTypeOrder with dynamic fetching
  const [courseTypes, setCourseTypes] = useState<CourseTypeData[]>([]);
  
  useEffect(() => {
    const fetchCourseTypes = async () => {
      if (selectedDepartment) {
        const response = await fetch(`/api/course-types?departmentId=${selectedDepartment}`);
        const data = await response.json();
        setCourseTypes(data.courseTypes);
      }
    };
    fetchCourseTypes();
  }, [selectedDepartment]);
  ```

- **Course Categorization API:**
  ```typescript
  // New API endpoint: /api/curriculum/[id]/courses-with-types
  // Returns courses grouped by their assigned course types for the department
  ```

#### **1.2 Real Curriculum Data Integration**
**Goal:** Fetch actual curriculum data instead of using mock data

**Implementation:**
- Integrate with existing `/api/curricula/[id]` endpoint
- Create course grouping logic based on department course type assignments
- Handle concentration-specific course filtering

**New API Endpoints Needed:**
```typescript
// GET /api/curriculum/[id]/courses-categorized
// Returns curriculum courses grouped by department course types
{
  coursesByType: {
    [courseTypeId]: {
      courseType: CourseTypeData,
      courses: CourseWithAssignment[]
    }
  },
  concentrationCourses?: ConcentrationCourse[],
  totalCredits: number,
  requirements: CurriculumRequirements
}
```

### **Phase 2: Excel Upload Enhancement**

#### **2.1 Smart Course Status Import**
**Goal:** Allow students to upload their transcript and automatically populate course statuses

**Real CSV Structure Analysis:**
```csv
Course Name,Code,Credits,Grade,Remark,,,
General Education Courses (30 Credits),,,,,,,
E1,ELE 1001,3,A,,,,
E2,ELE 1002,3,A,,,,
Thai Language for Multicultural Communication,GE 1411 ,2,A,,,,
Human Civilizations and Global Citizens (2-0-4),GE 2110 ,2,taking,,,,
Core Courses (18 Credits),,,,,,,
CSX 2003 Principles of Statistics (3-0-6),,3,A,,,,
CSX 3010 Senior Project I (0-9-0) (*),,3,Taking,,,,
```

**Parsing Requirements:**
- **Category Detection:** Skip rows containing "Credits)" pattern
- **Course Code Extraction:** Handle spacing variations (ELE 1001 → ELE1001)
- **Status Mapping:** 
  - `taking` / `Taking` → `IN_PROGRESS`
  - Grade present → `COMPLETED`
  - Empty grade + empty status → `PENDING`
- **Data Cleaning:** Filter out notation numbers, handle inconsistent formatting

**Enhanced Excel/CSV Parser:**
```typescript
interface ParsedCourseData {
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PENDING' | 'FAILED' | 'DROPPED';
  category?: string; // Extracted from section headers
}

const parseTranscriptCSV = (csvData: string[][]) => {
  const courses: ParsedCourseData[] = [];
  let currentCategory = '';
  
  for (const row of csvData) {
    const [courseName, code, credits, grade, remark] = row;
    
    // Skip category headers
    if (courseName?.includes('Credits)')) {
      currentCategory = extractCategoryName(courseName);
      continue;
    }
    
    // Skip empty or notation rows
    if (!code || !courseName || courseName.match(/^[E]\d+$/)) continue;
    
    // Parse course data
    const courseCode = standardizeCourseCode(code); // "ELE 1001" → "ELE1001"
    const status = determineStatus(grade, remark);
    
    courses.push({
      courseCode,
      courseName: cleanCourseName(courseName),
      credits: parseInt(credits) || 0,
      grade: grade || undefined,
      status,
      category: currentCategory
    });
  }
  
  return courses;
};

const determineStatus = (grade?: string, remark?: string): StudentCourseStatus => {
  if (remark?.toLowerCase().includes('taking')) return 'IN_PROGRESS';
  if (grade && grade.trim()) return 'COMPLETED';
  return 'PENDING';
};
```

#### **2.2 Import Validation & Conflict Resolution**
**Features:**
- Show preview before importing
- Handle duplicate course codes
- Validate grades against grading scale
- Warn about prerequisites not being met

### **Phase 3: Rule-Based Recommendations Engine**

#### **3.1 Prerequisite Analysis**
**Goal:** Analyze incomplete courses and check prerequisite requirements using existing APIs

**Implementation:**
```typescript
// Use existing API endpoints
class CourseRecommendationService {
  static async getEligibleCourses(
    curriculumId: string, 
    completedCourseIds: string[], 
    inProgressCourseIds: string[]
  ) {
    // 1. Fetch curriculum with all courses and constraints
    const curriculum = await fetch(`/api/curricula/${curriculumId}`);
    
    // 2. Get course prerequisites using existing endpoints
    // GET /api/courses/[courseId]/prerequisites
    
    // 3. Check curriculum constraints
    // GET /api/curricula/[id]/constraints
    
    // 4. Apply blacklist filtering  
    // GET /api/curricula/[id]/blacklists
    
    // 5. Validate elective rules
    // GET /api/curricula/[id]/elective-rules
    
    return eligibleCourses;
  }
}
```

**New API Endpoints Needed:**
```typescript
// GET /api/curricula/[id]/student-analysis
// POST body: { completedCourses: string[], inProgressCourses: string[] }
{
  eligibleCourses: CourseWithReason[],
  blockedCourses: CourseWithReason[],
  constraintViolations: ConstraintCheck[],
  electiveProgress: ElectiveRuleStatus[],
  recommendedNext: CourseWithPriority[]
}
```

#### **3.2 Credit Requirement Analysis**
**Features:**
- Track progress toward graduation requirements
- Analyze category-specific credit requirements (from elective rules)
- Identify minimum courses needed per category
- Calculate optimal semester planning

#### **3.3 Graduation Timeline Prediction**
**Features:**
- Calculate minimum semesters to graduation
- Consider course availability (fall/spring only courses)
- Factor in prerequisite chains
- Generate semester-by-semester plan

### **Phase 4: Enhanced Progress Tracking**

#### **4.1 Dynamic Progress Visualization**
**Goal:** Replace static progress tracking with rule-based progress

**Features:**
- **Category Progress:** Show progress for each department course type
- **Prerequisite Chains:** Visualize prerequisite relationships
- **Critical Path:** Highlight courses that block the most other courses
- **Elective Requirements:** Track elective credit requirements from curriculum rules

#### **4.2 Smart Notifications**
**Features:**
- Warn about courses that should be taken soon (due to prerequisite chains)
- Alert about upcoming deadlines for course registration
- Notify about completed prerequisites enabling new courses

#### **4.3 Advanced Excel Export**
**Goal:** Generate comprehensive academic planning spreadsheet

**Features:**
- Current progress summary
- Recommended course sequence
- Prerequisite analysis
- Credit tracking by category
- Graduation timeline

### **Phase 5: User Experience Enhancements**

#### **5.1 Course Planning Interface**
**Features:**
- Drag-and-drop semester planning
- Real-time prerequisite validation
- Course conflict detection (scheduling)
- Credit limit warnings

#### **5.2 Integration with Course Catalog**
**Features:**
- Course descriptions and details
- Professor ratings (if available)
- Historical grade distributions
- Course availability by semester

#### **5.3 Progress Sharing**
**Features:**
- Share progress with academic advisors
- Generate advisor meeting reports
- Export for transfer credit evaluation

## � Data Storage Strategy

### **Anonymous Student Session Management**

**No Database Changes Required** - Using existing schema with session-based storage:

```typescript
// Session-based data structure (no persistent storage)
interface StudentSession {
  selectedFaculty: string;
  selectedDepartment: string; 
  selectedCurriculum: string;
  selectedConcentration?: string;
  courseCompletions: {
    [courseId: string]: {
      status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'DROPPED' | 'PENDING';
      grade?: string;
      semester?: string;
      year?: number;
      credits?: number;
    }
  };
  lastUpdated: string;
}
```

**Storage Approach:**
- **Browser LocalStorage:** Persist data across sessions
- **Context State Management:** Share state between data-entry and progress pages
- **Excel Export/Import:** Allow data backup and restoration
- **No User Authentication:** Completely anonymous operation

## 🔄 Implementation Timeline

### **Week 1-2: Phase 1**
- Implement dynamic course type fetching
- Create course categorization API
- Replace mock data with real curriculum integration

### **Week 3: Phase 2** 
- Enhance Excel upload functionality
- Implement course matching and validation
- Add import preview and conflict resolution

### **Week 4-5: Phase 3**
- Build prerequisite analysis engine
- Create recommendation API endpoints
- Implement credit requirement tracking

### **Week 6: Phase 4**
- Enhance progress visualization
- Add smart notifications
- Improve Excel export functionality

### **Week 7: Phase 5**
- Polish user experience
- Add advanced planning features
- Implement progress sharing

## 💡 Success Metrics

1. **Data Accuracy:** Real curriculum data replaces all mock data
2. **User Efficiency:** Excel upload reduces manual entry time by 80%
3. **Rule Compliance:** 100% prerequisite validation accuracy
4. **Planning Quality:** Recommended sequences result in on-time graduation
5. **User Adoption:** Students actively use the planning features

## 🔗 Integration Points

- **Course Types Management:** Integrates with chairperson course type configuration
- **Curriculum Management:** Uses existing curriculum and course APIs
- **Academic Planning:** Could integrate with university registration systems
- **Advising Workflow:** Progress reports for academic advisors

This implementation will transform the current basic course tracking into a comprehensive academic planning and audit system that provides intelligent recommendations and streamlined data entry.

---

## 🚨 CRITICAL LOOPHOLES AND MISSING CONSIDERATIONS

### **1. Database Schema Mismatch - MAJOR ISSUE**

**Problem:** Our current implementation plan suggests creating new tables, but the schema already has a robust `StudentCourse` model:

```prisma
model StudentCourse {
  id        String              @id @default(cuid())
  studentId String
  courseId  String
  status    StudentCourseStatus // IN_PROGRESS, COMPLETED, FAILED, DROPPED, PENDING
  grade     String?
  semester  String?
  year      Int?
  credits   Int?
  // ... existing fields
}

enum StudentCourseStatus {
  IN_PROGRESS  // = "taking"
  COMPLETED    // = "completed" 
  FAILED       // New status not in our plan
  DROPPED      // New status not in our plan
  PENDING      // = "not_completed" or "planning"
}
```

**Fix Required:**
- **Use existing `StudentCourse` table** instead of creating new ones
- **Map status enums properly:** `IN_PROGRESS` ↔ `taking`, `COMPLETED` ↔ `completed`, `PENDING` ↔ `planning/not_completed`
- **Handle new statuses:** `FAILED` and `DROPPED` courses need UI consideration
- **Leverage existing relationships:** Already has user and course foreign keys

### **2. Comprehensive Curriculum Constraints - MISSING**

**Major Gap:** Our plan underestimates the complexity of curriculum constraints from the schema:

```prisma
enum CurriculumConstraintType {
  MINIMUM_GPA          // GPA requirements for courses/graduation
  SENIOR_STANDING      // Credit threshold requirements  
  TOTAL_CREDITS        // Overall credit requirements
  CATEGORY_CREDITS     // Credits per course type (Major, Elective, etc.)
  CUSTOM               // Flexible constraint system
}

model CurriculumConstraint {
  type         CurriculumConstraintType
  name         String
  description  String?
  isRequired   Boolean @default(true)
  config       Json?   // Complex configuration data
}
```

**Missing from Our Plan:**
- **MINIMUM_GPA constraints:** Some courses require minimum GPA to take
- **SENIOR_STANDING requirements:** Credit thresholds for advanced courses  
- **CATEGORY_CREDITS rules:** Minimum credits required per course type
- **CUSTOM constraints:** Flexible rule system with JSON configuration
- **Constraint validation engine:** Check if student meets requirements before recommending courses

### **3. Advanced Course Attributes - OVERLOOKED**

**From Schema Analysis:**
```prisma
model Course {
  requiresPermission     Boolean @default(false)  // Instructor permission required
  summerOnly             Boolean @default(false)  // Only offered in summer
  requiresSeniorStanding Boolean @default(false)  // Needs senior status
  minCreditThreshold     Int?                     // Minimum credits to take
}
```

**Missing from Our Recommendation Engine:**
- **Permission-required courses:** Cannot auto-recommend, need manual approval
- **Summer-only courses:** Affects semester planning algorithms
- **Senior standing requirements:** Must check credit completion before recommending
- **Credit threshold validation:** Prevent taking advanced courses too early

### **4. Faculty-Wide Data Access - SIMPLIFIED**

**Simplified Approach:** Since students are anonymous and can freely select any faculty/department/curriculum combination, we don't need complex cross-department access control. Students simply choose their desired curriculum from available options through the existing dropdown selectors.

**No Changes Required:** Current selection mechanism already supports this use case.

### **5. Blacklist System Integration - CRITICAL MISSING**

**From Schema:**
```prisma
model CurriculumBlacklist {
  curriculumId String
  blacklistId  String
  // Blacklists are applied per curriculum
}
```

**Missing from Student Audit:**
- **Blacklist course filtering:** Must exclude blacklisted courses from recommendations
- **Warning system:** Alert if student tries to take blacklisted courses
- **Curriculum-specific application:** Same course may be blacklisted in one curriculum but not another

### **6. Elective Rules Complexity - UNDERESTIMATED**

**From Elective Rules API:**
```typescript
model ElectiveRule {
  curriculumId    String
  category        String           // Course type category
  requiredCredits Int              // Minimum credits needed
  description     String?          // Complex rule descriptions
}
```

**Advanced Elective Scenarios:**
- **Category-specific minimums:** "Must take 15 credits of Major Electives"
- **Cross-category rules:** "Choose 2 from Math OR Science categories"  
- **Exclusion rules:** "Free electives cannot be from your major department"
- **Prerequisite chains in electives:** Elective courses may have prerequisites

### **7. Real-World Course Scheduling - MISSING**

**From Course Schema Analysis:**
- **Credit hour formatting:** "3-0-6" (lecture-lab-total) affects scheduling
- **Semester availability:** Not all courses offered every semester
- **Course capacity limitations:** Popular courses may be full
- **Time conflict detection:** Multiple courses same time slot

### **8. Excel Import Status Mapping - REQUIRES ALIGNMENT**

**Current Frontend Uses:**
```typescript
status: 'not_completed' | 'completed' | 'taking' | 'planning'
```

**Database Schema Uses:**
```typescript
enum StudentCourseStatus {
  IN_PROGRESS, COMPLETED, FAILED, DROPPED, PENDING
}
```

**Required Status Mapping:**
- `taking` → `IN_PROGRESS`
- `completed` → `COMPLETED`  
- `planning` → `PENDING`
- `not_completed` → `PENDING`
- **New:** Handle `FAILED` and `DROPPED` status options in Excel import and UI

### **9. Grade System Integration - GAPS**

**Current Implementation:**
```typescript
gradeOptions: ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'S']
```

**Missing Considerations:**
- **Failed courses:** How to handle F grades and retakes
- **Pass/Fail courses:** S grade handling in GPA calculation  
- **Transfer credits:** Courses from other institutions
- **Grade replacement policies:** Retaking courses for better grades

### **10. Department Course Type Assignment - CRITICAL**

**From Schema:**
```prisma
model DepartmentCourseType {
  courseId     String
  departmentId String  
  courseTypeId String
  // Course types are department-specific assignments
}
```

**Massive Impact:**
- **Course categorization:** Same course may have different types in different departments
- **Cross-department courses:** Course shared across departments with different categorizations
- **Dynamic category display:** Must fetch course type assignments, not use hardcoded categories

## 🔧 FINALIZED IMPLEMENTATION APPROACH

### **✅ IMMEDIATE PRIORITIES (Week 1-2):**
1. **Status enum alignment:** Map frontend statuses to `StudentCourseStatus` enum
2. **Dynamic course type fetching:** Replace hardcoded categories with department-specific types
3. **Use existing schema:** Leverage `StudentCourse` model structure for session data
4. **Enhanced Excel upload:** Support full status mapping including FAILED/DROPPED

### **🚀 CORE FEATURES (Week 3-4):**
1. **Prerequisite analysis engine:** Use existing `/api/courses/[courseId]/prerequisites` endpoints
2. **Constraint validation:** Integrate `/api/curricula/[id]/constraints` for rule checking
3. **Blacklist filtering:** Apply curriculum-specific blacklists from `/api/curricula/[id]/blacklists`
4. **Elective rules tracking:** Monitor progress against `/api/curricula/[id]/elective-rules`

### **💡 ADVANCED FEATURES (Week 5-6):**
1. **Course attribute handling:** Consider `requiresPermission`, `summerOnly`, `requiresSeniorStanding`
2. **Smart recommendations:** Generate eligible course suggestions based on all rules
3. **Progress visualization:** Dynamic charts showing constraint compliance and requirement progress
4. **Excel export enhancement:** Comprehensive academic planning spreadsheets

### **📋 SUCCESS CRITERIA:**
- ✅ Real curriculum data replaces all mock data
- ✅ Excel upload handles all status types and course matching
- ✅ Prerequisite and constraint validation accuracy
- ✅ Anonymous session management with LocalStorage persistence
- ✅ Integration with existing curriculum management APIs

**This finalized plan leverages the existing robust database schema and API infrastructure while adding the intelligent features needed for comprehensive student academic planning.**

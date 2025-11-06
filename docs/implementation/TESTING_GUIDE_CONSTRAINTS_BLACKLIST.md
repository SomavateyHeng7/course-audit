# Testing Guide: Constraints & Blacklist Validation

## 🎯 Overview
This guide provides step-by-step testing procedures for validating constraints and blacklist enforcement in the student-side course audit system.

---

## 📋 Test 1: Blacklist Enforcement Testing

### Prerequisites
- Student has transcript data imported
- Curriculum has assigned blacklist rules
- Access to progress page

### Test Steps

#### 1.1 Test Blacklist Violations in Completed Courses
1. **Navigate to Course Entry page**
2. **Import transcript with conflicting courses:**
   - Add courses that are in the same blacklist (e.g., CSX4001 and CSX4010 if they're blacklisted together)
   - Ensure both courses are marked as "completed"
3. **Save and navigate to Progress page**
4. **Expected Result:**
   - Orange warning banner should appear at top of progress page
   - Warning message should specify the blacklist violation
   - Message format: "⚠️ Blacklist Violation: You have completed multiple courses from [Blacklist Name] blacklist: [Course1], [Course2]. This may affect your graduation requirements."

#### 1.2 Test Blacklist Prevention in Course Planning
1. **Navigate to Course Planning page**
2. **Try to add a course that conflicts with completed courses:**
   - Select a course that's blacklisted with an already completed course
   - Attempt to add it to your plan
3. **Expected Result:**
   - Course should show "🚫 Blocked" status
   - "Add to Plan" button should be disabled
   - Red warning text should appear: "Cannot add [Course] - conflicts with completed course [ConflictingCourse]"

#### 1.3 Test Valid Course Addition
1. **In Course Planning page**
2. **Add a course with no blacklist conflicts**
3. **Expected Result:**
   - Course should add successfully
   - No blocking warnings
   - Course appears in planned courses list

---

## 📋 Test 2: Constraint Validation Testing

### Prerequisites
- Student has transcript data imported
- Curriculum has defined constraints (prerequisites, corequisites, etc.)
- Access to progress page with enhanced validation

### Test Steps

#### 2.1 Test Prerequisite Validation
1. **Navigate to Progress page**
2. **Check Enhanced Validation sections:**
   - Look for "Validation Errors" (red section)
   - Look for "Academic Warnings" (yellow section)
3. **Expected Results:**
   - **Errors**: Missing critical prerequisites for completed courses
   - **Warnings**: Recommended but not required prerequisites
   - **Format**: Clear description of which courses need which prerequisites

#### 2.2 Test Corequisite Validation
1. **In Progress page, check validation sections**
2. **Expected Results:**
   - Errors for courses taken without required corequisites
   - Warnings for courses that should be taken together
   - Specific course codes mentioned in error messages

#### 2.3 Test Course Sequence Constraints
1. **Review Academic Warnings section**
2. **Expected Results:**
   - Warnings about taking advanced courses before foundational ones
   - Semester/year sequence recommendations
   - Clear explanation of proper course progression

---

## 📋 Test 3: Elective Rules Validation

### Test Steps

#### 3.1 Test Minimum Elective Requirements
1. **Navigate to Progress page**
2. **Check Enhanced Progress Analysis section (purple)**
3. **Verify Elective Progress subsection:**
   - Free Electives: X / Y credits
   - Major Electives: X / Y credits
   - "Z credits remaining" for each category

#### 3.2 Test Maximum Elective Limits
1. **Check Academic Warnings section**
2. **Expected Results:**
   - Warnings if student exceeds recommended elective limits
   - Suggestions for course distribution balance

#### 3.3 Test Elective Category Validation
1. **Review validation warnings for:**
   - Courses miscategorized as electives
   - Required courses counted as electives
   - Proper elective credit distribution

---

## 📋 Test 4: Course Recommendations Engine

### Test Steps

#### 4.1 Test Recommendation Display
1. **Navigate to Progress page**
2. **Check "Course Recommendations" section (blue)**
3. **Expected Elements:**
   - Course code and name
   - Priority level (High/Medium/Low)
   - Credit hours
   - Reason for recommendation
   - Prerequisites (if any)

#### 4.2 Test Recommendation Logic
1. **Verify recommendations include:**
   - Missing required courses
   - Next logical courses in sequence
   - Courses needed for graduation
   - Electives that fit student's track

#### 4.3 Test Recommendation Priorities
1. **Check priority levels make sense:**
   - **High Priority**: Required courses, graduation blockers
   - **Medium Priority**: Recommended sequence courses
   - **Low Priority**: Additional electives, optional courses

---

## 📋 Test 5: Comprehensive Progress Analysis

### Test Steps

#### 5.1 Test Enhanced Progress Display
1. **Navigate to Progress page**
2. **Check "Enhanced Progress Analysis" section (purple)**
3. **Verify displays:**
   - Total credits completed + in progress
   - Overall progress percentage
   - Graduation eligibility status (✅ or ⏳)

#### 5.2 Test Category Progress Details
1. **In Enhanced Progress section**
2. **Check category breakdown shows:**
   - Completed courses per category
   - In-progress courses per category
   - Required courses per category
   - Remaining courses needed

#### 5.3 Test Graduation Eligibility
1. **Check graduation status indicator**
2. **Expected Results:**
   - ✅ "Eligible" if all requirements met
   - ⏳ "In Progress" if requirements pending
   - Clear indication of what's needed for graduation

---

## 🔧 Troubleshooting Common Issues

### Issue 1: No Validation Warnings Appear
- **Check**: Curriculum has assigned blacklists/constraints
- **Check**: Student data is properly loaded
- **Check**: Browser console for validation errors

### Issue 2: Incorrect Course Categories
- **Check**: Curriculum departmentCourseTypes mapping
- **Check**: Course data includes proper department course type
- **Check**: API returns correct course structure

### Issue 3: Wrong Credit Calculations
- **Check**: Credit parsing from "2-0-4" format to individual numbers
- **Check**: Course credits are numeric, not concatenated strings
- **Check**: Total calculations use parsed credit values

---

## 📊 Expected Validation Sections on Progress Page

1. **Course Conflict Warnings** (Orange) - Blacklist violations
2. **Validation Errors** (Red) - Critical issues requiring attention
3. **Academic Warnings** (Yellow) - Important but non-critical issues
4. **Course Recommendations** (Blue) - Intelligent course suggestions
5. **Enhanced Progress Analysis** (Purple) - Detailed curriculum progress

---

## ✅ Success Criteria

- [ ] Blacklist violations properly detected and displayed
- [ ] Constraint validation shows appropriate errors/warnings
- [ ] Elective rules enforced with clear feedback
- [ ] Course recommendations are relevant and helpful
- [ ] Progress analysis shows accurate completion status
- [ ] All sections display appropriate content based on student data
- [ ] No console errors during validation process
- [ ] Validation updates when course data changes
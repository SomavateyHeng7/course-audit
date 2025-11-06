# Transcript Import Course Display Issue - Debugging Plan

## Problem Summary
The transcript import functionality is working correctly (courses are being parsed and added to `completedCourses` state), but imported courses are not appearing in the course category sections on the data-entry page.

## Root Cause Analysis
Based on console logs from debugging session:

### ✅ What's Working:
1. **Curriculum Data Loading**: 68 courses loaded from database
2. **Transcript Parsing**: Courses successfully parsed and imported
3. **State Updates**: `completedCourses` state correctly updated with imported courses
4. **API Calls**: `/api/public-curricula` working without authentication issues

### ❌ The Issue:
**Category Mismatch**: All curriculum courses are being categorized as "General" instead of proper categories like "Core Courses", "Major", "Major Elective", etc.

**Evidence from logs:**
- Curriculum courses grouped as: `{General: Array(68)}`
- UI expects categories: "Core Courses", "Major", "Major Elective", "Free Elective", "General Education"
- Import shows: `{General: Array(68), Free Elective: Array(10)}`

## Potential Solutions

### Solution 1: Fix Course Category Mapping (Recommended)
**Problem**: The `course.category` field in the database doesn't match the expected UI categories.

**Action Items:**
1. **Investigate Database Schema**: Check what category values are actually stored in the `Course` table
2. **Create Category Mapping**: Map database categories to UI categories
   ```typescript
   const categoryMapping = {
     'database_category_name': 'Core Courses',
     'another_db_category': 'Major',
     // ... etc
   };
   ```
3. **Update Course Grouping Logic**: Use the mapping in the `fetchCourses` useEffect

### Solution 2: Alternative Category Source
**If `course.category` is not reliable:**

**Option A**: Use `curriculumCourse.category` (the relationship table might have category info)
**Option B**: Use course code patterns to determine category:
```typescript
const determineCategoryFromCode = (courseCode: string) => {
  if (courseCode.startsWith('GE')) return 'General Education';
  if (courseCode.startsWith('CS1') || courseCode.startsWith('CS2')) return 'Core Courses';
  if (courseCode.startsWith('CS3') || courseCode.startsWith('CS4')) return 'Major';
  // ... etc
};
```

### Solution 3: Database Investigation Required
**Check the actual data structure:**
1. Examine `curriculum.curriculumCourses[].course.category` values
2. Check if there's a separate `CourseType` or `Category` table being referenced
3. Look at existing curricula in chairperson interface to see how categories are defined

## Implementation Steps

### Immediate Next Steps:
1. **Add Enhanced Debugging**:
   ```typescript
   selectedCurriculumData.curriculumCourses.forEach((currCourse: any) => {
     console.log('Course debug:', {
       code: currCourse.course.code,
       name: currCourse.course.name,
       category: currCourse.course.category,
       curriculumCategory: currCourse.category, // Check if this exists
       type: currCourse.course.type // Check if this exists
     });
   });
   ```

2. **Test Course Code Pattern Recognition**:
   - If database categories are inconsistent, implement fallback logic based on course codes
   - This would be a temporary solution while proper categorization is implemented

3. **Verify Against Chairperson Interface**:
   - Check how courses are displayed in the chairperson curriculum editing interface
   - Use the same categorization logic that works there

### Long-term Solution:
1. **Standardize Course Categories**: Ensure database has consistent category values
2. **Update Seeding Scripts**: Make sure curriculum seeding uses proper categories
3. **Add Category Validation**: Prevent inconsistent categories from being created

## Testing Plan

### Phase 1: Diagnosis
- [ ] Add detailed course category logging
- [ ] Check what categories exist in current database
- [ ] Compare with chairperson interface display

### Phase 2: Fix Implementation
- [ ] Implement category mapping solution
- [ ] Test with transcript import
- [ ] Verify courses appear in correct categories

### Phase 3: Validation
- [ ] Test with multiple curricula
- [ ] Ensure imported courses respect category constraints
- [ ] Validate grade and status preservation

## Known Issues to Address Separately

### Parser Limitation
- **Issue**: Parser only reads first ~9 courses
- **Cause**: Course category titles in transcript interrupt parsing flow
- **Priority**: Medium (affects data completeness but not core functionality)

### Future Enhancements
- **Concentration Support**: Currently using mock data
- **Blacklist Integration**: Planned for future implementation
- **Constraint Validation**: Enhanced rule checking

## Files to Modify

1. **Primary**: `src/app/management/data-entry/page.tsx`
   - Fix course categorization logic in `fetchCourses` useEffect
   - Add proper category mapping

2. **Secondary**: `src/components/student/StudentTranscriptImport.tsx`
   - Ensure imported courses use correct categories
   - Add validation for category consistency

3. **Database Investigation**: 
   - Check `prisma/schema.prisma` for category definitions
   - Review seeding scripts for category values

## Success Criteria
- [ ] Curriculum courses load into correct categories (not all "General")
- [ ] Imported transcript courses appear in their respective category sections
- [ ] Course status (completed/taking) and grades are preserved and displayed
- [ ] No regression in existing functionality
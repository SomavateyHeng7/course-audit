# Quick Testing Guide - Year Removal & Dynamic Categories

## What Changed?
1. ✅ **Removed year dropdown** - No more year selection needed
2. ✅ **Dynamic categories** - Categories now come from actual curriculum data

## Quick Visual Check

### Before Testing
Open the course planning page and look for:
- ❌ Should NOT see: Year dropdown
- ✅ Should see: Only semester dropdown (Semester / Summer Session)
- ✅ Should see: Category dropdown with real categories (not hardcoded list)

## Testing Steps

### Test 1: Category Dropdown
1. Go to course planning page
2. Click on the **Category** dropdown
3. **Expected:**
   - First option: "All Categories"
   - Other options: Real categories from your curriculum (sorted alphabetically)
   - **NOT** hardcoded categories like "Core", "Elective", etc.

### Test 2: Add Course Without Year
1. Select a **semester** (Semester or Summer Session)
2. Click "Add to Plan" on any course
3. **Expected:**
   - ✅ Course is added successfully
   - ✅ Alert message shows: "Added {code} to {semester}" (no year mentioned)
   - ✅ Course appears in planned courses section
   - ❌ No error about missing year

### Test 3: Planned Courses Display
1. Look at the planned courses section (right side)
2. **Expected:**
   - Group headers show: "Semester 1" or "Semester summer"
   - **NOT**: "2024 - Semester 1"

### Test 4: Add Course Button State
1. Don't select any semester
2. **Expected:** All "Add to Plan" buttons are disabled
3. Select a semester
4. **Expected:** Buttons become enabled

### Test 5: Corequisites
1. Select a semester
2. Add a course that has corequisites (e.g., CSE360)
3. **Expected:**
   - Both main course and corequisites are added
   - Alert mentions corequisite codes
   - No year mentioned in alert

### Test 6: Summer Session (Regression Test)
1. Select "Summer Session"
2. **Expected:**
   - Only courses with summer flag (blue dot 🔵) are shown
3. Select "Semester"
4. **Expected:**
   - ALL courses are shown

### Test 7: Data Persistence
1. Add some courses to plan
2. Refresh the page
3. **Expected:**
   - Planned courses are still there
   - No console errors
   - Courses display correctly

## Developer Console Checks

### Open Browser DevTools (F12) and check:

1. **No TypeScript Errors**
   ```
   Look for red errors in console
   Should see: Clean console (or only expected logs)
   ```

2. **Check localStorage**
   ```javascript
   // In console, run:
   JSON.parse(localStorage.getItem('coursePlanningData'))
   
   // Expected: No 'year' field in plannedCourses
   ```

3. **Check availableCourses**
   ```javascript
   // Look for React DevTools or console logs
   // Should see categories in course objects
   ```

## What to Look For (Issues)

### ❌ Bad Signs
- Year dropdown still visible
- Error: "Please select a semester and year first"
- Planned courses grouped by year (e.g., "2024 - Semester 1")
- Cannot add courses even with semester selected
- Category dropdown shows hardcoded "Core", "Elective", "Major" options
- Categories not sorted alphabetically

### ✅ Good Signs
- Only semester dropdown visible
- Error: "Please select a semester first" (no year mentioned)
- Planned courses grouped by semester only (e.g., "Semester 1")
- Can add courses with just semester selection
- Category dropdown shows actual curriculum categories
- "All Categories" is the first option
- Categories are sorted A-Z

## Edge Cases to Test

### Edge Case 1: No Categories in Curriculum
- **If:** Curriculum has no categories
- **Expected:** Only "All Categories" option

### Edge Case 2: Duplicate Category Names
- **If:** Multiple courses have same category
- **Expected:** Category appears once in dropdown

### Edge Case 3: Null/Undefined Categories
- **If:** Some courses have no category field
- **Expected:** Those courses are ignored, dropdown still works

### Edge Case 4: Switching Curriculums
- **If:** User switches to different curriculum
- **Expected:** Category dropdown updates to show new categories

## Performance Check

### Category Dropdown Performance
1. Open course planning page
2. Watch how long it takes for category dropdown to populate
3. **Expected:** Instant (memoization should make it fast)
4. Add a new course to plan (should NOT affect category dropdown)

## API Integration Notes

### When Testing with Real API
1. Verify `/api/available-courses` returns `category` field
2. Check that categories match `DepartmentCourseType.courseType.name`
3. Test with multiple departments to see different categories

## Screenshot Verification Points

### Take screenshots to verify:
1. ✅ Semester dropdown (no year dropdown beside it)
2. ✅ Category dropdown showing real categories
3. ✅ Planned courses section with "Semester X" headers
4. ✅ Add course alert without year reference

## Report Any Issues

### If something doesn't work, note:
1. **What you did:** Step-by-step actions
2. **What you expected:** What should have happened
3. **What actually happened:** The actual result
4. **Console errors:** Any errors in browser console
5. **Screenshot:** If visual issue

## Quick Fix Reference

### If categories show as "All Categories" only:
- Check if `availableCourses` has `category` field
- Check console for data loading issues
- Verify API returns category data

### If year dropdown still shows:
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check if correct file was edited
- Verify no TypeScript compilation errors

### If cannot add courses:
- Check if semester is selected
- Check console for validation errors
- Verify no blocking course flags

## Success Criteria

✅ **Pass if:**
1. Year dropdown is gone
2. Category dropdown shows actual curriculum categories
3. Can add courses with only semester selection
4. Planned courses display without year
5. No console errors
6. Data persists correctly

---

**Time to Test:** ~5-10 minutes
**Priority:** High - Core functionality change
**Related:** YEAR_REMOVAL_AND_DYNAMIC_CATEGORIES.md

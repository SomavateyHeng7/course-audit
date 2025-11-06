# Blacklist and Banned Combinations Fix

**Date:** December 19, 2024  
**Status:** ✅ Complete  
**Files Modified:** `src/app/management/course-planning/page.tsx`

---

## Issues Fixed

### 1. **Authentication Error with Blacklist API**
**Problem:** Student side was trying to use authenticated `curriculumBlacklistApi` which requires authentication, but students don't have auth credentials.

**Error:**
```
Error: Authentication required
    at CurriculumBlacklistApi.getCurriculumBlacklists
```

**Solution:**
- Replaced authenticated API with public endpoint: `/api/public-curricula/[id]/blacklists`
- Removed `curriculumBlacklistApi` import
- Updated data parsing to match public API response structure

### 2. **Banned Combinations Not Working**
**Problem:** Students could still add courses that had banned combinations, even when the conflicting course was already completed or planned.

**Example:** 
- CSX4001 has `bannedWith: ['CSX4010']`
- CSX4010 has `bannedWith: ['CSX4001']`
- After adding CSX4001, CSX4010 was still addable (should be blocked)

**Root Cause:** Course code comparison was not trimming whitespace, causing exact match failures.

**Solution:**
- Added `.trim()` to all course code comparisons
- Added console logging for debugging banned combination checks

---

## Implementation Details

### Blacklist API Changes

**Before:**
```typescript
import { curriculumBlacklistApi, type CurriculumBlacklistsResponse } from '@/services/curriculumBlacklistApi';

const fetchBlacklistedCourses = async () => {
  const response = await curriculumBlacklistApi.getCurriculumBlacklists(dataEntryContext.selectedCurriculum);
  const blacklistedCodesSet = new Set<string>();
  response.assignedBlacklists.forEach(assignment => {
    assignment.blacklist.courses.forEach(course => {
      blacklistedCodesSet.add(course.code.trim());
    });
  });
};
```

**After:**
```typescript
const fetchBlacklistedCourses = async () => {
  const response = await fetch(`/api/public-curricula/${dataEntryContext.selectedCurriculum}/blacklists`);
  const data = await response.json();
  
  const blacklistedCodesSet = new Set<string>();
  (data.blacklists || []).forEach((blacklist: any) => {
    (blacklist.courses || []).forEach((courseWrapper: any) => {
      if (courseWrapper.course?.code) {
        blacklistedCodesSet.add(courseWrapper.course.code.trim());
      }
    });
  });
};
```

**Key Changes:**
1. Uses public API endpoint (no auth required)
2. Response structure: `{ blacklists: [...] }` vs `{ assignedBlacklists: [...] }`
3. Courses nested as `blacklist.courses[].course.code`
4. Defensive null-checking with optional chaining

### Banned Combinations Fix

**Before:**
```typescript
// Check against planned courses
for (const bannedCourseCode of course.bannedWith) {
  const plannedConflict = plannedCourses.find(planned => planned.code === bannedCourseCode);
  if (plannedConflict) {
    return { 
      valid: false, 
      blockingCourse: bannedCourseCode, 
      reason: `Cannot add ${course.code} - conflicts with planned course ${bannedCourseCode}` 
    };
  }
}
```

**After:**
```typescript
// Check against planned courses
for (const bannedCourseCode of course.bannedWith) {
  const trimmedBannedCode = bannedCourseCode.trim();
  const plannedConflict = plannedCourses.find(planned => planned.code.trim() === trimmedBannedCode);
  if (plannedConflict) {
    console.log(`❌ ${course.code} blocked: conflicts with planned course ${trimmedBannedCode}`);
    return { 
      valid: false, 
      blockingCourse: trimmedBannedCode, 
      reason: `Cannot add ${course.code} - conflicts with planned course ${trimmedBannedCode}` 
    };
  }
}
```

**Key Changes:**
1. Added `.trim()` to `bannedCourseCode` → `trimmedBannedCode`
2. Added `.trim()` to `planned.code` comparison
3. Added console logging for debugging (❌ blocked, ✅ allowed)
4. Same logic applied to completed courses check

### Debug Logging Added

```typescript
console.log(`🔍 Checking banned combinations for ${course.code}:`, {
  bannedWith: course.bannedWith,
  completedCourses: Array.from(completedCourses),
  plannedCourses: plannedCourses.map(p => p.code)
});

// ... validation logic ...

console.log(`❌ ${course.code} blocked: conflicts with planned course ${trimmedBannedCode}`);
// OR
console.log(`✅ ${course.code} allowed: no banned combination conflicts`);
```

---

## Validation Flow

### How Banned Combinations Work

1. **Course has `bannedWith` array** (e.g., CSX4010 → `['CSX4001']`)
2. **Check completed courses:**
   - If any code in `bannedWith` exists in `completedCourses` Set → Block
3. **Check planned courses:**
   - If any code in `bannedWith` exists in `plannedCourses` array → Block
4. **Filter available courses:**
   - `filteredCourses` uses `validateBannedCombinations()` to exclude blocked courses
5. **Validate on add:**
   - `proceedWithAddingCourse()` checks again before adding to plan

### Example Scenario

```
Step 1: Student adds CSX4001 to plan
  ✅ No conflicts, added successfully
  
Step 2: Student tries to add CSX4010
  🔍 Checking banned combinations for CSX4010
  - bannedWith: ['CSX4001']
  - plannedCourses: ['CSX4001']
  ❌ CSX4010 blocked: conflicts with planned course CSX4001
  
Result: CSX4010 not shown in available courses list
```

---

## How Blacklist vs Banned Combinations Differ

| Feature | Blacklist | Banned Combinations |
|---------|-----------|---------------------|
| **Purpose** | Courses forbidden for specific curriculum | Courses that cannot be taken together |
| **Scope** | Curriculum-wide restriction | Course-pair restriction |
| **Data Source** | `/api/public-curricula/[id]/blacklists` | Course attribute: `bannedWith` array |
| **Example** | "CSX4001 is blacklisted for this curriculum" | "CSX4001 and CSX4010 cannot both be taken" |
| **Storage** | `blacklistedCourses` Set | Course object property |
| **Check Order** | Checked first in validation | Checked after blacklist |

**Both are checked in `validateBannedCombinations()` function** (function name is legacy from when only banned combinations existed).

---

## Testing Instructions

### Test 1: Blacklist Validation
1. Go to Chairperson panel
2. Create a blacklist with course "CSX4001"
3. Assign blacklist to curriculum
4. Go to Student course planning
5. **Expected:** CSX4001 should not appear in available courses
6. **Console:** Should show "Blacklisted courses for curriculum: ['CSX4001']"

### Test 2: Banned Combinations
1. Add CSX4001 to course plan (Semester 1)
2. Try to find CSX4010 in available courses
3. **Expected:** CSX4010 should not appear in list
4. **Console:** Should show:
   ```
   🔍 Checking banned combinations for CSX4010:
   ❌ CSX4010 blocked: conflicts with planned course CSX4001
   ```

### Test 3: Completed Course Conflicts
1. Mark CSX4001 as completed in data entry
2. Try to add CSX4010 in course planning
3. **Expected:** CSX4010 should not appear
4. **Console:** Should show conflict with completed course

---

## Files Modified

### `src/app/management/course-planning/page.tsx`

**Lines Changed:**
- **Lines 1-6:** Removed `curriculumBlacklistApi` import
- **Lines 448-477:** Updated `fetchBlacklistedCourses()` to use public API
- **Lines 520-570:** Added trimming and logging to `validateBannedCombinations()`

**Functions Modified:**
1. `fetchBlacklistedCourses()` - Uses public API endpoint
2. `validateBannedCombinations()` - Added trimming and debug logging

**State Management:**
- `blacklistedCourses` - Remains as Set<string> for O(1) lookups
- No changes to other state variables

---

## Performance Considerations

### Blacklist Lookup: O(1)
```typescript
blacklistedCourses.has(course.code.trim()) // Set lookup - O(1)
```

### Banned Combination Check: O(n*m)
```typescript
// n = length of course.bannedWith
// m = length of plannedCourses
for (const bannedCourseCode of course.bannedWith) { // O(n)
  plannedCourses.find(planned => planned.code.trim() === trimmedBannedCode) // O(m)
}
```

**Typical Scale:**
- `bannedWith.length` ≈ 1-3 courses
- `plannedCourses.length` ≈ 10-40 courses
- Total: ~30-120 comparisons per validation (negligible)

---

## Error Handling

### Public API Failures
```typescript
catch (error) {
  console.error('Error fetching blacklisted courses:', error);
  setBlacklistedCourses(new Set()); // Graceful degradation
}
```

**Behavior:** If blacklist fetch fails, no courses are blocked by blacklist (only banned combinations still work).

### Null Safety
```typescript
(data.blacklists || []).forEach((blacklist: any) => {
  (blacklist.courses || []).forEach((courseWrapper: any) => {
    if (courseWrapper.course?.code) { // Optional chaining
      blacklistedCodesSet.add(courseWrapper.course.code.trim());
    }
  });
});
```

---

## Related Files

### API Endpoint Used
- **File:** `src/app/api/public-curricula/[id]/blacklists/route.ts`
- **Method:** GET
- **Auth:** None (public endpoint)
- **Response:**
  ```typescript
  {
    blacklists: [
      {
        id: string,
        name: string,
        courses: [
          {
            course: {
              id: string,
              code: string,
              name: string,
              credits: number
            }
          }
        ]
      }
    ]
  }
  ```

---

## Console Output Examples

### Successful Blacklist Fetch
```
Blacklisted courses for curriculum: ['CSX4001', 'ITX3001']
```

### Banned Combination Check (Allowed)
```
🔍 Checking banned combinations for CSX4002:
  bannedWith: []
  completedCourses: ['CSX1001', 'CSX2001']
  plannedCourses: ['CSX3001']
✅ CSX4002 allowed: no banned combination conflicts
```

### Banned Combination Check (Blocked)
```
🔍 Checking banned combinations for CSX4010:
  bannedWith: ['CSX4001']
  completedCourses: []
  plannedCourses: ['CSX4001']
❌ CSX4010 blocked: conflicts with planned course CSX4001
```

---

## Future Enhancements

### Potential Improvements
1. **Real-time Blacklist Updates:**
   - WebSocket connection to sync blacklist changes
   - Or polling every 5 minutes

2. **Visual Indicators:**
   - Show "🚫 Blacklisted" badge in UI
   - Show "⛔ Conflicts with CSX4001" for banned combinations

3. **Batch Validation:**
   - Validate multiple courses at once for better performance
   - Pre-compute banned pairs for O(1) lookup

4. **Better Error Messages:**
   - Explain why course is banned: "CSX4010 covers the same material as CSX4001"
   - Suggest alternatives: "Consider taking CSX4005 instead"

---

## Summary

✅ **Authentication Issue:** Fixed by using public API endpoint  
✅ **Banned Combinations:** Fixed by adding `.trim()` to comparisons  
✅ **Debug Logging:** Added for easier troubleshooting  
✅ **Testing:** Verified with CSX4001 ↔ CSX4010 example  

**Impact:** Students can no longer:
- Add blacklisted courses to their curriculum
- Add courses that conflict with completed/planned courses
- Bypass banned combination restrictions

**All validation now works correctly with proper console feedback! 🎉**

# Course Type API Coordination Document

## Issue Summary

After merging changes, there's a mismatch between how the frontend expects `courseType` data and how the backend returns it.

---

## Current Problem

### Symptom
- Course categories show **blank** after refreshing the curriculum page
- Credit hours were also showing incorrect values (like description text instead of "3-0-6") - **now fixed**

### Root Cause
The backend may be returning `courseType` in two different formats depending on the API version/branch:

1. **Direct Format** (expected by frontend):
```json
{
  "curriculum_courses": [{
    "course": {
      "id": 1,
      "code": "CS101",
      "courseType": {
        "id": 1,
        "name": "Core",
        "color": "#FF0000"
      }
    }
  }]
}
```

2. **Nested Format** (requires extraction):
```json
{
  "curriculum_courses": [{
    "course": {
      "id": 1,
      "code": "CS101",
      "department_course_types": [{
        "curriculum_id": "abc-123",
        "course_type": {
          "id": 1,
          "name": "Core", 
          "color": "#FF0000"
        }
      }]
    }
  }]
}
```

---

## Frontend Fix Applied

The frontend now handles **both formats**:

```typescript
// src/app/chairperson/info_edit/[id]/page.tsx

const extractCourseType = (course: any, curriculumId: string) => {
  // First check if courseType is directly available
  if (course.courseType) {
    return course.courseType;
  }
  // Otherwise, try to extract from department_course_types array
  if (course.department_course_types && Array.isArray(course.department_course_types)) {
    const relevantAssignment = course.department_course_types.find(
      (dct: any) => dct.curriculum_id === curriculumId
    );
    if (relevantAssignment && relevantAssignment.course_type) {
      return {
        id: relevantAssignment.course_type.id,
        name: relevantAssignment.course_type.name,
        color: relevantAssignment.course_type.color,
      };
    }
  }
  return null;
};
```

---

## Backend Investigation Needed

### API Endpoint to Check
- `GET /api/curriculums/{id}` 
- Specifically the `curriculum_courses[].course` object

### Questions to Answer
1. Does the API return `courseType` directly on the course object?
2. Or does it return `department_course_types` array that needs to be filtered by `curriculum_id`?
3. Was there a recent merge that changed this behavior?

### How to Check What Changed in a Merge

```bash
# List recent commits to see the merge
git log --oneline -n 20

# See what files changed in a specific merge commit
git diff <merge-commit>^1...<merge-commit> --name-only

# See full diff of a merge
git show <merge-commit>

# Compare two branches
git diff ctd-hr...main -- <path-to-file>
```

---

## Expected API Response Format

The frontend now supports both formats, but ideally the API should return `courseType` directly for consistency:

```json
{
  "id": "curriculum-uuid",
  "curriculum_courses": [{
    "id": "cc-uuid",
    "year": 1,
    "semester": 1,
    "course": {
      "id": "course-uuid",
      "code": "CS101",
      "name": "Introduction to Programming",
      "credits": 3,
      "creditHours": "3-0-6",
      "courseType": {
        "id": "type-uuid",
        "name": "Core",
        "color": "#4CAF50"
      }
    }
  }]
}
```

---

## Testing Checklist

- [ ] Verify `creditHours` displays correctly (e.g., "3-0-6", "2-2-4")
- [ ] Verify course categories display correctly after page load
- [ ] Verify course categories persist after refresh
- [ ] Check both snake_case (`credit_hours`) and camelCase (`creditHours`) are handled
- [ ] Test with both direct `courseType` and `department_course_types` array formats

---

## Related Files

| File | Purpose |
|------|---------|
| `src/app/chairperson/info_edit/[id]/page.tsx` | Curriculum edit page - data normalization |
| `src/components/features/curriculum/CoursesTab.tsx` | Courses table display |
| `src/lib/api/laravel.ts` | API configuration |

---

## Contact

If issues persist after backend check, compare with the working `ctd-hr` branch to see what API responses look like there.

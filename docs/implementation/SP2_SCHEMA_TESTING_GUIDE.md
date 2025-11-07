# SP2 Schema Viability Testing Guide

**Date:** November 5, 2025  
**Schema File:** `prisma/schema_for_sp2.prisma`  
**Status:** ✅ Schema is syntactically valid

---

## ✅ Test 1: Schema Validation (COMPLETED)

**Command:**
```powershell
npx prisma validate --schema=prisma/schema_for_sp2.prisma
```

**Result:** ✅ **PASSED** - Schema is valid with no syntax errors

**What This Tests:**
- Prisma syntax correctness
- Model relationships are properly defined
- No circular dependencies
- Field types are valid
- Indexes and constraints are properly formatted

---

## 🧪 Test 2: Generate Prisma Client (Recommended Next)

This will test if Prisma can generate TypeScript types from the schema.

### Steps:

1. **Backup your current Prisma client:**
```powershell
# No action needed - we'll use a temporary output
```

2. **Generate client from SP2 schema:**
```powershell
npx prisma generate --schema=prisma/schema_for_sp2.prisma
```

**What This Tests:**
- TypeScript type generation
- Relation handling in generated client
- No naming conflicts
- Proper inference of return types

**Expected Output:**
```
✔ Generated Prisma Client (version X.X.X)
```

**If it fails:** Check error messages for relationship issues or naming conflicts.

---

## 🗄️ Test 3: Create Test Database Migration (Advanced)

This tests if the schema can actually create a database.

### Option A: SQLite Test Database (Safest)

1. **Create a test database config:**
```env
# Create a new file: .env.test
DATABASE_URL="file:./test_sp2.db"
```

2. **Create test schema file pointing to SQLite:**
Create `prisma/schema_for_sp2_test.prisma`:
```prisma
datasource db {
  provider = "sqlite"  // Changed from postgresql
  url      = "file:./test_sp2.db"
}

// ... rest of schema (copy from schema_for_sp2.prisma)
```

3. **Generate migration:**
```powershell
npx prisma migrate dev --name test_sp2_schema --schema=prisma/schema_for_sp2_test.prisma
```

**What This Tests:**
- Actual database table creation
- Foreign key constraints work
- Indexes are created properly
- Unique constraints are enforced
- Cascade deletes are configured correctly

### Option B: Docker PostgreSQL Test (More Realistic)

1. **Start a temporary PostgreSQL container:**
```powershell
docker run --name test-sp2-db -e POSTGRES_PASSWORD=testpass -e POSTGRES_DB=testdb -p 5433:5432 -d postgres:15
```

2. **Create test environment file:**
```env
# .env.sp2test
DATABASE_URL="postgresql://postgres:testpass@localhost:5433/testdb?schema=public"
```

3. **Create migration:**
```powershell
$env:DATABASE_URL="postgresql://postgres:testpass@localhost:5433/testdb?schema=public"
npx prisma migrate dev --name test_sp2_schema --schema=prisma/schema_for_sp2.prisma --skip-generate
```

4. **Cleanup when done:**
```powershell
docker stop test-sp2-db
docker rm test-sp2-db
```

**What This Tests:**
- PostgreSQL-specific features work
- Migration scripts are generated correctly
- All constraints are database-compatible
- Performance indexes are created

---

## 📊 Test 4: Query Viability Test (Most Thorough)

Create a small TypeScript file to test if common queries would work.

### Create Test File: `test-sp2-queries.ts`

```typescript
import { PrismaClient } from '@prisma/client';

// This is pseudocode to verify query patterns will work
// DO NOT RUN - Just for validation

const prisma = new PrismaClient();

async function testQueries() {
  // Test 1: Curriculum-scoped course type assignment query
  const courseTypes = await prisma.departmentCourseType.findMany({
    where: {
      departmentId: 'dept-123',
      curriculumId: 'curr-456', // ✅ New field exists
    },
    include: {
      courseType: true,
      curriculum: true, // ✅ New relation exists
    },
  });

  // Test 2: Creating a new assignment with curriculum
  const newAssignment = await prisma.departmentCourseType.create({
    data: {
      courseId: 'course-789',
      departmentId: 'dept-123',
      courseTypeId: 'type-456',
      curriculumId: 'curr-456', // ✅ New field required
      assignedById: 'user-123',
    },
  });

  // Test 3: Curriculum with its course type assignments
  const curriculum = await prisma.curriculum.findUnique({
    where: { id: 'curr-456' },
    include: {
      departmentCourseTypes: true, // ✅ New reverse relation exists
    },
  });

  // Test 4: Unique constraint test - should fail if duplicate
  try {
    await prisma.departmentCourseType.create({
      data: {
        courseId: 'course-789',
        departmentId: 'dept-123',
        courseTypeId: 'type-456',
        curriculumId: 'curr-456', // Same combo as above
      },
    });
    // Should throw P2002 unique constraint violation
  } catch (error) {
    console.log('✅ Unique constraint working:', error.code === 'P2002');
  }

  // Test 5: Cascade delete test
  await prisma.curriculum.delete({
    where: { id: 'curr-456' },
  });
  // Should also delete all departmentCourseTypes with this curriculumId
  
  const orphanedAssignments = await prisma.departmentCourseType.findMany({
    where: { curriculumId: 'curr-456' },
  });
  console.log('✅ Cascade delete working:', orphanedAssignments.length === 0);

  // Test 6: Query with multiple curricula in same department
  const dept1Curricula = await prisma.curriculum.findMany({
    where: { departmentId: 'dept-123' },
    include: {
      departmentCourseTypes: {
        where: {
          courseId: 'course-789',
        },
      },
    },
  });
  // Each curriculum should have its own assignments, not shared
  console.log('✅ Curriculum isolation:', 
    dept1Curricula.every(c => 
      c.departmentCourseTypes.every(dct => dct.curriculumId === c.id)
    )
  );
}

// Type checking validation
type AssignmentCreateInput = Parameters<typeof prisma.departmentCourseType.create>[0]['data'];

// ✅ Should require curriculumId
const validInput: AssignmentCreateInput = {
  courseId: 'x',
  departmentId: 'x',
  courseTypeId: 'x',
  curriculumId: 'x', // Required!
};

// ❌ This should show TypeScript error (missing curriculumId)
// const invalidInput: AssignmentCreateInput = {
//   courseId: 'x',
//   departmentId: 'x',
//   courseTypeId: 'x',
//   // curriculumId missing!
// };
```

### To Run This Test:

```powershell
# Generate types from SP2 schema
npx prisma generate --schema=prisma/schema_for_sp2.prisma

# Check TypeScript compilation (won't actually run)
npx tsc --noEmit test-sp2-queries.ts
```

**What This Tests:**
- TypeScript types include new fields
- Required fields are enforced at compile time
- Relations are properly typed
- Query patterns that APIs will use are valid

---

## 🔍 Test 5: ERD Visualization (Optional but Helpful)

Visualize the schema to see relationships clearly.

### Using Prisma Studio:

```powershell
npx prisma studio --schema=prisma/schema_for_sp2.prisma
```

This will open a browser showing:
- All models and their fields
- Relationships between models
- You can see the DepartmentCourseType → Curriculum link

### Using Online Tools:

1. Copy the content of `schema_for_sp2.prisma`
2. Go to: https://prisma-erd.simonknott.de/
3. Paste your schema
4. View the generated ERD

**What This Tests:**
- Visual confirmation of relationships
- Helps identify potential issues in data flow
- Easier to explain to team members

---

## 📋 Test 6: Migration Dry Run (Most Realistic)

Test the actual migration from current schema to SP2 schema.

### Steps:

1. **Create a database dump of current structure:**
```powershell
# If using PostgreSQL
pg_dump -h localhost -U your_user -d your_db --schema-only > current_schema.sql
```

2. **Generate migration without applying:**
```powershell
# This shows what SQL would be executed
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datasource prisma/schema_for_sp2.prisma --script
```

**Expected Output:**
```sql
-- AlterTable
ALTER TABLE "department_course_types" 
ADD COLUMN "curriculumId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "department_course_types_curriculumId_idx" 
ON "department_course_types"("curriculumId");

-- DropIndex
DROP INDEX "department_course_types_courseId_departmentId_key";

-- CreateIndex
CREATE UNIQUE INDEX "department_course_types_courseId_departmentId_curriculumId_key" 
ON "department_course_types"("courseId", "departmentId", "curriculumId");

-- AddForeignKey
ALTER TABLE "department_course_types" 
ADD CONSTRAINT "department_course_types_curriculumId_fkey" 
FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE CASCADE;
```

**What This Tests:**
- Actual SQL that will be executed
- Migration complexity
- Potential data loss points
- Whether existing constraints need to be dropped first

---

## 🎯 Test 7: Data Compatibility Check

Verify that your current data structure can accommodate the changes.

### Query Current Database:

```sql
-- Check if any course has multiple type assignments in same department
SELECT 
  courseId, 
  departmentId, 
  COUNT(*) as assignment_count
FROM department_course_types
GROUP BY courseId, departmentId
HAVING COUNT(*) > 1;
```

**Expected Result:** Should return 0 rows (current schema prevents this with unique constraint)

```sql
-- Check how many assignments exist per department
SELECT 
  d.name as department_name,
  COUNT(*) as assignment_count
FROM department_course_types dct
JOIN departments d ON d.id = dct.departmentId
GROUP BY d.id, d.name;
```

**What This Tests:**
- Current data volume
- Impact of migration (all rows need curriculumId)
- Helps estimate time for Option A (delete and re-assign)

---

## ✅ Validation Checklist

Run through these checks in order:

- [x] **Test 1:** Schema validation (COMPLETED - ✅ PASSED)
- [ ] **Test 2:** Generate Prisma Client
- [ ] **Test 3:** Create test database (Option A or B)
- [ ] **Test 4:** Query viability test
- [ ] **Test 5:** ERD visualization
- [ ] **Test 6:** Migration dry run
- [ ] **Test 7:** Data compatibility check

---

## 🚦 Go/No-Go Decision Points

### ✅ GREEN LIGHT - Proceed with Implementation
- All tests pass without errors
- Migration SQL looks reasonable
- No unexpected constraints or conflicts
- TypeScript types compile correctly
- Team approves the approach

### ⚠️ YELLOW LIGHT - Address Issues First
- Some tests fail but issues are fixable
- Migration requires complex data transformation
- Performance concerns with indexes
- Need to refine unique constraints

### 🛑 RED LIGHT - Reconsider Approach
- Fundamental schema conflicts
- Cannot generate valid migration
- TypeScript compilation fails
- Circular dependency issues
- Major breaking changes to existing data

---

## 📞 Next Steps After Testing

### If All Tests Pass:

1. **Review findings with team**
2. **Choose migration strategy** (confirm Option A: delete existing assignments)
3. **Plan implementation timeline**
4. **Start with API fixes** (use `SP2_API_FIXES_REQUIRED.md`)
5. **Schedule migration window**

### If Issues Found:

1. **Document specific failures**
2. **Investigate root causes**
3. **Adjust schema as needed**
4. **Re-run tests**
5. **Update documentation**

---

## 🔧 Recommended Test Order

For quickest validation:

1. ✅ **Test 1** (Schema validation) - DONE
2. ⏭️ **Test 2** (Generate client) - Run this next
3. ⏭️ **Test 6** (Migration dry run) - See actual SQL
4. ⏭️ **Test 4** (Query patterns) - Verify API changes will work
5. 🔄 **Test 3** (Test DB) - Only if you want to be thorough
6. 📊 **Test 5** (ERD) - Visual confirmation
7. 📈 **Test 7** (Data check) - Understand current state

---

**Status:** ✅ Schema validation passed - Ready for next tests  
**Recommendation:** Run Test 2 (Generate Client) next to verify TypeScript types

/*
  Warnings:

  - You are about to drop the column `facultyId` on the `course_types` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `courses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,departmentId]` on the table `course_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `departmentId` to the `course_types` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add the departmentId column as nullable first
ALTER TABLE "course_types" ADD COLUMN "departmentId" TEXT;

-- Step 2: Update course_types to map from facultyId to departmentId
-- For each course type, find the first department in that faculty and assign it
UPDATE "course_types" 
SET "departmentId" = (
  SELECT d.id 
  FROM "departments" d 
  WHERE d."facultyId" = "course_types"."facultyId" 
  LIMIT 1
);

-- Step 3: Make departmentId required (now that all rows have values)
ALTER TABLE "course_types" ALTER COLUMN "departmentId" SET NOT NULL;

-- Step 4: Drop the foreign key and old column
ALTER TABLE "course_types" DROP CONSTRAINT "course_types_facultyId_fkey";
ALTER TABLE "course_types" DROP COLUMN "facultyId";

-- Step 5: Drop old indexes
DROP INDEX "course_types_name_facultyId_key";
DROP INDEX "courses_category_idx";

-- Step 6: Remove the category column from courses (clean slate approach)
ALTER TABLE "courses" DROP COLUMN "category";

-- Step 7: Create the new DepartmentCourseType table
CREATE TABLE "department_course_types" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "courseTypeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_course_types_pkey" PRIMARY KEY ("id")
);

-- Step 8: Create indexes for the new table
CREATE INDEX "department_course_types_departmentId_idx" ON "department_course_types"("departmentId");
CREATE INDEX "department_course_types_courseTypeId_idx" ON "department_course_types"("courseTypeId");
CREATE UNIQUE INDEX "department_course_types_courseId_departmentId_key" ON "department_course_types"("courseId", "departmentId");

-- Step 9: Create new unique index for course_types
CREATE UNIQUE INDEX "course_types_name_departmentId_key" ON "course_types"("name", "departmentId");

-- AddForeignKey
ALTER TABLE "course_types" ADD CONSTRAINT "course_types_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_course_types" ADD CONSTRAINT "department_course_types_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_course_types" ADD CONSTRAINT "department_course_types_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_course_types" ADD CONSTRAINT "department_course_types_courseTypeId_fkey" FOREIGN KEY ("courseTypeId") REFERENCES "course_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_course_types" ADD CONSTRAINT "department_course_types_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

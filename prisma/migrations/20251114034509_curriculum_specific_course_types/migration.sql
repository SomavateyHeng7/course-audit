/*
  Warnings:

  - A unique constraint covering the columns `[courseId,departmentId,curriculumId]` on the table `department_course_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `curriculumId` to the `department_course_types` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "department_course_types_courseId_departmentId_key";

-- AlterTable
ALTER TABLE "curriculum_courses" ADD COLUMN     "overrideMinCreditThreshold" INTEGER,
ADD COLUMN     "overrideRequiresPermission" BOOLEAN,
ADD COLUMN     "overrideRequiresSeniorStanding" BOOLEAN,
ADD COLUMN     "overrideSummerOnly" BOOLEAN;

-- AlterTable
ALTER TABLE "department_course_types" ADD COLUMN     "curriculumId" TEXT;

-- Backfill curriculumId by aligning existing assignments to curricula that include the same course
UPDATE "department_course_types" dct
SET "curriculumId" = (
    SELECT cc."curriculumId"
    FROM "curriculum_courses" cc
    JOIN "curricula" c ON c."id" = cc."curriculumId"
    WHERE cc."courseId" = dct."courseId"
      AND c."departmentId" = dct."departmentId"
    ORDER BY cc."createdAt" DESC
    LIMIT 1
)
WHERE dct."curriculumId" IS NULL;

-- Fallback: if a course assignment is not linked to any curriculum course, associate it with the newest curriculum in the department
UPDATE "department_course_types" dct
SET "curriculumId" = (
    SELECT c."id"
    FROM "curricula" c
    WHERE c."departmentId" = dct."departmentId"
    ORDER BY c."createdAt" DESC
    LIMIT 1
)
WHERE dct."curriculumId" IS NULL;

-- Guardrail: abort migration if any department course type still lacks a curriculum mapping
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "department_course_types" WHERE "curriculumId" IS NULL) THEN
    RAISE EXCEPTION 'Unable to backfill curriculumId for all department_course_types rows';
  END IF;
END $$;

-- Ensure no orphaned rows remain before tightening constraint
ALTER TABLE "department_course_types" ALTER COLUMN "curriculumId" SET NOT NULL;

CREATE TABLE "curriculum_course_prerequisites" (
  "id" TEXT NOT NULL,
  "curriculumCourseId" TEXT NOT NULL,
  "prerequisiteCourseId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "curriculum_course_prerequisites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "curriculum_course_corequisites" (
  "id" TEXT NOT NULL,
  "curriculumCourseId" TEXT NOT NULL,
  "corequisiteCourseId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "curriculum_course_corequisites_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "curriculum_course_prerequisites_curriculumCourseId_idx" ON "curriculum_course_prerequisites"("curriculumCourseId");

CREATE INDEX "curriculum_course_prerequisites_prerequisiteCourseId_idx" ON "curriculum_course_prerequisites"("prerequisiteCourseId");

CREATE UNIQUE INDEX "curriculum_course_prerequisites_curriculumCourseId_prerequi_key" ON "curriculum_course_prerequisites"("curriculumCourseId", "prerequisiteCourseId");

CREATE INDEX "curriculum_course_corequisites_curriculumCourseId_idx" ON "curriculum_course_corequisites"("curriculumCourseId");

CREATE INDEX "curriculum_course_corequisites_corequisiteCourseId_idx" ON "curriculum_course_corequisites"("corequisiteCourseId");

CREATE UNIQUE INDEX "curriculum_course_corequisites_curriculumCourseId_corequisi_key" ON "curriculum_course_corequisites"("curriculumCourseId", "corequisiteCourseId");

CREATE INDEX "department_course_types_curriculumId_idx" ON "department_course_types"("curriculumId");

CREATE UNIQUE INDEX "department_course_types_courseId_departmentId_curriculumId_key" ON "department_course_types"("courseId", "departmentId", "curriculumId");

ALTER TABLE "department_course_types" ADD CONSTRAINT "department_course_types_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "curriculum_course_prerequisites" ADD CONSTRAINT "curriculum_course_prerequisites_curriculumCourseId_fkey" FOREIGN KEY ("curriculumCourseId") REFERENCES "curriculum_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "curriculum_course_prerequisites" ADD CONSTRAINT "curriculum_course_prerequisites_prerequisiteCourseId_fkey" FOREIGN KEY ("prerequisiteCourseId") REFERENCES "curriculum_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "curriculum_course_corequisites" ADD CONSTRAINT "curriculum_course_corequisites_curriculumCourseId_fkey" FOREIGN KEY ("curriculumCourseId") REFERENCES "curriculum_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "curriculum_course_corequisites" ADD CONSTRAINT "curriculum_course_corequisites_corequisiteCourseId_fkey" FOREIGN KEY ("corequisiteCourseId") REFERENCES "curriculum_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

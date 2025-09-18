-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADVISOR', 'CHAIRPERSON', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "CurriculumConstraintType" AS ENUM ('MINIMUM_GPA', 'SENIOR_STANDING', 'TOTAL_CREDITS', 'CATEGORY_CREDITS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "StudentCourseStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'DROPPED', 'PENDING');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'UNASSIGN', 'IMPORT', 'EXPORT');

-- CreateTable
CREATE TABLE "users" (
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CHAIRPERSON',
    "facultyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "advisorId" TEXT,
    "gpa" DOUBLE PRECISION,
    "credits" INTEGER,
    "scholarshipHour" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "concentrationLabel" TEXT NOT NULL DEFAULT 'Concentrations',

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curricula" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "description" TEXT,
    "startId" TEXT NOT NULL,
    "endId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "creditHours" TEXT NOT NULL,
    "description" TEXT,
    "requiresPermission" BOOLEAN NOT NULL DEFAULT false,
    "summerOnly" BOOLEAN NOT NULL DEFAULT false,
    "requiresSeniorStanding" BOOLEAN NOT NULL DEFAULT false,
    "minCreditThreshold" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_courses" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "semester" TEXT,
    "year" INTEGER,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_prerequisites" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_corequisites" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "corequisiteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_corequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "elective_rules" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requiredCredits" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "elective_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concentrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concentrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concentration_courses" (
    "id" TEXT NOT NULL,
    "concentrationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concentration_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_concentrations" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "concentrationId" TEXT NOT NULL,
    "requiredCourses" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_concentrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blacklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklist_courses" (
    "id" TEXT NOT NULL,
    "blacklistId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blacklist_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_blacklists" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "blacklistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_blacklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_constraints" (
    "id" TEXT NOT NULL,
    "curriculumId" TEXT NOT NULL,
    "type" "CurriculumConstraintType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curriculum_constraints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_courses" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "StudentCourseStatus" NOT NULL,
    "grade" TEXT,
    "semester" TEXT,
    "year" INTEGER,
    "credits" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "changes" JSONB,
    "description" TEXT,
    "curriculumId" TEXT,
    "courseId" TEXT,
    "concentrationId" TEXT,
    "blacklistId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");

-- CreateIndex
CREATE INDEX "users_facultyId_idx" ON "users"("facultyId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_code_key" ON "faculties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_facultyId_key" ON "departments"("code", "facultyId");

-- CreateIndex
CREATE UNIQUE INDEX "curricula_year_startId_endId_departmentId_key" ON "curricula"("year", "startId", "endId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_code_idx" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_name_idx" ON "courses"("name");

-- CreateIndex
CREATE INDEX "curriculum_courses_curriculumId_idx" ON "curriculum_courses"("curriculumId");

-- CreateIndex
CREATE INDEX "curriculum_courses_courseId_idx" ON "curriculum_courses"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_courses_curriculumId_courseId_key" ON "curriculum_courses"("curriculumId", "courseId");

-- CreateIndex
CREATE INDEX "course_prerequisites_courseId_idx" ON "course_prerequisites"("courseId");

-- CreateIndex
CREATE INDEX "course_prerequisites_prerequisiteId_idx" ON "course_prerequisites"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "course_prerequisites_courseId_prerequisiteId_key" ON "course_prerequisites"("courseId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "course_corequisites_courseId_idx" ON "course_corequisites"("courseId");

-- CreateIndex
CREATE INDEX "course_corequisites_corequisiteId_idx" ON "course_corequisites"("corequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "course_corequisites_courseId_corequisiteId_key" ON "course_corequisites"("courseId", "corequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "course_types_name_departmentId_key" ON "course_types"("name", "departmentId");

-- CreateIndex
CREATE INDEX "department_course_types_departmentId_idx" ON "department_course_types"("departmentId");

-- CreateIndex
CREATE INDEX "department_course_types_courseTypeId_idx" ON "department_course_types"("courseTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "department_course_types_courseId_departmentId_key" ON "department_course_types"("courseId", "departmentId");

-- CreateIndex
CREATE INDEX "elective_rules_curriculumId_idx" ON "elective_rules"("curriculumId");

-- CreateIndex
CREATE UNIQUE INDEX "elective_rules_curriculumId_category_key" ON "elective_rules"("curriculumId", "category");

-- CreateIndex
CREATE INDEX "concentrations_createdById_idx" ON "concentrations"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "concentrations_name_departmentId_createdById_key" ON "concentrations"("name", "departmentId", "createdById");

-- CreateIndex
CREATE INDEX "concentration_courses_concentrationId_idx" ON "concentration_courses"("concentrationId");

-- CreateIndex
CREATE INDEX "concentration_courses_courseId_idx" ON "concentration_courses"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "concentration_courses_concentrationId_courseId_key" ON "concentration_courses"("concentrationId", "courseId");

-- CreateIndex
CREATE INDEX "curriculum_concentrations_curriculumId_idx" ON "curriculum_concentrations"("curriculumId");

-- CreateIndex
CREATE INDEX "curriculum_concentrations_concentrationId_idx" ON "curriculum_concentrations"("concentrationId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_concentrations_curriculumId_concentrationId_key" ON "curriculum_concentrations"("curriculumId", "concentrationId");

-- CreateIndex
CREATE INDEX "blacklists_createdById_idx" ON "blacklists"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "blacklists_name_departmentId_createdById_key" ON "blacklists"("name", "departmentId", "createdById");

-- CreateIndex
CREATE INDEX "blacklist_courses_blacklistId_idx" ON "blacklist_courses"("blacklistId");

-- CreateIndex
CREATE INDEX "blacklist_courses_courseId_idx" ON "blacklist_courses"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_courses_blacklistId_courseId_key" ON "blacklist_courses"("blacklistId", "courseId");

-- CreateIndex
CREATE INDEX "curriculum_blacklists_curriculumId_idx" ON "curriculum_blacklists"("curriculumId");

-- CreateIndex
CREATE INDEX "curriculum_blacklists_blacklistId_idx" ON "curriculum_blacklists"("blacklistId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_blacklists_curriculumId_blacklistId_key" ON "curriculum_blacklists"("curriculumId", "blacklistId");

-- CreateIndex
CREATE INDEX "curriculum_constraints_curriculumId_idx" ON "curriculum_constraints"("curriculumId");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_constraints_curriculumId_type_name_key" ON "curriculum_constraints"("curriculumId", "type", "name");

-- CreateIndex
CREATE INDEX "student_courses_studentId_idx" ON "student_courses"("studentId");

-- CreateIndex
CREATE INDEX "student_courses_courseId_idx" ON "student_courses"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "student_courses_studentId_courseId_key" ON "student_courses"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_curriculumId_idx" ON "audit_logs"("curriculumId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curricula" ADD CONSTRAINT "curricula_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curricula" ADD CONSTRAINT "curricula_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curricula" ADD CONSTRAINT "curricula_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_courses" ADD CONSTRAINT "curriculum_courses_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_corequisites" ADD CONSTRAINT "course_corequisites_corequisiteId_fkey" FOREIGN KEY ("corequisiteId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_corequisites" ADD CONSTRAINT "course_corequisites_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "elective_rules" ADD CONSTRAINT "elective_rules_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concentrations" ADD CONSTRAINT "concentrations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concentrations" ADD CONSTRAINT "concentrations_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concentration_courses" ADD CONSTRAINT "concentration_courses_concentrationId_fkey" FOREIGN KEY ("concentrationId") REFERENCES "concentrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "concentration_courses" ADD CONSTRAINT "concentration_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_concentrations" ADD CONSTRAINT "curriculum_concentrations_concentrationId_fkey" FOREIGN KEY ("concentrationId") REFERENCES "concentrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_concentrations" ADD CONSTRAINT "curriculum_concentrations_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklists" ADD CONSTRAINT "blacklists_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklists" ADD CONSTRAINT "blacklists_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist_courses" ADD CONSTRAINT "blacklist_courses_blacklistId_fkey" FOREIGN KEY ("blacklistId") REFERENCES "blacklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklist_courses" ADD CONSTRAINT "blacklist_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_blacklists" ADD CONSTRAINT "curriculum_blacklists_blacklistId_fkey" FOREIGN KEY ("blacklistId") REFERENCES "blacklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_blacklists" ADD CONSTRAINT "curriculum_blacklists_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_constraints" ADD CONSTRAINT "curriculum_constraints_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_blacklistId_fkey" FOREIGN KEY ("blacklistId") REFERENCES "blacklists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_concentrationId_fkey" FOREIGN KEY ("concentrationId") REFERENCES "concentrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "curricula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

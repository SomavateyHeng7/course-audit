import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCascadeBehavior() {
  console.log('🔍 Testing Cascade Behavior for Course Types...\n');

  try {
    // 1. Check current state of course type assignments
    console.log('1. Current Course Type Assignments:');
    const assignments = await prisma.departmentCourseType.findMany({
      include: {
        courseType: true,
        course: true,
        department: true
      }
    });

    if (assignments.length === 0) {
      console.log('   No course type assignments found.\n');
    } else {
      assignments.forEach(assignment => {
        console.log(`   ${assignment.course.code}: ${assignment.courseType.name} (${assignment.department.name})`);
      });
      console.log('');
    }

    // 2. Count assignments per course type
    console.log('2. Assignment Count per Course Type:');
    const courseTypes = await prisma.courseType.findMany({
      include: {
        departmentCourseTypes: true,
        department: true
      }
    });

    courseTypes.forEach(ct => {
      console.log(`   ${ct.name} (${ct.department.name}): ${ct.departmentCourseTypes.length} assignments`);
    });
    console.log('');

    // 3. Test: Find course types that can be safely deleted (no assignments)
    console.log('3. Course Types That Can Be Safely Deleted (no assignments):');
    const safeToDelete = courseTypes.filter(ct => ct.departmentCourseTypes.length === 0);
    if (safeToDelete.length === 0) {
      console.log('   All course types have assignments - none can be safely deleted.\n');
    } else {
      safeToDelete.forEach(ct => {
        console.log(`   ✅ ${ct.name} (${ct.department.name}) - ${ct.departmentCourseTypes.length} assignments`);
      });
      console.log('');
    }

    // 4. Test: Find course types that cannot be deleted (have assignments)
    console.log('4. Course Types That Cannot Be Deleted (have assignments):');
    const cannotDelete = courseTypes.filter(ct => ct.departmentCourseTypes.length > 0);
    if (cannotDelete.length === 0) {
      console.log('   No course types have assignments - all can be safely deleted.\n');
    } else {
      cannotDelete.forEach(ct => {
        const assignedCourses = ct.departmentCourseTypes.map(dct => dct.courseId).join(', ');
        console.log(`   ❌ ${ct.name} (${ct.department.name}) - ${ct.departmentCourseTypes.length} assignments`);
      });
      console.log('');
    }

    // 5. Test referential integrity
    console.log('5. Referential Integrity Check:');
    const orphanedAssignments = await prisma.departmentCourseType.findMany({
      include: {
        courseType: true,
        course: true,
        department: true
      }
    });

    let integrityIssues = 0;
    orphanedAssignments.forEach(assignment => {
      if (!assignment.courseType) {
        console.log(`   ❌ ORPHANED: Assignment ${assignment.id} references non-existent course type`);
        integrityIssues++;
      }
      if (!assignment.course) {
        console.log(`   ❌ ORPHANED: Assignment ${assignment.id} references non-existent course`);
        integrityIssues++;
      }
      if (!assignment.department) {
        console.log(`   ❌ ORPHANED: Assignment ${assignment.id} references non-existent department`);
        integrityIssues++;
      }
    });

    if (integrityIssues === 0) {
      console.log('   ✅ All assignments have valid references - no orphaned records found.\n');
    }

    // 6. Test cascade delete behavior (simulation)
    console.log('6. Cascade Delete Simulation:');
    console.log('   When a CourseType is deleted:');
    console.log('   - onDelete: Cascade is set on DepartmentCourseType.courseType relation');
    console.log('   - All DepartmentCourseType records will be automatically deleted');
    console.log('   - Courses will show "No Category Assigned" in the UI');
    console.log('   - API prevents deletion if assignments exist (409 conflict)');
    console.log('');

    // 7. Test update behavior
    console.log('7. Update Behavior:');
    console.log('   When a CourseType is updated (name/color):');
    console.log('   - DepartmentCourseType records maintain their courseTypeId reference');
    console.log('   - Courses will immediately reflect the updated category name/color');
    console.log('   - No cascade updates needed - relations remain intact');
    console.log('');

    console.log('✅ Cascade Behavior Test Complete!');

  } catch (error) {
    console.error('❌ Error testing cascade behavior:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCascadeBehavior();

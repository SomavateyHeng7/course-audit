const { PrismaClient } = require('@prisma/client');

async function testFacultyField() {
  const prisma = new PrismaClient();
  
  try {
    // Try to find a faculty record and see if concentrationLabel field exists
    const faculty = await prisma.faculty.findFirst({
      select: {
        id: true,
        name: true,
        concentrationLabel: true,
      }
    });
    
    console.log('Faculty field test successful:', faculty);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testFacultyField();

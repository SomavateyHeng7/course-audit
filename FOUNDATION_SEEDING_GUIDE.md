# Foundation Seeding Guide

This guide explains how to re-seed the foundational data (faculties, departments, course types, and initial users) for the Course Audit System.

## 🎯 What Gets Seeded

### Faculties (6 total)
- Faculty of Engineering (ENG)
- Faculty of Science (SCI) 
- Martin de Tours School of Management and Economics (MDE)
- Faculty of Arts (ARTS)
- Faculty of Nursing Science (NURS)
- Faculty of Law (LAW)

### Departments (19 total)
**Engineering:** Computer Science, Information Technology, Computer Engineering, Industrial Engineering
**Science:** Mathematics, Biology, Chemistry, Physics
**Management:** Business Administration, Accounting, Finance, Marketing, Management, Economics
**Arts:** English, Communication Arts, Philosophy
**Nursing:** Nursing Science
**Law:** Law

### Course Types (16 total)
- Department-specific course types based on curriculum analysis
- Examples: CS Core, Business Core, General Education, English, Marketing Core, etc.

### Initial Users (7 total)
- 1 System Administrator
- 3 Faculty Chairpersons 
- 3 Department Faculty members

## 🚀 Seeding Options

### Option 1: Prisma TypeScript Seed (Recommended)
```powershell
# Run the Prisma seed command
npm run seed
```
- ✅ Type-safe with Prisma
- ✅ Better error handling
- ✅ Progress feedback
- ✅ Automatic password hashing

### Option 2: Direct SQL Execution
```powershell
# Using the PowerShell script
.\run-foundation-seed.ps1

# Or manually with psql (if you have it installed)
psql -h your-host -p 5432 -U your-user -d your-db -f prisma/foundation_seed.sql
```
- ✅ Direct database access
- ✅ Fast execution
- ✅ Raw SQL control

### Option 3: Manual Database Reset + Seed
```powershell
# Reset database and run migrations
npx prisma migrate reset --force

# Then run the seed
npm run seed
```
- ✅ Complete clean slate
- ✅ Ensures schema consistency

## 🔑 Default Credentials

After seeding, you can log in with these accounts:

### System Administrator
- **Email:** admin@assumption.ac.th
- **Password:** password123
- **Role:** ADMIN

### Faculty Chairpersons
- **Email:** chair.engineering@assumption.ac.th
- **Password:** password123
- **Role:** CHAIRPERSON

- **Email:** chair.science@assumption.ac.th
- **Password:** password123
- **Role:** CHAIRPERSON

- **Email:** chair.management@assumption.ac.th
- **Password:** password123
- **Role:** CHAIRPERSON

### Department Faculty
- **Email:** cs.faculty@assumption.ac.th
- **Password:** password123
- **Role:** ADVISOR

- **Email:** bba.faculty@assumption.ac.th
- **Password:** password123
- **Role:** ADVISOR

- **Email:** mkt.faculty@assumption.ac.th
- **Password:** password123
- **Role:** ADVISOR

## 🔧 Post-Seeding Steps

1. **Verify Seeding Success**
   ```powershell
   npm run dev
   ```
   Check that the server starts without errors.

2. **Test Login**
   - Navigate to your application
   - Try logging in with admin@assumption.ac.th / password123

3. **Verify Data Structure**
   - Check that faculties and departments appear correctly
   - Verify course types are available for each department
   - Test creating a curriculum to ensure relationships work

## 🛠️ Troubleshooting

### If seeding fails:
1. Check that your DATABASE_URL is correctly set
2. Ensure your database is accessible
3. Verify Prisma schema is up to date: `npx prisma db push`

### If you need to re-seed:
1. The seed scripts will clear existing data first
2. Safe to run multiple times
3. Users will need to clear browser sessions after re-seeding

## 📚 Ready for Phase 2

After successful seeding, you'll have:
- ✅ Clean department-scoped course type structure
- ✅ Faculty and department data for testing
- ✅ User accounts for different roles
- ✅ Foundation for bulk course type assignment tools
- ✅ Department-specific course management workflows

You're now ready to implement the Phase 2 frontend features!

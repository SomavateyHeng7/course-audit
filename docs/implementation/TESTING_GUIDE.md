# User-Department Association Testing Guide

## 🔧 **Pre-Testing Setup** (Run when database is available)

### **1. Apply Database Migration**
```bash
# Option A: Using Prisma migrate
npx prisma migrate dev --name add_department_id_to_users

# Option B: Manual SQL (if Prisma migration fails)
psql -h your-host -d your-database < manual-migration-department-id.sql
```

### **2. Generate Updated Prisma Client**
```bash
npx prisma generate
```

### **3. Verify Migration Success**
```sql
-- Check that all users have departments
SELECT COUNT(*) FROM users WHERE department_id IS NULL; -- Should return 0

-- View user-department assignments
SELECT u.name, u.email, u.role, f.name as faculty, d.name as department 
FROM users u 
JOIN faculties f ON u.faculty_id = f.id 
JOIN departments d ON u.department_id = d.id 
LIMIT 10;
```

---

## 🧪 **Testing Scenarios**

### **Test 1: User Signup with Department Selection**
1. **Navigate to**: `/auth` (signup form)
2. **Test Steps**:
   - Fill in name, email, password
   - Select a faculty → dropdown should populate with departments
   - Select a department → form should be submittable
   - Submit form → should create user successfully
3. **Expected Results**:
   - Department dropdown is disabled until faculty is selected
   - Department dropdown shows departments for selected faculty only
   - User is created with correct `departmentId`
   - Default role is set to `CHAIRPERSON`

### **Test 2: Login and Session Verification**
1. **Login** with newly created user
2. **Check session** in browser dev tools or via `/api/auth/session`
3. **Expected Results**:
   - Session includes `departmentId`
   - Session includes `role: 'CHAIRPERSON'`
   - User is redirected to `/chairperson` dashboard

### **Test 3: Curriculum Creation Smart Defaults**
1. **Navigate to**: `/chairperson/create/details`
2. **Test Steps**:
   - Page should load with department selection
   - User's department should be auto-selected
   - Blue info banner should show "Creating curriculum for [User's Department]"
   - Department dropdown should show user's department with ⭐ indicator
   - User should be able to select different departments in same faculty
3. **Expected Results**:
   - No manual department selection required
   - Smart default works correctly
   - Visual indicators are clear
   - Course types load automatically for selected department

### **Test 4: Faculty/Department API Filtering**
1. **Test Department API**: `GET /api/departments?facultyId=<faculty-id>`
2. **Expected Results**:
   - Returns only departments for specified faculty
   - Returns all departments if no facultyId parameter

### **Test 5: Department Access Control** (Future)
1. **Create test users** in different departments
2. **Test cross-department access**:
   - User A (Dept X) tries to access Dept Y's curricula
   - Should be blocked or filtered appropriately
3. **Test SUPER_ADMIN access**:
   - Should have access to all departments

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: TypeScript Errors**
```bash
# Solution: Regenerate Prisma client
npx prisma generate
# Restart TypeScript server in VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### **Issue 2: Department Dropdown Empty**
- **Check**: Faculty selection is working
- **Check**: `/api/departments?facultyId=<id>` returns departments
- **Check**: Database has departments for the selected faculty

### **Issue 3: User Creation Fails**
- **Check**: Department belongs to selected faculty
- **Check**: All required fields are provided
- **Check**: Database migration completed successfully

### **Issue 4: Session Missing departmentId**
- **Check**: Auth configuration includes departmentId in callbacks
- **Check**: User record has departmentId in database
- **Clear browser cookies** and login again

---

## 📊 **Success Criteria**

✅ **Signup Flow**:
- [ ] Faculty selection populates department dropdown
- [ ] Department validation works correctly
- [ ] User created with departmentId and role CHAIRPERSON

✅ **Authentication**:
- [ ] Session includes departmentId
- [ ] Login redirects to correct dashboard based on role

✅ **Curriculum Creation**:
- [ ] User's department auto-selected as default
- [ ] Visual indicators show smart default behavior
- [ ] Can select other departments in same faculty

✅ **API Security**:
- [ ] Department API filters by facultyId correctly
- [ ] Users can only access appropriate departments

✅ **Performance**:
- [ ] No significant slowdown in queries
- [ ] Department selection is responsive

---

## 🔄 **Rollback Plan** (if issues occur)

### **Database Rollback**:
```sql
-- Remove departmentId column
ALTER TABLE users DROP COLUMN department_id;

-- Remove indexes
DROP INDEX IF EXISTS idx_users_department_id;
DROP INDEX IF EXISTS idx_users_faculty_department;
```

### **Code Rollback**:
1. Revert Prisma schema changes
2. Revert AuthForm component
3. Revert auth configuration
4. Run `npx prisma generate`

---

**🎯 Ready to test when database connection is restored!**

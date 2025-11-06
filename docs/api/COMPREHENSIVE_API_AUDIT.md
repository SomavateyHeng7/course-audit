# 🔍 COMPREHENSIVE DEPARTMENT ACCESS CONTROL AUDIT

## 📋 **API ENDPOINTS REQUIRING DEPARTMENT-BASED ACCESS CONTROL**

### **✅ COMPLETED ENDPOINTS**

#### **Core Resource Collection Endpoints** ✅
- ✅ `src/app/api/curricula/route.ts` (GET/POST) - Faculty-wide filtering
- ✅ `src/app/api/blacklists/route.ts` (GET/POST) - Faculty-wide filtering
- ✅ `src/app/api/concentrations/route.ts` (GET/POST) - Faculty-wide filtering
- ✅ `src/app/api/course-types/route.ts` (GET/POST) - Faculty-wide filtering

#### **Core Resource Individual Endpoints** ✅
- ✅ `src/app/api/curricula/[id]/route.ts` (GET/PUT/DELETE) - Faculty-wide access
- ✅ `src/app/api/blacklists/[id]/route.ts` (GET/PUT/DELETE) - Faculty-wide access
- ✅ `src/app/api/concentrations/[id]/route.ts` (GET/PUT/DELETE) - Faculty-wide access
- ✅ `src/app/api/course-types/[id]/route.ts` (GET/PUT/DELETE) - Faculty-wide access

#### **Curriculum Sub-Resource Endpoints** ✅
- ✅ `src/app/api/curricula/[id]/constraints/[constraintId]/route.ts` (PUT/DELETE) - Faculty-wide access
- ✅ `src/app/api/curricula/[id]/elective-rules/[ruleId]/route.ts` (PUT/DELETE) - Faculty-wide access
- ✅ `src/app/api/curricula/[id]/elective-rules/settings/route.ts` (PUT) - Faculty-wide access

---

### **⚠️ ENDPOINTS REQUIRING VERIFICATION**

#### **Collection Endpoints That May Need Department Scoping** ✅ **COMPLETED**
1. **`src/app/api/curricula/[id]/constraints/route.ts`** ✅ **UPDATED** - GET/POST constraints with faculty-wide access
2. **`src/app/api/curricula/[id]/elective-rules/route.ts`** ✅ **UPDATED** - GET/POST elective rules with faculty-wide access
3. **`src/app/api/curricula/[id]/courses/route.ts`** ✅ **UPDATED** - POST curriculum courses with faculty-wide access
4. **`src/app/api/curricula/[id]/blacklists/route.ts`** ✅ **UPDATED** - GET/POST curriculum blacklists with faculty-wide access
5. **`src/app/api/curricula/[id]/concentrations/route.ts`** - ⏳ **NEEDS CHECK** - GET/POST curriculum concentrations

#### **Department-Specific Endpoints** ⏳ **NEEDS CHECK**
6. **`src/app/api/department/course-types/assignments/route.ts`** - ⏳ **EMPTY FILE** - GET/POST course type assignments
7. **`src/app/api/department/course-types/assignments/[courseId]/route.ts`** - ⏳ **NEEDS CHECK** - PUT/DELETE assignments

#### **Course-Related Endpoints (Department-Scoped)** ⏳ **NEEDS CHECK**
8. **`src/app/api/courses/route.ts`** - ⏳ **NEEDS DEPARTMENT FILTERING** - GET/POST courses
9. **`src/app/api/courses/[courseId]/route.ts`** - ⏳ **NEEDS CHECK** - GET/PUT/DELETE individual courses
10. **`src/app/api/courses/search/route.ts`** - ⏳ **NEEDS CHECK** - Course search (needs department filtering)
11. **`src/app/api/courses/bulk-create/route.ts`** - ⏳ **NEEDS CHECK** - Bulk course creation

#### **Course Assignment Endpoints** ⏳ **NEEDS CHECK**
12. **`src/app/api/course-types/assign/route.ts`** - ⏳ **NEEDS CHECK** - Course type assignment
13. **`src/app/api/concentrations/[id]/courses/route.ts`** - ⏳ **NEEDS CHECK** - GET/POST concentration courses

---

### **🔒 ENDPOINTS THAT DON'T NEED DEPARTMENT SCOPING**

#### **Authentication & Global Endpoints** ✅
- ✅ `src/app/api/auth/signup/route.ts` - Has department validation
- ✅ `src/app/api/auth/[...nextauth]/route.ts` - Global auth
- ✅ `src/app/api/faculties/route.ts` - Global faculty list
- ✅ `src/app/api/faculties/[id]/route.ts` - Global faculty details
- ✅ `src/app/api/departments/route.ts` - Global department list (with faculty filtering)
- ✅ `src/app/api/departments/[id]/route.ts` - Global department details

#### **Admin & Test Endpoints** ✅
- ✅ `src/app/api/admin/users/route.ts` - Admin-only (SUPER_ADMIN access)
- ✅ `src/app/api/admin/users/[id]/route.ts` - Admin-only (SUPER_ADMIN access)
- ✅ `src/app/api/test/route.ts` - Test endpoint
- ✅ `src/app/api/test-db/route.ts` - Test endpoint
- ✅ `src/app/api/student-profile/route.ts` - Student-specific

#### **Utility Endpoints** ✅
- ✅ `src/app/api/faculty/concentration-label/route.ts` - Label utility
- ✅ `src/app/api/curriculum/upload/route.ts` - Upload utility

#### **Course Relationships (Course-Scoped, Not Department-Scoped)** ✅
- ✅ `src/app/api/courses/[courseId]/prerequisites/route.ts` - Course prerequisites
- ✅ `src/app/api/courses/[courseId]/prerequisites/[prerequisiteRelationId]/route.ts` - Individual prerequisites
- ✅ `src/app/api/courses/[courseId]/corequisites/route.ts` - Course corequisites
- ✅ `src/app/api/courses/[courseId]/corequisites/[corequisiteRelationId]/route.ts` - Individual corequisites
- ✅ `src/app/api/courses/[courseId]/constraints/route.ts` - Course constraints
- ✅ `src/app/api/curriculum/[id]/courses/[courseId]/prerequisites/route.ts` - Curriculum course prerequisites
- ✅ `src/app/api/curriculum/[id]/courses/[courseId]/corequisites/route.ts` - Curriculum course corequisites

---

## 🔍 **VERIFICATION CHECKLIST**

### **1. Collection Endpoints Under Curriculum** ⚠️ **NEEDS CHECK**
These inherit access from their parent curriculum, but need verification:

- [ ] `src/app/api/curricula/[id]/constraints/route.ts`
- [ ] `src/app/api/curricula/[id]/elective-rules/route.ts` 
- [ ] `src/app/api/curricula/[id]/courses/route.ts`
- [ ] `src/app/api/curricula/[id]/blacklists/route.ts`
- [ ] `src/app/api/curricula/[id]/concentrations/route.ts`

### **2. Department-Specific Course Management** ⚠️ **NEEDS CHECK**
These directly operate on department-scoped resources:

- [ ] `src/app/api/department/course-types/assignments/route.ts`
- [ ] `src/app/api/department/course-types/assignments/[courseId]/route.ts`
- [ ] `src/app/api/course-types/assign/route.ts`

### **3. Course Management Endpoints** ⚠️ **NEEDS CHECK**
Courses themselves may need department scoping:

- [ ] `src/app/api/courses/route.ts`
- [ ] `src/app/api/courses/[courseId]/route.ts`
- [ ] `src/app/api/courses/search/route.ts`
- [ ] `src/app/api/courses/bulk-create/route.ts`

### **4. Concentration Course Management** ⚠️ **NEEDS CHECK**
- [ ] `src/app/api/concentrations/[id]/courses/route.ts`

---

## 🎯 **PRIORITY VERIFICATION ORDER**

### **High Priority** 🔴
1. **Curriculum sub-resources** - These should inherit faculty-wide access
2. **Department course type assignments** - Direct department operations
3. **Course management** - May need department filtering

### **Medium Priority** 🟡
1. **Concentration course management** - Inherits from concentration
2. **Course search and bulk operations** - May need department filtering

### **Low Priority** 🟢
1. **Course relationship endpoints** - Already course-scoped

---

## 📊 **CURRENT IMPLEMENTATION STATUS**

✅ **Completed**: 11/15 core endpoints (73%)
⚠️ **Needs Verification**: 14 endpoints
🔒 **Not Applicable**: 20+ endpoints (global/admin/utility)

**Next Action**: Systematically verify the 14 endpoints that need checking.

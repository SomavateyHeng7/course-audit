# Elective Rules Backend Implementation

## 🎯 Overview

This document describes the complete backend implementation for the Elective Rules functionality in the course audit system. The implementation provides APIs for managing elective rules, course requirements, and free elective credits within curricula.

## 📋 API Endpoints

### 1. Get Elective Rules Data
**Endpoint:** `GET /api/curricula/[id]/elective-rules`

**Description:** Retrieves all elective rules, course categories, and curriculum courses for a specific curriculum.

**Response:**
```json
{
  "electiveRules": [
    {
      "id": "rule_id",
      "curriculumId": "curriculum_id", 
      "category": "Major Elective",
      "requiredCredits": 12,
      "description": "Students must complete 12 credits from major elective courses",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "courseCategories": ["Core", "Major", "Major Elective", "General Education"],
  "curriculumCourses": [
    {
      "id": "course_id",
      "code": "CSX 3101", 
      "name": "Mobile App Development",
      "category": "Major Elective",
      "credits": 3,
      "isRequired": false,
      "semester": "Fall",
      "year": 3
    }
  ]
}
```

### 2. Create Elective Rule
**Endpoint:** `POST /api/curricula/[id]/elective-rules`

**Request Body:**
```json
{
  "category": "Major Elective",
  "requiredCredits": 12,
  "description": "Students must complete 12 credits from major elective courses"
}
```

**Response:**
```json
{
  "electiveRule": {
    "id": "new_rule_id",
    "curriculumId": "curriculum_id",
    "category": "Major Elective", 
    "requiredCredits": 12,
    "description": "Students must complete 12 credits from major elective courses",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. Update Elective Rule
**Endpoint:** `PUT /api/curricula/[id]/elective-rules/[ruleId]`

**Request Body:**
```json
{
  "requiredCredits": 15,
  "description": "Updated description"
}
```

**Response:**
```json
{
  "electiveRule": {
    "id": "rule_id",
    "curriculumId": "curriculum_id",
    "category": "Major Elective",
    "requiredCredits": 15,
    "description": "Updated description",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:01Z"
  }
}
```

### 4. Delete Elective Rule
**Endpoint:** `DELETE /api/curricula/[id]/elective-rules/[ruleId]`

**Response:**
```json
{
  "message": "Elective rule deleted successfully"
}
```

### 5. Update Elective Settings
**Endpoint:** `PUT /api/curricula/[id]/elective-rules/settings`

**Description:** Batch update for free elective credits and course requirement statuses.

**Request Body:**
```json
{
  "freeElectiveCredits": 6,
  "courseRequirements": [
    {
      "courseId": "course_id_1",
      "isRequired": true
    },
    {
      "courseId": "course_id_2", 
      "isRequired": false
    }
  ]
}
```

**Response:**
```json
{
  "message": "Elective rules settings updated successfully",
  "updatesCount": 3
}
```

## 🗃️ Database Schema

### ElectiveRule Model
```prisma
model ElectiveRule {
  id                  String     @id @default(cuid())
  curriculumId        String
  curriculum          Curriculum @relation(fields: [curriculumId], references: [id], onDelete: Cascade)
  category            String     // e.g., "Major Elective", "Free Elective"
  requiredCredits     Int        // How many credits required from this category
  description         String?    // Additional description
  
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  @@unique([curriculumId, category])
  @@index([curriculumId])
  @@map("elective_rules")
}
```

## 🛠️ Frontend Integration

### API Service
**File:** `src/services/electiveRulesApi.ts`

The service provides a complete interface for frontend components:

```typescript
import { electiveRulesApi } from '@/services/electiveRulesApi';

// Get elective rules data
const data = await electiveRulesApi.getElectiveRules(curriculumId);

// Create new rule  
const rule = await electiveRulesApi.createElectiveRule(curriculumId, {
  category: "Major Elective",
  requiredCredits: 12,
  description: "Description"
});

// Update rule
const updatedRule = await electiveRulesApi.updateElectiveRule(
  curriculumId, 
  ruleId, 
  { requiredCredits: 15 }
);

// Delete rule
await electiveRulesApi.deleteElectiveRule(curriculumId, ruleId);

// Update settings
await electiveRulesApi.updateElectiveSettings(curriculumId, {
  freeElectiveCredits: 6,
  courseRequirements: [...]
});
```

### Component Integration
**File:** `src/components/curriculum/ElectiveRulesTab.tsx`

The component has been fully integrated with the backend:

- ✅ Loads real data from curriculum courses
- ✅ Dynamic category breakdown based on actual course data
- ✅ Real-time updates for course requirement changes
- ✅ Auto-save for free elective credits
- ✅ Batch save for all configuration changes
- ✅ Loading and error states
- ✅ Proper error handling and user feedback

## 🔒 Security & Validation

### Authentication & Authorization
- ✅ JWT authentication required for all endpoints
- ✅ CHAIRPERSON role required for all operations
- ✅ Private ownership validation (users can only access their curricula)

### Input Validation
- ✅ Category and required credits validation
- ✅ Non-negative credit validation (0-∞ range)
- ✅ Course existence validation
- ✅ Duplicate category prevention per curriculum
- ✅ Curriculum ownership verification

### Data Integrity
- ✅ Unique constraint on curriculumId + category
- ✅ Cascade deletion when curriculum is deleted
- ✅ Foreign key constraints maintained
- ✅ Transaction support for batch operations

## 📊 Audit Trail

All operations are logged in the AuditLog table:

```json
{
  "userId": "user_id",
  "entityType": "ElectiveRule", 
  "entityId": "rule_id",
  "action": "CREATE|UPDATE|DELETE",
  "changes": {
    "before": { "requiredCredits": 12 },
    "after": { "requiredCredits": 15 }
  },
  "curriculumId": "curriculum_id",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## 🧪 Testing

### Test File
**File:** `test_elective_rules.sql`

Provides comprehensive SQL queries for testing:
- ✅ Data verification queries
- ✅ Sample data insertion
- ✅ Credit breakdown calculations
- ✅ Audit log verification
- ✅ Cleanup procedures

### Test Scenarios
1. **Basic CRUD Operations**
   - Create elective rule
   - Read elective rules
   - Update elective rule
   - Delete elective rule

2. **Settings Management**
   - Update free elective credits
   - Batch update course requirements
   - Mixed setting updates

3. **Validation Testing**
   - Duplicate category prevention
   - Invalid credit values
   - Non-existent curriculum access
   - Unauthorized access attempts

4. **Edge Cases**
   - Empty course lists
   - Missing categories
   - Large credit values
   - Concurrent updates

## 🎯 Key Features

### Dynamic Category Management
- Categories are automatically determined from actual course data
- No hardcoded category lists
- Supports any number of categories
- Real-time category updates

### Flexible Credit System
- Free elective credits managed separately from course-based electives
- Credit-only requirements (no specific course count)
- Variable course assignments per category

### Real-time Updates
- Auto-save for individual changes
- Batch save for complete configuration
- Immediate UI feedback
- Error recovery and retry mechanisms

### Credit Breakdown Calculation
- Automatic calculation by category
- Required vs. elective credit separation
- Total program credit calculation
- Free elective integration

## 🚀 Performance Considerations

### Database Optimization
- ✅ Proper indexing on curriculumId
- ✅ Unique constraints for data integrity
- ✅ Efficient queries with minimal joins
- ✅ Batch operations for multiple updates

### Frontend Optimization
- ✅ Debounced auto-save to prevent excessive API calls
- ✅ Local state management for immediate UI updates
- ✅ Error boundaries and graceful degradation
- ✅ Loading states for better UX

## 📝 Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| **Backend APIs** | ✅ Complete | All endpoints implemented |
| **Database Schema** | ✅ Complete | ElectiveRule model ready |
| **Frontend Service** | ✅ Complete | Full API integration |
| **Component Integration** | ✅ Complete | Real backend data |
| **Error Handling** | ✅ Complete | Comprehensive error management |
| **Security** | ✅ Complete | Authentication & authorization |
| **Audit Logging** | ✅ Complete | Full change tracking |
| **Testing** | ✅ Complete | SQL test file provided |

## 🔄 Integration with Other Systems

### Curriculum Management
- Elective rules are automatically deleted when curriculum is deleted
- Course changes in curriculum reflect in elective rules data
- Category changes update dynamically

### Course Management  
- Course requirement status updates curriculum courses
- Category changes affect elective rule options
- Credit changes impact breakdown calculations

### Audit System
- All changes logged with full context
- User attribution and timestamps
- Change tracking for accountability

## 🎉 Conclusion

The Elective Rules backend implementation is **100% complete** and production-ready. It provides:

- ✅ Full CRUD operations for elective rules
- ✅ Dynamic category management based on actual course data
- ✅ Flexible credit system with free electives support
- ✅ Real-time frontend integration with auto-save
- ✅ Comprehensive security and validation
- ✅ Complete audit trail
- ✅ Robust error handling and recovery

The system is ready for immediate use and integrates seamlessly with the existing curriculum management functionality.

# API Specification for Course Audit System

## Overview
This document outlines the complete API specification for the Course Audit System, including all endpoints needed to support the enhanced frontend features.

## Base URL
```
https://your-domain.com/api
```

## Authentication
All endpoints require authentication via JWT tokens, except for public authentication endpoints.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Error Responses
All endpoints follow consistent error response format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details if applicable"
  }
}
```

## 1. Authentication Endpoints

### POST /api/auth/signin
Sign in user and return JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "CHAIRPERSON"
  },
  "token": "jwt_token_here"
}
```

### POST /api/auth/signup
Register new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "role": "CHAIRPERSON",
  "facultyId": "faculty_id"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "CHAIRPERSON"
  },
  "token": "jwt_token_here"
}
```

### POST /api/auth/signout
Sign out current user.

**Response:**
```json
{
  "message": "Successfully signed out"
}
```

## 2. Course Management Endpoints

### GET /api/courses
Get all courses with filtering and search.

**Query Parameters:**
- `search` (string): Search term for course code, name, or description
- `category` (string): Filter by course category
- `credits` (number): Filter by credit hours
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

**Response:**
```json
{
  "courses": [
    {
      "id": "course_id",
      "code": "CS101",
      "name": "Introduction to Computer Science",
      "credits": 3,
      "creditHours": "3-0-6",
      "description": "Course description",
      "category": "Core",
      "requiresPermission": false,
      "summerOnly": false,
      "requiresSeniorStanding": false,
      "minCreditThreshold": null,
      "isActive": true,
      "prerequisites": [],
      "corequisites": []
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### POST /api/courses
Create new course.

**Request:**
```json
{
  "code": "CS101",
  "name": "Introduction to Computer Science",
  "credits": 3,
  "creditHours": "3-0-6",
  "description": "Course description",
  "category": "Core",
  "requiresPermission": false,
  "summerOnly": false,
  "requiresSeniorStanding": false,
  "minCreditThreshold": null
}
```

**Response:**
```json
{
  "course": {
    "id": "course_id",
    "code": "CS101",
    "name": "Introduction to Computer Science",
    "credits": 3,
    "creditHours": "3-0-6",
    "description": "Course description",
    "category": "Core",
    "requiresPermission": false,
    "summerOnly": false,
    "requiresSeniorStanding": false,
    "minCreditThreshold": null,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/courses/[id]
Get specific course by ID.

**Response:**
```json
{
  "course": {
    "id": "course_id",
    "code": "CS101",
    "name": "Introduction to Computer Science",
    "credits": 3,
    "creditHours": "3-0-6",
    "description": "Course description",
    "category": "Core",
    "requiresPermission": false,
    "summerOnly": false,
    "requiresSeniorStanding": false,
    "minCreditThreshold": null,
    "isActive": true,
    "prerequisites": [
      {
        "id": "prereq_id",
        "prerequisite": {
          "id": "prereq_course_id",
          "code": "MATH101",
          "name": "Calculus I",
          "credits": 3
        }
      }
    ],
    "corequisites": [],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/courses/[id]
Update existing course.

**Request:**
```json
{
  "code": "CS101",
  "name": "Introduction to Computer Science",
  "credits": 3,
  "creditHours": "3-0-6",
  "description": "Updated course description",
  "category": "Core",
  "requiresPermission": false,
  "summerOnly": false,
  "requiresSeniorStanding": true,
  "minCreditThreshold": 90
}
```

**Response:**
```json
{
  "course": {
    "id": "course_id",
    "code": "CS101",
    "name": "Introduction to Computer Science",
    "credits": 3,
    "creditHours": "3-0-6",
    "description": "Updated course description",
    "category": "Core",
    "requiresPermission": false,
    "summerOnly": false,
    "requiresSeniorStanding": true,
    "minCreditThreshold": 90,
    "isActive": true,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/courses/[id]
Delete course (soft delete).

**Response:**
```json
{
  "message": "Course deleted successfully"
}
```

## 3. Curriculum Management Endpoints

### GET /api/curricula
Get all curricula for current user.

**Query Parameters:**
- `search` (string): Search term for curriculum name
- `year` (string): Filter by year
- `isActive` (boolean): Filter by active status
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

**Response:**
```json
{
  "curricula": [
    {
      "id": "curriculum_id",
      "name": "Computer Science Curriculum 2024",
      "year": "2024",
      "version": "1.0",
      "description": "Updated curriculum for 2024",
      "isActive": true,
      "department": {
        "id": "dept_id",
        "name": "Computer Science",
        "code": "CS"
      },
      "faculty": {
        "id": "faculty_id",
        "name": "Engineering",
        "code": "ENG"
      },
      "createdBy": {
        "id": "user_id",
        "name": "Dr. Smith",
        "email": "smith@university.edu"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### POST /api/curricula
Create new curriculum.

**Request:**
```json
{
  "name": "Computer Science Curriculum 2024",
  "year": "2024",
  "version": "1.0",
  "description": "Updated curriculum for 2024",
  "departmentId": "dept_id"
}
```

**Response:**
```json
{
  "curriculum": {
    "id": "curriculum_id",
    "name": "Computer Science Curriculum 2024",
    "year": "2024",
    "version": "1.0",
    "description": "Updated curriculum for 2024",
    "isActive": true,
    "departmentId": "dept_id",
    "createdById": "user_id",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/curricula/[id]
Get specific curriculum by ID.

**Response:**
```json
{
  "curriculum": {
    "id": "curriculum_id",
    "name": "Computer Science Curriculum 2024",
    "year": "2024",
    "version": "1.0",
    "description": "Updated curriculum for 2024",
    "isActive": true,
    "department": {
      "id": "dept_id",
      "name": "Computer Science",
      "code": "CS"
    },
    "faculty": {
      "id": "faculty_id",
      "name": "Engineering",
      "code": "ENG"
    },
    "createdBy": {
      "id": "user_id",
      "name": "Dr. Smith"
    },
    "courses": [
      {
        "id": "curriculum_course_id",
        "course": {
          "id": "course_id",
          "code": "CS101",
          "name": "Introduction to Computer Science",
          "credits": 3,
          "category": "Core"
        },
        "isRequired": true,
        "semester": "Fall",
        "year": 1,
        "position": 1
      }
    ],
    "electiveRules": [
      {
        "id": "elective_rule_id",
        "category": "Major Elective",
        "requiredCredits": 9,
        "description": "Select 3 courses from major electives"
      }
    ],
    "concentrations": [
      {
        "id": "curriculum_concentration_id",
        "concentration": {
          "id": "concentration_id",
          "name": "Software Engineering",
          "description": "Focus on software development"
        },
        "requiredCourses": 3
      }
    ],
    "blacklists": [
      {
        "id": "curriculum_blacklist_id",
        "blacklist": {
          "id": "blacklist_id",
          "name": "Deprecated Courses",
          "description": "Old courses no longer valid"
        }
      }
    ],
    "constraints": [
      {
        "id": "constraint_id",
        "type": "SENIOR_STANDING",
        "name": "Senior Standing Required",
        "description": "Students must have senior standing",
        "isRequired": true,
        "config": {
          "minCredits": 90
        }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/curricula/[id]
Update curriculum.

**Request:**
```json
{
  "name": "Computer Science Curriculum 2024",
  "year": "2024",
  "version": "1.1",
  "description": "Updated curriculum for 2024",
  "isActive": true
}
```

**Response:**
```json
{
  "curriculum": {
    "id": "curriculum_id",
    "name": "Computer Science Curriculum 2024",
    "year": "2024",
    "version": "1.1",
    "description": "Updated curriculum for 2024",
    "isActive": true,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/curricula/[id]
Delete curriculum.

**Response:**
```json
{
  "message": "Curriculum deleted successfully"
}
```

## 4. Blacklist Management Endpoints

### GET /api/blacklists
Get all blacklists for current user.

**Query Parameters:**
- `search` (string): Search term for blacklist name
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

**Response:**
```json
{
  "blacklists": [
    {
      "id": "blacklist_id",
      "name": "Deprecated Courses",
      "description": "Old courses no longer valid",
      "department": {
        "id": "dept_id",
        "name": "Computer Science",
        "code": "CS"
      },
      "createdBy": {
        "id": "user_id",
        "name": "Dr. Smith"
      },
      "courseCount": 5,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### POST /api/blacklists
Create new blacklist.

**Request:**
```json
{
  "name": "Deprecated Courses",
  "description": "Old courses no longer valid",
  "departmentId": "dept_id"
}
```

**Response:**
```json
{
  "blacklist": {
    "id": "blacklist_id",
    "name": "Deprecated Courses",
    "description": "Old courses no longer valid",
    "departmentId": "dept_id",
    "createdById": "user_id",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/blacklists/[id]
Get specific blacklist by ID.

**Response:**
```json
{
  "blacklist": {
    "id": "blacklist_id",
    "name": "Deprecated Courses",
    "description": "Old courses no longer valid",
    "department": {
      "id": "dept_id",
      "name": "Computer Science",
      "code": "CS"
    },
    "createdBy": {
      "id": "user_id",
      "name": "Dr. Smith"
    },
    "courses": [
      {
        "id": "blacklist_course_id",
        "course": {
          "id": "course_id",
          "code": "CS100",
          "name": "Intro to Programming",
          "credits": 3,
          "category": "Core"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/blacklists/[id]
Update blacklist.

**Request:**
```json
{
  "name": "Deprecated Courses",
  "description": "Updated description for deprecated courses"
}
```

**Response:**
```json
{
  "blacklist": {
    "id": "blacklist_id",
    "name": "Deprecated Courses",
    "description": "Updated description for deprecated courses",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/blacklists/[id]
Delete blacklist.

**Response:**
```json
{
  "message": "Blacklist deleted successfully"
}
```

### POST /api/blacklists/[id]/courses
Add courses to blacklist.

**Request:**
```json
{
  "courseIds": ["course_id_1", "course_id_2"]
}
```

**Response:**
```json
{
  "message": "Courses added to blacklist successfully",
  "addedCourses": [
    {
      "id": "course_id_1",
      "code": "CS100",
      "name": "Intro to Programming"
    },
    {
      "id": "course_id_2",
      "code": "CS200",
      "name": "Data Structures"
    }
  ]
}
```

### DELETE /api/blacklists/[id]/courses/[courseId]
Remove course from blacklist.

**Response:**
```json
{
  "message": "Course removed from blacklist successfully"
}
```

## 5. Concentration Management Endpoints

### GET /api/concentrations
Get all concentrations for current user.

**Query Parameters:**
- `search` (string): Search term for concentration name
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

**Response:**
```json
{
  "concentrations": [
    {
      "id": "concentration_id",
      "name": "Software Engineering",
      "description": "Focus on software development",
      "department": {
        "id": "dept_id",
        "name": "Computer Science",
        "code": "CS"
      },
      "createdBy": {
        "id": "user_id",
        "name": "Dr. Smith"
      },
      "courseCount": 8,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### POST /api/concentrations
Create new concentration.

**Request:**
```json
{
  "name": "Software Engineering",
  "description": "Focus on software development",
  "departmentId": "dept_id"
}
```

**Response:**
```json
{
  "concentration": {
    "id": "concentration_id",
    "name": "Software Engineering",
    "description": "Focus on software development",
    "departmentId": "dept_id",
    "createdById": "user_id",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/concentrations/[id]
Get specific concentration by ID.

**Response:**
```json
{
  "concentration": {
    "id": "concentration_id",
    "name": "Software Engineering",
    "description": "Focus on software development",
    "department": {
      "id": "dept_id",
      "name": "Computer Science",
      "code": "CS"
    },
    "createdBy": {
      "id": "user_id",
      "name": "Dr. Smith"
    },
    "courses": [
      {
        "id": "concentration_course_id",
        "course": {
          "id": "course_id",
          "code": "CS301",
          "name": "Software Engineering",
          "credits": 3,
          "category": "Major"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/concentrations/[id]
Update concentration.

**Request:**
```json
{
  "name": "Software Engineering",
  "description": "Updated focus on software development and architecture"
}
```

**Response:**
```json
{
  "concentration": {
    "id": "concentration_id",
    "name": "Software Engineering",
    "description": "Updated focus on software development and architecture",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/concentrations/[id]
Delete concentration.

**Response:**
```json
{
  "message": "Concentration deleted successfully"
}
```

### POST /api/concentrations/[id]/courses
Add courses to concentration.

**Request:**
```json
{
  "courseIds": ["course_id_1", "course_id_2"]
}
```

**Response:**
```json
{
  "message": "Courses added to concentration successfully",
  "addedCourses": [
    {
      "id": "course_id_1",
      "code": "CS301",
      "name": "Software Engineering"
    },
    {
      "id": "course_id_2",
      "code": "CS302",
      "name": "Software Architecture"
    }
  ]
}
```

### DELETE /api/concentrations/[id]/courses/[courseId]
Remove course from concentration.

**Response:**
```json
{
  "message": "Course removed from concentration successfully"
}
```

## 6. Curriculum Configuration Endpoints

### GET /api/curricula/[id]/courses
Get courses assigned to curriculum.

**Response:**
```json
{
  "courses": [
    {
      "id": "curriculum_course_id",
      "course": {
        "id": "course_id",
        "code": "CS101",
        "name": "Introduction to Computer Science",
        "credits": 3,
        "category": "Core"
      },
      "isRequired": true,
      "semester": "Fall",
      "year": 1,
      "position": 1,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/curricula/[id]/courses
Add courses to curriculum.

**Request:**
```json
{
  "courses": [
    {
      "courseId": "course_id_1",
      "isRequired": true,
      "semester": "Fall",
      "year": 1,
      "position": 1
    },
    {
      "courseId": "course_id_2",
      "isRequired": false,
      "semester": "Spring",
      "year": 1,
      "position": 2
    }
  ]
}
```

**Response:**
```json
{
  "message": "Courses added to curriculum successfully",
  "addedCourses": [
    {
      "id": "curriculum_course_id_1",
      "course": {
        "id": "course_id_1",
        "code": "CS101",
        "name": "Introduction to Computer Science"
      },
      "isRequired": true,
      "semester": "Fall",
      "year": 1,
      "position": 1
    }
  ]
}
```

### DELETE /api/curricula/[id]/courses/[courseId]
Remove course from curriculum.

**Response:**
```json
{
  "message": "Course removed from curriculum successfully"
}
```

## 7. Curriculum Constraints Endpoints

### GET /api/curricula/[id]/constraints
Get curriculum constraints.

**Response:**
```json
{
  "constraints": [
    {
      "id": "constraint_id",
      "type": "SENIOR_STANDING",
      "name": "Senior Standing Required",
      "description": "Students must have senior standing",
      "isRequired": true,
      "config": {
        "minCredits": 90
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/curricula/[id]/constraints
Add constraint to curriculum.

**Request:**
```json
{
  "type": "SENIOR_STANDING",
  "name": "Senior Standing Required",
  "description": "Students must have senior standing",
  "isRequired": true,
  "config": {
    "minCredits": 90
  }
}
```

**Response:**
```json
{
  "constraint": {
    "id": "constraint_id",
    "type": "SENIOR_STANDING",
    "name": "Senior Standing Required",
    "description": "Students must have senior standing",
    "isRequired": true,
    "config": {
      "minCredits": 90
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/curricula/[id]/constraints/[constraintId]
Update curriculum constraint.

**Request:**
```json
{
  "name": "Senior Standing Required",
  "description": "Students must have at least 90 credits",
  "isRequired": true,
  "config": {
    "minCredits": 95
  }
}
```

**Response:**
```json
{
  "constraint": {
    "id": "constraint_id",
    "type": "SENIOR_STANDING",
    "name": "Senior Standing Required",
    "description": "Students must have at least 90 credits",
    "isRequired": true,
    "config": {
      "minCredits": 95
    },
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/curricula/[id]/constraints/[constraintId]
Delete curriculum constraint.

**Response:**
```json
{
  "message": "Constraint deleted successfully"
}
```

## 8. Elective Rules Endpoints

### GET /api/curricula/[id]/elective-rules
Get elective rules for curriculum.

**Response:**
```json
{
  "electiveRules": [
    {
      "id": "elective_rule_id",
      "category": "Major Elective",
      "requiredCredits": 9,
      "description": "Select 3 courses from major electives",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/curricula/[id]/elective-rules
Add elective rule to curriculum.

**Request:**
```json
{
  "category": "Major Elective",
  "requiredCredits": 9,
  "description": "Select 3 courses from major electives"
}
```

**Response:**
```json
{
  "electiveRule": {
    "id": "elective_rule_id",
    "category": "Major Elective",
    "requiredCredits": 9,
    "description": "Select 3 courses from major electives",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /api/curricula/[id]/elective-rules/[ruleId]
Update elective rule.

**Request:**
```json
{
  "category": "Major Elective",
  "requiredCredits": 12,
  "description": "Select 4 courses from major electives"
}
```

**Response:**
```json
{
  "electiveRule": {
    "id": "elective_rule_id",
    "category": "Major Elective",
    "requiredCredits": 12,
    "description": "Select 4 courses from major electives",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/curricula/[id]/elective-rules/[ruleId]
Delete elective rule.

**Response:**
```json
{
  "message": "Elective rule deleted successfully"
}
```

## 9. Prerequisites and Corequisites Endpoints

### GET /api/courses/[id]/prerequisites
Get course prerequisites.

**Response:**
```json
{
  "prerequisites": [
    {
      "id": "prerequisite_id",
      "prerequisite": {
        "id": "prereq_course_id",
        "code": "MATH101",
        "name": "Calculus I",
        "credits": 3
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/courses/[id]/prerequisites
Add prerequisite to course.

**Request:**
```json
{
  "prerequisiteId": "prereq_course_id"
}
```

**Response:**
```json
{
  "prerequisite": {
    "id": "prerequisite_id",
    "prerequisite": {
      "id": "prereq_course_id",
      "code": "MATH101",
      "name": "Calculus I",
      "credits": 3
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/courses/[id]/prerequisites/[prerequisiteId]
Remove prerequisite from course.

**Response:**
```json
{
  "message": "Prerequisite removed successfully"
}
```

### GET /api/courses/[id]/corequisites
Get course corequisites.

**Response:**
```json
{
  "corequisites": [
    {
      "id": "corequisite_id",
      "corequisite": {
        "id": "coreq_course_id",
        "code": "PHYS101",
        "name": "Physics I",
        "credits": 3
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/courses/[id]/corequisites
Add corequisite to course.

**Request:**
```json
{
  "corequisiteId": "coreq_course_id"
}
```

**Response:**
```json
{
  "corequisite": {
    "id": "corequisite_id",
    "corequisite": {
      "id": "coreq_course_id",
      "code": "PHYS101",
      "name": "Physics I",
      "credits": 3
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### DELETE /api/courses/[id]/corequisites/[corequisiteId]
Remove corequisite from course.

**Response:**
```json
{
  "message": "Corequisite removed successfully"
}
```

## 10. Audit and Reporting Endpoints

### GET /api/audit-logs
Get audit logs with filtering.

**Query Parameters:**
- `entityType` (string): Filter by entity type
- `entityId` (string): Filter by entity ID
- `userId` (string): Filter by user ID
- `action` (string): Filter by action type
- `startDate` (string): Filter by start date
- `endDate` (string): Filter by end date
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

**Response:**
```json
{
  "auditLogs": [
    {
      "id": "audit_log_id",
      "user": {
        "id": "user_id",
        "name": "Dr. Smith",
        "email": "smith@university.edu"
      },
      "entityType": "Curriculum",
      "entityId": "curriculum_id",
      "action": "UPDATE",
      "changes": {
        "before": {
          "name": "Old Curriculum Name"
        },
        "after": {
          "name": "New Curriculum Name"
        }
      },
      "description": "Updated curriculum name",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### GET /api/reports/curriculum-usage
Get curriculum usage statistics.

**Response:**
```json
{
  "statistics": {
    "totalCurricula": 15,
    "activeCurricula": 12,
    "inactiveCurricula": 3,
    "averageCoursesPerCurriculum": 45.2,
    "mostUsedCourses": [
      {
        "course": {
          "id": "course_id",
          "code": "CS101",
          "name": "Introduction to Computer Science"
        },
        "usageCount": 8
      }
    ]
  }
}
```

## 11. System Configuration Endpoints

### GET /api/system-settings
Get system settings.

**Response:**
```json
{
  "settings": [
    {
      "id": "setting_id",
      "key": "MAX_COURSES_PER_CURRICULUM",
      "value": "50",
      "description": "Maximum number of courses allowed per curriculum"
    }
  ]
}
```

### PUT /api/system-settings/[key]
Update system setting.

**Request:**
```json
{
  "value": "60"
}
```

**Response:**
```json
{
  "setting": {
    "id": "setting_id",
    "key": "MAX_COURSES_PER_CURRICULUM",
    "value": "60",
    "description": "Maximum number of courses allowed per curriculum",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Status Codes

- `200 OK` - Successful GET, PUT requests
- `201 Created` - Successful POST requests
- `204 No Content` - Successful DELETE requests
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource or constraint violation
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

## Rate Limiting

All API endpoints are subject to rate limiting:
- 100 requests per minute per user for standard endpoints
- 20 requests per minute per user for bulk operations
- 5 requests per minute per user for report generation

## Caching

Responses are cached where appropriate:
- Course data: 5 minutes
- Curriculum data: 2 minutes
- User sessions: 15 minutes
- System settings: 30 minutes

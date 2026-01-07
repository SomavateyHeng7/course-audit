# Graduation Roadmap Portal Feature

## Overview

A portal system that allows students to submit their graduation roadmaps for validation by department chairpersons. The system enables anonymous submissions through PIN-protected access.

## User Roles

### Chairperson
- Creates submission portals for specific batches/curricula
- Sets portal details: name, description, deadline, accepted file formats
- Generates and distributes access PINs to students
- Receives and reviews submitted roadmap files
- Validates submissions against curriculum requirements
- Batch processes multiple submissions
- Approves or rejects graduation eligibility

### Student
- Views available submission portals
- Enters PIN to access a portal (anonymous access)
- Uploads graduation roadmap file (Excel/CSV)
- Receives confirmation of successful submission

## Portal Workflow

### Student Side
1. **Portal Selection** - Student browses available portals and selects one matching their batch/curriculum
2. **PIN Entry** - Student enters the access PIN provided by their chairperson
3. **File Upload** - Student uploads their graduation roadmap file (drag-and-drop or browse)
4. **Confirmation** - System confirms successful submission

### Chairperson Side
1. **Portal Management** - Create and manage submission portals with deadlines and PINs
2. **Submissions Review** - View all submitted files with status indicators
3. **Batch Processing** - Process multiple pending submissions at once
4. **Validation Review** - View detailed validation results including:
   - Credit progress (completed vs required)
   - Course completion status
   - Missing/in-progress courses
   - Issues and warnings
5. **Approval/Rejection** - Approve or reject submissions based on validation

## Key Features

- Anonymous submission (no student login required for submission)
- PIN-based access control per portal
- Support for Excel (.xlsx, .xls) and CSV file formats
- Deadline tracking with visual indicators
- Portal status management (active/closed)
- Multi-department support
- Batch validation processing
- Detailed progress visualization with donut charts
- Issue tracking and categorization

## Portal Information Displayed

- Portal name and description
- Chairperson name
- Faculty and department
- Target batch and curriculum
- Submission deadline
- Accepted file formats
- Portal status (active/closed)
- Submission count

## Validation Results Include

- Total credits vs required credits
- Completed courses vs total courses
- Graduation eligibility status
- Missing/in-progress courses list
- Issues categorized by type:
  - Credit shortage
  - Missing required courses
  - Failed courses
  - Prerequisite issues
  - Blacklist violations
- Warnings and recommendations

## Current Status

Frontend wireframe/demo pages created:
- Student side: `/student/GraduationPortal`
- Chairperson side: `/chairperson/GraduationPortal`

Both pages include mock data for demonstration purposes.

## Next Steps (To Be Discussed)

- Backend implementation and tech stack
- Database schema for portals and submissions
- PIN generation and management system
- File storage solution
- Excel/CSV parsing and validation logic
- Integration with existing curriculum data
- Email notifications for submission status

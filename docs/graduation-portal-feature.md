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

### Student
- Views available submission portals
- Enters PIN to access a portal (anonymous access)
- Uploads graduation roadmap file (Excel/CSV)
- Receives confirmation of successful submission

## Portal Workflow

1. **Portal Selection** - Student browses available portals and selects one matching their batch/curriculum
2. **PIN Entry** - Student enters the access PIN provided by their chairperson
3. **File Upload** - Student uploads their graduation roadmap file (drag-and-drop or browse)
4. **Confirmation** - System confirms successful submission

## Key Features

- Anonymous submission (no student login required for submission)
- PIN-based access control per portal
- Support for Excel (.xlsx, .xls) and CSV file formats
- Deadline tracking with visual indicators
- Portal status management (active/closed)
- Multi-department support

## Portal Information Displayed

- Portal name and description
- Chairperson name
- Faculty and department
- Target batch and curriculum
- Submission deadline
- Accepted file formats
- Portal status (active/closed)

## Current Status

Frontend wireframe/demo page created at `/student/GraduationPortal` with mock data for pitching purposes.

## Next Steps (To Be Discussed)

- Backend implementation and tech stack
- Database schema for portals and submissions
- PIN generation and management system
- File storage solution
- Chairperson portal management interface
- Submission review and validation workflow

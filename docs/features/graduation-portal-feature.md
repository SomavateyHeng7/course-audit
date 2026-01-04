# Graduation Roadmap Portal Feature

## Overview

The Graduation Roadmap Portal is a feature that enables anonymous file submission from students to department chairpersons for graduation progress validation. This creates a secure, PIN-protected channel for students to submit their graduation roadmaps without requiring authentication.

## Core Concept

### Student Side (Anonymous Submission)
- Students access a public portal page without logging in
- Chairpersons create "portals" with unique access PINs
- Students select their relevant portal (by department/batch/curriculum)
- Enter the PIN provided by their chairperson
- Upload Excel/CSV files containing their graduation roadmap
- Submission is completely anonymous

### Chairperson Side (Receiving & Validation)
- Chairpersons create portals with:
  - Portal name and description
  - Target batch/curriculum
  - Deadline
  - Unique access PIN
  - Accepted file formats
- Receive anonymous submissions
- Review uploaded roadmaps
- Validate graduation progress against curriculum requirements
- Post results according to department policy

## Key Features

### For Students
1. **Portal Discovery** - Browse available portals by department/faculty
2. **PIN Authentication** - Simple PIN entry for portal access
3. **File Upload** - Drag-and-drop or browse for Excel/CSV files
4. **Anonymous Submission** - No login required, privacy preserved
5. **Submission Confirmation** - Clear feedback on successful upload

### For Chairpersons
1. **Portal Management** - Create, edit, close portals
2. **PIN Generation** - Secure PIN creation and distribution
3. **Submission Dashboard** - View all received files
4. **Roadmap Validation** - Check progress against curriculum
5. **Batch Processing** - Handle multiple submissions efficiently

## User Flow

### Student Flow
```
1. Navigate to Graduation Portal page
2. View list of available portals
3. Select relevant portal (department/batch)
4. Enter access PIN
5. Upload graduation roadmap file
6. Receive confirmation
```

### Chairperson Flow
```
1. Create new portal with details
2. Set deadline and accepted formats
3. Generate/set access PIN
4. Distribute PIN to students
5. Monitor submissions
6. Review and validate roadmaps
7. Close portal when complete
```

## Technical Considerations (TBD)

- File storage strategy
- PIN security and hashing
- Rate limiting for submissions
- File validation and sanitization
- Notification system for new submissions
- Export/reporting capabilities

## Status

**Current:** Frontend wireframe for student side implemented
**Next Steps:** Discuss tech stack and implementation plan with team

---

*Last Updated: January 2026*

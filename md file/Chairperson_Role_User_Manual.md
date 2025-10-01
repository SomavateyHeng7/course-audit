# Course Audit System - Chairperson User Manual

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Main Dashboard](#main-dashboard)
4. [Curriculum Management](#curriculum-management)
5. [Course Configuration](#course-configuration)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## System Overview

The Course Audit System is a comprehensive platform designed for academic curriculum management. As a Chairperson, you have access to powerful tools for creating, editing, and managing academic curricula within your faculty. The system supports faculty-wide collaboration while maintaining department ownership and security boundaries.

### Key Capabilities
- **Curriculum Creation & Management**: Build comprehensive academic programs
- **Course Import & Organization**: Bulk import courses from Excel/CSV files  
- **Advanced Configuration**: Set up course types, constraints, and rules
- **Faculty Collaboration**: Work with other departments within your faculty
- **Data Management**: Organize blacklists, concentrations, and elective rules

---

## Getting Started

### System Access
After logging in, chairpersons are automatically redirected to the main curriculum management dashboard. Your access is scoped to your **faculty only** - you can view, edit, and create curricula for any department within your faculty, but cannot access other faculties' data.

### Department Association
- Your account is associated with a specific department within your faculty
- You can create and manage curricula for **any department in your faculty**
- The system provides smart defaults to your own department
- Visual indicators show department ownership throughout the interface
- **Faculty Boundary**: You cannot see or access curricula from other faculties

---

## Quick Tutorial Walkthrough

**🚀 Ready to test the system? Follow this 15-minute walkthrough to explore key features:**

### Tutorial 1: Explore the Dashboard (2 minutes)
1. **Start here**: You should see the main "Curriculum Management" dashboard
2. **Look for**: Search bar, curriculum count, and "Create New Curriculum" button
3. **Test search**: Try typing any text in the search bar to see real-time filtering
4. **Check empty state**: If no curricula exist, you'll see helpful guidance with a 📚 icon

### Tutorial 2: Create Your First Curriculum (8 minutes)
1. **Click**: "Create New Curriculum" button (bright blue, top right)
2. **Fill out left panel**:
   - **Name**: "Test Curriculum 2025"
   - **Year**: "2025" 
   - **Total Credits**: "120"
   - **ID Start**: "65001"
   - **ID End**: "65999"

3. **Prepare test file**: Create a simple Excel file with these columns and sample data:
   ```
   Course Code | Course Title | Credits | Course Description | Crd Hour
   CSX 1001   | Intro to CS  | 3       | Basic programming  | 3-0-6
   CSX 2001   | Data Struct  | 3       | Algorithms        | 3-0-6  
   CSX 3001   | Database     | 3       | Database design   | 3-0-6
   ```

4. **Upload file**: Drag and drop your Excel file or click the upload area
5. **Wait for processing**: You'll see a spinner and success confirmation
6. **Click "Continue"**: Move to the details page

### Tutorial 3: Configure Course Details (3 minutes)
1. **Check department**: Your department should be pre-selected with a ⭐ 
2. **Review courses**: See your imported courses listed
3. **Test bulk selection**: 
   - Check boxes next to course codes
   - Try "Select All Filtered Courses" 
   - Use "Batch Assignment" to set all as "Required" (assignment for course requirement)
4. **Individual editing**: Click on a course to modify details
5. **Save**: Click "Save Curriculum" at the bottom

### Tutorial 4: Edit Curriculum (2 minutes)
1. **Return to dashboard**: You should see your new curriculum listed
2. **Click info icon (ℹ️)**: Open the curriculum editor
3. **Explore tabs**: 
   - **Courses**: See your imported courses
   - **Constraints**: Empty for now
   - **Elective Rules**: Empty for now
   - **Concentrations**: Available for course groupings
   - **Blacklist**: Manage restricted courses

### Tutorial 5: Quick Configuration Test (Optional)
1. **Try configuration**: Click your browser's back button to return to dashboard
2. **Test course types**: Go to `/chairperson/info_config` (type in URL bar)
3. **See default types**: Core (red), Major (green), Major Elective (yellow), etc.
4. **Test add new type**: Click "Add Course Type" and create "Test Category"

### ✅ Tutorial Complete!
**You've now tested:**
- ✅ Dashboard navigation and search
- ✅ Curriculum creation workflow  
- ✅ File upload and processing
- ✅ Department selection with smart defaults
- ✅ Course configuration and batch operations
- ✅ Curriculum editing interface
- ✅ Course type management

**Next Steps for Full Testing:**
- Try deleting the test curriculum (🗑️ icon on dashboard)
- Test with larger Excel files (20+ courses)
- **Advanced Tab Testing (15-20 minutes)**:

**1. Constraints Tab Testing (Curriculum-Specific):**
   - **Purpose**: Define academic rules and prerequisites for this specific curriculum
   - **Scope**: Only affects courses within the current curriculum
   - **Test Actions**:
     - Click **"Add Constraint"** 
     - Set prerequisite relationships (e.g., "CSX 1001 must be completed before CSX 2001")
     - Create co-requisite rules (courses that must be taken together)
     - Add minimum GPA requirements for advanced courses
     - Test constraint validation by attempting to violate rules
   - **Expected Result**: Rules apply only to this curriculum's course progression

**2. Elective Rules Tab Testing (Curriculum-Specific):**
   - **Purpose**: Configure flexible course selection requirements for this curriculum
   - **Scope**: Defines elective requirements only for the current curriculum
   - **Test Actions**:
     - Set **"Minimum Elective Credits"** (e.g., 15 credits)
     - Create **Category Rules** (e.g., "Choose 2 courses from Math category")
     - Define **Exclusion Rules** (courses that cannot count toward electives)
     - Set **Maximum Credits** from specific categories
     - Configure **Free Elective vs Guided Elective** ratios
   - **Expected Result**: Rules govern course selection flexibility within this curriculum

**3. Concentrations Tab Testing (Faculty-Wide Shared):**
   - **Purpose**: Manage specialization tracks shared across your faculty
   - **Scope**: **Faculty-wide** - concentrations can be used by any department in your faculty
   - **Test Actions**:
     - View existing concentrations from all faculty departments
     - Click **"Add Concentration"** 
     - Create test concentration (e.g., "Artificial Intelligence Track")
     - Add required courses for the concentration
     - Set minimum credits for concentration completion
     - **Cross-Department Test**: Create concentration for different department in your faculty
   - **Expected Result**: Concentration available to all departments within your faculty
   - **⚠️ Faculty Boundary**: Cannot see concentrations from other faculties

**4. Blacklist Tab Testing (Curriculum-Specific):**
   - **Purpose**: Manage course restrictions specific to this curriculum
   - **Scope**: **Curriculum-specific** - blacklists only affect the current curriculum
   - **Test Actions**:
     - View existing blacklists available to your faculty
     - Click **"Apply Blacklist"** or **"Add Blacklist"**
     - Select from existing blacklist entries (created at faculty level)
     - Apply blacklist rules to this specific curriculum
     - **Effectiveness Test**: Blacklist only becomes active when applied to this curriculum
   - **Expected Result**: Blacklist rules enforce only within this specific curriculum
   - **Note**: Blacklists can be created at faculty level but must be applied per curriculum

**5. Course Type Batch Assignment Testing:**
   - Navigate to **Courses Tab**
   - **Test bulk selection**: 
     - Check boxes next to course codes
     - Try **"Select All Filtered Courses"** 
     - Use **"Batch Assignment"** to set course types (Core, Major, Elective, etc.)
     - Use **"Batch Assignment"** to set requirement status (**"Required"** vs **"Elective"**)
   - **Expected Result**: Multiple courses updated simultaneously with selected course type and requirement status
   - **Scope**: Changes only apply to the current curriculum being edited

- Test faculty-wide collaboration (if multiple departments available)

---

## Main Dashboard

### Dashboard Layout
The main dashboard (`/chairperson`) serves as your command center:

**Header Section:**
- **Title**: "Curriculum Management"
- **Subtitle**: "Manage and organize your academic curricula"
- **Primary Action**: "Create New Curriculum" button (top right)

**Search & Statistics:**
- **Search Bar**: Find curricula by name, year, or description
- **Quick Stats**: Total curriculum count display
- **Real-time Results**: Instant search filtering

**Curriculum Grid:**
- **Comprehensive View**: Each curriculum shows:
  - Name, year, version, and ID range
  - Course count and constraints summary
  - Department and faculty information
  - Last updated timestamp
- **Actions**: View/edit (ℹ️ icon) and delete (🗑️ icon) options
- **Pagination**: Navigate through large curriculum collections

### Navigation Features
- **Search Functionality**: Real-time filtering as you type
- **Sorting Options**: Organized by creation date (newest first)
- **Responsive Design**: Optimized for desktop and mobile use
- **Empty States**: Helpful guidance when no curricula exist

---

## Curriculum Management

### Creating New Curricula

#### Step 1: Initial Setup (`/chairperson/create`)
The curriculum creation process uses a **two-panel layout**:

**Left Panel - Curriculum Information:**
- **Curriculum Name**: Descriptive name (e.g., "Computer Science 2025")
- **Academic Year**: 4-digit year (e.g., "2025") 
- **Total Credits**: Required credits for graduation
- **ID Range**: Student batch identifiers
  - **ID Start**: Beginning ID (e.g., "65001")
  - **ID End**: Ending ID (e.g., "65999")
  - **Format Guidance**: First 2 digits typically represent batch year

**Right Panel - Course File Upload:**
- **Drag & Drop Interface**: Visual file upload zone
- **Supported Formats**: Excel (.xlsx, .xls) and CSV (.csv) files
- **Format Preferences**: Excel files preferred for better compatibility
- **Visual Feedback**: 
  - Drag-over highlighting
  - Upload progress indicators
  - Success confirmation

**Required File Columns:**
- **Course Code**: Unique identifier (e.g., "CSX 3001")
- **Course Title**: Full course name
- **Credits**: Number of credits (numeric)
- **Course Description**: Detailed description (optional)
- **Credit Hours**: Format like "3-0-6" (optional)

#### Step 2: Course Details & Configuration (`/chairperson/create/details`)
After successful file upload, proceed to detailed configuration:

**Department Selection:**
- **Smart Default**: Your department is pre-selected with ⭐ indicator
- **Faculty Options**: Select any department within your faculty (you cannot select departments from other faculties)
- **Visual Indicators**: Clear department ownership labels
- **Override Capability**: Change department if needed within your faculty

**Course Review & Assignment:**
- **Imported Course List**: All courses from your uploaded file
- **Search & Filter**: Find specific courses quickly
- **Bulk Selection**: Multi-select for batch operations
- **Individual Editing**: Modify course details inline

**Course Classification:**
- **Requirement Types**: 
  - **Required**: Mandatory courses for graduation
  - **Elective**: Optional courses for degree completion
- **Auto-Assignment**: System suggests based on course titles/codes
- **Batch Assignment**: Apply changes to multiple courses at once
- **Course Types**: Assign from available department course types

**Final Review:**
- **Validation**: System checks for required fields
- **Duplicate Detection**: Prevents conflicting curricula
- **Payload Preview**: Review final data structure
- **Confirmation**: Save curriculum to database

### Managing Existing Curricula

#### Curriculum Overview
From the main dashboard, access detailed curriculum information:
- **Info Button (ℹ️)**: Navigate to comprehensive curriculum editor
- **Delete Button (🗑️)**: Remove curricula with confirmation dialog
- **Confirmation Prompts**: Prevent accidental deletions

#### Comprehensive Curriculum Editor (`/chairperson/info_edit/[id]`)
The curriculum editor provides a **tabbed interface** for managing all aspects:

**Tab 1: Courses** 
- **Purpose**: Manage individual course assignments and requirements
- **Functions**: Add/remove courses, set requirement levels (Required/Elective/Optional)
- **Bulk Operations**: Select multiple courses for batch requirement assignment
- **Scope**: Curriculum-specific course list
- **Course Search**: Find available courses in the system
- **Assignment Options**: Set year, semester, requirement status

**Tab 2: Constraints**
- **Purpose**: Define academic progression rules for this curriculum
- **Functions**: Create prerequisite chains, co-requisites, GPA requirements
- **Scope**: **Curriculum-specific** - rules apply only to this curriculum's courses
- **Examples**: "Complete CSX 1001 before CSX 2001", "Minimum 2.5 GPA for advanced courses"
- **Dependency Management**: Define course relationships
- **Year/Semester Constraints**: Scheduling restrictions

**Tab 3: Elective Rules**
- **Purpose**: Configure flexible course selection requirements
- **Functions**: Set elective credit minimums, category requirements, exclusion rules
- **Scope**: **Curriculum-specific** - defines elective structure for this curriculum only
- **Examples**: "15 elective credits minimum", "Choose 2 from Math category"
- **Selection Rules**: Control student course selection
- **Flexible Requirements**: Support various elective structures

**Tab 4: Concentrations** (Dynamic Label)
- **Purpose**: Manage specialization tracks and focus areas
- **Functions**: Create/edit concentration requirements, set minimum credits
- **Scope**: **Faculty-wide** - concentrations shared across all departments in your faculty
- **Cross-Faculty**: Cannot access concentrations from other faculties
- **Course Groupings**: Organize related courses
- **Custom Labels**: Faculty-specific terminology support

**Tab 5: Blacklist**
- **Purpose**: Apply course restrictions to this specific curriculum
- **Functions**: Select and apply existing blacklist rules, manage curriculum-specific restrictions
- **Scope**: **Curriculum-specific** - blacklists only take effect when applied to this curriculum
- **Cross-Faculty**: Cannot access blacklists from other faculties
- **Application Process**: Choose from faculty-wide blacklist library and apply to this curriculum
- **Effectiveness**: Blacklist rules only enforce within this specific curriculum

---

## Course Configuration

### Course Type Management (`/chairperson/info_config`)
Comprehensive configuration interface for all course-related data:

#### Course Types Section
**Purpose**: Categorize and organize courses with visual indicators

**Default Categories:**
- **Core**: Foundation courses (Red indicator)
- **Major**: Department-specific courses (Green indicator) 
- **Major Elective**: Specialized options (Yellow indicator)
- **General Education**: University requirements (Blue indicator)
- **Free Elective**: Open choices (Gray indicator)

**Management Functions:**
- **Add New Types**: Create custom categories
- **Color Coding**: Visual organization system
- **Edit Existing**: Modify names and colors
- **Delete Unused**: Clean up obsolete categories

#### Import & Export Features
- **Bulk Import**: Excel file support for course types
- **Template Downloads**: Standardized formats
- **Export Functions**: Backup current configurations
- **Validation**: Ensure data integrity during imports

---

## Advanced Features

### Faculty-Wide Collaboration
**Collaboration Model**: Access all departments within your faculty while maintaining clear ownership and complete isolation from other faculties

**Access Patterns:**
- **Faculty-Wide View**: See curricula from all departments in your faculty
- **Edit Permissions**: Modify curricula from any department within your faculty
- **Department Indicators**: Clear visual ownership markers show which department created each curriculum
- **Cross-Faculty Security**: Complete isolation - cannot see or access other faculties' data

**Benefits:**
- **Resource Sharing**: Leverage successful curriculum patterns across your faculty
- **Consistency**: Maintain faculty-wide academic standards
- **Coordination**: Prevent curriculum conflicts within your faculty
- **Best Practices**: Share effective educational strategies across departments

### Concentrations Management
**Dynamic Labeling**: Faculty-specific terminology (Concentrations, Majors, Tracks, etc.)

**Configuration Options:**
- **Custom Names**: Set faculty-appropriate labels
- **Course Groupings**: Organize specialized course sets
- **Requirements**: Define completion criteria
- **Import/Export**: Bulk concentration management

### Blacklist System
**Purpose**: Prevent problematic course combinations through curriculum-specific application

**Blacklist Model:**
- **Faculty-Level Creation**: Blacklists are created and managed at faculty level
- **Curriculum-Level Application**: Must be applied to individual curricula to take effect
- **Selective Enforcement**: Each curriculum can choose which blacklists to apply

**Management Features:**
- **Faculty Library**: Access shared blacklist entries across your faculty
- **Selective Application**: Choose which restrictions apply to each curriculum
- **Curriculum-Specific**: Applied blacklists only affect the specific curriculum
- **Visual Indicators**: Clear indication of which blacklists are active per curriculum

### Data Import/Export
**Supported Operations:**
- **Course Data**: Bulk course imports from Excel/CSV
- **Curriculum Export**: Backup complete curricula
- **Configuration Backup**: Save system settings
- **Template Downloads**: Standardized import formats

**File Format Support:**
- **Excel**: Primary format (.xlsx, .xls)
- **CSV**: Alternative format with limitations
- **UTF-8 Encoding**: International character support
- **Large File Handling**: Efficient processing of extensive datasets

---

## Best Practices

### Curriculum Development
1. **Planning Phase**:
   - Define clear learning objectives
   - Identify required competencies
   - Plan credit distribution
   - Consider prerequisite chains

2. **File Preparation**:
   - Use Excel format for best compatibility
   - Include all required columns
   - Validate course codes for uniqueness
   - Provide comprehensive course descriptions

3. **Organization Strategy**:
   - Use consistent course coding schemes
   - Apply meaningful course type categories
   - Set up logical prerequisite relationships
   - Plan for elective flexibility

### Data Management
1. **Regular Backups**:
   - Export curricula periodically
   - Save configuration files
   - Document custom settings
   - Maintain version control

2. **Quality Assurance**:
   - Review imported data for accuracy
   - Validate course information
   - Test constraint logic
   - Verify credit calculations

3. **Collaboration Guidelines**:
   - Coordinate with faculty colleagues
   - Communicate curriculum changes
   - Maintain department ownership clarity
   - Document decision rationale

### System Usage
1. **Browser Optimization**:
   - Use modern web browsers
   - Enable JavaScript
   - Clear cache if issues occur
   - Maintain stable internet connection

2. **Session Management**:
   - Save work frequently
   - Complete tasks within session timeouts
   - Log out properly when finished
   - Monitor for system updates

---

## Troubleshooting

### Common Issues & Solutions

#### File Upload Problems
**Issue**: File upload fails or produces errors
**Solutions**:
- Verify file format (.xlsx, .xls, .csv only)
- Check file size limitations
- Ensure required columns are present
- Validate data formats (numeric credits, etc.)
- Try uploading smaller file segments

#### Data Display Issues  
**Issue**: Information not displaying correctly
**Solutions**:
- Refresh browser page
- Clear browser cache and cookies
- Check internet connection stability
- Try different browser if persistent
- Contact support if issues continue

#### Search & Filter Problems
**Issue**: Search results incomplete or incorrect
**Solutions**:
- Clear existing search filters
- Check spelling in search terms
- Try broader search criteria
- Verify data exists in system
- Use pagination controls for large datasets

#### Access Control Issues
**Issue**: Cannot access certain features or data
**Solutions**:
- Verify your role permissions
- Confirm department association
- **Check faculty boundaries** - You can only access departments within your faculty
- Contact administrator for access review
- Ensure proper authentication

### Performance Optimization
**Large Dataset Handling:**
- Use search filters to limit results
- Navigate with pagination controls
- Import data in smaller batches
- Close unused browser tabs
- Ensure adequate system resources

**Session Management:**
- Save work before long breaks
- Monitor session timeout warnings
- Keep browser window active
- Refresh page if system becomes unresponsive

### Getting Additional Help
**Support Resources:**
- **Technical Issues**: Contact IT support department
- **Academic Questions**: Consult curriculum committee
- **System Training**: Request user training sessions  
- **Feature Requests**: Submit through proper channels
- **Peer Support**: Collaborate with other chairpersons

**Documentation:**
- Keep this manual accessible for reference
- Check for system update notifications
- Review release notes for new features
- Participate in training opportunities

---

## Conclusion

The Course Audit System provides comprehensive curriculum management capabilities designed specifically for academic chairpersons. This manual covers all major functions and workflows available to your role. 

**Key Takeaways:**
- The system supports efficient curriculum creation through file imports and guided workflows
- Faculty-wide collaboration is enabled while maintaining appropriate security boundaries
- Advanced configuration options support diverse academic requirements
- Regular practice with the interface will improve efficiency and effectiveness

For ongoing support and updates, stay connected with your IT department and academic administration. The system continues to evolve with new features and improvements based on user feedback and academic needs.
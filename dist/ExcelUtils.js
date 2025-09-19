"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTranscriptCSV = parseTranscriptCSV;
exports.parseExcelFile = parseExcelFile;
exports.validateCourseData = validateCourseData;
exports.groupCoursesByCategory = groupCoursesByCategory;
exports.calculateProgressStats = calculateProgressStats;
var XLSX = __importStar(require("xlsx"));
var papaparse_1 = __importDefault(require("papaparse"));
/**
 * Standardize course codes by removing spaces and normalizing format
 */
function standardizeCourseCode(code) {
    if (!code)
        return '';
    return code.trim().replace(/\s+/g, '').toUpperCase();
}
/**
 * Clean course names by removing credit hour information and extra formatting
 */
function cleanCourseName(name) {
    if (!name)
        return '';
    // Remove patterns like "(3-0-6)", "(*)", etc.
    return name
        .replace(/\([^)]*\)/g, '') // Remove anything in parentheses
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
}
/**
 * Extract category name from section headers
 */
function extractCategoryName(headerText) {
    if (!headerText)
        return '';
    // Extract from patterns like "General Education Courses (30 Credits)"
    var match = headerText.match(/^(.+?)\s*\(\d+\s*Credits?\)/i);
    return match ? match[1].trim() : headerText.split('(')[0].trim();
}
/**
 * Determine course status based on grade and remark fields
 */
function determineStatus(grade, remark) {
    // Check for explicit status indicators first
    if (remark === null || remark === void 0 ? void 0 : remark.toLowerCase().includes('taking'))
        return 'IN_PROGRESS';
    if (remark === null || remark === void 0 ? void 0 : remark.toLowerCase().includes('failed'))
        return 'FAILED';
    if (remark === null || remark === void 0 ? void 0 : remark.toLowerCase().includes('dropped'))
        return 'DROPPED';
    // If grade is present and valid, course is completed
    if (grade && grade.trim() && !['', '-', 'N/A'].includes(grade.trim())) {
        return 'COMPLETED';
    }
    // Default to pending
    return 'PENDING';
}
/**
 * Parse transcript CSV with the specific format from the sample
 */
function parseTranscriptCSV(csvText) {
    var courses = [];
    var warnings = [];
    var categoriesFound = [];
    var currentCategory = '';
    try {
        var lines = csvText.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line)
                continue;
            // Parse CSV row (handling commas within quotes)
            var row = line.split(',').map(function (cell) { return cell.trim().replace(/^["']|["']$/g, ''); });
            var courseName = row[0], code = row[1], credits = row[2], grade = row[3], remark = row[4];
            // Check if this is a category header
            if (courseName && courseName.includes('Credits)')) {
                currentCategory = extractCategoryName(courseName);
                if (currentCategory && !categoriesFound.includes(currentCategory)) {
                    categoriesFound.push(currentCategory);
                }
                continue;
            }
            // Skip empty rows or rows with just notation numbers
            if (!code || !courseName)
                continue;
            // Skip rows that are just index numbers (E1, E2, etc.)
            if (courseName.match(/^[A-Z]\d+$/))
                continue;
            // Skip total/summary rows
            if (courseName.toLowerCase().includes('total'))
                continue;
            // Parse course data
            var courseCode = standardizeCourseCode(code);
            var cleanedName = cleanCourseName(courseName);
            var creditValue = parseInt(credits) || 0;
            var status_1 = determineStatus(grade, remark);
            // Validate essential fields
            if (!courseCode || !cleanedName) {
                warnings.push("Skipped invalid course entry at line ".concat(i + 1, ": missing code or name"));
                continue;
            }
            courses.push({
                courseCode: courseCode,
                courseName: cleanedName,
                credits: creditValue,
                grade: (grade === null || grade === void 0 ? void 0 : grade.trim()) || undefined,
                status: status_1,
                category: currentCategory
            });
        }
        // Calculate summary statistics
        var completedCourses = courses.filter(function (c) { return c.status === 'COMPLETED'; }).length;
        var inProgressCourses = courses.filter(function (c) { return c.status === 'IN_PROGRESS'; }).length;
        var pendingCourses = courses.filter(function (c) { return c.status === 'PENDING'; }).length;
        var totalCreditsCompleted = courses
            .filter(function (c) { return c.status === 'COMPLETED'; })
            .reduce(function (sum, c) { return sum + c.credits; }, 0);
        return {
            courses: courses,
            summary: {
                totalCourses: courses.length,
                completedCourses: completedCourses,
                inProgressCourses: inProgressCourses,
                pendingCourses: pendingCourses,
                totalCreditsCompleted: totalCreditsCompleted,
                categoriesFound: categoriesFound
            },
            warnings: warnings
        };
    }
    catch (error) {
        throw new Error("Failed to parse transcript CSV: ".concat(error instanceof Error ? error.message : 'Unknown error'));
    }
}
/**
 * Parse Excel/CSV file for course data with transcript format support
 */
function parseExcelFile(file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var _a;
            try {
                var data = (_a = e.target) === null || _a === void 0 ? void 0 : _a.result;
                if (typeof data === 'string') {
                    // Handle CSV files with transcript format
                    if (file.name.toLowerCase().includes('credit') ||
                        file.name.toLowerCase().includes('transcript')) {
                        var transcriptResult = parseTranscriptCSV(data);
                        resolve({
                            courses: transcriptResult.courses,
                            students: [],
                            programs: []
                        });
                        return;
                    }
                    // Regular CSV parsing
                    var result = papaparse_1.default.parse(data, {
                        header: true,
                        skipEmptyLines: true,
                        transformHeader: function (header) { return header.trim().toLowerCase().replace(/\s+/g, '_'); }
                    });
                    var courses = result.data.map(function (row) {
                        var _a;
                        return ({
                            courseCode: standardizeCourseCode(row.course_code || row.code || ''),
                            courseName: cleanCourseName(row.course_name || row.name || ''),
                            credits: parseInt(row.credits || row.credit_hours || '0') || 0,
                            grade: ((_a = row.grade) === null || _a === void 0 ? void 0 : _a.trim()) || undefined,
                            status: determineStatus(row.grade, row.remark || row.status)
                        });
                    }).filter(function (course) { return course.courseCode && course.courseName; });
                    resolve({ courses: courses, students: [], programs: [] });
                }
                else {
                    // Handle Excel files
                    var workbook = XLSX.read(data, { type: 'array' });
                    var sheetName = workbook.SheetNames[0];
                    var worksheet = workbook.Sheets[sheetName];
                    var jsonData = XLSX.utils.sheet_to_json(worksheet);
                    var courses = jsonData.map(function (row) {
                        var _a;
                        return ({
                            courseCode: standardizeCourseCode(row['Course Code'] || row['Code'] || ''),
                            courseName: cleanCourseName(row['Course Name'] || row['Name'] || ''),
                            credits: parseInt(row['Credits'] || row['Credit Hours'] || '0') || 0,
                            grade: ((_a = row['Grade']) === null || _a === void 0 ? void 0 : _a.trim()) || undefined,
                            status: determineStatus(row['Grade'], row['Remark'] || row['Status'])
                        });
                    }).filter(function (course) { return course.courseCode && course.courseName; });
                    resolve({ courses: courses, students: [], programs: [] });
                }
            }
            catch (error) {
                reject(new Error("Failed to parse file: ".concat(error instanceof Error ? error.message : 'Unknown error')));
            }
        };
        reader.onerror = function () { return reject(new Error('Failed to read file')); };
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file);
        }
        else {
            reader.readAsArrayBuffer(file);
        }
    });
}
/**
 * Validate course data against common requirements
 */
function validateCourseData(courses) {
    var errors = [];
    var warnings = [];
    if (!courses || courses.length === 0) {
        errors.push('No course data found');
        return { isValid: false, errors: errors, warnings: warnings };
    }
    courses.forEach(function (course, index) {
        // Essential field validation
        if (!course.courseCode) {
            errors.push("Course at row ".concat(index + 1, ": Missing course code"));
        }
        if (!course.courseName) {
            errors.push("Course at row ".concat(index + 1, ": Missing course name"));
        }
        if (course.credits <= 0) {
            warnings.push("Course ".concat(course.courseCode, ": Invalid or missing credit hours (").concat(course.credits, ")"));
        }
        // Course code format validation
        if (course.courseCode && !/^[A-Z]{2,4}\d{3,4}[A-Z]?$/i.test(course.courseCode)) {
            warnings.push("Course ".concat(course.courseCode, ": Unusual course code format"));
        }
        // Grade validation
        if (course.grade && !/^[A-F][+-]?$|^PASS$|^FAIL$/i.test(course.grade)) {
            warnings.push("Course ".concat(course.courseCode, ": Unusual grade format (").concat(course.grade, ")"));
        }
    });
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}
/**
 * Group courses by category for better organization
 */
function groupCoursesByCategory(courses) {
    return courses.reduce(function (groups, course) {
        var category = course.category || 'Uncategorized';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(course);
        return groups;
    }, {});
}
/**
 * Calculate progress statistics for a list of courses
 */
function calculateProgressStats(courses) {
    var stats = {
        total: courses.length,
        completed: 0,
        inProgress: 0,
        pending: 0,
        failed: 0,
        dropped: 0,
        totalCredits: 0,
        completedCredits: 0,
        gpa: 0
    };
    var gradePoints = 0;
    var gradeCredits = 0;
    courses.forEach(function (course) {
        stats.totalCredits += course.credits;
        switch (course.status) {
            case 'COMPLETED':
                stats.completed++;
                stats.completedCredits += course.credits;
                // Calculate GPA if grade is available
                if (course.grade) {
                    var points = getGradePoints(course.grade);
                    if (points >= 0) {
                        gradePoints += points * course.credits;
                        gradeCredits += course.credits;
                    }
                }
                break;
            case 'IN_PROGRESS':
                stats.inProgress++;
                break;
            case 'PENDING':
                stats.pending++;
                break;
            case 'FAILED':
                stats.failed++;
                break;
            case 'DROPPED':
                stats.dropped++;
                break;
        }
    });
    stats.gpa = gradeCredits > 0 ? gradePoints / gradeCredits : 0;
    return stats;
}
/**
 * Convert grade to grade points for GPA calculation
 */
function getGradePoints(grade) {
    var _a;
    var gradeMap = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'D-': 0.7,
        'F': 0.0
    };
    return (_a = gradeMap[grade.toUpperCase()]) !== null && _a !== void 0 ? _a : -1;
}

# Transcript CSV Format Guide

## Expected CSV Format

The transcript upload system expects a specific CSV format that groups courses by categories. Here's how it works:

### Format Structure

```csv
Category Name (Total Credits)
Course Name,Course Code,Credits,Grade,Remark
Course Name,Course Code,Credits,Grade,Remark
...

Next Category Name (Total Credits)
Course Name,Course Code,Credits,Grade,Remark
...
```

### Column Details

1. **Course Name**: Full name of the course (e.g., "Introduction to Programming")
2. **Course Code**: Course identifier (e.g., "CS101", "MATH201")
3. **Credits**: Number of credit hours (integer)
4. **Grade**: Letter grade (A, A-, B+, B, B-, C+, C, C-, D, F) or empty for courses not yet completed
5. **Remark**: Optional status indicator (e.g., "taking" for courses in progress)

### Category Headers

Category headers follow this pattern:
- Format: `Category Name (Total Credits)`
- Examples:
  - `General Education Courses (24 Credits)`
  - `Core Courses (42 Credits)`
  - `Major Elective (18 Credits)`

### Status Determination

The system automatically determines course status based on:

- **COMPLETED**: When a valid grade is present (A, B, C, etc.)
- **IN_PROGRESS**: When remark contains "taking" or similar
- **FAILED**: When remark contains "failed"
- **DROPPED**: When remark contains "dropped"
- **PENDING**: Default for courses without grades or status indicators

### Sample Data

See `sample_transcript.csv` for a complete example with:
- General Education Courses
- Core Courses
- Major Electives
- Free Electives
- Mathematics courses

### Common Issues and Solutions

#### Issue: Parser stops reading after first few courses
**Cause**: Category title formatting or unexpected line breaks
**Solution**: Ensure category headers exactly match the format `Category Name (X Credits)`

#### Issue: Courses not appearing in correct categories
**Cause**: Category names don't match curriculum expectations
**Solution**: Use standard category names like "Core Courses", "Major Elective", "General Education"

#### Issue: Grades not being recognized
**Cause**: Invalid grade format or extra characters
**Solution**: Use standard letter grades (A, A-, B+, B, B-, C+, C, C-, D, F)

### Testing Your CSV

1. Save your data in the format shown above
2. Ensure no extra commas or quotes in course names
3. Keep category headers on separate lines
4. Use consistent spacing and formatting
5. Test with the sample file first to verify the system works

### Advanced Features

- **Mixed Status**: You can have completed courses (with grades) and in-progress courses (with "taking" remark) in the same category
- **Flexible Categories**: The system will create sections for any category found in your CSV
- **Credit Calculation**: Total credits are automatically calculated for completed courses
- **Validation**: The system provides warnings for invalid or skipped entries
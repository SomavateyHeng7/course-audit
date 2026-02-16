import jsPDF from 'jspdf';

interface CourseSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  section?: string;
  dayTimeSlots?: CourseSlot[];
  instructor?: string;
  seatLimit?: number;
  category?: string;
}

interface ScheduleData {
  name: string;
  semester: string;
  version: string;
  department?: string;
  batch?: string;
  curriculumName?: string;
  courses: Course[];
}

// Define time slots for the timetable (based on the image)
const TIME_SLOTS = [
  '8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Color palette for different courses (similar to the image)
const COLORS = [
  { bg: [135, 206, 250], text: [0, 0, 0] },      // Light Blue
  { bg: [255, 165, 0], text: [0, 0, 0] },        // Orange
  { bg: [255, 255, 102], text: [0, 0, 0] },      // Yellow
  { bg: [144, 238, 144], text: [0, 0, 0] },      // Light Green
  { bg: [255, 182, 193], text: [0, 0, 0] },      // Light Pink
  { bg: [173, 216, 230], text: [0, 0, 0] },      // Light Blue 2
  { bg: [221, 160, 221], text: [0, 0, 0] },      // Plum
  { bg: [255, 228, 181], text: [0, 0, 0] },      // Moccasin
  { bg: [152, 251, 152], text: [0, 0, 0] },      // Pale Green
  { bg: [255, 218, 185], text: [0, 0, 0] },      // Peach
];

// Helper function to convert time string to minutes
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to find time slot index
const findTimeSlotIndex = (time: string): number => {
  const targetMinutes = timeToMinutes(time);
  let closestIndex = 0;
  let closestDiff = Math.abs(timeToMinutes(TIME_SLOTS[0]) - targetMinutes);

  for (let i = 1; i < TIME_SLOTS.length; i++) {
    const diff = Math.abs(timeToMinutes(TIME_SLOTS[i]) - targetMinutes);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }

  return closestIndex;
};

// Create timetable grid
const createTimetableGrid = (courses: Course[]): { [key: string]: { [key: string]: any } } => {
  const grid: { [key: string]: { [key: string]: any } } = {};

  // Initialize grid
  DAYS.forEach(day => {
    grid[day] = {};
  });

  // Assign colors to courses
  const courseColors = new Map<string, { bg: number[], text: number[] }>();
  courses.forEach((course, index) => {
    courseColors.set(course.id, COLORS[index % COLORS.length]);
  });

  // Place courses in the grid
  courses.forEach(course => {
    if (!course.dayTimeSlots || course.dayTimeSlots.length === 0) return;

    course.dayTimeSlots.forEach(slot => {
      const dayKey = slot.day.substring(0, 3); // Convert to Mon, Tue, etc.
      if (!DAYS.includes(dayKey)) return;

      const startIndex = findTimeSlotIndex(slot.startTime);
      const endIndex = findTimeSlotIndex(slot.endTime);
      const duration = endIndex - startIndex;

      // Store course info in the grid - support multiple courses at same time
      if (!grid[dayKey][startIndex]) {
        grid[dayKey][startIndex] = [];
      }
      
      // Ensure grid[dayKey][startIndex] is always an array
      if (!Array.isArray(grid[dayKey][startIndex])) {
        grid[dayKey][startIndex] = [grid[dayKey][startIndex]];
      }
      
      grid[dayKey][startIndex].push({
        course,
        color: courseColors.get(course.id),
        duration: Math.max(1, duration),
        slot
      });
    });
  });

  return grid;
};

export const exportScheduleToPDF = (scheduleData: ScheduleData): void => {
  // @ts-ignore - jsPDF types might be incomplete
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(scheduleData.name || 'Course Timetable', margin, margin + 5);

  // Subtitle with schedule info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = margin + 12;
  doc.text(`${scheduleData.semester || ''} - ${scheduleData.curriculumName || ''}`, margin, yPos);
  
  if (scheduleData.batch) {
    yPos += 5;
    doc.text(`Batch: ${scheduleData.batch}`, margin, yPos);
  }

  // Date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(currentDate, pageWidth - margin - 40, margin + 5);

  // Create timetable grid
  const grid = createTimetableGrid(scheduleData.courses);

  // Calculate dimensions
  const tableStartY = yPos + 10;
  const cellWidth = (pageWidth - 2 * margin - 15) / TIME_SLOTS.length;
  const cellHeight = 12;
  const dayLabelWidth = 15;

  // Draw header (time slots)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  TIME_SLOTS.forEach((time, index) => {
    const x = margin + dayLabelWidth + (index * cellWidth);
    const y = tableStartY;
    
    // Header background
    doc.setFillColor(200, 200, 200);
    doc.rect(x, y, cellWidth, cellHeight, 'F');
    
    // Border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(x, y, cellWidth, cellHeight, 'S');
    
    // Time text
    doc.setTextColor(0, 0, 0);
    const textX = x + cellWidth / 2;
    const textY = y + cellHeight / 2 + 1.5;
    doc.text(time, textX, textY, { 
      align: 'center'
    });
  });

  // Draw days and courses
  DAYS.forEach((day, dayIndex) => {
    const y = tableStartY + cellHeight + (dayIndex * cellHeight);
    
    // Day label
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, y, dayLabelWidth, cellHeight, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, dayLabelWidth, cellHeight, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const dayTextX = margin + dayLabelWidth / 2;
    const dayTextY = y + cellHeight / 2 + 1.5;
    doc.text(day, dayTextX, dayTextY, {
      align: 'center'
    });

    // Draw time slots for this day
    const dayGrid = grid[day];
    let skipSlots = 0;

    TIME_SLOTS.forEach((time, timeIndex) => {
      if (skipSlots > 0) {
        skipSlots--;
        return;
      }

      const x = margin + dayLabelWidth + (timeIndex * cellWidth);
      const courseData = dayGrid[timeIndex];

      if (courseData) {
        const { course, color, duration, slot } = courseData;
        const width = cellWidth * duration;

        // Draw course block
        doc.setFillColor(color.bg[0], color.bg[1], color.bg[2]);
        doc.rect(x, y, width, cellHeight, 'F');
        
        // Border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(x, y, width, cellHeight, 'S');

        // Course text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(color.text[0], color.text[1], color.text[2]);
        
        const courseText = `${course.code} ${course.name}`;
        const textMaxWidth = width - 2;
        
        // Course code and name
        const courseTextX = x + width / 2;
        const courseTextY = y + 4.5;
        doc.text(courseText, courseTextX, courseTextY, {
          align: 'center',
          maxWidth: textMaxWidth
        });

        // Credits info
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        const creditsTextY = y + cellHeight - 2.5;
        doc.text(`(${course.credits} credits)`, courseTextX, creditsTextY, {
          align: 'center'
        });

        skipSlots = duration - 1;
      } else {
        // Empty slot
        doc.setFillColor(255, 255, 255);
        doc.rect(x, y, cellWidth, cellHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.rect(x, y, cellWidth, cellHeight, 'S');
      }
    });
  });

  // Legend
  const legendStartY = tableStartY + cellHeight + (DAYS.length * cellHeight) + 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Course List:', margin, legendStartY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let legendY = legendStartY + 5;
  const legendItemHeight = 5;
  const legendCols = 2;
  const legendColWidth = (pageWidth - 2 * margin) / legendCols;

  scheduleData.courses.forEach((course, index) => {
    const col = Math.floor(index / 10);
    const row = index % 10;
    const x = margin + (col * legendColWidth);
    const y = legendY + (row * legendItemHeight);

    const colorIndex = index % COLORS.length;
    const color = COLORS[colorIndex];

    // Color box
    doc.setFillColor(color.bg[0], color.bg[1], color.bg[2]);
    doc.rect(x, y - 3, 4, 3, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(x, y - 3, 4, 3, 'S');

    // Course info
    doc.setTextColor(0, 0, 0);
    const courseInfo = `${course.code} - ${course.name} (${course.credits} cr)`;
    doc.text(courseInfo, x + 5, y, { maxWidth: legendColWidth - 10 });
  });

  // Save PDF
  const fileName = `${scheduleData.name.replace(/\s+/g, '_')}_${scheduleData.semester.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

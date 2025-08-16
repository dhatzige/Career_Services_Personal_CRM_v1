import { Student } from '../types/student';

// Academic year typically starts in September
const ACADEMIC_YEAR_START_MONTH = 8; // September (0-indexed)

export const calculateCurrentAcademicYear = (startDate: string): string => {
  const start = new Date(startDate);
  const now = new Date();
  
  // Calculate how many academic years have passed
  let yearsPassed = now.getFullYear() - start.getFullYear();
  
  // If we haven't reached September yet this year, and the student started after September last year
  if (now.getMonth() < ACADEMIC_YEAR_START_MONTH && start.getMonth() >= ACADEMIC_YEAR_START_MONTH) {
    yearsPassed -= 1;
  }
  
  // If the student started before September this year, and we've passed September
  if (start.getMonth() < ACADEMIC_YEAR_START_MONTH && now.getMonth() >= ACADEMIC_YEAR_START_MONTH) {
    yearsPassed += 1;
  }
  
  const currentYear = Math.max(1, yearsPassed + 1);
  
  if (currentYear <= 4) {
    return `${currentYear}${getOrdinalSuffix(currentYear)} year`;
  } else {
    return 'Graduate';
  }
};

export const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
};

export const calculateProgressPercentage = (currentYear: string, programType: string): number => {
  if (programType === "Bachelor's") {
    switch (currentYear) {
      case '1st year': return 25;
      case '2nd year': return 50;
      case '3rd year': return 75;
      case '4th year': return 100;
      default: return 100;
    }
  } else if (programType === "Master's") {
    switch (currentYear) {
      case '1st year': return 50;
      case '2nd year': return 100;
      default: return 100;
    }
  }
  return 0;
};

export const getProgressColor = (percentage: number): string => {
  if (percentage <= 25) return 'bg-red-500';
  if (percentage <= 50) return 'bg-yellow-500';
  if (percentage <= 75) return 'bg-blue-500';
  return 'bg-green-500';
};

export const updateStudentAcademicYear = (student: Student): Student => {
  // Return student as-is if required data is missing
  if (!student || !student.dateAdded) {
    return student;
  }

  if (!student.academicStartDate) {
    // If no start date, estimate based on current year and when they were added
    try {
      const addedDate = new Date(student.dateAdded);
      
      // Check if the date is valid
      if (isNaN(addedDate.getTime())) {
        return student;
      }
      
      const estimatedStartYear = addedDate.getFullYear();
      const estimatedStartMonth = ACADEMIC_YEAR_START_MONTH;
      
      // Estimate start date based on their current year when added
      let yearsBack = 0;
      switch (student.yearOfStudy) {
        case '2nd year': yearsBack = 1; break;
        case '3rd year': yearsBack = 2; break;
        case '4th year': yearsBack = 3; break;
        default: yearsBack = 0;
      }
      
      student.academicStartDate = new Date(estimatedStartYear - yearsBack, estimatedStartMonth, 1).toISOString();
    } catch (error) {
      // If date parsing fails, return student unchanged
      return student;
    }
  }
  
  const newYear = calculateCurrentAcademicYear(student.academicStartDate);
  
  // Only update if the year has actually changed
  if (newYear !== student.yearOfStudy && newYear !== 'Graduate') {
    student.yearOfStudy = newYear as any;
  }
  
  return student;
};

export const getStudentYearAtDate = (student: Student, date: string): string => {
  if (!student.academicStartDate) return student.yearOfStudy;
  
  const targetDate = new Date(date);
  const startDate = new Date(student.academicStartDate);
  
  let yearsPassed = targetDate.getFullYear() - startDate.getFullYear();
  
  // Adjust for academic year timing
  if (targetDate.getMonth() < ACADEMIC_YEAR_START_MONTH && startDate.getMonth() >= ACADEMIC_YEAR_START_MONTH) {
    yearsPassed -= 1;
  }
  
  if (startDate.getMonth() < ACADEMIC_YEAR_START_MONTH && targetDate.getMonth() >= ACADEMIC_YEAR_START_MONTH) {
    yearsPassed += 1;
  }
  
  const yearAtTime = Math.max(1, yearsPassed + 1);
  
  if (yearAtTime <= 4) {
    return `${yearAtTime}${getOrdinalSuffix(yearAtTime)} year`;
  } else {
    return 'Graduate';
  }
};

// Program definitions
export const BACHELOR_PROGRAMS = [
  'Business Administration',
  'Biology',
  'Psychology',
  'English Literature',
  'English & New Media',
  'IR & Politics',
  'Computer Science',
  'Business Computing'
];

export const MASTER_PROGRAMS = [
  'MBA',
  'Masters in Tourism Management',
  'MS in Industrial Organizational Psychology'
];

export const BUSINESS_ADMIN_MAJORS = [
  'Finance',
  'Tourism',
  'Marketing'
];

export const getProgramsByType = (programType: string): string[] => {
  switch (programType) {
    case "Bachelor's":
      return BACHELOR_PROGRAMS;
    case "Master's":
      return MASTER_PROGRAMS;
    default:
      return [];
  }
};

export const requiresMajor = (program: string): boolean => {
  return program === 'Business Administration';
};
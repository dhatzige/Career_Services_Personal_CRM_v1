import { Student, ConsultationType } from '../types/student';
import { addStudent } from './studentData';

const firstNames = [
  'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason',
  'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia',
  'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander', 'Abigail', 'Michael',
  'Emily', 'Daniel', 'Elizabeth', 'Jacob', 'Sofia', 'Logan', 'Avery', 'Jackson'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
  'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
  'Ramirez', 'Lewis', 'Robinson'
];

const programs = [
  'Computer Science', 'Business Administration', 'Engineering', 'Psychology',
  'Biology', 'Mathematics', 'English Literature', 'Economics', 'Physics',
  'Chemistry', 'Art History', 'Political Science', 'Sociology', 'Philosophy',
  'Medicine', 'Law', 'Education', 'Nursing', 'Architecture', 'Music'
];

const consultationTypes: ConsultationType[] = [
  '1-to-1 consultation', 'CV review', 'LinkedIn optimization',
  'Masters preparation', 'Interview preparation', 'Job navigation',
  'Initial assessment'
];

const noteTemplates = [
  'Student showed great enthusiasm for the program.',
  'Needs additional support with academic planning.',
  'Excellent progress on career development goals.',
  'Discussed internship opportunities and application process.',
  'Student is considering graduate school options.',
  'Provided resources for skill development.',
  'Follow-up needed on job application status.',
  'Student expressed interest in research opportunities.',
  'Discussed work-life balance strategies.',
  'Reviewed portfolio and provided feedback.'
];

const generateRandomDate = (start: Date, end: Date): string => {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime).toISOString();
};

const generateRandomStudent = (): Omit<Student, 'id' | 'dateAdded' | 'notes' | 'consultations' | 'followUpReminders'> => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const program = programs[Math.floor(Math.random() * programs.length)];
  
  const yearOptions = ['1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Alumni'] as const;
  const programTypeOptions = ["Bachelor's", "Master's", 'PhD'] as const;
  const statusOptions = ['Active', 'Inactive', 'Graduated'] as const;
  
  return {
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.edu`,
    phone: Math.random() > 0.3 ? `+1 (555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
    yearOfStudy: yearOptions[Math.floor(Math.random() * yearOptions.length)],
    programType: programTypeOptions[Math.floor(Math.random() * programTypeOptions.length)],
    specificProgram: program,
    status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
    avatar: Math.random() > 0.5 ? `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000) + 100000}/pexels-photo-${Math.floor(Math.random() * 1000000) + 100000}.jpeg?auto=compress&cs=tinysrgb&w=150` : undefined
  };
};

export const generateSampleData = (count: number = 50): void => {
  console.log(`Generating ${count} sample students...`);
  
  for (let i = 0; i < count; i++) {
    const studentData = generateRandomStudent();
    const student = addStudent(studentData);
    
    // Add random consultations
    const consultationCount = Math.floor(Math.random() * 5);
    for (let j = 0; j < consultationCount; j++) {
      const consultationType = consultationTypes[Math.floor(Math.random() * consultationTypes.length)];
      const consultationDate = generateRandomDate(
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        new Date()
      );
      
      // Add consultation logic would go here
      // For now, we'll just add to the student object directly
      student.consultations.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        type: consultationType,
        date: consultationDate,
        duration: 30 + Math.floor(Math.random() * 60),
        attended: Math.random() > 0.2, // 80% attendance rate
        notes: noteTemplates[Math.floor(Math.random() * noteTemplates.length)],
        followUpRequired: Math.random() > 0.7
      });
    }
    
    // Add random notes
    const noteCount = Math.floor(Math.random() * 8);
    for (let k = 0; k < noteCount; k++) {
      const noteDate = generateRandomDate(
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        new Date()
      );
      
      student.notes.push({
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        content: noteTemplates[Math.floor(Math.random() * noteTemplates.length)],
        dateCreated: noteDate,
        type: ['general', 'consultation', 'follow-up'][Math.floor(Math.random() * 3)] as any,
        tags: Math.random() > 0.5 ? ['important'] : [],
        isPinned: Math.random() > 0.9,
        color: ['default', 'important', 'follow-up', 'success', 'info'][Math.floor(Math.random() * 5)]
      });
    }
    
    // Update last interaction
    if (student.consultations.length > 0 || student.notes.length > 0) {
      const allDates = [
        ...student.consultations.map(c => c.date),
        ...student.notes.map(n => n.dateCreated)
      ];
      student.lastInteraction = allDates.sort().pop();
    }
  }
  
  console.log(`Generated ${count} sample students with consultations and notes.`);
};

export const clearAllData = (): void => {
  if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    localStorage.removeItem('crm_students');
    localStorage.removeItem('crm_student_counter');
    console.log('All data cleared.');
    window.location.reload();
  }
};
import { loadStudents } from './studentData';

export const checkDuplicateEmail = (email: string, excludeId?: string): boolean => {
  const students = loadStudents();
  return students.some(student => 
    student.email.toLowerCase() === email.toLowerCase() && 
    student.id !== excludeId
  );
};

export const findSimilarStudents = (firstName: string, lastName: string, excludeId?: string) => {
  const students = loadStudents();
  return students.filter(student => {
    if (student.id === excludeId) return false;
    
    const firstNameMatch = student.firstName.toLowerCase() === firstName.toLowerCase();
    const lastNameMatch = student.lastName.toLowerCase() === lastName.toLowerCase();
    
    return firstNameMatch && lastNameMatch;
  });
};
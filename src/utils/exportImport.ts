import Papa from 'papaparse';
import { Student } from '../types/student';
import { loadStudents, saveStudents } from './studentData';
import { updateStudentAcademicYear } from './academicProgression';

export const exportToCSV = (students: Student[], filename: string = 'students.csv') => {
  const csvData = students.map(student => {
    const updatedStudent = updateStudentAcademicYear(student);
    
    // Get latest consultation and note
    const latestConsultation = updatedStudent.consultations.length > 0 
      ? updatedStudent.consultations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;
    
    const latestNote = updatedStudent.notes.length > 0
      ? updatedStudent.notes.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())[0]
      : null;

    return {
      'Full Name': `${updatedStudent.firstName} ${updatedStudent.lastName}`,
      'First Name': updatedStudent.firstName,
      'Last Name': updatedStudent.lastName,
      'Email': updatedStudent.email,
      'Phone': updatedStudent.phone || '',
      'Status': updatedStudent.status,
      'Current Year': updatedStudent.yearOfStudy,
      'Program Type': updatedStudent.programType,
      'Degree Program': updatedStudent.specificProgram,
      'Major/Specialization': updatedStudent.major || '',
      'Academic Start Date': updatedStudent.academicStartDate ? new Date(updatedStudent.academicStartDate).toLocaleDateString() : '',
      'Date Added to CRM': new Date(updatedStudent.dateAdded).toLocaleDateString(),
      'Last Interaction Date': updatedStudent.lastInteraction ? new Date(updatedStudent.lastInteraction).toLocaleDateString() : '',
      'Total Consultations': updatedStudent.consultations.length,
      'Total Notes': updatedStudent.notes.length,
      'Pending Follow-ups': updatedStudent.followUpReminders.filter(r => !r.completed).length,
      'Latest Consultation Type': latestConsultation?.type || '',
      'Latest Consultation Date': latestConsultation ? new Date(latestConsultation.date).toLocaleDateString() : '',
      'Latest Consultation Attended': latestConsultation ? (latestConsultation.attended ? 'Yes' : 'No') : '',
      'Latest Note Preview': latestNote ? (latestNote.content.length > 100 ? latestNote.content.substring(0, 100) + '...' : latestNote.content) : '',
      'Latest Note Date': latestNote ? new Date(latestNote.dateCreated).toLocaleDateString() : ''
    };
  });

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const exportToJSON = (filename: string = 'crm-backup.json') => {
  const data = {
    students: loadStudents(),
    exportDate: new Date().toISOString(),
    version: '1.0',
    metadata: {
      totalStudents: loadStudents().length,
      exportedBy: 'Personal CRM System',
      description: 'Complete backup of student data including consultations, notes, and follow-ups'
    }
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const importFromCSV = (file: File): Promise<Partial<Student>[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const students: Partial<Student>[] = results.data.map((row: any) => {
            // Handle both full name and separate first/last name columns
            let firstName = row['First Name'] || '';
            let lastName = row['Last Name'] || '';
            
            // If no separate names but full name exists, try to split
            if (!firstName && !lastName && row['Full Name']) {
              const nameParts = row['Full Name'].trim().split(' ');
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            }

            // Parse academic start date
            let academicStartDate = '';
            if (row['Academic Start Date']) {
              try {
                const date = new Date(row['Academic Start Date']);
                if (!isNaN(date.getTime())) {
                  academicStartDate = date.toISOString();
                }
              } catch (e) {
                // Invalid date, leave empty
              }
            }

            return {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: (row['Email'] || '').trim(),
              phone: (row['Phone'] || '').trim(),
              yearOfStudy: row['Current Year'] || row['Year of Study'] || '1st year',
              programType: row['Program Type'] || "Bachelor's",
              specificProgram: row['Degree Program'] || row['Specific Program'] || '',
              major: row['Major/Specialization'] || row['Major'] || '',
              status: row['Status'] || 'Active',
              academicStartDate: academicStartDate
            };
          }).filter(student => 
            // Only include rows with at least first name, last name, and email
            student.firstName && student.lastName && student.email
          );
          
          resolve(students);
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
};

export const importFromJSON = (file: File): Promise<{ students: Student[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate JSON structure
        if (!data.students || !Array.isArray(data.students)) {
          throw new Error('Invalid JSON format: missing or invalid students array');
        }

        // Validate each student has required fields
        const validStudents = data.students.filter((student: any) => 
          student.firstName && student.lastName && student.email
        );

        if (validStudents.length === 0) {
          throw new Error('No valid students found in JSON file');
        }

        resolve({ students: validStudents });
      } catch (error) {
        reject(new Error(`JSON parsing error: ${error instanceof Error ? error.message : 'Invalid JSON format'}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Generate sample CSV template for download
export const downloadCSVTemplate = () => {
  const templateData = [
    {
      'Full Name': 'John Doe',
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john.doe@university.edu',
      'Phone': '+1 (555) 123-4567',
      'Status': 'Active',
      'Current Year': '3rd year',
      'Program Type': "Bachelor's",
      'Degree Program': 'Computer Science',
      'Major/Specialization': '',
      'Academic Start Date': '9/1/2022'
    },
    {
      'Full Name': 'Jane Smith',
      'First Name': 'Jane',
      'Last Name': 'Smith',
      'Email': 'jane.smith@university.edu',
      'Phone': '+1 (555) 987-6543',
      'Status': 'Active',
      'Current Year': '1st year',
      'Program Type': "Master's",
      'Degree Program': 'MBA',
      'Major/Specialization': '',
      'Academic Start Date': '9/1/2024'
    },
    {
      'Full Name': 'Mike Johnson',
      'First Name': 'Mike',
      'Last Name': 'Johnson',
      'Email': 'mike.johnson@university.edu',
      'Phone': '',
      'Status': 'Active',
      'Current Year': '2nd year',
      'Program Type': "Bachelor's",
      'Degree Program': 'Business Administration',
      'Major/Specialization': 'Finance',
      'Academic Start Date': '9/1/2023'
    }
  ];

  const csv = Papa.unparse(templateData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
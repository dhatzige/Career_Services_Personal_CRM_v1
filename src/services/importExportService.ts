import Papa from 'papaparse';
import apiClient from './apiClient';
import { toast } from 'react-hot-toast';

// Export data from backend
export const exportData = async (type: 'students' | 'consultations' | 'notes', format: 'csv' | 'json' = 'csv') => {
  try {
    const response = await apiClient.get('/api/reports/export', {
      params: { type, format },
      responseType: format === 'csv' ? 'text' : 'json'
    });

    if (format === 'csv') {
      // Create download link for CSV
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type} exported successfully`);
    } else {
      // For JSON format
      const jsonStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${type} exported successfully`);
    }
  } catch (error) {
    console.error('Export failed:', error);
    toast.error(`Failed to export ${type}`);
    throw error;
  }
};

// Import students from CSV
export const importStudentsFromCSV = async (file: File): Promise<{
  success: boolean;
  message: string;
  successCount?: number;
  errorCount?: number;
  errors?: string[];
}> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Send parsed data to backend
          const response = await apiClient.post('/api/reports/import', {
            type: 'students',
            data: results.data
          });

          if (response.data.success) {
            toast.success(response.data.message);
            resolve(response.data);
          } else {
            toast.error(response.data.message || 'Import failed');
            resolve(response.data);
          }
        } catch (error: any) {
          console.error('Import failed:', error);
          const message = error.response?.data?.error || 'Failed to import students';
          toast.error(message);
          reject(new Error(message));
        }
      },
      error: (error) => {
        const message = `CSV parsing error: ${error.message}`;
        toast.error(message);
        reject(new Error(message));
      }
    });
  });
};

// Download CSV template
export const downloadCSVTemplate = () => {
  const templateData = [
    {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john.doe@university.edu',
      'Phone': '+1 (555) 123-4567',
      'Status': 'Active',
      'Current Year': '3rd year',
      'Program Type': "Bachelor's",
      'Degree Program': 'Computer Science',
      'Major/Specialization': ''
    },
    {
      'First Name': 'Jane',
      'Last Name': 'Smith',
      'Email': 'jane.smith@university.edu',
      'Phone': '+1 (555) 987-6543',
      'Status': 'Active',
      'Current Year': '1st year',
      'Program Type': "Master's",
      'Degree Program': 'MBA',
      'Major/Specialization': 'Finance'
    },
    {
      'First Name': 'Mike',
      'Last Name': 'Johnson',
      'Email': 'mike.johnson@university.edu',
      'Phone': '',
      'Status': 'Active',
      'Current Year': '2nd year',
      'Program Type': "Bachelor's",
      'Degree Program': 'Engineering',
      'Major/Specialization': 'Mechanical'
    }
  ];

  const csv = Papa.unparse(templateData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'student-import-template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  toast.success('Template downloaded successfully');
};

// Export all data as a backup
export const exportBackup = async () => {
  try {
    // Get all data types
    const [students, consultations, notes] = await Promise.all([
      apiClient.get('/api/reports/export', { params: { type: 'students', format: 'json' } }),
      apiClient.get('/api/reports/export', { params: { type: 'consultations', format: 'json' } }),
      apiClient.get('/api/reports/export', { params: { type: 'notes', format: 'json' } })
    ]);

    const backup = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      data: {
        students: students.data,
        consultations: consultations.data,
        notes: notes.data
      },
      metadata: {
        studentCount: students.data.length,
        consultationCount: consultations.data.length,
        noteCount: notes.data.length
      }
    };

    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `career-services-backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Full backup exported successfully');
  } catch (error) {
    console.error('Backup export failed:', error);
    toast.error('Failed to export backup');
    throw error;
  }
};
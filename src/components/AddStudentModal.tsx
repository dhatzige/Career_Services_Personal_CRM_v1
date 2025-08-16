import React, { useState, useEffect } from 'react';
import { X, User, GraduationCap, Calendar, Save, Plus, AlertTriangle } from 'lucide-react';
import { api } from '../services/apiClient';
import { toast } from './ui/toast';
import * as Sentry from '@sentry/react';
import { Student } from '../types/student';
import { findSimilarStudents } from '../utils/duplicateDetection';
import { useAutoSave } from '../hooks/useAutoSave';
import { 
  BUSINESS_ADMIN_MAJORS, 
  requiresMajor,
  getProgramsByType 
} from '../utils/academicProgression';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: (student: Student) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onStudentAdded }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    quickNote: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    yearOfStudy: '1st year' as const,
    programType: "Bachelor's" as const,
    specificProgram: '',
    major: '',
    academicStartDate: ''
  });

  const [duplicateWarning, setDuplicateWarning] = useState<{
    type: 'email' | 'name';
    message: string;
  } | null>(null);

  const { clearAutoSave, loadAutoSave } = useAutoSave(formData, 'add-student-draft');

  useEffect(() => {
    if (isOpen) {
      // Load auto-saved data if available
      const saved = loadAutoSave();
      if (saved) {
        setFormData(saved);
      } else {
        // Set default academic start date based on current date only if no saved data
        const now = new Date();
        const currentYear = now.getFullYear();
        const academicStartMonth = 8; // September
        
        // If we're before September, use last year's September
        const startYear = now.getMonth() < academicStartMonth ? currentYear - 1 : currentYear;
        const defaultStartDate = new Date(startYear, academicStartMonth, 1).toISOString().split('T')[0];
        
        setFormData(prev => ({ ...prev, academicStartDate: defaultStartDate }));
      }
    }
  }, [isOpen, loadAutoSave]);

  useEffect(() => {
    // Reset specific program and major when program type changes
    setFormData(prev => ({ 
      ...prev, 
      specificProgram: '', 
      major: '' 
    }));
  }, [formData.programType]);

  useEffect(() => {
    // Reset major when specific program changes
    if (!requiresMajor(formData.specificProgram)) {
      setFormData(prev => ({ ...prev, major: '' }));
    }
  }, [formData.specificProgram]);

  useEffect(() => {
    // Check for duplicates when email changes
    if (formData.email) {
      // For now, skip duplicate check as it would require a new API endpoint
      // This can be added later as an enhancement
      setDuplicateWarning(null);
    }

    // TODO: Update findSimilarStudents to use Supabase
    // For now, skip name similarity check
  }, [formData.email]);

  const yearOptions = ['1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Alumni'];
  const programTypeOptions = ["Bachelor's", "Master's"];
  
  // Specific Master's programs offered by the university
  const mastersProgramOptions = [
    'MBA',
    'Masters in Tourism Management', 
    'MS in Industrial Organizational Psychology'
  ];

  const handleSubmit = async (saveAndAddAnother = false) => {
    // Skip duplicate check for now - can be added as API enhancement later

    const studentData: Omit<Student, 'id' | 'dateAdded' | 'notes' | 'consultations' | 'followUpReminders' | 'status'> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      yearOfStudy: formData.yearOfStudy,
      programType: formData.programType,
      specificProgram: formData.specificProgram,
      academicStartDate: formData.academicStartDate,
      status: 'Active'
    };

    // Add major if required
    if (requiresMajor(formData.specificProgram) && formData.major) {
      studentData.major = formData.major;
    }

    try {
      const response = await api.students.create(studentData);
      const newStudent = response.data || response;

      if (formData.quickNote && newStudent.id) {
        // Add the quick note
        try {
          await api.notes.create(newStudent.id, {
            content: formData.quickNote,
            type: 'General',
            tags: ['Quick Note']
          });
        } catch (noteError) {
          console.error('Failed to add quick note:', noteError);
        }
      }

      clearAutoSave();
      onStudentAdded(newStudent);
      
      toast.success(`${newStudent.firstName} ${newStudent.lastName} has been added successfully.`);

      if (saveAndAddAnother) {
        // Reset form but keep modal open
        setFormData({
          quickNote: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          yearOfStudy: '1st year',
          programType: "Bachelor's",
          specificProgram: '',
          major: '',
          academicStartDate: formData.academicStartDate // Keep the same academic year
        });
        setStep(1);
        setDuplicateWarning(null);
      } else {
        handleClose();
      }
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { operation: 'add_student' },
        extra: { studentData }
      });
      toast.error(error.message || "Failed to add student. Please try again.");
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      quickNote: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      yearOfStudy: '1st year',
      programType: "Bachelor's",
      specificProgram: '',
      major: '',
      academicStartDate: ''
    });
    setDuplicateWarning(null);
    onClose();
  };

  if (!isOpen) return null;

  const availablePrograms = getProgramsByType(formData.programType);
  const showMajorSelection = requiresMajor(formData.specificProgram);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Add New Student
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            {/* Progress indicator */}
            <div className="flex items-center mb-6">
              {[1, 2, 3].map((stepNumber) => (
                <React.Fragment key={stepNumber}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    step >= stepNumber
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`flex-1 h-1 mx-2 transition-colors ${
                      step > stepNumber ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Duplicate Warning */}
            {duplicateWarning && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    {duplicateWarning.message}
                  </span>
                </div>
              </div>
            )}

            {/* Step 1: Quick Note */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Quick Note (Optional)</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add a quick note about this student</p>
                </div>
                <textarea
                  value={formData.quickNote}
                  onChange={(e) => setFormData({ ...formData, quickNote: e.target.value })}
                  placeholder="e.g., Met at career fair, interested in software engineering..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <User className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      duplicateWarning?.type === 'email'
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!formData.firstName || !formData.lastName || !formData.email || duplicateWarning?.type === 'email'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Academic Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <GraduationCap className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">Academic Details</h4>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Program Type
                  </label>
                  <select
                    value={formData.programType}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        programType: e.target.value as "Bachelor's" | "Master's",
                        // Clear specific program if switching from Master's to Bachelor's
                        specificProgram: e.target.value === "Bachelor's" ? '' : formData.specificProgram
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    {programTypeOptions.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Specific Program
                  </label>
                  <select
                    value={formData.specificProgram}
                    onChange={(e) => setFormData({ ...formData, specificProgram: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="">Select a program</option>
                    {availablePrograms.map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>

                {showMajorSelection && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Major/Specialization
                    </label>
                    <select
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <option value="">Select a major</option>
                      {BUSINESS_ADMIN_MAJORS.map(major => (
                        <option key={major} value={major}>{major}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Year of Study
                  </label>
                  <select
                    value={formData.yearOfStudy}
                    onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value as '1st year' | '2nd year' | '3rd year' | '4th year' | 'Graduate' | 'Alumni' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Academic Start Year
                  </label>
                  <select
                    value={formData.academicStartDate ? new Date(formData.academicStartDate).getFullYear() : ''}
                    onChange={(e) => {
                      const year = e.target.value;
                      if (year) {
                        // Set to September 1st of the selected year
                        setFormData({ ...formData, academicStartDate: `${year}-09-01` });
                      } else {
                        setFormData({ ...formData, academicStartDate: '' });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <option value="">Select year</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When did this student start their program? (Used for automatic year progression)
                  </p>
                </div>

                <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSubmit(true)}
                      disabled={!formData.specificProgram || (showMajorSelection && !formData.major)}
                      className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Save & Add Another
                    </button>
                    <button
                      onClick={() => handleSubmit(false)}
                      disabled={!formData.specificProgram || (showMajorSelection && !formData.major)}
                      className="inline-flex items-center px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" />
                      Save & View
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;
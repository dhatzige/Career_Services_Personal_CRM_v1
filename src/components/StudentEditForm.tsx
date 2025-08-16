import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface StudentEditFormProps {
  editForm: any;
  setEditForm: (form: any) => void;
  onCancel: () => void;
  onSave: () => void;
}

const StudentEditForm: React.FC<StudentEditFormProps> = ({ editForm, setEditForm, onCancel, onSave }) => {
  const [newCareerInterest, setNewCareerInterest] = useState('');
  const [newIndustry, setNewIndustry] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newTag, setNewTag] = useState('');

  const jobSearchStatuses = [
    'Not Started',
    'Preparing',
    'Actively Searching',
    'Searching for Internship',
    'Currently Interning',
    'Interviewing',
    'Offer Received',
    'Employed',
    'Not Seeking'
  ];

  const yearOptions = ['1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Alumni'];
  const programTypeOptions = ["Bachelor's", "Master's"];
  const statusOptions = ['Active', 'Inactive', 'Graduated'];
  
  // Specific Master's programs offered by the university
  const mastersProgramOptions = [
    'MBA',
    'Masters in Tourism Management', 
    'MS in Industrial Organizational Psychology'
  ];

  const addArrayItem = (field: string, value: string, setter: (val: string) => void) => {
    if (value.trim()) {
      setEditForm({
        ...editForm,
        [field]: [...editForm[field], value.trim()]
      });
      setter('');
    }
  };

  const removeArrayItem = (field: string, index: number) => {
    setEditForm({
      ...editForm,
      [field]: editForm[field].filter((_: any, i: number) => i !== index)
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
      {/* Basic Information */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year of Study
              </label>
              <select
                value={editForm.yearOfStudy}
                onChange={(e) => setEditForm({ ...editForm, yearOfStudy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Program Type
              </label>
              <select
                value={editForm.programType}
                onChange={(e) => {
                  setEditForm({ 
                    ...editForm, 
                    programType: e.target.value,
                    // Clear specific program if switching from Master's to Bachelor's
                    specificProgram: e.target.value === "Bachelor's" ? '' : editForm.specificProgram
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {programTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Academic Information</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {editForm.programType === "Master's" ? 'Master\'s Program' : 'Specific Program'}
              </label>
              {editForm.programType === "Master's" ? (
                <select
                  value={editForm.specificProgram}
                  onChange={(e) => setEditForm({ ...editForm, specificProgram: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select a program</option>
                  {mastersProgramOptions.map(program => (
                    <option key={program} value={program}>{program}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={editForm.specificProgram}
                  onChange={(e) => setEditForm({ ...editForm, specificProgram: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Business Administration, Computer Science"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Major/Specialization
              </label>
              <input
                type="text"
                value={editForm.major}
                onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Finance, Marketing"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Academic Start Date
              </label>
              <input
                type="date"
                value={editForm.academicStartDate ? editForm.academicStartDate.split('T')[0] : ''}
                onChange={(e) => setEditForm({ ...editForm, academicStartDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Expected Graduation Date
              </label>
              <input
                type="date"
                value={editForm.expectedGraduationDate ? editForm.expectedGraduationDate.split('T')[0] : ''}
                onChange={(e) => setEditForm({ ...editForm, expectedGraduationDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Career Information */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Career Information</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Search Status
              </label>
              <select
                value={editForm.jobSearchStatus}
                onChange={(e) => setEditForm({ ...editForm, jobSearchStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {jobSearchStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={editForm.linkedinUrl}
                onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="resumeOnFile"
                checked={editForm.resumeOnFile}
                onChange={(e) => setEditForm({ ...editForm, resumeOnFile: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="resumeOnFile" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Resume on File
              </label>
            </div>
            {editForm.resumeOnFile && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Resume Last Updated
                </label>
                <input
                  type="date"
                  value={editForm.resumeLastUpdated ? editForm.resumeLastUpdated.split('T')[0] : ''}
                  onChange={(e) => setEditForm({ ...editForm, resumeLastUpdated: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Career Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Career Interests
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCareerInterest}
                onChange={(e) => setNewCareerInterest(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArrayItem('careerInterests', newCareerInterest, setNewCareerInterest);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add career interest..."
              />
              <button
                type="button"
                onClick={() => addArrayItem('careerInterests', newCareerInterest, setNewCareerInterest)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editForm.careerInterests.map((interest: string, index: number) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('careerInterests', index)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Target Industries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Industries
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newIndustry}
                onChange={(e) => setNewIndustry(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArrayItem('targetIndustries', newIndustry, setNewIndustry);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add target industry..."
              />
              <button
                type="button"
                onClick={() => addArrayItem('targetIndustries', newIndustry, setNewIndustry)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editForm.targetIndustries.map((industry: string, index: number) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  {industry}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('targetIndustries', index)}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Target Locations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Locations
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArrayItem('targetLocations', newLocation, setNewLocation);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add target location..."
              />
              <button
                type="button"
                onClick={() => addArrayItem('targetLocations', newLocation, setNewLocation)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editForm.targetLocations.map((location: string, index: number) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  {location}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('targetLocations', index)}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addArrayItem('tags', newTag, setNewTag);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add tag..."
              />
              <button
                type="button"
                onClick={() => addArrayItem('tags', newTag, setNewTag)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editForm.tags.map((tag: string, index: number) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeArrayItem('tags', index)}
                    className="ml-1 text-gray-600 hover:text-gray-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Action Buttons - Sticky at bottom */}
      <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default StudentEditForm;
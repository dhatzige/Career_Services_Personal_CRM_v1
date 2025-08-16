import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, User, Mail, Phone, GraduationCap, Calendar, Clock, MessageSquare, Plus, Edit, CheckCircle, XCircle, AlertCircle, Trash, Linkedin, FileText, Briefcase, MapPin, Building, Pencil } from 'lucide-react';
import type { Student, Consultation, Note } from '../types';
import { toast } from 'react-hot-toast';
import StudentEditForm from './StudentEditForm';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { NOTE_TYPES, CONSULTATION_TYPES } from '../types/shared';
import ConsultationTypeModal from './ConsultationTypeModal';

interface StudentDetailModalProps {
  student?: Student;
  notes: Note[];
  consultations: Consultation[];
  onClose: () => void;
  onUpdate: (updates: Partial<Student>) => void;
  onDelete?: () => void;
  onAddNote: (noteData: Partial<Note>) => void;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  onAddConsultation: (data: Partial<Consultation>) => void;
  onUpdateConsultation: (id: string, updates: Partial<Consultation>) => void;
  onDeleteConsultation: (id: string) => void;
  initialTab?: 'timeline' | 'info' | 'notes' | 'consultations';
}

// Types are now imported from shared/types

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ 
  student,
  notes,
  consultations,
  onClose,
  onUpdate,
  onDelete,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddConsultation,
  onUpdateConsultation,
  onDeleteConsultation,
  initialTab = 'info'
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'info' | 'notes' | 'consultations'>(initialTab);
  const [isEditing, setIsEditing] = useState(!student);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddConsultation, setShowAddConsultation] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [typeModalData, setTypeModalData] = useState<{
    isOpen: boolean;
    consultationId: string;
    currentType: string;
  }>({ isOpen: false, consultationId: '', currentType: '' });

  // Forms
  const [editForm, setEditForm] = useState({
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    phone: student?.phone || '',
    yearOfStudy: student?.yearOfStudy || '',
    programType: student?.programType || '',
    specificProgram: student?.specificProgram || '',
    major: student?.major || '',
    jobSearchStatus: student?.jobSearchStatus || 'Not Started',
    careerInterests: student?.careerInterests || [],
    linkedinUrl: student?.linkedinUrl || '',
    resumeOnFile: student?.resumeOnFile || false,
    targetIndustries: student?.targetIndustries || [],
    targetLocations: student?.targetLocations || [],
    academicStartDate: student?.academicStartDate || '',
    expectedGraduation: student?.expectedGraduation || '',
    quickNote: student?.quickNote || '',
    tags: student?.tags || []
  });

  const [noteForm, setNoteForm] = useState({
    content: '',
    type: 'General' as typeof NOTE_TYPES[number],
    tags: [] as string[]
  });

  const [consultationForm, setConsultationForm] = useState({
    scheduledDate: new Date().toISOString().slice(0, 16),
    duration: 30,
    type: 'General' as typeof CONSULTATION_TYPES[number],
    location: 'online',
    meetingLink: '',
    notes: '',
    status: 'scheduled' as 'scheduled' | 'attended' | 'no-show' | 'cancelled'
  });

  // Handle save/update
  const handleSave = async () => {
    try {
      if (!editForm.firstName || !editForm.lastName || !editForm.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      const updates = {
        first_name: editForm.firstName,
        last_name: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        year_of_study: editForm.yearOfStudy,
        program_type: editForm.programType,
        specific_program: editForm.specificProgram,
        major: editForm.major,
        job_search_status: editForm.jobSearchStatus,
        career_interests: editForm.careerInterests,
        linkedin_url: editForm.linkedinUrl,
        resume_on_file: editForm.resumeOnFile,
        target_industries: editForm.targetIndustries,
        target_locations: editForm.targetLocations,
        academic_start_date: editForm.academicStartDate,
        expected_graduation: editForm.expectedGraduation,
        quick_note: editForm.quickNote,
        tags: editForm.tags
      };

      await onUpdate(updates);
      setIsEditing(false);
      if (!student) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error('Failed to save student');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
      onClose();
    }
  };

  // Add note
  const handleAddNote = async () => {
    if (!noteForm.content.trim()) {
      toast.error('Please enter note content');
      return;
    }

    await onAddNote({
      content: noteForm.content,
      type: noteForm.type,
      tags: noteForm.tags
    });

    setNoteForm({
      content: '',
      type: 'General',
      tags: []
    });
    setShowAddNote(false);
  };

  // Update note
  const handleUpdateNote = async (noteId: string, content: string) => {
    await onUpdateNote(noteId, { content });
    setEditingNoteId(null);
  };

  // Add consultation
  const handleAddConsultation = async () => {
    await onAddConsultation({
      date: consultationForm.scheduledDate,
      duration: consultationForm.duration,
      type: consultationForm.type,
      location: consultationForm.location,
      meeting_link: consultationForm.meetingLink,
      notes: consultationForm.notes,
      status: consultationForm.status  // Use the form's status
    });

    setConsultationForm({
      scheduledDate: new Date().toISOString().slice(0, 16),
      duration: 30,
      type: 'General',
      location: 'online',
      meetingLink: '',
      notes: '',
      status: 'scheduled'  // Reset to scheduled for next consultation
    });
    setShowAddConsultation(false);
  };

  // Get timeline items
  const getTimelineItems = () => {
    const items: Array<{
      id: string;
      type: 'consultation' | 'note';
      date: string;
      title: string;
      content: string;
      status?: string;
      data: Consultation | Note;
    }> = [];

    consultations.forEach(consultation => {
      // Handle different date field names for consultations
      const consultationDate = consultation.consultation_date || consultation.date || consultation.scheduled_date;
      items.push({
        id: consultation.id,
        type: 'consultation',
        date: consultationDate,
        title: consultation.type,
        content: consultation.notes || '',
        status: consultation.status,
        data: consultation
      });
    });

    notes.forEach(note => {
      // Handle both dateCreated and date fields for notes
      const noteDate = note.dateCreated || note.date || note.created_at;
      items.push({
        id: note.id,
        type: 'note',
        date: noteDate,
        title: note.type,
        content: note.content,
        data: note
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {student ? `${student.firstName} ${student.lastName}` : 'New Student'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {student && (
              <div className="border-b dark:border-gray-700 mb-4">
                <nav className="flex space-x-8">
                  {(['info', 'timeline', 'notes', 'consultations'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden px-1">
              {(activeTab === 'info' || !student) && (
                <div className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            First Name *
                          </label>
                          <Input
                            type="text"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Last Name *
                          </label>
                          <Input
                            type="text"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone
                        </label>
                        <Input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Year of Study
                          </label>
                          <Select
                            value={editForm.yearOfStudy}
                            onValueChange={(value) => setEditForm({ ...editForm, yearOfStudy: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select year" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1st year">1st year</SelectItem>
                              <SelectItem value="2nd year">2nd year</SelectItem>
                              <SelectItem value="3rd year">3rd year</SelectItem>
                              <SelectItem value="4th year">4th year</SelectItem>
                              <SelectItem value="Graduate">Graduate</SelectItem>
                              <SelectItem value="Alumni">Alumni</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Program Type
                          </label>
                          <Select
                            value={editForm.programType}
                            onValueChange={(value) => setEditForm({ ...editForm, programType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                              <SelectItem value="Master's">Master's</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {editForm.programType === 'Master\'s' ? 'Program' : 'Major'}
                        </label>
                        <Select
                          value={editForm.major || ''}
                          onValueChange={(value) => setEditForm({ ...editForm, major: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={editForm.programType === 'Master\'s' ? 'Select program' : 'Select major'} />
                          </SelectTrigger>
                          <SelectContent>
                            {editForm.programType === 'Master\'s' ? (
                              <>
                                <SelectItem value="MBA">MBA</SelectItem>
                                <SelectItem value="Masters in Tourism Management">Masters in Tourism Management</SelectItem>
                                <SelectItem value="MS in Industrial Organizational Psychology">MS in Industrial Organizational Psychology</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="Business Administration">Business Administration</SelectItem>
                                <SelectItem value="Business - Finance">Business - Finance</SelectItem>
                                <SelectItem value="Business - Marketing">Business - Marketing</SelectItem>
                                <SelectItem value="Business - Hospitality">Business - Hospitality</SelectItem>
                                <SelectItem value="Psychology">Psychology</SelectItem>
                                <SelectItem value="English Literature">English Literature</SelectItem>
                                <SelectItem value="English New Media">English New Media</SelectItem>
                                <SelectItem value="Biology">Biology</SelectItem>
                                <SelectItem value="International Relations & Politics">International Relations & Politics</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Job Search Status
                        </label>
                        <Select
                          value={editForm.jobSearchStatus}
                          onValueChange={(value) => setEditForm({ ...editForm, jobSearchStatus: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="Preparing">Preparing</SelectItem>
                            <SelectItem value="Actively Searching">Actively Searching</SelectItem>
                            <SelectItem value="Interviewing">Interviewing</SelectItem>
                            <SelectItem value="Offer Received">Offer Received</SelectItem>
                            <SelectItem value="Employed">Employed</SelectItem>
                            <SelectItem value="Not Seeking">Not Seeking</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quick Note
                        </label>
                        <Textarea
                          value={editForm.quickNote}
                          onChange={(e) => setEditForm({ ...editForm, quickNote: e.target.value })}
                          rows={3}
                        />
                      </div>

                      {/* Additional Professional Information */}
                      <div className="col-span-2 border-t pt-4 mt-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Professional Information</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              LinkedIn URL
                            </label>
                            <Input
                              type="url"
                              value={editForm.linkedinUrl}
                              onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                              placeholder="https://linkedin.com/in/..."
                            />
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="resume-on-file"
                              checked={editForm.resumeOnFile}
                              onChange={(e) => setEditForm({ ...editForm, resumeOnFile: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="resume-on-file" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Resume on file
                            </label>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Target Industries
                            </label>
                            <Input
                              type="text"
                              value={editForm.targetIndustries.join(', ')}
                              onChange={(e) => setEditForm({ ...editForm, targetIndustries: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                              placeholder="Tech, Finance, Healthcare..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Target Locations
                            </label>
                            <Input
                              type="text"
                              value={editForm.targetLocations.join(', ')}
                              onChange={(e) => setEditForm({ ...editForm, targetLocations: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                              placeholder="New York, Remote, San Francisco..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Career Interests
                            </label>
                            <Input
                              type="text"
                              value={editForm.careerInterests.join(', ')}
                              onChange={(e) => setEditForm({ ...editForm, careerInterests: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                              placeholder="Software Engineering, Product Management..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                          </div>
                        </div>
                      </div>

                      {/* Academic Timeline */}
                      <div className="border-t pt-4 mt-4 space-y-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Academic Timeline</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Academic Start Date
                            </label>
                            <Input
                              type="date"
                              value={editForm.academicStartDate}
                              onChange={(e) => setEditForm({ ...editForm, academicStartDate: e.target.value })}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Expected Graduation
                            </label>
                            <Input
                              type="date"
                              value={editForm.expectedGraduation}
                              onChange={(e) => setEditForm({ ...editForm, expectedGraduation: e.target.value })}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Specific Program
                          </label>
                          <Input
                            type="text"
                            value={editForm.specificProgram}
                            onChange={(e) => setEditForm({ ...editForm, specificProgram: e.target.value })}
                            placeholder="e.g., Computer Science, Business Administration"
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="border-t pt-4 mt-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Tags</h4>
                        
                        <div>
                          <Input
                            type="text"
                            value={editForm.tags.join(', ')}
                            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            placeholder="honors, scholarship, athlete, international..."
                          />
                          <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4 col-span-2">
                        {student && (
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button onClick={handleSave}>
                          {student ? 'Save Changes' : 'Create Student'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-5 w-5 text-gray-400" />
                            <span className="text-gray-900 dark:text-gray-100">{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-5 w-5 text-gray-400" />
                              <span className="text-gray-900 dark:text-gray-100">{student.phone}</span>
                            </div>
                          )}
                          {student.major && (
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-5 w-5 text-gray-400" />
                              <span className="text-gray-900 dark:text-gray-100">{student.major}</span>
                            </div>
                          )}
                          {student.yearOfStudy && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-5 w-5 text-gray-400" />
                              <span className="text-gray-900 dark:text-gray-100">{student.yearOfStudy}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Populate the form with current student data
                              setEditForm({
                                firstName: student.firstName || '',
                                lastName: student.lastName || '',
                                email: student.email || '',
                                phone: student.phone || '',
                                yearOfStudy: student.yearOfStudy || '',
                                programType: student.programType || '',
                                specificProgram: student.specificProgram || '',
                                major: student.major || '',
                                jobSearchStatus: student.jobSearchStatus || 'Not Started',
                                careerInterests: student.careerInterests || [],
                                linkedinUrl: student.linkedinUrl || '',
                                resumeOnFile: student.resumeOnFile || false,
                                targetIndustries: student.targetIndustries || [],
                                targetLocations: student.targetLocations || [],
                                academicStartDate: student.academicStartDate || '',
                                expectedGraduation: student.expectedGraduation || '',
                                quickNote: student.quickNote || '',
                                tags: student.tags || []
                              });
                              setIsEditing(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {onDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowDeleteConfirm(true)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>

                      {student.jobSearchStatus && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Job Search Status: <span className="text-gray-900 dark:text-gray-100">{student.jobSearchStatus}</span>
                          </p>
                        </div>
                      )}

                      {student.quickNote && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{student.quickNote}</p>
                        </div>
                      )}

                      {student.no_show_count && student.no_show_count > 0 && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                            <p className="text-sm font-medium text-red-900 dark:text-red-200">
                              No-shows: {student.no_show_count}
                            </p>
                          </div>
                          {student.last_no_show_date && (
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              Last no-show: {new Date(student.last_no_show_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Professional Information */}
                      <div className="mt-6 space-y-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Professional Information</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {student.linkedinUrl && (
                            <div className="flex items-center space-x-2">
                              <Linkedin className="h-5 w-5 text-blue-600" />
                              <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline">
                                LinkedIn Profile
                              </a>
                            </div>
                          )}
                          
                          {student.resumeOnFile && (
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-green-600" />
                              <span className="text-green-600 dark:text-green-400">Resume on file</span>
                              {student.resume_last_updated && (
                                <span className="text-sm text-gray-500">
                                  (Updated: {new Date(student.resume_last_updated).toLocaleDateString()})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {student.careerInterests && student.careerInterests.length > 0 && (
                          <div>
                            <div className="flex items-start space-x-2">
                              <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Career Interests</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {student.careerInterests.map((interest, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm">
                                      {interest}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {student.targetIndustries && student.targetIndustries.length > 0 && (
                          <div>
                            <div className="flex items-start space-x-2">
                              <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Industries</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {student.targetIndustries.map((industry, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-sm">
                                      {industry}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {student.targetLocations && student.targetLocations.length > 0 && (
                          <div>
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Locations</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {student.targetLocations.map((location, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">
                                      {location}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Academic Timeline */}
                      {(student.academicStartDate || student.expectedGraduation || student.specificProgram) && (
                        <div className="mt-6 space-y-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Academic Information</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {student.specificProgram && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Program</p>
                                <p className="text-gray-900 dark:text-gray-100">{student.specificProgram}</p>
                              </div>
                            )}
                            
                            {student.academicStartDate && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Started</p>
                                <p className="text-gray-900 dark:text-gray-100">
                                  {new Date(student.academicStartDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            )}
                            
                            {student.expectedGraduation && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Graduation</p>
                                <p className="text-gray-900 dark:text-gray-100">
                                  {new Date(student.expectedGraduation).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {student.tags && student.tags.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {student.tags.map((tag, idx) => (
                              <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && student && (
                <div className="space-y-4">
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {getTimelineItems().map((item, index) => (
                        <li key={item.id}>
                          <div className="relative pb-8">
                            {index !== getTimelineItems().length - 1 && (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-800 ${
                                  item.type === 'consultation'
                                    ? item.status === 'attended'
                                      ? 'bg-green-500'
                                      : item.status === 'no-show'
                                      ? 'bg-red-500'
                                      : 'bg-gray-400'
                                    : 'bg-blue-500'
                                }`}>
                                  {item.type === 'consultation' ? (
                                    item.status === 'attended' ? (
                                      <CheckCircle className="h-5 w-5 text-white" />
                                    ) : item.status === 'no-show' ? (
                                      <XCircle className="h-5 w-5 text-white" />
                                    ) : (
                                      <Clock className="h-5 w-5 text-white" />
                                    )
                                  ) : (
                                    <MessageSquare className="h-5 w-5 text-white" />
                                  )}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5">
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {item.title}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(item.date).toLocaleString()}
                                  </p>
                                  {item.content && (
                                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                      {item.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && student && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notes</h4>
                    <Button
                      size="sm"
                      onClick={() => setShowAddNote(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Note
                    </Button>
                  </div>

                  {showAddNote && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded mb-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type
                          </label>
                          <Select
                            value={noteForm.type}
                            onValueChange={(value) => setNoteForm({ ...noteForm, type: value as typeof NOTE_TYPES[number] })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {NOTE_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Content
                          </label>
                          <Textarea
                            value={noteForm.content}
                            onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                            rows={3}
                            placeholder="Enter note content..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAddNote(false);
                              setNoteForm({ content: '', type: 'General', tags: [] });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddNote}
                          >
                            Save Note
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {notes.map(note => (
                      <div key={note.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {note.type}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {(() => {
                                // Handle both dateCreated (from direct API) and date (from Student model)
                                const dateValue = note.dateCreated || note.date;
                                if (!dateValue) return 'No date';
                                try {
                                  // Handle SQLite date format "YYYY-MM-DD HH:MM:SS"
                                  const dateStr = dateValue.replace(' ', 'T') + 'Z'; // Convert to ISO format
                                  const date = new Date(dateStr);
                                  if (isNaN(date.getTime())) return 'Invalid date';
                                  return date.toLocaleString(undefined, { 
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                  });
                                } catch (error) {
                                  return 'Invalid date';
                                }
                              })()}
                            </span>
                            <button
                              onClick={() => setEditingNoteId(note.id)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteNote(note.id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {editingNoteId === note.id ? (
                          <div className="space-y-2">
                            <Textarea
                              defaultValue={note.content}
                              onBlur={(e) => handleUpdateNote(note.id, e.target.value)}
                              autoFocus
                              rows={3}
                            />
                            <Button
                              size="sm"
                              onClick={() => setEditingNoteId(null)}
                            >
                              Done
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {note.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'consultations' && student && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">Consultations</h4>
                    <Button
                      size="sm"
                      onClick={() => setShowAddConsultation(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Schedule Consultation
                    </Button>
                  </div>

                  {showAddConsultation && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded mb-4">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Date & Time
                            </label>
                            <Input
                              type="datetime-local"
                              value={consultationForm.scheduledDate}
                              onChange={(e) => setConsultationForm({ ...consultationForm, scheduledDate: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Duration (minutes)
                            </label>
                            <Input
                              type="number"
                              value={consultationForm.duration}
                              onChange={(e) => setConsultationForm({ ...consultationForm, duration: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Type
                          </label>
                          <Select
                            value={consultationForm.type}
                            onValueChange={(value) => setConsultationForm({ ...consultationForm, type: value as typeof CONSULTATION_TYPES[number] })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {CONSULTATION_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Location
                          </label>
                          <Select
                            value={consultationForm.location}
                            onValueChange={(value) => setConsultationForm({ ...consultationForm, location: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="in-person">In-Person</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {consultationForm.location === 'online' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Meeting Link
                            </label>
                            <Input
                              type="url"
                              value={consultationForm.meetingLink}
                              onChange={(e) => setConsultationForm({ ...consultationForm, meetingLink: e.target.value })}
                              placeholder="https://meet.google.com/..."
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                          </label>
                          <Select
                            value={consultationForm.status}
                            onValueChange={(value) => setConsultationForm({ ...consultationForm, status: value as 'scheduled' | 'attended' | 'no-show' | 'cancelled' })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="attended">Attended</SelectItem>
                              <SelectItem value="no-show">No Show</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quick notes
                          </label>
                          <Textarea
                            value={consultationForm.notes}
                            onChange={(e) => setConsultationForm({ ...consultationForm, notes: e.target.value })}
                            rows={3}
                            placeholder="Quick notes about this consultation..."
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAddConsultation(false);
                              setConsultationForm({
                                scheduledDate: new Date().toISOString().slice(0, 16),
                                duration: 30,
                                type: 'General',
                                location: 'online',
                                meetingLink: '',
                                notes: '',
                                status: 'scheduled'
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAddConsultation}
                          >
                            Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {consultations.map(consultation => (
                      <div key={consultation.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {consultation.type}
                              </p>
                              <button
                                onClick={() => setTypeModalData({
                                  isOpen: true,
                                  consultationId: consultation.id,
                                  currentType: consultation.type
                                })}
                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                title="Edit consultation type"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(consultation.date).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {consultation.duration} minutes • {consultation.location}
                            </p>
                            {consultation.meeting_link && (
                              <a
                                href={consultation.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              >
                                Join Meeting
                              </a>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {consultation.status === 'scheduled' && new Date(consultation.scheduled_date) > new Date() && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onUpdateConsultation(consultation.id, { status: 'cancelled' })}
                              >
                                Cancel
                              </Button>
                            )}
                            {consultation.status === 'scheduled' && new Date(consultation.scheduled_date) <= new Date() && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onUpdateConsultation(consultation.id, { status: 'attended' })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Attended
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onUpdateConsultation(consultation.id, { status: 'no-show' })}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  No-show
                                </Button>
                              </>
                            )}
                            {consultation.status !== 'scheduled' && (
                              <span className={`text-sm px-2 py-1 rounded ${
                                consultation.status === 'attended'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : consultation.status === 'no-show'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                                {consultation.status}
                              </span>
                            )}
                            <button
                              onClick={() => onDeleteConsultation(consultation.id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {consultation.notes && (
                          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            {consultation.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Confirm Delete
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Are you sure you want to delete this student? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          <ConsultationTypeModal
            isOpen={typeModalData.isOpen}
            onClose={() => setTypeModalData({ isOpen: false, consultationId: '', currentType: '' })}
            consultationId={typeModalData.consultationId}
            studentName={student ? `${student.firstName} ${student.lastName}` : 'New Student'}
            currentType={typeModalData.currentType}
            onTypeSelect={async (type) => {
              try {
                await onUpdateConsultation(typeModalData.consultationId, {
                  type,
                  needsReview: false
                });
                
                toast.success(`Consultation type updated to ${type}.`);
                setTypeModalData({ isOpen: false, consultationId: '', currentType: '' });
              } catch (error) {
                console.error('Failed to update consultation type:', error);
                toast.error('Failed to update consultation type. Please try again.');
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default StudentDetailModal;
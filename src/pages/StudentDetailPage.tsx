import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Briefcase,
  FileText,
  Target,
  MapPin,
  ExternalLink,
  Edit,
  Save,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import NotesSystem from '../components/NotesSystem';
import CalendlyWidget from '../components/CalendlyWidget';
import { CareerServicesStudent } from '../types/career';
import { ApplicationTracker } from '../components/career/ApplicationTracker';
import { WorkshopTracker } from '../components/career/WorkshopTracker';
import { MockInterviewTracker } from '../components/career/MockInterviewTracker';
import { DocumentManager } from '../components/career/DocumentManager';
import { EmployerConnections } from '../components/career/EmployerConnections';
import api from '../services/api';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<CareerServicesStudent | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<CareerServicesStudent | null>(null);
  const [calendlyUrl, setCalendlyUrl] = useState('');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'notes', label: 'Notes' },
    { id: 'applications', label: 'Applications' },
    { id: 'workshops', label: 'Workshops' },
    { id: 'interviews', label: 'Mock Interviews' },
    { id: 'documents', label: 'Documents' },
    { id: 'connections', label: 'Connections' },
    { id: 'schedule', label: 'Schedule Meeting' }
  ];

  useEffect(() => {
    fetchStudent();
    fetchCalendlySettings();
  }, [id]);

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/students/${id}`);
      // api.get already returns the data directly, not wrapped in { data: ... }
      const studentData = response?.data || response;
      setStudent(studentData);
      setEditedStudent(studentData);
    } catch (error) {
      console.error('Error fetching student:', error);
    }
  };

  const fetchCalendlySettings = () => {
    // Get Calendly URL from localStorage or settings
    const savedUrl = localStorage.getItem('calendlyUrl') || '';
    setCalendlyUrl(savedUrl);
  };

  const handleSave = async () => {
    if (!editedStudent) return;

    try {
      const response = await api.put(`/students/${id}`, editedStudent);
      // api.put already returns the data directly
      const updatedStudent = response?.data || response;
      setStudent(updatedStudent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const jobSearchStatusColors = {
    'Not Started': 'bg-gray-100 text-gray-800',
    'Preparing': 'bg-yellow-100 text-yellow-800',
    'Actively Searching': 'bg-blue-100 text-blue-800',
    'Interviewing': 'bg-purple-100 text-purple-800',
    'Offer Received': 'bg-green-100 text-green-800',
    'Employed': 'bg-green-100 text-green-800',
    'Not Seeking': 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Students
        </button>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-gray-500" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {student.first_name || student.firstName} {student.last_name || student.lastName}
                </h1>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {student.email}
                  </div>
                  {student.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {student.phone}
                    </div>
                  )}
                  {student.linkedin_url && (
                    <div className="flex items-center text-gray-600">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <a 
                        href={student.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {(student.job_search_status || student.jobSearchStatus) && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${jobSearchStatusColors[student.job_search_status || student.jobSearchStatus] || 'bg-gray-100 text-gray-800'}`}>
                  {student.job_search_status || student.jobSearchStatus}
                </span>
              )}
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedStudent(student);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Academic Info</h3>
              <p className="mt-1 text-sm text-gray-900">
                {student.year_of_study || student.yearOfStudy} - {student.program_type || student.programType}
              </p>
              <p className="text-sm text-gray-900">{student.major}</p>
              {student.expected_graduation && (
                <p className="text-sm text-gray-600">
                  Graduating: {format(new Date(student.expected_graduation), 'MMMM yyyy')}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Career Interests</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {student.career_interests?.map((interest, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Target Locations</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {student.target_locations?.map((location, idx) => (
                  <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {location}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Resume Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Resume Status</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Resume on file: {student.resume_on_file ? 'Yes' : 'No'}
                    </p>
                    {student.resume_last_updated && (
                      <p className="text-sm text-gray-600">
                        Last updated: {format(new Date(student.resume_last_updated), 'MMMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Upload New Resume
                  </button>
                </div>
              </div>

              {/* Target Industries */}
              {student.target_industries && student.target_industries.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Target Industries</h3>
                  <div className="flex flex-wrap gap-2">
                    {student.target_industries.map((industry, idx) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Activity</h3>
                <p className="text-sm text-gray-600">
                  Last interaction: {student.last_interaction 
                    ? format(new Date(student.last_interaction), 'MMMM d, yyyy h:mm a')
                    : 'No interactions yet'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <NotesSystem studentId={student.id} studentName={`${student.first_name} ${student.last_name}`} />
          )}

          {activeTab === 'schedule' && (
            <div>
              {calendlyUrl ? (
                <>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Schedule a Meeting</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Book a career counseling session with {student.first_name}
                    </p>
                  </div>
                  <CalendlyWidget 
                    url={calendlyUrl}
                    studentName={`${student.first_name} ${student.last_name}`}
                    studentEmail={student.email}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">Calendly integration not configured</p>
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Configure Calendly
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <ApplicationTracker />
          )}
          {activeTab === 'workshops' && (
            <WorkshopTracker />
          )}

          {activeTab === 'documents' && (
            <DocumentManager />
          )}

          {activeTab === 'interviews' && (
            <MockInterviewTracker />
          )}

          {activeTab === 'connections' && (
            <EmployerConnections />
          )}
        </div>
      </div>
    </div>
  );
}
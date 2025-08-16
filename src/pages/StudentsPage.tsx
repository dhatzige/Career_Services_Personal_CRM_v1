import { useState, useEffect } from 'react';
import { Plus, Search, LayoutGrid, List, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StudentCard from '@/components/StudentCard';
import StudentDetailModal from '@/components/StudentDetailModal';
import StudentsEmptyState from '@/components/StudentsEmptyState';
import StudentStatsCards from '@/components/StudentStatsCards';
import { api } from '@/services/apiClient';
import { toast } from 'react-hot-toast';
import type { Student, Note, Consultation } from '@/types';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import StudentTableView from '@/components/StudentTableView';
import StudentTableMobile from '@/components/StudentTableMobile';
import { addToRecentlyViewed } from '@/components/RecentlyViewed';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState<'timeline' | 'info' | 'notes' | 'consultations'>('info');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    // Persist view mode in localStorage
    const savedViewMode = localStorage.getItem('studentViewMode');
    return (savedViewMode === 'table' || savedViewMode === 'grid') ? savedViewMode : 'grid';
  });
  const [studentNotes, setStudentNotes] = useState<Record<string, Note[]>>({});
  const [studentConsultations, setStudentConsultations] = useState<Record<string, Consultation[]>>({});
  const [isMobile, setIsMobile] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24; // 24 for grid (divisible by 1, 2, 3 columns), matches table view
  
  // Filter states with clearer names (empty string shows placeholder)
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterProgram, setFilterProgram] = useState<string>('');
  const [filterJobStatus, setFilterJobStatus] = useState<string>('');
  const [filterActivity, setFilterActivity] = useState<string>(''); // New: recently viewed, has notes, etc.
  const [filterConsultations, setFilterConsultations] = useState<string>(''); // New: has consultations, upcoming, etc.
  const [showFilters, setShowFilters] = useState(false);
  
  // Track recently viewed students (last 10)
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentlyViewedStudents');
    return saved ? JSON.parse(saved) : [];
  });

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('studentViewMode', viewMode);
  }, [viewMode]);

  // Fetch all students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await api.students.list();
      console.log('Fetched students data:', data); // Debug log
      setStudents(data);
      setFilteredStudents(data);
      console.log('Updated students state to:', data.length, 'students'); // Debug log
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Fetch notes for a student
  const fetchStudentNotes = async (studentId: string) => {
    try {
      const notes = await api.notes.list(studentId);
      setStudentNotes(prev => ({ ...prev, [studentId]: notes }));
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  // Fetch consultations for a student
  const fetchStudentConsultations = async (studentId: string) => {
    try {
      const consultations = await api.consultations.listByStudent(studentId);
      setStudentConsultations(prev => ({ ...prev, [studentId]: consultations }));
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchStudents();
  }, []);


  // Don't fetch consultations separately - they're already included in the student data
  // This was causing N+1 query problem and slow loading
  useEffect(() => {
    // Extract consultations from student data if they exist
    const consultationsMap: Record<string, Consultation[]> = {};
    students.forEach(student => {
      if (student.consultations) {
        consultationsMap[student.id] = student.consultations;
      }
    });
    if (Object.keys(consultationsMap).length > 0) {
      setStudentConsultations(consultationsMap);
    }
  }, [students]);

  // Combined filter effect with improved filtering
  useEffect(() => {
    const searchLower = searchTerm.toLowerCase();
    const filtered = students.filter(student => {
      // Search filter - check both snake_case and camelCase
      const firstName = (student.first_name || student.firstName || '').toLowerCase();
      const lastName = (student.last_name || student.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      const email = (student.email || '').toLowerCase();
      const major = (student.major || '').toLowerCase();
      const year = (student.year_of_study || student.yearOfStudy || '').toLowerCase();
      
      const matchesSearch = fullName.includes(searchLower) ||
                          email.includes(searchLower) ||
                          major.includes(searchLower) ||
                          year.includes(searchLower);
      
      // Year of Study filter
      const studentYear = student.year_of_study || student.yearOfStudy;
      const matchesYear = !filterYear || filterYear === 'all' || studentYear === filterYear;
      
      // Program Type filter
      const studentProgram = student.program_type || student.programType;
      const matchesProgram = !filterProgram || filterProgram === 'all' || studentProgram === filterProgram;
      
      // Job Search Status filter
      const studentJobStatus = student.job_search_status || student.jobSearchStatus;
      let matchesJobStatus = true;
      if (filterJobStatus && filterJobStatus !== 'all') {
        if (filterJobStatus === 'active_seekers') {
          // Special filter for active job seekers from stat card
          matchesJobStatus = ['Preparing', 'Actively Searching', 'Searching for Internship', 'Interviewing'].includes(studentJobStatus || '');
        } else if (filterJobStatus === 'employed_offers') {
          // Special filter for employed/offers from stat card
          matchesJobStatus = ['Employed', 'Offer Received', 'Currently Interning'].includes(studentJobStatus || '');
        } else {
          // Normal job status filter
          matchesJobStatus = studentJobStatus === filterJobStatus;
        }
      }
      
      // Activity filter (recently viewed, has notes, etc.)
      let matchesActivity = true;
      if (filterActivity && filterActivity !== 'all') {
        if (filterActivity === 'recently_viewed') {
          matchesActivity = recentlyViewed.includes(student.id);
        } else if (filterActivity === 'has_notes') {
          matchesActivity = student.notes && student.notes.length > 0;
        } else if (filterActivity === 'no_notes') {
          matchesActivity = !student.notes || student.notes.length === 0;
        } else if (filterActivity === 'has_resume') {
          matchesActivity = student.resume_on_file || student.resumeOnFile;
        } else if (filterActivity === 'no_resume') {
          matchesActivity = !(student.resume_on_file || student.resumeOnFile);
        }
      }
      
      // Consultation filter
      let matchesConsultations = true;
      const studentConsults = studentConsultations[student.id] || [];
      if (filterConsultations && filterConsultations !== 'all') {
        if (filterConsultations === 'has_consultations') {
          matchesConsultations = studentConsults.length > 0;
        } else if (filterConsultations === 'no_consultations') {
          matchesConsultations = studentConsults.length === 0;
        } else if (filterConsultations === 'upcoming') {
          matchesConsultations = studentConsults.some(c => {
            const consultDate = c.date || c.scheduled_date || c.consultation_date;
            return consultDate && new Date(consultDate) > new Date() && c.status === 'scheduled';
          });
        } else if (filterConsultations === 'high_no_shows') {
          const noShowCount = student.no_show_count || student.noShowCount || 0;
          matchesConsultations = noShowCount >= 3;
        }
      }
      
      return matchesSearch && matchesYear && matchesProgram && matchesJobStatus && matchesActivity && matchesConsultations;
    });
    setFilteredStudents(filtered);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, students, filterYear, filterProgram, filterJobStatus, filterActivity, filterConsultations, recentlyViewed, studentConsultations]);

  // Handle student creation
  const handleAddStudent = async (studentData: Partial<Student>) => {
    try {
      const newStudent = await api.students.create(studentData);
      // Immediate state update
      setStudents(prev => [...prev, newStudent]);
      setFilteredStudents(prev => [...prev, newStudent]);
      setShowAddModal(false);
      toast.success('Student added successfully');
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to add student');
    }
  };

  // Handle student update
  const handleUpdateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      const updatedStudent = await api.students.update(id, updates);
      // Immediate state updates for both main and filtered lists
      setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
      setFilteredStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
      if (selectedStudent?.id === id) {
        setSelectedStudent(updatedStudent);
      }
      toast.success('Student updated successfully');
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    }
  };

  // Handle student deletion
  const handleDeleteStudent = async (id: string) => {
    try {
      await api.students.delete(id);
      // Immediate state updates for both main and filtered lists
      setStudents(prev => prev.filter(s => s.id !== id));
      setFilteredStudents(prev => prev.filter(s => s.id !== id));
      // Clean up related state
      setStudentNotes(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setStudentConsultations(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      if (selectedStudent?.id === id) {
        setSelectedStudent(null);
      }
      toast.success('Student deleted successfully');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  // Handle opening student detail
  const handleSelectStudent = async (student: Student, tab?: string) => {
    setSelectedStudent(student);
    
    // Track recently viewed students using the RecentlyViewed component's function
    addToRecentlyViewed(student.id);
    
    // Also update local state for compatibility
    const updatedRecentlyViewed = [student.id, ...recentlyViewed.filter(id => id !== student.id)].slice(0, 10);
    setRecentlyViewed(updatedRecentlyViewed);
    
    // Set the tab if explicitly requested
    if (tab) {
      setModalActiveTab(tab as 'timeline' | 'info' | 'notes' | 'consultations');
    }
    
    // If the student already has notes from the backend, use them
    if (student.notes && Array.isArray(student.notes)) {
      setStudentNotes(prev => ({ ...prev, [student.id]: student.notes || [] }));
    } else {
      // Otherwise fetch them
      fetchStudentNotes(student.id);
    }
    
    // If the student already has consultations from the backend, use them
    if (student.consultations && Array.isArray(student.consultations)) {
      setStudentConsultations(prev => ({ ...prev, [student.id]: student.consultations || [] }));
    } else {
      // Otherwise fetch them
      fetchStudentConsultations(student.id);
    }
  };

  // Handle note operations
  const handleAddNote = async (studentId: string, noteData: Partial<Note>) => {
    try {
      const newNote = await api.notes.create(studentId, noteData);
      
      // Immediate state updates
      setStudentNotes(prev => ({
        ...prev,
        [studentId]: [...(prev[studentId] || []), newNote]
      }));
      
      // Update student in main state to include the new note and update lastInteraction
      const currentTime = new Date().toISOString();
      setStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            notes: [...(student.notes || []), newNote],
            lastInteraction: currentTime
          };
        }
        return student;
      }));
      
      setFilteredStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            notes: [...(student.notes || []), newNote],
            lastInteraction: currentTime
          };
        }
        return student;
      }));
      
      toast.success('Note added successfully');
      
      // Keep the modal on notes tab
      setModalActiveTab('notes');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const handleUpdateNote = async (noteId: string, updates: Partial<Note>) => {
    try {
      const updatedNote = await api.notes.update(noteId, updates);
      const studentId = updatedNote.student_id;
      setStudentNotes(prev => ({
        ...prev,
        [studentId]: prev[studentId].map(n => n.id === noteId ? updatedNote : n)
      }));
      toast.success('Note updated successfully');
      
      // Keep the modal on notes tab
      setModalActiveTab('notes');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string, studentId: string) => {
    try {
      await api.notes.delete(noteId);
      
      // Immediate state updates
      setStudentNotes(prev => ({
        ...prev,
        [studentId]: prev[studentId].filter(n => n.id !== noteId)
      }));
      
      // Update student in main state to remove the note
      setStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            notes: student.notes ? student.notes.filter(n => n.id !== noteId) : []
          };
        }
        return student;
      }));
      
      setFilteredStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            notes: student.notes ? student.notes.filter(n => n.id !== noteId) : []
          };
        }
        return student;
      }));
      
      toast.success('Note deleted successfully');
      
      // Keep the modal on notes tab
      setModalActiveTab('notes');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  // Handle consultation operations
  const handleAddConsultation = async (studentId: string, consultationData: Partial<Consultation>) => {
    try {
      const newConsultation = await api.consultations.create(studentId, consultationData);
      
      // Immediately update consultations state
      setStudentConsultations(prev => ({
        ...prev,
        [studentId]: [...(prev[studentId] || []), newConsultation]
      }));
      
      // Immediately update students state to include the new consultation
      setStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            consultations: [...(student.consultations || []), newConsultation],
            lastInteraction: newConsultation.date || new Date().toISOString()
          };
        }
        return student;
      }));
      
      setFilteredStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            consultations: [...(student.consultations || []), newConsultation],
            lastInteraction: newConsultation.date || new Date().toISOString()
          };
        }
        return student;
      }));
      
      toast.success('Consultation scheduled successfully');
      
      // Keep the modal on consultations tab
      setModalActiveTab('consultations');
    } catch (error) {
      console.error('Error adding consultation:', error);
      toast.error('Failed to schedule consultation');
    }
  };

  const handleUpdateConsultation = async (consultationId: string, updates: Partial<Consultation>) => {
    try {
      const updatedConsultation = await api.consultations.update(consultationId, updates);
      // Backend returns studentId (camelCase), not student_id
      const studentId = updatedConsultation.studentId || updatedConsultation.student_id;
      setStudentConsultations(prev => ({
        ...prev,
        [studentId]: prev[studentId] ? 
          prev[studentId].map(c => c.id === consultationId ? updatedConsultation : c) :
          [updatedConsultation]
      }));
      
      // If updating no-show status, refresh student to get updated count
      if (updates.status === 'no-show') {
        const updatedStudent = await api.students.get(studentId);
        setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
        setFilteredStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s));
        if (selectedStudent?.id === studentId) {
          setSelectedStudent(updatedStudent);
        }
      }
      
      toast.success('Consultation updated successfully');
      
      // Keep the modal on consultations tab
      setModalActiveTab('consultations');
    } catch (error) {
      console.error('Error updating consultation:', error);
      toast.error('Failed to update consultation');
    }
  };

  const handleDeleteConsultation = async (consultationId: string, studentId: string) => {
    try {
      await api.consultations.delete(consultationId);
      
      // Immediate state updates - remove consultation from state
      setStudentConsultations(prev => ({
        ...prev,
        [studentId]: prev[studentId] ? prev[studentId].filter(c => c.id !== consultationId) : []
      }));
      
      // Update student in main state to remove the consultation
      setStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            consultations: student.consultations ? 
              student.consultations.filter(c => c.id !== consultationId) : []
          };
        }
        return student;
      }));
      
      setFilteredStudents(prev => prev.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            consultations: student.consultations ? 
              student.consultations.filter(c => c.id !== consultationId) : []
          };
        }
        return student;
      }));
      
      // Update selected student if it's the same one
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(prev => prev ? {
          ...prev,
          consultations: prev.consultations ? 
            prev.consultations.filter(c => c.id !== consultationId) : []
        } : null);
      }
      
      toast.success('Consultation deleted successfully');
      
      // Keep the modal on consultations tab
      setModalActiveTab('consultations');
    } catch (error) {
      console.error('Error deleting consultation:', error);
      toast.error('Failed to delete consultation');
    }
  };

  // Handle stat card clicks to filter students (toggle behavior)
  const handleStatClick = (filterType: string, filterValue: string) => {
    // Check if this filter is currently active
    const isCurrentlyActive = 
      (filterType === 'all' && !filterYear && !filterProgram && !filterJobStatus && !filterActivity && !filterConsultations && !searchTerm) ||
      (filterType === 'jobStatus' && 
        ((filterValue === 'active' && filterJobStatus === 'active_seekers') ||
         (filterValue === 'employed' && filterJobStatus === 'employed_offers'))) ||
      (filterType === 'activity' && filterActivity === filterValue) ||
      (filterType === 'consultations' && filterConsultations === filterValue);
    
    if (isCurrentlyActive) {
      // If clicking the same active filter, clear all filters (toggle off)
      setFilterYear('');
      setFilterProgram('');
      setFilterJobStatus('');
      setFilterActivity('');
      setFilterConsultations('');
      setSearchTerm('');
    } else {
      // Reset all filters first
      setFilterYear('');
      setFilterProgram('');
      setFilterJobStatus('');
      setFilterActivity('');
      setFilterConsultations('');
      setSearchTerm('');
      
      // Apply the specific filter based on stat clicked
      switch(filterType) {
        case 'all':
          // Show all students - filters already reset
          break;
        case 'jobStatus':
          if (filterValue === 'active') {
            // For active job seekers, we'll handle this in the filter effect
            setFilterJobStatus('active_seekers');
          } else if (filterValue === 'employed') {
            // For employed/offers, we'll handle this in the filter effect
            setFilterJobStatus('employed_offers');
          }
          break;
        case 'activity':
          setFilterActivity(filterValue);
          break;
        case 'consultations':
          setFilterConsultations(filterValue);
          break;
      }
    }
    
    // Show filters panel to make it clear what's being filtered
    setShowFilters(true);
    
    // Reset to first page when filtering
    setCurrentPage(1);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Students</h1>
        </div>
        <LoadingSkeleton type="grid" count={6} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Students</h1>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="h-10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {students.length > 0 && (
        <StudentStatsCards 
          students={students} 
          consultations={studentConsultations} 
          onStatClick={handleStatClick}
          activeFilter={(() => {
            // Determine the active filter for visual feedback
            if (filterJobStatus === 'active_seekers') return { type: 'jobStatus', value: 'active_seekers' };
            if (filterJobStatus === 'employed_offers') return { type: 'jobStatus', value: 'employed_offers' };
            if (filterActivity) return { type: 'activity', value: filterActivity };
            if (filterConsultations) return { type: 'consultations', value: filterConsultations };
            if (!filterYear && !filterProgram && !filterJobStatus && !filterActivity && !filterConsultations && !searchTerm) {
              return { type: 'all', value: 'all' };
            }
            return null;
          })()}
        />
      )}

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search students by name, email, major, or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap h-10"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            {!isMobile && (
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`h-8 px-3 rounded-md flex items-center justify-center transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 mr-1.5" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`h-8 px-3 rounded-md flex items-center justify-center transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <List className="h-4 w-4 mr-1.5" />
                  Table
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters - Improved with clearer names and more options */}
        {showFilters && (
          <div className="relative overflow-visible p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Filter students by:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Academic Year Filter */}
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📚 All Academic Years</SelectItem>
                  <SelectItem value="1st year">1st Year</SelectItem>
                  <SelectItem value="2nd year">2nd Year</SelectItem>
                  <SelectItem value="3rd year">3rd Year</SelectItem>
                  <SelectItem value="4th year">4th Year</SelectItem>
                  <SelectItem value="Graduate">Graduate Student</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>

              {/* Degree Program Filter */}
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Degree Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🎓 All Degree Programs</SelectItem>
                  <SelectItem value="Bachelor's">Bachelor's Degree</SelectItem>
                  <SelectItem value="Master's">Master's Degree</SelectItem>
                </SelectContent>
              </Select>

              {/* Career Status Filter */}
              <Select value={filterJobStatus} onValueChange={setFilterJobStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Career Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">💼 All Career Statuses</SelectItem>
                  <SelectItem value="active_seekers">🔍 Active Job Seekers</SelectItem>
                  <SelectItem value="employed_offers">✅ Employed/Offers</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="Preparing">Preparing</SelectItem>
                  <SelectItem value="Actively Searching">Actively Searching</SelectItem>
                  <SelectItem value="Searching for Internship">Searching for Internship</SelectItem>
                  <SelectItem value="Currently Interning">Currently Interning</SelectItem>
                  <SelectItem value="Interviewing">Interviewing</SelectItem>
                  <SelectItem value="Offer Received">Offer Received</SelectItem>
                  <SelectItem value="Employed">Employed</SelectItem>
                  <SelectItem value="Not Seeking">Not Seeking</SelectItem>
                </SelectContent>
              </Select>

              {/* Student Activity Filter */}
              <Select value={filterActivity} onValueChange={setFilterActivity}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Student Activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📊 All Student Activities</SelectItem>
                  <SelectItem value="recently_viewed">Recently Viewed</SelectItem>
                  <SelectItem value="has_notes">Has Notes</SelectItem>
                  <SelectItem value="no_notes">No Notes Yet</SelectItem>
                  <SelectItem value="has_resume">Resume on File</SelectItem>
                  <SelectItem value="no_resume">No Resume</SelectItem>
                </SelectContent>
              </Select>

              {/* Consultation Status Filter */}
              <Select value={filterConsultations} onValueChange={setFilterConsultations}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Consultation Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📅 All Consultation Statuses</SelectItem>
                  <SelectItem value="has_consultations">Had Consultations</SelectItem>
                  <SelectItem value="no_consultations">Never Consulted</SelectItem>
                  <SelectItem value="upcoming">Upcoming Appointments</SelectItem>
                  <SelectItem value="high_no_shows">High No-Shows (3+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Found {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </p>
          {(filterYear || filterProgram || filterJobStatus || filterActivity || filterConsultations) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterYear('');
                setFilterProgram('');
                setFilterJobStatus('');
                setFilterActivity('');
                setFilterConsultations('');
              }}
              className="h-8"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <StudentsEmptyState
          searchTerm={searchTerm}
          hasFilters={!!(filterYear || filterProgram || filterJobStatus || filterActivity || filterConsultations)}
          onAddStudent={() => setShowAddModal(true)}
          onClearFilters={() => {
            setSearchTerm('');
            setFilterYear('');
            setFilterProgram('');
            setFilterJobStatus('');
            setFilterActivity('');
            setFilterConsultations('');
          }}
        />
      ) : (
        <div className="transition-all duration-300 ease-in-out">
          {isMobile ? (
            <StudentTableMobile
              students={filteredStudents}
              onSelectStudent={handleSelectStudent}
            />
          ) : viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {paginatedStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="animate-slideUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <StudentCard
                      student={student}
                      onClick={() => handleSelectStudent(student)}
                    />
                  </div>
                ))}
              </div>
              {/* Pagination controls for grid view */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={i}
                            variant={pageNum === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="animate-fadeIn">
              <StudentTableView
                students={paginatedStudents}
                consultations={studentConsultations}
                onStudentClick={handleSelectStudent}
                currentPage={currentPage}
                totalPages={totalPages}
                totalStudents={filteredStudents.length}
                onPageChange={setCurrentPage}
                onStudentUpdated={handleUpdateStudent}
                onStudentDelete={handleDeleteStudent}
                onUpdateConsultation={handleUpdateConsultation}
              />
            </div>
          )}
        </div>
      )}

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          notes={studentNotes[selectedStudent.id] || []}
          consultations={studentConsultations[selectedStudent.id] || []}
          initialTab={modalActiveTab}
          onClose={() => {
            setSelectedStudent(null);
            setModalActiveTab('info'); // Reset for next time
          }}
          onUpdate={(updates) => handleUpdateStudent(selectedStudent.id, updates)}
          onDelete={() => handleDeleteStudent(selectedStudent.id)}
          onAddNote={(noteData) => handleAddNote(selectedStudent.id, noteData)}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={(noteId) => handleDeleteNote(noteId, selectedStudent.id)}
          onAddConsultation={(data) => handleAddConsultation(selectedStudent.id, data)}
          onUpdateConsultation={handleUpdateConsultation}
          onDeleteConsultation={(id) => handleDeleteConsultation(id, selectedStudent.id)}
        />
      )}

      {showAddModal && (
        <StudentDetailModal
          onClose={() => setShowAddModal(false)}
          onUpdate={handleAddStudent}
          notes={[]}
          consultations={[]}
        />
      )}
    </div>
  );
}
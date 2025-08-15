import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Tag,
  Download,
  Upload,
  Edit3,
  Trash2,
  Save,
  X,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../services/apiClient';

interface Note {
  id: string;
  student_id: string;
  content: string;
  type: string;
  date_created: string;
  is_private: boolean;
  tags?: string[];
  updated_at: string;
}

interface NotesSystemProps {
  studentId: string;
  studentName: string;
}

export default function NotesSystem({ studentId, studentName }: NotesSystemProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({
    content: '',
    type: 'General',
    is_private: false,
    tags: [] as string[]
  });

  const noteTypes = [
    'All',
    'General', 
    'Academic', 
    'Personal', 
    'Follow-up', 
    'Alert',
    'Career Planning',
    'Interview Prep',
    'Application Status',
    'Meeting Notes'
  ];

  const noteTemplates = {
    'Career Planning': `**Career Goals:**
- Short-term (6 months):
- Long-term (2-5 years):

**Target Industries:**
- 

**Skills to Develop:**
- 

**Action Items:**
- [ ] 
- [ ] `,
    
    'Interview Prep': `**Company:** 
**Position:** 
**Interview Date:** 

**Research Notes:**
- Company culture:
- Recent news:
- Key products/services:

**Questions to Ask:**
1. 
2. 

**STAR Stories Prepared:**
- Situation:
- Task:
- Action:
- Result:`,
    
    'Meeting Notes': `**Date:** ${format(new Date(), 'yyyy-MM-dd')}
**Attendees:** ${studentName}, 

**Topics Discussed:**
- 

**Action Items:**
- [ ] 
- [ ] 

**Follow-up Required:** Yes/No
**Next Meeting:** `
  };

  useEffect(() => {
    fetchNotes();
  }, [studentId]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchTerm, selectedType]);

  const fetchNotes = async () => {
    try {
      const response = await api.get(`/notes/student/${studentId}`);
      setNotes(response.data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const filterNotes = () => {
    let filtered = notes;

    if (selectedType !== 'All') {
      filtered = filtered.filter(note => note.type === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(note => 
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredNotes(filtered);
  };

  const handleAddNote = async () => {
    try {
      await api.post(`/notes/student/${studentId}`, newNote);
      await fetchNotes();
      setIsAddingNote(false);
      setNewNote({ content: '', type: 'General', is_private: false, tags: [] });
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleUpdateNote = async (noteId: string, updatedContent: string) => {
    try {
      await api.put(`/notes/${noteId}`, { content: updatedContent });
      await fetchNotes();
      setEditingNoteId(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await api.notes.delete(noteId);
      await fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const applyTemplate = (templateKey: string) => {
    const template = noteTemplates[templateKey as keyof typeof noteTemplates];
    if (template) {
      setNewNote({ ...newNote, content: template, type: templateKey });
    }
  };

  const exportNotes = () => {
    const dataStr = JSON.stringify(filteredNotes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${studentName.replace(/\s+/g, '_')}_notes_${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getNoteTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'General': 'bg-gray-100 text-gray-800',
      'Academic': 'bg-blue-100 text-blue-800',
      'Personal': 'bg-purple-100 text-purple-800',
      'Follow-up': 'bg-yellow-100 text-yellow-800',
      'Alert': 'bg-red-100 text-red-800',
      'Career Planning': 'bg-green-100 text-green-800',
      'Interview Prep': 'bg-indigo-100 text-indigo-800',
      'Application Status': 'bg-orange-100 text-orange-800',
      'Meeting Notes': 'bg-teal-100 text-teal-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Notes & Documentation
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={exportNotes}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsAddingNote(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            {noteTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Quick stats */}
        <div className="flex space-x-4 text-sm text-gray-600">
          <span>Total notes: {notes.length}</span>
          <span>Filtered: {filteredNotes.length}</span>
          <span>Last updated: {notes.length > 0 ? format(new Date(Math.max(...notes.map(n => new Date(n.updated_at).getTime()))), 'MMM d, yyyy') : 'N/A'}</span>
        </div>
      </div>

      {/* Add Note Form */}
      {isAddingNote && (
        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-gray-900">New Note</h4>
            <button
              onClick={() => setIsAddingNote(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex space-x-2">
              <select
                value={newNote.type}
                onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {noteTypes.slice(1).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              
              {Object.keys(noteTemplates).includes(newNote.type) && (
                <button
                  onClick={() => applyTemplate(newNote.type)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Use Template
                </button>
              )}
            </div>

            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              placeholder="Enter note content... (Markdown supported)"
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newNote.is_private}
                  onChange={(e) => setNewNote({ ...newNote, is_private: e.target.checked })}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">Private note</span>
              </label>

              <button
                onClick={handleAddNote}
                disabled={!newNote.content.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || selectedType !== 'All' 
              ? 'No notes found matching your filters.'
              : 'No notes yet. Click "Add Note" to create one.'}
          </div>
        ) : (
          filteredNotes.map(note => (
            <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getNoteTypeColor(note.type)}`}>
                    {note.type}
                  </span>
                  {note.is_private && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      Private
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {format(new Date(note.date_created), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingNoteId(note.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editingNoteId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    defaultValue={note.content}
                    onBlur={(e) => handleUpdateNote(note.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setEditingNoteId(null);
                    }}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {note.content}
                  </div>
                </div>
              )}

              {note.tags && note.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {note.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
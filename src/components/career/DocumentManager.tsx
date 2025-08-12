import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, FileText, Upload, Download, Calendar, Edit2, Trash2, Eye, Check, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../ui/toast';

interface CareerDocument {
  id: string;
  student_id: string;
  document_type: 'resume' | 'cover_letter' | 'portfolio' | 'transcript' | 'reference' | 'certificate' | 'other';
  document_name: string;
  version: string;
  file_path?: string;
  file_size?: number;
  upload_date: string;
  last_updated: string;
  is_active: boolean;
  target_role?: string;
  notes?: string;
  review_status: 'pending' | 'reviewed' | 'approved';
  reviewer_feedback?: string;
  created_at?: string;
}

const documentTypeIcons: Record<string, string> = {
  'resume': '📄',
  'cover_letter': '📝',
  'portfolio': '📁',
  'transcript': '🎓',
  'reference': '👤',
  'certificate': '🏆',
  'other': '📎'
};

const reviewStatusColors: Record<string, string> = {
  'pending': 'bg-yellow-500',
  'reviewed': 'bg-blue-500',
  'approved': 'bg-green-500'
};

export function DocumentManager() {
  const { studentId } = useParams();
  const [documents, setDocuments] = useState<CareerDocument[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    document_type: 'resume' as CareerDocument['document_type'],
    document_name: '',
    version: '1.0',
    is_active: true,
    target_role: '',
    notes: '',
    review_status: 'pending' as CareerDocument['review_status'],
    reviewer_feedback: ''
  });

  useEffect(() => {
    if (studentId) {
      fetchDocuments();
    }
  }, [studentId]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/career/documents/student/${studentId}`);
      setDocuments(response.data.data);
      
      // Calculate stats
      const typeCount = response.data.data.reduce((acc: Record<string, number>, doc: CareerDocument) => {
        acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
        return acc;
      }, {});
      
      setStats({
        total: response.data.data.length,
        active: response.data.data.filter((d: CareerDocument) => d.is_active).length,
        approved: response.data.data.filter((d: CareerDocument) => d.review_status === 'approved').length,
        pending: response.data.data.filter((d: CareerDocument) => d.review_status === 'pending').length,
        resumes: typeCount.resume || 0,
        coverLetters: typeCount.cover_letter || 0
      });
    } catch (error) {
      toast.error('Failed to fetch documents');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });
      formDataToSend.append('student_id', studentId || '');
      
      // Add file if selected
      if (selectedFile && !editingId) {
        formDataToSend.append('file', selectedFile);
      }

      if (editingId) {
        await api.put(`/career/documents/${editingId}`, formData);
        toast.success('Document updated successfully');
      } else {
        await api.post('/career/documents', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Document uploaded successfully');
      }

      fetchDocuments();
      resetForm();
    } catch (error) {
      toast.error('Failed to save document');
    }
  };

  const handleEdit = (doc: CareerDocument) => {
    setFormData({
      document_type: doc.document_type,
      document_name: doc.document_name,
      version: doc.version,
      is_active: doc.is_active,
      target_role: doc.target_role || '',
      notes: doc.notes || '',
      review_status: doc.review_status,
      reviewer_feedback: doc.reviewer_feedback || ''
    });
    setEditingId(doc.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await api.delete(`/career/documents/${id}`);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async (doc: CareerDocument) => {
    try {
      const response = await api.get(`/career/documents/${doc.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.document_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill document name if empty
      if (!formData.document_name) {
        setFormData({ ...formData, document_name: file.name });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      document_type: 'resume',
      document_name: '',
      version: '1.0',
      is_active: true,
      target_role: '',
      notes: '',
      review_status: 'pending',
      reviewer_feedback: ''
    });
    setSelectedFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getActiveDocuments = (type: string) => {
    return documents.filter(d => d.document_type === type && d.is_active);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Documents</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-gray-500">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-500">Approved</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-500">Pending Review</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.resumes}</div>
              <div className="text-sm text-gray-500">Resumes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.coverLetters}</div>
              <div className="text-sm text-gray-500">Cover Letters</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Documents Alert */}
      {getActiveDocuments('resume').length === 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">No active resume found. Please upload a current resume.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Career Documents
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </CardHeader>
      </Card>

      {/* Form */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Document Type</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(value) => setFormData({ ...formData, document_type: value as CareerDocument['document_type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resume">Resume</SelectItem>
                      <SelectItem value="cover_letter">Cover Letter</SelectItem>
                      <SelectItem value="portfolio">Portfolio</SelectItem>
                      <SelectItem value="transcript">Transcript</SelectItem>
                      <SelectItem value="reference">Reference Letter</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Document Name</Label>
                  <Input
                    value={formData.document_name}
                    onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
                    placeholder="e.g., Resume_SoftwareEngineer_v2"
                    required
                  />
                </div>
              </div>

              {!editingId && (
                <div>
                  <Label>Upload File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.rtf"
                      required={!editingId}
                    />
                    {selectedFile && (
                      <Badge variant="outline">
                        {formatFileSize(selectedFile.size)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Accepted formats: PDF, DOC, DOCX, TXT, RTF (Max 10MB)
                  </p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Version</Label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="e.g., 1.0, 2.1"
                    required
                  />
                </div>
                <div>
                  <Label>Target Role/Purpose</Label>
                  <Input
                    value={formData.target_role}
                    onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Set as Active</span>
                  </label>
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Any specific notes about this document..."
                />
              </div>

              {editingId && (
                <>
                  <div>
                    <Label>Review Status</Label>
                    <Select
                      value={formData.review_status}
                      onValueChange={(value) => setFormData({ ...formData, review_status: value as CareerDocument['review_status'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending Review</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Reviewer Feedback</Label>
                    <Textarea
                      value={formData.reviewer_feedback}
                      onChange={(e) => setFormData({ ...formData, reviewer_feedback: e.target.value })}
                      rows={2}
                      placeholder="Feedback from career advisor..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update' : 'Upload'} Document
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.id} className={!doc.is_active ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{documentTypeIcons[doc.document_type]}</span>
                    <h3 className="text-lg font-semibold">{doc.document_name}</h3>
                    <Badge className={reviewStatusColors[doc.review_status]}>
                      {doc.review_status}
                    </Badge>
                    {doc.is_active && (
                      <Badge className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                    <Badge variant="outline">v{doc.version}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Upload className="h-4 w-4" />
                      Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Updated: {new Date(doc.last_updated).toLocaleDateString()}
                    </div>
                    {doc.file_size && (
                      <div>Size: {formatFileSize(doc.file_size)}</div>
                    )}
                    {doc.target_role && (
                      <div>Target: {doc.target_role}</div>
                    )}
                  </div>

                  {doc.notes && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Notes: </span>
                      <span className="text-sm text-gray-600">{doc.notes}</span>
                    </div>
                  )}

                  {doc.reviewer_feedback && (
                    <div className="p-2 bg-blue-50 rounded-md">
                      <span className="text-sm font-medium text-blue-800">Reviewer Feedback: </span>
                      <span className="text-sm text-blue-700">{doc.reviewer_feedback}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(doc)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
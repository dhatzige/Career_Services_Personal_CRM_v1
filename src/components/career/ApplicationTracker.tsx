import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Briefcase, Calendar, MapPin, DollarSign, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../ui/toast';

interface Application {
  id: string;
  student_id: string;
  type: 'Internship' | 'Full-time' | 'Part-time' | 'Co-op' | 'Fellowship';
  company_name: string;
  position_title: string;
  application_date: string;
  status: string;
  salary_range?: string;
  location?: string;
  job_description?: string;
  notes?: string;
  response_date?: string;
  interview_dates?: string;
  offer_deadline?: string;
}

const statusColors: Record<string, string> = {
  'Planning': 'bg-gray-500',
  'Applied': 'bg-blue-500',
  'Phone Screen': 'bg-purple-500',
  'Interview Scheduled': 'bg-indigo-500',
  'Interviewed': 'bg-yellow-500',
  'Offer': 'bg-green-500',
  'Rejected': 'bg-red-500',
  'Accepted': 'bg-emerald-500',
  'Declined': 'bg-orange-500'
};

export function ApplicationTracker() {
  const { studentId } = useParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: 'Internship' as Application['type'],
    company_name: '',
    position_title: '',
    application_date: new Date().toISOString().split('T')[0],
    status: 'Planning',
    salary_range: '',
    location: '',
    job_description: '',
    notes: '',
    response_date: '',
    interview_dates: '',
    offer_deadline: ''
  });

  useEffect(() => {
    if (studentId) {
      fetchApplications();
    }
  }, [studentId]);

  const fetchApplications = async () => {
    try {
      const response = await api.get(`/career/applications/student/${studentId}`);
      setApplications(response.data.data);
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Failed to fetch applications');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        student_id: studentId,
        response_date: formData.response_date || undefined,
        interview_dates: formData.interview_dates || undefined,
        offer_deadline: formData.offer_deadline || undefined
      };

      if (editingId) {
        await api.put(`/career/applications/${editingId}`, data);
        toast.success('Application updated successfully');
      } else {
        await api.post('/career/applications', data);
        toast.success('Application created successfully');
      }

      fetchApplications();
      resetForm();
    } catch (error) {
      toast.error('Failed to save application');
    }
  };

  const handleEdit = (app: Application) => {
    setFormData({
      type: app.type,
      company_name: app.company_name,
      position_title: app.position_title,
      application_date: app.application_date.split('T')[0],
      status: app.status,
      salary_range: app.salary_range || '',
      location: app.location || '',
      job_description: app.job_description || '',
      notes: app.notes || '',
      response_date: app.response_date?.split('T')[0] || '',
      interview_dates: app.interview_dates || '',
      offer_deadline: app.offer_deadline?.split('T')[0] || ''
    });
    setEditingId(app.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await api.delete(`/career/applications/${id}`);
      toast.success('Application deleted successfully');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to delete application');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'Internship',
      company_name: '',
      position_title: '',
      application_date: new Date().toISOString().split('T')[0],
      status: 'Planning',
      salary_range: '',
      location: '',
      job_description: '',
      notes: '',
      response_date: '',
      interview_dates: '',
      offer_deadline: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.applied}</div>
              <div className="text-sm text-gray-500">Applied</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.interviewing}</div>
              <div className="text-sm text-gray-500">Interviewing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.offers}</div>
              <div className="text-sm text-gray-500">Offers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.accepted}</div>
              <div className="text-sm text-gray-500">Accepted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-gray-500">Rejected</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Applications
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Application
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
                  <Label>Company Name</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Position Title</Label>
                  <Input
                    value={formData.position_title}
                    onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Application['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Co-op">Co-op</SelectItem>
                      <SelectItem value="Fellowship">Fellowship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Application Date</Label>
                  <Input
                    type="date"
                    value={formData.application_date}
                    onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Phone Screen">Phone Screen</SelectItem>
                      <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                      <SelectItem value="Interviewed">Interviewed</SelectItem>
                      <SelectItem value="Offer">Offer</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., New York, NY"
                  />
                </div>
                <div>
                  <Label>Salary Range</Label>
                  <Input
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    placeholder="e.g., $70,000 - $90,000"
                  />
                </div>
                <div>
                  <Label>Response Date</Label>
                  <Input
                    type="date"
                    value={formData.response_date}
                    onChange={(e) => setFormData({ ...formData, response_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Interview Dates</Label>
                <Input
                  value={formData.interview_dates}
                  onChange={(e) => setFormData({ ...formData, interview_dates: e.target.value })}
                  placeholder="e.g., Phone: 3/15, Technical: 3/22"
                />
              </div>

              {formData.status === 'Offer' && (
                <div>
                  <Label>Offer Deadline</Label>
                  <Input
                    type="date"
                    value={formData.offer_deadline}
                    onChange={(e) => setFormData({ ...formData, offer_deadline: e.target.value })}
                  />
                </div>
              )}

              <div>
                <Label>Job Description</Label>
                <Textarea
                  value={formData.job_description}
                  onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'} Application
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{app.position_title}</h3>
                    <Badge className={statusColors[app.status]}>
                      {app.status}
                    </Badge>
                    <Badge variant="outline">{app.type}</Badge>
                  </div>
                  
                  <div className="text-lg font-medium mb-2">{app.company_name}</div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Applied: {new Date(app.application_date).toLocaleDateString()}
                    </div>
                    {app.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {app.location}
                      </div>
                    )}
                    {app.salary_range && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {app.salary_range}
                      </div>
                    )}
                    {app.interview_dates && (
                      <div>Interviews: {app.interview_dates}</div>
                    )}
                  </div>

                  {app.notes && (
                    <p className="text-sm text-gray-600">{app.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(app)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(app.id)}
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
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Users, Calendar, Clock, MapPin, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../ui/toast';

interface Workshop {
  id: string;
  student_id: string;
  workshop_name: string;
  workshop_date: string;
  duration_hours: number;
  presenter: string;
  location?: string;
  attendance_status: 'registered' | 'attended' | 'no-show' | 'cancelled';
  skills_covered?: string;
  feedback?: string;
  certificate_received: boolean;
  follow_up_actions?: string;
  created_at?: string;
}

const attendanceStatusColors: Record<string, string> = {
  'registered': 'bg-blue-500',
  'attended': 'bg-green-500',
  'no-show': 'bg-red-500',
  'cancelled': 'bg-gray-500'
};

export function WorkshopTracker() {
  const { studentId } = useParams();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    workshop_name: '',
    workshop_date: new Date().toISOString().split('T')[0],
    duration_hours: 1,
    presenter: '',
    location: '',
    attendance_status: 'registered' as Workshop['attendance_status'],
    skills_covered: '',
    feedback: '',
    certificate_received: false,
    follow_up_actions: ''
  });

  useEffect(() => {
    if (studentId) {
      fetchWorkshops();
    }
  }, [studentId]);

  const fetchWorkshops = async () => {
    try {
      const response = await api.get(`/career/workshops/student/${studentId}`);
      setWorkshops(response.data.data);
      
      // Calculate stats
      const attended = response.data.data.filter((w: Workshop) => w.attendance_status === 'attended').length;
      const totalHours = response.data.data
        .filter((w: Workshop) => w.attendance_status === 'attended')
        .reduce((sum: number, w: Workshop) => sum + w.duration_hours, 0);
      const certificates = response.data.data.filter((w: Workshop) => w.certificate_received).length;
      
      setStats({
        total: response.data.data.length,
        attended,
        totalHours,
        certificates,
        noShow: response.data.data.filter((w: Workshop) => w.attendance_status === 'no-show').length
      });
    } catch (error) {
      toast.error('Failed to fetch workshops');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        student_id: studentId,
        duration_hours: Number(formData.duration_hours)
      };

      if (editingId) {
        await api.put(`/career/workshops/${editingId}`, data);
        toast.success('Workshop updated successfully');
      } else {
        await api.post('/career/workshops', data);
        toast.success('Workshop registered successfully');
      }

      fetchWorkshops();
      resetForm();
    } catch (error) {
      toast.error('Failed to save workshop');
    }
  };

  const handleEdit = (workshop: Workshop) => {
    setFormData({
      workshop_name: workshop.workshop_name,
      workshop_date: workshop.workshop_date.split('T')[0],
      duration_hours: workshop.duration_hours,
      presenter: workshop.presenter,
      location: workshop.location || '',
      attendance_status: workshop.attendance_status,
      skills_covered: workshop.skills_covered || '',
      feedback: workshop.feedback || '',
      certificate_received: workshop.certificate_received,
      follow_up_actions: workshop.follow_up_actions || ''
    });
    setEditingId(workshop.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workshop record?')) return;
    
    try {
      await api.delete(`/career/workshops/${id}`);
      toast.success('Workshop record deleted successfully');
      fetchWorkshops();
    } catch (error) {
      toast.error('Failed to delete workshop');
    }
  };

  const resetForm = () => {
    setFormData({
      workshop_name: '',
      workshop_date: new Date().toISOString().split('T')[0],
      duration_hours: 1,
      presenter: '',
      location: '',
      attendance_status: 'registered',
      skills_covered: '',
      feedback: '',
      certificate_received: false,
      follow_up_actions: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getUpcomingWorkshops = () => {
    const today = new Date().toISOString().split('T')[0];
    return workshops.filter(w => w.workshop_date >= today && w.attendance_status === 'registered');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Workshops</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.attended}</div>
              <div className="text-sm text-gray-500">Attended</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalHours}h</div>
              <div className="text-sm text-gray-500">Total Hours</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.certificates}</div>
              <div className="text-sm text-gray-500">Certificates</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.noShow}</div>
              <div className="text-sm text-gray-500">No Shows</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Workshops Alert */}
      {getUpcomingWorkshops().length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Upcoming Workshops:</span>
              {getUpcomingWorkshops().map((w, i) => (
                <span key={w.id}>
                  {i > 0 && ', '}
                  {w.workshop_name} on {new Date(w.workshop_date).toLocaleDateString()}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Workshop Attendance
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Register Workshop
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
                  <Label>Workshop Name</Label>
                  <Input
                    value={formData.workshop_name}
                    onChange={(e) => setFormData({ ...formData, workshop_name: e.target.value })}
                    placeholder="e.g., Resume Writing Workshop"
                    required
                  />
                </div>
                <div>
                  <Label>Presenter/Facilitator</Label>
                  <Input
                    value={formData.presenter}
                    onChange={(e) => setFormData({ ...formData, presenter: e.target.value })}
                    placeholder="e.g., Jane Smith"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.workshop_date}
                    onChange={(e) => setFormData({ ...formData, workshop_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Duration (hours)</Label>
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Room 201 or Virtual"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Attendance Status</Label>
                  <Select
                    value={formData.attendance_status}
                    onValueChange={(value) => setFormData({ ...formData, attendance_status: value as Workshop['attendance_status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="attended">Attended</SelectItem>
                      <SelectItem value="no-show">No Show</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.certificate_received}
                      onChange={(e) => setFormData({ ...formData, certificate_received: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Certificate Received</span>
                  </label>
                </div>
              </div>

              <div>
                <Label>Skills Covered</Label>
                <Input
                  value={formData.skills_covered}
                  onChange={(e) => setFormData({ ...formData, skills_covered: e.target.value })}
                  placeholder="e.g., Resume writing, Interview skills, Networking"
                />
              </div>

              <div>
                <Label>Feedback/Notes</Label>
                <Textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  rows={3}
                  placeholder="Key takeaways, feedback about the workshop..."
                />
              </div>

              <div>
                <Label>Follow-up Actions</Label>
                <Textarea
                  value={formData.follow_up_actions}
                  onChange={(e) => setFormData({ ...formData, follow_up_actions: e.target.value })}
                  rows={2}
                  placeholder="e.g., Update resume by Friday, Schedule mock interview"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update' : 'Register'} Workshop
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Workshops List */}
      <div className="space-y-4">
        {workshops.map((workshop) => (
          <Card key={workshop.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{workshop.workshop_name}</h3>
                    <Badge className={attendanceStatusColors[workshop.attendance_status]}>
                      {workshop.attendance_status}
                    </Badge>
                    {workshop.certificate_received && (
                      <Badge className="bg-purple-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Certificate
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    Presented by: {workshop.presenter}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(workshop.workshop_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {workshop.duration_hours} hours
                    </div>
                    {workshop.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {workshop.location}
                      </div>
                    )}
                  </div>

                  {workshop.skills_covered && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Skills: </span>
                      <span className="text-sm text-gray-600">{workshop.skills_covered}</span>
                    </div>
                  )}

                  {workshop.feedback && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Feedback: </span>
                      <span className="text-sm text-gray-600">{workshop.feedback}</span>
                    </div>
                  )}

                  {workshop.follow_up_actions && (
                    <div className="bg-yellow-50 p-2 rounded-md">
                      <span className="text-sm font-medium text-yellow-800">Follow-up: </span>
                      <span className="text-sm text-yellow-700">{workshop.follow_up_actions}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(workshop)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(workshop.id)}
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
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Video, Calendar, Clock, User, Star, Edit2, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../ui/toast';

interface MockInterview {
  id: string;
  student_id: string;
  interview_date: string;
  interview_type: 'behavioral' | 'technical' | 'case' | 'panel' | 'phone' | 'video';
  interviewer_name: string;
  position_type: string;
  company_industry?: string;
  duration_minutes: number;
  overall_rating: number;
  strengths?: string;
  areas_for_improvement?: string;
  questions_asked?: string;
  student_reflection?: string;
  action_items?: string;
  recording_link?: string;
  created_at?: string;
}

const interviewTypeColors: Record<string, string> = {
  'behavioral': 'bg-blue-500',
  'technical': 'bg-purple-500',
  'case': 'bg-indigo-500',
  'panel': 'bg-pink-500',
  'phone': 'bg-green-500',
  'video': 'bg-yellow-500'
};

export function MockInterviewTracker() {
  const { studentId } = useParams();
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    interview_date: new Date().toISOString().split('T')[0],
    interview_type: 'behavioral' as MockInterview['interview_type'],
    interviewer_name: '',
    position_type: '',
    company_industry: '',
    duration_minutes: 30,
    overall_rating: 3,
    strengths: '',
    areas_for_improvement: '',
    questions_asked: '',
    student_reflection: '',
    action_items: '',
    recording_link: ''
  });

  useEffect(() => {
    if (studentId) {
      fetchInterviews();
    }
  }, [studentId]);

  const fetchInterviews = async () => {
    try {
      const response = await api.get(`/career/mock-interviews/student/${studentId}`);
      setInterviews(response.data.data);
      
      // Calculate stats
      const avgRating = response.data.data.length > 0
        ? response.data.data.reduce((sum: number, i: MockInterview) => sum + i.overall_rating, 0) / response.data.data.length
        : 0;
      
      const totalHours = response.data.data.reduce((sum: number, i: MockInterview) => sum + i.duration_minutes, 0) / 60;
      
      const typeCount = response.data.data.reduce((acc: Record<string, number>, i: MockInterview) => {
        acc[i.interview_type] = (acc[i.interview_type] || 0) + 1;
        return acc;
      }, {});
      
      setStats({
        total: response.data.data.length,
        avgRating: avgRating.toFixed(1),
        totalHours: totalHours.toFixed(1),
        mostPracticed: Object.entries(typeCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A',
        recentImprovement: calculateImprovement(response.data.data)
      });
    } catch (error) {
      toast.error('Failed to fetch mock interviews');
    }
  };

  const calculateImprovement = (interviews: MockInterview[]) => {
    if (interviews.length < 2) return 0;
    const sorted = [...interviews].sort((a, b) => 
      new Date(b.interview_date).getTime() - new Date(a.interview_date).getTime()
    );
    const recent = sorted.slice(0, 3).reduce((sum, i) => sum + i.overall_rating, 0) / Math.min(3, sorted.length);
    const older = sorted.slice(-3).reduce((sum, i) => sum + i.overall_rating, 0) / Math.min(3, sorted.length);
    return ((recent - older) / older * 100).toFixed(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        student_id: studentId,
        duration_minutes: Number(formData.duration_minutes),
        overall_rating: Number(formData.overall_rating)
      };

      if (editingId) {
        await api.put(`/career/mock-interviews/${editingId}`, data);
        toast.success('Mock interview updated successfully');
      } else {
        await api.post('/career/mock-interviews', data);
        toast.success('Mock interview recorded successfully');
      }

      fetchInterviews();
      resetForm();
    } catch (error) {
      toast.error('Failed to save mock interview');
    }
  };

  const handleEdit = (interview: MockInterview) => {
    setFormData({
      interview_date: interview.interview_date.split('T')[0],
      interview_type: interview.interview_type,
      interviewer_name: interview.interviewer_name,
      position_type: interview.position_type,
      company_industry: interview.company_industry || '',
      duration_minutes: interview.duration_minutes,
      overall_rating: interview.overall_rating,
      strengths: interview.strengths || '',
      areas_for_improvement: interview.areas_for_improvement || '',
      questions_asked: interview.questions_asked || '',
      student_reflection: interview.student_reflection || '',
      action_items: interview.action_items || '',
      recording_link: interview.recording_link || ''
    });
    setEditingId(interview.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mock interview record?')) return;
    
    try {
      await api.delete(`/career/mock-interviews/${id}`);
      toast.success('Mock interview deleted successfully');
      fetchInterviews();
    } catch (error) {
      toast.error('Failed to delete mock interview');
    }
  };

  const resetForm = () => {
    setFormData({
      interview_date: new Date().toISOString().split('T')[0],
      interview_type: 'behavioral',
      interviewer_name: '',
      position_type: '',
      company_industry: '',
      duration_minutes: 30,
      overall_rating: 3,
      strengths: '',
      areas_for_improvement: '',
      questions_asked: '',
      student_reflection: '',
      action_items: '',
      recording_link: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Interviews</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-1">
                <div className="text-2xl font-bold text-yellow-600">{stats.avgRating}</div>
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="text-sm text-gray-500">Avg Rating</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalHours}h</div>
              <div className="text-sm text-gray-500">Practice Hours</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.mostPracticed}</div>
              <div className="text-sm text-gray-500">Most Practiced</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold flex items-center gap-1 ${Number(stats.recentImprovement) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.recentImprovement > 0 && '+'}
                {stats.recentImprovement}%
                <TrendingUp className={`h-5 w-5 ${Number(stats.recentImprovement) < 0 ? 'rotate-180' : ''}`} />
              </div>
              <div className="text-sm text-gray-500">Recent Progress</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Mock Interview Practice
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Interview
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
                  <Label>Interview Date</Label>
                  <Input
                    type="date"
                    value={formData.interview_date}
                    onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Interview Type</Label>
                  <Select
                    value={formData.interview_type}
                    onValueChange={(value) => setFormData({ ...formData, interview_type: value as MockInterview['interview_type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="case">Case Study</SelectItem>
                      <SelectItem value="panel">Panel</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Interviewer Name</Label>
                  <Input
                    value={formData.interviewer_name}
                    onChange={(e) => setFormData({ ...formData, interviewer_name: e.target.value })}
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>
                <div>
                  <Label>Position Type</Label>
                  <Input
                    value={formData.position_type}
                    onChange={(e) => setFormData({ ...formData, position_type: e.target.value })}
                    placeholder="e.g., Software Engineer"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Company/Industry</Label>
                  <Input
                    value={formData.company_industry}
                    onChange={(e) => setFormData({ ...formData, company_industry: e.target.value })}
                    placeholder="e.g., Tech/Finance"
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Overall Rating (1-5)</Label>
                  <Select
                    value={formData.overall_rating.toString()}
                    onValueChange={(value) => setFormData({ ...formData, overall_rating: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Needs Work</SelectItem>
                      <SelectItem value="2">2 - Below Average</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Key Strengths Demonstrated</Label>
                <Textarea
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  rows={2}
                  placeholder="What went well during the interview..."
                />
              </div>

              <div>
                <Label>Areas for Improvement</Label>
                <Textarea
                  value={formData.areas_for_improvement}
                  onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                  rows={2}
                  placeholder="What could be improved..."
                />
              </div>

              <div>
                <Label>Questions Asked</Label>
                <Textarea
                  value={formData.questions_asked}
                  onChange={(e) => setFormData({ ...formData, questions_asked: e.target.value })}
                  rows={3}
                  placeholder="List the main questions that were asked..."
                />
              </div>

              <div>
                <Label>Student Reflection</Label>
                <Textarea
                  value={formData.student_reflection}
                  onChange={(e) => setFormData({ ...formData, student_reflection: e.target.value })}
                  rows={2}
                  placeholder="How the student felt about their performance..."
                />
              </div>

              <div>
                <Label>Action Items / Next Steps</Label>
                <Textarea
                  value={formData.action_items}
                  onChange={(e) => setFormData({ ...formData, action_items: e.target.value })}
                  rows={2}
                  placeholder="Specific things to work on before the next interview..."
                />
              </div>

              <div>
                <Label>Recording Link (Optional)</Label>
                <Input
                  type="url"
                  value={formData.recording_link}
                  onChange={(e) => setFormData({ ...formData, recording_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update' : 'Save'} Interview
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Interviews List */}
      <div className="space-y-4">
        {interviews.map((interview) => (
          <Card key={interview.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{interview.position_type}</h3>
                    <Badge className={interviewTypeColors[interview.interview_type]}>
                      {interview.interview_type}
                    </Badge>
                    <div className="flex items-center">
                      {renderStars(interview.overall_rating)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(interview.interview_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {interview.interviewer_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {interview.duration_minutes} minutes
                    </div>
                    {interview.company_industry && (
                      <div>{interview.company_industry}</div>
                    )}
                  </div>

                  {interview.strengths && (
                    <div className="mb-2 p-2 bg-green-50 rounded-md">
                      <span className="text-sm font-medium text-green-800">Strengths: </span>
                      <span className="text-sm text-green-700">{interview.strengths}</span>
                    </div>
                  )}

                  {interview.areas_for_improvement && (
                    <div className="mb-2 p-2 bg-yellow-50 rounded-md">
                      <span className="text-sm font-medium text-yellow-800">Areas to Improve: </span>
                      <span className="text-sm text-yellow-700">{interview.areas_for_improvement}</span>
                    </div>
                  )}

                  {interview.action_items && (
                    <div className="p-2 bg-blue-50 rounded-md flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <span className="text-sm font-medium text-blue-800">Action Items: </span>
                        <span className="text-sm text-blue-700">{interview.action_items}</span>
                      </div>
                    </div>
                  )}

                  {interview.recording_link && (
                    <div className="mt-2">
                      <a 
                        href={interview.recording_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Recording
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(interview)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(interview.id)}
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
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Building2, Calendar, User, Mail, Phone, Linkedin, Globe, Edit2, Trash2, Star, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../ui/toast';

interface EmployerConnection {
  id: string;
  student_id: string;
  company_name: string;
  contact_name: string;
  contact_title: string;
  contact_email?: string;
  contact_phone?: string;
  contact_linkedin?: string;
  connection_type: 'recruiter' | 'hiring_manager' | 'employee' | 'alumni' | 'career_fair' | 'other';
  connection_date: string;
  connection_context?: string;
  interaction_notes?: string;
  follow_up_date?: string;
  relationship_strength: 'new' | 'developing' | 'strong' | 'inactive';
  opportunities_discussed?: string;
  referral_potential: boolean;
  last_interaction?: string;
  created_at?: string;
}

const connectionTypeColors: Record<string, string> = {
  'recruiter': 'bg-blue-500',
  'hiring_manager': 'bg-purple-500',
  'employee': 'bg-green-500',
  'alumni': 'bg-indigo-500',
  'career_fair': 'bg-yellow-500',
  'other': 'bg-gray-500'
};

const relationshipStrengthIcons: Record<string, React.ReactNode> = {
  'new': <Star className="h-4 w-4 text-gray-400" />,
  'developing': <><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><Star className="h-4 w-4 text-gray-400" /></>,
  'strong': <><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /></>,
  'inactive': <Star className="h-4 w-4 text-red-400" />
};

export function EmployerConnections() {
  const { studentId } = useParams();
  const [connections, setConnections] = useState<EmployerConnection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    contact_linkedin: '',
    connection_type: 'recruiter' as EmployerConnection['connection_type'],
    connection_date: new Date().toISOString().split('T')[0],
    connection_context: '',
    interaction_notes: '',
    follow_up_date: '',
    relationship_strength: 'new' as EmployerConnection['relationship_strength'],
    opportunities_discussed: '',
    referral_potential: false,
    last_interaction: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (studentId) {
      fetchConnections();
    }
  }, [studentId]);

  const fetchConnections = async () => {
    try {
      const response = await api.get(`/career/employer-connections/student/${studentId}`);
      setConnections(response.data.data);
      
      // Calculate stats
      const typeCount = response.data.data.reduce((acc: Record<string, number>, conn: EmployerConnection) => {
        acc[conn.connection_type] = (acc[conn.connection_type] || 0) + 1;
        return acc;
      }, {});
      
      const strengthCount = response.data.data.reduce((acc: Record<string, number>, conn: EmployerConnection) => {
        acc[conn.relationship_strength] = (acc[conn.relationship_strength] || 0) + 1;
        return acc;
      }, {});
      
      setStats({
        total: response.data.data.length,
        strong: strengthCount.strong || 0,
        developing: strengthCount.developing || 0,
        referralPotential: response.data.data.filter((c: EmployerConnection) => c.referral_potential).length,
        recruiters: typeCount.recruiter || 0,
        alumni: typeCount.alumni || 0,
        upcomingFollowUps: response.data.data.filter((c: EmployerConnection) => {
          if (!c.follow_up_date) return false;
          const followUp = new Date(c.follow_up_date);
          const today = new Date();
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return followUp >= today && followUp <= weekFromNow;
        }).length
      });
    } catch (error) {
      toast.error('Failed to fetch employer connections');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        student_id: studentId,
        follow_up_date: formData.follow_up_date || undefined,
        last_interaction: formData.last_interaction || undefined
      };

      if (editingId) {
        await api.put(`/career/employer-connections/${editingId}`, data);
        toast.success('Connection updated successfully');
      } else {
        await api.post('/career/employer-connections', data);
        toast.success('Connection added successfully');
      }

      fetchConnections();
      resetForm();
    } catch (error) {
      toast.error('Failed to save connection');
    }
  };

  const handleEdit = (connection: EmployerConnection) => {
    setFormData({
      company_name: connection.company_name,
      contact_name: connection.contact_name,
      contact_title: connection.contact_title,
      contact_email: connection.contact_email || '',
      contact_phone: connection.contact_phone || '',
      contact_linkedin: connection.contact_linkedin || '',
      connection_type: connection.connection_type,
      connection_date: connection.connection_date.split('T')[0],
      connection_context: connection.connection_context || '',
      interaction_notes: connection.interaction_notes || '',
      follow_up_date: connection.follow_up_date?.split('T')[0] || '',
      relationship_strength: connection.relationship_strength,
      opportunities_discussed: connection.opportunities_discussed || '',
      referral_potential: connection.referral_potential,
      last_interaction: connection.last_interaction?.split('T')[0] || ''
    });
    setEditingId(connection.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;
    
    try {
      await api.delete(`/career/employer-connections/${id}`);
      toast.success('Connection deleted successfully');
      fetchConnections();
    } catch (error) {
      toast.error('Failed to delete connection');
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      contact_name: '',
      contact_title: '',
      contact_email: '',
      contact_phone: '',
      contact_linkedin: '',
      connection_type: 'recruiter',
      connection_date: new Date().toISOString().split('T')[0],
      connection_context: '',
      interaction_notes: '',
      follow_up_date: '',
      relationship_strength: 'new',
      opportunities_discussed: '',
      referral_potential: false,
      last_interaction: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getUpcomingFollowUps = () => {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return connections.filter(c => {
      if (!c.follow_up_date) return false;
      const followUp = new Date(c.follow_up_date);
      return followUp >= today && followUp <= weekFromNow;
    });
  };

  const isOverdue = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Connections</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.strong}</div>
              <div className="text-sm text-gray-500">Strong</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.developing}</div>
              <div className="text-sm text-gray-500">Developing</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.referralPotential}</div>
              <div className="text-sm text-gray-500">Referral Potential</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.recruiters}</div>
              <div className="text-sm text-gray-500">Recruiters</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.alumni}</div>
              <div className="text-sm text-gray-500">Alumni</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.upcomingFollowUps}</div>
              <div className="text-sm text-gray-500">Follow-ups (7d)</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Follow-ups Alert */}
      {getUpcomingFollowUps().length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="font-medium text-yellow-800 mb-2">Upcoming Follow-ups:</div>
            <div className="space-y-1">
              {getUpcomingFollowUps().map((c) => (
                <div key={c.id} className="text-sm text-yellow-700">
                  • {c.contact_name} at {c.company_name} - {new Date(c.follow_up_date!).toLocaleDateString()}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Employer Connections
          </CardTitle>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
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
                    placeholder="e.g., Google"
                    required
                  />
                </div>
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Contact Title</Label>
                  <Input
                    value={formData.contact_title}
                    onChange={(e) => setFormData({ ...formData, contact_title: e.target.value })}
                    placeholder="e.g., Senior Recruiter"
                    required
                  />
                </div>
                <div>
                  <Label>Connection Type</Label>
                  <Select
                    value={formData.connection_type}
                    onValueChange={(value) => setFormData({ ...formData, connection_type: value as EmployerConnection['connection_type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                      <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="alumni">Alumni</SelectItem>
                      <SelectItem value="career_fair">Career Fair</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Relationship Strength</Label>
                  <Select
                    value={formData.relationship_strength}
                    onValueChange={(value) => setFormData({ ...formData, relationship_strength: value as EmployerConnection['relationship_strength'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="developing">Developing</SelectItem>
                      <SelectItem value="strong">Strong</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    value={formData.contact_linkedin}
                    onChange={(e) => setFormData({ ...formData, contact_linkedin: e.target.value })}
                    placeholder="linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Connection Date</Label>
                  <Input
                    type="date"
                    value={formData.connection_date}
                    onChange={(e) => setFormData({ ...formData, connection_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Last Interaction</Label>
                  <Input
                    type="date"
                    value={formData.last_interaction}
                    onChange={(e) => setFormData({ ...formData, last_interaction: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Follow-up Date</Label>
                  <Input
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Connection Context</Label>
                <Textarea
                  value={formData.connection_context}
                  onChange={(e) => setFormData({ ...formData, connection_context: e.target.value })}
                  rows={2}
                  placeholder="How did you meet? (e.g., Career fair, LinkedIn outreach, Alumni event)"
                />
              </div>

              <div>
                <Label>Interaction Notes</Label>
                <Textarea
                  value={formData.interaction_notes}
                  onChange={(e) => setFormData({ ...formData, interaction_notes: e.target.value })}
                  rows={3}
                  placeholder="Key discussion points, interests, advice given..."
                />
              </div>

              <div>
                <Label>Opportunities Discussed</Label>
                <Textarea
                  value={formData.opportunities_discussed}
                  onChange={(e) => setFormData({ ...formData, opportunities_discussed: e.target.value })}
                  rows={2}
                  placeholder="Specific roles, departments, or opportunities mentioned..."
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.referral_potential}
                    onChange={(e) => setFormData({ ...formData, referral_potential: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Has referral potential</span>
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update' : 'Add'} Connection
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Connections List */}
      <div className="space-y-4">
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{connection.contact_name}</h3>
                    <Badge className={connectionTypeColors[connection.connection_type]}>
                      {connection.connection_type}
                    </Badge>
                    <div className="flex items-center">
                      {relationshipStrengthIcons[connection.relationship_strength]}
                    </div>
                    {connection.referral_potential && (
                      <Badge className="bg-purple-500">
                        Referral Potential
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-lg font-medium mb-1">
                    {connection.contact_title} at {connection.company_name}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Connected: {new Date(connection.connection_date).toLocaleDateString()}
                    </div>
                    {connection.last_interaction && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Last: {new Date(connection.last_interaction).toLocaleDateString()}
                      </div>
                    )}
                    {connection.follow_up_date && (
                      <div className={`flex items-center gap-1 ${isOverdue(connection.follow_up_date) ? 'text-red-600' : ''}`}>
                        <Calendar className="h-4 w-4" />
                        Follow-up: {new Date(connection.follow_up_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {connection.contact_email && (
                      <a href={`mailto:${connection.contact_email}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        <Mail className="h-4 w-4" />
                        {connection.contact_email}
                      </a>
                    )}
                    {connection.contact_phone && (
                      <a href={`tel:${connection.contact_phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        <Phone className="h-4 w-4" />
                        {connection.contact_phone}
                      </a>
                    )}
                    {connection.contact_linkedin && (
                      <a href={connection.contact_linkedin.startsWith('http') ? connection.contact_linkedin : `https://${connection.contact_linkedin}`} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                  </div>

                  {connection.connection_context && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Context: </span>
                      <span className="text-sm text-gray-600">{connection.connection_context}</span>
                    </div>
                  )}

                  {connection.interaction_notes && (
                    <div className="mb-2">
                      <span className="text-sm font-medium">Notes: </span>
                      <span className="text-sm text-gray-600">{connection.interaction_notes}</span>
                    </div>
                  )}

                  {connection.opportunities_discussed && (
                    <div className="p-2 bg-green-50 rounded-md">
                      <span className="text-sm font-medium text-green-800">Opportunities: </span>
                      <span className="text-sm text-green-700">{connection.opportunities_discussed}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(connection)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(connection.id)}
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
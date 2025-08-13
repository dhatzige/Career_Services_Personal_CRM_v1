import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Copy, RefreshCw, Video, MapPin, Ban, AlertTriangle } from 'lucide-react';
import { api } from '../services/apiClient';
import { Consultation } from '../types/student';
import { toast } from './ui/toast';
import * as Sentry from '@sentry/react';
import { format, isToday, isPast, isFuture, addMinutes } from 'date-fns';
import CancellationModal from './CancellationModal';
import ConsultationTypeModal from './ConsultationTypeModal';

interface TodayConsultation extends Consultation {
  studentName: string;
  studentEmail: string;
  studentId: string;
}

const TodayView: React.FC = () => {
  const [consultations, setConsultations] = useState<TodayConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [cancellationModal, setCancellationModal] = useState<{
    isOpen: boolean;
    consultationId: string;
    studentName: string;
  }>({ isOpen: false, consultationId: '', studentName: '' });
  const [typeModal, setTypeModal] = useState<{
    isOpen: boolean;
    consultationId: string;
    studentName: string;
  }>({ isOpen: false, consultationId: '', studentName: '' });

  useEffect(() => {
    loadTodayConsultations();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadTodayConsultations, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayConsultations = async () => {
    try {
      const today = new Date();
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = startDate;
      
      console.log(`Loading consultations for date: ${startDate}`); // Debug log
      
      const response = await api.consultations.dateRange(startDate, endDate);
      const consultationsData = response.data || response || [];
      
      console.log(`Found ${consultationsData.length} consultations:`, consultationsData); // Debug log
      
      // Map the response data to include proper student info
      const mappedData = consultationsData.map((c: any) => ({
        ...c,
        studentName: c.studentName || c.student_name || 'Unknown',
        studentEmail: c.studentEmail || c.student_email || '',
        studentId: c.studentId || c.student_id || '',
        date: c.date || c.consultation_date || c.scheduled_date
      }));
      
      // Sort by time
      const sorted = mappedData.sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setConsultations(sorted);
      
      // Check for no-shows (15 minutes past scheduled time)
      checkForNoShows(sorted);
    } catch (error) {
      console.error('Error loading consultations:', error); // Debug log
      Sentry.captureException(error, {
        tags: { operation: 'load_today_consultations' }
      });
      toast.error('Failed to load consultations. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const checkForNoShows = async (consultations: TodayConsultation[]) => {
    const now = new Date();
    const autoMarkNoShow = localStorage.getItem('autoMarkNoShow') === 'true';
    
    for (const consultation of consultations) {
      const consultationTime = new Date(consultation.date);
      const fifteenMinutesAfter = addMinutes(consultationTime, 15);
      
      // If it's 15 minutes past and still marked as scheduled
      if (isPast(fifteenMinutesAfter) && consultation.status === 'scheduled') {
        if (autoMarkNoShow) {
          // Auto-mark as no-show
          try {
            await api.consultations.update(consultation.id, {
              status: 'no-show',
              attended: false
            });
            
            // Update local state
            setConsultations(prev => 
              prev.map(c => 
                c.id === consultation.id 
                  ? { ...c, status: 'no-show', attended: false }
                  : c
              )
            );
            
            toast.success(`${consultation.studentName} was automatically marked as no-show (15+ minutes late).`);
          } catch (error) {
            console.error('Failed to auto-mark no-show:', error);
          }
        } else {
          console.log(`Consultation ${consultation.id} might be a no-show`);
        }
      }
    }
  };

  const updateConsultationStatus = async (
    consultationId: string, 
    newStatus: 'attended' | 'no-show' | 'cancelled'
  ) => {
    setUpdating(consultationId);
    
    try {
      await api.consultations.update(consultationId, {
        status: newStatus,
        attended: newStatus === 'attended'
      });
      
      // Update local state
      setConsultations(prev => 
        prev.map(c => 
          c.id === consultationId 
            ? { ...c, status: newStatus, attended: newStatus === 'attended' }
            : c
        )
      );
      
      toast.success(`Consultation marked as ${newStatus}.`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: 'update_consultation_status' },
        extra: { consultationId, newStatus }
      });
      toast.error('Update failed. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const updateConsultationType = async (consultationId: string, type: string) => {
    setUpdating(consultationId);
    
    try {
      await api.consultations.update(consultationId, {
        type,
        needsReview: false
      });
      
      // Update local state
      setConsultations(prev => 
        prev.map(c => 
          c.id === consultationId 
            ? { ...c, type, needsReview: false }
            : c
        )
      );
      
      toast.success(`Consultation type set to ${type}.`);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: 'update_consultation_type' },
        extra: { consultationId, type }
      });
      toast.error('Failed to update consultation type. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied to clipboard.');
  };

  const toggleSelection = (consultationId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(consultationId)) {
      newSelected.delete(consultationId);
    } else {
      newSelected.add(consultationId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const pastConsultations = consultations.filter(c => {
      const consultationTime = new Date(c.date);
      return isPast(consultationTime) && c.status === 'scheduled';
    });
    setSelectedIds(new Set(pastConsultations.map(c => c.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const bulkUpdateStatus = async (newStatus: 'attended' | 'no-show') => {
    if (selectedIds.size === 0) return;
    
    setBulkUpdating(true);
    const errors: string[] = [];
    
    try {
      for (const consultationId of selectedIds) {
        try {
          await api.consultations.update(consultationId, {
            status: newStatus,
            attended: newStatus === 'attended'
          });
        } catch (error) {
          errors.push(consultationId);
        }
      }
      
      // Update local state
      setConsultations(prev => 
        prev.map(c => 
          selectedIds.has(c.id)
            ? { ...c, status: newStatus, attended: newStatus === 'attended' }
            : c
        )
      );
      
      if (errors.length === 0) {
        toast.success(`${selectedIds.size} consultation(s) marked as ${newStatus}.`);
      } else {
        toast.warning(`${selectedIds.size - errors.length} updated successfully, ${errors.length} failed.`);
      }
      
      clearSelection();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: 'bulk_update_consultations' },
        extra: { selectedIds: Array.from(selectedIds), newStatus }
      });
      toast.error('Bulk update failed. Please try again.');
    } finally {
      setBulkUpdating(false);
    }
  };

  const getStatusColor = (status?: string, date?: string) => {
    if (!status && date) {
      const consultationTime = new Date(date);
      if (isFuture(consultationTime)) return 'text-blue-600';
      if (isPast(addMinutes(consultationTime, 15))) return 'text-orange-600';
    }
    
    switch (status) {
      case 'attended':
        return 'text-green-600';
      case 'no-show':
        return 'text-red-600';
      case 'cancelled':
        return 'text-gray-500';
      case 'scheduled':
      default:
        return 'text-blue-600';
    }
  };

  const getStatusIcon = (status?: string, date?: string) => {
    if (!status && date) {
      const consultationTime = new Date(date);
      if (isPast(addMinutes(consultationTime, 15))) {
        return <AlertCircle className="h-5 w-5" />;
      }
    }
    
    switch (status) {
      case 'attended':
        return <CheckCircle className="h-5 w-5" />;
      case 'no-show':
        return <XCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      case 'scheduled':
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getLocationIcon = (location?: string, meetingLink?: string) => {
    if (meetingLink || location?.toLowerCase().includes('zoom') || location?.toLowerCase().includes('meet')) {
      return <Video className="h-4 w-4" />;
    }
    return <MapPin className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Today's Schedule</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {selectedIds.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => bulkUpdateStatus('attended')}
                disabled={bulkUpdating}
                className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm font-medium disabled:opacity-50"
              >
                Mark Attended
              </button>
              <button
                onClick={() => bulkUpdateStatus('no-show')}
                disabled={bulkUpdating}
                className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium disabled:opacity-50"
              >
                Mark No-show
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium"
              >
                Clear
              </button>
            </div>
          )}
          <button
            onClick={loadTodayConsultations}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {consultations.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No consultations scheduled
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have any consultations scheduled for today.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select all button if there are past consultations */}
          {consultations.some(c => isPast(new Date(c.date)) && c.status === 'scheduled') && (
            <div className="flex justify-end">
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Select all pending
              </button>
            </div>
          )}
          
          {consultations.map((consultation) => {
            const consultationTime = new Date(consultation.date);
            const isPastTime = isPast(consultationTime);
            const isNoShowTime = isPast(addMinutes(consultationTime, 15));
            const needsAction = isPastTime && consultation.status === 'scheduled';
            const needsTypeReview = consultation.needsReview === true;
            
            return (
              <div
                key={consultation.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
                  needsAction ? 'ring-2 ring-orange-500' : needsTypeReview ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {needsAction && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(consultation.id)}
                        onChange={() => toggleSelection(consultation.id)}
                        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                      <span className={`flex items-center space-x-2 ${getStatusColor(consultation.status, consultation.date)}`}>
                        {getStatusIcon(consultation.status, consultation.date)}
                        <span className="font-medium">
                          {format(consultationTime, 'h:mm a')}
                        </span>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {consultation.duration || 30} minutes
                      </span>
                      {consultation.needsReview ? (
                        <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Type needs review</span>
                        </span>
                      ) : consultation.type ? (
                        <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                          {consultation.type}
                        </span>
                      ) : null}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {consultation.studentName}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        ({consultation.studentEmail})
                      </span>
                    </div>

                    {(consultation.meetingLink || consultation.location) && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        {getLocationIcon(consultation.location, consultation.meetingLink)}
                        <span>{consultation.location || 'Online Meeting'}</span>
                        {consultation.meetingLink && (
                          <button
                            onClick={() => copyMeetingLink(consultation.meetingLink!)}
                            className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            title="Copy meeting link"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {consultation.notes && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {consultation.notes}
                      </p>
                    )}
                    </div>
                  </div>

                  {/* Quick action buttons */}
                  <div className="flex space-x-2 ml-4">
                    {/* Type review button */}
                    {consultation.needsReview && (
                      <button
                        onClick={() => setTypeModal({
                          isOpen: true,
                          consultationId: consultation.id,
                          studentName: consultation.studentName
                        })}
                        className="p-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors"
                        title="Set consultation type"
                      >
                        <AlertTriangle className="h-5 w-5" />
                      </button>
                    )}
                    
                    {consultation.status === 'scheduled' && (
                      isPastTime ? (
                        <>
                          <button
                            onClick={() => updateConsultationStatus(consultation.id, 'attended')}
                            disabled={updating === consultation.id}
                            className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Mark as attended"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => updateConsultationStatus(consultation.id, 'no-show')}
                            disabled={updating === consultation.id}
                            className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                            title="Mark as no-show"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setCancellationModal({
                            isOpen: true,
                            consultationId: consultation.id,
                            studentName: consultation.studentName
                          })}
                          className="p-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg transition-colors"
                          title="Cancel consultation"
                        >
                          <Ban className="h-5 w-5" />
                        </button>
                      )
                    )}
                  </div>

                  {/* Status indicator for completed consultations */}
                  {consultation.status && consultation.status !== 'scheduled' && (
                    <div className="space-y-2">
                      <div className={`flex items-center space-x-2 ${getStatusColor(consultation.status)}`}>
                        {getStatusIcon(consultation.status)}
                        <span className="text-sm font-medium capitalize">
                          {consultation.status.replace('-', ' ')}
                        </span>
                      </div>
                      {consultation.status === 'cancelled' && consultation.cancellationReason && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <div>Method: {consultation.cancellationMethod?.replace('-', ' ')}</div>
                          <div>Reason: {consultation.cancellationReason}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Warning for potential no-shows */}
                {isNoShowTime && consultation.status === 'scheduled' && (
                  <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-300">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">
                        This consultation started over 15 minutes ago. Consider marking attendance status.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary stats */}
      {consultations.length > 0 && (
        <>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {consultations.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {consultations.filter(c => c.status === 'attended').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Attended</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {consultations.filter(c => c.status === 'no-show').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">No-show</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {consultations.filter(c => c.status === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
            </div>
          </div>
        </div>
        
        {/* Auto no-show settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Auto No-Show Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically mark consultations as no-show after 15 minutes
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={localStorage.getItem('autoMarkNoShow') === 'true'}
                onChange={(e) => {
                  localStorage.setItem('autoMarkNoShow', e.target.checked.toString());
                  toast.success(e.target.checked 
                    ? "Auto no-show marking enabled" 
                    : "Auto no-show marking disabled"
                  );
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        </>
      )}
      
      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={cancellationModal.isOpen}
        onClose={() => setCancellationModal({ isOpen: false, consultationId: '', studentName: '' })}
        consultationId={cancellationModal.consultationId}
        studentName={cancellationModal.studentName}
        onSuccess={loadTodayConsultations}
      />
      
      {/* Consultation Type Modal */}
      <ConsultationTypeModal
        isOpen={typeModal.isOpen}
        onClose={() => setTypeModal({ isOpen: false, consultationId: '', studentName: '' })}
        consultationId={typeModal.consultationId}
        studentName={typeModal.studentName}
        onTypeSelect={(type) => {
          updateConsultationType(typeModal.consultationId, type);
          setTypeModal({ isOpen: false, consultationId: '', studentName: '' });
        }}
      />
    </div>
  );
};

export default TodayView;
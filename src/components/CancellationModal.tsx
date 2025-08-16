import React, { useState } from 'react';
import { X, Phone, Mail, Calendar, AlertCircle } from 'lucide-react';
import { api } from '../services/apiClient';
import { toast } from './ui/toast';
import * as Sentry from '@sentry/react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  studentName: string;
  onSuccess?: () => void;
}

type CancellationMethod = 'calendly' | 'email' | 'phone' | 'no-notice' | 'other';

const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  consultationId,
  studentName,
  onSuccess
}) => {
  const [method, setMethod] = useState<CancellationMethod>('email');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const cancellationMethods = [
    { value: 'calendly', label: 'Calendly', icon: Calendar },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'phone', label: 'Phone', icon: Phone },
    { value: 'no-notice', label: 'No Notice', icon: AlertCircle },
    { value: 'other', label: 'Other', icon: null }
  ];

  const commonReasons = [
    'Student requested reschedule',
    'Student feeling unwell',
    'Emergency situation',
    'Scheduling conflict',
    'Technical issues',
    'Other commitment'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a cancellation reason.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await api.consultations.update(consultationId, {
        status: 'cancelled',
        cancellationMethod: method,
        cancellationReason: reason,
        attended: false
      });

      toast({
        title: "Consultation cancelled",
        description: `Meeting with ${studentName} has been cancelled.`,
      });

      onSuccess?.();
      onClose();
      
      // Reset form
      setMethod('email');
      setReason('');
    } catch (error) {
      Sentry.captureException(error, {
        tags: { operation: 'cancel_consultation' },
        extra: { consultationId, method, reason }
      });
      
      toast({
        title: "Cancellation failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Cancel Consultation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cancellation Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {cancellationMethods.map((methodOption) => {
                const Icon = methodOption.icon;
                return (
                  <button
                    key={methodOption.value}
                    type="button"
                    onClick={() => setMethod(methodOption.value as CancellationMethod)}
                    className={`flex items-center justify-center space-x-2 p-2 rounded-lg border transition-colors ${
                      method === methodOption.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="text-sm">{methodOption.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cancellation Reason
            </label>
            
            {/* Quick reason buttons */}
            <div className="mb-2 flex flex-wrap gap-2">
              {commonReasons.map((commonReason) => (
                <button
                  key={commonReason}
                  type="button"
                  onClick={() => setReason(commonReason)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                >
                  {commonReason}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              required
            />
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Cancelling consultation with <strong>{studentName}</strong>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancellationModal;
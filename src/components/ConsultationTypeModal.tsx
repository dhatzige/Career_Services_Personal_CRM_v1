import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { CONSULTATION_TYPES } from '../types/shared';

interface ConsultationTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTypeSelect: (type: string) => void;
  consultationId: string;
  studentName: string;
  currentType?: string;
}

const ConsultationTypeModal: React.FC<ConsultationTypeModalProps> = ({
  isOpen,
  onClose,
  onTypeSelect,
  consultationId,
  studentName,
  currentType
}) => {
  const [selectedType, setSelectedType] = useState<string>(currentType || '');

  useEffect(() => {
    if (isOpen && currentType) {
      setSelectedType(currentType);
    }
  }, [isOpen, currentType]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedType && selectedType !== currentType) {
      onTypeSelect(selectedType);
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-2xl transition-all w-full max-w-md">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                  Select Consultation Type
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose a type for {studentName}'s consultation
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="px-4 pb-4">
            <div className="space-y-1">
              {CONSULTATION_TYPES.map((type) => (
                <label
                  key={type}
                  className={`relative flex cursor-pointer rounded-lg px-4 py-3 focus:outline-none transition-colors ${
                    selectedType === type
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400'
                      : 'border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="consultation-type"
                    value={type}
                    checked={selectedType === type}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <p className={`font-medium ${
                          selectedType === type 
                            ? 'text-blue-900 dark:text-blue-100' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {type}
                        </p>
                      </div>
                    </div>
                    {selectedType === type && (
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 flex flex-row-reverse gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedType || selectedType === currentType}
              className="inline-flex justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              Update
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use React Portal to render modal at document body level
  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
};

export default ConsultationTypeModal;
import React from 'react';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose }) => {
  console.log('DebugModal render:', { isOpen });
  
  if (!isOpen) {
    console.log('DebugModal not open, returning null');
    return null;
  }

  console.log('DebugModal is open, rendering modal');
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
          onClick={() => {
            console.log('Backdrop clicked');
            onClose();
          }}
        />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full" style={{ zIndex: 51 }}>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900">
              Debug Modal Test
            </h3>
            <p>If you can see this, the modal is rendering correctly!</p>
            <button
              onClick={() => {
                console.log('Close button clicked');
                onClose();
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close Modal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugModal;
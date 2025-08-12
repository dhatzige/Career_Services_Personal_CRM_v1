import React from 'react';
import ImportExportModal from '../components/ImportExportModal';

const TestPage: React.FC = () => {
  const [showModal, setShowModal] = React.useState(true);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Import/Export Test Page</h1>
      <p className="mb-4">If you see this text, the page is rendering correctly.</p>
      <button 
        onClick={() => setShowModal(!showModal)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Toggle Modal (Currently: {showModal ? 'Open' : 'Closed'})
      </button>
      
      <ImportExportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onDataImported={() => console.log('Data imported')}
      />
    </div>
  );
};

export default TestPage;
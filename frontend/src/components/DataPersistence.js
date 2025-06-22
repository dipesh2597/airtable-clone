import React, { useState, useEffect } from 'react';

const DataPersistence = ({ socket, spreadsheetData, onDataLoad, showSidePanel, onToggleSidePanel, activeUsers, userSelections }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('import'); // 'import'
  const [filename, setFilename] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState(spreadsheetData?.metadata?.title || 'Spreadsheet');
  const [importFile, setImportFile] = useState(null);
  const [csvImportFile, setCsvImportFile] = useState(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for spreadsheet loaded events
    socket.on('spreadsheet_loaded', (data) => {
      onDataLoad(data);
      setTitle(data.metadata?.title || 'Spreadsheet');
    });

    // Listen for title updates
    socket.on('title_updated', (data) => {
      setTitle(data.title);
    });

    return () => {
      socket.off('spreadsheet_loaded');
      socket.off('title_updated');
    };
  }, [socket, onDataLoad]);

  const handleExcelImport = async () => {
    if (!importFile) {
      setMessage('Please select an Excel file to import');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      // For now, we'll use the existing load functionality
      // In a real implementation, you'd upload the Excel file to the server
      setMessage('Excel import functionality will be implemented');
      setLoading(false);
      setShowModal(false);
      setImportFile(null);
    } catch (error) {
      setLoading(false);
      setMessage(`Error importing Excel: ${error.message}`);
    }
  };

  const handleCsvImport = async () => {
    if (!csvImportFile) {
      setMessage('Please select a CSV file to import');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      const csvContent = await readFileAsText(csvImportFile);
      
      const response = await fetch('http://localhost:8000/api/spreadsheet/import-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csv_content: csvContent })
      });
      
      const result = await response.json();
      setLoading(false);
      
      if (result.success) {
        setMessage('CSV data imported successfully');
        setShowModal(false);
        setCsvImportFile(null);
        
        // Refresh the user session to prevent user_id=None errors
        if (socket && socket.connected) {
          // Re-emit join_spreadsheet to refresh the session
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          if (userData.user_id && userData.user_name) {
            socket.emit('join_spreadsheet', {
              user_id: userData.user_id,
              user_name: userData.user_name
            });
          }
        }
      } else {
        setMessage(`Error importing CSV: ${result.error}`);
      }
    } catch (error) {
      setLoading(false);
      setMessage(`Error importing CSV: ${error.message}`);
    }
  };

  const handleCsvExport = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('http://localhost:8000/api/spreadsheet/export-csv');
      const result = await response.json();
      setLoading(false);
      
      if (result.success) {
        // Download the CSV file
        const blob = new Blob([result.csv_content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename || 'spreadsheet.csv';
        link.click();
        URL.revokeObjectURL(url);
        
        setMessage('CSV exported successfully');
      } else {
        setMessage(`Error exporting CSV: ${result.error}`);
      }
    } catch (error) {
      setLoading(false);
      setMessage(`Error exporting CSV: ${error.message}`);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleTitleUpdate = () => {
    if (!title.trim()) {
      setMessage('Please enter a title');
      return;
    }
    
    socket.emit('update_title_request', { title: title.trim() });
    setMessage('Title updated successfully');
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
    setMessage('');
    setFilename('');
    setImportFile(null);
    setCsvImportFile(null);
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 file.type === 'application/vnd.ms-excel' || 
                 file.name.endsWith('.xlsx') || 
                 file.name.endsWith('.xls'))) {
      setImportFile(file);
      setFilename(file.name.replace(/\.(xlsx|xls)$/, ''));
    } else {
      setMessage('Please select a valid Excel file (.xlsx or .xls)');
    }
  };

  const handleCsvFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setCsvImportFile(file);
      setFilename(file.name.replace('.csv', ''));
    } else {
      setMessage('Please select a valid CSV file');
    }
  };

  return (
    <>
      {/* Title and Save/Load buttons */}
      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="text-xl font-semibold text-gray-800 px-2 py-1 bg-white rounded-lg shadow-sm border border-blue-100">
            {title}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCsvExport}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          >
            Export
          </button>
          <button
            onClick={() => openModal('import')}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
          >
            Import
          </button>
          <button
            onClick={onToggleSidePanel}
            className="ml-2 bg-white border border-gray-300 rounded-full p-2 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transform hover:scale-105"
            title={showSidePanel ? "Hide Users Panel" : `Show Users Panel (${activeUsers?.filter(user => user.sid !== socket?.id).length || 0} online)`}
          >
            {showSidePanel ? (
              <svg className="w-5 h-5 text-gray-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {modalType === 'import' && 'Import Data'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {message && (
              <div className={`p-3 rounded-lg mb-4 ${
                message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {message}
              </div>
            )}

            {modalType === 'import' && (
              <div>
                <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>Import Data</strong> - Only CSV files are supported
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import CSV File
                  </label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {csvImportFile && (
                    <p className="text-sm text-gray-600 mt-1">Selected: {csvImportFile.name}</p>
                  )}
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Import will replace all existing data in the spreadsheet
                  </p>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCsvImport}
                    disabled={loading || !csvImportFile}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                  >
                    {loading ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DataPersistence; 
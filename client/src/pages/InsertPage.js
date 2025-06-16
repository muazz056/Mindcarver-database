import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const InsertPage = () => {
  const [file, setFile] = useState(null);
  const [tableName, setTableName] = useState('');
  const [action, setAction] = useState('create'); // 'create' or 'insert'
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get('/api/tables');
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const onDrop = (acceptedFiles) => {
    const csvFile = acceptedFiles[0];
    if (csvFile && csvFile.type === 'text/csv') {
      setFile(csvFile);
      setMessage({ type: '', content: '' });
    } else {
      setMessage({ type: 'error', content: 'Please upload a valid CSV file' });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage({ type: 'error', content: 'Please select a CSV file' });
      return;
    }

    if (action === 'create' && !tableName.trim()) {
      setMessage({ type: 'error', content: 'Please enter a table name' });
      return;
    }

    if (action === 'insert' && !selectedTable) {
      setMessage({ type: 'error', content: 'Please select a table' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', content: '' });

    const formData = new FormData();
    formData.append('csvFile', file);
    formData.append('action', action);
    formData.append('tableName', action === 'create' ? tableName : selectedTable);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage({ 
        type: 'success', 
        content: response.data.message 
      });
      
      // Reset form
      setFile(null);
      setTableName('');
      setSelectedTable('');
      
      // Refresh tables list
      fetchTables();
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        content: error.response?.data?.error || 'Error uploading file' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Upload CSV File</h1>
          <p className="text-gray-600">
            Upload a CSV file and either create a new table or insert data into an existing one.
          </p>
        </div>
        
        <div className="card-content">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV File
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50'
                    : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-green-700 font-medium">{file.name}</p>
                      <p className="text-sm text-green-600">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                ) : isDragActive ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Upload className="h-8 w-8 text-blue-600" />
                    <p className="text-blue-700">Drop the CSV file here...</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-gray-600">
                        Drag & drop a CSV file here, or click to select
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Only CSV files are accepted
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="create"
                    checked={action === 'create'}
                    onChange={(e) => setAction(e.target.value)}
                    className="mr-2"
                  />
                  <span>Create new table</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="insert"
                    checked={action === 'insert'}
                    onChange={(e) => setAction(e.target.value)}
                    className="mr-2"
                  />
                  <span>Insert into existing table</span>
                </label>
              </div>
            </div>

            {/* Table Name Input (for create) */}
            {action === 'create' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Table Name
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Enter table name"
                  className="input"
                  required
                />
              </div>
            )}

            {/* Table Selection (for insert) */}
            {action === 'insert' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Existing Table
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Choose a table...</option>
                  {tables.map((table) => (
                    <option key={table} value={table}>
                      {table}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Upload and Process'
              )}
            </button>
          </form>

          {/* Message Display */}
          {message.content && (
            <div className={`mt-4 p-4 rounded-md flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{message.content}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsertPage; 
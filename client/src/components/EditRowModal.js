import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, AlertTriangle } from 'lucide-react';

const EditRowModal = ({ isOpen, onClose, tableName, rowId, onSave }) => {
  const [rowData, setRowData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [columnTypes, setColumnTypes] = useState({});

  useEffect(() => {
    if (isOpen && rowId) {
      fetchRowData();
      fetchColumnTypes();
    }
  }, [isOpen, rowId]);

  const fetchRowData = async () => {
    try {
      const response = await axios.get(`/api/tables/${tableName}/rows/${rowId}`);
      const data = { ...response.data };
      delete data.rowid; // Remove rowid from editable fields
      setRowData(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch row data');
      console.error('Error fetching row data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchColumnTypes = async () => {
    try {
      const response = await axios.get(`/api/tables/${tableName}/schema`);
      const types = {};
      response.data.forEach(col => {
        types[col.name] = col.type;
      });
      setColumnTypes(types);
    } catch (err) {
      console.error('Error fetching column types:', err);
    }
  };

  const handleInputChange = (column, value) => {
    setRowData(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const getInputType = (column, type) => {
    if (type?.toLowerCase().includes('int') || type?.toLowerCase().includes('real')) {
      return 'number';
    }
    if (type?.toLowerCase().includes('date')) {
      return 'date';
    }
    if (type?.toLowerCase().includes('time')) {
      return 'time';
    }
    if (type?.toLowerCase().includes('datetime')) {
      return 'datetime-local';
    }
    return 'text';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(rowId, rowData);
    } catch (err) {
      setError('Failed to update row');
      console.error('Error updating row:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div>
            <h2 className="text-xl font-semibold">Edit Row</h2>
            <p className="text-sm text-gray-500">Table: {tableName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-8">
              <div className="flex items-center justify-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(rowData).map(([column, value]) => (
                  <div key={column} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {column}
                      <span className="ml-1 text-xs text-gray-500">
                        ({columnTypes[column] || 'text'})
                      </span>
                    </label>
                    <input
                      type={getInputType(column, columnTypes[column])}
                      value={value || ''}
                      onChange={(e) => handleInputChange(column, e.target.value)}
                      className="input w-full"
                      placeholder={`Enter ${column}`}
                    />
                  </div>
                ))}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t shrink-0 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary inline-flex items-center"
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRowModal; 
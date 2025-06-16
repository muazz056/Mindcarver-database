import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Table, Eye, Database, AlertCircle } from 'lucide-react';

const ViewPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tables');
      setTables(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch tables');
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading tables...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="card-title">Database Tables</h1>
              <p className="text-gray-600">
                View and manage your uploaded CSV data tables
              </p>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <Database className="h-5 w-5" />
              <span className="text-sm">{tables.length} tables</span>
            </div>
          </div>
        </div>
        
        <div className="card-content">
          {tables.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
              <p className="text-gray-600 mb-4">
                Get started by uploading a CSV file to create your first table.
              </p>
              <Link
                to="/insert"
                className="btn-primary"
              >
                Upload CSV File
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tables.map((tableName) => (
                <TableCard
                  key={tableName}
                  tableName={tableName}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TableCard = ({ tableName }) => {
  const [tableInfo, setTableInfo] = useState({ rowCount: 0, columnCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTableInfo();
  }, [tableName]);

  const fetchTableInfo = async () => {
    try {
      // Fetch table schema to get column count
      const schemaResponse = await axios.get(`/api/tables/${tableName}/schema`);
      const columnCount = schemaResponse.data.length;

      // Fetch table data to get row count (we'll just get first row to count)
      const dataResponse = await axios.get(`/api/tables/${tableName}`);
      const rowCount = dataResponse.data.length;

      setTableInfo({ rowCount, columnCount });
    } catch (error) {
      console.error(`Error fetching info for table ${tableName}:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Table className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900 truncate" title={tableName}>
            {tableName}
          </h3>
        </div>
      </div>
      
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-2 mb-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{tableInfo.rowCount}</span> rows
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{tableInfo.columnCount}</span> columns
          </div>
        </div>
      )}
      
      <Link
        to={`/table/${encodeURIComponent(tableName)}`}
        className="flex items-center justify-center space-x-2 w-full px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
      >
        <Eye className="h-4 w-4" />
        <span>View Data</span>
      </Link>
    </div>
  );
};

export default ViewPage; 
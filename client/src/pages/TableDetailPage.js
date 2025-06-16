import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTable, useSortBy, usePagination } from 'react-table';
import axios from 'axios';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  ChevronUp, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Edit,
  Trash2,
  AlertTriangle,
  Undo2,
  Redo2
} from 'lucide-react';
import EditRowModal from '../components/EditRowModal';
import ConfirmationModal from '../components/ConfirmationModal';

const TableDetailPage = () => {
  const { tableName } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [columnValues, setColumnValues] = useState({});
  const [editingRowId, setEditingRowId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showTableDeleteConfirm, setShowTableDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowHistory, setRowHistory] = useState({}); // Store history for each row
  const [deletedRows, setDeletedRows] = useState([]); // Store deleted rows

  useEffect(() => {
    if (tableName) {
      fetchTableData();
      fetchTableSchema();
    }
  }, [tableName]);

  useEffect(() => {
    applyFilters();
  }, [search, filters, originalData]);

  const fetchTableData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tables/${tableName}`);
      setOriginalData(response.data);
      setData(response.data);
      setError('');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch table data';
      setError(errorMessage);
      console.error('Error fetching table data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableSchema = async () => {
    try {
      const response = await axios.get(`/api/tables/${tableName}/schema`);
      const schemaColumns = response.data;
      
      // Create columns for React Table
      const tableColumns = schemaColumns.map(col => ({
        Header: col.name,
        accessor: col.name,
        Cell: ({ value }) => (
          <div className="truncate" title={value}>
            {value || '—'}
          </div>
        )
      }));
      
      setColumns(tableColumns);
      
      // Fetch unique values for each column (for filters)
      fetchColumnValues(schemaColumns);
      
    } catch (err) {
      setError('Failed to fetch table schema');
      console.error('Error fetching table schema:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchColumnValues = async (schemaColumns) => {
    const values = {};
    
    try {
      await Promise.all(
        schemaColumns.map(async (col) => {
          const response = await axios.get(`/api/tables/${tableName}/columns/${col.name}/values`);
          values[col.name] = response.data;
        })
      );
      setColumnValues(values);
    } catch (err) {
      console.error('Error fetching column values:', err);
    }
  };

  const applyFilters = () => {
    let filteredData = [...originalData];

    // Apply search filter
    if (search) {
      filteredData = filteredData.filter(row =>
        Object.values(row).some(value =>
          value && value.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.keys(filters).forEach(column => {
      if (filters[column]) {
        filteredData = filteredData.filter(row =>
          row[column] === filters[column]
        );
      }
    });

    setData(filteredData);
  };

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({});
  };

  const hasActiveFilters = search || Object.values(filters).some(filter => filter);

  const handleDeleteTable = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`/api/tables/${tableName}`);
      navigate('/view');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to delete table';
      setError(errorMessage);
      console.error('Error deleting table:', err);
    } finally {
      setIsDeleting(false);
      setShowTableDeleteConfirm(false);
    }
  };

  const handleDeleteRow = async (rowId) => {
    setIsDeleting(true);
    try {
      const rowToDelete = data.find(row => row.rowid === rowId);
      if (!rowToDelete) {
        throw new Error('Row not found in current data');
      }
      
      await axios.delete(`/api/tables/${tableName}/rows/${rowId}`);
      setShowDeleteConfirm(null);
      setDeletedRows(prev => [...prev, rowToDelete]);
      setError('');
      await fetchTableData(); // Refresh the data
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to delete row';
      setError(errorMessage);
      console.error('Error deleting row:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSave = async (rowId, newData) => {
    try {
      const oldData = data.find(row => row.rowid === rowId);
      if (!oldData) {
        throw new Error('Row not found in current data');
      }

      await axios.put(`/api/tables/${tableName}/rows/${rowId}`, newData);
      setRowHistory(prev => ({
        ...prev,
        [rowId]: [...(prev[rowId] || []), { ...oldData }]
      }));
      setError('');
      await fetchTableData(); // Refresh the data
      setEditingRowId(null); // Close the modal on success
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update row';
      setError(errorMessage);
      console.error('Error updating row:', err);
    }
  };

  const handleUndoEdit = async (rowId) => {
    const history = rowHistory[rowId];
    if (history && history.length > 0) {
      try {
        const previousState = history[history.length - 1];
        await axios.put(`/api/tables/${tableName}/rows/${rowId}`, previousState);
        setRowHistory(prev => ({
          ...prev,
          [rowId]: prev[rowId].slice(0, -1)
        }));
        setError('');
        await fetchTableData();
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Failed to undo edit';
        setError(errorMessage);
        console.error('Error undoing edit:', err);
      }
    }
  };

  const handleUndoDelete = async (deletedRow) => {
    try {
      const { rowid, ...rowData } = deletedRow;
      await axios.post(`/api/tables/${tableName}/rows`, rowData);
      setDeletedRows(prev => prev.filter(row => row.rowid !== deletedRow.rowid));
      setError('');
      await fetchTableData();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to restore row';
      setError(errorMessage);
      console.error('Error restoring row:', err);
    }
  };

  // Add action column to columns
  const tableColumns = useMemo(() => {
    if (columns.length === 0) return [];
    
    return [
      {
        Header: 'Actions',
        id: 'actions',
        Cell: ({ row }) => {
          const hasHistory = rowHistory[row.original.rowid]?.length > 0;
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditingRowId(row.original.rowid)}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(row.original.rowid)}
                className="p-1 text-red-600 hover:text-red-800"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {hasHistory && (
                <button
                  onClick={() => handleUndoEdit(row.original.rowid)}
                  className="p-1 text-orange-600 hover:text-orange-800"
                  title="Undo Edit"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        }
      },
      ...columns
    ];
  }, [columns, rowHistory]);

  // React Table configuration
  const tableInstance = useTable(
    {
      columns: tableColumns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 }
    },
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = tableInstance;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading table data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2 text-red-600">
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/view" className="btn-secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tables
          </Link>
          <h1 className="text-2xl font-bold">{tableName}</h1>
        </div>
        <button
          onClick={() => setShowTableDeleteConfirm(true)}
          className="btn bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 flex items-center space-x-2"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete Table</span>
        </button>
      </div>

      {/* Recently Deleted Rows */}
      {deletedRows.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recently Deleted Rows</h3>
          <div className="flex flex-wrap gap-2">
            {deletedRows.map((row, index) => (
              <button
                key={index}
                onClick={() => handleUndoDelete(row)}
                className="inline-flex items-center space-x-1 text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
              >
                <Undo2 className="h-3 w-3" />
                <span>Restore Row {row.rowid}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="card-title">{tableName}</h1>
                <p className="text-gray-600">
                  {data.length} rows {hasActiveFilters && `(filtered from ${originalData.length})`}
                </p>
              </div>
            </div>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="card-content">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            
            {/* Column Filters */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {columns.map(column => (
                <div key={column.accessor}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Filter className="inline h-3 w-3 mr-1" />
                    {column.Header}
                  </label>
                  <select
                    value={filters[column.accessor] || ''}
                    onChange={(e) => handleFilterChange(column.accessor, e.target.value)}
                    className="input text-sm"
                  >
                    <option value="">All values</option>
                    {(columnValues[column.accessor] || []).map(value => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {headerGroups.map(headerGroup => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map(column => (
                      <th
                        {...column.getHeaderProps(column.getSortByToggleProps())}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>{column.render('Header')}</span>
                          {column.id !== 'actions' && (
                            column.isSorted ? (
                              column.isSortedDesc ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronUp className="h-4 w-4" />
                              )
                            ) : (
                              <div className="h-4 w-4" />
                            )
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
                {page.map(row => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()} className="hover:bg-gray-50">
                      {row.cells.map(cell => (
                        <td
                          {...cell.getCellProps()}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {cell.render('Cell')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Show
              </span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="input text-sm w-20"
              >
                {[10, 20, 30, 40, 50].map(pageSize => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-700">
                entries
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Page {pageIndex + 1} of {pageOptions.length}
              </span>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                  className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                  className="p-2 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditRowModal
        isOpen={editingRowId !== null}
        onClose={() => {
          setEditingRowId(null);
          setError(''); // Clear error when closing modal
        }}
        tableName={tableName}
        rowId={editingRowId}
        onSave={handleEditSave}
      />

      {/* Delete Row Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm !== null}
        onClose={() => {
          setShowDeleteConfirm(null);
          setError(''); // Clear error when closing modal
        }}
        onConfirm={() => handleDeleteRow(showDeleteConfirm)}
        title="Confirm Row Deletion"
        message="Are you sure you want to delete this row? You can undo this action later."
        confirmText="Delete Row"
        isLoading={isDeleting}
      />

      {/* Delete Table Confirmation Modal */}
      <ConfirmationModal
        isOpen={showTableDeleteConfirm}
        onClose={() => {
          setShowTableDeleteConfirm(false);
          setError(''); // Clear error when closing modal
        }}
        onConfirm={handleDeleteTable}
        title="Confirm Table Deletion"
        message={`Are you sure you want to delete the entire table "${tableName}"? This action cannot be undone.`}
        confirmText="Delete Table"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TableDetailPage; 
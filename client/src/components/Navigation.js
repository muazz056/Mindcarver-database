import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Upload, Database, LogOut } from 'lucide-react';
import { AuthContext } from '../App';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authenticated, logout } = React.useContext(AuthContext);

  const isActive = (path) => {
    return location.pathname === path || (path === '/insert' && location.pathname === '/');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-gray-900">
              <Database className="h-6 w-6 text-blue-600" />
              <span>Mind Carver Database Manager</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {authenticated && (
              <>
                <Link
                  to="/insert"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/insert')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  <span>Insert</span>
                </Link>
                <Link
                  to="/view"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/view')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Database className="h-4 w-4" />
                  <span>View</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 border border-red-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import InsertPage from './pages/InsertPage';
import ViewPage from './pages/ViewPage';
import TableDetailPage from './pages/TableDetailPage';
import LoginPage from './pages/LoginPage';
import api from './api';
import './index.css';

// Auth context for global state
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(null); // null = loading, false = not logged in, true = logged in
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await api.get('/api/auth/check');
      setAuthenticated(response.data.authenticated);
    } catch (error) {
      setAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = () => {
    setAuthenticated(true);
  };

  const logout = async () => {
    try {
      await api.post('/api/logout');
    } finally {
      setAuthenticated(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ authenticated, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

function RequireAuth({ children }) {
  const { authenticated } = React.useContext(AuthContext);
  const location = useLocation();
  
  if (authenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>;
  }
  
  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

function AppRoutes() {
  const { authenticated } = React.useContext(AuthContext);
  
  return (
    <Routes>
      <Route path="/login" element={
        authenticated ? <Navigate to="/view" replace /> : <LoginPage />
      } />
      <Route path="/" element={<RequireAuth><InsertPage /></RequireAuth>} />
      <Route path="/insert" element={<RequireAuth><InsertPage /></RequireAuth>} />
      <Route path="/view" element={<RequireAuth><ViewPage /></RequireAuth>} />
      <Route path="/table/:tableName" element={<RequireAuth><TableDetailPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <AppRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export { AuthContext };
export default App; 
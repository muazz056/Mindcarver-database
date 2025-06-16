import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import InsertPage from './pages/InsertPage';
import ViewPage from './pages/ViewPage';
import TableDetailPage from './pages/TableDetailPage';
import LoginPage from './pages/LoginPage';
import axios from 'axios';
import './index.css';

// Auth context for global state
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(null); // null = loading, false = not logged in, true = logged in

  useEffect(() => {
    // Check if authenticated on mount
    axios.get('/api/tables')
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false));
  }, []);

  const login = () => setAuthenticated(true);
  const logout = async () => {
    await axios.post('/api/logout');
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function RequireAuth({ children }) {
  const { authenticated } = React.useContext(AuthContext);
  const location = useLocation();
  if (authenticated === null) return null; // loading
  if (!authenticated) return <Navigate to="/login" state={{ from: location }} replace />;
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
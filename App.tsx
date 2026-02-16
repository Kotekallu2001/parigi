
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthState, User, Role } from './types.ts';
import Navbar from './components/Navbar.tsx';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import StaffDashboard from './pages/StaffDashboard.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import LogWorkForm from './pages/LogWorkForm.tsx';
import ReportsPage from './pages/ReportsPage.tsx';
import UserManagement from './pages/UserManagement.tsx';

interface AuthContextType {
  auth: AuthState;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const ProtectedRoute = ({ children, allowedRoles }: React.PropsWithChildren<{ allowedRoles?: Role[] }>) => {
  const { auth } = useAuth();
  
  if (!auth.isAuthenticated || !auth.user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles) {
    // Perform case-insensitive role check to handle different spreadsheet data formats
    const userRoleLower = auth.user.role.toLowerCase();
    const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRoleLower);
    
    if (!isAllowed) {
      console.warn(`Access Denied: User role "${auth.user.role}" not in allowed list [${allowedRoles.join(', ')}]`);
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const saved = localStorage.getItem('wassan_auth');
    return saved ? JSON.parse(saved) : { user: null, isAuthenticated: false };
  });

  const login = (user: User) => {
    const newState = { user, isAuthenticated: true };
    setAuth(newState);
    localStorage.setItem('wassan_auth', JSON.stringify(newState));
  };

  const logout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('wassan_auth');
  };

  const isAdmin = auth.user?.role.toLowerCase() === Role.ADMIN.toLowerCase();

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={auth.isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  {isAdmin ? <AdminDashboard /> : <StaffDashboard />}
                </ProtectedRoute>
              } />

              <Route path="/log-work" element={
                <ProtectedRoute allowedRoles={[Role.CLUSTER_FRP, Role.FRP, Role.CRP, Role.PROJECT_STAFF, Role.ADMIN]}>
                  <LogWorkForm />
                </ProtectedRoute>
              } />

              <Route path="/reports" element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <UserManagement />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <footer className="bg-slate-900 text-white py-6 text-center text-sm">
            <p>&copy; 2024 Wassan Vikarabad Field Operations Monitoring. All Rights Reserved.</p>
          </footer>
        </div>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;

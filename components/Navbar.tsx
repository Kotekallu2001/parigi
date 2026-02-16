
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Role } from '../types';

const Navbar: React.FC = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Gallery', path: '/', hash: '#gallery' },
    { name: 'Dashboard', path: '/dashboard', private: true },
    { name: 'Log Work', path: '/log-work', private: true },
    { name: 'Reports', path: '/reports', private: true },
    { name: 'Users', path: '/admin/users', private: true, role: Role.ADMIN },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (!link.private) return true;
    if (link.private && !auth.isAuthenticated) return false;
    
    if (link.role && auth.user?.role) {
      const userRoleLower = auth.user.role.toLowerCase();
      const linkRoleLower = link.role.toLowerCase();
      if (userRoleLower !== linkRoleLower) return false;
    }
    
    return true;
  });

  return (
    <nav className="bg-white border-b sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                W
              </div>
              <span className="text-xl font-bold tracking-tight text-indigo-900 hidden sm:block">Wassan Vikarabad</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {filteredLinks.map((link) => (
              <Link
                key={link.path + (link.hash || '')}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {auth.isAuthenticated ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l">
                <div className="text-right leading-none">
                  <div className="text-sm font-semibold text-slate-900">{auth.user?.username}</div>
                  <div className="text-xs text-slate-500">{auth.user?.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-600"
            >
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-b">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {filteredLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
              >
                {link.name}
              </Link>
            ))}
            {auth.isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

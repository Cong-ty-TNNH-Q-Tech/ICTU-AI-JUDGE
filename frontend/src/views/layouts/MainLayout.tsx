import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useAuthVM } from '../../viewmodels/useAuthVM';
import IctuLogo from '../../assets/ictu-logo.png';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuthVM();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    // Trong môi trường dev chưa có backend thực sự, mock logout ngay
    try {
      await logout();
    } catch {
      useAuthStore.getState().logout();
    }
    navigate('/login');
  };

  const navLinks = [
    { name: 'Challenges', path: '/challenges' },
  ];

  if (user?.role === 'ADMIN') {
    navLinks.push({ name: 'Admin Panel', path: '/admin' });
  }

  return (
    <div className="min-h-screen bg-bg-dark flex flex-col font-inter">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-bg-dark/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-2 group">
                <img src={IctuLogo} alt="ICTU Logo" className="h-8 w-auto object-contain" />
                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 group-hover:to-white transition-all">
                  ICTU AI JUDGE CHALLENGE
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block mx-auto">
              <div className="flex items-baseline space-x-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-surface-dark text-white shadow-sm border border-slate-800'
                          : 'text-slate-400 hover:text-white hover:bg-surface-dark/50'
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* User Section */}
            <div className="hidden md:block">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 hover:bg-surface-dark p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-dark"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-sm font-bold text-white shadow-sm">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-surface-dark border border-slate-800 py-1 origin-top-right ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-3 border-b border-slate-800">
                        <p className="text-sm text-white font-medium truncate">{user?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email || 'user@ictu.edu.vn'}</p>
                      </div>
                      <div className="px-1 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                >
                  Đăng nhập
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-dark focus:outline-none"
              >
                <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-surface-dark pb-3 pt-2">
            <div className="px-2 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-base font-medium ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              
              {isAuthenticated ? (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                  className="w-full text-left mt-4 block px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-red-400/10"
                >
                  Đăng xuất
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="mt-4 block px-3 py-2 rounded-lg text-base font-medium text-white bg-primary text-center"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      
      {/* Simple Footer */}
      <footer className="py-6 border-t border-slate-800/50 mt-auto">
        <div className="text-center text-sm text-slate-500">
          &copy; 2026 ICTU AI Club. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

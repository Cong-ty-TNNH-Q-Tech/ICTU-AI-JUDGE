import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { useAuthVM } from '../../viewmodels/useAuthVM';
import IctuLogo from '../../assets/ictu-logo.png';
import ErrorBoundary from '../components/ErrorBoundary';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuthVM();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try { await logout(); } catch { useAuthStore.getState().logout(); }
    navigate('/login');
  };

  const navLinks = [
    { name: 'Contests', path: '/contests' },
    { name: 'Challenges', path: '/challenges' },
    ...(user?.role === 'ADMIN' ? [{ name: 'Admin', path: '/admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark flex flex-col font-inter">
      <nav className="sticky top-0 z-50 bg-surface/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-surface-200/80 dark:border-gray-800/80">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <img src={IctuLogo} alt="ICTU" className="h-7 w-auto" />
                <span className="font-bold text-[15px] text-content-primary dark:text-content-dark-primary tracking-tight">
                  ICTU AI Judge
                </span>
              </Link>

              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                      `px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-surface-100 dark:bg-gray-800 text-content-primary dark:text-content-dark-primary'
                          : 'text-content-secondary dark:text-content-dark-secondary hover:text-content-primary dark:hover:text-content-dark-primary'
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="relative group">
                <svg className="w-[14px] h-[14px] absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary transition-colors group-focus-within:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search competitions..."
                  className="w-48 focus:w-64 pl-8 pr-3 py-[7px] text-[13px] rounded-lg bg-surface-50 dark:bg-gray-800/60 border border-surface-200 dark:border-gray-700/60 text-content-primary dark:text-content-dark-primary placeholder:text-content-tertiary/60 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-200 dark:focus:ring-primary-800/40 transition-all duration-300"
                />
              </div>

              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 rounded-md hover:bg-surface-50 dark:hover:bg-gray-800 px-2 py-1 transition-colors"
                  >
                    {/* Avatar: ảnh thật nếu có, fallback về initials */}
                    <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-surface dark:ring-surface-dark flex-shrink-0">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-[11px] font-bold text-white">
                          {user?.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <span className="text-[13px] font-medium text-content-primary dark:text-content-dark-primary hidden lg:inline">{user?.full_name}</span>
                    <svg className={`w-3.5 h-3.5 text-content-tertiary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-surface dark:bg-surface-dark border border-surface-200 dark:border-gray-800 shadow-elevated py-1 animate-scale-in origin-top-right">
                      <div className="px-3.5 py-2.5 border-b border-surface-200 dark:border-gray-800">
                        <p className="text-[13px] font-semibold text-content-primary dark:text-content-dark-primary truncate">{user?.full_name}</p>
                        <p className="text-[11px] text-content-tertiary truncate">{user?.email}</p>
                      </div>
                      <div className="p-1">
                        {/* Link tới trang Profile */}
                        <button
                          onClick={() => { setIsDropdownOpen(false); navigate(`/profile/${user?.id}`); }}
                          className="w-full text-left px-3 py-2 text-[13px] text-content-secondary dark:text-content-dark-secondary hover:bg-surface-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          Hồ sơ của tôi
                        </button>
                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn-primary text-[13px] py-2 px-4">Sign in</Link>
              )}
            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-lg text-content-secondary hover:bg-surface-50 dark:hover:bg-gray-800 transition-colors">
              {isMobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-surface-200 dark:border-gray-800 bg-surface dark:bg-surface-dark animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <NavLink key={link.name} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-surface-100 dark:bg-gray-800 text-content-primary dark:text-content-dark-primary' : 'text-content-secondary'}`}>
                  {link.name}
                </NavLink>
              ))}
              {isAuthenticated && (
                <button onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-2">Sign out</button>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      <footer className="border-t border-surface-200/60 dark:border-gray-800/60 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-[12px] text-content-tertiary">&copy; 2026 ICTU AI Club</span>
          <span className="text-[12px] text-content-tertiary">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { DumbbellIcon, ChartBarIcon, ClipboardListIcon, SparklesIcon, MenuIcon, CloseIcon, UserIcon, LogoutIcon, BookOpenIcon, UserCircleIcon } from '../../constants';

const Header: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        isActive
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-lg'
            : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
        }`;
    
    const mobileNavLinkClasses = (isActive: boolean): string =>
         `flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-all ${
        isActive
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-lg'
            : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
        }`;

    const ThemeToggle = () => (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );

    const renderNavLinks = (isMobile = false) => (
        <>
            <NavLink to="/" className={navLinkClasses} end onClick={() => isMobile && setIsMobileMenuOpen(false)}>
                <ChartBarIcon /><span>Dashboard</span>
            </NavLink>
            <NavLink to="/log" className={navLinkClasses} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
                <ClipboardListIcon /><span>Log Workout</span>
            </NavLink>
            <NavLink to="/templates" className={navLinkClasses} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
                 <BookOpenIcon /><span>Templates</span>
            </NavLink>
            <NavLink to="/recovery" className={navLinkClasses} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
                 <UserIcon /><span>Recovery</span>
            </NavLink>
            <NavLink to="/my-plans" className={navLinkClasses} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
                 <BookOpenIcon /><span>My Plans</span>
            </NavLink>
            <NavLink to="/generator" className={navLinkClasses} onClick={() => isMobile && setIsMobileMenuOpen(false)}>
                <SparklesIcon /><span>AI Generator</span>
            </NavLink>
        </>
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

  return (
    <header className="bg-white/80 dark:bg-black/20 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-200 dark:border-white/10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
                <Link to="/" className="flex-shrink-0 flex items-center gap-2 text-gray-900 dark:text-white font-bold text-xl">
                    <DumbbellIcon className="text-emerald-500"/>
                    <span className="hidden sm:block">GymLog AI</span>
                </Link>
            </div>

            <div className="hidden md:flex items-center gap-2">
                {currentUser && renderNavLinks()}
            </div>
            
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <div className="hidden md:block">
                     {currentUser ? (
                         <div className="relative" ref={profileMenuRef}>
                           <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">
                                <UserIcon/> {currentUser.username}
                           </button>
                           {isProfileMenuOpen && (
                               <div className="absolute right-0 mt-2 w-48 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 dark:border-white/10 py-1">
                                   <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10">
                                       <UserCircleIcon/> Profile
                                   </Link>
                                   <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10">
                                       <LogoutIcon/> Logout
                                   </button>
                               </div>
                           )}
                         </div>
                     ) : (
                        <div className="flex items-center gap-2">
                           <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-black/10 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg hover:bg-black/20 dark:hover:bg-white/20">Login</Link>
                           <Link to="/signup" className="px-4 py-2 text-sm font-bold text-black bg-emerald-500 rounded-lg hover:bg-emerald-600">Sign Up</Link>
                        </div>
                     )}
                </div>
                <div className="md:hidden flex items-center">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        aria-controls="mobile-menu"
                        aria-expanded="false"
                    >
                        <span className="sr-only">Open main menu</span>
                        {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                    </button>
                </div>
            </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {currentUser ? (
                <>
                    {renderNavLinks(true)}
                     <div className="border-t border-gray-200 dark:border-white/10 mt-3 pt-3">
                        <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={mobileNavLinkClasses(false)}>
                           <UserCircleIcon /><span>Profile</span>
                        </Link>
                        <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className={`${mobileNavLinkClasses(false)} w-full`}>
                            <LogoutIcon /><span>Logout</span>
                        </button>
                     </div>
                </>
            ) : (
                <div className="flex flex-col space-y-2">
                   <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-black/10 dark:bg-white/10 rounded-lg hover:bg-black/20 dark:hover:bg-white/20">Login</Link>
                   <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-center px-4 py-2 text-sm font-bold text-black bg-emerald-500 rounded-lg hover:bg-emerald-600">Sign Up</Link>
                </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
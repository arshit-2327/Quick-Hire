import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, User, LogOut, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser, logout, openLogin, openRegister } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F0E0D]/85 backdrop-blur-md border-b border-[#24211E] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Left: Brand Logo & Wordmark (Squarespace Minimalist Style) */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-extrabold tracking-tighter text-sm transition-transform group-hover:scale-105 shadow-sm">
            QH
          </div>
          <span className="font-extrabold tracking-[0.2em] text-sm text-[#ECE8E1] uppercase font-sans-clean">
            QUICK HIRE
          </span>
        </Link>

        {/* Center: Editorial Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[#A6A096]">
          <Link
            to="/"
            className={`transition-colors hover:text-white ${
              isActive('/') ? 'text-white' : ''
            }`}
          >
            Overview
          </Link>
          <Link
            to="/candidate"
            className={`transition-colors hover:text-white ${
              isActive('/candidate') ? 'text-white' : ''
            }`}
          >
            Candidate Portal
          </Link>
          <Link
            to="/recruiter"
            className={`transition-colors hover:text-white ${
              isActive('/recruiter') ? 'text-white' : ''
            }`}
          >
            Recruiter Engine
          </Link>
          <Link
            to="/settings"
            className={`transition-colors hover:text-white ${
              isActive('/settings') ? 'text-white' : ''
            }`}
          >
            System Status
          </Link>
        </nav>

        {/* Right: Auth & CTAs (Exact Squarespace style with white GET STARTED button) */}
        <div className="flex items-center gap-4">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-[#ECE8E1] leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-amber-500/90 font-medium uppercase tracking-wider">
                  {currentUser.role === 'RECRUITER' ? (currentUser.companyName || 'Recruiter') : 'Candidate'}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-2 text-[#8E877E] hover:text-white rounded-lg hover:bg-[#201E1B] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <button
                onClick={() => openLogin('STUDENT')}
                className="text-xs font-bold tracking-widest uppercase text-[#C4BEB4] hover:text-white transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => openRegister('STUDENT')}
                className="px-5 py-2.5 bg-white text-black font-bold text-xs tracking-wider uppercase rounded-sm hover:bg-[#EBE5DB] active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

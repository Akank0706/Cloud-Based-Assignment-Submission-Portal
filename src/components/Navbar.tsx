import React from 'react';
import { useAuth } from '../services/authContext';
import {
  BookOpen,
  GraduationCap,
  Cloud,
  CheckCircle2,
  Database,
  LogOut,
  UserCheck,
  ShieldAlert,
  HelpCircle,
  HardDrive
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const { currentUser, logout, switchDemoUser } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top micro banner for Cloud Context */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-emerald-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
            Cloud Status: Operational
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-slate-400">
            Region: <span className="text-slate-200">asia-south1 (Serverless / Firestore)</span>
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400">
            Server Auth: <span className="text-sky-300">RBAC Token Active</span>
          </span>
        </div>

        {/* Quick Demo Switcher */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 font-medium">Switch Role:</span>
          <button
            onClick={() => switchDemoUser('teacher')}
            className={`px-2 py-0.5 rounded transition ${
              currentUser?.role === 'teacher'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Switch to Teacher account (Dr. Alan Vance)"
          >
            Teacher Demo
          </button>
          <button
            onClick={() => switchDemoUser('student')}
            className={`px-2 py-0.5 rounded transition ${
              currentUser?.role === 'student'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Switch to Student account (Elena Rostova)"
          >
            Student Demo
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  CloudAssign
                </span>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                  Cloud Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Assignment Submission & Feedback Engine
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                currentTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {currentUser?.role === 'teacher' ? 'Teacher Dashboard' : 'Student Portal'}
            </button>

            <button
              onClick={() => setCurrentTab('assignments')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                currentTab === 'assignments'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Assignments & Submissions
            </button>

            <button
              onClick={() => setCurrentTab('storage')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition flex items-center space-x-1.5 ${
                currentTab === 'storage'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HardDrive className="w-4 h-4 text-slate-500" />
              <span>Object Storage</span>
            </button>

            <button
              onClick={() => setCurrentTab('tests')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition flex items-center space-x-1.5 ${
                currentTab === 'tests'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Automated Tests (25)</span>
            </button>

            <button
              onClick={() => setCurrentTab('architecture')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition flex items-center space-x-1.5 ${
                currentTab === 'architecture'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>Cloud Concepts & Viva</span>
            </button>
          </nav>

          {/* User Profile / Auth Area */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-800 flex items-center justify-end space-x-1.5">
                    <span>{currentUser.name}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        currentUser.role === 'teacher'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{currentUser.email}</div>
                </div>

                <button
                  onClick={logout}
                  className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition border border-slate-200"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="flex lg:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-100">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1 text-xs whitespace-nowrap rounded font-medium ${
              currentTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentTab('assignments')}
            className={`px-3 py-1 text-xs whitespace-nowrap rounded font-medium ${
              currentTab === 'assignments' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setCurrentTab('storage')}
            className={`px-3 py-1 text-xs whitespace-nowrap rounded font-medium ${
              currentTab === 'storage' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Storage Bucket
          </button>
          <button
            onClick={() => setCurrentTab('tests')}
            className={`px-3 py-1 text-xs whitespace-nowrap rounded font-medium ${
              currentTab === 'tests' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Tests (25)
          </button>
          <button
            onClick={() => setCurrentTab('architecture')}
            className={`px-3 py-1 text-xs whitespace-nowrap rounded font-medium ${
              currentTab === 'architecture' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Cloud Viva
          </button>
        </div>
      </div>
    </header>
  );
};

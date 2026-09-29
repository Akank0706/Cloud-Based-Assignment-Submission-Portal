import React, { useState } from 'react';
import { AuthProvider, useAuth } from './services/authContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { StudentDashboard } from './components/StudentDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentAssignmentDetail } from './components/StudentAssignmentDetail';
import { TeacherReviewModal } from './components/TeacherReviewModal';
import { StorageExplorer } from './components/StorageExplorer';
import { AutomatedTestView } from './components/AutomatedTestView';
import { CloudConceptsViva } from './components/CloudConceptsViva';
import { AuthModal } from './components/AuthModal';
import { Submission, Assignment } from './types';
import { cloudDatabase } from './services/databaseService';
import { Cloud, CheckCircle2, Shield, Github, BookOpen } from 'lucide-react';

function MainAppContent() {
  const { currentUser, isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [submissionToReview, setSubmissionToReview] = useState<Submission | null>(null);
  const [assignmentForReview, setAssignmentForReview] = useState<Assignment | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleOpenReviewModal = async (submission: Submission) => {
    setSubmissionToReview(submission);
    const assign = await cloudDatabase.getAssignmentById(submission.assignmentId);
    setAssignmentForReview(assign);
  };

  const handleCloseReviewModal = () => {
    setSubmissionToReview(null);
    setAssignmentForReview(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Initializing Cloud Environment & Authoritative Clock...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setSelectedAssignmentId(null);
          setCurrentTab(tab);
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* If student selected a specific assignment to upload / view */}
        {selectedAssignmentId ? (
          <StudentAssignmentDetail
            assignmentId={selectedAssignmentId}
            onBack={() => setSelectedAssignmentId(null)}
          />
        ) : currentTab === 'dashboard' ? (
          currentUser ? (
            currentUser.role === 'teacher' ? (
              <TeacherDashboard
                onOpenReviewModal={handleOpenReviewModal}
                onOpenConcepts={() => setCurrentTab('architecture')}
              />
            ) : (
              <StudentDashboard
                onSelectAssignment={(id) => setSelectedAssignmentId(id)}
                onOpenConcepts={() => setCurrentTab('architecture')}
              />
            )
          ) : (
            <LandingPage
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onExploreDemo={() => setCurrentTab('dashboard')}
            />
          )
        ) : currentTab === 'assignments' ? (
          currentUser?.role === 'teacher' ? (
            <TeacherDashboard
              onOpenReviewModal={handleOpenReviewModal}
              onOpenConcepts={() => setCurrentTab('architecture')}
            />
          ) : (
            <StudentDashboard
              onSelectAssignment={(id) => setSelectedAssignmentId(id)}
              onOpenConcepts={() => setCurrentTab('architecture')}
            />
          )
        ) : currentTab === 'storage' ? (
          <StorageExplorer />
        ) : currentTab === 'tests' ? (
          <AutomatedTestView />
        ) : currentTab === 'architecture' ? (
          <CloudConceptsViva />
        ) : null}
      </main>

      {/* Teacher Review & Grading Modal */}
      {submissionToReview && (
        <TeacherReviewModal
          submission={submissionToReview}
          assignment={assignmentForReview}
          onClose={handleCloseReviewModal}
          onGraded={() => {
            // Trigger refresh
            handleCloseReviewModal();
          }}
        />
      )}

      {/* Auth Modal for Student / Teacher Login & Register */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole="student"
      />

      {/* Academic Project Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Cloud className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">
              Cloud-Based Student Assignment Submission & Feedback Portal
            </span>
            <span>•</span>
            <span>Cloud Computing Course Project</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentTab('architecture')}
              className="hover:text-indigo-600 transition"
            >
              Viva Preparation (10 Q&As)
            </button>
            <button
              onClick={() => setCurrentTab('tests')}
              className="hover:text-indigo-600 transition"
            >
              Test Suite (25 Tests)
            </button>
            <button
              onClick={() => setCurrentTab('storage')}
              className="hover:text-indigo-600 transition"
            >
              Storage Inspector
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

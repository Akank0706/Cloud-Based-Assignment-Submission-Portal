import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { Assignment, Submission } from '../types';
import { cloudDatabase } from '../services/databaseService';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  ChevronRight,
  Calendar,
  AlertCircle,
  FileCheck2,
  Download,
  BookOpen
} from 'lucide-react';

interface StudentDashboardProps {
  onSelectAssignment: (assignmentId: string) => void;
  onOpenConcepts: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectAssignment,
  onOpenConcepts
}) => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED'>('ALL');
  const [stats, setStats] = useState({
    totalAssignments: 0,
    pendingCount: 0,
    submittedCount: 0,
    gradedCount: 0,
    lateCount: 0
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [assignList, subList, dashboardStats] = await Promise.all([
        cloudDatabase.getAssignments(),
        cloudDatabase.getSubmissionsByStudent(currentUser.uid, currentUser),
        cloudDatabase.getStudentDashboardStats(currentUser.uid, currentUser)
      ]);
      setAssignments(assignList);
      setSubmissions(subList);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Map latest submission per assignment
  const latestSubmissionsByAssign = new Map<string, Submission>();
  submissions.forEach((s) => {
    const existing = latestSubmissionsByAssign.get(s.assignmentId);
    if (!existing || s.version > existing.version) {
      latestSubmissionsByAssign.set(s.assignmentId, s);
    }
  });

  const filteredAssignments = assignments.filter((a) => {
    const sub = latestSubmissionsByAssign.get(a.id);
    if (filter === 'PENDING') return !sub;
    if (filter === 'SUBMITTED') return !!sub;
    if (filter === 'GRADED') return sub?.submissionStatus === 'GRADED';
    return true;
  });

  const gradedSubmissions = submissions.filter((s) => s.submissionStatus === 'GRADED');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Student Workspace
            </span>
            <span className="text-xs text-slate-500">
              ID: <span className="font-mono">{currentUser?.uid}</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Welcome back, {currentUser?.name}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Cloud assignment submission tracking, server-side deadline validation, and real-time faculty feedback.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenConcepts}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Cloud Architecture Notes</span>
          </button>
        </div>
      </div>

      {/* Dynamic Metrics Cards (computed directly from Firestore DB, not hardcoded!) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Coursework
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.totalAssignments}</span>
            <span className="text-[11px] text-slate-500">Live sync</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Pending
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700">{stats.pendingCount}</span>
            <span className="text-[11px] text-amber-600">Requires upload</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
              Submitted
            </span>
            <CheckCircle className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-sky-700">{stats.submittedCount}</span>
            <span className="text-[11px] text-sky-600">In object store</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
              Late Subs
            </span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-red-700">{stats.lateCount}</span>
            <span className="text-[11px] text-red-600">Past server deadline</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Graded & Reviewed
            </span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">{stats.gradedCount}</span>
            <span className="text-[11px] text-emerald-600">With feedback</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column: Assignment List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Header & Filter Tabs */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Course Assignments</h2>
                <p className="text-xs text-slate-500">
                  Select an assignment to upload, verify deadline, or view version history.
                </p>
              </div>

              {/* Filters */}
              <div className="flex space-x-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                {(['ALL', 'PENDING', 'SUBMITTED', 'GRADED'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-2.5 py-1 rounded font-medium transition ${
                      filter === tab
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* List Body */}
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Fetching coursework from Cloud Database...
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="p-12 text-center">
                <FileCheck2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-700">No assignments found</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {filter === 'PENDING'
                    ? 'Great work! You have no pending submissions.'
                    : 'There are no assignments matching your current filter.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAssignments.map((assignment) => {
                  const sub = latestSubmissionsByAssign.get(assignment.id);
                  const deadlineDate = new Date(assignment.deadline);
                  const isOverdue = new Date() > deadlineDate;

                  return (
                    <div
                      key={assignment.id}
                      onClick={() => onSelectAssignment(assignment.id)}
                      className="p-5 hover:bg-slate-50/80 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {assignment.courseName}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">Max: {assignment.maxMarks} marks</span>
                        </div>

                        <h3 className="font-semibold text-slate-900 text-base group-hover:text-indigo-600 transition">
                          {assignment.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 max-w-xl">
                          {assignment.description}
                        </p>

                        <div className="flex items-center space-x-3 text-xs text-slate-500 pt-1">
                          <span className="flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            Due: {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOverdue && !sub && (
                            <span className="text-red-600 font-medium flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Past deadline
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badges & Button */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                        {sub ? (
                          sub.submissionStatus === 'GRADED' ? (
                            <div className="text-right">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Graded: {sub.marks} / {assignment.maxMarks}
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">Version {sub.version}</div>
                            </div>
                          ) : sub.submissionStatus === 'LATE' ? (
                            <div className="text-right">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                                Submitted Late
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">Version {sub.version}</div>
                            </div>
                          ) : (
                            <div className="text-right">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
                                Submitted (On Time)
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">Version {sub.version}</div>
                            </div>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            Not Submitted
                          </span>
                        )}

                        <div className="flex items-center text-xs text-indigo-600 font-medium hover:text-indigo-800">
                          <span>{sub ? 'View / Resubmit' : 'Submit Work'}</span>
                          <ChevronRight className="w-4 h-4 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Recent Feedback & Deadlines */}
        <div className="space-y-6">
          {/* Recent Faculty Feedback */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Recent Teacher Feedback</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                {gradedSubmissions.length} review(s)
              </span>
            </div>

            {gradedSubmissions.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">
                No submissions have been graded yet. When a teacher provides marks and written feedback, they will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {gradedSubmissions.slice(0, 3).map((sub) => {
                  const assign = assignments.find((a) => a.id === sub.assignmentId);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => onSelectAssignment(sub.assignmentId)}
                      className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 cursor-pointer hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 truncate max-w-[160px]">
                          {assign?.title || 'Assignment'}
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {sub.marks} / {assign?.maxMarks || 100}
                        </span>
                      </div>
                      <p className="text-slate-600 italic line-clamp-3 bg-white p-2 rounded border border-slate-100">
                        "{sub.feedback}"
                      </p>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Reviewed by: {sub.gradedBy || 'Faculty'}</span>
                        <span>{sub.gradedAt ? new Date(sub.gradedAt).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cloud Concepts Tip Card */}
          <div className="bg-indigo-900 text-white rounded-xl p-5 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
              Cloud Computing Insight
            </span>
            <h4 className="font-semibold text-sm">Object Storage vs Database</h4>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Why aren't PDFs saved directly in Firestore or SQL? Binary blobs inflate database sizes, degrade query indexing performance, and increase costs. Cloud architecture decouples structured metadata (Firestore) from bulk binary payload (Firebase Storage / S3).
            </p>
            <button
              onClick={onOpenConcepts}
              className="w-full mt-2 py-2 px-3 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition text-center"
            >
              Review Viva Questions & Answers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

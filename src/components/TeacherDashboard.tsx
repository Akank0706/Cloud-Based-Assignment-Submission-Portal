import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { Assignment, Course, Submission, User } from '../types';
import { cloudDatabase } from '../services/databaseService';
import {
  BookOpen,
  PlusCircle,
  FileText,
  Users,
  CheckSquare,
  Clock,
  AlertTriangle,
  Award,
  Trash2,
  Edit,
  Eye,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface TeacherDashboardProps {
  onOpenReviewModal: (submission: Submission) => void;
  onOpenConcepts: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onOpenReviewModal,
  onOpenConcepts
}) => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalStudents: 0,
    totalSubmissions: 0,
    pendingReviews: 0,
    lateSubmissions: 0,
    gradedSubmissions: 0
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submissions' | 'assignments' | 'courses'>('submissions');

  // Filter state for submissions
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateAssignModalOpen, setIsCreateAssignModalOpen] = useState(false);
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  // Form states for new assignment
  const [newTitle, setNewTitle] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState(100);
  const [newMaxFileSize, setNewMaxFileSize] = useState(20);
  const [newAllowedTypes, setNewAllowedTypes] = useState<string[]>([
    'application/pdf',
    '.pdf',
    '.docx'
  ]);
  const [newAllowLate, setNewAllowLate] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states for new course
  const [courseNameInput, setCourseNameInput] = useState('');
  const [courseCodeInput, setCourseCodeInput] = useState('');
  const [courseDescInput, setCourseDescInput] = useState('');

  const loadData = async () => {
    if (!currentUser || currentUser.role !== 'teacher') return;
    setLoading(true);
    try {
      const [cList, aList, sList, dStats] = await Promise.all([
        cloudDatabase.getCourses(),
        cloudDatabase.getAssignments(),
        cloudDatabase.getAllSubmissions(currentUser),
        cloudDatabase.getTeacherDashboardStats(currentUser)
      ]);
      setCourses(cList);
      setAssignments(aList);
      setSubmissions(sList);
      setStats(dStats);
      if (cList.length > 0 && !newCourseId) {
        setNewCourseId(cList[0].id);
      }
    } catch (err) {
      console.error('Failed to load teacher dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);

    try {
      if (!newTitle.trim()) throw new Error('Assignment title is required.');
      if (!newDeadline) throw new Error('Deadline date and time is required.');
      if (!newCourseId) throw new Error('Please select a course.');

      const selectedCourse = courses.find((c) => c.id === newCourseId);

      await cloudDatabase.createAssignment(
        {
          courseId: newCourseId,
          courseName: selectedCourse ? selectedCourse.courseName : 'General Course',
          title: newTitle.trim(),
          description: newDescription.trim(),
          deadline: new Date(newDeadline).toISOString(),
          maxMarks: Number(newMaxMarks),
          maxFileSizeMB: Number(newMaxFileSize),
          allowedFileTypes: newAllowedTypes,
          allowLateSubmissions: newAllowLate,
          createdBy: currentUser.uid
        },
        currentUser
      );

      setIsCreateAssignModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewDeadline('');
      await loadData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      if (!courseNameInput.trim() || !courseCodeInput.trim()) {
        alert('Course code and course name are required.');
        return;
      }
      await cloudDatabase.createCourse(
        courseNameInput,
        courseCodeInput,
        courseDescInput,
        currentUser
      );
      setIsCreateCourseModalOpen(false);
      setCourseNameInput('');
      setCourseCodeInput('');
      setCourseDescInput('');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!currentUser || !assignmentToDelete) return;
    try {
      await cloudDatabase.deleteAssignment(assignmentToDelete.id, currentUser);
      setAssignmentToDelete(null);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export submissions as CSV (Industry Feature)
  const handleExportCSV = () => {
    if (submissions.length === 0) {
      alert('No submissions available to export.');
      return;
    }
    const headers = [
      'Submission ID',
      'Student Name',
      'Student Email',
      'Course ID',
      'Assignment ID',
      'Version',
      'Status',
      'Marks',
      'Submitted At (UTC)',
      'Storage Path'
    ];
    const rows = submissions.map((s) => [
      s.id,
      `"${s.studentName}"`,
      s.studentEmail,
      s.courseId,
      s.assignmentId,
      s.version,
      s.submissionStatus,
      s.marks !== null ? s.marks : 'Pending',
      s.submittedAt,
      `"${s.storagePath}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `course_grades_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (selectedCourseFilter !== 'ALL' && s.courseId !== selectedCourseFilter) return false;
    if (selectedStatusFilter === 'PENDING' && s.submissionStatus !== 'SUBMITTED' && s.submissionStatus !== 'LATE') {
      return false;
    }
    if (selectedStatusFilter === 'GRADED' && s.submissionStatus !== 'GRADED') return false;
    if (selectedStatusFilter === 'LATE' && s.submissionStatus !== 'LATE') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.studentName.toLowerCase().includes(q);
      const matchEmail = s.studentEmail.toLowerCase().includes(q);
      const matchFile = s.fileName.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchFile) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Teacher Faculty Console
            </span>
            <span className="text-xs text-slate-500">
              Instructor: <span className="font-semibold text-slate-800">{currentUser?.name}</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Faculty Assignment & Evaluation Hub</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Manage course syllabi, set server deadlines, review cloud object uploads, and release certified feedback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCreateAssignModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>

          <button
            onClick={() => setIsCreateCourseModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Add Course</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition border border-slate-300 cursor-pointer"
            title="Export all grades to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Real Firestore Dashboard Metric Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Assignments
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.totalAssignments}</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Enrolled Students
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.totalStudents}</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Submissions
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats.totalSubmissions}</span>
            <CheckSquare className="w-4 h-4 text-sky-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Pending Reviews
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700">{stats.pendingReviews}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider block">
            Late Submissions
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-red-700">{stats.lateSubmissions}</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Graded & Closed
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">{stats.gradedSubmissions}</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 text-sm">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`py-3 px-5 font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'submissions'
              ? 'border-indigo-600 text-indigo-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Student Submissions Review</span>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
            {submissions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`py-3 px-5 font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'assignments'
              ? 'border-indigo-600 text-indigo-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Manage Assignments</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            {assignments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`py-3 px-5 font-semibold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'courses'
              ? 'border-indigo-600 text-indigo-600 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Course Modules</span>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            {courses.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Submissions Review Table */}
      {activeTab === 'submissions' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Course filter */}
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
              >
                <option value="ALL">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} - {c.courseName}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="LATE">Late Submissions</option>
                <option value="GRADED">Graded</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search student or file..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No submissions found</p>
              <p className="text-slate-400 mt-1">No student uploads match your selected criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-4 py-3">Assignment & Course</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Submitted At</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub) => {
                    const assign = assignments.find((a) => a.id === sub.assignmentId);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{sub.studentName}</div>
                          <div className="text-[11px] text-slate-400">{sub.studentEmail}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-medium text-slate-800 truncate max-w-xs">
                            {assign?.title || 'Unknown Assignment'}
                          </div>
                          <div className="text-[11px] text-slate-400">{assign?.courseName}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                            v{sub.version}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div>{new Date(sub.submittedAt).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          {sub.submissionStatus === 'GRADED' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Graded
                            </span>
                          ) : sub.submissionStatus === 'LATE' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 border border-red-200">
                              Late Submission
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                              Submitted
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 font-semibold">
                          {sub.marks !== null ? (
                            <span className="text-emerald-700 font-bold">
                              {sub.marks} / {assign?.maxMarks || 100}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not graded</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => onOpenReviewModal(sub)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-lg transition border border-indigo-200 cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>{sub.marks !== null ? 'Edit Grade' : 'Grade & Feedback'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Assignment Management */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Coursework & Deadlines</h3>
              <p className="text-xs text-slate-500">
                Created assignments are stored in Firestore with server timestamps.
              </p>
            </div>
            <button
              onClick={() => setIsCreateAssignModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Assignment</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {assignments.map((assign) => {
              const assignSubs = submissions.filter((s) => s.assignmentId === assign.id);
              const deadlineDate = new Date(assign.deadline);
              const isPast = new Date() > deadlineDate;

              return (
                <div key={assign.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                        {assign.courseName}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">Max Score: {assign.maxMarks}</span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{assign.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2">{assign.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Deadline: {deadlineDate.toLocaleString()}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>Submissions: <strong>{assignSubs.length}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span className={assign.allowLateSubmissions ? 'text-amber-600' : 'text-slate-500'}>
                        {assign.allowLateSubmissions ? 'Late Allowed' : 'Strict Deadline'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCourseFilter(assign.courseId);
                        setActiveTab('submissions');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      View {assignSubs.length} Submissions
                    </button>

                    <button
                      onClick={() => setAssignmentToDelete(assign)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Courses */}
      {activeTab === 'courses' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Course Catalogs</h3>
              <p className="text-xs text-slate-500">
                Departmental courses managed by faculty.
              </p>
            </div>
            <button
              onClick={() => setIsCreateCourseModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {courses.map((c) => {
              const courseAssigns = assignments.filter((a) => a.courseId === c.id);
              return (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-xs">
                      {c.courseCode}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {courseAssigns.length} assignment(s)
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{c.courseName}</h4>
                  <p className="text-xs text-slate-600">{c.description}</p>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-200">
                    Instructor: {c.teacherName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {isCreateAssignModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Create New Assignment</h3>
              <button
                onClick={() => setIsCreateAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Course</label>
                <select
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} - {c.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Consensus Lab"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Guidelines</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Outline the assignment requirements, deliverables, and rubric..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Server Deadline (UTC / Local)</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Score (Marks)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max File Size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newMaxFileSize}
                    onChange={(e) => setNewMaxFileSize(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Late Policy</label>
                  <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAllowLate}
                      onChange={(e) => setNewAllowLate(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-slate-700">Allow Late Submissions (flagged)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL */}
      {isCreateCourseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Course Module</h3>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS505"
                  value={courseCodeInput}
                  onChange={(e) => setCourseCodeInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Cloud Security & Governance"
                  value={courseNameInput}
                  onChange={(e) => setCourseNameInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={courseDescInput}
                  onChange={(e) => setCourseDescInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  placeholder="Course scope, objectives, prerequisites..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateCourseModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {assignmentToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Delete Assignment?</h3>
              <p className="text-slate-600">
                Are you sure you want to delete <strong>"{assignmentToDelete.title}"</strong>? All associated student submission records will also be removed.
              </p>
            </div>
            <div className="flex justify-center space-x-2 pt-2">
              <button
                onClick={() => setAssignmentToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAssignment}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                Delete Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

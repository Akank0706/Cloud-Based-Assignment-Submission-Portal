import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { Assignment, Submission } from '../types';
import { cloudDatabase } from '../services/databaseService';
import { cloudStorage } from '../services/storageService';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Award,
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  FileText,
  Download,
  AlertTriangle,
  History,
  Info
} from 'lucide-react';

interface StudentAssignmentDetailProps {
  assignmentId: string;
  onBack: () => void;
}

export const StudentAssignmentDetail: React.FC<StudentAssignmentDetailProps> = ({
  assignmentId,
  onBack
}) => {
  const { currentUser } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const assign = await cloudDatabase.getAssignmentById(assignmentId);
      setAssignment(assign);

      const allSubmissions = await cloudDatabase.getSubmissionsByAssignment(assignmentId, currentUser);
      // Student can only see their own
      const mySubs = allSubmissions.filter((s) => s.studentId === currentUser.uid);
      mySubs.sort((a, b) => b.version - a.version); // Latest version first
      setSubmissions(mySubs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [assignmentId, currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleUploadAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !assignment) return;
    setError(null);
    setSuccessMsg(null);

    if (!selectedFile) {
      setError('Please select a file before submitting.');
      return;
    }

    // Step 1: Validate file against assignment configuration
    const validation = cloudStorage.validateFile(
      selectedFile,
      assignment.allowedFileTypes,
      assignment.maxFileSizeMB
    );

    if (!validation.valid) {
      setError(validation.error || 'Invalid file.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Step 2: Calculate target version
      const currentHighestVersion = submissions.length > 0 ? Math.max(...submissions.map((s) => s.version)) : 0;
      const targetVersion = currentHighestVersion + 1;
      const tempSubId = `sub-${Date.now()}`;

      // Step 3: Upload binary stream to Cloud Object Storage
      setUploadProgress(35);
      const storageResult = await cloudStorage.uploadFile(
        selectedFile,
        {
          courseId: assignment.courseId,
          assignmentId: assignment.id,
          studentId: currentUser.uid,
          submissionId: tempSubId,
          version: targetVersion
        },
        (progress) => setUploadProgress(progress)
      );

      setUploadProgress(90);

      // Step 4: Write submission metadata to Cloud Database with server timestamp
      const newSub = await cloudDatabase.submitAssignment({
        assignmentId: assignment.id,
        student: currentUser,
        fileName: selectedFile.name,
        fileUrl: storageResult.downloadUrl,
        storagePath: storageResult.path,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });

      setUploadProgress(100);
      setSuccessMsg(
        `Assignment submitted successfully as Version ${newSub.version}! Status: ${newSub.submissionStatus}`
      );
      setSelectedFile(null);

      // Reload submissions list
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check network or file size.');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        Loading assignment details...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="font-bold text-slate-900">Assignment Not Found</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const deadlineDate = new Date(assignment.deadline);
  const isPastDeadline = new Date() > deadlineDate;
  const latestSub = submissions[0] || null;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assignment List</span>
        </button>

        <span className="text-xs font-mono text-slate-500">
          ID: {assignment.id}
        </span>
      </div>

      {/* Assignment Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                {assignment.courseName}
              </span>
              <span className="text-xs text-slate-500">
                Instructor: {assignment.teacherName}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {assignment.description}
            </p>
          </div>

          {/* Marks & Status summary badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex md:flex-col items-center justify-between gap-3 min-w-[200px] shrink-0">
            <div className="text-left md:text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Maximum Score
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {assignment.maxMarks} <span className="text-xs font-normal text-slate-500">marks</span>
              </span>
            </div>

            <div className="text-right md:text-center border-t md:border-t-0 md:pt-0 pt-2 border-slate-200 w-full">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Your Status
              </span>
              {latestSub ? (
                latestSub.submissionStatus === 'GRADED' ? (
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-full border border-emerald-300">
                    Graded: {latestSub.marks} / {assignment.maxMarks}
                  </span>
                ) : latestSub.submissionStatus === 'LATE' ? (
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-800 font-semibold text-xs rounded-full border border-red-300">
                    Submitted Late
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-sky-100 text-sky-800 font-semibold text-xs rounded-full border border-sky-300">
                    Submitted (v{latestSub.version})
                  </span>
                )
              ) : (
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 font-semibold text-xs rounded-full border border-amber-300">
                  Pending Upload
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-semibold block text-slate-800">Server Deadline:</span>
              <span className={isPastDeadline ? 'text-red-600 font-medium' : 'text-slate-600'}>
                {deadlineDate.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-600">
            <FileText className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-semibold block text-slate-800">Allowed File Formats:</span>
              <span>{assignment.allowedFileTypes.join(', ')}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <span className="font-semibold block text-slate-800">Max File Size:</span>
              <span>{assignment.maxFileSizeMB} MB (Cloud Object Limit)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Submission Upload Form + Version History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-base">
              {latestSub ? 'Resubmit Assignment (Create New Version)' : 'Upload & Submit Assignment'}
            </h2>
            <p className="text-xs text-slate-500">
              Files are streamed directly to Cloud Object Storage and metadata is committed to Cloud Database.
            </p>
          </div>

          {/* Feedback & Error alerts */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isPastDeadline && !assignment.allowLateSubmissions && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Submission Window Closed</span>
                The deadline has passed and late submissions are disabled by the instructor.
              </div>
            </div>
          )}

          {isPastDeadline && assignment.allowLateSubmissions && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-xs text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                The official deadline has passed. Submissions will be accepted but automatically flagged as <strong>LATE</strong>.
              </span>
            </div>
          )}

          <form onSubmit={handleUploadAndSubmit} className="space-y-4">
            {/* File Dropzone / Selector */}
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center transition bg-slate-50/50">
              <input
                type="file"
                id="file-upload-input"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading || (isPastDeadline && !assignment.allowLateSubmissions)}
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                    Click to browse file
                  </span>
                  <span className="text-slate-500 text-sm"> or drag and drop</span>
                </div>
                <p className="text-xs text-slate-400">
                  Supported: {assignment.allowedFileTypes.join(', ')} (Max: {assignment.maxFileSizeMB}MB)
                </p>
              </label>

              {selectedFile && (
                <div className="mt-4 p-3 bg-white border border-slate-200 rounded-lg text-left flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-800 truncate">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-red-600 ml-2 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Streaming binary to Cloud Storage...</span>
                  <span className="font-semibold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                !selectedFile ||
                isUploading ||
                (isPastDeadline && !assignment.allowLateSubmissions)
              }
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-xs transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {isUploading
                  ? 'Uploading & Saving Metadata...'
                  : latestSub
                  ? `Upload Revision (Version ${submissions.length + 1})`
                  : 'Submit Assignment'}
              </span>
            </button>
          </form>
        </div>

        {/* Submission & Version History Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Submission Version History</span>
              </h2>
              <p className="text-xs text-slate-500">
                Audited version logs preserved in Cloud Database.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
              {submissions.length} submission(s)
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
              <FileCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                You have not submitted any files for this assignment yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub, idx) => (
                <div
                  key={sub.id}
                  className={`p-4 rounded-xl border transition ${
                    idx === 0
                      ? 'border-indigo-200 bg-indigo-50/30 ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">
                        Version {sub.version}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                          Latest Active
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    {sub.submissionStatus === 'GRADED' ? (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        Marks: {sub.marks} / {assignment.maxMarks}
                      </span>
                    ) : sub.submissionStatus === 'LATE' ? (
                      <span className="text-xs font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded-full border border-red-300">
                        Late Submission
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-300">
                        Submitted On-Time
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="font-medium truncate max-w-[200px] text-slate-800">
                        {sub.fileName}
                      </span>
                      <span>{(sub.fileSize / 1024).toFixed(1)} KB</span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Submitted at: {new Date(sub.submittedAt).toLocaleString()} (Server Time)
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      Cloud Path: {sub.storagePath}
                    </div>
                  </div>

                  {/* Feedback Box if Graded */}
                  {sub.submissionStatus === 'GRADED' && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 bg-white p-3 rounded-lg border">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                        <span className="flex items-center space-x-1 text-emerald-700">
                          <Award className="w-3.5 h-3.5" />
                          <span>Instructor Feedback & Score</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          By: {sub.gradedBy || 'Faculty'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 italic bg-slate-50 p-2 rounded border border-slate-100">
                        "{sub.feedback || 'No written comments provided.'}"
                      </p>
                    </div>
                  )}

                  {/* Download Action */}
                  <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => cloudStorage.downloadObject(sub.fileUrl, sub.fileName)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-slate-300 rounded text-xs font-medium transition shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

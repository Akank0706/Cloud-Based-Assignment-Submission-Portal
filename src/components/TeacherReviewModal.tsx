import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { Submission, Assignment } from '../types';
import { cloudDatabase } from '../services/databaseService';
import { cloudStorage } from '../services/storageService';
import {
  X,
  Award,
  Download,
  FileText,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface TeacherReviewModalProps {
  submission: Submission | null;
  assignment?: Assignment | null;
  onClose: () => void;
  onGraded: () => void;
}

export const TeacherReviewModal: React.FC<TeacherReviewModalProps> = ({
  submission,
  assignment,
  onClose,
  onGraded
}) => {
  const { currentUser } = useAuth();
  const [marks, setMarks] = useState<number | string>(
    submission?.marks !== null && submission?.marks !== undefined ? submission.marks : ''
  );
  const [feedback, setFeedback] = useState<string>(submission?.feedback || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!submission) return null;

  const maxAllowedMarks = assignment ? assignment.maxMarks : 100;

  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);
    setSuccess(false);

    const numericMarks = Number(marks);
    if (isNaN(numericMarks)) {
      setError('Please provide a valid numeric score.');
      return;
    }

    if (numericMarks < 0) {
      setError('Marks cannot be negative.');
      return;
    }

    if (numericMarks > maxAllowedMarks) {
      setError(`Marks cannot exceed maximum assignment score of ${maxAllowedMarks}.`);
      return;
    }

    if (!feedback.trim()) {
      setError('Please provide qualitative constructive feedback for the student.');
      return;
    }

    setIsSubmitting(true);
    try {
      await cloudDatabase.gradeSubmission(
        submission.id,
        numericMarks,
        feedback.trim(),
        currentUser
      );
      setSuccess(true);
      setTimeout(() => {
        onGraded();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit grade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    cloudStorage.downloadObject(submission.fileUrl, submission.fileName);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Grade Student Submission</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Submission Details Bar */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Grade and feedback successfully persisted to Cloud Database!</span>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-900 text-sm">{submission.studentName}</span>
                <span className="text-slate-400 font-mono text-[11px]">({submission.studentEmail})</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                  submission.submissionStatus === 'LATE'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-sky-100 text-sky-800 border border-sky-200'
                }`}
              >
                {submission.submissionStatus === 'LATE' ? 'Late Submission' : 'Submitted On-Time'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Assignment:</span>
                <span className="font-medium text-slate-800">{assignment?.title || 'Assignment'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Version:</span>
                <span className="font-medium text-slate-800">Version {submission.version}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Server Timestamp:</span>
                <span>{new Date(submission.submittedAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">File Size:</span>
                <span>{(submission.fileSize / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            {/* File download trigger */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-mono text-slate-800 truncate text-[11px]">
                  {submission.fileName}
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-indigo-700 border border-slate-300 rounded text-xs font-semibold shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download / Inspect</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitGrade} className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Awarded Score (Marks)</label>
                <span className="text-slate-400">Maximum: {maxAllowedMarks} marks</span>
              </div>
              <input
                type="number"
                min="0"
                max={maxAllowedMarks}
                step="0.5"
                required
                placeholder={`0 to ${maxAllowedMarks}`}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="w-full p-2.5 text-sm font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Faculty Written Feedback
              </label>
              <textarea
                rows={4}
                required
                placeholder="Detail technical strengths, areas for architectural improvement, or submission remarks..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Persisting Grade...' : 'Publish Official Evaluation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

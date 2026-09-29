export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Course {
  id: string;
  courseName: string;
  courseCode: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
  description: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description: string;
  deadline: string; // ISO String
  maxMarks: number;
  createdBy: string; // teacherId
  teacherName: string;
  allowedFileTypes: string[]; // e.g. ['application/pdf', '.docx', '.jpg', '.png']
  maxFileSizeMB: number;
  allowLateSubmissions: boolean;
  createdAt: string;
}

export type SubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED';

export interface Submission {
  id: string;
  assignmentId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  fileSize: number;
  fileType: string;
  submittedAt: string; // Server ISO string
  submissionStatus: SubmissionStatus;
  marks: number | null;
  feedback: string | null;
  gradedAt: string | null;
  gradedBy?: string;
  version: number;
}

export interface StorageObject {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
  metadata: {
    studentId: string;
    courseId: string;
    assignmentId: string;
    version: number;
  };
}

export interface TestCaseResult {
  id: number;
  scenario: string;
  input: string;
  expectedResult: string;
  actualResult: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  executionTimeMs?: number;
}

export interface SystemMetrics {
  serverTimestamp: string;
  cloudRegion: string;
  storageUsedBytes: number;
  totalSubmissions: number;
  databaseOperationsCount: number;
  simulatedLatencyMs: number;
}

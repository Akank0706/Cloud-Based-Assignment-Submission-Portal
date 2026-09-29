/**
 * Cloud Database Service
 * Emulates Cloud Firestore / Cloud Relational Database Collections:
 * - users
 * - courses
 * - assignments
 * - submissions
 * - feedback
 *
 * Implements server-authoritative timestamps, version increment logic,
 * and role-based validation policies.
 */

import { User, Course, Assignment, Submission, UserRole, SubmissionStatus } from '../types';

const STORAGE_KEY_PREFIX = 'cloud_db_';

class CloudDatabaseService {
  private users: User[] = [];
  private courses: Course[] = [];
  private assignments: Assignment[] = [];
  private submissions: Submission[] = [];
  private dbOpsCounter: number = 0;

  constructor() {
    this.loadFromStorage();
    if (this.users.length === 0) {
      this.seedInitialData();
    }
  }

  /**
   * Trusted Server-Side Timestamp Simulation (UTC ISO)
   * Critical Cloud Concept: Never trust client device time for deadlines!
   */
  getServerTimestamp(): string {
    return new Date().toISOString();
  }

  getDbOperationsCount(): number {
    return this.dbOpsCounter;
  }

  // --- SEED DATA ---
  private seedInitialData() {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAhead = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAhead = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();
    const yesterdayPast = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Users
    const teacher1: User = {
      uid: 'teacher-101',
      name: 'Dr. Alan Vance',
      email: 'teacher@example.com',
      role: 'teacher',
      createdAt: twoDaysAgo
    };

    const student1: User = {
      uid: 'student-201',
      name: 'Elena Rostova',
      email: 'student@example.com',
      role: 'student',
      createdAt: twoDaysAgo
    };

    const student2: User = {
      uid: 'student-202',
      name: 'Marcus Chen',
      email: 'marcus@example.com',
      role: 'student',
      createdAt: twoDaysAgo
    };

    this.users = [teacher1, student1, student2];

    // 2. Courses
    const course1: Course = {
      id: 'course-cc-401',
      courseCode: 'CS401',
      courseName: 'Cloud Computing Architecture',
      teacherId: teacher1.uid,
      teacherName: teacher1.name,
      createdAt: twoDaysAgo,
      description: 'Covers IaaS/PaaS/SaaS architectures, object storage, serverless compute, and distributed cloud databases.'
    };

    const course2: Course = {
      id: 'course-ds-302',
      courseCode: 'CS302',
      courseName: 'Distributed Systems & Microservices',
      teacherId: teacher1.uid,
      teacherName: teacher1.name,
      createdAt: twoDaysAgo,
      description: 'Study of consensus algorithms, message queues, containerization, and horizontal scalability.'
    };

    this.courses = [course1, course2];

    // 3. Assignments
    const assign1: Assignment = {
      id: 'assign-cc-01',
      courseId: course1.id,
      courseName: course1.courseName,
      title: 'Cloud Object Storage & Replication Report',
      description: 'Analyze the architectural trade-offs between Cloud Object Storage (e.g. S3 / Firebase Storage) vs Relational Database BLOB columns for high-throughput media ingestion. Submit as PDF or Word document.',
      deadline: fiveDaysAhead, // Upcoming deadline
      maxMarks: 100,
      createdBy: teacher1.uid,
      teacherName: teacher1.name,
      allowedFileTypes: ['application/pdf', '.pdf', '.docx', '.png'],
      maxFileSizeMB: 20,
      allowLateSubmissions: true,
      createdAt: twoDaysAgo
    };

    const assign2: Assignment = {
      id: 'assign-cc-02',
      courseId: course1.id,
      courseName: course1.courseName,
      title: 'Serverless Functions & Event-Driven Pipelines',
      description: 'Design a stateless event processing pipeline that triggers image transcoding when a file lands in an S3/Cloud Storage bucket. Include architecture diagram.',
      deadline: oneDayAhead, // Near deadline
      maxMarks: 50,
      createdBy: teacher1.uid,
      teacherName: teacher1.name,
      allowedFileTypes: ['application/pdf', '.pdf', '.docx', '.jpg', '.png'],
      maxFileSizeMB: 15,
      allowLateSubmissions: true,
      createdAt: twoDaysAgo
    };

    const assign3: Assignment = {
      id: 'assign-ds-01',
      courseId: course2.id,
      courseName: course2.courseName,
      title: 'Microservices Load Balancing & Failover Simulation',
      description: 'Benchmark round-robin vs least-connections algorithms under spike traffic conditions. Past deadline to demonstrate late/graded submission behavior.',
      deadline: yesterdayPast, // Past deadline!
      maxMarks: 100,
      createdBy: teacher1.uid,
      teacherName: teacher1.name,
      allowedFileTypes: ['application/pdf', '.pdf', '.docx'],
      maxFileSizeMB: 20,
      allowLateSubmissions: true,
      createdAt: twoDaysAgo
    };

    this.assignments = [assign1, assign2, assign3];

    // 4. Sample Submissions
    // Elena submitted assign-ds-01 before deadline and got graded
    const sub1: Submission = {
      id: 'sub-9001',
      assignmentId: assign3.id,
      courseId: course2.id,
      studentId: student1.uid,
      studentName: student1.name,
      studentEmail: student1.email,
      fileName: 'Rostova_CS302_FailoverAnalysis.pdf',
      fileUrl: '#sample-demo-url',
      storagePath: `assignments/${course2.id}/${assign3.id}/${student1.uid}/v1_sub-9001_Rostova_CS302_FailoverAnalysis.pdf`,
      fileSize: 1024 * 840,
      fileType: 'application/pdf',
      submittedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      submissionStatus: 'GRADED',
      marks: 94,
      feedback: 'Excellent breakdown of health check timeouts and connection draining under auto-scaling pressure. Code samples are clean.',
      gradedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      gradedBy: teacher1.name,
      version: 1
    };

    // Marcus submitted assign-cc-01 on time (pending teacher review)
    const sub2: Submission = {
      id: 'sub-9002',
      assignmentId: assign1.id,
      courseId: course1.id,
      studentId: student2.uid,
      studentName: student2.name,
      studentEmail: student2.email,
      fileName: 'Marcus_ObjectStorage_Report.pdf',
      fileUrl: '#sample-demo-url',
      storagePath: `assignments/${course1.id}/${assign1.id}/${student2.uid}/v1_sub-9002_Marcus_ObjectStorage_Report.pdf`,
      fileSize: 1024 * 1250,
      fileType: 'application/pdf',
      submittedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      submissionStatus: 'SUBMITTED',
      marks: null,
      feedback: null,
      gradedAt: null,
      version: 1
    };

    this.submissions = [sub1, sub2];
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}users`, JSON.stringify(this.users));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}courses`, JSON.stringify(this.courses));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}assignments`, JSON.stringify(this.assignments));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}submissions`, JSON.stringify(this.submissions));
    } catch {
      // Storage fallback
    }
  }

  private loadFromStorage() {
    try {
      const u = localStorage.getItem(`${STORAGE_KEY_PREFIX}users`);
      const c = localStorage.getItem(`${STORAGE_KEY_PREFIX}courses`);
      const a = localStorage.getItem(`${STORAGE_KEY_PREFIX}assignments`);
      const s = localStorage.getItem(`${STORAGE_KEY_PREFIX}submissions`);
      if (u) this.users = JSON.parse(u);
      if (c) this.courses = JSON.parse(c);
      if (a) this.assignments = JSON.parse(a);
      if (s) this.submissions = JSON.parse(s);
    } catch {
      // Ignore parse errors
    }
  }

  // --- USER OPERATIONS ---
  async getUserByEmail(email: string): Promise<User | null> {
    this.dbOpsCounter++;
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async getUserById(uid: string): Promise<User | null> {
    this.dbOpsCounter++;
    return this.users.find((u) => u.uid === uid) || null;
  }

  async createUser(name: string, email: string, role: UserRole): Promise<User> {
    this.dbOpsCounter++;
    const existing = await this.getUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: User = {
      uid: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      createdAt: this.getServerTimestamp()
    };

    this.users.push(newUser);
    this.saveToStorage();
    return newUser;
  }

  async getAllStudents(): Promise<User[]> {
    this.dbOpsCounter++;
    return this.users.filter((u) => u.role === 'student');
  }

  // --- COURSE OPERATIONS ---
  async getCourses(): Promise<Course[]> {
    this.dbOpsCounter++;
    return [...this.courses];
  }

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    this.dbOpsCounter++;
    return this.courses.filter((c) => c.teacherId === teacherId);
  }

  async createCourse(courseName: string, courseCode: string, description: string, teacher: User): Promise<Course> {
    this.dbOpsCounter++;
    if (teacher.role !== 'teacher') {
      throw new Error('Unauthorized: Only teachers can create courses.');
    }

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      courseCode: courseCode.trim().toUpperCase(),
      courseName: courseName.trim(),
      description: description.trim(),
      teacherId: teacher.uid,
      teacherName: teacher.name,
      createdAt: this.getServerTimestamp()
    };

    this.courses.push(newCourse);
    this.saveToStorage();
    return newCourse;
  }

  // --- ASSIGNMENT OPERATIONS ---
  async getAssignments(): Promise<Assignment[]> {
    this.dbOpsCounter++;
    return [...this.assignments].sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
  }

  async getAssignmentById(id: string): Promise<Assignment | null> {
    this.dbOpsCounter++;
    return this.assignments.find((a) => a.id === id) || null;
  }

  async createAssignment(
    assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'teacherName'>,
    author: User
  ): Promise<Assignment> {
    this.dbOpsCounter++;
    if (author.role !== 'teacher') {
      throw new Error('Unauthorized: Only teachers can create assignments.');
    }

    if (!assignmentData.title?.trim()) {
      throw new Error('Assignment title is required.');
    }
    if (!assignmentData.deadline) {
      throw new Error('Valid deadline date & time is required.');
    }
    if (assignmentData.maxMarks <= 0) {
      throw new Error('Maximum marks must be greater than 0.');
    }

    const course = this.courses.find((c) => c.id === assignmentData.courseId);

    const newAssignment: Assignment = {
      ...assignmentData,
      id: `assign-${Date.now()}`,
      courseName: course ? course.courseName : assignmentData.courseName,
      teacherName: author.name,
      createdBy: author.uid,
      createdAt: this.getServerTimestamp()
    };

    this.assignments.push(newAssignment);
    this.saveToStorage();
    return newAssignment;
  }

  async updateAssignment(
    assignmentId: string,
    updates: Partial<Assignment>,
    actor: User
  ): Promise<Assignment> {
    this.dbOpsCounter++;
    if (actor.role !== 'teacher') {
      throw new Error('Unauthorized: Only teachers can update assignments.');
    }

    const index = this.assignments.findIndex((a) => a.id === assignmentId);
    if (index === -1) {
      throw new Error('Assignment not found.');
    }

    const updated = {
      ...this.assignments[index],
      ...updates
    };

    this.assignments[index] = updated;
    this.saveToStorage();
    return updated;
  }

  async deleteAssignment(assignmentId: string, actor: User): Promise<void> {
    this.dbOpsCounter++;
    if (actor.role !== 'teacher') {
      throw new Error('Unauthorized: Only teachers can delete assignments.');
    }

    this.assignments = this.assignments.filter((a) => a.id !== assignmentId);
    // Also remove associated submissions
    this.submissions = this.submissions.filter((s) => s.assignmentId !== assignmentId);
    this.saveToStorage();
  }

  // --- SUBMISSION OPERATIONS ---
  async getSubmissionsByAssignment(assignmentId: string, actor: User): Promise<Submission[]> {
    this.dbOpsCounter++;
    if (actor.role === 'student') {
      // Security Rule: Student can ONLY view their own submission
      return this.submissions.filter(
        (s) => s.assignmentId === assignmentId && s.studentId === actor.uid
      );
    }
    // Teacher can view all submissions for this assignment
    return this.submissions.filter((s) => s.assignmentId === assignmentId);
  }

  async getSubmissionsByStudent(studentId: string, actor: User): Promise<Submission[]> {
    this.dbOpsCounter++;
    // Security Rule: Student can only view their own submissions
    if (actor.role === 'student' && actor.uid !== studentId) {
      throw new Error("Security Violation: You cannot view another student's private submissions.");
    }
    return this.submissions.filter((s) => s.studentId === studentId);
  }

  async getAllSubmissions(actor: User): Promise<Submission[]> {
    this.dbOpsCounter++;
    if (actor.role === 'student') {
      return this.submissions.filter((s) => s.studentId === actor.uid);
    }
    return [...this.submissions];
  }

  async getSubmissionById(submissionId: string, actor: User): Promise<Submission | null> {
    this.dbOpsCounter++;
    const sub = this.submissions.find((s) => s.id === submissionId);
    if (!sub) return null;

    // Security check
    if (actor.role === 'student' && sub.studentId !== actor.uid) {
      throw new Error("Security Violation: You do not have permission to view another student's submission.");
    }

    return sub;
  }

  /**
   * Submit Assignment Workflow
   * Validates:
   * 1. Student authentication & role
   * 2. Assignment exists
   * 3. Server timestamp comparison against assignment deadline
   * 4. Late submission policy check
   * 5. Increments version number for resubmissions
   */
  async submitAssignment(params: {
    assignmentId: string;
    student: User;
    fileName: string;
    fileUrl: string;
    storagePath: string;
    fileSize: number;
    fileType: string;
  }): Promise<Submission> {
    this.dbOpsCounter++;
    const { assignmentId, student, fileName, fileUrl, storagePath, fileSize, fileType } = params;

    if (student.role !== 'student') {
      throw new Error('Unauthorized: Only students can submit assignments.');
    }

    const assignment = await this.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment does not exist.');
    }

    // Server-side authoritative timestamp (prevent client clock tampering!)
    const serverTime = this.getServerTimestamp();
    const serverTimestampMs = new Date(serverTime).getTime();
    const deadlineMs = new Date(assignment.deadline).getTime();

    const isLate = serverTimestampMs > deadlineMs;

    if (isLate && !assignment.allowLateSubmissions) {
      throw new Error(
        `Late submissions are disabled for this assignment. The deadline was ${new Date(
          assignment.deadline
        ).toLocaleString()}.`
      );
    }

    // Determine Version Number (Resubmission workflow)
    const previousSubmissions = this.submissions.filter(
      (s) => s.assignmentId === assignmentId && s.studentId === student.uid
    );
    const nextVersion = previousSubmissions.length + 1;

    const initialStatus: SubmissionStatus = isLate ? 'LATE' : 'SUBMITTED';

    const submission: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assignmentId,
      courseId: assignment.courseId,
      studentId: student.uid,
      studentName: student.name,
      studentEmail: student.email,
      fileName,
      fileUrl,
      storagePath,
      fileSize,
      fileType,
      submittedAt: serverTime,
      submissionStatus: initialStatus,
      marks: null,
      feedback: null,
      gradedAt: null,
      version: nextVersion
    };

    this.submissions.push(submission);
    this.saveToStorage();
    return submission;
  }

  /**
   * Teacher Grade & Feedback Workflow
   * Validates:
   * 1. Teacher role authorization
   * 2. Marks range (0 <= marks <= maxMarks)
   * 3. Persists feedback and timestamp
   */
  async gradeSubmission(
    submissionId: string,
    marks: number,
    feedback: string,
    teacher: User
  ): Promise<Submission> {
    this.dbOpsCounter++;
    if (teacher.role !== 'teacher') {
      throw new Error('Security Violation: Only authorized teachers can grade submissions.');
    }

    const subIndex = this.submissions.findIndex((s) => s.id === submissionId);
    if (subIndex === -1) {
      throw new Error('Submission not found.');
    }

    const sub = this.submissions[subIndex];
    const assignment = await this.getAssignmentById(sub.assignmentId);
    const maxAllowedMarks = assignment ? assignment.maxMarks : 100;

    if (marks < 0) {
      throw new Error('Marks cannot be negative.');
    }
    if (marks > maxAllowedMarks) {
      throw new Error(`Marks cannot exceed maximum allowed marks (${maxAllowedMarks}).`);
    }

    const updated: Submission = {
      ...sub,
      marks,
      feedback: feedback.trim(),
      gradedAt: this.getServerTimestamp(),
      gradedBy: teacher.name,
      submissionStatus: 'GRADED'
    };

    this.submissions[subIndex] = updated;
    this.saveToStorage();
    return updated;
  }

  // --- REAL DASHBOARD METRICS ---
  async getStudentDashboardStats(studentId: string, actor: User) {
    this.dbOpsCounter++;
    if (actor.role === 'student' && actor.uid !== studentId) {
      throw new Error('Security violation on dashboard access.');
    }

    const totalAssignments = this.assignments.length;
    const studentSubs = this.submissions.filter((s) => s.studentId === studentId);

    // Latest submission per assignment
    const latestSubsByAssign = new Map<string, Submission>();
    studentSubs.forEach((s) => {
      const existing = latestSubsByAssign.get(s.assignmentId);
      if (!existing || s.version > existing.version) {
        latestSubsByAssign.set(s.assignmentId, s);
      }
    });

    const submittedCount = Array.from(latestSubsByAssign.values()).length;
    const pendingCount = Math.max(0, totalAssignments - submittedCount);
    const gradedCount = Array.from(latestSubsByAssign.values()).filter(
      (s) => s.submissionStatus === 'GRADED'
    ).length;
    const lateCount = Array.from(latestSubsByAssign.values()).filter(
      (s) => s.submissionStatus === 'LATE'
    ).length;

    return {
      totalAssignments,
      pendingCount,
      submittedCount,
      gradedCount,
      lateCount
    };
  }

  async getTeacherDashboardStats(actor: User) {
    this.dbOpsCounter++;
    if (actor.role !== 'teacher') {
      throw new Error('Unauthorized dashboard access.');
    }

    const totalAssignments = this.assignments.length;
    const students = this.users.filter((u) => u.role === 'student');
    const totalStudents = students.length;
    const totalSubmissions = this.submissions.length;

    const pendingReviews = this.submissions.filter(
      (s) => s.submissionStatus === 'SUBMITTED' || s.submissionStatus === 'LATE'
    ).length;

    const lateSubmissions = this.submissions.filter(
      (s) => s.submissionStatus === 'LATE'
    ).length;

    const gradedSubmissions = this.submissions.filter(
      (s) => s.submissionStatus === 'GRADED'
    ).length;

    return {
      totalAssignments,
      totalStudents,
      totalSubmissions,
      pendingReviews,
      lateSubmissions,
      gradedSubmissions
    };
  }

  /**
   * Reset database back to default seed for testing
   */
  resetToDefaultSeed() {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}users`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}courses`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}assignments`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}submissions`);
    this.seedInitialData();
  }
}

export const cloudDatabase = new CloudDatabaseService();

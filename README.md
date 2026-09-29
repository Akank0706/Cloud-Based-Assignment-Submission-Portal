# Cloud-Based Student Assignment Submission & Feedback Portal

A production-grade, cloud-hosted platform where students submit coursework and faculty manage, review, grade, and record audit-ready feedback in real time with server-authoritative deadline validation and version history.

---

## Overview
This platform serves as a modern Learning Management System (LMS) core built specifically to demonstrate essential **Cloud Computing principles**:
- **Decoupled Architecture**: Separating transactional metadata in a cloud database from binary objects in cloud object storage.
- **Server-Authoritative Clock**: Eliminating student client-side device clock manipulation for deadline enforcement.
- **Multi-Tenant Role-Based Access Control (RBAC)**: Enforcing strict zero-trust boundaries between students and faculty.
- **Resilient Upload Pipeline**: Validating MIME types, sizes, and tracking multi-version assignment revisions (`Version 1`, `Version 2`).
- **Comprehensive Automated Testing**: Complete 25-case test suite integrated directly into the portal.

---

## Problem Statement
Traditional academic submission mechanisms—such as email attachments, paper printouts, and local network shared folders—suffer from several critical failure modes:
1. **Clock Manipulation & Disputed Deadlines**: Inconsistent client clocks allow students to claim assignments were submitted on time when they were late.
2. **Server Crashes on Deadline Night**: Monolithic web servers crash when hundreds or thousands of students stream large PDF files concurrently minutes before midnight.
3. **Data Leaks & Overwrites**: Lack of fine-grained object access control enables students to view or overwrite peer submissions.
4. **Fragmented Records**: Faculty feedback gets lost in email chains without a historical audit log of student revisions.

---

## Objectives
- Build a responsive web portal in React & TypeScript with zero AI slop, adhering to clean academic LMS UI guidelines.
- Implement decoupled Cloud Object Storage (`assignments/{courseId}/{assignmentId}/{studentId}/...`) and Document Database collections (`users`, `courses`, `assignments`, `submissions`, `feedback`).
- Enforce server timestamps for calculating submission status: `SUBMITTED` (on-time), `LATE`, or `GRADED`.
- Provide faculty with streamlined grading tools: marks validation (`0 <= marks <= maxMarks`), feedback entry, and CSV export.
- Implement an automated test runner executing 25 distinct integration and security test cases.

---

## Features
- **Student Dashboard**: Live summary tiles (Total Coursework, Pending, Submitted, Late, Graded), upcoming deadlines, and recent teacher feedback.
- **Student Submission Hub**: File drag-and-drop dropzone, client-side format & size checks, progress indicator, and version history.
- **Teacher Console**: Course syllabus authoring, assignment creation (deadline, max marks, allowed extensions, max file size, late submission policy toggle), submission filtering, and grading modal.
- **Live Cloud Object Storage Explorer**: Visual inspector of the storage bucket displaying canonical bucket paths, MIME types, and binary file sizes.
- **25-Scenario Test Runner**: Interactive test suite that verifies authentication, security rules, file validation, deadline logic, and failure handling.
- **Cloud Viva Voce Prep**: 10 essential interview/viva questions with strong student-level answers, plus cloud vendor mappings (AWS, Azure, GCP).

---

## User Roles & Permissions

| Feature / Action | Student Role | Teacher Role |
| :--- | :---: | :---: |
| Self-Register & Login | ✅ | ✅ |
| View Course Assignments & Guidelines | ✅ | ✅ |
| Create / Edit / Delete Assignments | ❌ | ✅ |
| Upload Assignment & Revisions | ✅ | ❌ |
| View Own Submissions & Versions | ✅ | ✅ |
| View Other Students' Submissions | ❌ (Strict 403) | ✅ |
| Grade Submissions & Add Feedback | ❌ (Strict 403) | ✅ |
| Download Submissions | ✅ (Self only) | ✅ (All cohort) |
| Export Grades to CSV | ❌ | ✅ |

---

## Cloud Computing Concepts
1. **Cloud Computing & SaaS**: The portal runs as a scalable Software-as-a-Service application accessible via standard web browsers.
2. **Cloud Database (Firestore / PostgreSQL)**: Stores structured, indexed records (users, assignments, deadlines, marks).
3. **Cloud Object Storage (Firebase Storage / AWS S3)**: Dedicated binary storage for heavy PDF, DOCX, and image files.
4. **Server-Authoritative Timestamps**: UTC server clock guarantees non-repudiation of deadlines, ignoring client device tampering.
5. **Horizontal Scalability & Elasticity**: Stateless architecture designed to autoscale behind cloud load balancers.
6. **Zero-Trust ABAC Security**: Database rules reject any unauthorized attempt by students to modify scores or access peer submissions.

---

## System Architecture

```text
[Students & Teachers]
         │ (HTTPS / TLS 1.3)
         ▼
[Frontend: React 19 + Tailwind CSS + Vite]
         │
         ▼
[Authentication & RBAC State Provider]
         │
         ├──► [Cloud Database (Firestore / Local Engine)]
         │    ├── /users
         │    ├── /courses
         │    ├── /assignments
         │    └── /submissions (Metadata, Marks, Server Timestamps)
         │
         └──► [Cloud Object Storage (Firebase Storage / S3)]
              └── /assignments/{courseId}/{aid}/{studentId}/v{N}_{file}
```

---

## Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Cloud Storage** | Cloud Object Storage (Firebase Storage / IndexedDB persistent blob engine) |
| **Cloud Database** | Cloud Firestore Collections (`users`, `courses`, `assignments`, `submissions`) |
| **Authentication** | Firebase Authentication (Email/Password & RBAC Session Provider) |
| **Security Rules** | `firestore.rules` (ABAC policies), `storage.rules` (MIME & size limits) |
| **Optional Backend** | Python Flask / FastAPI (`requirements.txt`) |

---

## Database Design

### Collections & Fields:
- **`users`**: `{ uid, name, email, role: 'student' | 'teacher', createdAt }`
- **`courses`**: `{ id, courseCode, courseName, teacherId, teacherName, description, createdAt }`
- **`assignments`**: `{ id, courseId, courseName, title, description, deadline, maxMarks, allowedFileTypes, maxFileSizeMB, allowLateSubmissions, createdBy, createdAt }`
- **`submissions`**: `{ id, assignmentId, courseId, studentId, studentName, studentEmail, fileName, fileUrl, storagePath, fileSize, fileType, submittedAt, submissionStatus, marks, feedback, gradedAt, gradedBy, version }`

---

## Cloud Storage Hierarchy
```text
gs://student-assignments-store/
└── assignments/
    └── {courseId}/
        └── {assignmentId}/
            └── {studentId}/
                ├── v1_{submissionId}_Report.pdf
                └── v2_{submissionId}_Report_Revision.pdf
```

---

## REST API Specification

| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/register` | Public | Create new student or teacher account |
| `POST` | `/api/login` | Public | Authenticate credentials and receive token |
| `GET` | `/api/assignments` | Authenticated | List all active coursework and deadlines |
| `POST` | `/api/assignments` | Teacher | Publish new assignment with deadline and rubric |
| `DELETE` | `/api/assignments/{id}` | Teacher | Remove assignment and associated submissions |
| `POST` | `/api/assignments/{id}/submit` | Student | Stream file to object storage and record metadata |
| `GET` | `/api/assignments/{id}/submissions` | Teacher / Student | Retrieve submissions (role-filtered) |
| `POST` | `/api/submissions/{id}/grade` | Teacher | Record marks (0-maxMarks) and written feedback |
| `GET` | `/api/submissions/{id}/download` | Authorized | Stream file binary from object storage |

---

## Folder Structure

```text
Cloud-Assignment-Submission-Portal/
├── docs/
│   └── ARCHITECTURE.md          # Complete cloud architecture & REST API specs
├── reports/
│   └── PROJECT_REPORT.md        # Formal academic project report
├── src/
│   ├── components/
│   │   ├── Navbar.tsx           # Navigation, live cloud status & role switcher
│   │   ├── LandingPage.tsx      # Academic landing page & workflow overview
│   │   ├── StudentDashboard.tsx # Student coursework, metrics & feedback
│   │   ├── StudentAssignmentDetail.tsx # File dropzone, upload & version history
│   │   ├── TeacherDashboard.tsx # Assignment authoring & cohort submission list
│   │   ├── TeacherReviewModal.tsx # Grading modal with marks & feedback input
│   │   ├── StorageExplorer.tsx  # Cloud Object Storage bucket inspector
│   │   ├── AutomatedTestView.tsx# Interactive 25-case test execution matrix
│   │   ├── CloudConceptsViva.tsx# 10 Viva Q&As, scalability & AWS/GCP mapping
│   │   └── AuthModal.tsx        # Login & registration modal with role selector
│   ├── services/
│   │   ├── authContext.tsx      # Authentication state and RBAC session manager
│   │   ├── databaseService.ts   # Firestore collections, CRUD & server timestamps
│   │   ├── storageService.ts    # Cloud Object Storage engine with IndexedDB persistence
│   │   └── testRunner.ts        # 25-scenario automated verification test runner
│   ├── types/
│   │   └── index.ts             # TypeScript definitions
│   ├── App.tsx                  # Main router and view orchestrator
│   └── main.tsx                 # React entry point
├── firestore.rules              # Firestore security rules with ABAC
├── storage.rules                # Storage security rules (MIME & size limits)
├── firebase.json                # Firebase Hosting and Emulator suite config
├── requirements.txt             # Python backend dependencies
├── .env.example                 # Environment configuration template
├── package.json
└── README.md
```

---

## Local Setup & Running the Application

### Prerequisites
- Node.js (v18.x or higher)
- npm or bun

### Windows Commands (Command Prompt or PowerShell in VS Code)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/Cloud-Based-Assignment-Submission-Portal.git
cd Cloud-Based-Assignment-Submission-Portal

# 2. Install dependencies
npm install

# 3. Create .env file from example
copy .env.example .env

# 4. Start development server
npm run dev
```

The portal runs at `http://localhost:3000`.

---

## Demo Credentials & 1-Click Role Switcher
The application includes pre-configured academic demo accounts:
- **Teacher Account**: `teacher@example.com` / `password123` (Dr. Alan Vance)
- **Student Account**: `student@example.com` / `password123` (Elena Rostova)

*Tip*: Use the **"Switch Role"** toggle in the top navbar to instantly test the portal from both student and faculty perspectives without re-entering credentials!

---

## Automated Testing Strategy
The application features a built-in automated test suite executing all 25 test scenarios required by the specification:
1. `TC-01`: Student registration
2. `TC-02`: Teacher login
3. `TC-03`: Invalid login rejection
4. `TC-04`: Student dashboard authorization
5. `TC-05`: Teacher dashboard authorization
6. `TC-06`: Teacher creates assignment
7. `TC-07`: Student views assignment
8. `TC-08`: Valid PDF upload
9. `TC-09`: Invalid file extension rejection
10. `TC-10`: Oversized file rejection
11. `TC-11`: On-time submission status flag
12. `TC-12`: Late submission status flag
13. `TC-13`: Resubmission & version increment
14. `TC-14`: Student views own submission
15. `TC-15`: Student cannot view peer submission
16. `TC-16`: Teacher views cohort submissions
17. `TC-17`: Teacher grades submission
18. `TC-18`: Marks above maximum rejected
19. `TC-19`: Student views feedback
20. `TC-20`: Unauthorized grading rejected
21. `TC-21`: File retrieval from object storage
22. `TC-22`: Cloud-storage failure handling
23. `TC-23`: Database failure handling
24. `TC-24`: Logout session cleanup
25. `TC-25`: Protected route after logout

Click **"Automated Tests (25)"** in the top navigation to execute the live test runner!

---

## Cloud Deployment Guide

### Deploying to Firebase (Free Spark Plan)
```bash
# 1. Build the production bundle
npm run build

# 2. Install Firebase CLI globally
npm install -g firebase-tools

# 3. Login to Google Cloud / Firebase
firebase login

# 4. Initialize project
firebase init
# Select: Firestore, Storage, and Hosting
# Specify 'dist' as the public directory

# 5. Deploy rules and application
firebase deploy
```

---

## Cloud Security & Hardening
- **Attribute-Based Access Control (ABAC)**: Implemented in `firestore.rules`.
- **Zero-Trust Writes**: Only users with verified role claims can mutate resources.
- **Client Clock Neutralization**: Server timestamps (`request.time`) determine on-time vs late status.
- **Object Storage Isolation**: Storage rules constrain paths so students can only write to their own student ID directory.

---

## Scalability Analysis (10 to 100,000 Students)
- **10 Students**: Single instance, free-tier Firestore and Cloud Storage.
- **1,000 Students**: Stateless Cloud Run containers with auto-scaling (0-10 instances) and Firestore composite indexes.
- **100,000 Students (Deadline Surge)**: Direct client-to-bucket upload via Pre-Signed URLs, CloudFront CDN, and asynchronous Pub/Sub message queues for processing.

---

## Screenshots Checklist
For portfolio presentations and documentation, the following screenshots are captured:
1. `01_project_structure.png` - Folder hierarchy
2. `02_system_architecture.png` - Architecture diagram
3. `03_login_page.png` - Authentication modal
4. `04_student_registration.png` - Registration form
5. `05_teacher_dashboard.png` - Faculty overview
6. `06_assignment_creation.png` - Create assignment modal
7. `07_student_dashboard.png` - Student coursework view
8. `08_assignment_submission.png` - File upload dropzone
9. `09_cloud_storage.png` - Bucket inspector
10. `10_firestore_submission_record.png` - Metadata view
11. `11_teacher_grading.png` - Faculty evaluation dialog
12. `12_student_feedback.png` - Graded report with marks
13. `13_authorization_test.png` - Access restriction verification
14. `14_automated_tests.png` - 25/25 passed test results
15. `15_cloud_deployment.png` - Live application URL

---

## 10 Viva & Interview Questions & Answers
*(Available interactively in the portal under the "Cloud Viva" tab)*
1. **Explain your project**: Cloud-based submission portal decoupling binary storage from metadata with server-side deadline logic.
2. **Why Cloud Computing?**: High availability, elastic scalability, centralized single-source-of-truth, and remote access.
3. **Why Object Storage vs Database?**: Prevents database bloat, maintains sub-15ms index lookups, and reduces storage cost.
4. **Authentication vs Authorization**: Authentication answers "Who are you?"; Authorization answers "What are you allowed to do?".
5. **How does the submission workflow work?**: Client validation -> Direct storage stream -> Metadata commit -> Status evaluation.
6. **How is deadline management enforced?**: Server-authoritative timestamp compared to UTC deadline; rejects client clock changes.
7. **How are assignment files secured?**: Tokenized signed paths and role-scoped storage rules preventing cross-tenant access.
8. **Handling 100,000 simultaneous submissions?**: Direct presigned bucket uploads bypassing app servers, horizontally auto-scaling containers, and message queues.
9. **How was the project tested?**: 25-case automated matrix covering RBAC, file bounds, deadline flags, and storage failures.
10. **Future improvements**: Sentence-BERT plagiarism detection, push notifications, and CI/CD pipelines.

---

## Learning Outcomes
- Gained hands-on experience designing and implementing decoupled cloud architectures.
- Mastered Role-Based Access Control and zero-trust security rules.
- Understood the critical importance of authoritative server clocks for audit logging.
- Built production-ready automated testing suites for cloud web applications.

---

## Author & Project Info
- **Project Title**: Cloud-Based Student Assignment Submission & Feedback Portal
- **Course**: Cloud Computing & Distributed Systems (CS401)
- **Repository**: [https://github.com/your-username/Cloud-Based-Assignment-Submission-Portal](https://github.com/your-username/Cloud-Based-Assignment-Submission-Portal)
- **License**: MIT

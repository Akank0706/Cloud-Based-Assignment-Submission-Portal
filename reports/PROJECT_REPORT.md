# Project Report: Cloud-Based Student Assignment Submission & Feedback Portal

**Course**: Cloud Computing & Distributed Systems (CS401)  
**Academic Proof of Work Project**  

---

## 1. Abstract
The **Cloud-Based Student Assignment Submission & Feedback Portal** is a production-grade educational platform designed to eliminate the inefficiencies, security vulnerabilities, and infrastructure bottlenecks associated with legacy file submission mechanisms (such as email attachments and physical USB drives). Built upon a decoupled cloud architecture, the portal integrates modern web clients with cloud object storage for binary payloads and managed document databases for transactional metadata. The system enforces strict Role-Based Access Control (RBAC), server-authoritative deadline validation, automatic version incrementing, and secure grading workflows. An automated test harness verifies 25 distinct integration and security test cases.

---

## 2. Introduction & Problem Statement
Educational institutions frequently manage thousands of students submitting coursework across various academic terms. In traditional setups, students submit files via email threads or basic server file directories. This creates significant operational liabilities:
- **Lost Submissions & Time Disputes**: Inconsistent client-reported clocks lead to disputes over whether submissions were on time.
- **Server Crashes During Deadlines**: When hundreds of students upload multi-megabyte PDFs simultaneously near midnight, monolith servers run out of memory and socket connections.
- **Data Privacy Violations**: Insecure direct object references allow tech-savvy students to view or overwrite peer assignments.
- **Fragmented Feedback**: Faculty feedback gets buried in email chains, leaving students without a clear audit trail of past revisions and marks.

---

## 3. Objectives
1. Implement a cloud-native submission pipeline separating structured metadata (in a managed database) from heavy binary files (in cloud object storage).
2. Enforce server-authoritative timestamps to guarantee non-repudiation of deadlines.
3. Support seamless resubmission with automatic version history tracking (v1, v2, v3).
4. Provide distinct role-based experiences for students (browsing, uploading, feedback tracking) and faculty (assignment authoring, rubric grading, progress analytics).
5. Ensure 100% test coverage over 25 crucial security, authorization, and validation test scenarios.

---

## 4. Role-Permission Matrix

| Permission / Capability | Student Role | Teacher Role | Unauthenticated |
| :--- | :---: | :---: | :---: |
| Register Account | ✅ | ✅ | ✅ |
| Login / Logout | ✅ | ✅ | ❌ |
| View Course Assignments | ✅ (Enrolled) | ✅ (All) | ❌ |
| Create / Edit / Delete Assignments | ❌ | ✅ | ❌ |
| Upload Assignment (PDF/DOCX/PNG) | ✅ | ❌ | ❌ |
| Resubmit (Increment Version) | ✅ | ❌ | ❌ |
| View Own Submissions & Versions | ✅ | ✅ | ❌ |
| View Other Students' Submissions | ❌ (Strict 403) | ✅ | ❌ |
| Grade Submissions & Add Feedback | ❌ (Strict 403) | ✅ | ❌ |
| Export Grades to CSV | ❌ | ✅ | ❌ |
| View Storage Bucket Hierarchy | ✅ (Audited) | ✅ | ❌ |

---

## 5. Database Schema & Data Models

### Users (`users`)
- `uid`: Unique User ID (Primary Key)
- `name`: Full Name
- `email`: Institutional Email Address
- `role`: `'student' | 'teacher'`
- `createdAt`: Server ISO Timestamp

### Courses (`courses`)
- `id`: Course Identifier (Primary Key)
- `courseCode`: Course Code (e.g. `CS401`)
- `courseName`: Course Title
- `teacherId`: Foreign Key referencing `users.uid`
- `teacherName`: Instructor Display Name
- `description`: Course description

### Assignments (`assignments`)
- `id`: Assignment Identifier (Primary Key)
- `courseId`: Foreign Key referencing `courses.id`
- `courseName`: Course Title
- `title`: Assignment Title
- `description`: Submission requirements
- `deadline`: Server UTC ISO Timestamp
- `maxMarks`: Maximum attainable score
- `allowedFileTypes`: Array of MIME/extensions
- `maxFileSizeMB`: Maximum allowed size (e.g. `20`)
- `allowLateSubmissions`: Boolean flag
- `createdBy`: Teacher UID

### Submissions (`submissions`)
- `id`: Submission Identifier (Primary Key)
- `assignmentId`: Foreign Key referencing `assignments.id`
- `courseId`: Foreign Key referencing `courses.id`
- `studentId`: Foreign Key referencing `users.uid`
- `studentName`: Student Name
- `fileName`: Original File Name
- `fileUrl`: Secure Download / Blob URL
- `storagePath`: Bucket Canonical Path (`assignments/...`)
- `fileSize`: Size in bytes
- `fileType`: MIME type
- `submittedAt`: Server Timestamp
- `submissionStatus`: `'NOT_SUBMITTED' | 'SUBMITTED' | 'LATE' | 'GRADED'`
- `marks`: Numeric score (or `null`)
- `feedback`: Faculty written comments (or `null`)
- `gradedAt`: Timestamp of review
- `version`: Sequential version number (1, 2, 3...)

---

## 6. Cloud Storage Hierarchy
```text
gs://student-assignments-store/
└── assignments/
    └── {courseId}/
        └── {assignmentId}/
            └── {studentId}/
                ├── v1_sub-1001_AssignmentReport.pdf
                └── v2_sub-1002_AssignmentReport_Revision.pdf
```
Each object path is uniquely keyed to prevent collisions and isolate student tenancies.

---

## 7. Automated Test Results (25 Test Matrix)
The portal features a built-in automated test runner that validates all 25 test scenarios required by the specification:
1. **Student Registration**: PASS
2. **Teacher Login**: PASS
3. **Invalid Login**: PASS
4. **Student Dashboard Authorization**: PASS
5. **Teacher Dashboard Authorization**: PASS
6. **Teacher Creates Assignment**: PASS
7. **Student Views Assignment**: PASS
8. **Valid PDF Upload**: PASS
9. **Invalid File Extension Rejection**: PASS
10. **Oversized File Rejection**: PASS
11. **On-Time Submission Flag**: PASS
12. **Late Submission Detection**: PASS
13. **Resubmission & Version Increment**: PASS
14. **Student Views Own Submissions**: PASS
15. **Student Cannot View Peer Submission**: PASS
16. **Teacher Views Cohort Submissions**: PASS
17. **Teacher Grades Submission**: PASS
18. **Marks Above Maximum Rejected**: PASS
19. **Student Views Feedback**: PASS
20. **Unauthorized Grading Rejected**: PASS
21. **File Retrieval**: PASS
22. **Storage Failure Handling**: PASS
23. **Database Failure Handling**: PASS
24. **Logout Session Cleanup**: PASS
25. **Protected Route After Logout**: PASS

---

## 8. Conclusion & Future Work
The project successfully demonstrates the principles of modern cloud software engineering: decoupling storage from relational metadata, enforcing zero-trust role-based authorization, utilizing authoritative server clocks for deadline management, and achieving high-throughput scalability. Future extensions include automated plagiarism similarity detection using Sentence-BERT and push notification webhooks for deadline alerts.

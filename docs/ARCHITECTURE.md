# System Architecture & Technical Specifications

**Cloud-Based Student Assignment Submission & Feedback Portal**

---

## 1. High-Level Architecture Diagram

```text
[Students / Faculty Clients]
            │
            ▼ (HTTPS / TLS 1.3)
    [Cloud CDN / Edge Network]
            │
    ┌───────┴────────────────────────┐
    ▼                                ▼
[Frontend Static Hosting]     [API Gateway / Auth Guard]
(Firebase Hosting / S3)        (Cloud Run / Cloud Functions)
                                     │
                 ┌───────────────────┴──────────────────┐
                 ▼                                      ▼
       [Cloud Database Engine]              [Cloud Object Storage]
       (Firestore / DynamoDB)               (Firebase Storage / S3)
       - Users, Courses, Assignments        - assignments/{courseId}/{aid}/
       - Submission Metadata & Marks          {studentId}/v{N}_{subId}_{file}
       - Server Timestamps (Audit)          - Direct streaming via signed URLs
                 │                                      │
                 └───────────────────┬──────────────────┘
                                     ▼
                        [Cloud Logging & Monitoring]
                        (CloudWatch / Google Operations)
```

---

## 2. Decoupled Storage Architecture Pattern

### Why Object Storage Instead of Database Binary Fields?
In modern cloud engineering, saving binary files (PDFs, DOCX, ZIPs) as database blobs is an anti-pattern:
1. **Database Bloat & Indexing Latency**: Relational and document databases use B-Trees or LSM-Trees designed for rapid row/document lookups. Large binary payloads increase memory pressure, fill the page cache with cold data, and slow down index traversal.
2. **Bandwidth Inefficiency**: Reading submission lists does not require fetching 20MB file payloads. Decoupling ensures metadata queries remain lightning-fast (<15ms).
3. **Cost Optimization**: Cloud Object Storage (e.g. S3 standard or Cloud Storage) costs ~$0.02/GB/month, compared to database storage which costs ~$0.18 to $0.25/GB/month.
4. **Durability & Throughput**: Object storage offers 11 9's of durability (99.999999999%) and handles massive parallel stream uploads without exhausting application database thread pools.

---

## 3. Server-Authoritative Deadline Logic

### Preventing Client-Clock Tampering
- **Vulnerability**: If deadline evaluation relies on the client's browser time (`new Date()`), a student can modify their local computer clock back by several hours to falsely submit an overdue assignment as "On-Time".
- **Cloud Solution**: 
  - Every assignment stores an ISO 8601 UTC deadline string (`deadline`).
  - When the student triggers submission, the server captures `request.time` (trusted server timestamp).
  - The evaluation formula:
    ```typescript
    const isLate = serverTimestampMs > deadlineMs;
    const initialStatus = isLate ? 'LATE' : 'SUBMITTED';
    ```
  - If `allowLateSubmissions == false` and `isLate == true`, the write is rejected with HTTP 400 (`SUBMISSION_WINDOW_CLOSED`).

---

## 4. Multi-Tier Scalability Strategy

### Handling 100,000 Students Near Deadline
When 100,000 students rush to submit coursework 10 minutes prior to a deadline, a traditional server crashes. The cloud architecture handles this via:
1. **Direct-to-Bucket Pre-Signed Uploads**: Clients request a temporary pre-signed S3/Storage PUT URL from the API. The heavy binary payload streams directly from the student's browser to the cloud bucket, bypassing the API gateway entirely.
2. **Stateless Horizontal Autoscaling**: API instances auto-scale from 2 to 100+ container instances on Cloud Run / AWS ECS within 15 seconds.
3. **Asynchronous Message Queue Decoupling**: File upload events push a notification to a Pub/Sub queue, allowing background workers to calculate hashes, generate previews, and compute plagiarism checks asynchronously.

---

## 5. Cloud Provider Technology Mapping

| Architectural Capability | This Implementation | Amazon Web Services (AWS) | Google Cloud Platform (GCP) | Microsoft Azure |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend CDN Hosting** | Firebase Hosting | S3 + CloudFront CDN | Cloud CDN + Cloud Storage | Azure Static Web Apps |
| **Binary Object Storage** | Firebase Storage | Amazon S3 | Google Cloud Storage | Azure Blob Storage |
| **Metadata Database** | Cloud Firestore | Amazon DynamoDB / RDS | Cloud Firestore / Cloud SQL | Azure Cosmos DB |
| **Identity & Authentication** | Firebase Auth (RBAC) | AWS Cognito User Pools | Google Identity Platform | Azure AD B2C / Entra |
| **Serverless Compute** | Cloud Functions | AWS Lambda | Google Cloud Run / Functions | Azure Functions |
| **Logging & Monitoring** | Cloud Logging | Amazon CloudWatch | Google Cloud Operations | Azure Monitor |

---

## 6. REST API Endpoints Specification

### Authentication
- `POST /api/register`
  - Body: `{ name: string, email: string, password: string, role: "student" | "teacher" }`
  - Returns: `201 Created` with User identity token.
- `POST /api/login`
  - Body: `{ email: string, password: string }`
  - Returns: `200 OK` with session JWT and role claims.
- `POST /api/logout`
  - Returns: `200 OK` (session invalidated).

### Assignments
- `GET /api/assignments`
  - Headers: `Authorization: Bearer <token>`
  - Returns: `200 OK` (Array of assignments sorted by deadline).
- `POST /api/assignments`
  - Headers: `Authorization: Bearer <token>` (Teacher only)
  - Body: `{ courseId, title, description, deadline, maxMarks, allowedFileTypes, maxFileSizeMB, allowLateSubmissions }`
  - Returns: `201 Created`.
- `DELETE /api/assignments/{id}`
  - Headers: `Authorization: Bearer <token>` (Teacher only)
  - Returns: `204 No Content`.

### Submissions & Grading
- `POST /api/assignments/{id}/submit`
  - Headers: `Authorization: Bearer <token>` (Student only)
  - Multi-part Form / JSON with Storage Reference: `{ fileName, storagePath, fileUrl, fileSize, fileType }`
  - Returns: `201 Created` with version number and status (`SUBMITTED` or `LATE`).
- `GET /api/assignments/{id}/submissions`
  - Headers: `Authorization: Bearer <token>`
  - Role Guard: Teachers see all cohort submissions; Students receive 403 or filtered self-view.
- `POST /api/submissions/{id}/grade`
  - Headers: `Authorization: Bearer <token>` (Teacher only)
  - Body: `{ marks: number, feedback: string }`
  - Validation: `0 <= marks <= maxMarks`.
  - Returns: `200 OK` with updated status `GRADED`.

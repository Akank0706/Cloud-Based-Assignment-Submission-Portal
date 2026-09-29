import React, { useState } from 'react';
import {
  HelpCircle,
  Cloud,
  Server,
  Database,
  HardDrive,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
  Workflow,
  Globe
} from 'lucide-react';

export const CloudConceptsViva: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'concepts' | 'viva' | 'scalability' | 'aws'>('viva');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const interviewQuestions = [
    {
      q: '1. Explain your project.',
      a: 'I developed a Cloud-Based Student Assignment Submission & Feedback Portal where teachers can create assignments and students can upload their submissions through a web application. The assignment files are stored in cloud object storage, while structured information such as users, assignments, deadlines, submission metadata, marks, and feedback is maintained in a cloud database. I implemented authentication and role-based authorization for students and teachers. Teachers can review submissions and provide marks and feedback, which students can later access through their dashboard. The project demonstrates cloud storage, managed databases, REST APIs, authentication, deployment, security, and scalable cloud architecture.'
    },
    {
      q: '2. Why did you use cloud computing for this project?',
      a: 'Cloud computing allows students and teachers to access the portal from different locations without depending on one local computer or server. It also provides scalable storage, centralized data management, managed services, easier deployment, backup options, and the ability to scale when the number of students increases.'
    },
    {
      q: '3. Why did you use object storage for assignment files instead of storing them directly in the database?',
      a: 'Databases are better suited for structured information such as assignment IDs, deadlines, marks, and file references. Large PDF, DOCX, image, or ZIP files are better suited to object storage. The database therefore stores the metadata and storage path, while the actual assignment file is stored in cloud object storage. This prevents database bloat, keeps indexing fast, and reduces operational storage costs.'
    },
    {
      q: '4. What is the difference between authentication and authorization in your project?',
      a: "Authentication verifies who the user is ('Who are you?'), such as confirming a student's or teacher's login. Authorization determines what that authenticated user is allowed to do ('What are you allowed to do?'). For example, a student can upload an assignment but cannot grade it, while an authorized teacher can review submissions and provide marks and feedback."
    },
    {
      q: '5. How does the assignment submission workflow work?',
      a: 'The student selects an assignment and uploads a file. The backend first validates authentication, deadline, file type, and file size. The file is then uploaded to cloud object storage. After successful upload, the storage reference and submission metadata are saved in the cloud database. The teacher can later retrieve the submission through an authorized API.'
    },
    {
      q: '6. How did you implement deadline management?',
      a: "Each assignment contains a server-side deadline. When a student submits a file, the backend compares the trusted server timestamp with the assignment deadline. Based on this comparison, the submission can be marked as SUBMITTED or LATE, or late submission can be rejected depending on the configured policy. I avoid relying on the user's device time because client clocks can be manipulated or skewed by local timezone misconfigurations."
    },
    {
      q: '7. How did you secure student assignment files?',
      a: 'I used authenticated and authorized access rather than making private submission files publicly accessible. The backend verifies the user before providing access, and a production cloud implementation uses private storage buckets with temporary signed URLs or tokenized paths. I also validate file types and sizes and keep cloud credentials and secret keys in environment variables rather than source code.'
    },
    {
      q: '8. What happens if thousands of students upload assignments at the same time near a deadline?',
      a: 'The application scales horizontally using multiple stateless backend instances or serverless functions. A load balancer distributes incoming API requests, while cloud object storage handles direct high-bandwidth binary uploads independently from the application server. A managed database scales read/write capacity, and message queues or background workers can process non-critical tasks like thumbnailing or analytics asynchronously.'
    },
    {
      q: '9. How did you test this project?',
      a: "I tested student and teacher authentication, role-based authorization, assignment creation, valid and invalid uploads, file-size validation, deadline handling, cloud storage, submission metadata, teacher grading, feedback retrieval, unauthorized access attempts, and failure scenarios. I also tested that one student could not access another student's private submission through normal application APIs."
    },
    {
      q: '10. How can this project be improved further in V2?',
      a: 'It can be improved by adding plagiarism detection with Sentence-BERT embeddings, assignment version diffing, automated email or push notifications, automatic deadline reminders, antivirus scanning for uploaded files, rubric-based grading, analytics dashboards, serverless processing, CDN integration, and CI/CD automated deployment pipelines.'
    }
  ];

  const cloudConceptsList = [
    {
      title: 'Cloud Computing & SaaS',
      what: 'On-demand delivery of computing power, database storage, applications, and IT resources via the internet with pay-as-you-go pricing.',
      where: 'The entire portal acts as a Software-as-a-Service (SaaS) LMS hosted on cloud infrastructure accessible from any browser without local client installation.',
      why: 'Students and faculty access coursework from anywhere without managing on-premise hardware.'
    },
    {
      title: 'Cloud Database vs Object Storage',
      what: 'Decoupling structured relational/document records from unstructured binary blob files.',
      where: 'Firestore stores users, deadlines, marks, and metadata; Firebase Storage / S3 stores PDF and DOCX binaries under assignments/{courseId}/{assignmentId}/{studentId}/.',
      why: 'Databases retain high-speed queries and indexes without bloating from multi-megabyte binary files.'
    },
    {
      title: 'Server-Side Trusted Timestamps',
      what: 'Generating authoritative UTC timestamps on the server/cloud function rather than trusting client-reported timestamps.',
      where: 'In submitAssignment() and databaseService.getServerTimestamp(), used to accurately compare submitted_at <= deadline.',
      why: 'Prevents students from bypassing deadlines by tampering with device clocks.'
    },
    {
      title: 'Role-Based Access Control (RBAC)',
      what: 'Enforcing distinct privileges based on authenticated identity role claims (Student vs Teacher).',
      where: 'Enforced at frontend routes and backend security rules. Students cannot access teacher dashboards or grade submissions.',
      why: 'Prevents privilege escalation and unauthorized modifications of grades.'
    },
    {
      title: 'Stateless REST Architecture',
      what: 'Client-server separation where each HTTP request contains all context needed to execute the operation.',
      where: 'Endpoints like POST /api/assignments/{id}/submit and POST /api/submissions/{id}/grade.',
      why: 'Enables independent horizontal autoscaling of backend instances behind a cloud load balancer.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Academic & Viva Voce Guide
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Course: Cloud Computing (CS401)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Cloud Architecture, Concepts & Viva Preparation
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Comprehensive breakdown of architectural pillars, interview Q&A, multi-tier scalability, and cloud vendor mappings.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveSection('viva')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeSection === 'viva' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            10 Viva Q&As
          </button>
          <button
            onClick={() => setActiveSection('concepts')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeSection === 'concepts' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cloud Concepts
          </button>
          <button
            onClick={() => setActiveSection('scalability')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeSection === 'scalability' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Scalability (100k)
          </button>
          <button
            onClick={() => setActiveSection('aws')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeSection === 'aws' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AWS / Azure / GCP Map
          </button>
        </div>
      </div>

      {/* SECTION: 10 VIVA QUESTIONS & ANSWERS */}
      {activeSection === 'viva' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-900 flex items-start space-x-3">
            <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">Examiner & Interview Preparation</span>
              These 10 answers are formulated specifically from the perspective of an engineering student who designed, built, tested, and deployed this cloud system.
            </div>
          </div>

          <div className="space-y-3">
            {interviewQuestions.map((item, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <span className="font-bold text-slate-900 text-sm">{item.q}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-700 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                        <strong className="text-indigo-700 block mb-1">Recommended Response:</strong>
                        <p>{item.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: CLOUD CONCEPTS */}
      {activeSection === 'concepts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cloudConceptsList.map((concept, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center border border-indigo-200">
                  {idx + 1}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{concept.title}</h3>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block">Definition / Cloud Meaning:</span>
                  <p className="text-slate-600 mt-0.5">{concept.what}</p>
                </div>

                <div className="bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100">
                  <span className="font-semibold text-indigo-900 block">Where it appears in this project:</span>
                  <p className="text-indigo-800 mt-0.5 font-mono text-[11px]">{concept.where}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block">Why it matters:</span>
                  <p className="text-slate-600 mt-0.5">{concept.why}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECTION: SCALABILITY ARCHITECTURE */}
      {activeSection === 'scalability' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <span>Multi-Tier Scalability Lifecycle</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              How the architecture adapts as student enrollment grows from a single classroom (10 students) to a department (1,000 students) and a university system (100,000 students submitting simultaneously).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 text-sm">Tier 1: 10 Students</div>
                <div className="text-[11px] font-mono text-slate-500">Free Tier / Monolith / Dev</div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Single instance backend server</li>
                  <li>Free-tier Firestore document collection</li>
                  <li>Direct file upload to Firebase Storage</li>
                  <li>No caching layer needed</li>
                  <li>Synchronous grading reviews</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 text-sm">Tier 2: 1,000 Students</div>
                <div className="text-[11px] font-mono text-slate-500">Cloud Run / Autoscaling</div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Stateless container instances (0 to 10 instances)</li>
                  <li>Firestore read replicas and indexing rules</li>
                  <li>Presigned direct-to-S3/GCS upload URLs</li>
                  <li>Redis caching for assignment metadata</li>
                  <li>Cloud CDN for static assets</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="font-bold text-slate-900 text-sm">Tier 3: 100,000 Students</div>
                <div className="text-[11px] font-mono text-slate-500">Enterprise High-Spike Engine</div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Global Anycast CDN + API Gateway</li>
                  <li>Direct client-to-Object-Storage upload with presigned URLs</li>
                  <li>Pub/Sub message queues for async submission processing</li>
                  <li>Distributed database sharding & read replicas</li>
                  <li>Multi-AZ failover and circuit breakers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Spike Scenario: 100,000 Students uploading at deadline */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xs space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">
              Critical Architecture Exam Scenario
            </span>
            <h4 className="font-bold text-base">
              Scenario: 100,000 students uploading assignments simultaneously 10 minutes before midnight deadline.
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 pt-2">
              <div className="space-y-2">
                <strong className="text-white block">1. Why traditional web servers crash:</strong>
                <p>
                  If 100,000 students stream 15MB PDFs through an application server, the server exhausts sockets, threads, and memory, crashing under network I/O congestion.
                </p>
              </div>
              <div className="space-y-2">
                <strong className="text-white block">2. How Cloud Architecture solves this:</strong>
                <p>
                  <strong>Direct Upload Pattern:</strong> The client asks the API for a short-lived Pre-Signed URL. The 15MB file is uploaded directly to Cloud Object Storage (S3/GCS), completely bypassing the application server! Once finished, an event triggers a serverless worker to commit the database record.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: AWS / AZURE / GCP EQUIVALENTS */}
      {activeSection === 'aws' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70">
            <h3 className="font-bold text-slate-900 text-base">Cloud Provider Architecture Mapping</h3>
            <p className="text-xs text-slate-500">
              Equivalent architectural components across major cloud providers (Section 40 & 41 requirements).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[10px] uppercase">
                <tr>
                  <th className="px-5 py-3">Architectural Component</th>
                  <th className="px-4 py-3">This Implementation (Firebase/Local)</th>
                  <th className="px-4 py-3">Amazon Web Services (AWS)</th>
                  <th className="px-4 py-3">Google Cloud Platform (GCP)</th>
                  <th className="px-4 py-3">Microsoft Azure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-sans font-semibold text-slate-900">Frontend Hosting</td>
                  <td className="px-4 py-3 text-indigo-700">Firebase Hosting</td>
                  <td className="px-4 py-3">S3 + CloudFront CDN</td>
                  <td className="px-4 py-3">Cloud CDN + Cloud Storage</td>
                  <td className="px-4 py-3">Azure Static Web Apps</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-sans font-semibold text-slate-900">Binary Object Storage</td>
                  <td className="px-4 py-3 text-indigo-700">Firebase Storage (gs://)</td>
                  <td className="px-4 py-3">Amazon S3</td>
                  <td className="px-4 py-3">Google Cloud Storage</td>
                  <td className="px-4 py-3">Azure Blob Storage</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-sans font-semibold text-slate-900">Metadata Database</td>
                  <td className="px-4 py-3 text-indigo-700">Cloud Firestore</td>
                  <td className="px-4 py-3">Amazon DynamoDB / RDS</td>
                  <td className="px-4 py-3">Cloud Firestore / Cloud SQL</td>
                  <td className="px-4 py-3">Azure Cosmos DB</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-sans font-semibold text-slate-900">User Identity & Auth</td>
                  <td className="px-4 py-3 text-indigo-700">Firebase Auth (RBAC)</td>
                  <td className="px-4 py-3">Amazon Cognito User Pools</td>
                  <td className="px-4 py-3">Google Identity Platform</td>
                  <td className="px-4 py-3">Azure AD B2C / Entra ID</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-sans font-semibold text-slate-900">Serverless Compute</td>
                  <td className="px-4 py-3 text-indigo-700">Cloud Functions (Node.js)</td>
                  <td className="px-4 py-3">AWS Lambda</td>
                  <td className="px-4 py-3">Google Cloud Run / Functions</td>
                  <td className="px-4 py-3">Azure Functions</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-sans font-semibold text-slate-900">Monitoring & Logging</td>
                  <td className="px-4 py-3 text-indigo-700">Cloud Logging</td>
                  <td className="px-4 py-3">Amazon CloudWatch</td>
                  <td className="px-4 py-3">Google Cloud Monitoring</td>
                  <td className="px-4 py-3">Azure Monitor / Application Insights</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

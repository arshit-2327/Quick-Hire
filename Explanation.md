# 📘 Quick Hire — Complete Project Explanation
### *A Beginner-to-Intermediate Deep Dive*

> Written so that someone who has basic Java + JavaScript knowledge can understand every layer of this project — from a user clicking a button all the way to the database and back.

---

## 📑 Table of Contents

1. [What is Quick Hire?](#1-what-is-quick-hire)
2. [Big Picture Architecture](#2-big-picture-architecture)
3. [Tech Stack Explained](#3-tech-stack-explained)
4. [Database Design](#4-database-design)
5. [JWT Authentication — How it Works](#5-jwt-authentication--how-it-works)
6. [Spring Security — Guarding Every Route](#6-spring-security--guarding-every-route)
7. [REST API Endpoints (All Hit Points)](#7-rest-api-endpoints-all-hit-points)
8. [Resume Upload & PDF Extraction](#8-resume-upload--pdf-extraction)
9. [NLP & Machine Learning — Cosine Similarity Explained](#9-nlp--machine-learning--cosine-similarity-explained)
10. [Gemini AI Integration](#10-gemini-ai-integration)
11. [What Happens WITHOUT a Gemini API Key (Offline Fallback)](#11-what-happens-without-a-gemini-api-key-offline-fallback)
12. [Job Matching — Full Scoring Formula](#12-job-matching--full-scoring-formula)
13. [Frontend Architecture (React)](#13-frontend-architecture-react)
14. [Role-Based Access Control (RBAC)](#14-role-based-access-control-rbac)
15. [Complete Request-Response Flow (End to End)](#15-complete-request-response-flow-end-to-end)
16. [How to Run the Project](#16-how-to-run-the-project)

---

## 1. What is Quick Hire?

Quick Hire is a **full-stack AI-powered recruitment platform**.

Think of it as a smarter version of LinkedIn Jobs + an ATS (Applicant Tracking System):

- A **Recruiter** creates a company account, posts job openings
- A **Candidate** creates an account, uploads their PDF resume
- The system uses **AI (Gemini)** or **built-in NLP** to extract skills from the resume
- It then **mathematically matches** candidates to jobs using cosine similarity vectors
- Recruiters see a ranked list of candidates and can **Accept or Reject** them
- Candidates can track their **application status** in real time

```
┌─────────────────────────────────────────────────────────────┐
│                      QUICK HIRE PLATFORM                    │
│                                                             │
│   CANDIDATE                           RECRUITER             │
│   ─────────                           ─────────             │
│   ✦ Register/Login                    ✦ Register/Login      │
│   ✦ Upload PDF Resume                 ✦ Post Job Openings   │
│   ✦ Browse Job Openings               ✦ View Ranked         │
│   ✦ Apply to Jobs                       Applicants          │
│   ✦ Track Application Status          ✦ Accept / Reject     │
│                                         Candidates          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Big Picture Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (User's Computer)                       │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │              FRONTEND  (React + Vite, port 5173)                │   │
│   │                                                                 │   │
│   │   HomePage  JobsPage  CandidateDashboard  RecruiterDashboard   │   │
│   │       └──────────────────┬──────────────────────┘              │   │
│   │                     api.js (fetch calls)                        │   │
│   └──────────────────────────┼──────────────────────────────────────┘   │
│                              │  HTTP Requests with JWT Bearer Token      │
│                              │  (JSON over REST)                         │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      BACKEND  (Spring Boot, port 8080)                   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Spring Security Filter Chain                                    │    │
│  │  ┌──────────────────────────────────────────────────────────┐   │    │
│  │  │  JwtAuthenticationFilter  →  reads Bearer token          │   │    │
│  │  │                           →  validates signature         │   │    │
│  │  │                           →  sets SecurityContext        │   │    │
│  │  └──────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
│                               │  (request allowed through)               │
│  ┌────────────────────────────▼────────────────────────────────────┐    │
│  │                      Controllers (REST)                          │    │
│  │  AuthController  ResumeController  JobController                │    │
│  │  JobApplicationController  MatchController  ConfigController     │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
│                               │                                           │
│  ┌────────────────────────────▼────────────────────────────────────┐    │
│  │                       Service Layer                              │    │
│  │  UserService  ResumeService  JobMatchingService                 │    │
│  │  GeminiAIService  JobApplicationService                         │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
│                               │                                           │
│  ┌────────────────────────────▼────────────────────────────────────┐    │
│  │                      Repository Layer (JPA)                      │    │
│  │  UserRepository  CandidateProfileRepository  JobRepository      │    │
│  │  JobApplicationRepository                                        │    │
│  └────────────────────────────┬────────────────────────────────────┘    │
│                               │                                           │
└───────────────────────────────┼──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        DATABASE  (H2 In-Memory)                          │
│                                                                          │
│  users  |  candidate_profiles  |  jobs  |  job_applications             │
└──────────────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
         ┌──────────┐   ┌─────────────┐  ┌──────────────┐
         │ Gemini   │   │  PDFBox     │  │ VectorMath   │
         │ AI API   │   │  (PDF read) │  │ Util (NLP)   │
         └──────────┘   └─────────────┘  └──────────────┘
```

---

## 3. Tech Stack Explained

### Backend

| Technology | What it Does | Why Used |
|:---|:---|:---|
| **Spring Boot 3** | Main framework, auto-wires everything | Industry standard Java backend |
| **Spring Security** | Intercepts every request, checks auth | Secure all API routes |
| **JWT (JJWT 0.12)** | Stateless login token | No sessions needed, works with React |
| **Spring Data JPA** | ORM — maps Java objects to DB tables | Avoid writing raw SQL |
| **H2 Database** | In-memory SQL database | No setup needed, perfect for demo |
| **Apache PDFBox 3** | Reads text from uploaded PDF resumes | Extract resume text |
| **Bean Validation** | `@Valid` on DTOs — validates input data | Reject bad requests early |
| **RestClient** | Spring's built-in HTTP client | Call Gemini AI REST API |

### Frontend

| Technology | What it Does |
|:---|:---|
| **React 18** | UI component library |
| **Vite** | Fast development server & bundler |
| **React Router v6** | Client-side routing (no page reload) |
| **Context API** | Global auth state (who is logged in) |
| **Tailwind CSS v4** | Utility-first styling |
| **Lucide React** | Icon library |

### AI / ML

| Technology | What it Does |
|:---|:---|
| **Gemini 1.5 Flash** | Parses resume text → structured JSON |
| **text-embedding-004** | Converts text → 768-number vector |
| **Cosine Similarity** | Math formula to compare two vectors |
| **Fallback NLP** | Built-in skill extractor (no API key needed) |

---

## 4. Database Design

> **H2 is an in-memory database.** It lives in RAM. Every time you restart the backend, data resets. For production you would swap to PostgreSQL or MySQL.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                             │
│                                                                      │
│  ┌─────────────────┐          ┌──────────────────────────────────┐  │
│  │     USERS       │          │       CANDIDATE_PROFILES         │  │
│  │─────────────────│  1    1  │──────────────────────────────────│  │
│  │ id (PK)         │◄─────────│ id (PK)                          │  │
│  │ name            │          │ user_id (FK → users.id)          │  │
│  │ email (unique)  │          │ full_name                        │  │
│  │ password (hash) │          │ email                            │  │
│  │ role            │          │ phone                            │  │
│  │   STUDENT       │          │ extracted_skills (JSON array)    │  │
│  │   RECRUITER     │          │ inferred_roles (JSON array)      │  │
│  │ company_name    │          │ experience_summary               │  │
│  │ created_at      │          │ raw_resume_text                  │  │
│  └─────────────────┘          │ embedding_json (768 floats)      │  │
│                               └──────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────────────────┐      ┌─────────────────────────────┐   │
│  │          JOBS           │      │      JOB_APPLICATIONS        │   │
│  │─────────────────────────│ 1  * │─────────────────────────────│   │
│  │ id (PK)                 │◄─────│ id (PK)                      │   │
│  │ title                   │      │ job_id (FK → jobs.id)        │   │
│  │ company                 │      │ candidate_id (FK → profiles) │   │
│  │ location                │      │ candidate_name               │   │
│  │ job_type                │      │ match_score (double)         │   │
│  │ experience_level        │      │ status:                      │   │
│  │ salary_range            │      │   PENDING                    │   │
│  │ description             │      │   ACCEPTED                   │   │
│  │ required_skills (JSON)  │      │   REJECTED                   │   │
│  │ embedding_json (768 fl) │      │ applied_at                   │   │
│  │ recruiter_id (FK)       │      └─────────────────────────────┘   │
│  │ created_at              │                                         │
│  └─────────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Concept — `embedding_json`:**
Each candidate profile and each job stores a **768-number array** (called an embedding vector) as a JSON string in the database. This vector mathematically represents "what this text means." Two similar texts will have vectors that point in almost the same direction.

---

## 5. JWT Authentication — How it Works

> **JWT = JSON Web Token.** Think of it as a tamper-proof digital ID card that the server gives you when you log in.

### Step 1 — User Registers / Logs In

```
Browser                              Spring Boot Backend
  │                                        │
  │  POST /api/auth/register               │
  │  Body: { name, email, password, role } │
  │ ──────────────────────────────────────►│
  │                                        │ 1. Validate input (@Valid)
  │                                        │ 2. Hash password with BCrypt
  │                                        │    "password123" → "$2a$10$..."
  │                                        │ 3. Save User to DB
  │                                        │ 4. Generate JWT token
  │                                        │
  │  Response: { id, name, role, token }   │
  │ ◄──────────────────────────────────────│
  │                                        │
  │ [Browser saves token in localStorage]  │
```

### Step 2 — What is Inside a JWT?

A JWT has 3 parts separated by dots: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiJ9          ← Header (algorithm used: HMAC-SHA256)
  .
eyJzdWIiOiJ1c2VyQGVtYWlsLmNvbSIsInJvbGUiOiJTVFVERU5UIiwiaWQiOjF9
                               ← Payload (email, role, userId, expiry time)
  .
xK9mN2pQ3rS1vW8yZ5aB          ← Signature (proves nobody tampered with it)
```

The **Payload** after base64 decoding looks like:
```json
{
  "sub": "user@email.com",
  "role": "STUDENT",
  "id": 1,
  "iat": 1727500000,
  "exp": 1727586400
}
```

### Step 3 — Every API Request Carries the Token

```
Browser                                      Backend
  │                                               │
  │  GET /api/applications/candidate/1            │
  │  Headers:                                     │
  │    Authorization: Bearer eyJhbGci...          │
  │ ─────────────────────────────────────────────►│
  │                                               │ JwtAuthenticationFilter:
  │                                               │  1. Extract token from header
  │                                               │  2. Verify HMAC signature
  │                                               │  3. Check not expired
  │                                               │  4. Read email + role
  │                                               │  5. Set SecurityContext
  │                                               │  6. Pass to Controller
  │  Response: [...applications array]            │
  │ ◄─────────────────────────────────────────────│
```

### Key Files

| File | Role |
|:---|:---|
| `JwtTokenProvider.java` | Generates the JWT token, validates it, reads claims |
| `JwtAuthenticationFilter.java` | Spring filter that runs on EVERY request |
| `AuthController.java` | `/api/auth/register` and `/api/auth/login` endpoints |
| `UserDetailsServiceImpl.java` | Loads user from DB given email (for Spring Security) |

---

## 6. Spring Security — Guarding Every Route

> **Spring Security** wraps every HTTP request in a filter chain — like a security checkpoint at the entrance of a building.

```
Incoming HTTP Request
        │
        ▼
┌─────────────────────────────────────────┐
│         SPRING SECURITY FILTER CHAIN    │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  1. CorsFilter                   │   │  Allows cross-origin (React on 5173
│  │     Allow React (5173) to call   │   │  calling Spring on 8080)
│  │     Spring (8080)                │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  2. JwtAuthenticationFilter      │   │  Reads the Bearer token.
│  │     Extract → Validate → Set     │   │  If valid: sets "who is logged in"
│  │     SecurityContext              │   │  If invalid: SecurityContext empty
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  3. authorizeHttpRequests rules  │   │
│  │                                  │   │
│  │  /api/auth/**        → PUBLIC    │   │  Anyone can register/login
│  │  GET /api/jobs/**    → PUBLIC    │   │  Anyone can see jobs
│  │  /api/applications/**→ PUBLIC*   │   │  Token validated by business logic
│  │  everything else     → MUST AUTH │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
        │
        ▼
   Controller handles request
```

**BCrypt Password Hashing:**
```
Registration:   "myPassword123" → BCrypt → "$2a$10$K8zJ9..." (stored in DB)
Login attempt:  BCrypt.matches("myPassword123", "$2a$10$K8zJ9...") → true ✓

The original password is NEVER stored. BCrypt is a one-way hash.
Even the developer cannot reverse it back to the original.
```

---

## 7. REST API Endpoints (All Hit Points)

> A **REST API endpoint** is a URL that your frontend calls to get or send data. Think of each endpoint as a function that lives on the server.

### Auth Endpoints (`/api/auth`)
```
POST /api/auth/register    → Register new user (Candidate or Recruiter)
POST /api/auth/login       → Login, get JWT token back
```

### Resume Endpoints (`/api/resume`)
```
POST   /api/resume/upload              → Upload PDF/TXT resume file
GET    /api/resume/user/{userId}       → Get candidate's parsed resume profile
DELETE /api/resume/user/{userId}       → Delete candidate's resume
GET    /api/resume/all                 → Get all candidate profiles (recruiter view)
```

### Job Endpoints (`/api/jobs`)
```
GET    /api/jobs           → Get all job postings (public, no auth needed)
POST   /api/jobs           → Create new job (recruiter only)
DELETE /api/jobs/{id}      → Delete a job posting (recruiter only)
```

### Application Endpoints (`/api/applications`)
```
POST  /api/applications/apply              → Candidate applies to a job
GET   /api/applications/candidate/{userId} → Candidate sees their own applications
GET   /api/applications/job/{jobId}        → Recruiter sees who applied (ranked)
PATCH /api/applications/{id}/status        → Recruiter accepts or rejects
```

### Match Endpoints (`/api/matches`)
```
GET /api/matches/user/{userId}              → All jobs ranked for a candidate
GET /api/matches/candidate/{candidateId}    → Same but by candidate profile ID
GET /api/matches/job/{jobId}/candidates     → All candidates ranked for a job
```

### Config Endpoints (`/api/config`)
```
GET  /api/config/status      → Check if Gemini key is set, DB status
POST /api/config/gemini-key  → Update the Gemini API key at runtime
```

### How a Frontend Call Looks (from `api.js`)
```javascript
// Example: Candidate applies to a job
async applyToJob(jobId, userId) {
    const res = await fetch('http://localhost:8080/api/applications/apply', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('quickhire_token')}`
        },
        body: JSON.stringify({ jobId, userId })
    });
    return res.json();  // Spring returns the application object as JSON
}
```

---

## 8. Resume Upload & PDF Extraction

> This is the first "magic" step. A user uploads their PDF resume and the system reads all the text from it automatically.

```
Browser                     ResumeController              ResumeService
   │                              │                            │
   │  POST /api/resume/upload     │                            │
   │  multipart/form-data         │                            │
   │  (file=resume.pdf, userId=1) │                            │
   │ ────────────────────────────►│                            │
   │                              │  processResume(file, 1)   │
   │                              │ ──────────────────────────►│
   │                              │                            │ 1. Check file type
   │                              │                            │    .pdf or .txt?
   │                              │                            │
   │                              │                            │ 2. If PDF:
   │                              │                            │    PDFBox reads pages
   │                              │                            │    Extracts all text
   │                              │                            │
   │                              │                            │ 3. Send raw text to
   │                              │                            │    GeminiAIService
   │                              │                            │    (or fallback NLP)
   │                              │                            │
   │                              │                            │ 4. Get back:
   │                              │                            │    { fullName, email,
   │                              │                            │      skills[], roles[],
   │                              │                            │      summary }
   │                              │                            │
   │                              │                            │ 5. Generate embedding
   │                              │                            │    vector (768 numbers)
   │                              │                            │
   │                              │                            │ 6. Save CandidateProfile
   │                              │                            │    to H2 database
   │                              │                            │
   │  { id, fullName, skills[] }  │                            │
   │ ◄────────────────────────────│                            │
```

**Apache PDFBox usage (simplified):**
```java
// Inside ResumeService.java
PDDocument doc = PDDocument.load(file.getInputStream());
PDFTextStripper stripper = new PDFTextStripper();
String rawText = stripper.getText(doc);  // Full resume text extracted!
doc.close();
// rawText is then sent to GeminiAIService for parsing
```

---

## 9. NLP & Machine Learning — Cosine Similarity Explained

> This is the core "intelligence" of Quick Hire. Let's understand it step by step.

### What is a Vector / Embedding?

Imagine you want to compare two resumes. You cannot just compare words directly because "Java developer" and "Spring Boot engineer" are similar but use different words.

The solution: **convert text into numbers (a vector)**.

```
"Java developer with React"  →  [0.23, -0.45, 0.88, 0.11, ..., 0.34]
                                  ←────────── 768 numbers ──────────→

"Spring Boot frontend React" →  [0.25, -0.41, 0.85, 0.09, ..., 0.31]
                                  ←────────── 768 numbers ──────────→
```

These numbers capture the **meaning** of the text. Similar texts produce similar numbers.

### What is Cosine Similarity?

Imagine each text as an **arrow pointing in space**:

```
         ↑ Y
         │
         │  ← Job description arrow
         │  /
         │ /  θ (angle between them — small = very similar)
         │/──────────────────────────→ X
         │
          ↘ Resume arrow
```

The **cosine of the angle** between the two arrows:
```
  angle =  0°  →  cos(0°)   = 1.0  → Perfect match (same direction)
  angle = 45°  →  cos(45°) ≈ 0.7  → Good match
  angle = 90°  →  cos(90°)  = 0.0  → No relation at all
  angle = 180° →  cos(180°) = -1.0 → Completely opposite meaning
```

### The Math Formula

```
              A · B
cos(θ) = ────────────────
           |A| × |B|

Where:
  A · B = dot product (multiply each pair of numbers, add them all)
  |A|   = magnitude of vector A (square root of sum of squares)
  |B|   = magnitude of vector B
```

### Code in `VectorMathUtil.java` (simplified)
```java
public static double cosineSimilarity(List<Double> a, List<Double> b) {
    double dot = 0, magA = 0, magB = 0;
    for (int i = 0; i < a.size(); i++) {
        dot  += a.get(i) * b.get(i);   // A · B (dot product)
        magA += a.get(i) * a.get(i);   // |A|² (magnitude squared)
        magB += b.get(i) * b.get(i);   // |B|² (magnitude squared)
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
```

### Full Scoring Formula Used in Quick Hire

```
┌──────────────────────────────────────────────────────────────────┐
│                    HYBRID MATCHING SCORE                         │
│                                                                  │
│  Component 1: Cosine Similarity (Vector NLP)          45%       │
│  ──────────────────────────────────────────────────────────      │
│  Compares the overall "semantic meaning" of the                  │
│  resume vs job description using 768-dim vectors                 │
│                                                                  │
│  Component 2: Skill Overlap (Keyword matching)        45%       │
│  ──────────────────────────────────────────────────────────      │
│  matched_skills / total_required_skills × 100                   │
│  Example: 4 out of 5 required skills matched → 80%              │
│                                                                  │
│  Component 3: Role Alignment Bonus                    10%       │
│  ──────────────────────────────────────────────────────────      │
│  Does candidate's inferred role match the job title?            │
│  "Full Stack Developer" vs "Full Stack Engineer" → +10          │
│                                                                  │
│  FINAL = (CosSim% × 0.45) + (SkillOverlap% × 0.45) + Bonus     │
│  Result is clamped between 0 and 100                             │
└──────────────────────────────────────────────────────────────────┘
```

**Example calculation:**
```
Candidate resume: React, Java, Spring Boot, MySQL, Docker
Job requires:     React, Spring Boot, PostgreSQL, Docker, Kubernetes

Cosine Similarity  → 0.78 → 78% (vectors are semantically close)
Skill Overlap      → 3 of 5 matched (React, Spring Boot, Docker) → 60%
Role Alignment     → "Full Stack" inferred, job says "Full Stack Engineer" → +10

Final Score = (78 × 0.45) + (60 × 0.45) + 10
            = 35.1 + 27.0 + 10.0
            = 72.1 / 100
```

---

## 10. Gemini AI Integration

> **Google Gemini** is an AI model from Google. Quick Hire uses it for three tasks.

### Task A — Resume Parsing (`gemini-1.5-flash`)

GeminiAIService sends this structured prompt to the Gemini API:

```
"You are an expert AI Technical Recruiter & ATS parser.
 Extract structured data from the following resume text.
 Return ONLY a valid JSON object with this exact schema:
 {
   'fullName': '...',
   'email': '...',
   'extractedSkills': ['React', 'Spring Boot', 'Java', ...],
   'inferredRoles': ['Full Stack Developer', 'Backend Developer', ...],
   'experienceSummary': '...',
   'education': '...'
 }
 Resume Text: [paste of full PDF text here]"
```

Gemini returns structured JSON:
```json
{
  "fullName": "Arshit Kumar",
  "email": "arshit@example.com",
  "extractedSkills": ["Java", "React", "Spring Boot", "MySQL", "Docker"],
  "inferredRoles": ["Full Stack Developer", "Backend Developer"],
  "experienceSummary": "2 years experience building REST APIs...",
  "education": "B.Tech Computer Science"
}
```

### Task B — Text Embeddings (`text-embedding-004`)

```
API Call:
POST https://generativelanguage.googleapis.com/v1beta/models/
     text-embedding-004:embedContent?key=YOUR_API_KEY

Request Body:
{
  "content": {
    "parts": [{ "text": "Java Spring Boot React developer 3 years..." }]
  }
}

Response:
{
  "embedding": {
    "values": [0.023, -0.445, 0.882, ..., 0.341]
    // 768 numbers that mathematically represent the meaning of the text
  }
}
```

### Task C — Match Analysis (`gemini-1.5-flash`)

```
Prompt:
"Compare this Candidate with the Job.
 Candidate Skills: Java, React, Docker
 Job Required Skills: React, Spring Boot, Kubernetes
 Return JSON: { matchedSkills, missingSkills, fitSummary, advice, roleAligned }"

Response:
{
  "matchedSkills": ["React", "Docker"],
  "missingSkills": ["Spring Boot", "Kubernetes"],
  "fitSummary": "Strong frontend match but backend gap exists.",
  "advice": "Consider learning Kubernetes and Spring Boot to improve fit.",
  "roleAligned": true
}
```

---

## 11. What Happens WITHOUT a Gemini API Key (Offline Fallback)

> 🔑 **The entire system works even with NO Gemini API key.** There is a complete built-in NLP engine as backup.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DUAL-MODE ARCHITECTURE                               │
│                                                                         │
│          isApiKeyConfigured()?                                          │
│                   │                                                     │
│          ┌────────┴────────┐                                            │
│          ▼ YES             ▼ NO                                         │
│   ┌──────────────┐  ┌──────────────────────────────────────────────┐   │
│   │  Gemini API  │  │         BUILT-IN OFFLINE NLP ENGINE          │   │
│   │              │  │                                              │   │
│   │ Smart JSON   │  │  RESUME PARSING (fallbackParseResume):       │   │
│   │ extraction   │  │  • Regex finds email: user@domain.com        │   │
│   │ using a      │  │  • Regex finds phone: +91 9876543210         │   │
│   │ large AI     │  │  • First short non-email line = name         │   │
│   │ model        │  │  • Scan for 50+ known tech skills in list:   │   │
│   │              │  │    Java, React, Docker, Python, MySQL...     │   │
│   │ Handles      │  │  • Infer roles from skill combinations:      │   │
│   │ complex and  │  │    React + Java → Full Stack Developer       │   │
│   │ nuanced text │  │    Docker + K8s → DevOps Engineer            │   │
│   └──────────────┘  │                                              │   │
│          │          │  EMBEDDINGS (VectorMathUtil.fallback):       │   │
│          │          │  • TF-IDF style word frequency analysis      │   │
│          │          │  • Maps words to a 1000+ tech vocabulary     │   │
│          │          │  • Generates frequency-based vector          │   │
│          │          │  • Padded to 768 dimensions for consistency  │   │
│          │          │                                              │   │
│          │          │  MATCH ANALYSIS (fallbackAnalyzeMatch):      │   │
│          │          │  • Direct skill list comparison              │   │
│          │          │  • Case-insensitive string matching          │   │
│          │          │  • Role title substring matching             │   │
│          │          └──────────────────────────────────────────────┘   │
│          │                         │                                    │
│          └──────────┬──────────────┘                                    │
│                     ▼                                                   │
│            Same output format                                           │
│            { skills[], roles[], embeddings[] }                          │
│            → Rest of system works identically in both modes             │
└─────────────────────────────────────────────────────────────────────────┘
```

**Code pattern for graceful fallback:**
```java
public ParsedResumeData parseResume(String resumeText) {
    if (isApiKeyConfigured()) {          // Gemini key present?
        try {
            ParsedResumeData data = callGeminiForResume(resumeText);
            if (data != null && !data.extractedSkills.isEmpty()) {
                return data;             // Gemini worked — return result
            }
        } catch (Exception e) {
            log.warn("Gemini failed, using built-in NLP: {}", e.getMessage());
            // Falls through to offline fallback below
        }
    }
    return fallbackParseResume(resumeText);  // Always works offline
}
```

### Comparison: Gemini vs Offline Fallback

| Feature | With Gemini Key | Without Gemini Key |
|:---|:---:|:---:|
| Resume parsing quality | Excellent | Good |
| Handles informal/creative resumes | Yes | Limited |
| Skills extracted | All, including inferred | 50+ known tech skills |
| Embedding quality (vector) | Real 768-dim semantic NLP | TF-IDF approximation |
| Match analysis reasoning | Natural language explanation | Rule-based template |
| Internet required | Yes | No — fully offline |
| Cost | ~$0.001 per resume | Free forever |

---

## 12. Job Matching — Full Scoring Formula

> When a recruiter opens a job, they see all candidates **ranked by match score**. Here is the complete flow:

```
Recruiter opens job → GET /api/applications/job/{jobId}
                           │
                           ▼
                  JobApplicationController
                           │
                           ▼
                  applicationService.getApplicantsRanked(jobId)
                           │
                    For each application:
                           │
                     ┌─────┴──────────────────────────────────────┐
                     │        JobMatchingService                   │
                     │                                             │
                     │  1. Load candidate embedding from DB        │
                     │     (if empty → generate via Gemini/NLP)   │
                     │                                             │
                     │  2. Load job embedding from DB             │
                     │     (if empty → generate via Gemini/NLP)   │
                     │                                             │
                     │  3. Cosine Similarity                       │
                     │     → 0.0 to 1.0 score                      │
                     │     → Multiply by 100 → percentage          │
                     │                                             │
                     │  4. Skill Overlap (via Gemini or fallback)  │
                     │     → matched / total × 100                 │
                     │                                             │
                     │  5. Role Alignment bonus                    │
                     │     → +10 if roles match, else 0           │
                     │                                             │
                     │  6. Hybrid Score                            │
                     │     = (cos × 0.45) + (skill × 0.45)        │
                     │       + roleBonus                           │
                     │                                             │
                     │  7. Attach: matchedSkills, missingSkills,   │
                     │            fitSummary, improvement advice   │
                     └────────────────────────────────────────────┘
                           │
                    Sort by score DESC (highest first)
                           │
                           ▼
                  Return ranked list to Recruiter Dashboard
```

---

## 13. Frontend Architecture (React)

> The frontend is a **Single Page Application (SPA)**. The browser loads ONE HTML file and React handles all navigation without full page reloads.

### Project Structure

```
frontend/src/
├── main.jsx              ← Entry point. Wraps app with BrowserRouter + AuthProvider
├── App.jsx               ← Route definitions (which URL shows which page)
├── index.css             ← Global styles, CSS variables, custom fonts
├── App.css               ← Animations (fadeIn keyframe)
├── api.js                ← ALL HTTP calls to the backend live here
│
├── context/
│   └── AuthContext.jsx   ← Global state: who is logged in, JWT token
│
├── components/
│   ├── Navbar.jsx        ← Top navigation bar (role-aware)
│   ├── Footer.jsx        ← Bottom footer
│   └── AuthModal.jsx     ← Login/Register popup modal
│
└── pages/
    ├── HomePage.jsx           ← Landing page with featured jobs
    ├── JobsPage.jsx           ← All jobs + Apply button (visible to all)
    ├── CandidateDashboard.jsx ← Resume upload + My applications tracker
    ├── RecruiterDashboard.jsx ← Post jobs + Review ranked applicants
    └── SettingsPage.jsx       ← Gemini key management + system status
```

### How Components Connect

```
main.jsx
  └── BrowserRouter (enables URL-based navigation)
        └── AuthProvider (provides currentUser, login, logout to all)
              └── App.jsx
                    ├── Navbar (reads currentUser from AuthContext)
                    ├── AuthModal (controlled by AuthContext open/close)
                    │
                    ├── Route "/"           → HomePage
                    ├── Route "/jobs"       → JobsPage
                    ├── Route "/candidate"  → CandidateDashboard
                    ├── Route "/recruiter"  → RecruiterDashboard
                    └── Route "/settings"   → SettingsPage
```

### AuthContext — Global Login State

```javascript
// Any component anywhere in the tree can call:
const { currentUser, login, logout, openLogin, openRegister } = useAuth();

// currentUser object looks like:
{
  id: 1,
  name: "Arshit Kumar",
  email: "arshit@email.com",
  role: "STUDENT",        // or "RECRUITER"
  companyName: null       // only for RECRUITER accounts
}

// JWT Token lives in localStorage (persists across page refresh):
localStorage.getItem('quickhire_token')  // "eyJhbGci..."
```

### Login Flow in the Browser (Step by Step)

```
User types email + password → clicks "Sign In" in AuthModal
          │
          ▼
  handleSubmit(e) called in AuthModal
          │
          ▼
  api.login({ email, password })
  → POST /api/auth/login to Spring Boot
  → Backend validates credentials → returns { token, id, name, role }
          │
          ▼
  localStorage.setItem('quickhire_token', token)
  localStorage.setItem('quickhire_user', JSON.stringify(user))
          │
          ▼
  AuthContext.setCurrentUser(user) — React state updates
          │
          ▼
  All components that use useAuth() re-render automatically:
    - Navbar shows user name + logout button
    - AuthModal closes
    - Buttons change (Apply Now becomes available for candidates)
```

---

## 14. Role-Based Access Control (RBAC)

> Different users see different things. Candidates cannot post jobs. Recruiters cannot apply to jobs.

```
┌──────────────────────────────────────────────────────────────────┐
│                    ROLE PERMISSIONS TABLE                        │
│                                                                  │
│  Feature                   │ Not Logged In │ Candidate │Recruiter│
│  ──────────────────────────┼───────────────┼───────────┼─────────│
│  View all jobs             │     YES       │    YES    │   YES   │
│  Apply to a job            │   LOGIN WALL  │    YES    │   NO    │
│  Upload resume             │     YES*      │    YES    │   NO    │
│  Create job posting        │     NO        │    NO     │   YES   │
│  Delete job posting        │     NO        │    NO     │   YES   │
│  View applicant pipeline   │     NO        │    NO     │   YES   │
│  Accept/Reject candidates  │     NO        │    NO     │   YES   │
│  Track my applications     │     NO        │    YES    │   NO    │
│  Access Candidate Portal   │   LOGIN WALL  │    YES    │REDIRECT │
│  Access Recruiter Hub      │   LOGIN WALL  │  REDIRECT │   YES   │
│                                                                  │
│  * Temporary upload possible, but tied to account if logged in   │
└──────────────────────────────────────────────────────────────────┘
```

**How it is enforced on the frontend (RecruiterDashboard.jsx):**
```jsx
// Guard 1: Not logged in at all
if (!currentUser) {
    return <LoginPrompt onLogin={() => openLogin('RECRUITER')} />;
}

// Guard 2: Logged in but wrong role (Candidate trying to access Recruiter page)
if (currentUser.role !== 'RECRUITER') {
    return <AccessDenied onNavigate={() => navigate('/candidate')} />;
}

// Guard passed — only recruiters reach the actual dashboard
return <RecruiterDashboardUI />;
```

**How it is enforced on the backend (Spring Security + service layer):**
```java
// JobController.java
@PostMapping
public ResponseEntity<Job> createJob(@Valid @RequestBody JobRequest req,
                                      Authentication auth) {
    // If no valid JWT token was sent, Spring Security blocks HERE
    // before the method even runs — returns 403 Forbidden automatically
    return ResponseEntity.ok(jobService.createJob(req, auth.getName()));
}
```

---

## 15. Complete Request-Response Flow (End to End)

### Scenario: Candidate applies for a job

```
STEP 1 — User clicks "Apply Now" on JobsPage
┌────────────────────────────────────────────────────────────────────┐
│ Browser (React — JobsPage.jsx)                                     │
│                                                                    │
│  handleApply(job) is called                                        │
│  if (!currentUser) → openLogin() → show modal → STOP              │
│  if (role === 'RECRUITER') → show warning message → STOP          │
│  api.applyToJob(job.id, currentUser.id) ← proceed                 │
└────────────────────────────────────────────────────────────────────┘
         │
         │  POST /api/applications/apply
         │  Headers: { Authorization: "Bearer eyJhbGci..." }
         │  Body:    { "jobId": 5, "userId": 1 }
         │
         ▼
STEP 2 — Spring Security Filter
┌────────────────────────────────────────────────────────────────────┐
│ JwtAuthenticationFilter.java                                       │
│                                                                    │
│  1. Read "Bearer eyJhbGci..." from Authorization header           │
│  2. Strip "Bearer " prefix → raw JWT string                        │
│  3. JwtTokenProvider.validateToken(token)                          │
│     - Verify HMAC-SHA256 signature with SECRET_KEY                │
│     - Check expiry timestamp (not expired?)                       │
│  4. Extract email from token payload                               │
│  5. Load UserDetails from DB via UserDetailsServiceImpl            │
│  6. Set UsernamePasswordAuthenticationToken in SecurityContext     │
│  Request is now "authenticated" for this thread                    │
└────────────────────────────────────────────────────────────────────┘
         │  (request passes through — /api/applications/** is permitted)
         ▼
STEP 3 — Controller
┌────────────────────────────────────────────────────────────────────┐
│ JobApplicationController.java                                      │
│                                                                    │
│  @PostMapping("/apply")                                            │
│  applyForJob(@RequestBody ApplicationRequest req)                  │
│    req.jobId = 5, req.userId = 1                                   │
│    → calls applicationService.apply(5, 1)                         │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
STEP 4 — Service (business logic)
┌────────────────────────────────────────────────────────────────────┐
│ JobApplicationService.java                                         │
│                                                                    │
│  1. Find job:       jobRepository.findById(5)                      │
│  2. Find candidate: profileRepo.findByUserId(1)                    │
│  3. Already applied? → throw DuplicateApplicationException         │
│  4. Calculate match score:                                         │
│     jobMatchingService.calculateSingleMatch(candidate, job)        │
│       a. Load/generate candidate embedding (768 numbers)           │
│       b. Load/generate job embedding (768 numbers)                 │
│       c. cosineSimilarity(candidateVec, jobVec) → 0.78            │
│       d. Skill overlap: React + Spring Boot + Docker matched       │
│          3 of 5 required → 60%                                     │
│       e. Role alignment: "Full Stack" matches → +10               │
│       f. Final: (78×0.45) + (60×0.45) + 10 = 72.1                │
│  5. Create entity: { jobId:5, candidateId:3, score:72.1,           │
│                      status:PENDING, appliedAt:now() }             │
│  6. applicationRepository.save(application) → stored in H2        │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
STEP 5 — Response
┌────────────────────────────────────────────────────────────────────┐
│ HTTP 200 OK                                                        │
│ Content-Type: application/json                                     │
│                                                                    │
│ {                                                                  │
│   "id": 42,                                                        │
│   "jobId": 5,                                                      │
│   "jobTitle": "Full Stack Developer",                              │
│   "matchScore": 72.1,                                              │
│   "status": "PENDING",                                             │
│   "appliedAt": "2026-09-29T02:30:00"                               │
│ }                                                                  │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
STEP 6 — React updates the UI
┌────────────────────────────────────────────────────────────────────┐
│ JobsPage.jsx                                                       │
│                                                                    │
│  setAppliedJobMap(prev => ({ ...prev, [job.id]: response }))       │
│  setActionNotice({ type:'success', score: 72.1, message:'...' })  │
│                                                                    │
│  Button re-renders: "Apply Now" → "Applied ✓ 72.1%"               │
│  Green notification shown to user                                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 16. How to Run the Project

### Prerequisites
- Java 21+
- Node.js 18+
- Maven (included via `mvnw`)
- (Optional) Google Gemini API Key from https://aistudio.google.com

### Step 1 — Start the Backend
```bash
cd backend

# Windows
./mvnw.cmd spring-boot:run

# Mac / Linux
./mvnw spring-boot:run

# Backend starts on:  http://localhost:8080
# H2 Console (DB UI): http://localhost:8080/h2-console
#   JDBC URL: jdbc:h2:mem:quickhiredb
#   Username: sa   Password: (blank)
```

### Step 2 — (Optional) Add Gemini API Key
```bash
# Option A: Edit application.properties before starting
# backend/src/main/resources/application.properties
gemini.api.key=AIza...YOUR_KEY_HERE

# Option B: Set it live via the Settings page at http://localhost:5173/settings
# Option C: POST request
curl -X POST http://localhost:8080/api/config/gemini-key \
     -H "Content-Type: application/json" \
     -d '{"apiKey": "AIza...YOUR_KEY_HERE"}'
```

### Step 3 — Start the Frontend
```bash
cd frontend
npm install
npm run dev

# Frontend starts on: http://localhost:5173
```

### Step 4 — Open Browser and Test the Full Flow
```
1. Go to http://localhost:5173
2. Click "Get Started" → Register as Recruiter (enter company name)
3. Go to Recruiter Hub → Create a job opening with required skills
4. Click Logout
5. Register a new account as Candidate (different email)
6. Go to Candidate Portal → Upload your PDF resume
7. Go to Jobs page → Click "Apply Now" on a job
8. Note the match score shown (e.g. 68.4%)
9. Log back in as Recruiter → Open Recruiter Hub
10. Click the job → See the ranked list of applicants with scores!
11. Click Accept or Reject on candidates
12. Log back in as Candidate → See your application status updated
```

---

## Key Concepts Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Concept           │ In Simple Terms                                    │
│  ──────────────────┼────────────────────────────────────────────────── │
│  JWT               │ Digital ID card given on login, sent with every   │
│                    │ request to prove who you are                       │
│  BCrypt            │ One-way scrambler for passwords — irreversible     │
│  Spring Security   │ Bouncer at the door — checks your ID card first   │
│  REST API          │ URLs that accept / return JSON data                │
│  JPA / ORM         │ Converts Java objects ↔ database rows auto        │
│  PDF Extraction    │ Reading text from a PDF file programmatically      │
│  NLP Embedding     │ Converting text into a list of numbers that        │
│                    │ captures the meaning of the words                  │
│  Cosine Similarity │ Math formula: how similar are two meaning vectors? │
│                    │ 0 = completely different, 1 = identical meaning    │
│  Context API       │ React's way to share data across all components    │
│                    │ without manually passing it as props everywhere    │
│  RBAC              │ Role-Based Access Control — different users get    │
│                    │ different permissions and see different features   │
│  Fallback Mode     │ System works 100% offline if Gemini is unavailable │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*This document covers JWT authentication, Spring Security, REST API design, PDF text extraction,
NLP embeddings, cosine similarity math, Gemini AI integration, offline fallback NLP,
React component architecture, Context API, role-based access control, and end-to-end
request-response flows — all demonstrated through a real working project.*

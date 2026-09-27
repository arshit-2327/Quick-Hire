# Quick Hire — AI & NLP Hybrid Resume Screening & Job Matching Platform

> **B.Tech 4th Year Major Capstone Project**  
> **Tech Stack**: Spring Boot 3 (Java 21), PostgreSQL / H2, React (Vite + Tailwind CSS), Apache PDFBox, Google Gemini AI (`gemini-1.5-flash`, `text-embedding-004`).

---

## 📌 Project Overview
In modern talent acquisition, traditional Applicant Tracking Systems (ATS) rely on strict keyword searches, which often fail when candidates express skills differently (e.g., listing "React" and "Spring Boot", but missing the literal phrase "Full Stack Developer").

**Quick Hire** solves this by implementing a **Hybrid AI & NLP Matching Architecture**:
1. **Resume Text Extraction**: Uses **Apache PDFBox 3.x** to extract structured text from candidate PDF resumes.
2. **Generative Role & Skill Inference**: Google Gemini AI analyzes the resume to deduce target roles (e.g. `React` + `Spring Boot` $\rightarrow$ `Full Stack Developer`, `Backend Developer`, `Frontend Developer`).
3. **768-Dimensional NLP Vector Embeddings**: Uses Google's `text-embedding-004` (or local NLP projection) to convert both the candidate profile and recruiter job listings into dense vectors.
4. **Cosine Similarity ATS Match Scoring**: Computes the exact mathematical similarity between resume and job vectors.
5. **Skill Gap Analysis**: Identifies **Matched Skills** (Green badges) vs. **Missing Skills** (Amber/Red badges) and provides actionable resume improvement advice.

---

## 📐 Mathematical Formulation

### 1. NLP Vector Embedding Representation
$$\vec{R} \in \mathbb{R}^{768} \quad (\text{Candidate Resume Vector})$$
$$\vec{J} \in \mathbb{R}^{768} \quad (\text{Job Description Vector})$$

### 2. Cosine Similarity Formula
$$\text{Cosine Similarity}(\vec{R}, \vec{J}) = \frac{\vec{R} \cdot \vec{J}}{\|\vec{R}\| \|\vec{J}\|} = \frac{\sum_{i=1}^{768} R_i J_i}{\sqrt{\sum_{i=1}^{768} R_i^2} \sqrt{\sum_{i=1}^{768} J_i^2}}$$

### 3. Hybrid ATS Score
$$\text{Overall ATS Fit Score} = (0.45 \times \text{Cosine Sim}) + (0.45 \times \text{Skill Overlap}) + (0.10 \times \text{Role Alignment Bonus})$$

---

## 🚀 How to Run the Project

### Prerequisites
- **Java 21 LTS**
- **Node.js** (v24 LTS installed)

### 1. Start Spring Boot Backend (Port 8080)
Double-click `backend/run-backend.bat` or run:
```bash
cd "X:\all in one\All_Projects\quick-hire\backend"
.\mvnw.cmd spring-boot:run
```
- API Base: `http://localhost:8080/api`
- Interactive H2 Console: `http://localhost:8080/h2-console`

### 2. Start React Frontend (Port 5173)
Double-click `frontend/run-frontend.bat` or run:
```bash
cd "X:\all in one\All_Projects\quick-hire\frontend"
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🗄️ PostgreSQL Cloud Configuration (Optional)
By default, the backend runs in PostgreSQL-compatible in-memory mode for zero-configuration testing.
To connect your free cloud PostgreSQL instance from [Neon.tech](https://neon.tech/) or [Supabase](https://supabase.com/):
In `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://your-neon-host.neon.tech/neondb?sslmode=require
spring.datasource.username=your_username
spring.datasource.password=your_password
```

---

## 🔑 Google Gemini API Key (100% Free)
Get your free API key at [Google AI Studio](https://aistudio.google.com/) and paste it directly into the **System Status & Settings** tab in the Quick Hire web interface!
*(The system also contains a built-in offline NLP fallback engine, ensuring the app never fails even without an active internet connection).*

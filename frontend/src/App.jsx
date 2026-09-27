import React, { useState, useEffect, useRef } from 'react';
import { 
  Briefcase, FileText, Upload, Sparkles, CheckCircle2, AlertCircle, 
  Settings, Search, ArrowRight, ExternalLink, RefreshCw, PlusCircle,
  Database, Cpu, Award, Zap, Code, ChevronDown, ChevronUp, Trash2,
  User, LogIn, UserPlus, LogOut, Building, ShieldCheck, ArrowUpRight,
  TrendingUp, Layers, Check, Compass
} from 'lucide-react';
import { api } from './api';

export default function App() {
  // Navigation / View state: 'home' | 'candidate_dashboard' | 'recruiter_dashboard' | 'settings'
  const [currentView, setCurrentView] = useState('home');
  
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('quickhire_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authRole, setAuthRole] = useState('STUDENT'); // 'STUDENT' | 'RECRUITER'
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    companyName: ''
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Candidate state
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [candidateProfile, setCandidateProfile] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [filterScore, setFilterScore] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);

  // Recruiter state
  const [allJobs, setAllJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [selectedJobApplicants, setSelectedJobApplicants] = useState({});
  const [loadingApplicantsForJob, setLoadingApplicantsForJob] = useState(null);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    jobType: 'Full-time',
    experienceLevel: 'Entry / Mid Level',
    salaryRange: '₹8,00,000 - ₹14,00,000',
    requiredSkills: '',
    description: ''
  });

  // Settings & System status
  const [systemStatus, setSystemStatus] = useState(null);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [keyUpdateMessage, setKeyUpdateMessage] = useState('');
  
  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync user changes to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('quickhire_user', JSON.stringify(currentUser));
      // Auto navigate if coming from home
      if (currentView === 'home') {
        setCurrentView(currentUser.role === 'RECRUITER' ? 'recruiter_dashboard' : 'candidate_dashboard');
      }
      loadUserData(currentUser);
    } else {
      localStorage.removeItem('quickhire_user');
      setCandidateProfile(null);
      setMatchedJobs([]);
    }
  }, [currentUser]);

  useEffect(() => {
    loadJobs();
    loadSystemStatus();
  }, []);

  const loadUserData = async (user) => {
    if (user.role === 'STUDENT') {
      try {
        const profile = await api.getUserResume(user.id);
        if (profile && profile.id) {
          setCandidateProfile(profile);
          const matches = await api.getUserMatches(user.id);
          setMatchedJobs(matches);
        } else {
          setCandidateProfile(null);
          setMatchedJobs([]);
        }
      } catch (err) {
        console.error('Failed to load user resume', err);
      }
    }
  };

  const loadJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const jobs = await api.getAllJobs();
      setAllJobs(jobs);
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const status = await api.getSystemStatus();
      setSystemStatus(status);
    } catch (err) {
      console.error('Failed to load system status', err);
    }
  };

  // ----------------------------------------------------
  // AUTH HANDLERS
  // ----------------------------------------------------
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        const user = await api.register({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          role: authRole,
          companyName: authRole === 'RECRUITER' ? authForm.companyName : ''
        });
        setCurrentUser(user);
        setAuthModalOpen(false);
        showToast(`Welcome to Quick Hire, ${user.name}!`);
        setCurrentView(user.role === 'RECRUITER' ? 'recruiter_dashboard' : 'candidate_dashboard');
      } else {
        const user = await api.login({
          email: authForm.email,
          password: authForm.password
        });
        setCurrentUser(user);
        setAuthModalOpen(false);
        showToast(`Welcome back, ${user.name}!`);
        setCurrentView(user.role === 'RECRUITER' ? 'recruiter_dashboard' : 'candidate_dashboard');
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    showToast('Logged out successfully.');
  };

  // ----------------------------------------------------
  // CANDIDATE: RESUME UPLOAD & DELETE
  // ----------------------------------------------------
  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsUploading(true);
    setUploadStatus('1/3 Extracting resume text with Apache PDFBox...');

    try {
      setTimeout(() => setUploadStatus('2/3 Extracting skills & inferring target roles with Gemini AI...'), 700);
      setTimeout(() => setUploadStatus('3/3 Generating 768-D Vector Embeddings & calculating Cosine Similarity...'), 1700);

      const userId = currentUser ? currentUser.id : null;
      const parsedCandidate = await api.uploadResume(selectedFile, userId);
      setCandidateProfile(parsedCandidate);

      const matches = await api.getMatchedJobsByCandidateId(parsedCandidate.id);
      setMatchedJobs(matches);
      showToast(`Resume parsed successfully! Inferred ${parsedCandidate.inferredRoles?.length || 0} target roles.`);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error processing resume', 'error');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const handleDeleteResume = async () => {
    if (!window.confirm('Are you sure you want to delete your current resume? This will clear your inferred roles and match scores so you can upload a new one.')) {
      return;
    }

    try {
      if (currentUser) {
        await api.deleteUserResume(currentUser.id);
      }
      setCandidateProfile(null);
      setMatchedJobs([]);
      setFile(null);
      showToast('Resume deleted! You can now upload a fresh resume.');
    } catch (err) {
      showToast('Failed to delete resume: ' + err.message, 'error');
    }
  };

  const handleLoadSampleResume = () => {
    const sampleText = `Alex Johnson
Email: alex.johnson@example.com
Phone: +91 9876543210
Education: B.Tech in Computer Science and Engineering, 2026

Professional Summary:
Passionate Software Engineer with hands-on experience building full-stack web applications.
Proficient in Java, Spring Boot, React.js, PostgreSQL, and RESTful APIs.

Technical Skills:
- Languages & Frameworks: Java, JavaScript, TypeScript, React.js, Spring Boot, Hibernate, HTML, CSS, Tailwind CSS
- Databases & Tools: PostgreSQL, MySQL, Docker, Git, GitHub, Maven, Postman
- Concepts: Microservices, REST APIs, Object-Oriented Programming (OOP), Data Structures

Projects:
1. Quick Hire Platform: Built an AI-driven resume screening and job recommendation engine with Spring Boot and React.
2. E-Commerce Microservices: Created scalable backend services with Spring Boot, PostgreSQL, and Redis caching.`;

    const blob = new Blob([sampleText], { type: 'text/plain' });
    const sampleFile = new File([blob], 'Alex_Johnson_FullStack_Resume.txt', { type: 'text/plain' });
    handleFileUpload(sampleFile);
  };

  // ----------------------------------------------------
  // RECRUITER: JOB POSTING & APPLICANT RANKING
  // ----------------------------------------------------
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company || !newJob.requiredSkills) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setIsCreatingJob(true);
      const skillsArray = newJob.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      await api.createJob({
        ...newJob,
        recruiterId: currentUser?.id || null,
        requiredSkills: skillsArray
      });
      showToast(`Job '${newJob.title}' published with 768-D NLP embeddings!`);
      setNewJob({
        title: '',
        company: currentUser?.companyName || '',
        location: '',
        jobType: 'Full-time',
        experienceLevel: 'Entry / Mid Level',
        salaryRange: '₹8,00,000 - ₹14,00,000',
        requiredSkills: '',
        description: ''
      });
      loadJobs();
      if (candidateProfile) {
        const matches = await api.getMatchedJobsByCandidateId(candidateProfile.id);
        setMatchedJobs(matches);
      }
    } catch (err) {
      showToast('Failed to post job: ' + err.message, 'error');
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleFetchApplicantsForJob = async (jobId) => {
    if (selectedJobApplicants[jobId]) {
      // Toggle close
      setSelectedJobApplicants(prev => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      return;
    }

    try {
      setLoadingApplicantsForJob(jobId);
      const applicants = await api.getRankedCandidatesForJob(jobId);
      setSelectedJobApplicants(prev => ({ ...prev, [jobId]: applicants }));
    } catch (err) {
      showToast('Failed to load applicants: ' + err.message, 'error');
    } finally {
      setLoadingApplicantsForJob(null);
    }
  };

  // ----------------------------------------------------
  // SETTINGS: GEMINI KEY
  // ----------------------------------------------------
  const handleUpdateGeminiKey = async (e) => {
    e.preventDefault();
    if (!geminiKeyInput.trim()) return;
    try {
      const res = await api.setGeminiKey(geminiKeyInput.trim());
      setKeyUpdateMessage(res.message);
      loadSystemStatus();
      showToast('Gemini API Key updated successfully!');
      setGeminiKeyInput('');
    } catch (err) {
      setKeyUpdateMessage('Failed: ' + err.message);
    }
  };

  // Filter matched jobs for candidate view
  const filteredMatches = matchedJobs.filter(m => {
    if (filterScore === 'high' && m.overallScore < 70) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inTitle = m.jobTitle?.toLowerCase().includes(q);
      const inCompany = m.company?.toLowerCase().includes(q);
      const inSkills = m.requiredSkills?.some(s => s.toLowerCase().includes(q));
      if (!inTitle && !inCompany && !inSkills) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#07080d] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300 font-sans">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 border transition-all animate-bounce ${
          toast.type === 'error' 
            ? 'bg-rose-950/95 text-rose-200 border-rose-800' 
            : 'bg-emerald-950/95 text-emerald-200 border-emerald-800'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0a0b12]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div 
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  Quick Hire
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Hybrid AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Intelligent Resume Screening & Role Matching</p>
            </div>
          </div>

          {/* Navigation links & User Session */}
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'home'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => {
                  if (!currentUser) {
                    setAuthMode('login');
                    setAuthRole('STUDENT');
                    setAuthModalOpen(true);
                  } else {
                    setCurrentView('candidate_dashboard');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentView === 'candidate_dashboard'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Student / Seeker
              </button>
              <button
                onClick={() => {
                  if (!currentUser) {
                    setAuthMode('login');
                    setAuthRole('RECRUITER');
                    setAuthModalOpen(true);
                  } else {
                    setCurrentView('recruiter_dashboard');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentView === 'recruiter_dashboard'
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" /> Recruiter Hub
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-400 hover:text-slate-200 ${
                  currentView === 'settings' ? 'bg-slate-800 text-white' : ''
                }`}
                title="System Status & DB"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </nav>

            {/* Auth Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">{currentUser.name}</span>
                  <span className="text-[10px] text-emerald-400 uppercase font-medium">{currentUser.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-800/50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-medium transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 transition-opacity"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* 1. LANDING PAGE (HOME) */}
      {/* ======================================================== */}
      {currentView === 'home' && (
        <div className="flex-1 flex flex-col">
          
          {/* Hero Section */}
          <section className="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-emerald-400 mb-6 shadow-inner">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Semantic ATS Platform • B.Tech Capstone</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight sm:leading-none">
                Hire Smarter. Match Faster. <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Powered by Hybrid AI.
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Traditional job boards fail when candidates list complementary skills instead of exact buzzwords. 
                <strong className="text-slate-200 font-semibold"> Quick Hire</strong> uses Gemini AI to autonomously infer roles (e.g. React + Spring Boot $\rightarrow$ Full Stack) and scores compatibility with <strong className="text-emerald-400 font-semibold">768-D NLP Vector Embeddings</strong>.
              </p>

              {/* Dual Action Gateway */}
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div 
                  onClick={() => {
                    if (currentUser && currentUser.role === 'STUDENT') {
                      setCurrentView('candidate_dashboard');
                    } else {
                      setAuthMode('register');
                      setAuthRole('STUDENT');
                      setAuthModalOpen(true);
                    }
                  }}
                  className="p-6 rounded-2xl bg-gradient-to-b from-[#121524] to-[#0c0e18] border border-emerald-500/30 hover:border-emerald-500/70 transition-all cursor-pointer text-left group shadow-lg shadow-emerald-950/20"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base flex items-center justify-between">
                    I'm a Job Seeker
                    <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">
                    Upload your resume, discover your AI-inferred roles, and unlock matched jobs with skill gap insights.
                  </p>
                </div>

                <div 
                  onClick={() => {
                    if (currentUser && currentUser.role === 'RECRUITER') {
                      setCurrentView('recruiter_dashboard');
                    } else {
                      setAuthMode('register');
                      setAuthRole('RECRUITER');
                      setAuthModalOpen(true);
                    }
                  }}
                  className="p-6 rounded-2xl bg-gradient-to-b from-[#121524] to-[#0c0e18] border border-cyan-500/30 hover:border-cyan-500/70 transition-all cursor-pointer text-left group shadow-lg shadow-cyan-950/20"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base flex items-center justify-between">
                    I'm a Recruiter
                    <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-2">
                    Post openings with automated embeddings and access a vector-ranked leaderboard of qualified talent.
                  </p>
                </div>
              </div>

              {/* Quick sample trigger */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                <span>Want to test immediately?</span>
                <button
                  onClick={() => {
                    setCurrentView('candidate_dashboard');
                    handleLoadSampleResume();
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> 1-Click Sample Demo
                </button>
              </div>
            </div>
          </section>

          {/* Feature Highlights Grid */}
          <section className="py-16 border-t border-slate-800/80 bg-[#090a11]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-2xl font-bold text-white">Why Quick Hire Surpasses Standard ATS</h2>
                <p className="text-xs text-slate-400 mt-2">
                  Engineered with an academic foundation: combining Generative LLMs and Mathematical Vector Cosine Similarity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="p-6 rounded-2xl bg-[#0f111c] border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white mb-2">Autonomous Role Inference</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      If a student lists React and Spring Boot, Gemini deduces they are qualified for <strong>Full Stack Developer</strong> and <strong>Backend Engineer</strong> roles automatically, breaking keyword bottlenecks.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 font-mono">
                    React + Spring Boot → Full Stack
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0f111c] border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white mb-2">768-D NLP Vector Similarity</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Converts resumes and job specifications into high-dimensional numerical vectors. Similarity is computed via dot-product cosine angles, yielding an objective mathematical ATS score.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-cyan-400 font-mono">
                    cos(θ) = (A · B) / (||A|| · ||B||)
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#0f111c] border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white mb-2">Interactive Skill Gap Analysis</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Candidates don't just see a match percentage; they see exactly which skills matched (green) and what missing technologies (red) they must learn to reach 100%.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-teal-400 font-mono">
                    Matched vs Missing Skill Badges
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* Quick Stats Bar */}
          <section className="py-10 border-t border-slate-800/80 bg-[#0c0d15]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-black text-white">{allJobs.length}</div>
                <div className="text-xs text-slate-400 mt-1">Live Job Listings</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400">768</div>
                <div className="text-xs text-slate-400 mt-1">Embedding Dimensions</div>
              </div>
              <div>
                <div className="text-2xl font-black text-cyan-400">PostgreSQL</div>
                <div className="text-xs text-slate-400 mt-1">Relational & Vector Ready</div>
              </div>
              <div>
                <div className="text-2xl font-black text-teal-400">100% Free</div>
                <div className="text-xs text-slate-400 mt-1">Gemini AI Studio Tier</div>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CANDIDATE DASHBOARD */}
      {/* ======================================================== */}
      {currentView === 'candidate_dashboard' && (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" /> Student & Job Seeker Portal
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser ? `Logged in as ${currentUser.name} (${currentUser.email})` : 'Guest Session (Login to persist your resume in database)'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSampleResume}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Load Sample CV
              </button>
            </div>
          </div>

          {/* Upload OR Existing Resume View */}
          {!candidateProfile ? (
            /* Upload Box */
            <div className="bg-[#0f111c] rounded-2xl border border-slate-800/80 p-8 text-center relative overflow-hidden group">
              <div className="max-w-md mx-auto">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all ${
                    isUploading 
                      ? 'border-emerald-500 bg-emerald-950/10' 
                      : 'border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-900/60'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.txt" 
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center space-y-3 py-6">
                      <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                      <p className="text-sm font-semibold text-emerald-300">{uploadStatus}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-300 group-hover:text-emerald-400 group-hover:scale-105 transition-transform">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Upload your Resume / CV</p>
                        <p className="text-xs text-slate-400 mt-1">Drag & drop PDF or text file here, or click to browse</p>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Supports PDFBox text extraction & automatic Gemini role deduction
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Uploaded Resume Profile Card */
            <div className="bg-[#0f111c] rounded-2xl border border-emerald-500/30 p-6 relative shadow-lg shadow-emerald-500/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{candidateProfile.fullName}</h2>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active Resume Saved
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {candidateProfile.email} • {candidateProfile.phone} • {candidateProfile.education}
                  </p>
                </div>

                {/* Resume Action Buttons: Delete & Upload New */}
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".pdf,.txt" 
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" /> Replace Resume
                  </button>
                  <button
                    onClick={handleDeleteResume}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/50 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Delete current resume from database"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Resume
                  </button>
                </div>
              </div>

              {/* Roles & Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Inferred Roles */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI-Inferred Target Roles
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {candidateProfile.inferredRoles?.map((role, idx) => (
                      <span 
                        key={idx} 
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 shadow-sm"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Inferred automatically by Gemini AI based on detected technology combinations.
                  </p>
                </div>

                {/* Extracted Skills */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-cyan-400" /> Detected Skills & Technologies
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {candidateProfile.extractedSkills?.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-0.5 text-xs rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Matched Jobs Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-400" /> Matched Job Opportunities
                </h2>
                <p className="text-xs text-slate-400">
                  {candidateProfile 
                    ? `Ranked using 768-D NLP Vector Cosine Similarity + Direct Skill Overlap` 
                    : `Upload or replace your resume above to calculate live match ratings`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search roles, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <select
                  value={filterScore}
                  onChange={(e) => setFilterScore(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Scores</option>
                  <option value="high">High Match ({'>'} 70%)</option>
                </select>
              </div>
            </div>

            {/* List */}
            {filteredMatches.length > 0 ? (
              <div className="space-y-4">
                {filteredMatches.map((job) => {
                  const isExpanded = expandedJobId === job.jobId;
                  const score = job.overallScore || 0;
                  const isHigh = score >= 75;
                  const isMedium = score >= 50 && score < 75;

                  return (
                    <div 
                      key={job.jobId}
                      className={`bg-[#0f111c] rounded-2xl border transition-all ${
                        isHigh 
                          ? 'border-emerald-500/40 hover:border-emerald-500/70 shadow-sm shadow-emerald-950/10' 
                          : 'border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          
                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-white hover:text-emerald-400 transition-colors">
                                {job.jobTitle}
                              </h3>
                              <span className="px-2 py-0.5 text-[11px] rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {job.jobType || 'Full-time'}
                              </span>
                              {job.roleAligned && (
                                <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Role Aligned
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="text-slate-300 font-medium">{job.company}</span>
                              <span>•</span>
                              <span>{job.location}</span>
                              <span>•</span>
                              <span className="text-emerald-400 font-medium">{job.salaryRange}</span>
                              <span>•</span>
                              <span>{job.experienceLevel}</span>
                            </div>

                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                              {job.description}
                            </p>

                            {/* Skills breakdown chips */}
                            <div className="mt-4 space-y-2">
                              {job.matchedSkills?.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-semibold text-emerald-400 mr-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Matched Skills:
                                  </span>
                                  {job.matchedSkills.map((s, idx) => (
                                    <span key={idx} className="px-2 py-0.5 text-[11px] rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 font-medium">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {job.missingSkills?.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[11px] font-semibold text-rose-400 mr-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Skill Gap (Missing):
                                  </span>
                                  {job.missingSkills.map((s, idx) => (
                                    <span key={idx} className="px-2 py-0.5 text-[11px] rounded bg-rose-950/50 text-rose-300 border border-rose-800/40">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Score Dial */}
                          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3">
                            <div className="text-center md:text-right">
                              <div className={`text-2xl font-black tracking-tight ${
                                isHigh ? 'text-emerald-400' : isMedium ? 'text-amber-400' : 'text-slate-400'
                              }`}>
                                {score}%
                              </div>
                              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                                ATS Compatibility
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setExpandedJobId(isExpanded ? null : job.jobId)}
                                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {isExpanded ? 'Hide Details' : 'AI Analysis'}
                              </button>
                              <button
                                onClick={() => showToast(`Application submitted for ${job.jobTitle} at ${job.company}!`)}
                                className="px-3.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-sm shadow-emerald-500/20"
                              >
                                Quick Apply
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Accordion AI Breakdown */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/40 -mx-6 -mb-6 p-6 rounded-b-2xl space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                                <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Vector Math Scores:
                                </span>
                                <div className="space-y-1 text-slate-300">
                                  <div className="flex justify-between">
                                    <span>768-D NLP Cosine Similarity:</span>
                                    <span className="font-mono text-cyan-300">{job.cosineSimilarity}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Skill Overlap Score:</span>
                                    <span className="font-mono text-emerald-300">{job.skillOverlapScore}%</span>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                                <span className="text-slate-400 font-semibold block mb-1 flex items-center gap-1.5">
                                  <Award className="w-3.5 h-3.5 text-emerald-400" /> Match Summary:
                                </span>
                                <p className="text-slate-300">{job.fitSummary || 'Solid alignment on required technologies.'}</p>
                              </div>
                            </div>

                            {job.improvementAdvice && (
                              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs">
                                <span className="text-emerald-400 font-semibold block mb-1 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" /> AI Resume Tip:
                                </span>
                                <p className="text-slate-300">{job.improvementAdvice}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#0f111c] rounded-2xl border border-slate-800/80 p-12 text-center">
                <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">No active job matches</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {candidateProfile ? 'Try changing your search query.' : 'Upload your resume above to view recommendations.'}
                </p>
              </div>
            )}
          </div>

        </main>
      )}

      {/* ======================================================== */}
      {/* 3. RECRUITER HUB */}
      {/* ======================================================== */}
      {currentView === 'recruiter_dashboard' && (
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-400" /> Recruiter Management Hub
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentUser ? `Managing postings for ${currentUser.companyName || currentUser.name}` : 'Recruiter Workspace'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create Job Form */}
            <div className="lg:col-span-2 bg-[#0f111c] rounded-2xl border border-slate-800/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-400" /> Post New Job Vacancy
                </h2>
                <span className="text-xs text-slate-400">Embeddings auto-computed on publish</span>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Job Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Java Backend Developer"
                      value={newJob.title}
                      onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Company Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Nexus Software Labs"
                      value={newJob.company}
                      onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bangalore / Remote"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Job Type</label>
                    <select
                      value={newJob.jobType}
                      onChange={(e) => setNewJob({ ...newJob, jobType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Remote">Remote</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Salary Range</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹10,00,000 - ₹16,00,000"
                      value={newJob.salaryRange}
                      onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Required Skills (Comma-separated) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Java, Spring Boot, PostgreSQL, Docker, REST API"
                    value={newJob.requiredSkills}
                    onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Job Description</label>
                  <textarea
                    rows={3}
                    placeholder="Role responsibilities, core projects, expectations..."
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingJob}
                  className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  {isCreatingJob ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  {isCreatingJob ? 'Computing Embeddings & Publishing...' : 'Publish Opening'}
                </button>
              </form>
            </div>

            {/* Quick Metrics */}
            <div className="bg-[#0f111c] rounded-2xl border border-slate-800/80 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4">Talent Discovery Pipeline</h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-2xl font-bold text-white">{allJobs.length}</div>
                    <div className="text-xs text-slate-400">Total Active Postings</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div className="text-2xl font-bold text-cyan-400">Instant AI Ranking</div>
                    <div className="text-xs text-slate-400">Click "View Ranked Applicants" on any job to inspect talent fit</div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                PostgreSQL stores candidates and jobs with dense embeddings for high-speed retrieval.
              </div>
            </div>

          </div>

          {/* Manage Jobs List & Candidate Applicant Ranking */}
          <div>
            <h2 className="text-base font-bold text-white mb-4">Your Active Postings & Applicant Rankings</h2>
            <div className="space-y-4">
              {allJobs.map((job) => {
                const applicants = selectedJobApplicants[job.id];
                const isLoadingApplicants = loadingApplicantsForJob === job.id;

                return (
                  <div key={job.id} className="bg-[#0f111c] rounded-xl border border-slate-800/80 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white">{job.title}</h4>
                          <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300">
                            {job.jobType || 'Full-time'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{job.company} • {job.location}</p>
                        <p className="text-xs text-emerald-400 font-medium mt-0.5">{job.salaryRange}</p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {job.requiredSkills?.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleFetchApplicantsForJob(job.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isLoadingApplicants ? 'Ranking...' : applicants ? 'Hide Applicants' : 'View Ranked Applicants'}
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete job '${job.title}'?`)) {
                              await api.deleteJob(job.id);
                              loadJobs();
                              showToast('Job removed');
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Delete Job"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Ranked Applicants Drawer */}
                    {applicants && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-emerald-400" /> AI-Ranked Candidates for this Position:
                        </h5>

                        {applicants.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {applicants.map((app) => (
                              <div key={app.candidateId} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <h6 className="font-bold text-xs text-white">{app.candidateName}</h6>
                                      <p className="text-[11px] text-slate-400">{app.email} • {app.phone}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-base font-black text-emerald-400">{app.overallScore}%</div>
                                      <span className="text-[9px] uppercase font-semibold text-slate-500">Compatibility</span>
                                    </div>
                                  </div>

                                  {/* Inferred Roles */}
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {app.inferredRoles?.map((r, idx) => (
                                      <span key={idx} className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                                        {r}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Matched skills */}
                                  <div className="mt-2 text-[10px] text-slate-400">
                                    <strong className="text-emerald-400">Matched: </strong>
                                    {app.matchedSkills?.join(', ') || 'None'}
                                  </div>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                                  <strong>NLP Vector Cosine: </strong>{app.cosineSimilarity}% • <strong>Overlap: </strong>{app.skillOverlapScore}%
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 py-2">No candidate resumes uploaded yet.</p>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

        </main>
      )}

      {/* ======================================================== */}
      {/* 4. SYSTEM & DATABASE SETTINGS */}
      {/* ======================================================== */}
      {currentView === 'settings' && (
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="bg-[#0f111c] rounded-2xl border border-slate-800/80 p-6">
            <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> Database & AI Model Configuration
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Full visibility into the active database engine and Google Gemini endpoints.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Database Engine:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" /> {systemStatus?.databaseType || 'PostgreSQL'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Gemini LLM Engine:</span>
                <span className="font-mono text-cyan-400">{systemStatus?.geminiModel || 'gemini-1.5-flash'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">NLP Vector Model:</span>
                <span className="font-mono text-cyan-400">{systemStatus?.embeddingModel || 'text-embedding-004 (768-dim)'}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Gemini API Key:</span>
                <span className={`px-2 py-0.5 rounded font-medium ${
                  systemStatus?.geminiConfigured 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {systemStatus?.geminiConfigured ? 'Configured & Active' : 'Using Fallback NLP'}
                </span>
              </div>
            </div>
          </div>

          {/* PostgreSQL Instructions Card */}
          <div className="bg-[#0f111c] rounded-2xl border border-slate-800/80 p-6 text-xs space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" /> PostgreSQL Connection Details
            </h3>
            <p className="text-slate-400">
              To connect your free cloud PostgreSQL database (from <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Neon.tech</a> or <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Supabase</a>), edit:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto">
              <code>backend/src/main/resources/application.properties</code><br />
              <span className="text-slate-500"># spring.datasource.url=jdbc:postgresql://your-neon-host.neon.tech/neondb?sslmode=require</span><br />
              <span className="text-slate-500"># spring.datasource.username=your_username</span><br />
              <span className="text-slate-500"># spring.datasource.password=your_password</span>
            </div>
            <p className="text-slate-400">
              The project is completely wired with the official PostgreSQL JDBC driver and JPA ORM.
            </p>
          </div>

          {/* Update Gemini Key */}
          <div className="bg-[#0f111c] rounded-2xl border border-slate-800/80 p-6">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Update Gemini API Key
            </h3>
            <form onSubmit={handleUpdateGeminiKey} className="space-y-3">
              <input
                type="password"
                placeholder="Enter Gemini API key..."
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition-colors"
              >
                Save API Key
              </button>
            </form>
            {keyUpdateMessage && (
              <p className="text-xs text-emerald-400 mt-2 font-medium">{keyUpdateMessage}</p>
            )}
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* 5. AUTH MODAL (LOGIN & SIGNUP) */}
      {/* ======================================================== */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#10121d] rounded-2xl border border-slate-800 p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              ✕
            </button>

            {/* Mode Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <button
                onClick={() => setAuthMode('login')}
                className={`text-sm font-bold pb-1 transition-colors ${
                  authMode === 'login' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => setAuthMode('register')}
                className={`text-sm font-bold pb-1 transition-colors ${
                  authMode === 'register' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400'
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
              {/* Role Selection for Registration */}
              {authMode === 'register' && (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Select Your Account Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthRole('STUDENT')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        authRole === 'STUDENT'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <User className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                      Job Seeker / Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthRole('RECRUITER')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        authRole === 'RECRUITER'
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Building className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                      Recruiter / Employer
                    </button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {authMode === 'register' && authRole === 'RECRUITER' && (
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Company / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. Google, TechCorp, Startup Labs"
                    value={authForm.companyName}
                    onChange={(e) => setAuthForm({ ...authForm, companyName: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors flex items-center justify-center gap-2 mt-4 shadow-md shadow-emerald-500/20"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                {authMode === 'register' ? 'Complete Registration' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#07080e] py-6 text-center text-xs text-slate-500">
        <p>Quick Hire • B.Tech 4th Year Major Project • Spring Boot 3 + PostgreSQL + React + Apache PDFBox + Google Gemini AI</p>
      </footer>
    </div>
  );
}

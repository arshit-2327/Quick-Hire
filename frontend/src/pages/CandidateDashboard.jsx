import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, Sparkles, 
  Trash2, RefreshCw, Briefcase, Award, ArrowRight, ExternalLink, 
  Clock, MapPin, DollarSign, Check, X, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function CandidateDashboard() {
  const { currentUser, openLogin } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadCandidateData(currentUser.id);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadCandidateData = async (userId) => {
    setLoading(true);
    setError('');
    try {
      // 1. Load resume profile
      try {
        const resume = await api.getUserResume(userId);
        if (resume && resume.id) {
          setCandidate(resume);
        } else {
          setCandidate(null);
        }
      } catch {
        setCandidate(null);
      }

      // 2. Load applications submitted by this candidate
      const apps = await api.getCandidateApplications(userId);
      setApplications(apps || []);
      if (apps?.length > 0) {
        setSelectedApp(apps[0]);
      }
    } catch (err) {
      console.error('Error loading candidate applications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      setError('Please upload a valid PDF or TXT resume file.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploaded = await api.uploadResume(file, currentUser?.id || null);
      setCandidate(uploaded);
      // Reload applications if any were submitted
      if (currentUser?.id) {
        const apps = await api.getCandidateApplications(currentUser.id);
        setApplications(apps || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to process resume. Please ensure it has readable text.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!currentUser?.id) return;
    if (!window.confirm('Are you sure you want to remove your uploaded resume?')) return;
    try {
      await api.deleteUserResume(currentUser.id);
      setCandidate(null);
    } catch (err) {
      setError('Failed to delete resume.');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Guard: If logged in as Recruiter, prompt switch
  if (currentUser && currentUser.role === 'RECRUITER') {
    return (
      <div className="min-h-screen bg-[#0F0E0D] text-[#ECE8E1] py-20 px-4 text-center font-sans-clean">
        <div className="max-w-md mx-auto bg-[#171513] border border-[#2B2723] rounded-2xl p-8 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Recruiter Account Active</h2>
          <p className="text-xs text-[#9E988E] mb-6 leading-relaxed">
            You are logged in with recruiter privileges. To review incoming applicants or post roles, open the Recruiter Hub.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/recruiter')}
              className="flex-1 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#ECE6DE]"
            >
              Go to Recruiter Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0E0D] text-[#ECE8E1] py-12 px-4 sm:px-6 lg:px-8 font-sans-clean">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#24211E] pb-6 gap-4">
          <div>
            <span className="font-editorial italic text-amber-500/90 text-lg">
              Candidate Workspace
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1 font-sans-clean">
              My Profile & Applications
            </h1>
            <p className="text-xs sm:text-sm text-[#8E877E] mt-1">
              Upload your resume, manage your skill profile, and track the status of jobs you have applied for.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/jobs')}
              className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#ECE6DE] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Browse Open Jobs</span>
            </button>

            {!currentUser && (
              <button
                onClick={() => openLogin('STUDENT')}
                className="px-4 py-2 bg-[#1C1A17] border border-[#2E2A25] text-xs font-bold uppercase tracking-wider text-white rounded-lg hover:bg-[#282521] cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. RESUME PROFILE SECTION */}
        <section>
          {!candidate ? (
            <div className="max-w-3xl mx-auto">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-white bg-[#1A1916]' 
                    : 'border-[#332F2A] hover:border-[#524B43] bg-[#141311]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />

                <div className="w-16 h-16 rounded-2xl bg-[#24211D] border border-[#3A352F] flex items-center justify-center mx-auto mb-5 text-amber-400/90 shadow-inner">
                  {uploading ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2 font-sans-clean">
                  {uploading ? 'Analyzing Resume...' : 'Upload your resume (PDF or TXT)'}
                </h3>

                <p className="text-xs text-[#8E877E] max-w-md mx-auto mb-6 leading-relaxed">
                  {uploading
                    ? 'Extracting core skills, inferred career roles, and preparing your application profile...'
                    : 'Upload your resume once to unlock 1-click applications across all open roles. Max size 15MB.'}
                </p>

                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold text-xs tracking-wider uppercase rounded-sm hover:bg-[#EBE5DB] transition-all shadow-md">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Select Resume File</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#161513] border border-[#2B2723] rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#24211E] pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white font-sans-clean">
                      {candidate.fullName || 'Candidate Profile'}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active Resume Profile
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#8E877E] mt-2">
                    {candidate.email && <span>{candidate.email}</span>}
                    {candidate.phone && <span>• {candidate.phone}</span>}
                    <span>• {candidate.extractedSkills?.length || 0} Skills Detected</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-[#211F1C] hover:bg-[#2C2925] border border-[#3A352F] text-xs font-semibold text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Update Resume</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />

                  {currentUser?.id && (
                    <button
                      onClick={handleDeleteResume}
                      className="p-2 text-red-400/80 hover:text-red-300 hover:bg-red-950/30 rounded-lg border border-transparent hover:border-red-800/40 transition-all cursor-pointer"
                      title="Delete Resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Inferred Roles & Skills Badges */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A69F93]">
                    Inferred Career Paths
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {candidate.inferredRoles?.map((role, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs font-medium rounded-lg"
                      >
                        {role}
                      </span>
                    ))}
                  </div>

                  {candidate.education && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#A69F93] mb-1">
                        Education
                      </h4>
                      <p className="text-xs text-[#CFC8BE]">{candidate.education}</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-7 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A69F93]">
                    Extracted Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.extractedSkills?.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[#201E1B] border border-[#353028] text-xs text-[#D6CFC4] rounded-md font-sans-clean"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2. MY APPLIED JOBS SECTION (Fulfills Requirements 4 & 10) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#24211E] pb-4">
            <div>
              <h3 className="text-xl font-bold text-white font-sans-clean">
                My Applied Positions
              </h3>
              <p className="text-xs text-[#8E877E] mt-0.5">
                Real-time review status and ATS fit scoring for your applications.
              </p>
            </div>
            <span className="px-3 py-1 bg-[#1C1A17] border border-[#2E2A25] rounded-full text-xs font-semibold text-[#A8A196]">
              {applications.length} {applications.length === 1 ? 'Application' : 'Applications'}
            </span>
          </div>

          {!currentUser ? (
            <div className="p-8 text-center bg-[#151413] border border-[#26231F] rounded-2xl">
              <FileText className="w-10 h-10 text-[#6E685F] mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">Sign in to track applications</h4>
              <p className="text-xs text-[#8E877E] max-w-sm mx-auto mb-4">
                Log into your Candidate account to see the roles you have applied for and recruiter status updates.
              </p>
              <button
                onClick={() => openLogin('STUDENT')}
                className="px-5 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-[#EBE5DB]"
              >
                Sign In Now
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center bg-[#151413] border border-[#26231F] rounded-2xl">
              <Briefcase className="w-12 h-12 text-[#6E685F] mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">No Applications Submitted Yet</h4>
              <p className="text-xs text-[#8E877E] max-w-md mx-auto mb-6 leading-relaxed">
                You haven't submitted an application to any positions yet. Explore our open roles and apply with 1 click using your uploaded resume.
              </p>
              <button
                onClick={() => navigate('/jobs')}
                className="px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#EAE4DC] shadow-md flex items-center gap-2 mx-auto cursor-pointer"
              >
                <span>Browse Open Positions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Applications List */}
              <div className="lg:col-span-6 space-y-4">
                {applications.map((app) => {
                  const isSelected = selectedApp?.id === app.id;
                  
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#1C1A17] border-amber-500/50 shadow-xl' 
                          : 'bg-[#151413] border-[#26231F] hover:border-[#3D3831]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">
                            {app.company}
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">
                            {app.jobTitle}
                          </h4>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          app.status === 'ACCEPTED'
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                            : app.status === 'REJECTED'
                            ? 'bg-red-950/60 border border-red-500/40 text-red-300'
                            : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                        }`}>
                          {app.status === 'ACCEPTED' ? '✓ Accepted / Shortlisted' :
                           app.status === 'REJECTED' ? '✕ Application Closed' :
                           '⏳ In Review'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#8E877E] mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{app.location || 'Remote'}</span>
                        </div>
                        {app.salaryRange && (
                          <div className="flex items-center gap-1 font-mono text-amber-400/80">
                            <DollarSign className="w-3 h-3" />
                            <span>{app.salaryRange}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Match Score Indicator */}
                      <div className="pt-3 border-t border-[#24211E] flex items-center justify-between">
                        <span className="text-xs text-[#A8A196]">Overall ATS Fit Score</span>
                        <span className="text-xs font-mono font-bold text-amber-300 bg-[#24211D] px-2 py-0.5 rounded">
                          {app.matchScore}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Application Detail Dossier Panel */}
              <div className="lg:col-span-6 bg-[#161513] border border-[#2B2723] rounded-2xl p-6 sm:p-8 sticky top-24 shadow-xl">
                {selectedApp ? (
                  <div className="space-y-6">
                    <div className="border-b border-[#24211E] pb-5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">
                          {selectedApp.company}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          selectedApp.status === 'ACCEPTED'
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                            : selectedApp.status === 'REJECTED'
                            ? 'bg-red-950/60 border border-red-500/40 text-red-300'
                            : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                        }`}>
                          Status: {selectedApp.status}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-white font-sans-clean">
                        {selectedApp.jobTitle}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#8E877E] mt-2">
                        <span>Location: {selectedApp.location || 'Remote'}</span>
                        <span>•</span>
                        <span>Type: {selectedApp.jobType || 'Full-time'}</span>
                        {selectedApp.salaryRange && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-mono">{selectedApp.salaryRange}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ATS Fit Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-[#1C1A17] border border-[#2B2723]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E877E] block mb-1">
                          ATS Match Score
                        </span>
                        <div className="text-3xl font-extrabold text-amber-300 font-sans-clean">
                          {selectedApp.matchScore}%
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#1C1A17] border border-[#2B2723]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E877E] block mb-1">
                          Skill Overlap
                        </span>
                        <div className="text-3xl font-extrabold text-white font-sans-clean">
                          {selectedApp.skillOverlapScore}%
                        </div>
                      </div>
                    </div>

                    {/* Matched Skills */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#A69F93] mb-2 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Matched Required Skills ({selectedApp.matchedSkills?.length || 0})</span>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApp.matchedSkills?.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs rounded-md"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    {selectedApp.missingSkills?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#A69F93] mb-2 flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5 text-red-400" />
                          <span>Identified Growth Skills ({selectedApp.missingSkills.length})</span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedApp.missingSkills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-red-950/20 border border-red-800/30 text-red-300/80 text-xs rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fit Summary */}
                    {selectedApp.fitSummary && (
                      <div className="p-4 rounded-xl bg-[#1A1916] border border-[#2E2A25]">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E877E] mb-1">
                          AI Assessment Summary
                        </div>
                        <p className="text-xs text-[#CFC8BE] leading-relaxed">
                          {selectedApp.fitSummary}
                        </p>
                      </div>
                    )}

                    <div className="pt-2 text-xs text-[#7A746B]">
                      Application submitted on {new Date(selectedApp.appliedAt).toLocaleString()}
                      {selectedApp.reviewedAt && (
                        <span> • Reviewed on {new Date(selectedApp.reviewedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#6E685F]">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Select an applied job to inspect your review details.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </section>

      </div>
    </div>
  );
}

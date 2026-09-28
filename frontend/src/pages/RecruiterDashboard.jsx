import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Plus, Trash2, Users, CheckCircle2, AlertCircle, 
  Sparkles, Search, ChevronRight, RefreshCw, X, ArrowUpRight,
  Check, XCircle, ShieldAlert, Clock, MapPin, DollarSign, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function RecruiterDashboard() {
  const { currentUser, openLogin } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [error, setError] = useState('');
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [notice, setNotice] = useState(null);

  const [newJob, setNewJob] = useState({
    title: '',
    companyName: currentUser?.companyName || '',
    location: 'Bangalore, India (Hybrid)',
    employmentType: 'Full-time',
    experienceLevel: 'Mid Level',
    salaryRange: '₹12,00,000 - ₹18,00,000',
    description: '',
    requiredSkills: '',
  });

  useEffect(() => {
    if (currentUser?.role === 'RECRUITER') {
      loadJobs();
    }
  }, [currentUser]);

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await api.getAllJobs();
      setJobs(data || []);
      if (data && data.length > 0) {
        handleSelectJob(data[0]);
      }
    } catch (err) {
      setError('Failed to fetch jobs.');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    setSelectedApplicant(null);
    setLoadingApplicants(true);
    try {
      // Load actual applicants who applied for this role, ranked by matchScore
      const apps = await api.getJobApplicants(job.id);
      setApplicants(apps || []);
      if (apps && apps.length > 0) {
        setSelectedApplicant(apps[0]);
      }
    } catch (err) {
      console.error('Failed to load applicants', err);
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'RECRUITER') {
      alert('Only authenticated recruiters can create job openings.');
      return;
    }

    try {
      const skillsArray = newJob.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const created = await api.createJob({
        recruiterId: currentUser.id,
        title: newJob.title,
        company: newJob.companyName || currentUser.companyName || 'Tech Partner',
        location: newJob.location,
        jobType: newJob.employmentType,
        experienceLevel: newJob.experienceLevel,
        salaryRange: newJob.salaryRange,
        description: newJob.description,
        requiredSkills: skillsArray,
      });

      setJobs([created, ...jobs]);
      setSelectedJob(created);
      setCreateModalOpen(false);
      setNewJob({
        title: '',
        companyName: currentUser?.companyName || '',
        location: 'Bangalore, India (Hybrid)',
        employmentType: 'Full-time',
        experienceLevel: 'Mid Level',
        salaryRange: '₹12,00,000 - ₹18,00,000',
        description: '',
        requiredSkills: '',
      });
      handleSelectJob(created);
      setNotice({ type: 'success', message: `Job opening "${created.title}" successfully published!` });
    } catch (err) {
      alert(err.message || 'Failed to create job posting');
    }
  };

  const handleDeleteJob = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this job opening?')) return;
    try {
      await api.deleteJob(id);
      const updated = jobs.filter((j) => j.id !== id);
      setJobs(updated);
      if (selectedJob?.id === id) {
        setSelectedJob(updated[0] || null);
        if (updated[0]) handleSelectJob(updated[0]);
        else setApplicants([]);
      }
    } catch (err) {
      alert('Failed to delete job');
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    setUpdatingStatusId(applicationId);
    try {
      const updated = await api.updateApplicationStatus(applicationId, newStatus);
      // Update local state
      setApplicants(prev => prev.map(app => app.id === applicationId ? updated : app));
      if (selectedApplicant?.id === applicationId) {
        setSelectedApplicant(updated);
      }
      setNotice({
        type: 'success',
        message: `Candidate ${updated.candidateName} status changed to ${newStatus}`
      });
    } catch (err) {
      alert(err.message || 'Failed to update candidate status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Guard: If not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0F0E0D] text-[#ECE8E1] py-24 px-4 text-center font-sans-clean">
        <div className="max-w-md mx-auto bg-[#171513] border border-[#2B2723] rounded-2xl p-8 shadow-2xl">
          <Users className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Recruiter Sign In Required</h2>
          <p className="text-xs text-[#9E988E] mb-6 leading-relaxed">
            Please log into an authorized Recruiter account to publish job openings, review candidate pipelines, and make hiring decisions.
          </p>
          <button
            onClick={() => openLogin('RECRUITER')}
            className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#ECE6DE] transition-all shadow-md cursor-pointer"
          >
            Sign In as Recruiter
          </button>
        </div>
      </div>
    );
  }

  // Guard: If logged in as Candidate (Requirement 6)
  if (currentUser.role !== 'RECRUITER') {
    return (
      <div className="min-h-screen bg-[#0F0E0D] text-[#ECE8E1] py-24 px-4 text-center font-sans-clean">
        <div className="max-w-md mx-auto bg-[#171513] border border-[#2B2723] rounded-2xl p-8 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Recruiter Access Only</h2>
          <p className="text-xs text-[#9E988E] mb-6 leading-relaxed">
            Your current account is registered as a <strong>Candidate / Job Seeker</strong>. Candidates are not authorized to create new roles or access applicant pipelines.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/candidate')}
              className="w-full py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#ECE6DE]"
            >
              Go to Candidate Workspace
            </button>
            <button
              onClick={() => openLogin('RECRUITER')}
              className="w-full py-2.5 bg-[#211F1C] border border-[#332E28] text-xs font-bold uppercase tracking-wider text-[#C4BEB4] hover:text-white rounded-xl"
            >
              Switch to Recruiter Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0E0D] text-[#ECE8E1] py-12 px-4 sm:px-6 lg:px-8 font-sans-clean">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Notice Banner */}
        {notice && (
          <div className="p-4 bg-[#142318] border border-emerald-500/30 text-emerald-200 rounded-xl flex items-center justify-between text-xs font-medium animate-fadeIn">
            <span>{notice.message}</span>
            <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#24211E] pb-6 gap-4">
          <div>
            <span className="font-editorial italic text-amber-500/90 text-lg">
              Recruiter Hub
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1 font-sans-clean">
              Applicant Pipeline & Review
            </h1>
            <p className="text-xs sm:text-sm text-[#8E877E] mt-1">
              {currentUser.companyName ? `${currentUser.companyName} • ` : ''}Manage active openings and review candidate applicants ranked by precision ATS match score.
            </p>
          </div>

          {/* Create New Role Button - ONLY for verified Recruiters (Requirement 2 & 6) */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-2.5 bg-white text-black font-bold text-xs tracking-wider uppercase rounded-xl hover:bg-[#EAE4DC] active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Role</span>
          </button>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Job Openings List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8E877E] px-1">
              <span>Active Roles ({jobs.length})</span>
              <span>Applicants</span>
            </div>

            {loadingJobs ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-28 rounded-xl bg-[#171614] border border-[#24211E] animate-pulse" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center bg-[#161513] border border-[#262421] rounded-2xl text-xs text-[#8E877E]">
                No jobs published yet. Click "Create New Role" to post your first opening.
              </div>
            ) : (
              jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;

                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[#1C1A17] border-amber-500/50 shadow-xl'
                        : 'bg-[#151413] border-[#24211E] hover:border-[#38332C]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-white group-hover:text-amber-200 transition-colors">
                        {job.title}
                      </h3>
                      <button
                        onClick={(e) => handleDeleteJob(job.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#8E877E] hover:text-red-400 transition-opacity"
                        title="Delete Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs text-[#9E988E] line-clamp-2 mb-3">
                      {job.description}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#7A746B] pt-2 border-t border-[#24211E]">
                      <span>{job.location || 'Remote'}</span>
                      <span className="font-mono text-amber-400/90">{job.salaryRange || 'Competitive'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Applicants for Selected Job (Requirements 5 & 9) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedJob ? (
              <>
                {/* Active Context Banner */}
                <div className="bg-[#161513] border border-[#2B2723] rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#24211E] pb-4 mb-4 gap-2">
                    <div>
                      <span className="text-xs text-amber-500/90 font-semibold uppercase tracking-wider">
                        Applicant Pipeline Context
                      </span>
                      <h2 className="text-2xl font-bold text-white mt-0.5">
                        {selectedJob.title}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-[#8E877E] mt-1">
                        <span>{selectedJob.company}</span>
                        <span>•</span>
                        <span>{selectedJob.location}</span>
                        <span>•</span>
                        <span>{selectedJob.jobType || 'Full-time'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[#8E877E] block">Required Skills</span>
                      <div className="flex flex-wrap justify-end gap-1 mt-1 max-w-xs">
                        {selectedJob.requiredSkills?.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#211F1B] border border-[#3A352F] text-[10px] text-[#C4BEB4] rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#9E988E] leading-relaxed">
                    {selectedJob.description}
                  </p>
                </div>

                {/* Ranked Applicants List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8E877E] px-1">
                    <span>Applied Candidates ({applicants.length})</span>
                    <span className="text-[11px] font-normal lowercase">Ranked by ATS match score</span>
                  </div>

                  {loadingApplicants ? (
                    <div className="p-12 text-center bg-[#161513] rounded-2xl border border-[#262421] text-xs text-[#8E877E]">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                      Loading applicant pool and computing scores...
                    </div>
                  ) : applicants.length === 0 ? (
                    <div className="p-12 text-center bg-[#161513] rounded-2xl border border-[#262421] space-y-3">
                      <Users className="w-10 h-10 text-[#5C564E] mx-auto" />
                      <h4 className="text-sm font-bold text-white">No candidates have applied to this role yet</h4>
                      <p className="text-xs text-[#8E877E] max-w-sm mx-auto">
                        Candidates who apply from the public Jobs board will automatically be scored and ranked here.
                      </p>
                    </div>
                  ) : (
                    applicants.map((applicant, idx) => {
                      const isUpdating = updatingStatusId === applicant.id;
                      const score = Math.round(applicant.matchScore || 0);

                      return (
                        <div
                          key={applicant.id}
                          className="bg-[#161513] border border-[#2B2723] rounded-2xl p-6 transition-all shadow-md space-y-4"
                        >
                          {/* Applicant Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#24211E] pb-4">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-full bg-[#201E1B] border border-[#353028] flex items-center justify-center font-mono text-xs font-bold text-amber-400">
                                #{idx + 1}
                              </span>
                              <div>
                                <h4 className="text-lg font-bold text-white">
                                  {applicant.candidateName}
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-[#8E877E] mt-0.5">
                                  <span>{applicant.candidateEmail}</span>
                                  {applicant.candidatePhone && <span>• {applicant.candidatePhone}</span>}
                                  {applicant.education && <span>• {applicant.education}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Score & Status Display */}
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <div className={`text-2xl font-extrabold font-mono ${
                                  score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-zinc-400'
                                }`}>
                                  {score}%
                                </div>
                                <span className="text-[10px] uppercase tracking-wider text-[#7A746B]">
                                  ATS Fit Score
                                </span>
                              </div>

                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                applicant.status === 'ACCEPTED'
                                  ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300'
                                  : applicant.status === 'REJECTED'
                                  ? 'bg-red-950/70 border border-red-500/50 text-red-300'
                                  : 'bg-amber-950/70 border border-amber-500/50 text-amber-300'
                              }`}>
                                {applicant.status}
                              </span>
                            </div>
                          </div>

                          {/* Skills Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E877E] block mb-1.5">
                                Matched Skills ({applicant.matchedSkills?.length || 0})
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {applicant.matchedSkills?.map((skill, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {applicant.missingSkills?.length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E877E] block mb-1.5">
                                  Missing Target Skills ({applicant.missingSkills.length})
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {applicant.missingSkills.map((skill, mIdx) => (
                                    <span
                                      key={mIdx}
                                      className="px-2 py-0.5 bg-amber-950/20 border border-amber-800/30 text-amber-300/80 text-xs rounded"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* AI Fit Analysis */}
                          {applicant.fitSummary && (
                            <p className="text-xs text-[#A8A196] bg-[#141311] border border-[#24211D] p-3 rounded-xl leading-relaxed">
                              {applicant.fitSummary}
                            </p>
                          )}

                          {/* Action Footer: Accept or Reject Buttons (Requirement 9) */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#22201D]">
                            <span className="text-[11px] text-[#6E685F]">
                              Applied on {new Date(applicant.appliedAt).toLocaleDateString()}
                            </span>

                            <div className="flex items-center gap-3">
                              {/* Accept Button */}
                              <button
                                onClick={() => handleUpdateStatus(applicant.id, 'ACCEPTED')}
                                disabled={isUpdating || applicant.status === 'ACCEPTED'}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                  applicant.status === 'ACCEPTED'
                                    ? 'bg-emerald-950/40 border border-emerald-600/40 text-emerald-400 opacity-60'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{applicant.status === 'ACCEPTED' ? 'Accepted' : 'Accept Candidate'}</span>
                              </button>

                              {/* Reject Button */}
                              <button
                                onClick={() => handleUpdateStatus(applicant.id, 'REJECTED')}
                                disabled={isUpdating || applicant.status === 'REJECTED'}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                  applicant.status === 'REJECTED'
                                    ? 'bg-red-950/40 border border-red-600/40 text-red-400 opacity-60'
                                    : 'bg-[#241717] hover:bg-red-900/60 border border-red-800/40 text-red-300 shadow-sm active:scale-95'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{applicant.status === 'REJECTED' ? 'Rejected' : 'Reject'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="p-16 text-center bg-[#161513] border border-[#2B2723] rounded-2xl text-xs text-[#8E877E]">
                Select a job opening from the left panel to inspect ranked applicants.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Create Job Modal (Requirement 2: Recruiter Only) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171513] border border-[#2F2B26] rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262421] pb-4">
              <div>
                <span className="text-xs text-amber-500/90 font-semibold uppercase tracking-wider">
                  New Opening
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5 font-sans-clean">
                  Create Job Specification
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-[#8E877E] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#A69F93] block mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Backend Engineer"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#201E1B] border border-[#332E28] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A69F93] block mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Studio"
                    value={newJob.companyName}
                    onChange={(e) => setNewJob({ ...newJob, companyName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#201E1B] border border-[#332E28] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#A69F93] block mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#201E1B] border border-[#332E28] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A69F93] block mb-1">
                    Employment Type
                  </label>
                  <select
                    value={newJob.employmentType}
                    onChange={(e) => setNewJob({ ...newJob, employmentType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#201E1B] border border-[#332E28] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option>Full-time</option>
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>Internship</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A69F93] block mb-1">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={newJob.salaryRange}
                    onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#201E1B] border border-[#332E28] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A69F93] block mb-1">
                  Required Skills (Comma separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Java, Spring Boot, PostgreSQL, Docker, AWS"
                  value={newJob.requiredSkills}
                  onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#201E1B] border border-[#332E28] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#A69F93] block mb-1">
                  Role Description *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Describe the key responsibilities, mission, and expectations for this role..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#201E1B] border border-[#332E28] rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#262421]">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#3A352F] text-xs font-semibold text-[#A69F93] hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#EAE4DC] shadow-md"
                >
                  Publish Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

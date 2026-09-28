import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Trash2, Users, CheckCircle2, AlertCircle, 
  Sparkles, Search, ChevronRight, RefreshCw, X, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function RecruiterDashboard() {
  const { currentUser, openLogin } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [error, setError] = useState('');

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
    loadJobs();
  }, []);

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
    setSelectedCandidate(null);
    setLoadingCandidates(true);
    try {
      const applicants = await api.getRankedCandidatesForJob(job.id);
      setCandidates(applicants || []);
    } catch (err) {
      console.error(err);
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = newJob.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const created = await api.createJob({
        title: newJob.title,
        companyName: newJob.companyName || currentUser?.companyName || 'Tech Partner',
        location: newJob.location,
        employmentType: newJob.employmentType,
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
    } catch (err) {
      alert(err.message || 'Failed to create job posting');
    }
  };

  const handleDeleteJob = async (jobId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this job opening?')) return;
    try {
      await api.deleteJob(jobId);
      const updated = jobs.filter((j) => j.id !== jobId);
      setJobs(updated);
      if (selectedJob?.id === jobId) {
        if (updated.length > 0) handleSelectJob(updated[0]);
        else {
          setSelectedJob(null);
          setCandidates([]);
        }
      }
    } catch (err) {
      alert('Failed to delete job.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0E0D] text-[#ECE8E1] py-12 px-4 sm:px-6 lg:px-8 font-sans-clean">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#24211E] pb-6 gap-4">
          <div>
            <span className="font-editorial italic text-amber-500/90 text-lg">
              Recruiter Hub
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1 font-sans-clean">
              Talent Pipeline & Vector Ranking
            </h1>
            <p className="text-xs sm:text-sm text-[#8E877E] mt-1">
              Screen candidates evaluated with 768-dimensional NLP vector embeddings and transparent skill coverage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-5 py-2.5 bg-white text-black font-bold text-xs tracking-wider uppercase rounded-sm hover:bg-[#EBE5DB] active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Role</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Main Grid: Left Jobs List / Right Applicants */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Job Openings List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8E877E] px-1 mb-2">
              <span>Open Roles ({jobs.length})</span>
            </div>

            {loadingJobs ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-28 rounded-xl bg-[#161513] animate-pulse" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-8 text-center bg-[#161513] rounded-xl border border-[#262421] text-xs text-[#8E877E]">
                No jobs posted yet. Click "Post New Role" above.
              </div>
            ) : (
              jobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[#1F1E1B] border-amber-500/80 shadow-md'
                        : 'bg-[#161513] border-[#292622] hover:border-[#423D36]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-semibold text-[#8E877E] uppercase tracking-wider">
                          {job.companyName}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {job.title}
                        </h4>
                      </div>
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
                      <span>{job.location}</span>
                      <span className="font-mono text-amber-400/90">{job.salaryRange}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Ranked Candidates for Selected Job */}
          <div className="lg:col-span-8 space-y-6">
            {selectedJob ? (
              <>
                <div className="bg-[#161513] border border-[#2B2723] rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#24211E] pb-4 mb-4 gap-2">
                    <div>
                      <span className="text-xs text-amber-500/90 font-semibold uppercase tracking-wider">
                        Active Evaluation Context
                      </span>
                      <h2 className="text-2xl font-bold text-white mt-0.5">
                        {selectedJob.title}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-[#8E877E] mt-1">
                        <span>{selectedJob.companyName}</span>
                        <span>•</span>
                        <span>{selectedJob.location}</span>
                        <span>•</span>
                        <span>{selectedJob.employmentType}</span>
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

                {/* Ranked Applicants */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#8E877E] px-1">
                    <span>Ranked Candidates ({candidates.length})</span>
                    <span className="text-[11px] font-normal lowercase">Sorted by cosine vector similarity</span>
                  </div>

                  {loadingCandidates ? (
                    <div className="p-8 text-center bg-[#161513] rounded-xl border border-[#262421] text-xs text-[#8E877E]">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                      Computing NLP cosine match scores...
                    </div>
                  ) : candidates.length === 0 ? (
                    <div className="p-12 text-center bg-[#161513] rounded-2xl border border-[#262421] space-y-2">
                      <Users className="w-8 h-8 text-[#5C564E] mx-auto" />
                      <h4 className="text-sm font-bold text-white">No candidates evaluated yet</h4>
                      <p className="text-xs text-[#8E877E] max-w-sm mx-auto">
                        Switch to the Candidate Portal to upload sample resumes and observe automated ranking.
                      </p>
                    </div>
                  ) : (
                    candidates.map((applicant, idx) => {
                      const score = Math.round(applicant.overallScore || 0);

                      return (
                        <div
                          key={applicant.candidateId || idx}
                          onClick={() => setSelectedCandidate(applicant)}
                          className="bg-[#161513] hover:bg-[#1C1A17] border border-[#2B2723] hover:border-[#443E36] rounded-xl p-5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold text-[#8E877E]">
                                #{idx + 1}
                              </span>
                              <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                                {applicant.candidateName || 'Anonymous Candidate'}
                              </h4>
                              {applicant.candidateEmail && (
                                <span className="text-xs text-[#7A746B]">
                                  {applicant.candidateEmail}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {applicant.matchedSkills?.slice(0, 5).map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[11px] rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                              {applicant.missingSkills?.slice(0, 3).map((skill, mIdx) => (
                                <span
                                  key={mIdx}
                                  className="px-2 py-0.5 bg-amber-950/30 border border-amber-800/40 text-amber-300/80 text-[11px] rounded"
                                >
                                  Missing: {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 sm:border-l sm:border-[#24211E] sm:pl-6 shrink-0 justify-between sm:justify-end">
                            <div className="text-right">
                              <div className={`text-xl font-extrabold font-mono ${
                                score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-zinc-400'
                              }`}>
                                {score}%
                              </div>
                              <div className="text-[10px] uppercase tracking-wider text-[#7A746B]">
                                Match Score
                              </div>
                            </div>

                            <ChevronRight className="w-5 h-5 text-[#5C564E] group-hover:text-white transition-colors" />
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

      {/* Modal: Post New Job */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#191816] border border-[#332F2A] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#ECE8E1]">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-5 right-5 text-[#8E877E] hover:text-white p-1 rounded-full hover:bg-[#262421]"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="font-editorial italic text-amber-500/90 text-lg">
              Recruitment Listing
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5 mb-5 font-sans-clean">
              Post an Open Position
            </h2>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Job Title</label>
                <input
                  type="text"
                  required
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g. Senior Java Backend Architect"
                  className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] focus:outline-none focus:border-amber-500/80"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Company</label>
                  <input
                    type="text"
                    required
                    value={newJob.companyName}
                    onChange={(e) => setNewJob({ ...newJob, companyName: e.target.value })}
                    placeholder="e.g. Apex AI Labs"
                    className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] focus:outline-none focus:border-amber-500/80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="e.g. Remote / Hybrid"
                    className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] focus:outline-none focus:border-amber-500/80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={newJob.salaryRange}
                    onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
                    placeholder="e.g. ₹15,00,000 - ₹22,00,000"
                    className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] focus:outline-none focus:border-amber-500/80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Experience Level</label>
                  <input
                    type="text"
                    value={newJob.experienceLevel}
                    onChange={(e) => setNewJob({ ...newJob, experienceLevel: e.target.value })}
                    placeholder="e.g. Mid / Senior"
                    className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] focus:outline-none focus:border-amber-500/80"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={newJob.requiredSkills}
                  onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                  placeholder="Java, Spring Boot, Microservices, PostgreSQL, Docker"
                  className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] focus:outline-none focus:border-amber-500/80"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Job Description</label>
                <textarea
                  rows={4}
                  required
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Outline the responsibilities, tech stack, and ideal background..."
                  className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] focus:outline-none focus:border-amber-500/80"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-white text-black font-bold text-xs tracking-wider uppercase rounded-xl hover:bg-[#F2ECE4] transition-all cursor-pointer shadow-md mt-2"
              >
                Publish Job & Compute Embeddings
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal: Candidate Profile Inspection */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#191816] border border-[#332F2A] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#ECE8E1]">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-5 right-5 text-[#8E877E] hover:text-white p-1 rounded-full hover:bg-[#262421]"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="font-editorial italic text-amber-500/90 text-lg">
              Candidate Dossier
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5 mb-1 font-sans-clean">
              {selectedCandidate.candidateName || 'Candidate Profile'}
            </h2>
            <p className="text-xs text-[#8E877E] mb-6">
              {selectedCandidate.candidateEmail}
            </p>

            <div className="space-y-5">
              <div className="p-4 bg-[#121110] rounded-xl border border-[#2B2723] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#8E877E]">Composite Fit Score</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {Math.round(selectedCandidate.overallScore || 0)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8E877E]">Cosine Angle Proximity</div>
                  <div className="text-sm font-mono text-amber-400">
                    {(selectedCandidate.cosineSimilarity * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  Verified Skills Match
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCandidate.matchedSkills?.map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedCandidate.missingSkills?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    Skill Gaps for this Role
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.missingSkills?.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCandidate.recommendationAdvice && (
                <div className="p-4 bg-[#121110] rounded-xl border border-[#2B2723]">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ATS Assessment Advice</span>
                  </div>
                  <p className="text-xs text-[#A69F93] leading-relaxed">
                    {selectedCandidate.recommendationAdvice}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

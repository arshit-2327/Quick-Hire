import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Search, MapPin, DollarSign, Clock, CheckCircle2, 
  Sparkles, AlertCircle, ArrowRight, Filter, ChevronRight, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function JobsPage() {
  const { currentUser, openLogin } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  
  // Track candidate's applications
  const [appliedJobMap, setAppliedJobMap] = useState({}); // { [jobId]: applicationObj }
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null); // { type: 'success' | 'warning' | 'error', message: string, score?: number }
  const [resumeRequiredModal, setResumeRequiredModal] = useState(false);

  useEffect(() => {
    loadJobsAndApplications();
  }, [currentUser]);

  async function loadJobsAndApplications() {
    setLoading(true);
    try {
      const allJobs = await api.getAllJobs();
      setJobs(allJobs || []);

      if (currentUser && currentUser.role === 'STUDENT') {
        try {
          const myApps = await api.getCandidateApplications(currentUser.id);
          const map = {};
          (myApps || []).forEach(app => {
            map[app.jobId] = app;
          });
          setAppliedJobMap(map);
        } catch (e) {
          console.warn('Could not fetch user applications', e);
        }
      }
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async (job) => {
    // 1. If not logged in
    if (!currentUser) {
      openLogin('STUDENT');
      setActionNotice({
        type: 'warning',
        message: 'Please sign in or register as a Candidate to submit your application.'
      });
      return;
    }

    // 2. If logged in as Recruiter
    if (currentUser.role === 'RECRUITER') {
      setActionNotice({
        type: 'warning',
        message: 'You are signed in as a Recruiter. Only Candidate/Student accounts can apply for jobs.'
      });
      return;
    }

    // 3. Apply as Candidate
    setApplyingJobId(job.id);
    setActionNotice(null);

    try {
      const response = await api.applyToJob(job.id, currentUser.id);
      setAppliedJobMap(prev => ({
        ...prev,
        [job.id]: response
      }));
      setActionNotice({
        type: 'success',
        message: `Application submitted to ${job.company} for "${job.title}"!`,
        score: response.matchScore
      });
    } catch (err) {
      const errorMsg = err.message || 'Failed to submit application';
      if (errorMsg.toLowerCase().includes('upload your resume') || errorMsg.toLowerCase().includes('resume')) {
        setResumeRequiredModal(true);
      } else {
        setActionNotice({
          type: 'error',
          message: errorMsg
        });
      }
    } finally {
      setApplyingJobId(null);
    }
  };

  // Filter jobs based on search query and type
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      (job.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (job.company?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (job.location?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (job.requiredSkills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'ALL' || (job.jobType || '').toUpperCase().includes(selectedType);

    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#0F0E0D] text-[#ECE8E1] font-sans-clean py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Notice Alert Banner */}
        {actionNotice && (
          <div className={`mb-8 p-4 rounded-xl border flex items-center justify-between animate-fadeIn ${
            actionNotice.type === 'success' 
              ? 'bg-[#142318] border-emerald-500/30 text-emerald-200'
              : actionNotice.type === 'warning'
              ? 'bg-[#261E14] border-amber-500/30 text-amber-200'
              : 'bg-[#291515] border-red-500/30 text-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div className="text-sm font-medium">
                {actionNotice.message}
                {actionNotice.score !== undefined && (
                  <span className="ml-2 font-mono font-bold px-2 py-0.5 bg-black/40 rounded text-amber-300">
                    Match Fit: {actionNotice.score}%
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => setActionNotice(null)}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-10">
          <span className="font-editorial italic text-amber-500/90 text-lg sm:text-xl font-normal block mb-1">
            Current Opportunities
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-sans-clean">
                Job Openings
              </h1>
              <p className="text-sm text-[#9E988E] mt-1 max-w-2xl leading-relaxed">
                Browse open positions from leading technology teams. Log in as a Candidate to submit applications and view your instant ATS match score.
              </p>
            </div>

            {currentUser?.role === 'STUDENT' && (
              <button
                onClick={() => navigate('/candidate')}
                className="self-start sm:self-auto px-4 py-2 bg-[#1C1A18] border border-[#2E2B27] rounded-lg text-xs font-bold uppercase tracking-wider text-[#D1CBC2] hover:text-white hover:border-[#4A453E] transition-all flex items-center gap-2"
              >
                <span>View My Applications</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-8 p-4 bg-[#141312] border border-[#26231F] rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#7A746B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by role, company, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#1C1A17] border border-[#2E2A25] rounded-xl text-xs sm:text-sm text-white placeholder-[#6E685F] focus:outline-none focus:border-amber-400/60 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {['ALL', 'FULL-TIME', 'REMOTE', 'HYBRID', 'INTERNSHIP'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                  selectedType === type
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'bg-[#1C1A17] text-[#9E988E] hover:text-white border border-[#2E2A25]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-[#171614] border border-[#26231F] animate-pulse" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-[#141312] border border-[#26231F] rounded-2xl p-8">
            <Briefcase className="w-12 h-12 text-[#6E685F] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No matching job openings</h3>
            <p className="text-xs text-[#8E877E] max-w-sm mx-auto mb-6">
              Try adjusting your search keywords or clearing filters to view all active roles.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedType('ALL'); }}
              className="px-4 py-2 bg-[#201E1B] border border-[#332E29] rounded-lg text-xs font-bold uppercase tracking-wider text-white hover:bg-[#2A2723]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const application = appliedJobMap[job.id];
              const isApplied = !!application;
              const isApplying = applyingJobId === job.id;

              return (
                <div
                  key={job.id}
                  className="bg-[#151413] border border-[#26231F] hover:border-[#403B33] rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-bold text-amber-400 tracking-wide uppercase">
                          {job.company}
                        </span>
                        <h3 className="text-lg font-bold text-white group-hover:text-amber-200 transition-colors mt-0.5">
                          {job.title}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 bg-[#201E1B] border border-[#332E28] rounded-full text-[10px] font-semibold tracking-wider text-[#A8A196] uppercase shrink-0">
                        {job.jobType || 'Full-Time'}
                      </span>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8E877E] mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#6E685F]" />
                        <span>{job.location || 'Remote'}</span>
                      </div>
                      {job.experienceLevel && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#6E685F]" />
                          <span>{job.experienceLevel}</span>
                        </div>
                      )}
                      {job.salaryRange && (
                        <div className="flex items-center gap-1 text-amber-400/90 font-mono font-medium">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{job.salaryRange}</span>
                        </div>
                      )}
                    </div>

                    {/* Description preview */}
                    <p className="text-xs text-[#9E988E] line-clamp-3 mb-5 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Required Skills */}
                    <div className="mb-6">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#6E685F] mb-2">
                        Required Skills
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.requiredSkills?.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-[#1C1A17] border border-[#2E2A25] text-[#C4BEB4] text-[11px] rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills?.length > 5 && (
                          <span className="text-[10px] text-[#7A746B] self-center">
                            +{job.requiredSkills.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-4 border-t border-[#22201D] flex items-center justify-between gap-3">
                    {isApplied ? (
                      <div className="w-full flex items-center justify-between bg-[#19241B] border border-emerald-500/30 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Applied</span>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          application.status === 'ACCEPTED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : application.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {application.status}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(job)}
                        disabled={isApplying}
                        className="w-full py-2.5 px-4 bg-white text-black hover:bg-[#F2ECE4] active:scale-98 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isApplying ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>Submitting Application...</span>
                          </>
                        ) : (
                          <>
                            <span>Apply for Position</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Resume Required Modal Prompt */}
      {resumeRequiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#171513] border border-[#2F2B26] rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-sans-clean">
              Resume Required to Apply
            </h3>
            <p className="text-xs text-[#9E988E] leading-relaxed mb-6">
              In order to apply for roles, you must upload your resume in the Candidate Portal first. This allows our engine to parse your skill profile and compute your ATS match score for recruiters.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setResumeRequiredModal(false)}
                className="flex-1 py-2.5 px-4 border border-[#38332C] rounded-xl text-xs font-bold uppercase tracking-wider text-[#A8A196] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setResumeRequiredModal(false);
                  navigate('/candidate');
                }}
                className="flex-1 py-2.5 px-4 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#EAE4DC]"
              >
                Go to Upload
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

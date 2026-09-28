import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, Sparkles, 
  Trash2, RefreshCw, Briefcase, Award, ArrowRight, ExternalLink, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function CandidateDashboard() {
  const { currentUser, openLogin } = useAuth();
  const fileInputRef = useRef(null);

  const [candidate, setCandidate] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
      loadCandidateData(currentUser.id);
    }
  }, [currentUser]);

  const loadCandidateData = async (userId) => {
    setLoading(true);
    setError('');
    try {
      const resume = await api.getUserResume(userId);
      setCandidate(resume);
      if (resume?.id) {
        const matches = await api.getMatchedJobsByCandidateId(resume.id);
        setMatchedJobs(matches || []);
        if (matches?.length > 0) setSelectedJob(matches[0]);
      }
    } catch (err) {
      // No resume uploaded yet for user
      setCandidate(null);
      setMatchedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
      setError('Please upload a PDF or TXT file.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploaded = await api.uploadResume(file, currentUser?.id || null);
      setCandidate(uploaded);
      if (uploaded?.id) {
        const matches = await api.getMatchedJobsByCandidateId(uploaded.id);
        setMatchedJobs(matches || []);
        if (matches?.length > 0) setSelectedJob(matches[0]);
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
      setMatchedJobs([]);
      setSelectedJob(null);
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
              Resume Intelligence & Matching
            </h1>
            <p className="text-xs sm:text-sm text-[#8E877E] mt-1">
              Upload your resume to extract skills, compute your 768-dim vector embedding, and discover aligned career matches.
            </p>
          </div>

          {!currentUser && (
            <div className="p-3 bg-[#191816] border border-[#2B2723] rounded-xl text-xs flex items-center gap-3">
              <span className="text-[#A39D92]">Want to save your profile permanently?</span>
              <button
                onClick={() => openLogin('STUDENT')}
                className="px-3 py-1.5 bg-white text-black font-bold uppercase text-[10px] tracking-wider rounded-sm hover:bg-[#EBE5DB] transition-all cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Zone / Candidate Active State */}
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
                {uploading ? 'Analyzing Resume with Gemini 2.0...' : 'Upload your resume (PDF or TXT)'}
              </h3>

              <p className="text-xs text-[#8E877E] max-w-md mx-auto mb-6 leading-relaxed">
                {uploading
                  ? 'Extracting raw text via PDFBox, inferring core competencies, and building your 768-dimensional NLP vector...'
                  : 'Drag and drop your file here, or click to browse. Max size 15MB.'}
              </p>

              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black font-bold text-xs tracking-wider uppercase rounded-sm hover:bg-[#EBE5DB] transition-all shadow-md">
                <FileText className="w-3.5 h-3.5" />
                <span>Select Resume File</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Candidate Profile Summary Card */}
            <div className="bg-[#161513] border border-[#2B2723] rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#24211E] pb-6 mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white font-sans-clean">
                      {candidate.fullName || 'Candidate Profile'}
                    </h2>
                    <span className="px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 text-xs font-semibold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Vector Profile Active
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#8E877E] mt-2">
                    {candidate.email && <span>{candidate.email}</span>}
                    {candidate.phone && <span>• {candidate.phone}</span>}
                    <span>• {candidate.extractedSkills?.length || 0} Skills Extracted</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-[#211F1C] hover:bg-[#2C2925] border border-[#3A352F] text-xs font-semibold text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Replace File</span>
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
                    Inferred Career Roles
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

                  {candidate.aiSummary && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#A69F93] mb-1.5">
                        Executive Summary
                      </h4>
                      <p className="text-xs text-[#9E988E] leading-relaxed italic bg-[#11100F] p-3 rounded-xl border border-[#211F1C]">
                        "{candidate.aiSummary}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-7 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#A69F93]">
                    Extracted Technical & Domain Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                    {candidate.extractedSkills?.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[#1C1A17] border border-[#2E2B26] text-[#D8D2C6] text-xs rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Matched Roles Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white font-sans-clean">
                    Ranked Career Matches ({matchedJobs.length})
                  </h3>
                  <p className="text-xs text-[#8E877E] mt-0.5">
                    Evaluated via 768-dim cosine vector angle + skill overlap analysis.
                  </p>
                </div>
              </div>

              {matchedJobs.length === 0 ? (
                <div className="p-8 text-center bg-[#141311] rounded-xl border border-[#26231F] text-xs text-[#8E877E]">
                  No job matches found yet. Try posting new jobs in the Recruiter portal or re-evaluating.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Job Match List */}
                  <div className="lg:col-span-5 space-y-3">
                    {matchedJobs.map((match) => {
                      const isSelected = selectedJob?.jobId === match.jobId;
                      const score = Math.round(match.overallScore || 0);

                      return (
                        <div
                          key={match.jobId}
                          onClick={() => setSelectedJob(match)}
                          className={`p-5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#211F1B] border-amber-500/80 shadow-md'
                              : 'bg-[#161513] border-[#292622] hover:border-[#423D36]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[11px] font-semibold text-[#8E877E]">
                                {match.companyName}
                              </span>
                              <h4 className="text-sm font-bold text-white leading-snug">
                                {match.jobTitle}
                              </h4>
                            </div>
                            <div className="text-right">
                              <span className={`text-base font-extrabold font-mono ${
                                score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-zinc-400'
                              }`}>
                                {score}%
                              </span>
                              <div className="text-[9px] uppercase tracking-wider text-[#7A746B]">
                                Fit Score
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-[#A69F93]">
                            <span>{match.matchedSkills?.length || 0} matched</span>
                            <span>•</span>
                            <span className="text-amber-400/90">{match.missingSkills?.length || 0} missing</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Detailed Match Breakdown */}
                  <div className="lg:col-span-7">
                    {selectedJob ? (
                      <div className="bg-[#161513] border border-[#2B2723] rounded-2xl p-6 sm:p-8 space-y-6">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#24211E] pb-5 gap-3">
                          <div>
                            <span className="text-xs text-[#8E877E] font-semibold uppercase tracking-wider">
                              {selectedJob.companyName}
                            </span>
                            <h3 className="text-xl font-bold text-white mt-0.5">
                              {selectedJob.jobTitle}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-[#211F1B] border border-[#3A352F] rounded-lg text-xs font-mono font-bold text-amber-400">
                              Cosine Similarity: {selectedJob.cosineSimilarity ? (selectedJob.cosineSimilarity * 100).toFixed(1) : 0}%
                            </div>
                          </div>
                        </div>

                        {/* Matched vs Missing Skills Badges */}
                        <div className="space-y-4">
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Matched Skills ({selectedJob.matchedSkills?.length || 0})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedJob.matchedSkills?.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs rounded-md"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-amber-400/90 mb-2 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Missing Skills ({selectedJob.missingSkills?.length || 0})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedJob.missingSkills?.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs rounded-md"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* AI Recommendation Insight */}
                        {selectedJob.recommendationAdvice && (
                          <div className="p-4 bg-[#11100F] border border-[#2B2723] rounded-xl space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Personalized AI Growth Suggestion</span>
                            </div>
                            <p className="text-xs text-[#A39D92] leading-relaxed">
                              {selectedJob.recommendationAdvice}
                            </p>
                          </div>
                        )}

                      </div>
                    ) : (
                      <div className="p-12 text-center bg-[#161513] border border-[#2B2723] rounded-2xl text-xs text-[#8E877E]">
                        Select a job on the left to inspect detailed skill gap analysis.
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

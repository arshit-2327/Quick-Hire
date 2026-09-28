import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, FileText, Sparkles, ArrowRight, CheckCircle2, 
  Layers, Compass, Award, ShieldCheck, ChevronRight, Zap, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import heroImg from '../assets/hero_editorial.jpg';
import moodImg from '../assets/mood_ceramics.jpg';

export default function HomePage() {
  const { currentUser, openRegister, openLogin } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('candidate'); // 'candidate' | 'recruiter' | 'vector' | 'jobs'
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await api.getAllJobs();
        setJobs(data || []);
      } catch (err) {
        console.error('Failed to load sample jobs', err);
      } finally {
        setLoadingJobs(false);
      }
    }
    loadJobs();
  }, []);

  const handleHeroCta = () => {
    if (currentUser) {
      if (currentUser.role === 'RECRUITER') navigate('/recruiter');
      else navigate('/candidate');
    } else {
      openRegister('STUDENT');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0E0D] text-[#ECE8E1] font-sans-clean">
      
      {/* ========================================================================= */}
      {/* HERO SECTION (Faithfully styled after Squarespace Reference Image 1)       */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-[88vh] flex flex-col justify-between items-center text-center px-4 sm:px-6 pt-16 pb-12 overflow-hidden">
        
        {/* Background Image with Warm Vignette */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="Warm editorial workspace" 
            className="w-full h-full object-cover object-center filter brightness-[0.48] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-[#0F0E0D]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto my-auto pt-10 sm:pt-16">
          
          {/* Eyebrow in elegant italic serif (Matching "Portfolio Websites") */}
          <span className="font-editorial italic text-lg sm:text-2xl text-amber-200/90 font-light tracking-wide mb-3 block animate-fadeIn">
            Intelligent Talent Intelligence
          </span>

          {/* Huge Display Headline (Matching "Create a portfolio website that impresses") */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.08] font-sans-clean">
            Screen resumes with <br className="hidden sm:block" />
            genuine human insight
          </h1>

          {/* Centered White Crisp CTA Button (Matching "GET STARTED") */}
          <div className="flex justify-center mb-10">
            <button
              onClick={handleHeroCta}
              className="px-8 py-3.5 bg-white text-black font-extrabold text-xs sm:text-sm tracking-widest uppercase rounded-sm hover:bg-[#F2ECE4] active:scale-95 transition-all shadow-xl cursor-pointer"
            >
              Get Started
            </button>
          </div>

          {/* Translucent Dark Pill Capsule Navigation (Matching "Templates · Features · Marketing · Selling") */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1 sm:gap-2 p-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full max-w-full">
            <button
              onClick={() => { setActiveTab('candidate'); navigate('/candidate'); }}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'candidate' 
                  ? 'bg-white/20 text-white shadow-sm' 
                  : 'text-[#B8B1A5] hover:text-white'
              }`}
            >
              Candidate Screening
            </button>
            <button
              onClick={() => { setActiveTab('recruiter'); navigate('/recruiter'); }}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'recruiter' 
                  ? 'bg-white/20 text-white shadow-sm' 
                  : 'text-[#B8B1A5] hover:text-white'
              }`}
            >
              Recruiter Hub
            </button>
            <button
              onClick={() => setActiveTab('vector')}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'vector' 
                  ? 'bg-white/20 text-white shadow-sm' 
                  : 'text-[#B8B1A5] hover:text-white'
              }`}
            >
              768-Dim NLP
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-4 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'jobs' 
                  ? 'bg-white/20 text-white shadow-sm' 
                  : 'text-[#B8B1A5] hover:text-white'
              }`}
            >
              Active Postings
            </button>
          </div>

        </div>

        {/* Subtle Bottom Indicators */}
        <div className="relative z-10 flex items-center justify-center gap-8 text-[11px] text-[#A69F93] uppercase tracking-widest font-semibold pt-8">
          <span>Google Gemini 2.0 Flash</span>
          <span>•</span>
          <span>Cosine Vector Geometry</span>
          <span>•</span>
          <span>JWT Enterprise Security</span>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* EDITORIAL STORY SECTION (Faithfully styled after Reference Image 2)        */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Atmospheric Architectural Photo */}
          <div className="lg:col-span-6 relative group">
            <div className="relative rounded-2xl overflow-hidden border border-[#2D2A26] shadow-2xl aspect-[16/10]">
              <img 
                src={moodImg} 
                alt="Tactile warm lighting and ceramics" 
                className="w-full h-full object-cover filter contrast-[1.05] brightness-90 group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="font-editorial italic text-amber-300 text-sm">
                  Precision Engineering
                </span>
                <p className="text-white text-lg font-bold font-sans-clean">
                  Mathematical scoring that evaluates depth, not just keyword counts.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-6 space-y-6">
            <span className="font-editorial italic text-amber-500/90 text-xl font-normal block">
              Beyond Naive Keyword Matching
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight font-sans-clean">
              Recruiting that feels thoughtful and human.
            </h2>
            <p className="text-[#A39D92] text-sm sm:text-base leading-relaxed">
              Traditional Applicant Tracking Systems (ATS) discard qualified candidates simply because they wrote <em>"Spring Boot microservices"</em> instead of the exact phrase <em>"Backend Java Specialist"</em>.
            </p>
            <p className="text-[#A39D92] text-sm sm:text-base leading-relaxed">
              Quick Hire projects resumes and job specifications into a shared <strong>768-dimensional NLP vector space</strong> using Google's <code className="text-amber-400 bg-[#26231F] px-1.5 py-0.5 rounded text-xs font-mono">text-embedding-004</code>. We measure real semantic proximity with cosine angles, so no qualified candidate is missed.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#191816] border border-[#2B2824]">
                <div className="text-2xl font-bold text-white font-sans-clean">768</div>
                <div className="text-xs text-[#8E877E] mt-1">Dense NLP Vector Dimensions</div>
              </div>
              <div className="p-4 rounded-xl bg-[#191816] border border-[#2B2824]">
                <div className="text-2xl font-bold text-amber-400 font-sans-clean">&lt; 1.5s</div>
                <div className="text-xs text-[#8E877E] mt-1">Gemini Inference & Parsing</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/candidate')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-amber-300 transition-colors group cursor-pointer"
              >
                <span>Upload a resume to test the pipeline</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* LIVE JOBS PREVIEW SECTION                                                 */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#131211] border-y border-[#24211E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="font-editorial italic text-amber-500/90 text-lg">
                Curated Opportunities
              </span>
              <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1 font-sans-clean">
                Active Job Openings
              </h3>
              <p className="text-xs sm:text-sm text-[#8E877E] mt-1">
                Roles currently available in the database with automated skill vector matching.
              </p>
            </div>

            <button
              onClick={() => navigate('/recruiter')}
              className="self-start md:self-auto px-4 py-2 border border-[#3D3832] rounded-lg text-xs font-bold uppercase tracking-wider text-[#C4BEB4] hover:text-white hover:border-white transition-all cursor-pointer"
            >
              Post a New Role
            </button>
          </div>

          {loadingJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 rounded-xl bg-[#1A1917] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.slice(0, 6).map((job) => (
                <div 
                  key={job.id} 
                  className="bg-[#191816] border border-[#2B2723] hover:border-[#4D453D] rounded-xl p-6 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#8E877E] mb-2.5">
                      <span className="font-semibold text-white">{job.companyName}</span>
                      <span>{job.location}</span>
                    </div>

                    <h4 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors font-sans-clean mb-2">
                      {job.title}
                    </h4>

                    <p className="text-xs text-[#9E988E] line-clamp-3 mb-4 leading-relaxed">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.requiredSkills?.slice(0, 4).map((skill, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 bg-[#24211D] border border-[#38332C] text-[#CFC8BE] text-[11px] rounded"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills?.length > 4 && (
                        <span className="text-[10px] text-[#7A746B] self-center">
                          +{job.requiredSkills.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#24211E] flex items-center justify-between text-xs">
                    <span className="font-medium text-amber-400/90 font-mono">
                      {job.salaryRange || 'Competitive'}
                    </span>
                    <button
                      onClick={() => navigate('/candidate')}
                      className="text-white hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Match Resume</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* ========================================================================= */}
      {/* FINAL CALL TO ACTION (Squarespace Minimalist Style)                       */}
      {/* ========================================================================= */}
      <section className="py-24 text-center px-4 max-w-4xl mx-auto">
        <span className="font-editorial italic text-amber-500/90 text-2xl block mb-2">
          Experience the Difference
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6 font-sans-clean">
          Start hiring or getting hired today.
        </h2>
        <p className="text-sm sm:text-base text-[#9E988E] max-w-xl mx-auto mb-8 leading-relaxed">
          No credit card required. Upload a PDF resume or job post to experience real-time vector scoring and AI synthesis.
        </p>
        <button
          onClick={handleHeroCta}
          className="px-8 py-3.5 bg-white text-black font-extrabold text-xs tracking-widest uppercase rounded-sm hover:bg-[#F2ECE4] active:scale-95 transition-all shadow-lg cursor-pointer"
        >
          Get Started Now
        </button>
      </section>

    </div>
  );
}

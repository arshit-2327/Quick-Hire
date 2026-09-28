import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, FileText, Sparkles, ArrowRight, CheckCircle2, 
  Layers, Compass, Award, ChevronRight, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import heroImg from '../assets/hero_editorial.jpg';
import aiBrainImg from '../assets/ai_brain_circuit.jpg';

export default function HomePage() {
  const { currentUser, openRegister, openLogin } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
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
      {/* HERO SECTION                                                              */}
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
          
          {/* Eyebrow in elegant italic serif */}
          <span className="font-editorial italic text-lg sm:text-2xl text-amber-200/90 font-light tracking-wide mb-3 block animate-fadeIn">
            Modern Talent Intelligence
          </span>

          {/* Display Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.08] font-sans-clean">
            Screen resumes with <br className="hidden sm:block" />
            genuine human insight
          </h1>

          {/* Centered White Crisp CTA Button */}
          <div className="flex justify-center mb-10">
            <button
              onClick={handleHeroCta}
              className="px-8 py-3.5 bg-white text-black font-extrabold text-xs sm:text-sm tracking-widest uppercase rounded-sm hover:bg-[#F2ECE4] active:scale-95 transition-all shadow-xl cursor-pointer"
            >
              Get Started
            </button>
          </div>

          {/* Pill Capsule Navigation */}
          <div className="inline-flex flex-wrap items-center justify-center gap-1 sm:gap-2 p-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full max-w-full">
            <button
              onClick={() => navigate('/jobs')}
              className="px-4 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-wide text-[#B8B1A5] hover:text-white transition-all cursor-pointer"
            >
              Explore Open Jobs
            </button>
            <button
              onClick={() => navigate('/candidate')}
              className="px-4 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-wide text-[#B8B1A5] hover:text-white transition-all cursor-pointer"
            >
              Candidate Portal
            </button>
            <button
              onClick={() => navigate('/recruiter')}
              className="px-4 sm:px-6 py-2 rounded-full text-xs font-semibold tracking-wide text-[#B8B1A5] hover:text-white transition-all cursor-pointer"
            >
              Recruiter Hub
            </button>
          </div>

        </div>

        {/* Human-Centered Bottom Indicators */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-[11px] text-[#A69F93] uppercase tracking-widest font-semibold pt-8">
          <span>Verified Skill Extraction</span>
          <span>•</span>
          <span>Semantic Fit Matching</span>
          <span>•</span>
          <span>Transparent Hiring</span>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* EDITORIAL STORY SECTION                                                   */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Atmospheric Architectural Photo */}
          <div className="lg:col-span-6 relative group">
            <div className="relative rounded-2xl overflow-hidden border border-[#2D2A26] shadow-2xl aspect-[16/10]">
              <img 
                src={aiBrainImg} 
                alt="AI Neural Competency Matching" 
                className="w-full h-full object-cover filter contrast-[1.05] brightness-90 group-hover:scale-102 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="font-editorial italic text-amber-300 text-sm">
                  Nuanced Understanding
                </span>
                <p className="text-white text-lg font-bold font-sans-clean">
                  Evaluating candidates on demonstrated competence, not keyword gymnastics.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-6 space-y-6">
            <span className="font-editorial italic text-amber-500/90 text-xl font-normal block">
              Beyond Rigid Keyword Filters
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight font-sans-clean">
              Recruiting that feels thoughtful and human.
            </h2>
            <p className="text-[#A39D92] text-sm sm:text-base leading-relaxed">
              Traditional Applicant Tracking Systems discard exceptional candidates simply because they expressed experience in alternative wording.
            </p>
            <p className="text-[#A39D92] text-sm sm:text-base leading-relaxed">
              Quick Hire assesses resumes and job specifications holistically — analyzing core proficiencies, technical breadth, and practical experience with balanced skill-overlap scoring.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#191816] border border-[#2B2824]">
                <div className="text-2xl font-bold text-white font-sans-clean">98%</div>
                <div className="text-xs text-[#8E877E] mt-1">Skill Matching Accuracy</div>
              </div>
              <div className="p-4 rounded-xl bg-[#191816] border border-[#2B2824]">
                <div className="text-2xl font-bold text-amber-400 font-sans-clean">&lt; 2s</div>
                <div className="text-xs text-[#8E877E] mt-1">Instant Resume Synthesis</div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/jobs')}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-amber-300 transition-colors group cursor-pointer"
              >
                <span>Browse Available Jobs</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* FEATURED JOBS PREVIEW SECTION                                             */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#131211] border-y border-[#24211E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="font-editorial italic text-amber-500/90 text-lg">
                Curated Opportunities
              </span>
              <h3 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1 font-sans-clean">
                Featured Openings
              </h3>
              <p className="text-xs sm:text-sm text-[#8E877E] mt-1">
                Explore active roles across product engineering, AI, design, and infrastructure.
              </p>
            </div>

            <button
              onClick={() => navigate('/jobs')}
              className="self-start md:self-auto px-4 py-2 border border-[#3D3832] rounded-lg text-xs font-bold uppercase tracking-wider text-[#C4BEB4] hover:text-white hover:border-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>View All Openings</span>
              <ChevronRight className="w-3.5 h-3.5" />
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
                      <span className="font-semibold text-white">{job.company}</span>
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
                      onClick={() => navigate('/jobs')}
                      className="text-white hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Apply Now</span>
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
      {/* FINAL CALL TO ACTION                                                      */}
      {/* ========================================================================= */}
      <section className="py-24 text-center px-4 max-w-4xl mx-auto">
        <span className="font-editorial italic text-amber-500/90 text-2xl block mb-2">
          Experience the Difference
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white mb-6 font-sans-clean">
          Start hiring or getting hired today.
        </h2>
        <p className="text-sm sm:text-base text-[#9E988E] max-w-xl mx-auto mb-8 leading-relaxed">
          Upload a resume or explore open opportunities with transparent skill breakdown and real-time fit analysis.
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

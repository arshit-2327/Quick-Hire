import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0B0A09] border-t border-[#211F1C] py-16 text-[#A39D92]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-white flex items-center justify-center text-black font-extrabold text-xs">
                QH
              </div>
              <span className="font-extrabold tracking-widest text-xs uppercase text-[#ECE8E1]">
                Quick Hire
              </span>
            </div>
            <p className="text-xs text-[#7F796F] leading-relaxed">
              Human-first resume intelligence. Combining 768-dimensional NLP vector embeddings and Google Gemini 2.0.
            </p>
          </div>

          {/* Navigation Column 1 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECE8E1] mb-4">Platform</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Overview</Link>
              </li>
              <li>
                <Link to="/candidate" className="hover:text-white transition-colors">Candidate Screening</Link>
              </li>
              <li>
                <Link to="/recruiter" className="hover:text-white transition-colors">Recruiter Talent Engine</Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-white transition-colors">System Diagnostics</Link>
              </li>
            </ul>
          </div>

          {/* Navigation Column 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECE8E1] mb-4">Architecture</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-1">
                <span>Google Gemini 2.0 Flash</span>
              </li>
              <li className="flex items-center gap-1">
                <span>768-Dim text-embedding-004</span>
              </li>
              <li className="flex items-center gap-1">
                <span>Cosine Similarity Engine</span>
              </li>
              <li className="flex items-center gap-1">
                <span>Spring Boot 3 + PostgreSQL</span>
              </li>
            </ul>
          </div>

          {/* Standards & Philosophy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECE8E1] mb-4">Philosophy</h4>
            <p className="text-xs text-[#7F796F] leading-relaxed">
              We replace cold, rigid ATS keyword filters with nuanced semantic understanding and transparent skill gap explanations.
            </p>
            <div className="mt-4 pt-3 border-t border-[#1C1A17] flex items-center gap-2 text-[11px] text-amber-500/80 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Designed with craft & human empathy</span>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-[#1C1A17] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B655C] gap-4">
          <p>© {new Date().getFullYear()} Quick Hire Systems. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Spring Boot 3.3.4</span>
            <span>•</span>
            <span>React 19</span>
            <span>•</span>
            <span>JWT Secured</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

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
              Human-centered talent intelligence. Connecting ambitious talent with discerning teams through thoughtful, competence-first matching.
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
                <Link to="/jobs" className="hover:text-white transition-colors">Job Openings</Link>
              </li>
              <li>
                <Link to="/candidate" className="hover:text-white transition-colors">Candidate Portal</Link>
              </li>
              <li>
                <Link to="/recruiter" className="hover:text-white transition-colors">Recruiter Hub</Link>
              </li>
            </ul>
          </div>

          {/* Values Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECE8E1] mb-4">Principles</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="text-[#8E877E]">Holistic Candidate Profiles</li>
              <li className="text-[#8E877E]">Skill Depth Over Exact Keywords</li>
              <li className="text-[#8E877E]">Transparent Applicant Feedback</li>
              <li className="text-[#8E877E]">Recruiter Precision Pipelines</li>
            </ul>
          </div>

          {/* Philosophy Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ECE8E1] mb-4">Philosophy</h4>
            <p className="text-xs text-[#7F796F] leading-relaxed">
              We believe recruitment should celebrate what people can do, eliminating arbitrary rejections and highlighting real capability.
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
            <Link to="/jobs" className="hover:text-[#A39D92] transition-colors">Browse Jobs</Link>
            <span>•</span>
            <Link to="/candidate" className="hover:text-[#A39D92] transition-colors">My Applications</Link>
            <span>•</span>
            <Link to="/settings" className="hover:text-[#A39D92] transition-colors">System Diagnostics</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

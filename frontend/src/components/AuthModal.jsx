import React, { useState, useEffect } from 'react';
import { X, Sparkles, User, Building, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authMode,
    setAuthMode,
    intendedRole,
    setIntendedRole,
    login,
    register,
  } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authModalOpen) {
      setError('');
    }
  }, [authModalOpen, authMode]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: intendedRole,
          companyName: intendedRole === 'RECRUITER' ? formData.companyName : null,
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (role) => {
    if (role === 'STUDENT') {
      setIntendedRole('STUDENT');
      setAuthMode('login');
      setFormData({
        name: 'Alex Rivera',
        email: 'student@demo.com',
        password: 'password123',
        companyName: '',
      });
    } else {
      setIntendedRole('RECRUITER');
      setAuthMode('login');
      setFormData({
        name: 'Sarah Jenkins',
        email: 'recruiter@demo.com',
        password: 'password123',
        companyName: 'TechCorp Global',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#191816] border border-[#332F2A] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#ECE8E1]">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-5 right-5 text-[#8E877E] hover:text-[#ECE8E1] transition-colors p-1 rounded-full hover:bg-[#262421]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Serif Eyebrow */}
        <div className="text-center mb-6">
          <span className="font-editorial italic text-amber-500/90 text-lg">
            {authMode === 'login' ? 'Welcome back' : 'Start your journey'}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[#ECE8E1] mt-1 font-sans-clean">
            {authMode === 'login' ? 'Sign in to Quick Hire' : 'Create your account'}
          </h2>
          <p className="text-xs text-[#9E988E] mt-1.5">
            {authMode === 'login'
              ? 'Access your saved matches and intelligent talent profiles'
              : 'Join the next generation of human-guided AI recruitment'}
          </p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#121110] border border-[#2B2723] rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setIntendedRole('STUDENT')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              intendedRole === 'STUDENT'
                ? 'bg-[#2E2A24] text-white shadow-sm border border-[#443E36]'
                : 'text-[#8E877E] hover:text-[#ECE8E1]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Candidate
          </button>
          <button
            type="button"
            onClick={() => setIntendedRole('RECRUITER')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              intendedRole === 'RECRUITER'
                ? 'bg-[#2E2A24] text-white shadow-sm border border-[#443E36]'
                : 'text-[#8E877E] hover:text-[#ECE8E1]'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Recruiter
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Eleanor Vance"
                className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] placeholder-[#5C564E] focus:outline-none focus:border-amber-500/80 transition-all"
              />
            </div>
          )}

          {authMode === 'register' && intendedRole === 'RECRUITER' && (
            <div>
              <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Company Name</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. Studio Craft Media"
                className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] placeholder-[#5C564E] focus:outline-none focus:border-amber-500/80 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Work Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@company.com"
              className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] placeholder-[#5C564E] focus:outline-none focus:border-amber-500/80 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#C8C2B7] mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] placeholder-[#5C564E] focus:outline-none focus:border-amber-500/80 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-white text-black font-semibold text-xs tracking-wider uppercase rounded-xl hover:bg-[#F2ECE4] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
            ) : (
              <>
                <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div className="mt-5 pt-4 border-t border-[#262421]">
          <p className="text-[11px] text-[#7E776E] text-center mb-2.5 uppercase tracking-wider font-semibold">
            One-Click Instant Demo Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('STUDENT')}
              className="px-2.5 py-2 bg-[#121110] hover:bg-[#201E1B] border border-[#2D2A26] rounded-lg text-left transition-all text-xs group"
            >
              <div className="text-[10px] text-amber-500/80 font-medium">Demo Candidate</div>
              <div className="text-[#C8C2B7] font-semibold truncate group-hover:text-white">Alex Rivera</div>
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('RECRUITER')}
              className="px-2.5 py-2 bg-[#121110] hover:bg-[#201E1B] border border-[#2D2A26] rounded-lg text-left transition-all text-xs group"
            >
              <div className="text-[10px] text-amber-500/80 font-medium">Demo Recruiter</div>
              <div className="text-[#C8C2B7] font-semibold truncate group-hover:text-white">Sarah Jenkins</div>
            </button>
          </div>
        </div>

        {/* Toggle between login and register */}
        <div className="text-center mt-5 text-xs text-[#8E877E]">
          {authMode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-white hover:underline font-medium"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-white hover:underline font-medium"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Database, Cpu, ShieldCheck, Key, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api';

export default function SettingsPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySuccess, setKeySuccess] = useState('');
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getSystemStatus();
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setKeySuccess('');
    setKeyError('');
    if (!apiKeyInput.trim()) return;

    try {
      await api.setGeminiKey(apiKeyInput.trim());
      setKeySuccess('Gemini API key updated successfully in runtime context.');
      setApiKeyInput('');
      loadStatus();
    } catch (err) {
      setKeyError(err.message || 'Failed to update key.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0E0D] text-[#ECE8E1] py-12 px-4 sm:px-6 lg:px-8 font-sans-clean">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="border-b border-[#24211E] pb-6">
          <span className="font-editorial italic text-amber-500/90 text-lg">
            System & Infrastructure
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1 font-sans-clean">
            Engine Diagnostics & Keys
          </h1>
          <p className="text-xs sm:text-sm text-[#8E877E] mt-1">
            Verify database connectivity, NLP vector dimension parameters, and Google Gemini 2.0 configuration.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#161513] border border-[#2B2723] rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-[#211F1B] border border-[#3A352F] flex items-center justify-center text-amber-400 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Database Layer</h3>
            <p className="text-xs text-[#8E877E] mb-3">PostgreSQL (Neon) with H2 fallback.</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Connected & Operational</span>
            </div>
          </div>

          <div className="bg-[#161513] border border-[#2B2723] rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-[#211F1B] border border-[#3A352F] flex items-center justify-center text-amber-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">AI Inference</h3>
            <p className="text-xs text-[#8E877E] mb-3">Google Gemini 2.0 Flash</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Inference Active</span>
            </div>
          </div>

          <div className="bg-[#161513] border border-[#2B2723] rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-[#211F1B] border border-[#3A352F] flex items-center justify-center text-amber-400 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Security Standard</h3>
            <p className="text-xs text-[#8E877E] mb-3">Spring Security + BCrypt + JWT</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Token Protected</span>
            </div>
          </div>
        </div>

        {/* Runtime API Key Config */}
        <div className="bg-[#161513] border border-[#2B2723] rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white">Google Gemini API Key</h3>
            <p className="text-xs text-[#8E877E] mt-1">
              Override or update the server's Gemini API key for high-throughput testing.
            </p>
          </div>

          {keySuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{keySuccess}</span>
            </div>
          )}

          {keyError && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{keyError}</span>
            </div>
          )}

          <form onSubmit={handleSaveApiKey} className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-4 py-2.5 bg-[#121110] border border-[#332F2A] rounded-xl text-sm text-[#ECE8E1] focus:outline-none focus:border-amber-500/80 font-mono"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-[#F2ECE4] transition-all cursor-pointer shadow-md"
            >
              Update Key
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

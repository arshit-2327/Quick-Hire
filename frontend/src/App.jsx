import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0F0E0D]">
      <Navbar />
      <AuthModal />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/candidate" element={<CandidateDashboard />} />
          <Route path="/recruiter" element={<RecruiterDashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          {/* Fallback to home for unknown routes */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

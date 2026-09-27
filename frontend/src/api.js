const API_BASE = 'http://localhost:8080/api';

export const api = {
  // Auth
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Registration failed');
    return result;
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Login failed');
    return result;
  },

  // Candidate & Resume
  async uploadResume(file, userId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (userId) {
      formData.append('userId', userId);
    }
    const res = await fetch(`${API_BASE}/resume/upload`, {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to upload resume');
    return result;
  },

  async getUserResume(userId) {
    const res = await fetch(`${API_BASE}/resume/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user resume');
    return res.json();
  },

  async deleteUserResume(userId) {
    const res = await fetch(`${API_BASE}/resume/user/${userId}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete resume');
    return result;
  },

  async getAllCandidates() {
    const res = await fetch(`${API_BASE}/resume/all`);
    if (!res.ok) throw new Error('Failed to fetch candidates');
    return res.json();
  },

  // Job Matches
  async getUserMatches(userId) {
    const res = await fetch(`${API_BASE}/matches/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch matched jobs');
    return res.json();
  },

  async getMatchedJobsByCandidateId(candidateId) {
    const res = await fetch(`${API_BASE}/matches/candidate/${candidateId}`);
    if (!res.ok) throw new Error('Failed to fetch matched jobs');
    return res.json();
  },

  async getRankedCandidatesForJob(jobId) {
    const res = await fetch(`${API_BASE}/matches/job/${jobId}/candidates`);
    if (!res.ok) throw new Error('Failed to fetch applicants');
    return res.json();
  },

  // Jobs
  async getAllJobs() {
    const res = await fetch(`${API_BASE}/jobs`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  async createJob(jobData) {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData),
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
  },

  async deleteJob(id) {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete job');
    return true;
  },

  // System Config
  async getSystemStatus() {
    const res = await fetch(`${API_BASE}/config/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  async setGeminiKey(apiKey) {
    const res = await fetch(`${API_BASE}/config/gemini-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    if (!res.ok) throw new Error('Failed to update Gemini API key');
    return res.json();
  },
};

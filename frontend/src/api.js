const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const getAuthToken = () => localStorage.getItem('quickhire_token');
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('quickhire_token', token);
  else localStorage.removeItem('quickhire_token');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('quickhire_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) localStorage.setItem('quickhire_user', JSON.stringify(user));
  else localStorage.removeItem('quickhire_user');
};

export const logoutUser = () => {
  localStorage.removeItem('quickhire_token');
  localStorage.removeItem('quickhire_user');
};

const authHeaders = (extraHeaders = {}) => {
  const token = getAuthToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
};

export const api = {
  // Auth
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      const msg = result.validationErrors 
        ? Object.values(result.validationErrors).join(', ')
        : (result.message || 'Registration failed');
      throw new Error(msg);
    }
    if (result.token) {
      setAuthToken(result.token);
      setStoredUser({
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        companyName: result.companyName,
      });
    }
    return result;
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const result = await res.json();
    if (!res.ok) {
      const msg = result.validationErrors
        ? Object.values(result.validationErrors).join(', ')
        : (result.message || 'Invalid email or password');
      throw new Error(msg);
    }
    if (result.token) {
      setAuthToken(result.token);
      setStoredUser({
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        companyName: result.companyName,
      });
    }
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
      headers: authHeaders(),
      body: formData,
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to upload resume');
    return result;
  },

  async getUserResume(userId) {
    const res = await fetch(`${API_BASE}/resume/user/${userId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch user resume');
    return res.json();
  },

  async deleteUserResume(userId) {
    const res = await fetch(`${API_BASE}/resume/user/${userId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete resume');
    return result;
  },

  async getAllCandidates() {
    const res = await fetch(`${API_BASE}/resume/all`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch candidates');
    return res.json();
  },

  // Job Matches
  async getUserMatches(userId) {
    const res = await fetch(`${API_BASE}/matches/user/${userId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch matched jobs');
    return res.json();
  },

  async getMatchedJobsByCandidateId(candidateId) {
    const res = await fetch(`${API_BASE}/matches/candidate/${candidateId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch matched jobs');
    return res.json();
  },

  async getRankedCandidatesForJob(jobId) {
    const res = await fetch(`${API_BASE}/matches/job/${jobId}/candidates`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch applicants');
    return res.json();
  },

  // Jobs
  async getAllJobs() {
    const res = await fetch(`${API_BASE}/jobs`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  async createJob(jobData) {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(jobData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create job');
    return result;
  },

  async deleteJob(id) {
    const res = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete job');
    return true;
  },

  // System Config
  async getSystemStatus() {
    const res = await fetch(`${API_BASE}/config/status`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  async setGeminiKey(apiKey) {
    const res = await fetch(`${API_BASE}/config/gemini-key`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ apiKey }),
    });
    if (!res.ok) throw new Error('Failed to update Gemini API key');
    return res.json();
  },
};

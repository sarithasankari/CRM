import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for request: inject token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor for response: handle errors & auto-refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loops if refreshing token fails
    if (originalRequest.url.includes('/auth/token/refresh/')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          localStorage.setItem('access_token', newAccessToken);

          // Update header and retry original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token is expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  }
};

// Generic CRUD Generator
export const createResource = (endpoint) => ({
  getAll: async (params = {}) => {
    const response = await api.get(`/${endpoint}/`, { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/${endpoint}/${id}/`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post(`/${endpoint}/`, data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/${endpoint}/${id}/`, data);
    return response.data;
  },
  patch: async (id, data) => {
    const response = await api.patch(`/${endpoint}/${id}/`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/${endpoint}/${id}/`);
    return response.data;
  }
});

// Resources
export const leadsApi = {
  ...createResource('leads'),
  convert: async (id, data) => {
    const response = await api.post(`/leads/${id}/convert/`, data);
    return response.data;
  },
  getConversionRate: async () => {
    const response = await api.get('/leads/conversion-rate/');
    return response.data;
  },
};
export const dealsApi = {
  ...createResource('deals'),
  search: async (query) => {
    const response = await api.get('/deals/', { params: { search: query } });
    return response.data;
  },
};
export const tasksApi = createResource('tasks');
export const contactsApi = createResource('contacts');
export const activitiesApi = createResource('activities');
export const projectsApi = createResource('projects');
export const workflowsApi = createResource('workflows');
export const workflowLogsApi = createResource('workflow-logs');
export const quotesApi = createResource('quotes');
export const invoicesApi = createResource('invoices');
export const casesApi = createResource('cases');
export const usersApi = createResource('users');
export const meetingsApi = createResource('meetings');
export const callsApi = createResource('calls');
export const campaignsApi = createResource('campaigns');

// Email API — wraps the real send endpoint + activity log
export const emailsApi = {
  /** GET logged email activities */
  getAll: async (params = {}) => {
    const response = await api.get('/activities/', { params: { type: 'email', ...params } });
    return response.data;
  },
  /** DELETE an email activity log */
  delete: async (id) => {
    const response = await api.delete(`/activities/${id}/`);
    return response.data;
  },
  /**
   * Send a real email AND log it as an Activity.
   * @param {{ to_email, subject, body, contact_id? }} payload
   */
  send: async (payload) => {
    const response = await api.post('/emails/send/', payload);
    return response.data;
  },
};

export const analyticsApi = {
  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard/');
    return response.data;
  },
  getTeamPerformance: async () => {
    const response = await api.get('/analytics/team/');
    return response.data;
  }
};

export default api;

import axios from "axios";
import axiosRetry from "axios-retry";

// API Base URL - can be overridden with REACT_APP_API_URL environment variable
// Default to backend dev port 5000 where the server runs in this project
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout
});

// Configure automatic retry with exponential backoff
axiosRetry(api, {
  retries: 3, // Retry failed requests up to 3 times
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
  retryCondition: (error) => {
    // Retry on network errors or 5xx server errors
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response?.status >= 500 && error.response?.status < 600);
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Retrying request (${retryCount}/3):`, requestConfig.url);
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('Request timeout:', error.config?.url);
      error.message = 'Request timeout. Please check your connection and try again.';
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      window.location.href = "/admin/login";
    }

    // Handle forbidden errors
    if (error.response?.status === 403) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      window.location.href = "/admin/login";
    }

    return Promise.reject(error);
  }
);

// Complaint API
export const complaintAPI = {
  submitComplaint: (formData) => {
    return api.post("/complaints/submit", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getAllComplaints: (params = {}) => {
    return api.get("/complaints", { params });
  },

  getComplaintById: (id) => {
    return api.get(`/complaints/${id}`);
  },

  trackComplaint: (complaintNumber) => {
    return api.get(`/complaints/track/${complaintNumber}`);
  },

  updateComplaintStatus: (id, statusData) => {
    return api.patch(`/complaints/${id}/status`, statusData);
  },

  getStatistics: () => {
    return api.get("/complaints/stats/overview");
  },

  submitComplaintViaQR: (data) => {
    return api.post("/complaints/qr/submit", data);
  },

  generateLocationQR: (data) => {
    return api.post("/complaints/qr/generate-location", data);
  },

  getComplaintQR: (id) => {
    return api.get(`/complaints/${id}/qr`);
  },
};

// Auth API
export const authAPI = {
  login: (credentials) => {
    return api.post("/auth/login", credentials);
  },

  register: (data) => {
    return api.post("/auth/register", data);
  },

  getCurrentUser: () => {
    return api.get("/auth/me");
  },
};

export default api;

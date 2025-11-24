/**
 * API Utility Functions
 * Handles authenticated API requests with JWT tokens
 */

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

/**
 * Get the authentication token from localStorage
 */
export const getToken = () => {
  // Prefer localStorage (persistent) but fall back to sessionStorage (session-only)
  return (
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
};

/**
 * Get the current user from localStorage
 */
export const getCurrentUser = () => {
  // Try localStorage first, then sessionStorage (matches where login may have stored it)
  const userStr =
    localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (err) {
    return null;
  }
};

/**
 * Check if user is authenticated and is admin
 */
export const isAdminAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();
  return token && user && user.role === "admin";
};

// Request deduplication map to prevent duplicate submissions
const pendingRequests = new Map();

/**
 * Make an authenticated API request with timeout and retry logic
 */
export const apiRequest = async (endpoint, options = {}, retryCount = 0) => {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;
  const maxRetries = 2;
  const timeout = 15000; // 15 seconds

  // Request deduplication key
  const requestKey = `${options.method || 'GET'}_${endpoint}`;

  // Check if this request is already pending (prevent double submissions)
  if (pendingRequests.has(requestKey)) {
    console.log('Duplicate request prevented:', requestKey);
    return pendingRequests.get(requestKey);
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestPromise = (async () => {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle unauthorized (token expired or invalid)
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("user");
        window.location.href = "/admin/login";
        throw new Error("Session expired. Please login again.");
      }

      // Handle forbidden (not admin)
      if (response.status === 403) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("user");
        window.location.href = "/admin/login";
        throw new Error("Access denied. Admin privileges required.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "API request failed");
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);

      // Handle timeout
      if (err.name === 'AbortError') {
        if (retryCount < maxRetries) {
          console.log(`Request timeout, retrying... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
          return apiRequest(endpoint, options, retryCount + 1);
        }
        throw new Error("Request timeout. Please check your connection and try again.");
      }

      // Handle network errors with retry
      if (err.message.includes('fetch') && retryCount < maxRetries) {
        console.log(`Network error, retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        return apiRequest(endpoint, options, retryCount + 1);
      }

      console.error("API request error:", err);
      throw err;
    } finally {
      // Remove from pending requests after completion
      pendingRequests.delete(requestKey);
    }
  })();

  // Store pending request
  pendingRequests.set(requestKey, requestPromise);

  return requestPromise;
};

/**
 * Login with admin credentials
 */
export const login = async (username, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Login failed");
  }

  // Store token and user info
  localStorage.setItem("authToken", data.data.token);
  localStorage.setItem("user", JSON.stringify(data.data.user));

  // Notify same-tab listeners that auth changed
  try {
    window.dispatchEvent(new Event("authChanged"));
  } catch (e) { }

  return data.data;
};

/**
 * Logout user
 */
export const logout = () => {
  // Clear both storage locations to fully remove session/persistent tokens
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("user");
  // Dispatch authChanged so same-tab UI updates immediately
  try {
    window.dispatchEvent(new Event("authChanged"));
  } catch (e) { }
  window.location.href = "/admin/login";
};

/**
 * Get current authenticated user info
 */
export const getCurrentUserInfo = async () => {
  return apiRequest("/auth/me");
};

/**
 * Verify if token is still valid
 */
export const verifyToken = async () => {
  return apiRequest("/auth/verify", { method: "POST" });
};

/**
 * Get all complaints (admin only)
 */
export const getComplaints = async (page = 1, filters = {}) => {
  const params = new URLSearchParams({ page, ...filters });
  return apiRequest(`/complaints?${params}`);
};

/**
 * Get complaint statistics (admin only)
 */
export const getComplaintStats = async () => {
  return apiRequest("/complaints/stats/overview");
};

/**
 * Update complaint status (admin only)
 */
export const updateComplaintStatus = async (complaintId, statusData) => {
  return apiRequest(`/complaints/${complaintId}/status`, {
    method: "PATCH",
    body: JSON.stringify(statusData),
  });
};

/**
 * Delete a complaint (admin only)
 */
export const deleteComplaint = async (complaintId) => {
  return apiRequest(`/complaints/${complaintId}`, {
    method: "DELETE",
  });
};

/**
 * Get single complaint for tracking
 */
export const trackComplaint = async (complaintNumber) => {
  return apiRequest(`/complaints/track/${complaintNumber}`);
};

/**
 * Submit a new complaint
 */
export const submitComplaint = async (complaintData) => {
  const formData = new FormData();

  // Add text fields
  Object.keys(complaintData).forEach((key) => {
    if (key !== "attachments") {
      formData.append(key, complaintData[key]);
    }
  });

  // Add file attachments
  if (complaintData.attachments && complaintData.attachments.length > 0) {
    complaintData.attachments.forEach((file) => {
      formData.append("attachments", file);
    });
  }

  const response = await fetch(`${API_BASE_URL}/complaints/submit`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Failed to submit complaint");
  }

  return data.data;
};

/**
 * Register a new admin
 */
export const registerAdmin = async (adminData) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adminData),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
};

const apiClient = {
  getToken,
  getCurrentUser,
  isAdminAuthenticated,
  apiRequest,
  login,
  logout,
  getCurrentUserInfo,
  verifyToken,
  getComplaints,
  getComplaintStats,
  updateComplaintStatus,
  deleteComplaint,
  trackComplaint,
  submitComplaint,
  registerAdmin,

  // Officer methods
  officerLogin: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/officer/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  verifyOfficerToken: async () => {
    const token = localStorage.getItem("officerToken");
    const response = await fetch(`${API_BASE_URL}/auth/officer/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  getOfficerComplaints: async () => {
    const token = localStorage.getItem("officerToken");
    const response = await fetch(`${API_BASE_URL}/officer/complaints`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  updateComplaintAsOfficer: async (complaintId, updateData) => {
    const token = localStorage.getItem("officerToken");
    const response = await fetch(`${API_BASE_URL}/officer/complaints/${complaintId}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });
    return response.json();
  },

  registerOfficer: async (officerData) => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/auth/officer/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(officerData),
    });
    return response.json();
  },
};

export default apiClient;








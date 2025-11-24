import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../services/apiClient";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("authToken"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  });
  const [complaints, setComplaints] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [filters, setFilters] = useState({
    status: "",
    complaintType: "",
    wardNumber: "",
    priority: "",
  });

  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pages: 0,
  });

  const [updateForm, setUpdateForm] = useState({
    status: "",
    assignedTo: "",
    assignedPhone: "",
    assignedEmail: "",
    resolutionNotes: "",
    actionDate: "",
  });



  // --------------------------
  // CHECK AUTH
  // --------------------------
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await apiClient.getCurrentUserInfo();
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.data);
        loadComplaints();
        loadStatistics();
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      setIsAuthenticated(false);
    }
  };

  // --------------------------
  // LOGOUT
  // --------------------------
  const handleLogout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
  }, []);

  // --------------------------
  // LOAD COMPLAINTS
  // --------------------------
  const loadComplaints = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, ...filters };
      const response = await apiClient.getComplaints(page, params);

      if (response.success) {
        setComplaints(response.data);
        // Ensure pagination object has totalPages
        const paginationData = response.pagination || {};
        const total = paginationData.total || response.total || 0;
        const limit = paginationData.limit || 10; // default page size
        const totalPages = paginationData.totalPages || Math.ceil(total / limit);
        setPagination({
          current: page,
          total: total,
          pages: totalPages,
          totalPages: totalPages,
          ...paginationData,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // --------------------------
  // LOAD STATISTICS
  // --------------------------
  const loadStatistics = useCallback(async () => {
    try {
      const response = await apiClient.getComplaintStats();

      if (response.success) {
        setStatistics(response.data);
      }
    } catch (err) {
      setStatistics({
        total: 0,
        byStatus: [],
        byType: [],
        byPriority: [],
      });
    }
  }, []);

  // --------------------------
  // CHANGE PAGE
  // --------------------------
  const changePage = useCallback((newPage) => {
    if (newPage < 1) return;
    loadComplaints(newPage);
  }, [loadComplaints]);

  // --------------------------
  // UPDATE STATUS
  // --------------------------
  const handleStatusUpdate = useCallback(async () => {
    if (!selectedComplaint) return;

    setLoading(true);

    try {
      const response = await apiClient.updateComplaintStatus(
        selectedComplaint._id,
        updateForm
      );

      if (response.success) {
        setSuccessMessage("✅ Status updated successfully!");
        setSelectedComplaint(null);
        loadComplaints(pagination.current);
        loadStatistics();

        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      alert("Update failed.");
    } finally {
      setLoading(false);
    }
  }, [selectedComplaint, updateForm, loadComplaints, loadStatistics, pagination]);

  // --------------------------
  // DELETE COMPLAINT
  // --------------------------
  const handleDelete = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to delete this complaint? This action cannot be undone.")) {
      try {
        const res = await apiClient.deleteComplaint(id);
        if (res.success) {
          setSuccessMessage("✅ Complaint deleted successfully");
          loadComplaints(pagination.current);
          loadStatistics();
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          alert("Failed to delete complaint");
        }
      } catch (err) {
        console.error("Delete error", err);
        alert(err.message || "Error deleting complaint");
      }
    }
  }, [loadComplaints, loadStatistics, pagination]);

  // --------------------------
  // REGISTER OFFICER
  // --------------------------


  // --------------------------
  // BADGES
  // --------------------------
  const getStatusBadge = useCallback((status) => {
    const statusClasses = {
      Submitted: "badge-submitted",
      "Under Review": "badge-under-review",
      Accepted: "badge-accepted",
      "In Progress": "badge-in-progress",
      Resolved: "badge-resolved",
      Rejected: "badge-rejected",
    };
    return `badge ${statusClasses[status] || "badge-submitted"}`;
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-NP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // --------------------------
  // AUTH LOADING
  // --------------------------
  // --------------------------
  // AUTH LOADING
  // --------------------------
  // Optimistic rendering - no loading screen needed
  if (isAuthenticated === null) {
    return null;
  }

  // --------------------------
  // REDIRECT IF NOT AUTHENTICATED
  // --------------------------
  if (!isAuthenticated) {
    window.location.href = "/admin/login";
    return null;
  }

  // --------------------------
  // FINAL DASHBOARD UI
  // --------------------------
  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">📊 Admin Dashboard</h1>

        <div className="user-info">
          <span className="welcome-text">
            Welcome, {user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : ''}
          </span>
          <button className="btn-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '16px 32px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontSize: '16px',
          fontWeight: '500',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {successMessage}
        </div>
      )}

      {/* STATISTICS */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{statistics.total}</div>
            <div className="stat-label">Total Complaints</div>
          </div>

          {statistics.byStatus.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value">{stat.count}</div>
              <div className="stat-label">{stat._id}</div>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div className="filters-card">
        <div className="filters-header">Filter Complaints</div>

        <div className="filters-grid">
          {/* STATUS */}
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Accepted">Accepted</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* TYPE */}
          <div className="filter-group">
            <label className="filter-label">Type</label>
            <select
              className="filter-select"
              value={filters.complaintType}
              onChange={(e) =>
                setFilters({ ...filters, complaintType: e.target.value })
              }
            >
              <option value="">All</option>
              <option value="Road">Road</option>
              <option value="Nala">Nala</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Electricity">Electricity</option>
              <option value="Waste Management">Waste Management</option>
              <option value="Public Health">Public Health</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* WARD */}
          <div className="filter-group">
            <label className="filter-label">Ward</label>
            <select
              className="filter-select"
              value={filters.wardNumber}
              onChange={(e) =>
                setFilters({ ...filters, wardNumber: e.target.value })
              }
            >
              <option value="">All</option>
              {Array.from({ length: 50 }, (_, i) => (
                <option key={i} value={i + 1}>
                  Ward {i + 1}
                </option>
              ))}
            </select>
          </div>


        </div>

        <div className="filter-actions">
          <button
            className="btn-primary"
            onClick={() => loadComplaints(1)}
            disabled={loading}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* COMPLAINT TABLE */}
      <div className="table-card">
        <div className="table-header">
          <h3 className="table-title">Complaints</h3>
        </div>

        <div className="table-responsive">
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
              Loading complaints...
            </div>
          ) : (
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>Complaint Id</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Ward</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center", padding: "2rem" }}>
                      No complaints found.
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c._id}>
                      <td data-label="Complaint ID" style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{c.complaintNumber}</td>
                      <td data-label="Name" style={{ fontWeight: 500 }}>{c.personName}</td>
                      <td data-label="Phone" style={{ fontFamily: "monospace" }}>{c.phone}</td>
                      <td data-label="Title" style={{ fontWeight: 500 }}>{c.title}</td>
                      <td data-label="Description" style={{ fontSize: "0.9rem", color: "#4a5568" }}>{c.description}</td>
                      <td data-label="Address" style={{ fontSize: "0.9rem", maxWidth: "200px" }}>
                        {c.address}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'block', marginTop: '0.25rem', color: '#667eea', textDecoration: 'none', fontSize: '0.8rem' }}
                          title="View on Google Maps"
                        >
                          📍 View Map
                        </a>
                      </td>
                      <td data-label="Type">{c.complaintType}</td>
                      <td data-label="Status">
                        <span className={getStatusBadge(c.status)}>
                          {c.status}
                        </span>
                      </td>
                      <td data-label="Ward">Ward {c.wardNumber}</td>
                      <td data-label="Date">{formatDate(c.incidentDate)}</td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          <button
                            className="btn-primary btn-sm"
                            onClick={() => {
                              setSelectedComplaint(c);
                              setUpdateForm({
                                status: c.status,
                                assignedTo: c.assignedTo || "",
                                assignedPhone: c.assignedPhone || "",
                                assignedEmail: c.assignedEmail || "",
                                resolutionNotes: c.resolutionNotes || "",
                                actionDate: c.actionDate || "",
                              });
                            }}
                          >
                            Update
                          </button>
                          <button
                            className="btn-danger btn-sm"
                            onClick={() => handleDelete(c._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          {/* Pagination Controls */}
          <div className="pagination">
            <button
              className="btn-page"
              onClick={() => changePage(pagination.current - 1)}
              disabled={pagination.current === 1 || loading}
            >
              Previous
            </button>
            <span className="page-info">
              Page {pagination.current} of {pagination.totalPages || 1}
            </span>
            <button
              className="btn-page"
              onClick={() => changePage(pagination.current + 1)}
              disabled={(pagination.totalPages && pagination.current >= pagination.totalPages) || loading}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* UPDATE MODAL */}
      {selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Update Complaint</h3>
            <p style={{ marginBottom: "1.5rem", color: "#64748b", fontSize: "0.9rem" }}>
              #{selectedComplaint.complaintNumber} - {selectedComplaint.title}
            </p>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={updateForm.status}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, status: e.target.value })
                }
              >
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Accepted">Accepted</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned To</label>
              <input
                className="form-control"
                value={updateForm.assignedTo}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, assignedTo: e.target.value })
                }
                placeholder="Officer Name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                value={updateForm.assignedPhone}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, assignedPhone: e.target.value })
                }
                placeholder="Officer Phone"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                value={updateForm.assignedEmail}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, assignedEmail: e.target.value })
                }
                placeholder="Officer Email"
              />
            </div>

            <div className="form-group">

            </div>

            <div className="form-group">
              <label className="form-label">Resolution Notes</label>
              <textarea
                className="form-control"
                rows="3"
                value={updateForm.resolutionNotes}
                onChange={(e) =>
                  setUpdateForm({
                    ...updateForm,
                    resolutionNotes: e.target.value,
                  })
                }
                placeholder="Add notes about the resolution or status change..."
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setSelectedComplaint(null)}
              >
                Cancel
              </button>

              <button
                className="btn-primary"
                onClick={handleStatusUpdate}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminDashboard;

import React, { useState } from 'react';
import { complaintAPI } from '../services/api';
import './TrackComplaint.css';

const TrackComplaint = () => {
  const [complaintNumber, setComplaintNumber] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!complaintNumber.trim()) {
      setError('Please enter a complaint number');
      return;
    }

    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const response = await complaintAPI.trackComplaint(complaintNumber.trim());
      if (response.data.success) {
        setComplaint(response.data.data);
      }
    } catch (error) {
      console.error('Error tracking complaint:', error);
      setError(error.response?.data?.message || 'Complaint not found. Please check your complaint number.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Submitted': 'badge-submitted',
      'Under Review': 'badge-under-review',
      'Accepted': 'badge-accepted',
      'In Progress': 'badge-in-progress',
      'Resolved': 'badge-resolved',
      'Rejected': 'badge-rejected'
    };
    return `badge ${statusClasses[status] || 'badge-submitted'}`;
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      'Low': 'badge-low',
      'Medium': 'badge-medium',
      'High': 'badge-high',
      'Emergency': 'badge-emergency'
    };
    return `badge ${priorityClasses[priority] || 'badge-medium'}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="track-container">
      <div className="track-card">
        <div className="track-header">
          <h2 className="track-title">
            🔍 Track Your Complaint
          </h2>
          <p className="track-subtitle">
            Enter your complaint number to check the status and progress
          </p>
        </div>
        <div className="track-body">
          <form onSubmit={handleSearch}>
            <div className="track-form-group">
              <label className="track-label">Complaint Number</label>
              <input
                type="text"
                className="track-input"
                placeholder="e.g., GAU20240001"
                value={complaintNumber}
                onChange={(e) => setComplaintNumber(e.target.value)}
              />
            </div>
            <div className="track-btn-container">
              <button
                type="submit"
                className="track-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ marginRight: '0.5rem' }}></span>
                    Searching...
                  </>
                ) : (
                  'Track Complaint'
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
              {error}
            </div>
          )}

          {complaint && (
            <div className="details-wrapper">
              <div className="track-card">
                <div className="track-header">
                  <div className="details-header-content">
                    <h3 className="details-title">Complaint Details</h3>
                    <div className="badge-container">
                      <span className={getStatusBadge(complaint.status)}>
                        {complaint.status}
                      </span>
                      <span className={getPriorityBadge(complaint.priority)}>
                        {complaint.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="track-body">
                  <div className="info-row">
                    <div className="info-col">
                      <div className="info-item">
                        <span className="info-label">Complaint Number:</span>
                        <p className="info-value highlight-value">
                          {complaint.complaintNumber}
                        </p>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Title:</span>
                        <p className="info-value">{complaint.title}</p>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Complaint Type:</span>
                        <p className="info-value">{complaint.complaintType}</p>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Submitted By:</span>
                        <p className="info-value">{complaint.personName}</p>
                      </div>
                    </div>
                    <div className="info-col">
                      <div className="info-item">
                        <span className="info-label">Phone:</span>
                        <p className="info-value">{complaint.phone}</p>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email:</span>
                        <p className="info-value">{complaint.email || 'Not provided'}</p>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Ward Number:</span>
                        <p className="info-value">Ward {complaint.wardNumber}</p>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Location:</span>
                        <p className="info-value">{complaint.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Address:</span>
                    <p className="info-value">
                      {complaint.address}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(complaint.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ marginLeft: '0.5rem', color: '#667eea', textDecoration: 'none', fontSize: '0.9rem' }}
                      >
                        📍 View on Map
                      </a>
                    </p>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Description:</span>
                    <p className="info-value" style={{ lineHeight: '1.6' }}>{complaint.description}</p>
                  </div>

                  {complaint.assignedTo && (
                    <div className="info-item">
                      <span className="info-label">Assigned To:</span>
                      <p className="info-value">{complaint.assignedTo}</p>
                    </div>
                  )}

                  {complaint.assignedPhone && (
                    <div className="info-item">
                      <span className="info-label">Assigned Officer Phone:</span>
                      <p className="info-value">
                        <a href={`tel:${complaint.assignedPhone}`} style={{ color: '#667eea', textDecoration: 'none' }}>
                          📞 {complaint.assignedPhone}
                        </a>
                      </p>
                    </div>
                  )}

                  {complaint.resolutionNotes && (
                    <div className="info-item">
                      <span className="info-label">Resolution Notes:</span>
                      <p className="info-value" style={{ lineHeight: '1.6' }}>{complaint.resolutionNotes}</p>
                    </div>
                  )}

                  {complaint.actionDate && (
                    <div className="info-item">
                      <span className="info-label">Action Date:</span>
                      <p className="info-value">
                        {new Date(complaint.actionDate).toLocaleDateString('en-NP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  <div className="info-row">

                    <div className="info-col">
                      {complaint.resolvedAt && (
                        <div className="info-item">
                          <span className="info-label">Resolved On:</span>
                          <p className="info-value">{formatDate(complaint.resolvedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {complaint.attachments && complaint.attachments.length > 0 && (
                    <div>
                      <span className="info-label">Attachments:</span>
                      <div style={{ marginTop: '0.5rem' }}>
                        {complaint.attachments.map((attachment, index) => {
                          const isCloudinary = attachment.startsWith("http");
                          const fileUrl = isCloudinary
                            ? attachment
                            : `http://localhost:5000/uploads/complaints/${attachment}`;

                          return (
                            <div key={index} className="attachment-item">
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attachment-link"
                              >
                                📎 {isCloudinary ? "View Attachment" : attachment}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  className="track-btn"
                  onClick={() => {
                    setComplaint(null);
                    setComplaintNumber('');
                    setError('');
                  }}
                >
                  Track Another Complaint
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackComplaint;

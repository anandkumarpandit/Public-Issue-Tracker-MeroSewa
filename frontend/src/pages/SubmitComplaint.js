import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { complaintAPI } from '../services/api';
import QRCodeScanner from '../components/QRScanner';
import QRCodeDisplay from '../components/QRCodeDisplay';
import './SubmitComplaint.css';

const SubmitComplaint = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [complaintNumber, setComplaintNumber] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [isQRSubmission, setIsQRSubmission] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Fallback: Set coordinates immediately in case address fetch fails
          const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setValue('location', `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`, { shouldValidate: true });

          // Use OpenStreetMap Nominatim API for reverse geocoding
          // Adding a timeout to prevent indefinite hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Geocoding service unavailable');

            const data = await response.json();

            if (data && data.address) {
              // Extract relevant location name
              const locationName =
                data.address.village ||
                data.address.suburb ||
                data.address.town ||
                data.address.city_district ||
                data.address.city ||
                data.address.county ||
                coordsString;

              const fullAddress = data.display_name || `Coordinates: ${coordsString}`;

              setValue('location', locationName, { shouldValidate: true });
              setValue('address', fullAddress, { shouldValidate: true });
            } else {
              // If address lookup returns no data, keep coordinates
              setValue('address', `Coordinates: ${coordsString}`, { shouldValidate: true });
            }
          } catch (fetchError) {
            console.warn('Address lookup failed, using coordinates:', fetchError);
            // Fallback is already set for location, just ensure address is set
            setValue('address', `Coordinates: ${coordsString}`, { shouldValidate: true });
            // Optional: Notify user that address lookup failed but location was captured
          }

        } catch (error) {
          console.error('Error processing location:', error);
          alert('Failed to process location data. Please enter manually.');
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let msg = 'Unable to retrieve your location.';
        if (error.code === 1) msg = 'Location permission denied. Please allow location access.';
        else if (error.code === 2) msg = 'Location unavailable. Please check your GPS.';
        else if (error.code === 3) msg = 'Location request timed out.';

        alert(msg);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm();

  // Prefill from URL query params when landing from a QR URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const loc = params.get('location');
      const ward = params.get('ward') || params.get('wardNumber');
      if (loc) setValue('location', loc);
      if (ward) setValue('wardNumber', ward);
      if (loc || ward) {
        setIsQRSubmission(true);
      }
    } catch (_) { }
  }, [setValue]);

  const onSubmit = async (data) => {
    // Prevent rapid submissions (debouncing)
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let response;

      if (isQRSubmission && qrData) {
        // Submit via QR code
        response = await complaintAPI.submitComplaintViaQR({
          qrData: JSON.stringify(qrData),
          ...data
        });
      } else {
        // Submit regular complaint
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
          if (data[key] !== undefined && data[key] !== null) {
            formData.append(key, data[key]);
          }
        });
        selectedFiles.forEach((file) => formData.append('attachments', file));

        response = await complaintAPI.submitComplaint(formData);
      }

      if (response.data.success) {
        const complaint = response.data.data;
        setComplaintNumber(complaint.complaintNumber);
        setQrCode(complaint.qrCode);
        setSubmitSuccess(true);
        reset();
        setSelectedFiles([]);
        setQrData(null);
        setIsQRSubmission(false);
      } else {
        alert('Submission failed: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      // Improved error messages
      if (error.message && error.message.includes('timeout')) {
        alert('Submission is taking longer than expected. Please check your connection and try again.');
      } else {
        alert('Failed to submit complaint. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 5)); // Max 5 files
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQRScan = (qrString) => {
    try {
      // Support both JSON payload and URL with query params
      if (qrString.startsWith('http://') || qrString.startsWith('https://')) {
        const url = new URL(qrString);
        const params = url.searchParams;
        const loc = params.get('location');
        const ward = params.get('ward') || params.get('wardNumber');
        if (loc) setValue('location', loc);
        if (ward) setValue('wardNumber', ward);
        setQrData({ location: loc, wardNumber: ward });
        setIsQRSubmission(true);
        setShowQRScanner(false);
        return;
      }

      const parsedData = JSON.parse(qrString);
      // Normalize keys to handle variations like "ward Number", "quick complaint"
      const normalized = Object.entries(parsedData).reduce((acc, [key, value]) => {
        const nk = key.replace(/\s+/g, '').toLowerCase();
        acc[nk] = value;
        return acc;
      }, {});

      const loc = normalized.location;
      const ward = normalized.wardnumber || normalized.ward;

      setQrData({ location: loc, wardNumber: ward });
      setIsQRSubmission(true);
      if (loc) setValue('location', loc);
      if (ward) setValue('wardNumber', ward);
      setShowQRScanner(false);
    } catch (error) {
      console.error('Invalid QR code:', error);
      alert('Invalid QR code. Please try again.');
    }
  };

  const clearQRData = () => {
    setQrData(null);
    setIsQRSubmission(false);
  };

  if (submitSuccess) {
    return (
      <div className="success-modal-overlay">
        <div className="success-modal">
          <div className="success-icon">✅</div>
          <h2>Complaint Submitted!</h2>
          <p>Your complaint has been received and is being processed.</p>

          <div className="complaint-number">
            {complaintNumber}
          </div>
          <p style={{ fontSize: '0.9rem', color: '#718096' }}>Save this number to track your complaint status</p>

          {qrCode && (
            <div style={{ marginTop: '1.5rem' }}>
              <QRCodeDisplay data={qrCode} title="Your Complaint QR Code" size={150} />
            </div>
          )}

          <div className="modal-actions">
            <button
              className="modal-button modal-button-primary"
              onClick={() => {
                setSubmitSuccess(false);
                setComplaintNumber('');
                setQrCode(null);
              }}
            >
              Submit Another
            </button>
            <a href="/track" className="modal-button modal-button-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Track Complaint
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-complaint-container">
      <div className="complaint-header">
        <h1>Submit New Complaint</h1>
        <p>Fill out the form below to submit your complaint</p>

        <button className="qr-scanner-btn" onClick={() => setShowQRScanner(true)}>
          📱 Scan QR Code
        </button>

        {qrData && (
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#e6fffa', borderRadius: '8px', display: 'inline-block' }}>
            <strong>QR Scanned:</strong> {qrData.location}, Ward {qrData.wardNumber}
            <button onClick={clearQRData} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#f56565', cursor: 'pointer' }}>✕</button>
          </div>
        )}
      </div>

      <div className="complaint-form-card">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Personal Information */}
          <div className="form-section">
            <h3 className="section-title">Personal Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name <span className="required-mark">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your full name"
                  {...register('personName', { required: true, minLength: 2, maxLength: 100 })}
                />
                {errors.personName && <span className="error-message">⚠️ Name is required</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number <span className="required-mark">*</span></label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="98XXXXXXXX"
                  {...register('phone', { required: true, pattern: /^[0-9+\-\s()]{10,15}$/ })}
                />
                {errors.phone && <span className="error-message">⚠️ Valid phone required</span>}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Email (Optional)</label>
              <input
                type="email"
                className="form-input"
                placeholder="your.email@example.com"
                {...register('email', { pattern: /^\w+([-.]?\w+)*@\w+([-.]?\w+)*(\.\w{2,3})+$/ })}
              />
              {errors.email && <span className="error-message">⚠️ Invalid email format</span>}
            </div>
          </div>

          {/* Address Information */}
          <div className="form-section">
            <h3 className="section-title">Address Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Ward Number <span className="required-mark">*</span></label>
                <select className="form-select" {...register('wardNumber', { required: true })}>
                  <option value="">Select Ward</option>
                  {Array.from({ length: 50 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Ward {i + 1}</option>
                  ))}
                </select>
                {errors.wardNumber && <span className="error-message">⚠️ Ward is required</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Location/Area <span className="required-mark">*</span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    style={{
                      marginLeft: 'auto',
                      background: 'none',
                      border: 'none',
                      color: '#667eea',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0 0.5rem'
                    }}
                  >
                    {detectingLocation ? '⏳ Detecting...' : '📍 Detect My Location'}
                  </button>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Guntur, Nagarjuna Nagar"
                  {...register('location', { required: true, minLength: 2, maxLength: 100 })}
                />
                {errors.location && <span className="error-message">⚠️ Location is required</span>}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Full Address <span className="required-mark">*</span></label>
              <textarea
                className="form-textarea"
                placeholder="Enter your complete address..."
                {...register('address', { required: true, minLength: 10, maxLength: 200 })}
              ></textarea>
              {errors.address && <span className="error-message">⚠️ Address is required (min 10 characters)</span>}
            </div>
          </div>

          {/* Complaint Details */}
          <div className="form-section">
            <h3 className="section-title">Complaint Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Complaint Type <span className="required-mark">*</span></label>
                <select className="form-select" {...register('complaintType', { required: true })}>
                  <option value="">Select Type</option>
                  <option value="Road">Road Issues</option>
                  <option value="Nala">Nala/Drainage</option>
                  <option value="Water Supply">Water Supply</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Public Health">Public Health</option>
                  <option value="Other">Other</option>
                </select>
                {errors.complaintType && <span className="error-message">⚠️ Type is required</span>}
              </div>



              <div className="form-group">
                <label className="form-label">Date <span className="required-mark">*</span></label>
                <input
                  type="date"
                  className="form-input"
                  {...register('incidentDate', { required: true })}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.incidentDate && <span className="error-message">⚠️ Date is required</span>}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Complaint Title <span className="required-mark">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief title of your complaint"
                {...register('title', { required: true, minLength: 5, maxLength: 150 })}
              />
              {errors.title && <span className="error-message">⚠️ Title is required (5-150 characters)</span>}
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Description <span className="required-mark">*</span></label>
              <textarea
                className="form-textarea"
                placeholder="Describe your complaint in detail..."
                style={{ minHeight: '150px' }}
                {...register('description', { required: true, minLength: 20, maxLength: 1000 })}
              ></textarea>
              {errors.description && <span className="error-message">⚠️ Description is required (20-1000 characters)</span>}
            </div>

            {/* File Upload */}
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Attachments (Optional)</label>
              <div className="file-upload-area" onClick={() => document.getElementById('file-input').click()}>
                <div className="file-upload-icon">📎</div>
                <div className="file-upload-text">
                  Click to upload images or documents<br />
                  <small>(Max 5 files, images/PDF/DOC)</small>
                </div>
                <input
                  id="file-input"
                  type="file"
                  className="file-upload-input"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-chip">
                      📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      <button
                        type="button"
                        className="file-chip-remove"
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-button-container">
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? '⏳ Submitting...' : '🚀 Submit Complaint'}
            </button>
          </div>
        </form>
      </div>

      {showQRScanner && <QRCodeScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />}
    </div>
  );
};

export default SubmitComplaint;
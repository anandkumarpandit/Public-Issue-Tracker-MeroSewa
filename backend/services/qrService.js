const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");

// Generate QR code for complaint submission
const generateComplaintQR = async (complaintId, complaintNumber) => {
  try {
    const qrData = {
      type: "complaint_submission",
      complaintId: complaintId,
      complaintNumber: complaintNumber,
      timestamp: new Date().toISOString(),
      baseUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    };

    const qrString = JSON.stringify(qrData);

    // Create QR code as base64 image
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    // Also generate as file for storage
    const qrDir = path.join(__dirname, "../uploads/qr-codes");
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const qrFileName = `complaint-${complaintNumber}-${Date.now()}.png`;
    const qrFilePath = path.join(qrDir, qrFileName);

    await QRCode.toFile(qrFilePath, qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return {
      dataURL: qrCodeDataURL,
      fileName: qrFileName,
      filePath: qrFilePath,
      data: qrData,
    };
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
};

// Generate QR code for quick complaint submission
const generateQuickComplaintQR = async (location, wardNumber) => {
  try {
    const qrData = {
      type: "quick_complaint",
      location: location,
      wardNumber: wardNumber,
      timestamp: new Date().toISOString(),
      baseUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    };

    const qrString = JSON.stringify(qrData);

    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: "#667eea",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    return {
      dataURL: qrCodeDataURL,
      data: qrData,
    };
  } catch (error) {
    console.error("Error generating quick complaint QR code:", error);
    throw error;
  }
};

// Generate QR code for tracking
const generateTrackingQR = async (complaintNumber) => {
  try {
    const qrData = {
      type: "complaint_tracking",
      complaintNumber: complaintNumber,
      trackingUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/track?complaint=${complaintNumber}`,
      timestamp: new Date().toISOString(),
    };

    const qrString = JSON.stringify(qrData);

    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 200,
      margin: 2,
      color: {
        dark: "#28a745",
        light: "#FFFFFF",
      },
    });

    return {
      dataURL: qrCodeDataURL,
      data: qrData,
    };
  } catch (error) {
    console.error("Error generating tracking QR code:", error);
    throw error;
  }
};

// Parse QR code data
const parseQRData = (qrString) => {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    console.error("Error parsing QR code data:", error);
    return null;
  }
};

// Generate QR code for specific location (for posting around the city)
const generateLocationQR = async (locationData) => {
  try {
    // Get the deployed URL from environment, fallback to localhost for development
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // Create direct URL that redirects to complaint page with location and ward pre-filled
    // This URL will be encoded in the QR code so scanning directly redirects
    const complaintUrl = `${frontendUrl}/submit?location=${encodeURIComponent(
      locationData.name
    )}&ward=${locationData.wardNumber}`;

    // Also store metadata for reference
    const qrData = {
      type: "location_complaint",
      location: locationData.name,
      wardNumber: locationData.wardNumber,
      coordinates: locationData.coordinates,
      timestamp: new Date().toISOString(),
      complaintUrl: complaintUrl,
    };

    // Encode the direct URL in QR code (not JSON) so scanning redirects immediately
    // This allows QR scanners to directly open the complaint page
    const qrString = complaintUrl;

    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 400,
      margin: 3,
      color: {
        dark: "#667eea",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });

    // Save as file for printing
    const qrDir = path.join(__dirname, "../uploads/qr-codes/locations");
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const qrFileName = `location-${locationData.name.replace(
      /\s+/g,
      "-"
    )}-ward-${locationData.wardNumber}.png`;
    const qrFilePath = path.join(qrDir, qrFileName);

    await QRCode.toFile(qrFilePath, qrString, {
      width: 400,
      margin: 3,
      color: {
        dark: "#667eea",
        light: "#FFFFFF",
      },
    });

    return {
      dataURL: qrCodeDataURL,
      fileName: qrFileName,
      filePath: qrFilePath,
      data: qrData,
      url: complaintUrl, // The URL encoded in the QR code
    };
  } catch (error) {
    console.error("Error generating location QR code:", error);
    throw error;
  }
};

module.exports = {
  generateComplaintQR,
  generateQuickComplaintQR,
  generateTrackingQR,
  generateLocationQR,
  parseQRData,
};

import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner'; // <-- default import

const QRCodeScanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (videoRef.current) {
      startScanner();
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = async () => {
    try {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          onScan(result.data);
          qrScanner.stop();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current = qrScanner;

      await qrScanner.start();
      setHasPermission(true);
    } catch (error) {
      console.error('QR Scanner error:', error);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const handleManualInput = () => {
    const qrData = prompt('Enter QR code data manually:');
    if (qrData) {
      onScan(qrData);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Scan QR Code</h3>

        <div style={{
          width: '100%',
          maxWidth: '300px',
          margin: '0 auto 1rem auto',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#000'
        }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: 'auto',
              display: hasPermission ? 'block' : 'none'
            }}
          />
          {!hasPermission && !error && (
            <div style={{
              padding: '2rem',
              color: '#666',
              background: '#f8f9fa'
            }}>
              Loading camera...
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <p style={{ marginBottom: '1rem', color: '#666' }}>
          Point your camera at a QR code to scan it
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={handleManualInput}
            style={{ padding: '0.5rem 1rem' }}
          >
            Manual Input
          </button>
          <button
            className="btn btn-danger"
            onClick={onClose}
            style={{ padding: '0.5rem 1rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;











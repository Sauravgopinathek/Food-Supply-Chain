// frontend/src/components/LoadingSpinner.js
import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="text-center">
        <Spinner animation="border" variant="primary" style={{ width: '3.5rem', height: '3.5rem' }} className="mb-3" />
        <div style={{ fontSize: '1.05rem', color: '#6c757d' }}>{message}</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;

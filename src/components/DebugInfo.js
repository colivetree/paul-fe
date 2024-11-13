import React from 'react';

const DebugInfo = () => {
  return (
    <div style={{ padding: '20px', background: '#f5f5f5', margin: '20px' }}>
      <h3>Debug Information</h3>
      <pre>
        {JSON.stringify({
          NODE_ENV: process.env.NODE_ENV,
          API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
          // Add other relevant env variables
        }, null, 2)}
      </pre>
    </div>
  );
};

export default DebugInfo; 
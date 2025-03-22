import React from 'react';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import { useGoogleAuth } from './GoogleAuthProvider';
import GoogleIcon from '@mui/icons-material/Google';

/**
 * GoogleAuthButton - A button to connect/disconnect to Google
 */
const GoogleAuthButton = ({ variant = 'contained', size = 'medium', fullWidth = false }) => {
  const { isConnected, userInfo, loading, error, connect, disconnect } = useGoogleAuth();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <Box>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        onClick={handleClick}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <GoogleIcon />}
        color={isConnected ? "success" : "primary"}
        sx={{ textTransform: 'none' }}
      >
        {loading ? 'Processing...' : isConnected ? 'Connected to Google' : 'Connect to Google'}
      </Button>
      
      {isConnected && userInfo && (
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Connected as {userInfo.name} ({userInfo.email})
        </Typography>
      )}
      
      {error && (
        <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default GoogleAuthButton; 
import React, { createContext, useState, useEffect, useContext } from 'react';
import { checkGoogleConnection, getGoogleAuthUrl, revokeGoogleToken } from '../../services/googleApi';
import { useUser, getCurrentUserId } from '../../services/auth/useUser';

// Create context
export const GoogleAuthContext = createContext(null);

// Provider component
export const GoogleAuthProvider = ({ children }) => {
  const { userId, loading: userLoading } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check connection status on mount and when userId changes
  useEffect(() => {
    const checkConnection = async () => {
      // Don't proceed if user is still loading
      if (userLoading || !userId) return;
      
      try {
        setLoading(true);
        const response = await checkGoogleConnection(userId);
        
        setIsConnected(response.connected);
        if (response.connected) {
          setUserInfo({
            name: response.name,
            email: response.email,
            googleUserId: response.google_user_id
          });
        }
      } catch (err) {
        console.error('Error checking Google connection:', err);
        setError('Failed to check Google connection status');
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [userId, userLoading]);

  // Initiate connection to Google
  const connect = async () => {
    // Don't proceed if user is not loaded yet
    if (userLoading || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await getGoogleAuthUrl(userId);
      
      // Redirect to Google Auth
      window.location.href = response.auth_url;
    } catch (err) {
      console.error('Error connecting to Google:', err);
      setError('Failed to initiate Google connection');
      setLoading(false);
    }
  };

  // Disconnect from Google
  const disconnect = async () => {
    // Don't proceed if user is not loaded yet
    if (userLoading || !userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await revokeGoogleToken(userId);
      
      setIsConnected(false);
      setUserInfo(null);
    } catch (err) {
      console.error('Error disconnecting from Google:', err);
      setError('Failed to disconnect from Google');
    } finally {
      setLoading(false);
    }
  };

  // Handle auth callback
  const handleCallback = (code, state) => {
    // This function will be called after Google redirects back to the app
    // The actual OAuth token exchange happens on the backend
    setLoading(true);
    
    // The backend will handle the token exchange via the callback endpoint
    // After that completes, we should check the connection status again
    setTimeout(() => {
      const checkConnection = async () => {
        try {
          // Use the current user ID which should match the state param
          const currentUserId = getCurrentUserId();
          const response = await checkGoogleConnection(currentUserId);
          
          setIsConnected(response.connected);
          if (response.connected) {
            setUserInfo({
              name: response.name,
              email: response.email,
              googleUserId: response.google_user_id
            });
          }
        } catch (err) {
          console.error('Error checking Google connection after callback:', err);
          setError('Failed to complete Google connection');
          setIsConnected(false);
        } finally {
          setLoading(false);
        }
      };
      
      checkConnection();
    }, 1000); // Give the backend a second to process the callback
  };

  const value = {
    userId,
    isConnected,
    userInfo,
    loading: loading || userLoading,
    error,
    connect,
    disconnect,
    handleCallback
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

// Custom hook for using the Google auth context
export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (context === null) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
}; 
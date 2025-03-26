import React, { createContext, useState, useEffect, useContext } from 'react';
import { checkGoogleConnection, getGoogleAuthUrl, revokeGoogleToken } from '../../services/googleApi';
import { useUser } from '../../services/auth/useUser';

// Create context
export const GoogleAuthContext = createContext(null);

// Provider component
export const GoogleAuthProvider = ({ children }) => {
  const { userId, loading: userLoading } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [justConnected, setJustConnected] = useState(false);

  // Check if we're returning from the Google auth callback
  useEffect(() => {
    const url = new URL(window.location.href);
    
    // Check if we're on the callback route or have just been redirected from it
    if (url.pathname === '/google-auth-callback' || sessionStorage.getItem('googleAuthRedirect')) {
      const searchParams = url.pathname === '/google-auth-callback' 
        ? new URLSearchParams(url.search)
        : new URLSearchParams(sessionStorage.getItem('googleAuthRedirect') || '');
      
      const connected = searchParams.get('connected') === 'true';
      const error = searchParams.get('error');
      
      if (error) {
        console.error('Google auth error:', error);
        setError(error);
        setIsConnected(false);
      } else if (connected) {
        console.log('Google auth successful, user is connected');
        setIsConnected(true);
        setUserInfo({
          name: searchParams.get('name'),
          email: searchParams.get('email'),
          googleUserId: searchParams.get('google_user_id')
        });
        setError(null);
        setJustConnected(true);
      }
      
      // Clear the redirect state
      sessionStorage.removeItem('googleAuthRedirect');
      
      // Redirect back to the main page if still on callback page
      if (url.pathname === '/google-auth-callback') {
        // Store params in session storage for after redirect
        sessionStorage.setItem('googleAuthRedirect', url.search);
        window.location.href = '/';
      }
    }
  }, []);

  // Check connection status on mount and when userId changes
  useEffect(() => {
    const checkConnection = async () => {
      // Don't proceed if user is still loading
      if (userLoading || !userId) return;
      
      try {
        setLoading(true);
        console.log('Checking Google connection status for user:', userId);
        const response = await checkGoogleConnection(userId);
        console.log('Google connection status:', response);
        
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

    // Only run if we haven't just connected (to avoid duplicate API calls)
    if (!justConnected) {
      checkConnection();
    } else {
      setJustConnected(false);
      setLoading(false);
    }
  }, [userId, userLoading, justConnected]);

  const connect = async () => {
    if (!userId) {
      setError('User ID not available');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getGoogleAuthUrl(userId);
      // Extract auth_url from the response
      window.location.href = response.auth_url;
    } catch (err) {
      console.error('Error starting Google auth:', err);
      setError('Failed to start Google authentication');
      setLoading(false);
    }
  };

  const disconnect = async () => {
    if (!userId) return;

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

  const value = {
    userId,
    isConnected,
    userInfo,
    loading: loading || userLoading,
    error,
    connect,
    disconnect
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
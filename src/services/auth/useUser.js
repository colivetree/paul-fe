import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Custom hook for user management
 * 
 * Since we don't have a formal authentication system yet, this hook
 * provides a simple user ID management approach using localStorage.
 * This should be replaced with proper authentication in the future.
 */
export const useUser = () => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user ID from local storage or create a new one
    const getUserId = () => {
      let storedUserId = localStorage.getItem('userId');
      
      // If no user ID exists, create one
      if (!storedUserId) {
        storedUserId = uuidv4();
        localStorage.setItem('userId', storedUserId);
      }
      
      setUserId(storedUserId);
      setLoading(false);
    };

    getUserId();
  }, []);

  // Function to clear user ID (logout)
  const clearUserId = () => {
    localStorage.removeItem('userId');
    setUserId(null);
  };

  // Function to set a new user ID
  const setNewUserId = (newId) => {
    localStorage.setItem('userId', newId);
    setUserId(newId);
  };

  return { userId, loading, clearUserId, setNewUserId };
};

/**
 * Utility function to get the current user ID synchronously
 * Use this when you can't use the hook (outside of components)
 */
export const getCurrentUserId = () => {
  let storedUserId = localStorage.getItem('userId');
  
  // If no user ID exists, create one
  if (!storedUserId) {
    storedUserId = uuidv4();
    localStorage.setItem('userId', storedUserId);
  }
  
  return storedUserId;
}; 
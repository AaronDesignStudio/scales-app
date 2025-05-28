'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export const useNavigationLoading = (options = {}) => {
  const {
    defaultMessage = "Loading...",
    minLoadingTime = 500, // Minimum time to show loading (prevents flash)
    maxLoadingTime = 10000 // Maximum time before auto-hide
  } = options;

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(defaultMessage);
  
  const loadingStartTime = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const minTimeoutRef = useRef(null);

  const startLoading = useCallback((message = defaultMessage) => {
    setLoadingMessage(message);
    setIsLoading(true);
    loadingStartTime.current = Date.now();

    // Clear any existing timeouts
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    if (minTimeoutRef.current) {
      clearTimeout(minTimeoutRef.current);
    }

    // Auto-hide after max time
    loadingTimeoutRef.current = setTimeout(() => {
      stopLoading();
    }, maxLoadingTime);
  }, [defaultMessage, maxLoadingTime]);

  const stopLoading = useCallback(() => {
    const elapsed = loadingStartTime.current ? Date.now() - loadingStartTime.current : 0;
    const remainingMinTime = Math.max(0, minLoadingTime - elapsed);

    const doStopLoading = () => {
      setIsLoading(false);
      setLoadingMessage(defaultMessage);
      
      // Clear timeouts
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      if (minTimeoutRef.current) {
        clearTimeout(minTimeoutRef.current);
        minTimeoutRef.current = null;
      }
      
      loadingStartTime.current = null;
    };

    if (remainingMinTime > 0) {
      // Wait for minimum time before stopping
      minTimeoutRef.current = setTimeout(doStopLoading, remainingMinTime);
    } else {
      doStopLoading();
    }
  }, [minLoadingTime, defaultMessage]);

  const navigateWithLoading = useCallback(async (path, message) => {
    try {
      startLoading(message || `Navigating to ${path}...`);
      
      // Add a small delay to ensure loading state is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      router.push(path);
      
      // Stop loading after navigation (will be handled by the new page)
      // We use a longer timeout to account for page load time
      setTimeout(() => {
        stopLoading();
      }, 1000);
      
    } catch (error) {
      console.error('Navigation error:', error);
      stopLoading();
    }
  }, [router, startLoading, stopLoading]);

  const navigateBack = useCallback((message = "Going back...") => {
    startLoading(message);
    
    setTimeout(() => {
      router.back();
      stopLoading();
    }, 100);
  }, [router, startLoading, stopLoading]);

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    navigateWithLoading,
    navigateBack
  };
};

export default useNavigationLoading; 
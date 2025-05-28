'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage content readiness states
 * Ensures content is only shown when all required data is loaded
 */
export const useContentReady = (dependencies = [], options = {}) => {
  const {
    minLoadingTime = 300, // Minimum time to show loading (prevents flash)
    initialLoading = true,
    onReady = null,
    onError = null
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStartTime, setLoadingStartTime] = useState(null);

  // Track loading states for multiple dependencies
  const [dependencyStates, setDependencyStates] = useState(
    dependencies.reduce((acc, dep) => ({ ...acc, [dep]: false }), {})
  );

  // Start loading
  const startLoading = useCallback((resetError = true) => {
    if (resetError) setError(null);
    setIsLoading(true);
    setIsReady(false);
    setLoadingStartTime(Date.now());
  }, []);

  // Mark a dependency as ready
  const markDependencyReady = useCallback((dependencyName) => {
    setDependencyStates(prev => ({
      ...prev,
      [dependencyName]: true
    }));
  }, []);

  // Mark a dependency as not ready
  const markDependencyNotReady = useCallback((dependencyName) => {
    setDependencyStates(prev => ({
      ...prev,
      [dependencyName]: false
    }));
  }, []);

  // Set error state
  const setContentError = useCallback((errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
    setIsReady(false);
    onError?.(errorMessage);
  }, [onError]);

  // Check if all dependencies are ready
  const allDependenciesReady = useCallback(() => {
    if (dependencies.length === 0) return true;
    return dependencies.every(dep => dependencyStates[dep] === true);
  }, [dependencies, dependencyStates]);

  // Effect to handle readiness when all dependencies are loaded
  useEffect(() => {
    if (!isLoading || error) return;

    if (allDependenciesReady()) {
      const elapsed = loadingStartTime ? Date.now() - loadingStartTime : 0;
      const remainingMinTime = Math.max(0, minLoadingTime - elapsed);

      const finishLoading = () => {
        setIsLoading(false);
        setIsReady(true);
        onReady?.();
      };

      if (remainingMinTime > 0) {
        // Wait for minimum time before finishing
        const timer = setTimeout(finishLoading, remainingMinTime);
        return () => clearTimeout(timer);
      } else {
        finishLoading();
      }
    }
  }, [allDependenciesReady, isLoading, error, loadingStartTime, minLoadingTime, onReady]);

  // Reset function
  const reset = useCallback(() => {
    setIsLoading(initialLoading);
    setIsReady(false);
    setError(null);
    setLoadingStartTime(null);
    setDependencyStates(
      dependencies.reduce((acc, dep) => ({ ...acc, [dep]: false }), {})
    );
  }, [dependencies, initialLoading]);

  return {
    isLoading,
    isReady,
    error,
    dependencyStates,
    startLoading,
    markDependencyReady,
    markDependencyNotReady,
    setContentError,
    allDependenciesReady: allDependenciesReady(),
    reset
  };
};

/**
 * Simplified version for basic loading states
 */
export const useSimpleContentReady = (options = {}) => {
  const {
    minLoadingTime = 300,
    initialLoading = true
  } = options;

  const [isLoading, setIsLoading] = useState(initialLoading);
  const [isReady, setIsReady] = useState(!initialLoading);
  const [error, setError] = useState(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setIsReady(false);
    setError(null);
  }, []);

  const finishLoading = useCallback(() => {
    const finishNow = () => {
      setIsLoading(false);
      setIsReady(true);
    };

    if (minLoadingTime > 0) {
      setTimeout(finishNow, minLoadingTime);
    } else {
      finishNow();
    }
  }, [minLoadingTime]);

  const setContentError = useCallback((errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
    setIsReady(false);
  }, []);

  return {
    isLoading,
    isReady,
    error,
    startLoading,
    finishLoading,
    setContentError
  };
};

export default useContentReady; 
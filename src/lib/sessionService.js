// Client-side service for session management using SQLite backend

export const SessionManager = {
  // Active requests map for cancellation
  activeRequests: new Map(),

  // Cancel a specific request type
  cancelRequest: (requestType) => {
    const controller = SessionManager.activeRequests.get(requestType);
    if (controller) {
      controller.abort();
      SessionManager.activeRequests.delete(requestType);
    }
  },

  // Cancel all active requests
  cancelAllRequests: () => {
    SessionManager.activeRequests.forEach((controller) => {
      controller.abort();
    });
    SessionManager.activeRequests.clear();
  },

  // Helper function to make requests with timeout and cancellation
  makeRequest: async (url, requestType, options = {}) => {
    // Cancel any existing request of this type
    SessionManager.cancelRequest(requestType);
    
    const controller = new AbortController();
    SessionManager.activeRequests.set(requestType, controller);
    
    const timeoutId = setTimeout(() => {
      controller.abort();
      SessionManager.activeRequests.delete(requestType);
    }, options.timeout || 10000);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      clearTimeout(timeoutId);
      SessionManager.activeRequests.delete(requestType);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Request failed for ${requestType}: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      SessionManager.activeRequests.delete(requestType);
      
      if (error.name === 'AbortError') {
        console.log(`Request cancelled for ${requestType}`);
        throw new Error('Request cancelled');
      }
      
      throw error;
    }
  },

  // Save a new practice session
  saveSession: async (sessionData) => {
    try {
      const response = await SessionManager.makeRequest('/api/sessions', 'saveSession', {
        method: 'POST',
        body: JSON.stringify({ action: 'save', sessionData }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error saving session:', error.message);
      return null;
    }
  },

  // Save a unique practice session (removes duplicates for same exercise)
  saveUniqueSession: async (sessionData) => {
    try {
      const response = await SessionManager.makeRequest('/api/sessions', 'saveUniqueSession', {
        method: 'POST',
        body: JSON.stringify({ action: 'saveUnique', sessionData }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error saving unique session:', error.message);
      return null;
    }
  },

  // Get all sessions from database
  getAllSessions: async () => {
    try {
      const response = await SessionManager.makeRequest('/api/sessions?action=all', 'getAllSessions');
      return await response.json();
    } catch (error) {
      console.error('Error loading sessions:', error.message);
      return [];
    }
  },

  // Get recent sessions (last 10)
  getRecentSessions: async (limit = 10) => {
    try {
      console.log(`Fetching recent sessions (limit: ${limit})`);
      
      const response = await SessionManager.makeRequest(
        `/api/sessions?action=recent&limit=${limit}`, 
        'getRecentSessions'
      );
      
      const sessions = await response.json();
      console.log(`Successfully fetched ${sessions.length} recent sessions`);
      return sessions;
    } catch (error) {
      if (error.message === 'Request cancelled') {
        console.log('Recent sessions request was cancelled');
        return [];
      }
      console.error('Error loading recent sessions:', error.message);
      return [];
    }
  },

  // Get last 20 sessions for "View All" modal
  getLast20Sessions: async () => {
    try {
      const response = await fetch('/api/sessions?action=recent&limit=20');
      
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  },

  // Get sessions for a specific scale
  getSessionsForScale: async (scaleName) => {
    try {
      const response = await fetch(`/api/sessions?action=forScale&scale=${encodeURIComponent(scaleName)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scale sessions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading scale sessions:', error);
      return [];
    }
  },

  // Get last 2 sessions for a specific scale (for modal display)
  getLastSessionsForScale: async (scaleName, limit = 2) => {
    try {
      const response = await fetch(`/api/sessions?action=lastForScale&scale=${encodeURIComponent(scaleName)}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch last scale sessions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading last scale sessions:', error);
      return [];
    }
  },

  // Clear all sessions (for testing/reset)
  clearAllSessions: async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear' }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear sessions');
      }

      console.log('All sessions cleared');
      return true;
    } catch (error) {
      console.error('Error clearing sessions:', error);
      return false;
    }
  },

  // Get practice stats
  getPracticeStats: async () => {
    try {
      const response = await fetch('/api/sessions?action=stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch practice stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading practice stats:', error);
      return {
        totalSessions: 0,
        todaySessions: 0,
        totalPracticeTime: 0,
        favoriteScale: null
      };
    }
  },

  // Check if a specific exercise has been practiced before
  hasExerciseBeenPracticed: async (scale, practiceType) => {
    try {
      const response = await fetch(`/api/sessions/exercise?action=hasBeenPracticed&scale=${encodeURIComponent(scale)}&practiceType=${encodeURIComponent(practiceType)}`);
      
      if (!response.ok) {
        throw new Error('Failed to check exercise');
      }

      const result = await response.json();
      return result.practiced;
    } catch (error) {
      console.error('Error checking exercise history:', error);
      return false;
    }
  },

  // Get all practiced exercise combinations for a specific scale
  getPracticedExercisesForScale: async (scale) => {
    try {
      const response = await fetch(`/api/sessions/exercise?action=practicedForScale&scale=${encodeURIComponent(scale)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch practiced exercises');
      }

      const result = await response.json();
      return result.exercises;
    } catch (error) {
      console.error('Error getting practiced exercises:', error);
      return [];
    }
  },

  // Get the best (highest) BPM for a specific exercise configuration
  getBestBPMForExercise: async (scale, practiceType, octaves) => {
    try {
      const response = await fetch(`/api/sessions/exercise?action=bestBPM&scale=${encodeURIComponent(scale)}&practiceType=${encodeURIComponent(practiceType)}&octaves=${octaves}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch best BPM');
      }

      const result = await response.json();
      return result.bestBPM;
    } catch (error) {
      console.error('Error getting best BPM:', error);
      return null;
    }
  },

  // Debug function to see what practice types are stored for a scale
  debugPracticeTypesForScale: async (scale) => {
    try {
      const response = await fetch(`/api/sessions/exercise?action=debug&scale=${encodeURIComponent(scale)}`);
      
      if (!response.ok) {
        throw new Error('Failed to debug practice types');
      }

      const result = await response.json();
      console.log(`Practice types stored for ${scale}:`, result.debugInfo);
      return result.debugInfo;
    } catch (error) {
      console.error('Error debugging practice types:', error);
      return [];
    }
  }
};

// Daily Practice Time Management
export const DailyPracticeManager = {
  // Get daily practice data
  getDailyPracticeData: async (date = null) => {
    try {
      const targetDate = date || new Date().toDateString();
      const response = await fetch(`/api/daily-practice?date=${encodeURIComponent(targetDate)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily practice data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading daily practice data:', error);
      return null;
    }
  },

  // Save daily practice data
  saveDailyPracticeData: async (practiceData) => {
    try {
      const response = await fetch('/api/daily-practice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          practiceData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save daily practice data');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error saving daily practice data:', error);
      return false;
    }
  },

  // Clear daily practice data
  clearDailyPracticeData: async () => {
    try {
      const response = await fetch('/api/daily-practice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clear' }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear daily practice data');
      }

      console.log('Daily practice data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing daily practice data:', error);
      return false;
    }
  }
}; 
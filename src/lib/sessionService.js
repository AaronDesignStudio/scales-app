// Client-side service for session management with localStorage fallback

// SessionManager - Handles practice time tracking with localStorage fallback
class SessionManagerClass {
  constructor() {
    this.dailyStorageKey = 'scales-daily-practice';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.activeRequests = new Map();
  }

  // Helper to check if we're in a static environment (like GitHub Pages)
  isStaticEnvironment() {
    return typeof window !== 'undefined' && !this.isDevelopment;
  }

  // Get today's practice time
  async getDailyPracticeTime() {
    try {
      // In static environments, use localStorage only
      if (this.isStaticEnvironment()) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const dailyData = JSON.parse(localStorage.getItem(this.dailyStorageKey) || '{}');
        return dailyData[today] || 0;
      }

      // Try API first in development
      const response = await fetch('/api/daily-practice');
      
      if (response.ok) {
        const data = await response.json();
        return data.totalTime || 0;
      }
      
      // Fallback to localStorage if API fails
      console.warn('Daily practice API failed, falling back to localStorage');
      const today = new Date().toISOString().split('T')[0];
      const dailyData = JSON.parse(localStorage.getItem(this.dailyStorageKey) || '{}');
      return dailyData[today] || 0;
      
    } catch (error) {
      console.warn('Error getting daily practice time, using localStorage:', error);
      const today = new Date().toISOString().split('T')[0];
      const dailyData = JSON.parse(localStorage.getItem(this.dailyStorageKey) || '{}');
      return dailyData[today] || 0;
    }
  }

  // Add practice time to today's total
  async addPracticeTime(seconds) {
    try {
      // In static environments, use localStorage only
      if (this.isStaticEnvironment()) {
        const today = new Date().toISOString().split('T')[0];
        const dailyData = JSON.parse(localStorage.getItem(this.dailyStorageKey) || '{}');
        
        dailyData[today] = (dailyData[today] || 0) + seconds;
        
        // Clean up old entries (keep only last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
        
        Object.keys(dailyData).forEach(date => {
          if (date < cutoffDate) {
            delete dailyData[date];
          }
        });
        
        localStorage.setItem(this.dailyStorageKey, JSON.stringify(dailyData));
        return dailyData[today];
      }

      // Try API first in development
      const response = await fetch('/api/daily-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.totalTime;
      }
      
      // Fallback to localStorage if API fails
      console.warn('Daily practice API failed, falling back to localStorage');
      const today = new Date().toISOString().split('T')[0];
      const dailyData = JSON.parse(localStorage.getItem(this.dailyStorageKey) || '{}');
      
      dailyData[today] = (dailyData[today] || 0) + seconds;
      
      // Clean up old entries
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
      
      Object.keys(dailyData).forEach(date => {
        if (date < cutoffDate) {
          delete dailyData[date];
        }
      });
      
      localStorage.setItem(this.dailyStorageKey, JSON.stringify(dailyData));
      return dailyData[today];
      
    } catch (error) {
      console.warn('Error adding practice time, using localStorage:', error);
      const today = new Date().toISOString().split('T')[0];
      const dailyData = JSON.parse(localStorage.getItem(this.dailyStorageKey) || '{}');
      
      dailyData[today] = (dailyData[today] || 0) + seconds;
      localStorage.setItem(this.dailyStorageKey, JSON.stringify(dailyData));
      return dailyData[today];
    }
  }

  // Cancel a specific request type
  cancelRequest(requestType) {
    const controller = this.activeRequests.get(requestType);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestType);
    }
  }

  // Cancel all active requests
  cancelAllRequests() {
    this.activeRequests.forEach((controller) => {
      controller.abort();
    });
    this.activeRequests.clear();
  }

  // Get recent sessions (last 10) - in static mode returns empty array
  async getRecentSessions(limit = 10) {
    try {
      // In static environments, return empty array (no session history)
      if (this.isStaticEnvironment()) {
        return [];
      }

      console.log(`Fetching recent sessions (limit: ${limit})`);
      
      // In development, try to fetch from API but return empty on failure
      const response = await fetch(`/api/sessions?action=recent&limit=${limit}`);
      
      if (response.ok) {
        const sessions = await response.json();
        console.log(`Successfully fetched ${sessions.length} recent sessions`);
        return sessions;
      }
      
      console.warn('Failed to fetch recent sessions');
      return [];
    } catch (error) {
      console.error('Error loading recent sessions:', error.message);
      return [];
    }
  }

  // Get practiced exercises for a specific scale - in static mode returns empty array
  async getPracticedExercisesForScale(scaleName) {
    try {
      // In static environments, return empty array (no session history)
      if (this.isStaticEnvironment()) {
        return [];
      }

      console.log(`Fetching practiced exercises for scale: ${scaleName}`);
      
      // In development, try to fetch from API but return empty on failure
      const response = await fetch(`/api/sessions?action=exercisesForScale&scale=${encodeURIComponent(scaleName)}`);
      
      if (response.ok) {
        const exercises = await response.json();
        console.log(`Successfully fetched ${exercises.length} exercises for ${scaleName}`);
        return exercises;
      }
      
      console.warn(`Failed to fetch exercises for scale: ${scaleName}`);
      return [];
    } catch (error) {
      console.error(`Error loading exercises for scale ${scaleName}:`, error.message);
      return [];
    }
  }

  // Get last 20 sessions - in static mode returns empty array
  async getLast20Sessions() {
    try {
      // In static environments, return empty array (no session history)
      if (this.isStaticEnvironment()) {
        return [];
      }

      console.log('Fetching last 20 sessions');
      
      // In development, try to fetch from API but return empty on failure
      const response = await fetch('/api/sessions?action=recent&limit=20');
      
      if (response.ok) {
        const sessions = await response.json();
        console.log(`Successfully fetched ${sessions.length} sessions`);
        return sessions;
      }
      
      console.warn('Failed to fetch last 20 sessions');
      return [];
    } catch (error) {
      console.error('Error loading last 20 sessions:', error.message);
      return [];
    }
  }

  // Get last sessions for a specific scale - in static mode returns empty array
  async getLastSessionsForScale(scaleName) {
    try {
      // In static environments, return empty array (no session history)
      if (this.isStaticEnvironment()) {
        return [];
      }

      console.log(`Fetching last sessions for scale: ${scaleName}`);
      
      // In development, try to fetch from API but return empty on failure
      const response = await fetch(`/api/sessions?action=forScale&scale=${encodeURIComponent(scaleName)}`);
      
      if (response.ok) {
        const sessions = await response.json();
        console.log(`Successfully fetched ${sessions.length} sessions for ${scaleName}`);
        return sessions;
      }
      
      console.warn(`Failed to fetch sessions for scale: ${scaleName}`);
      return [];
    } catch (error) {
      console.error(`Error loading sessions for scale ${scaleName}:`, error.message);
      return [];
    }
  }

  // Save a practice session - in static mode does nothing
  async saveSession(sessionData) {
    try {
      // In static environments, do nothing (no session persistence)
      if (this.isStaticEnvironment()) {
        console.log('Session save skipped in static environment:', sessionData);
        return { id: Date.now(), ...sessionData };
      }

      console.log('Saving session:', sessionData);
      
      // In development, try to save via API
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', sessionData }),
      });

      if (response.ok) {
        const savedSession = await response.json();
        console.log('Session saved successfully:', savedSession);
        return savedSession;
      }
      
      console.warn('Failed to save session via API');
      return { id: Date.now(), ...sessionData };
      
    } catch (error) {
      console.error('Error saving session:', error.message);
      return { id: Date.now(), ...sessionData };
    }
  }

  // Save a unique practice session (prevents duplicates) - in static mode does nothing
  async saveUniqueSession(sessionData) {
    try {
      // In static environments, do nothing (no session persistence)
      if (this.isStaticEnvironment()) {
        console.log('Unique session save skipped in static environment:', sessionData);
        return { id: Date.now(), ...sessionData };
      }

      console.log('Saving unique session:', sessionData);
      
      // In development, try to save via API
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveUnique', sessionData }),
      });

      if (response.ok) {
        const savedSession = await response.json();
        console.log('Unique session saved successfully:', savedSession);
        return savedSession;
      }
      
      console.warn('Failed to save unique session via API');
      return { id: Date.now(), ...sessionData };
      
    } catch (error) {
      console.error('Error saving unique session:', error.message);
      return { id: Date.now(), ...sessionData };
    }
  }

  // Get best BPM for a specific exercise - in static mode returns null
  async getBestBPMForExercise(scale, practiceType, octaves) {
    try {
      // In static environments, return null (no BPM tracking)
      if (this.isStaticEnvironment()) {
        return null;
      }

      console.log(`Fetching best BPM for ${scale} - ${practiceType} - ${octaves} octaves`);
      
      // In development, try to fetch from API
      const response = await fetch(`/api/sessions?action=bestBPM&scale=${encodeURIComponent(scale)}&type=${encodeURIComponent(practiceType)}&octaves=${octaves}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Best BPM for ${scale} - ${practiceType}: ${data.bestBPM}`);
        return data.bestBPM;
      }
      
      console.warn(`Failed to fetch best BPM for ${scale} - ${practiceType}`);
      return null;
    } catch (error) {
      console.error(`Error loading best BPM for ${scale} - ${practiceType}:`, error.message);
      return null;
    }
  }
}

export const SessionManager = new SessionManagerClass();

// DailyPracticeManager - Handles daily practice time tracking
class DailyPracticeManagerClass {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Helper to check if we're in a static environment (like GitHub Pages)
  isStaticEnvironment() {
    return typeof window !== 'undefined' && !this.isDevelopment;
  }

  // Get daily practice data
  async getDailyPracticeData(date = null) {
    try {
      // In static environments, use localStorage only
      if (this.isStaticEnvironment()) {
        const today = date || new Date().toDateString();
        const localStorageKey = `dailyPractice_${today}`;
        const localData = localStorage.getItem(localStorageKey);
        
        if (localData) {
          const parsedData = JSON.parse(localData);
          return {
            date: parsedData.date,
            total_time: parsedData.time,
            lastUpdated: parsedData.lastUpdated
          };
        }
        return null;
      }

      // Try API first in development
      const queryParam = date ? `?date=${encodeURIComponent(date)}` : '';
      const response = await fetch(`/api/daily-practice${queryParam}`);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      // Fallback to localStorage if API fails
      console.warn('Daily practice API failed, falling back to localStorage');
      const today = date || new Date().toDateString();
      const localStorageKey = `dailyPractice_${today}`;
      const localData = localStorage.getItem(localStorageKey);
      
      if (localData) {
        const parsedData = JSON.parse(localData);
        return {
          date: parsedData.date,
          total_time: parsedData.time,
          lastUpdated: parsedData.lastUpdated
        };
      }
      return null;
      
    } catch (error) {
      console.warn('Error getting daily practice data, using localStorage:', error);
      const today = date || new Date().toDateString();
      const localStorageKey = `dailyPractice_${today}`;
      const localData = localStorage.getItem(localStorageKey);
      
      if (localData) {
        const parsedData = JSON.parse(localData);
        return {
          date: parsedData.date,
          total_time: parsedData.time,
          lastUpdated: parsedData.lastUpdated
        };
      }
      return null;
    }
  }

  // Save daily practice data
  async saveDailyPracticeData(practiceData) {
    try {
      // In static environments, use localStorage only
      if (this.isStaticEnvironment()) {
        const localStorageKey = `dailyPractice_${practiceData.date}`;
        localStorage.setItem(localStorageKey, JSON.stringify(practiceData));
        
        // Clean up old entries (keep only last 7 days)
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('dailyPractice_')) {
            const keyDate = key.replace('dailyPractice_', '');
            const keyTime = new Date(keyDate).getTime();
            const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            if (keyTime < weekAgo) {
              localStorage.removeItem(key);
            }
          }
        }
        return true;
      }

      // Try API first in development
      const response = await fetch('/api/daily-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(practiceData),
      });

      if (response.ok) {
        return true;
      }
      
      // Fallback to localStorage if API fails
      console.warn('Daily practice API failed, falling back to localStorage');
      const localStorageKey = `dailyPractice_${practiceData.date}`;
      localStorage.setItem(localStorageKey, JSON.stringify(practiceData));
      return true;
      
    } catch (error) {
      console.warn('Error saving daily practice data, using localStorage:', error);
      const localStorageKey = `dailyPractice_${practiceData.date}`;
      localStorage.setItem(localStorageKey, JSON.stringify(practiceData));
      return true;
    }
  }
}

export const DailyPracticeManager = new DailyPracticeManagerClass(); 
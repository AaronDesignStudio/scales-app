// Client-side service for managing user's scale collection

// ScalesManager - Handles all scale-related operations with localStorage fallback
class ScalesManagerClass {
  constructor() {
    this.storageKey = 'scales-user-scales';
    this.practiceKey = 'scales-practice-data';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Helper to check if we're in a static environment (like GitHub Pages)
  isStaticEnvironment() {
    return typeof window !== 'undefined' && !this.isDevelopment;
  }

  // Get user scales with localStorage fallback
  async getUserScales() {
    try {
      // In static environments, use localStorage only
      if (this.isStaticEnvironment()) {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [];
      }

      // Try API first in development
      const response = await fetch('/api/scales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getUserScales' }),
      });

      if (response.ok) {
        const scales = await response.json();
        return scales;
      }
      
      // Fallback to localStorage if API fails
      console.warn('API failed, falling back to localStorage');
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
      
    } catch (error) {
      console.warn('Error fetching user scales, using localStorage:', error);
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    }
  }

  // Add a scale to user's collection
  async addScale(scale) {
    try {
      console.log('ScalesManager.addScale called with:', scale);
      
      // In static environments, use localStorage only
      if (this.isStaticEnvironment()) {
        const currentScales = await this.getUserScales();
        const exists = currentScales.some(s => s.name === scale.name);
        
        if (!exists) {
          const newScale = {
            id: Date.now(),
            name: scale.name,
            level: scale.level,
            sharps: scale.sharps || 0,
            flats: scale.flats || 0,
            created_at: new Date().toISOString()
          };
          
          const updatedScales = [...currentScales, newScale];
          localStorage.setItem(this.storageKey, JSON.stringify(updatedScales));
          return newScale;
        }
        return null; // Scale already exists
      }
      
      // Try API first in development
      const response = await fetch('/api/scales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'addScale', 
          scale: {
            name: scale.name,
            level: scale.level,
            sharps: scale.sharps,
            flats: scale.flats
          }
        }),
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        return data;
      }
      
      // Fallback to localStorage if API fails
      console.warn('API failed, falling back to localStorage');
      const currentScales = await this.getUserScales();
      const exists = currentScales.some(s => s.name === scale.name);
      
      if (!exists) {
        const newScale = {
          id: Date.now(),
          name: scale.name,
          level: scale.level,
          sharps: scale.sharps || 0,
          flats: scale.flats || 0,
          created_at: new Date().toISOString()
        };
        
        const updatedScales = [...currentScales, newScale];
        localStorage.setItem(this.storageKey, JSON.stringify(updatedScales));
        return newScale;
      }
      return null; // Scale already exists
      
    } catch (error) {
      console.error('Error adding scale:', error);
      throw new Error(`Failed to add scale: ${error.message}`);
    }
  }

  // Remove a scale from user's collection
  async removeScale(scaleId) {
    try {
      // In static environments, use localStorage only
      if (this.isStaticEnvironment()) {
        const currentScales = await this.getUserScales();
        const updatedScales = currentScales.filter(scale => scale.id !== scaleId);
        localStorage.setItem(this.storageKey, JSON.stringify(updatedScales));
        return true;
      }

      // Try API first in development
      const response = await fetch('/api/scales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeScale', scaleId }),
      });

      if (response.ok) {
        return true;
      }
      
      // Fallback to localStorage if API fails
      console.warn('API failed, falling back to localStorage');
      const currentScales = await this.getUserScales();
      const updatedScales = currentScales.filter(scale => scale.id !== scaleId);
      localStorage.setItem(this.storageKey, JSON.stringify(updatedScales));
      return true;
      
    } catch (error) {
      console.warn('Error removing scale, using localStorage:', error);
      const currentScales = await this.getUserScales();
      const updatedScales = currentScales.filter(scale => scale.id !== scaleId);
      localStorage.setItem(this.storageKey, JSON.stringify(updatedScales));
      return true;
    }
  }

  // Update practice data
  async updatePracticeData(scaleId, exerciseType, bpm) {
    try {
      // In static environments, use localStorage only
      if (this.isStaticEnvironment()) {
        const practiceData = JSON.parse(localStorage.getItem(this.practiceKey) || '{}');
        const key = `${scaleId}_${exerciseType}`;
        
        if (!practiceData[key] || practiceData[key] < bpm) {
          practiceData[key] = bpm;
          localStorage.setItem(this.practiceKey, JSON.stringify(practiceData));
        }
        
        return practiceData[key];
      }

      // Try API first in development
      const response = await fetch('/api/scales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updatePracticeData', 
          scaleId, 
          exerciseType, 
          bpm 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.bestBpm;
      }
      
      // Fallback to localStorage if API fails
      console.warn('API failed, falling back to localStorage');
      const practiceData = JSON.parse(localStorage.getItem(this.practiceKey) || '{}');
      const key = `${scaleId}_${exerciseType}`;
      
      if (!practiceData[key] || practiceData[key] < bpm) {
        practiceData[key] = bpm;
        localStorage.setItem(this.practiceKey, JSON.stringify(practiceData));
      }
      
      return practiceData[key];
      
    } catch (error) {
      console.warn('Error updating practice data, using localStorage:', error);
      const practiceData = JSON.parse(localStorage.getItem(this.practiceKey) || '{}');
      const key = `${scaleId}_${exerciseType}`;
      
      if (!practiceData[key] || practiceData[key] < bpm) {
        practiceData[key] = bpm;
        localStorage.setItem(this.practiceKey, JSON.stringify(practiceData));
      }
      
      return practiceData[key];
    }
  }

  // Get practice data
  async getPracticeData(scaleId, exerciseType) {
    try {
      // In static environments, use localStorage only
      if (this.isStaticEnvironment()) {
        const practiceData = JSON.parse(localStorage.getItem(this.practiceKey) || '{}');
        const key = `${scaleId}_${exerciseType}`;
        return practiceData[key] || 0;
      }

      // Try API first in development
      const response = await fetch('/api/scales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'getPracticeData', 
          scaleId, 
          exerciseType 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.bestBpm || 0;
      }
      
      // Fallback to localStorage if API fails
      console.warn('API failed, falling back to localStorage');
      const practiceData = JSON.parse(localStorage.getItem(this.practiceKey) || '{}');
      const key = `${scaleId}_${exerciseType}`;
      return practiceData[key] || 0;
      
    } catch (error) {
      console.warn('Error getting practice data, using localStorage:', error);
      const practiceData = JSON.parse(localStorage.getItem(this.practiceKey) || '{}');
      const key = `${scaleId}_${exerciseType}`;
      return practiceData[key] || 0;
    }
  }

  // Initialize user's collection with default scales
  async initializeDefaultScales() {
    try {
      const response = await fetch('/api/scales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'initializeDefaults' }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize default scales');
      }

      return await response.json();
    } catch (error) {
      console.error('Error initializing default scales:', error);
      return null;
    }
  }

  // Reset collection to defaults
  async resetToDefaults() {
    try {
      const response = await fetch('/api/scales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'resetToDefaults' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset scales');
      }

      return await response.json();
    } catch (error) {
      console.error('Error resetting scales:', error);
      return null;
    }
  }
}

export const ScalesManager = new ScalesManagerClass(); 
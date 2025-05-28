// Client-side service for managing user's scale collection

export const ScalesManager = {
  // Get user's scale collection
  getUserScales: async () => {
    try {
      const response = await fetch('/api/scales?action=getCollection');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user scales');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error loading user scales:', error);
      return [];
    }
  },

  // Add a scale to user's collection
  addScale: async (scale) => {
    try {
      const response = await fetch('/api/scales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!response.ok) {
        throw new Error('Failed to add scale');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding scale:', error);
      return null;
    }
  },

  // Remove a scale from user's collection
  removeScale: async (scaleId) => {
    try {
      const response = await fetch('/api/scales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'removeScale', 
          scaleId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove scale');
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing scale:', error);
      return null;
    }
  },

  // Initialize user's collection with default scales
  initializeDefaultScales: async () => {
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
  },

  // Reset collection to defaults
  resetToDefaults: async () => {
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
}; 
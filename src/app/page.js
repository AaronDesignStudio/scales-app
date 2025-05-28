'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import ScaleCard from "@/components/scales/ScaleCard";
import SessionCard from "@/components/scales/SessionCard";
import ScalePracticeModal from "@/components/scales/ScalePracticeModal";
import AllSessionsModal from "@/components/scales/AllSessionsModal";
import { INITIAL_SCALES } from "@/data/scales";
import { SessionManager } from "@/lib/sessionService";

export default function Home() {
  const router = useRouter();
  
  // Use real sessions from SQLite database instead of localStorage
  const [recentSessions, setRecentSessions] = useState([]);
  const [selectedScale, setSelectedScale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for All Sessions Modal
  const [showAllSessionsModal, setShowAllSessionsModal] = useState(false);
  const [allSessions, setAllSessions] = useState([]);

  // Load real sessions on component mount
  useEffect(() => {
    const migrateLocalStorageData = async () => {
      try {
        // Check if there's localStorage data to migrate
        const localSessions = localStorage.getItem('practiceSessionsHistory');
        const localDailyPractice = localStorage.getItem('dailyPracticeData');
        
        if (localSessions || localDailyPractice) {
          console.log('Found localStorage data, migrating to SQLite...');
          
          const migrationData = {};
          
          if (localSessions) {
            try {
              migrationData.sessions = JSON.parse(localSessions);
            } catch (error) {
              console.error('Error parsing localStorage sessions:', error);
            }
          }
          
          if (localDailyPractice) {
            try {
              migrationData.dailyPractice = JSON.parse(localDailyPractice);
            } catch (error) {
              console.error('Error parsing localStorage daily practice:', error);
            }
          }
          
          // Migrate to SQLite
          const response = await fetch('/api/migrate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(migrationData),
          });
          
          const result = await response.json();
          
          if (result.success) {
            console.log('Migration successful:', result.message);
            
            // Clear localStorage after successful migration
            localStorage.removeItem('practiceSessionsHistory');
            localStorage.removeItem('dailyPracticeData');
            
            console.log('Cleared localStorage data after migration');
          } else {
            console.error('Migration failed:', result.error);
          }
        }
      } catch (error) {
        console.error('Error during migration:', error);
      }
    };

    const loadSessions = async () => {
      try {
        // Initialize database first
        await fetch('/api/init');
        
        // First, try to migrate any localStorage data
        await migrateLocalStorageData();
        
        // Then load sessions from SQLite
        const realSessions = await SessionManager.getRecentSessions();
        setRecentSessions(realSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        // No fallback to dummy data - just use empty array
        setRecentSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();

    // Set up an interval to refresh sessions every 30 seconds
    // This ensures the home screen updates when returning from practice
    const refreshInterval = setInterval(async () => {
      try {
        const realSessions = await SessionManager.getRecentSessions();
        setRecentSessions(realSessions);
      } catch (error) {
        console.error('Error refreshing sessions:', error);
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Refresh sessions when the page becomes visible (user returns from practice)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          const realSessions = await SessionManager.getRecentSessions();
          setRecentSessions(realSessions);
        } catch (error) {
          console.error('Error refreshing sessions:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAddScale = () => {
    // TODO: Implement add scale functionality
    console.log("Add scale clicked");
  };

  const handleScaleClick = async (scale) => {
    setSelectedScale(scale);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedScale(null);
  };

  const handleSelectOctave = (scale, practiceType, octaveOption) => {
    // Navigate to practice page with configuration
    const params = new URLSearchParams({
      scale: scale.name,
      type: practiceType.name,
      octaves: octaveOption.octaves.toString()
    });
    
    router.push(`/practice?${params.toString()}`);
  };

  const handleStartLastSession = (session) => {
    // Navigate to practice page with the session's configuration
    const params = new URLSearchParams({
      scale: session.scale,
      type: session.practice_type || session.practiceType || session.hand || session.pattern,
      octaves: session.octaves.toString()
    });
    
    router.push(`/practice?${params.toString()}`);
  };

  const handleStartSession = (session) => {
    // Navigate to practice page with the session's configuration
    const params = new URLSearchParams({
      scale: session.scale,
      type: session.practice_type || session.practiceType || session.hand || session.pattern,
      octaves: session.octaves.toString()
    });
    
    router.push(`/practice?${params.toString()}`);
  };

  const handleStartWorkout = () => {
    // TODO: Implement workout session functionality
    console.log("Start workout session");
  };

  const handleViewAllSessions = async () => {
    try {
      const sessions = await SessionManager.getLast20Sessions();
      setAllSessions(sessions);
      setShowAllSessionsModal(true);
    } catch (error) {
      console.error('Error loading all sessions:', error);
    }
  };

  const getLastSessionsForScale = async (scale) => {
    // Use real session data from database only
    try {
      return await SessionManager.getLastSessionsForScale(scale.name);
    } catch (error) {
      console.error('Error getting sessions for scale:', error);
      // Return empty array instead of fallback to dummy data
      return [];
    }
  };

  return (
    <div className="h-screen bg-gray-50 p-4 max-w-md mx-auto flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-6 pt-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">My Scales</h1>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleAddScale}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Scale
          </Button>
        </div>
      </div>

      {/* Scales List - Scrollable */}
      <div className="flex-1 min-h-0 mb-6">
        <div className="h-full overflow-y-auto space-y-3 pr-2">
          {INITIAL_SCALES.map((scale) => (
            <ScaleCard 
              key={scale.id} 
              scale={scale} 
              onClick={handleScaleClick}
            />
          ))}
        </div>
      </div>

      {/* Recent Sessions - Fixed at bottom */}
      {!isLoading && recentSessions.length > 0 && (
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
            <Button 
              variant="ghost" 
              onClick={handleViewAllSessions}
              className="text-blue-600 hover:text-blue-700 p-0"
            >
              View all
            </Button>
          </div>
          
          <div className="space-y-2">
            {recentSessions.slice(0, 3).map((session) => (
              <SessionCard 
                key={session.id} 
                session={{
                  ...session,
                  // Normalize field names for compatibility
                  practiceType: session.practice_type || session.practiceType,
                }} 
                onStart={handleStartSession}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state for new users */}
      {!isLoading && recentSessions.length === 0 && (
        <div className="mb-6 flex-shrink-0">
          <Card className="p-6 text-center bg-gray-50 border-dashed border-2 border-gray-300">
            <div className="text-gray-500">
              <div className="text-lg font-medium mb-2">No practice sessions yet</div>
              <div className="text-sm">Start practicing scales to see your recent sessions here!</div>
            </div>
          </Card>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
          </div>
          <Card className="p-6 text-center">
            <div className="text-gray-500">Loading sessions...</div>
          </Card>
        </div>
      )}

      {/* Workout Session - Fixed at bottom */}
      <Card className="bg-blue-600 text-white p-6 rounded-2xl flex-shrink-0">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Workout Session</h3>
          <p className="text-blue-100 mb-6">Practice random scales to improve your skills</p>
          <Button 
            onClick={handleStartWorkout}
            className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-8 py-3 font-medium"
          >
            Start Workout Session
          </Button>
        </div>
      </Card>

      {/* Scale Practice Modal */}
      <ScalePracticeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        scale={selectedScale}
        onSelectOctave={handleSelectOctave}
        onStartLastSession={handleStartLastSession}
      />

      {/* All Sessions Modal */}
      <AllSessionsModal
        isOpen={showAllSessionsModal}
        onClose={() => setShowAllSessionsModal(false)}
        sessions={allSessions.map(session => ({
          ...session,
          // Normalize field names for compatibility
          practiceType: session.practice_type || session.practiceType,
        }))}
        onStartSession={handleStartSession}
      />
    </div>
  );
}

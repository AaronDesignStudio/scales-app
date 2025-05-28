'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import ScaleCard from "@/components/scales/ScaleCard";
import SessionCard from "@/components/scales/SessionCard";
import ScalePracticeModal from "@/components/scales/ScalePracticeModal";
import { INITIAL_SCALES, SAMPLE_SESSIONS, SCALE_LAST_SESSIONS, USER_PROGRESS, SessionManager } from "@/data/scales";

export default function Home() {
  const router = useRouter();
  
  // Use real sessions from localStorage instead of sample data
  const [recentSessions, setRecentSessions] = useState([]);
  const [selectedScale, setSelectedScale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load real sessions on component mount
  useEffect(() => {
    const loadSessions = () => {
      try {
        const realSessions = SessionManager.getRecentSessions();
        setRecentSessions(realSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        // Fallback to sample sessions if there's an error
        setRecentSessions(SAMPLE_SESSIONS);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();

    // Set up an interval to refresh sessions every 30 seconds
    // This ensures the home screen updates when returning from practice
    const refreshInterval = setInterval(loadSessions, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Refresh sessions when the page becomes visible (user returns from practice)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const realSessions = SessionManager.getRecentSessions();
        setRecentSessions(realSessions);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAddScale = () => {
    // TODO: Implement add scale functionality
    console.log("Add scale clicked");
  };

  const handleScaleClick = (scale) => {
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
    // TODO: Start the specific last session
    console.log("Start last session:", session);
  };

  const handleStartSession = (session) => {
    // TODO: Implement start session functionality
    console.log("Start session:", session);
  };

  const handleStartWorkout = () => {
    // TODO: Implement workout session functionality
    console.log("Start workout session");
  };

  const handleViewAllSessions = () => {
    // TODO: Implement view all sessions functionality
    console.log("View all sessions");
  };

  const getLastSessionsForScale = (scale) => {
    // Use real session data instead of static data
    try {
      return SessionManager.getLastSessionsForScale(scale.name);
    } catch (error) {
      console.error('Error getting sessions for scale:', error);
      // Fallback to static data if there's an error
      return SCALE_LAST_SESSIONS[scale.name] || [];
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
          
          <div className="space-y-3">
            {recentSessions.slice(0, 3).map((session) => (
              <SessionCard 
                key={session.id} 
                session={session} 
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

      {/* Scale Practice Modal with both views */}
      <ScalePracticeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        scale={selectedScale}
        lastSessions={selectedScale ? getLastSessionsForScale(selectedScale) : []}
        userProgress={USER_PROGRESS}
        onSelectOctave={handleSelectOctave}
        onStartLastSession={handleStartLastSession}
      />
    </div>
  );
}

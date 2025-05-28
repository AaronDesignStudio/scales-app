'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import ScaleCard from "@/components/scales/ScaleCard";
import SessionCard from "@/components/scales/SessionCard";
import ScalePracticeModal from "@/components/scales/ScalePracticeModal";
import AllSessionsModal from "@/components/scales/AllSessionsModal";
import AddScaleModal from "@/components/scales/AddScaleModal";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { SectionLoading, InlineLoading } from "@/components/ui/loading-state";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";
import { SessionManager } from "@/lib/sessionService";
import { ScalesManager } from "@/lib/scalesService";
import ThemeToggle from "@/components/ui/theme-toggle";

export default function Home() {
  const router = useRouter();
  
  // Navigation loading hook
  const { isLoading: isNavigating, loadingMessage, navigateWithLoading } = useNavigationLoading({
    defaultMessage: "Loading...",
    minLoadingTime: 300
  });
  
  // Use real sessions from SQLite database instead of localStorage
  const [recentSessions, setRecentSessions] = useState([]);
  const [userScales, setUserScales] = useState([]);
  const [selectedScale, setSelectedScale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScalesLoading, setIsScalesLoading] = useState(true);

  // State for All Sessions Modal
  const [showAllSessionsModal, setShowAllSessionsModal] = useState(false);
  const [allSessions, setAllSessions] = useState([]);
  const [isLoadingAllSessions, setIsLoadingAllSessions] = useState(false);

  // State for Add Scale Modal
  const [showAddScaleModal, setShowAddScaleModal] = useState(false);

  // Add refs to track component state
  const fetchingRef = useRef(false);
  const refreshIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const migrateLocalStorageData = async () => {
      try {
        await fetch('/api/migrate', { method: 'POST' });
        console.log('Migration completed successfully');
      } catch (error) {
        console.error('Error during migration:', error);
      }
    };

    const initializeDatabase = async () => {
      try {
        // Initialize database
        await fetch('/api/init');
        
        // Initialize default scales if needed
        await ScalesManager.initializeDefaultScales();
        
        console.log('Database initialization completed');
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };

    const loadUserScales = async () => {
      if (!isMountedRef.current) return;
      
      try {
        console.log('Loading user scales...');
        const scales = await ScalesManager.getUserScales();
        
        if (isMountedRef.current) {
          setUserScales(scales);
        }
      } catch (error) {
        console.error('Error loading user scales:', error);
        if (isMountedRef.current) {
          setUserScales([]);
        }
      } finally {
        setIsScalesLoading(false);
      }
    };

    const loadSessions = async () => {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('Component unmounted, skipping load...');
        return;
      }
      
      // Prevent multiple simultaneous fetch calls
      if (fetchingRef.current) {
        console.log('Fetch already in progress, skipping...');
        return;
      }
      
      fetchingRef.current = true;
      
      try {
        console.log('Loading sessions...');
        
        // First, try to migrate any localStorage data
        await migrateLocalStorageData();
        
        // Check again if component is still mounted before setting state
        if (!isMountedRef.current) {
          console.log('Component unmounted during load, aborting...');
          return;
        }
        
        // Then load sessions from SQLite
        const realSessions = await SessionManager.getRecentSessions();
        console.log('Loaded sessions:', realSessions);
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setRecentSessions(realSessions);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setRecentSessions([]);
        }
      } finally {
        setIsLoading(false);
        fetchingRef.current = false;
      }
    };

    // Initialize everything
    const initialize = async () => {
      await initializeDatabase();
      await loadUserScales();
      await loadSessions();
    };

    initialize();

    // Set up an interval to refresh sessions every 30 seconds
    // This ensures the home screen updates when returning from practice
    refreshIntervalRef.current = setInterval(loadSessions, 30000);

    return () => {
      isMountedRef.current = false;
      
      // Cancel any pending session requests
      SessionManager.cancelAllRequests();
      
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  // Refresh sessions when the page becomes visible (user returns from practice)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // Only refresh if component is mounted, document is visible, and not already fetching
      if (!isMountedRef.current || document.hidden || fetchingRef.current) {
        return;
      }
      
      try {
        console.log('Page became visible, refreshing sessions...');
        fetchingRef.current = true;
        const realSessions = await SessionManager.getRecentSessions();
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setRecentSessions(realSessions);
        }
      } catch (error) {
        console.error('Error refreshing sessions on visibility change:', error);
      } finally {
        fetchingRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleAddScale = () => {
    setShowAddScaleModal(true);
  };

  const handleAddScaleToCollection = async (scale) => {
    try {
      const addedScale = await ScalesManager.addScale(scale);
      if (addedScale) {
        // Refresh user scales
        const updatedScales = await ScalesManager.getUserScales();
        setUserScales(updatedScales);
        console.log('Scale added successfully:', addedScale);
      }
    } catch (error) {
      console.error('Error adding scale:', error);
    }
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
    // Navigate to practice page with configuration using loading hook
    const params = new URLSearchParams({
      scale: scale.name,
      type: practiceType.name,
      octaves: octaveOption.octaves.toString()
    });
    
    navigateWithLoading(`/practice?${params.toString()}`, `Starting ${scale.name} practice...`);
  };

  const handleStartLastSession = (session) => {
    // Navigate to practice page with the session's configuration using loading hook
    const params = new URLSearchParams({
      scale: session.scale,
      type: session.practice_type || session.practiceType || session.hand || session.pattern,
      octaves: session.octaves.toString()
    });
    
    navigateWithLoading(`/practice?${params.toString()}`, `Resuming ${session.scale} practice...`);
  };

  const handleStartSession = (session) => {
    // Navigate to practice page with the session's configuration using loading hook
    const params = new URLSearchParams({
      scale: session.scale,
      type: session.practice_type || session.practiceType || session.hand || session.pattern,
      octaves: session.octaves.toString()
    });
    
    navigateWithLoading(`/practice?${params.toString()}`, `Starting ${session.scale} practice...`);
  };

  const handleStartWorkout = () => {
    // Navigate to workout session using loading hook
    navigateWithLoading('/workout', 'Starting workout session...');
  };

  const handleViewAllSessions = async () => {
    setIsLoadingAllSessions(true);
    try {
      const sessions = await SessionManager.getLast20Sessions();
      setAllSessions(sessions);
      setShowAllSessionsModal(true);
    } catch (error) {
      console.error('Error loading all sessions:', error);
    } finally {
      setIsLoadingAllSessions(false);
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
    <div className="h-screen bg-background p-4 max-w-md mx-auto flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-6 pt-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground">My Scales</h1>
        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
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
        {isScalesLoading ? (
          <SectionLoading message="Loading your scales..." />
        ) : (
          <div className="h-full overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {userScales.map((scale) => (
              <ScaleCard 
                key={scale.id} 
                scale={scale} 
                onClick={handleScaleClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Sessions - Fixed at bottom */}
      {!isLoading && recentSessions.filter(session => session.duration > 0).length > 0 && (
        <div className="mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Recent Sessions</h2>
            <Button 
              variant="ghost" 
              onClick={handleViewAllSessions}
              disabled={isLoadingAllSessions}
              className="text-blue-600 hover:text-blue-700 p-0 disabled:opacity-50"
            >
              {isLoadingAllSessions ? (
                <InlineLoading message="Loading..." />
              ) : (
                "View all"
              )}
            </Button>
          </div>
          
          <div className="space-y-2">
            {recentSessions.filter(session => session.duration > 0).slice(0, 3).map((session) => (
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

      {/* Loading state */}
      {isLoading && (
        <div className="mb-6 flex-shrink-0">
          <SectionLoading message="Loading recent sessions..." />
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
        isLoading={isLoadingAllSessions}
      />

      {/* Add Scale Modal */}
      <AddScaleModal
        isOpen={showAddScaleModal}
        onClose={() => setShowAddScaleModal(false)}
        userScales={userScales}
        onAddScale={handleAddScaleToCollection}
      />

      {/* Navigation Loading Overlay */}
      <LoadingOverlay 
        isVisible={isNavigating} 
        message={loadingMessage}
        variant="primary"
      />

      {/* Custom CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          /* Hide scrollbar for Chrome, Safari and Opera */
          -webkit-scrollbar {
            display: none;
          }
          
          /* Hide scrollbar for IE, Edge and Firefox */
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import ScaleCard from "@/components/scales/ScaleCard";
import SessionCard from "@/components/scales/SessionCard";
import ScalePracticeModal from "@/components/scales/ScalePracticeModal";
import { INITIAL_SCALES, SAMPLE_SESSIONS, SCALE_LAST_SESSIONS, USER_PROGRESS } from "@/data/scales";

export default function Home() {
  const router = useRouter();
  
  // For demo purposes, we show sample sessions. In a real app, this would be empty for new users
  const [recentSessions, setRecentSessions] = useState(SAMPLE_SESSIONS);
  const [selectedScale, setSelectedScale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
    return SCALE_LAST_SESSIONS[scale.name] || [];
  };

  return (
    <div className="h-screen bg-gray-50 p-4 max-w-md mx-auto flex flex-col">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between mb-6 pt-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">My Scales</h1>
        <Button 
          onClick={handleAddScale}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Scale
        </Button>
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
      {recentSessions.length > 0 && (
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

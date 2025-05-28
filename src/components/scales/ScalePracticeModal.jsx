import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, ChevronRight, ArrowLeft, Hand, Users, Zap, RotateCcw } from "lucide-react";
import { useState } from "react";
import { SessionManager } from "@/data/scales";

const PRACTICE_TYPES = [
  { id: 'right-hand', name: 'Right Hand', icon: Hand },
  { id: 'left-hand', name: 'Left Hand', icon: Hand },
  { id: 'two-hands', name: 'Two Hands', icon: Users },
  { id: 'contrary-motion', name: 'Contrary Motion', icon: RotateCcw },
  { id: 'staccato', name: 'Staccato', icon: Zap },
];

const OCTAVE_OPTIONS = [
  { octaves: 1, label: "1 Octave" },
  { octaves: 2, label: "2 Octaves" },
  { octaves: 3, label: "3 Octaves" },
  { octaves: 4, label: "4 Octaves" },
];

export default function ScalePracticeModal({ 
  isOpen, 
  onClose, 
  scale, 
  lastSessions = [],
  userProgress = {},
  onSelectPracticeType,
  onSelectOctave,
  onStartLastSession 
}) {
  const [currentView, setCurrentView] = useState('practice'); // 'practice' or 'octaves'
  const [selectedPracticeType, setSelectedPracticeType] = useState(null);

  if (!scale) return null;

  const handlePracticeTypeClick = (practiceType) => {
    setSelectedPracticeType(practiceType);
    setCurrentView('octaves');
  };

  const handleBackToPractice = () => {
    setCurrentView('practice');
    setSelectedPracticeType(null);
  };

  const handleOctaveClick = (octaveOption) => {
    onSelectOctave && onSelectOctave(scale, selectedPracticeType, octaveOption);
    handleClose();
  };

  const handleStartSession = (session) => {
    onStartLastSession && onStartLastSession(session);
    handleClose();
  };

  const handleClose = () => {
    setCurrentView('practice');
    setSelectedPracticeType(null);
    onClose();
  };

  const getBestBPM = (octaves) => {
    const progressKey = `${scale.name}-${selectedPracticeType?.id}-${octaves}`;
    return userProgress[progressKey]?.bestBPM || null;
  };

  const getModalTitle = () => {
    if (currentView === 'octaves' && selectedPracticeType) {
      return (
        <>
          {scale.name} / <span className="text-gray-500">{selectedPracticeType.name}</span>
        </>
      );
    }
    return scale.name;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md mx-4 p-0 gap-0 rounded-2xl">
        <DialogHeader className="p-6 pb-4 relative">
          {currentView === 'octaves' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToPractice}
              className="absolute left-4 top-6 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {currentView === 'practice' ? (
            <>
              {/* Practice Types Section */}
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="px-4 text-sm text-gray-500">Select practice type</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
                
                <div className="space-y-3">
                  {PRACTICE_TYPES.map((practiceType) => {
                    const IconComponent = practiceType.icon;
                    const hasBeenPracticed = SessionManager.hasExerciseBeenPracticed(scale.name, practiceType.name);
                    
                    return (
                      <button
                        key={practiceType.id}
                        onClick={() => handlePracticeTypeClick(practiceType)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 text-gray-600" />
                          <span className="text-lg font-medium text-gray-900">
                            {practiceType.name}
                          </span>
                          {hasBeenPracticed && (
                            <Eye className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Last Sessions Section */}
              {lastSessions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="px-4 text-sm text-gray-500">Last Sessions</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                  </div>
                  
                  <div className="space-y-3">
                    {lastSessions.slice(0, 2).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                          <p className="text-blue-600 font-medium text-sm">
                            {session.practiceType && `${session.practiceType}, `}
                            {session.hand && `${session.hand}, `}
                            {session.pattern && `${session.pattern}, `}
                            {session.octaves} Octaves, {session.bpm} BPM
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleStartSession(session)}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm"
                        >
                          Start
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Octaves Selection Section */
            <div className="mb-6">
              <div className="flex items-center justify-center mb-6">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">Select Octaves</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              
              <div className="space-y-3">
                {OCTAVE_OPTIONS.map((octaveOption) => {
                  const bestBPM = getBestBPM(octaveOption.octaves);
                  return (
                    <button
                      key={octaveOption.octaves}
                      onClick={() => handleOctaveClick(octaveOption)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                    >
                      <span className="text-lg font-medium text-gray-900">
                        {octaveOption.label}
                      </span>
                      {bestBPM && (
                        <span className="text-sm text-gray-600 font-medium">
                          Best: {bestBPM} BPM
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { SessionManager } from "@/lib/sessionService";
import { InlineLoading } from "@/components/ui/loading-state";

const PRACTICE_TYPES = [
  { id: 'right-hand', name: 'Right Hand' },
  { id: 'left-hand', name: 'Left Hand' },
  { id: 'two-hands', name: 'Two Hands' },
  { id: 'contrary-motion', name: 'Contrary Motion' },
  { id: 'staccato', name: 'Staccato' },
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
  onSelectPracticeType,
  onSelectOctave,
  onStartLastSession 
}) {
  const [currentView, setCurrentView] = useState('practice'); // 'practice' or 'octaves'
  const [selectedPracticeType, setSelectedPracticeType] = useState(null);
  const [practicedExercises, setPracticedExercises] = useState(new Set());
  const [bestBPMs, setBestBPMs] = useState({});
  const [lastSessions, setLastSessions] = useState([]);
  const [isLoadingScaleData, setIsLoadingScaleData] = useState(false);
  const [isLoadingBPMs, setIsLoadingBPMs] = useState(false);

  // Load practiced exercises and last sessions when scale changes
  useEffect(() => {
    const loadScaleData = async () => {
      if (!scale) return;
      
      setIsLoadingScaleData(true);
      try {
        // Load practiced exercises
        const exercises = await SessionManager.getPracticedExercisesForScale(scale.name);
        setPracticedExercises(new Set(exercises));

        // Load last sessions for this scale
        const sessions = await SessionManager.getLastSessionsForScale(scale.name, 2);
        setLastSessions(sessions);
      } catch (error) {
        console.error('Error loading scale data:', error);
        setPracticedExercises(new Set());
        setLastSessions([]);
      } finally {
        setIsLoadingScaleData(false);
      }
    };

    loadScaleData();
  }, [scale]);

  // Load best BPMs when practice type and scale change
  useEffect(() => {
    const loadBestBPMs = async () => {
      if (!scale || !selectedPracticeType) return;
      
      setIsLoadingBPMs(true);
      try {
        const bpmPromises = OCTAVE_OPTIONS.map(async (option) => {
          const bestBPM = await SessionManager.getBestBPMForExercise(
            scale.name, 
            selectedPracticeType.name, 
            option.octaves
          );
          return { octaves: option.octaves, bestBPM };
        });
        
        const results = await Promise.all(bpmPromises);
        const bpmMap = {};
        results.forEach(({ octaves, bestBPM }) => {
          if (bestBPM) {
            bpmMap[octaves] = bestBPM;
          }
        });
        
        setBestBPMs(bpmMap);
      } catch (error) {
        console.error('Error loading best BPMs:', error);
        setBestBPMs({});
      } finally {
        setIsLoadingBPMs(false);
      }
    };

    loadBestBPMs();
  }, [scale, selectedPracticeType]);

  // Early return after all hooks
  if (!scale) return null;

  const handlePracticeTypeClick = (practiceType) => {
    setSelectedPracticeType(practiceType);
    setCurrentView('octaves');
  };

  const handleBackToPractice = () => {
    setCurrentView('practice');
    setSelectedPracticeType(null);
    setBestBPMs({});
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
    setBestBPMs({});
    onClose();
  };

  const getBestBPM = (octaves) => {
    return bestBPMs[octaves] || null;
  };

  const getModalTitle = () => {
    if (currentView === 'octaves' && selectedPracticeType) {
      return (
        <>
          {scale.name} / <span className="text-muted-foreground">{selectedPracticeType.name}</span>
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
              className="absolute left-4 top-6 p-2 hover:bg-accent rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <DialogTitle className="text-2xl font-bold text-center text-foreground">
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {currentView === 'practice' ? (
            <>
              {/* Practice Types Section */}
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="px-4 text-sm text-muted-foreground">Select practice type</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>
                
                {isLoadingScaleData ? (
                  <InlineLoading message="Loading practice types..." />
                ) : (
                  <div className="space-y-3">
                    {PRACTICE_TYPES.map((practiceType) => {
                      const hasBeenPracticed = practicedExercises.has(practiceType.name);
                      
                      return (
                        <button
                          key={practiceType.id}
                          onClick={() => handlePracticeTypeClick(practiceType)}
                          className="w-full flex items-center justify-between p-4 bg-muted hover:bg-accent rounded-xl border border-border transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-medium text-foreground">
                              {practiceType.name}
                            </span>
                            {hasBeenPracticed && (
                              <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Last Sessions Section */}
              {!isLoadingScaleData && lastSessions.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="px-4 text-sm text-muted-foreground">Last Sessions</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  
                  <div className="space-y-3">
                    {lastSessions.slice(0, 2).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                        <div>
                          <p className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                            {session.practice_type && `${session.practice_type}, `}
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
                <div className="flex-1 h-px bg-border"></div>
                <span className="px-4 text-sm text-muted-foreground">Select Octaves</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              {isLoadingBPMs ? (
                <InlineLoading message="Loading best BPMs..." />
              ) : (
                <div className="space-y-3">
                  {OCTAVE_OPTIONS.map((octaveOption) => {
                    const bestBPM = getBestBPM(octaveOption.octaves);
                    return (
                      <button
                        key={octaveOption.octaves}
                        onClick={() => handleOctaveClick(octaveOption)}
                        className="w-full flex items-center justify-between p-4 bg-muted hover:bg-accent rounded-xl border border-border transition-colors"
                      >
                        <span className="text-lg font-medium text-foreground">
                          {octaveOption.label}
                        </span>
                        {bestBPM && (
                          <span className="text-sm text-muted-foreground font-medium">
                            Best: {bestBPM} BPM
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
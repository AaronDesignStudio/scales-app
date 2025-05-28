'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Shuffle } from "lucide-react";
import { PageLoading, SectionLoading } from "@/components/ui/loading-state";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { useNavigationLoading } from "@/hooks/useNavigationLoading";
import { INITIAL_SCALES } from "@/data/scales";
import ThemeToggle from "@/components/ui/theme-toggle";

const PRACTICE_TYPES = [
  'Right Hand',
  'Left Hand', 
  'Two Hands',
  'Contrary Motion',
  'Staccato'
];

const OCTAVE_OPTIONS = [1, 2, 3, 4];

export default function WorkoutPage() {
  const router = useRouter();
  
  // Navigation loading hook
  const { isLoading: isNavigating, loadingMessage, navigateWithLoading, navigateBack } = useNavigationLoading({
    defaultMessage: "Loading...",
    minLoadingTime: 300
  });

  // Loading and content states
  const [isLoading, setIsLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [exerciseQueue, setExerciseQueue] = useState([]);
  const [completedExercises, setCompletedExercises] = useState([]);

  // Initialize workout session
  useEffect(() => {
    const initializeWorkout = async () => {
      try {
        setIsLoading(true);
        
        // Simulate some initialization time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate random exercise queue
        const exercises = generateRandomExercises(5);
        setExerciseQueue(exercises);
        setCurrentExercise(exercises[0]);
        
      } catch (error) {
        console.error('Error initializing workout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeWorkout();
  }, []);

  const generateRandomExercises = (count) => {
    const exercises = [];
    for (let i = 0; i < count; i++) {
      const randomScale = INITIAL_SCALES[Math.floor(Math.random() * INITIAL_SCALES.length)];
      const randomType = PRACTICE_TYPES[Math.floor(Math.random() * PRACTICE_TYPES.length)];
      const randomOctaves = OCTAVE_OPTIONS[Math.floor(Math.random() * OCTAVE_OPTIONS.length)];
      
      exercises.push({
        id: i + 1,
        scale: randomScale.name,
        practiceType: randomType,
        octaves: randomOctaves,
        bpm: Math.floor(Math.random() * 40) + 60 // 60-100 BPM
      });
    }
    return exercises;
  };

  const handleStartExercise = () => {
    if (!currentExercise) return;
    
    const params = new URLSearchParams({
      scale: currentExercise.scale,
      type: currentExercise.practiceType,
      octaves: currentExercise.octaves.toString()
    });
    
    navigateWithLoading(`/practice?${params.toString()}`, `Starting ${currentExercise.scale} practice...`);
  };

  const handleNextExercise = () => {
    if (!currentExercise) return;
    
    const currentIndex = exerciseQueue.findIndex(ex => ex.id === currentExercise.id);
    const nextIndex = currentIndex + 1;
    
    // Mark current as completed
    setCompletedExercises(prev => [...prev, currentExercise]);
    
    if (nextIndex < exerciseQueue.length) {
      setCurrentExercise(exerciseQueue[nextIndex]);
    } else {
      // Workout complete
      setCurrentExercise(null);
    }
  };

  const handleGenerateNew = () => {
    const newExercises = generateRandomExercises(5);
    setExerciseQueue(newExercises);
    setCurrentExercise(newExercises[0]);
    setCompletedExercises([]);
  };

  // Show loading until content is ready
  if (isLoading) {
    return <PageLoading message="Preparing your workout session..." />;
  }

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-4">
        <Button 
          variant="ghost" 
          onClick={() => navigateBack("Going back...")}
          className="p-2 hover:bg-muted rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Workout Session</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" />
          <Button 
            variant="ghost" 
            onClick={handleGenerateNew}
            className="p-2 hover:bg-muted rounded-full"
          >
            <Shuffle className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="text-center">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">Progress</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {completedExercises.length} / {exerciseQueue.length}
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-3">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedExercises.length / exerciseQueue.length) * 100}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Current Exercise */}
      {currentExercise ? (
        <Card className="p-6 mb-6 bg-card">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Current Exercise</div>
            <div className="text-2xl font-bold text-foreground mb-2">{currentExercise.scale}</div>
            <div className="text-lg text-muted-foreground mb-4">
              {currentExercise.practiceType} • {currentExercise.octaves} Octave{currentExercise.octaves > 1 ? 's' : ''} • {currentExercise.bpm} BPM
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={handleStartExercise}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Practice
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleNextExercise}
                className="rounded-full px-6 py-3"
              >
                Skip
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">Workout Complete! 🎉</div>
            <div className="text-green-700 dark:text-green-300 mb-4">
              You&apos;ve completed all {completedExercises.length} exercises in this workout session.
            </div>
            <Button 
              onClick={handleGenerateNew}
              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-3"
            >
              <Shuffle className="w-5 h-5 mr-2" />
              New Workout
            </Button>
          </div>
        </Card>
      )}

      {/* Exercise Queue */}
      <Card className="p-4">
        <div className="text-lg font-semibold text-foreground mb-4">Upcoming Exercises</div>
        <div className="space-y-2">
          {exerciseQueue.slice(completedExercises.length + 1).map((exercise, index) => (
            <div 
              key={exercise.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div>
                <div className="font-medium text-foreground">{exercise.scale}</div>
                <div className="text-sm text-muted-foreground">
                  {exercise.practiceType} • {exercise.octaves} Oct • {exercise.bpm} BPM
                </div>
              </div>
              <div className="text-sm text-muted-foreground">#{index + 2}</div>
            </div>
          ))}
          
          {exerciseQueue.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <div className="text-sm">No exercises in queue</div>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Loading Overlay */}
      <LoadingOverlay 
        isVisible={isNavigating} 
        message={loadingMessage}
        variant="primary"
      />
    </div>
  );
} 
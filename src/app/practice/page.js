'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { USER_PROGRESS } from "@/data/scales";

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Practice configuration from URL params
  const scale = searchParams.get('scale') || 'C Major';
  const practiceType = searchParams.get('type') || 'Right Hand';
  const octaves = searchParams.get('octaves') || '1';
  
  // Practice state
  const [currentBPM, setCurrentBPM] = useState(80);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dailyPracticeTime, setDailyPracticeTime] = useState(0); // Start from 0
  
  // Timer for practice session
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
  // Get best BPM for this specific configuration
  const getBestBPMForConfiguration = () => {
    const practiceTypeId = practiceType.toLowerCase().replace(/\s+/g, '-');
    const progressKey = `${scale}-${practiceTypeId}-${octaves}`;
    return USER_PROGRESS[progressKey]?.bestBPM || null;
  };

  const [bestBPM, setBestBPM] = useState(getBestBPMForConfiguration());

  useEffect(() => {
    // Update daily practice time every second when practicing
    if (isPlaying && sessionStartTime) {
      const interval = setInterval(() => {
        setDailyPracticeTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, sessionStartTime]);

  // Load daily practice time from localStorage on component mount
  useEffect(() => {
    const today = new Date().toDateString();
    const savedData = localStorage.getItem('dailyPracticeData');
    
    if (savedData) {
      const practiceData = JSON.parse(savedData);
      if (practiceData.date === today) {
        setDailyPracticeTime(practiceData.time);
      } else {
        // New day, reset to 0
        setDailyPracticeTime(0);
        localStorage.setItem('dailyPracticeData', JSON.stringify({
          date: today,
          time: 0
        }));
      }
    } else {
      // First time, start from 0
      localStorage.setItem('dailyPracticeData', JSON.stringify({
        date: today,
        time: 0
      }));
    }
  }, []);

  // Save daily practice time to localStorage when it changes
  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem('dailyPracticeData', JSON.stringify({
      date: today,
      time: dailyPracticeTime
    }));
  }, [dailyPracticeTime]);

  const handleGoBack = () => {
    router.push('/');
  };

  const handlePlayPause = () => {
    if (!isPlaying) {
      setSessionStartTime(Date.now());
    }
    setIsPlaying(!isPlaying);
  };

  const handleBPMChange = (change) => {
    const newBPM = Math.max(40, Math.min(200, currentBPM + change));
    setCurrentBPM(newBPM);
    
    // Update best BPM if current exceeds it
    if (bestBPM === null || newBPM > bestBPM) {
      setBestBPM(newBPM);
      // TODO: Save to user progress data
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get scale information
  const getScaleInfo = () => {
    const [scaleName, scaleType] = scale.split(' ');
    return { name: scaleName, type: scaleType };
  };

  const scaleInfo = getScaleInfo();

  // Define scale patterns (simplified for demo)
  const getScaleNotes = (scale) => {
    const scalePatterns = {
      'C Major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      'G Major': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
      'D Major': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
      'A Minor': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      'E Minor': ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
      'F Major': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
    };
    return scalePatterns[scale] || ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  };

  const scaleNotes = getScaleNotes(scale);

  // Piano keys
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeys = [
    { note: 'C#', position: 1 },
    { note: 'D#', position: 2 },
    { note: 'F#', position: 4 },
    { note: 'G#', position: 5 },
    { note: 'A#', position: 6 },
    { note: 'Bb', position: 6 } // Same position as A#
  ];

  const isScaleNote = (note) => {
    return scaleNotes.includes(note);
  };

  const getFingeringNumber = (note) => {
    const noteIndex = scaleNotes.indexOf(note);
    return noteIndex !== -1 ? noteIndex + 1 : '';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      {/* Back Button */}
      <div className="mb-6 pt-4">
        <Button
          variant="ghost"
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 p-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-lg">Go back</span>
        </Button>
      </div>

      {/* Practice Configuration */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4 bg-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">{scaleInfo.name}</div>
          <div className="text-sm text-gray-600">{scaleInfo.type}</div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            change
          </Button>
        </Card>
        
        <Card className="p-4 bg-gray-200 text-center">
          <div className="text-lg font-semibold text-gray-900 mb-1">{practiceType}</div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            change
          </Button>
        </Card>
        
        <Card className="p-4 bg-gray-200 text-center">
          <div className="text-lg font-semibold text-gray-900 mb-1">
            {octaves} Octave{parseInt(octaves) > 1 ? 's' : ''}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            change
          </Button>
        </Card>
      </div>

      {/* Piano Keyboard */}
      <Card className="p-4 mb-6 bg-white">
        <div className="relative h-32">
          {/* White Keys */}
          <div className="flex h-full">
            {whiteKeys.map((note, index) => (
              <div
                key={note}
                className={`flex-1 border border-gray-300 flex items-end justify-center pb-2 relative ${
                  isScaleNote(note) 
                    ? 'bg-blue-500 text-white font-bold' 
                    : 'bg-white text-gray-700'
                }`}
              >
                <span className="text-sm">{getFingeringNumber(note) || index + 1}</span>
                {isScaleNote(note) && (
                  <div className="absolute top-2 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
          
          {/* Black Keys */}
          <div className="absolute top-0 flex h-20">
            {blackKeys.map((key) => (
              <div
                key={key.note}
                className={`absolute w-8 h-20 border border-gray-600 flex items-end justify-center pb-1 ${
                  isScaleNote(key.note) ? 'bg-blue-700' : 'bg-gray-800'
                }`}
                style={{ 
                  left: `${(key.position * 14.28) - 2.5}%`,
                  width: '8%'
                }}
              >
                <span className="text-xs text-white">{key.note[0]}</span>
                {isScaleNote(key.note) && (
                  <div className="absolute top-1 w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* BPM Control Section */}
      <Card className="p-6 mb-6 bg-white">
        {/* Current BPM Display */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-white bg-blue-600 rounded-lg py-4 mb-4">
            {currentBPM} BPM
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleBPMChange(-5)}
            className="w-16 h-16 text-xl font-bold"
          >
            -5
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleBPMChange(-1)}
            className="w-16 h-16 text-xl font-bold"
          >
            -1
          </Button>
          <Button
            onClick={handlePlayPause}
            className="w-24 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleBPMChange(1)}
            className="w-16 h-16 text-xl font-bold"
          >
            +1
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleBPMChange(5)}
            className="w-16 h-16 text-xl font-bold"
          >
            +5
          </Button>
        </div>

        {/* Best BPM Display */}
        {bestBPM && (
          <div className="bg-yellow-100 rounded-lg p-3 flex items-center justify-between">
            <span className="font-medium text-gray-900">Best BPM: {bestBPM}</span>
            <Button variant="ghost" size="sm" className="text-blue-600">
              Timeline
            </Button>
          </div>
        )}
      </Card>

      {/* Daily Practice Time */}
      <Card className="p-4 bg-cyan-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-cyan-700" />
          <span className="text-lg font-medium text-cyan-900">Today's Practice Time</span>
        </div>
        <div className="text-4xl font-bold text-cyan-900">
          {formatTime(dailyPracticeTime)}
        </div>
      </Card>
    </div>
  );
} 
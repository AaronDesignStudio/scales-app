'use client';

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Play, Pause, Clock, Mic, MicOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
import Soundfont from 'soundfont-player';
import * as Tone from 'tone';
import { USER_PROGRESS } from "@/data/scales";

// Available options for modals
const AVAILABLE_SCALES = [
  { name: 'C Major', difficulty: 'Easy' },
  { name: 'G Major', difficulty: 'Easy' },
  { name: 'D Major', difficulty: 'Intermediate' },
  { name: 'A Minor', difficulty: 'Easy' },
  { name: 'E Minor', difficulty: 'Intermediate' },
  { name: 'F Major', difficulty: 'Advanced' }
];

const PRACTICE_TYPES = [
  'Right Hand',
  'Left Hand', 
  'Two Hands',
  'Contrary Motion',
  'Staccato'
];

const OCTAVE_OPTIONS = [
  { value: '1', label: '1 Octave' },
  { value: '2', label: '2 Octaves' },
  { value: '3', label: '3 Octaves' },
  { value: '4', label: '4 Octaves' }
];

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Practice configuration from URL params
  const scale = searchParams.get('scale') || 'C Major';
  const practiceType = searchParams.get('type') || 'Right Hand';
  const octaves = searchParams.get('octaves') || '1';
  
  // Practice state
  const [currentBPM, setCurrentBPM] = useState(60); // Default to 60 BPM
  const [isPlaying, setIsPlaying] = useState(false);
  const [dailyPracticeTime, setDailyPracticeTime] = useState(0);
  
  // Audio and piano state
  const [audioContext, setAudioContext] = useState(null);
  const [soundfontPlayer, setSoundfontPlayer] = useState(null);
  const [activeNotes, setActiveNotes] = useState([]);
  const [audioLoading, setAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState(null);
  const scalePlaybackRef = useRef(null);
  const isPlayingRef = useRef(false);
  const metronomeRef = useRef(null);
  const [isMetronomeMode, setIsMetronomeMode] = useState(false);
  
  // Pitch detection state
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState(null);
  const [detectedFrequency, setDetectedFrequency] = useState(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const micRef = useRef(null);
  const pitchDetectionRef = useRef(null);
  const isListeningRef = useRef(false);
  
  // Modal states for changing practice settings
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showOctavesModal, setShowOctavesModal] = useState(false);
  
  // Timer for practice session
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
  // Piano width state for responsive design
  const [pianoWidth, setPianoWidth] = useState(400);
  
  // Client-side mounting state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);

  // Suppress hydration warnings caused by browser extensions
  useEffect(() => {
    // Mark component as mounted on client side
    setIsMounted(true);
    
    // Suppress console errors for known hydration mismatches from browser extensions
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (
        typeof message === 'string' && 
        (message.includes('data-darkreader') || 
         message.includes('hydration') ||
         message.includes('server rendered HTML'))
      ) {
        // Suppress DarkReader and other extension-related hydration warnings
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Get best BPM for this specific configuration
  const getBestBPMForConfiguration = () => {
    const practiceTypeId = practiceType.toLowerCase().replace(/\s+/g, '-');
    const progressKey = `${scale}-${practiceTypeId}-${octaves}`;
    return USER_PROGRESS[progressKey]?.bestBPM || null;
  };

  // Get/Set last used BPM for this configuration
  const getLastBPMForConfiguration = () => {
    const practiceTypeId = practiceType.toLowerCase().replace(/\s+/g, '-');
    const configKey = `bpm-${scale}-${practiceTypeId}-${octaves}`;
    const savedBPM = localStorage.getItem(configKey);
    return savedBPM ? parseInt(savedBPM) : 60; // Default to 60 if never practiced
  };

  const saveLastBPMForConfiguration = (bpm) => {
    const practiceTypeId = practiceType.toLowerCase().replace(/\s+/g, '-');
    const configKey = `bpm-${scale}-${practiceTypeId}-${octaves}`;
    localStorage.setItem(configKey, bpm.toString());
    console.log(`Saved BPM ${bpm} for configuration: ${configKey}`);
  };

  const [bestBPM, setBestBPM] = useState(getBestBPMForConfiguration());

  // Load last used BPM when configuration changes
  useEffect(() => {
    const lastBPM = getLastBPMForConfiguration();
    console.log(`Loading BPM for ${scale} - ${practiceType} - ${octaves} octaves: ${lastBPM}`);
    setCurrentBPM(lastBPM);
  }, [scale, practiceType, octaves]); // Re-run when any config changes

  // Update best BPM when it changes
  useEffect(() => {
    setBestBPM(getBestBPMForConfiguration());
  }, [scale, practiceType, octaves]);

  // Initialize audio context and soundfont
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        console.log('Initializing audio...');
        setAudioLoading(true);
        setAudioError(null);
        
        // Create audio context
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('Web Audio API not supported');
        }
        
        const ac = new AudioContextClass();
        console.log('Audio context created:', ac.state);
        setAudioContext(ac);
        
        // Load acoustic grand piano soundfont
        console.log('Loading soundfont...');
        const player = await Soundfont.instrument(ac, 'acoustic_grand_piano');
        console.log('Soundfont loaded successfully');
        setSoundfontPlayer(player);
        setAudioLoading(false);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        setAudioError(error.message);
        setAudioLoading(false);
      }
    };

    initializeAudio();

    return () => {
      if (scalePlaybackRef.current) {
        clearTimeout(scalePlaybackRef.current);
      }
      if (metronomeRef.current) {
        clearTimeout(metronomeRef.current);
      }
      if (pitchDetectionRef.current) {
        cancelAnimationFrame(pitchDetectionRef.current);
      }
      if (micRef.current) {
        if (micRef.current.stream) {
          micRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (micRef.current.source) {
          micRef.current.source.disconnect();
        }
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

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
    const loadDailyPracticeTime = () => {
      const now = new Date();
      const today = now.toDateString();
      const savedData = localStorage.getItem('dailyPracticeData');
      
      if (savedData) {
        try {
          const practiceData = JSON.parse(savedData);
          
          if (practiceData.date === today) {
            // Same day - continue from saved time
            console.log('Continuing practice time from:', practiceData.time, 'seconds');
            setDailyPracticeTime(practiceData.time);
          } else {
            // New day - reset to 0 and save
            console.log('New day detected, resetting practice time');
            setDailyPracticeTime(0);
            localStorage.setItem('dailyPracticeData', JSON.stringify({
              date: today,
              time: 0,
              lastUpdated: now.toISOString()
            }));
          }
        } catch (error) {
          console.error('Error parsing practice data:', error);
          // Reset if corrupted
          setDailyPracticeTime(0);
          localStorage.setItem('dailyPracticeData', JSON.stringify({
            date: today,
            time: 0,
            lastUpdated: now.toISOString()
          }));
        }
      } else {
        // First time - start from 0
        console.log('First time using app, starting practice time at 0');
        setDailyPracticeTime(0);
        localStorage.setItem('dailyPracticeData', JSON.stringify({
          date: today,
          time: 0,
          lastUpdated: now.toISOString()
        }));
      }
    };

    loadDailyPracticeTime();
  }, []);

  // Save daily practice time to localStorage when it changes
  useEffect(() => {
    if (dailyPracticeTime > 0) { // Only save if there's actual practice time
      const now = new Date();
      const today = now.toDateString();
      
      const practiceData = {
        date: today,
        time: dailyPracticeTime,
        lastUpdated: now.toISOString()
      };
      
      localStorage.setItem('dailyPracticeData', JSON.stringify(practiceData));
      console.log('Saved practice time:', dailyPracticeTime, 'seconds');
    }
  }, [dailyPracticeTime]);

  // Check for date change every minute to handle midnight rollover
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date();
      const today = now.toDateString();
      const savedData = localStorage.getItem('dailyPracticeData');
      
      if (savedData) {
        try {
          const practiceData = JSON.parse(savedData);
          
          if (practiceData.date !== today) {
            // Date has changed (midnight passed) - reset to 0
            console.log('Midnight passed, resetting practice time to 0');
            setDailyPracticeTime(0);
            localStorage.setItem('dailyPracticeData', JSON.stringify({
              date: today,
              time: 0,
              lastUpdated: now.toISOString()
            }));
          }
        } catch (error) {
          console.error('Error checking date change:', error);
        }
      }
    };

    // Check every minute for date changes
    const dateCheckInterval = setInterval(checkDateChange, 60000);
    
    return () => clearInterval(dateCheckInterval);
  }, []);

  const handleGoBack = () => {
    router.push('/');
  };

  // Get scale MIDI numbers
  const getScaleMidiNumbers = (scale, octaves) => {
    // Define scales as semitone intervals from the root note
    const scaleIntervals = {
      'C Major': [0, 2, 4, 5, 7, 9, 11], // W-W-H-W-W-W-H
      'G Major': [0, 2, 4, 5, 7, 9, 11], // Same pattern, different root
      'D Major': [0, 2, 4, 5, 7, 9, 11], // Same pattern, different root
      'A Minor': [0, 2, 3, 5, 7, 8, 10], // W-H-W-W-H-W-W (natural minor)
      'E Minor': [0, 2, 3, 5, 7, 8, 10], // Same pattern, different root
      'F Major': [0, 2, 4, 5, 7, 9, 11], // Same pattern, different root
    };

    // Define root notes (MIDI numbers in octave 4)
    const rootNotes = {
      'C Major': 60, // C4
      'G Major': 67, // G4
      'D Major': 62, // D4
      'A Minor': 57, // A3 (to keep it in reasonable range)
      'E Minor': 64, // E4
      'F Major': 65, // F4
    };

    const intervals = scaleIntervals[scale] || scaleIntervals['C Major'];
    const rootNote = rootNotes[scale] || rootNotes['C Major'];
    const midiNumbers = [];

    for (let octave = 0; octave < parseInt(octaves); octave++) {
      intervals.forEach(interval => {
        const midiNumber = rootNote + (octave * 12) + interval;
        midiNumbers.push(midiNumber);
      });
    }

    console.log(`Generated MIDI numbers for ${scale} (${octaves} octaves):`, midiNumbers);
    return midiNumbers;
  };

  // Generate metronome click sound
  const playMetronomeClick = () => {
    if (!audioContext) return;

    try {
      // Create a more realistic metronome sound using multiple components
      const clickDuration = 0.1;
      const currentTime = audioContext.currentTime;

      // High frequency click component (wooden tick)
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      
      oscillator1.frequency.setValueAtTime(2000, currentTime);
      oscillator1.type = 'triangle';
      
      gainNode1.gain.setValueAtTime(0, currentTime);
      gainNode1.gain.linearRampToValueAtTime(0.4, currentTime + 0.001);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.02);
      
      oscillator1.start(currentTime);
      oscillator1.stop(currentTime + 0.02);

      // Mid frequency component for body
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.setValueAtTime(800, currentTime);
      oscillator2.type = 'sine';
      
      gainNode2.gain.setValueAtTime(0, currentTime);
      gainNode2.gain.linearRampToValueAtTime(0.2, currentTime + 0.002);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.05);
      
      oscillator2.start(currentTime);
      oscillator2.stop(currentTime + 0.05);

      // Low frequency thump for realistic feel
      const oscillator3 = audioContext.createOscillator();
      const gainNode3 = audioContext.createGain();
      
      oscillator3.connect(gainNode3);
      gainNode3.connect(audioContext.destination);
      
      oscillator3.frequency.setValueAtTime(200, currentTime);
      oscillator3.type = 'sine';
      
      gainNode3.gain.setValueAtTime(0, currentTime);
      gainNode3.gain.linearRampToValueAtTime(0.1, currentTime + 0.005);
      gainNode3.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.08);
      
      oscillator3.start(currentTime);
      oscillator3.stop(currentTime + 0.08);
      
      console.log('Realistic metronome tick played');
    } catch (error) {
      console.error('Error playing metronome click:', error);
    }
  };

  // Start metronome after scale
  const startMetronome = () => {
    if (!audioContext || !isPlayingRef.current) return;

    console.log('Starting metronome mode');
    setIsMetronomeMode(true);
    
    const bpm = currentBPM;
    const beatInterval = (60 / bpm) * 1000; // Time between beats in milliseconds
    
    // Play the first click immediately to maintain tempo
    playMetronomeClick();
    
    const playMetronomeBeat = () => {
      if (isPlayingRef.current) {
        playMetronomeClick();
        metronomeRef.current = setTimeout(playMetronomeBeat, beatInterval);
      } else {
        console.log('Metronome stopped');
        setIsMetronomeMode(false);
        metronomeRef.current = null;
      }
    };

    // Schedule the next beat after the first immediate one
    metronomeRef.current = setTimeout(playMetronomeBeat, beatInterval);
  };

  // Restart metronome with new BPM (for real-time BPM changes)
  const restartMetronomeWithNewBPM = () => {
    if (!isMetronomeMode || !isPlayingRef.current) return;
    
    console.log('Restarting metronome with new BPM:', currentBPM);
    
    // Clear existing metronome timeout
    if (metronomeRef.current) {
      clearTimeout(metronomeRef.current);
      metronomeRef.current = null;
    }
    
    // Start metronome again with new timing
    const bpm = currentBPM;
    const beatInterval = (60 / bpm) * 1000;
    
    // Play immediate click to maintain rhythm
    playMetronomeClick();
    
    const playMetronomeBeat = () => {
      if (isPlayingRef.current) {
        playMetronomeClick();
        metronomeRef.current = setTimeout(playMetronomeBeat, beatInterval);
      } else {
        console.log('Metronome stopped');
        setIsMetronomeMode(false);
        metronomeRef.current = null;
      }
    };

    // Schedule next beat with new timing
    metronomeRef.current = setTimeout(playMetronomeBeat, beatInterval);
  };

  // Convert frequency to note name
  const frequencyToNote = (frequency) => {
    if (!frequency || frequency < 80 || frequency > 2000) return null;
    
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const noteNumber = Math.round(12 * Math.log2(frequency / A4)) + 69;
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    
    if (octave < 0 || octave > 8) return null;
    
    return `${noteNames[noteIndex]}${octave}`;
  };

  // Start pitch detection
  const startPitchDetection = async () => {
    try {
      console.log('Starting pitch detection...');
      console.log('Browser:', navigator.userAgent);
      
      // Chrome requires audio context to be resumed after user gesture
      if (audioContext && audioContext.state === 'suspended') {
        console.log('Resuming suspended audio context...');
        await audioContext.resume();
      }
      
      // Use native Web Audio API for more reliable microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,  // Explicit sample rate for Chrome
          channelCount: 1     // Mono input for better performance
        } 
      });
      
      console.log('Microphone stream obtained:', stream);
      console.log('Stream tracks:', stream.getTracks());
      
      // For Chrome, we need to ensure we have a fresh audio context
      let contextToUse = audioContext;
      if (!contextToUse || contextToUse.state === 'closed') {
        console.log('Creating new audio context for Chrome...');
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        contextToUse = new AudioContextClass({ sampleRate: 44100 });
        setAudioContext(contextToUse);
      }
      
      // Ensure context is running before proceeding
      if (contextToUse.state === 'suspended') {
        console.log('Resuming audio context before analysis...');
        await contextToUse.resume();
      }
      
      console.log('Audio context state:', contextToUse.state);
      console.log('Audio context sample rate:', contextToUse.sampleRate);
      
      setupAnalysis(stream, contextToUse);
      
    } catch (error) {
      console.error('Error starting pitch detection:', error);
      alert('Could not access microphone. Please check permissions and try again.');
      setIsListening(false);
    }
  };

  const setupAnalysis = (stream, context) => {
    try {
      console.log('Setting up audio analysis...');
      console.log('Context state before setup:', context.state);
      
      // Create audio nodes
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      
      // Configure analyser with Chrome-friendly settings
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;  // More smoothing for Chrome
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      console.log('Analyser configured:', {
        fftSize: analyser.fftSize,
        smoothingTimeConstant: analyser.smoothingTimeConstant,
        minDecibels: analyser.minDecibels,
        maxDecibels: analyser.maxDecibels
      });
      
      // Connect source to analyser
      source.connect(analyser);
      console.log('Audio nodes connected');
      
      // For Chrome, add a small delay before starting analysis
      setTimeout(() => {
        // Store references
        micRef.current = { stream, source, analyser, context };
        
        setIsListening(true);
        isListeningRef.current = true;
        console.log('Audio analysis setup complete, starting analysis...');
        
        // Start analysis loop
        analyzeAudio(analyser, context);
      }, 100); // 100ms delay for Chrome stability
      
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
      setIsListening(false);
    }
  };

  const analyzeAudio = (analyser, context) => {
    if (!isListeningRef.current) {
      console.log('Analysis stopped - not listening');
      return;
    }
    
    // Add frame counter for debugging
    if (!analyzeAudio.frameCount) analyzeAudio.frameCount = 0;
    analyzeAudio.frameCount++;
    
    // Log every 60 frames (roughly every second at 60fps)
    if (analyzeAudio.frameCount % 60 === 0) {
      console.log('Analysis loop running, frame:', analyzeAudio.frameCount);
    }
    
    try {
      // Get time domain data for pitch detection
      const bufferLength = analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);
      analyser.getFloatTimeDomainData(dataArray);
      
      // Calculate volume level
      let sum = 0;
      let maxAmplitude = 0;
      for (let i = 0; i < bufferLength; i++) {
        const amplitude = Math.abs(dataArray[i]);
        sum += amplitude * amplitude;
        maxAmplitude = Math.max(maxAmplitude, amplitude);
      }
      
      const rms = Math.sqrt(sum / bufferLength);
      const volumePercent = Math.round(rms * 1000); // Increased sensitivity
      
      // More frequent logging for debugging
      if (volumePercent > 0) {
        console.log('RMS volume:', rms, 'Max amplitude:', maxAmplitude, 'Volume %:', volumePercent);
      }
      
      setVolumeLevel(volumePercent);
      
      // Lower threshold for pitch detection
      if (rms > 0.001) {
        const frequency = detectPitchFromBuffer(dataArray, context.sampleRate);
        
        if (frequency) {
          const note = frequencyToNote(frequency);
          console.log('Detected frequency:', frequency, 'Note:', note);
          
          if (note) {
            setDetectedNote(note);
            setDetectedFrequency(Math.round(frequency));
          }
        } else {
          setDetectedNote(null);
          setDetectedFrequency(null);
        }
      } else {
        setDetectedNote(null);
        setDetectedFrequency(null);
      }
      
    } catch (error) {
      console.error('Error in audio analysis:', error);
    }
    
    // Continue analysis - ensure this keeps running
    if (isListeningRef.current) {
      pitchDetectionRef.current = requestAnimationFrame(() => analyzeAudio(analyser, context));
    }
  };

  // Autocorrelation-based pitch detection
  const detectPitchFromBuffer = (buffer, sampleRate) => {
    const minFreq = 80;  // Lowest piano note
    const maxFreq = 2000; // Highest piano note we care about
    
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);
    
    let maxCorrelation = 0;
    let bestPeriod = 0;
    
    // Autocorrelation
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += buffer[i] * buffer[i + period];
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    // Check if correlation is strong enough
    if (maxCorrelation > 0.001 && bestPeriod > 0) {
      return sampleRate / bestPeriod;
    }
    
    return null;
  };

  // Stop pitch detection
  const stopPitchDetection = () => {
    console.log('Stopping pitch detection...');
    setIsListening(false);
    isListeningRef.current = false;
    setDetectedNote(null);
    setDetectedFrequency(null);
    setVolumeLevel(0);
    
    if (pitchDetectionRef.current) {
      cancelAnimationFrame(pitchDetectionRef.current);
      pitchDetectionRef.current = null;
    }
    
    if (micRef.current) {
      // Stop the media stream tracks
      if (micRef.current.stream) {
        micRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      // Disconnect audio nodes
      if (micRef.current.source) {
        micRef.current.source.disconnect();
      }
      
      micRef.current = null;
    }
  };

  // Toggle pitch detection
  const togglePitchDetection = () => {
    if (isListening) {
      stopPitchDetection();
    } else {
      startPitchDetection();
    }
  };

  // Test audio context for Chrome debugging
  const testAudioContext = async () => {
    try {
      console.log('=== TESTING AUDIO CONTEXT ===');
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const testContext = new AudioContextClass();
      
      console.log('Test context created:', testContext.state);
      console.log('Test context sample rate:', testContext.sampleRate);
      
      if (testContext.state === 'suspended') {
        console.log('Resuming test context...');
        await testContext.resume();
        console.log('Test context after resume:', testContext.state);
      }
      
      // Test oscillator
      const oscillator = testContext.createOscillator();
      const gainNode = testContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(testContext.destination);
      
      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(testContext.currentTime + 0.2);
      
      console.log('Audio context test completed');
      testContext.close();
      
    } catch (error) {
      console.error('Audio context test failed:', error);
    }
  };

  const playScale = async () => {
    if (!soundfontPlayer || !audioContext) {
      console.error('Audio not ready - soundfont:', !!soundfontPlayer, 'audioContext:', !!audioContext);
      return;
    }

    try {
      // Resume audio context if suspended (required for user interaction)
      if (audioContext.state === 'suspended') {
        console.log('Resuming audio context...');
        await audioContext.resume();
      }

      console.log('Starting scale playback...');
      const scaleMidi = getScaleMidiNumbers(scale, octaves);
      const noteDuration = (60 / currentBPM) * 1000; // Duration per note in milliseconds
      
      console.log(`Playing scale at ${currentBPM} BPM (${noteDuration}ms per note)`);
      console.log('Scale MIDI numbers:', scaleMidi);

      let noteIndex = 0;

      const playNextNote = () => {
        console.log(`playNextNote called - noteIndex: ${noteIndex}, isPlayingRef.current: ${isPlayingRef.current}, scaleMidi.length: ${scaleMidi.length}`);
        
        if (noteIndex < scaleMidi.length && isPlayingRef.current) {
          const midiNumber = scaleMidi[noteIndex];
          console.log(`Playing note ${noteIndex + 1}/${scaleMidi.length}: MIDI ${midiNumber}`);
          
          // Highlight the current note on piano
          setActiveNotes([midiNumber]);
          
          // Play the note with soundfont
          try {
            const notePlay = soundfontPlayer.play(midiNumber, audioContext.currentTime, {
              duration: noteDuration / 1000,
              gain: 2
            });
            console.log('Note play result:', notePlay);
          } catch (error) {
            console.error('Error playing note:', error);
          }

          noteIndex++;
          
          // Schedule next note
          console.log(`Scheduling next note in ${noteDuration}ms`);
          scalePlaybackRef.current = setTimeout(() => {
            playNextNote();
          }, noteDuration);
        } else {
          // Scale finished or stopped
          console.log('Scale playback completed or stopped');
          setActiveNotes([]);
          if (noteIndex >= scaleMidi.length) {
            console.log('Scale completed, starting metronome with perfect timing');
            // Start metronome immediately to maintain tempo
            startMetronome();
          } else {
            // Manually stopped
            setIsPlaying(false);
            isPlayingRef.current = false;
          }
        }
      };

      // Start the sequence
      playNextNote();
    } catch (error) {
      console.error('Error in playScale:', error);
      setIsPlaying(false);
      isPlayingRef.current = false;
      setActiveNotes([]);
    }
  };

  const handlePlayPause = async () => {
    console.log('=== PLAY/PAUSE BUTTON CLICKED ===');
    console.log('Current state - isPlaying:', isPlaying, 'isPlayingRef.current:', isPlayingRef.current);
    console.log('Audio ready - soundfontPlayer:', !!soundfontPlayer, 'audioContext:', !!audioContext);
    
    if (!soundfontPlayer || !audioContext) {
      console.error('Audio not ready yet');
      alert('Audio is still loading. Please wait a moment and try again.');
      return;
    }

    if (!isPlaying) {
      console.log('=== STARTING PLAYBACK ===');
      setSessionStartTime(Date.now());
      setIsPlaying(true);
      isPlayingRef.current = true;
      console.log('isPlaying set to true, isPlayingRef.current set to true');
      
      // Wait a tick for state to update before calling playScale
      setTimeout(async () => {
        console.log('About to call playScale, isPlaying:', isPlaying, 'isPlayingRef.current:', isPlayingRef.current);
        await playScale();
      }, 10);
    } else {
      console.log('=== STOPPING PLAYBACK ===');
      setIsPlaying(false);
      isPlayingRef.current = false;
      setIsMetronomeMode(false);
      setActiveNotes([]);
      
      // Clear scale playback timeout
      if (scalePlaybackRef.current) {
        console.log('Clearing scale timeout:', scalePlaybackRef.current);
        clearTimeout(scalePlaybackRef.current);
        scalePlaybackRef.current = null;
      }
      
      // Clear metronome timeout
      if (metronomeRef.current) {
        console.log('Clearing metronome timeout:', metronomeRef.current);
        clearTimeout(metronomeRef.current);
        metronomeRef.current = null;
      }
    }
  };

  const handleBPMChange = (change) => {
    const newBPM = Math.max(40, Math.min(200, currentBPM + change));
    setCurrentBPM(newBPM);
    
    // Save the new BPM for this configuration
    saveLastBPMForConfiguration(newBPM);
    
    // If metronome is active, restart it with new timing
    if (isMetronomeMode && isPlayingRef.current) {
      console.log('BPM changed during metronome, restarting with new timing');
      // Use setTimeout to ensure currentBPM state has updated
      setTimeout(() => {
        restartMetronomeWithNewBPM();
      }, 10);
    }
    
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

  // Dynamic piano configuration based on scale and octaves
  const getPianoRange = () => {
    const selectedOctaves = parseInt(octaves);
    
    // Always start at C4 (MIDI 60)
    const startingC = 60; // C4
    
    if (selectedOctaves === 1) {
      // Show one octave + extra C: C4 to C5 (13 keys)
      const firstNote = startingC; // C4
      const lastNote = startingC + 12; // C5
      return { 
        first: MidiNumbers.fromNote(MidiNumbers.getAttributes(firstNote).note),
        last: MidiNumbers.fromNote(MidiNumbers.getAttributes(lastNote).note)
      };
    } else {
      // Show two octaves + extra C: C4 to C6 (25 keys)
      const firstNote = startingC; // C4
      const lastNote = startingC + 24; // C6
      return { 
        first: MidiNumbers.fromNote(MidiNumbers.getAttributes(firstNote).note),
        last: MidiNumbers.fromNote(MidiNumbers.getAttributes(lastNote).note)
      };
    }
  };

  const { first: firstNote, last: lastNote } = getPianoRange();

  // Piano configuration
  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote: firstNote,
    lastNote: lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW,
  });

  // Handle piano note play/stop
  const onPlayNote = (midiNumber) => {
    if (soundfontPlayer && audioContext) {
      console.log('Manual note play:', midiNumber);
      soundfontPlayer.play(midiNumber, audioContext.currentTime, { gain: 0.8 });
    }
  };

  const onStopNote = (midiNumber) => {
    // Soundfont player handles note stopping automatically
  };

  // Test audio function
  const testAudio = async () => {
    if (!soundfontPlayer || !audioContext) {
      alert('Audio not ready yet');
      return;
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    console.log('Testing audio with middle C...');
    soundfontPlayer.play(60, audioContext.currentTime, { duration: 1, gain: 0.8 });
  };

  // Test scale function
  const testScale = async () => {
    if (!soundfontPlayer || !audioContext) {
      alert('Audio not ready yet');
      return;
    }

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    console.log('Testing scale notes...');
    const scaleMidi = getScaleMidiNumbers(scale, octaves);
    console.log('Generated scale MIDI numbers:', scaleMidi);
    
    // Play all notes with 500ms delay between them
    scaleMidi.forEach((midiNumber, index) => {
      setTimeout(() => {
        console.log(`Testing note ${index + 1}: MIDI ${midiNumber}`);
        soundfontPlayer.play(midiNumber, audioContext.currentTime, { duration: 0.5, gain: 0.8 });
        setActiveNotes([midiNumber]);
        
        // Clear highlight after note
        setTimeout(() => setActiveNotes([]), 400);
      }, index * 500);
    });
  };

  useEffect(() => {
    const updatePianoWidth = () => {
      // Calculate container width
      const containerWidth = Math.min(window.innerWidth - 32, 448);
      
      // Use a very conservative width to ensure all keys (including the extra one) fit
      const pianoWidth = containerWidth - 32; // Leave 32px margin to prevent overflow
      
      setPianoWidth(pianoWidth);
    };

    // Set initial width
    updatePianoWidth();

    // Update on resize
    window.addEventListener('resize', updatePianoWidth);
    return () => window.removeEventListener('resize', updatePianoWidth);
  }, [octaves]);

  // Prevent hydration mismatches by only rendering after client-side mount
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

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

      {/* Audio Status Debug Info */}
      {(audioLoading || audioError) && (
        <Card className="p-4 mb-4 bg-yellow-50 border-yellow-200">
          {audioLoading && <p className="text-yellow-800">Loading audio... Please wait.</p>}
          {audioError && <p className="text-red-800">Audio Error: {audioError}</p>}
          <div className="flex gap-2 mt-2">
            <Button onClick={testAudio} size="sm">
              Test Audio
            </Button>
            <Button onClick={testScale} size="sm" variant="outline">
              Test Scale
            </Button>
          </div>
        </Card>
      )}

      {/* Practice Configuration */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-4 bg-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">{scaleInfo.name}</div>
          <div className="text-sm text-gray-600">{scaleInfo.type}</div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setShowScaleModal(true)}
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
            onClick={() => setShowTypeModal(true)}
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
            onClick={() => setShowOctavesModal(true)}
          >
            change
          </Button>
        </Card>
      </div>

      {/* React Piano Component */}
      <Piano
        noteRange={{ first: firstNote, last: lastNote }}
        playNote={onPlayNote}
        stopNote={onStopNote}
        width={pianoWidth}
        keyboardShortcuts={keyboardShortcuts}
        activeNotes={activeNotes}
        renderNoteLabel={() => null}
        className="react-piano mx-auto mb-6"
      />

      {/* BPM Control Section */}
      <Card className="p-6 mb-6 bg-white">
        {/* Current BPM Display */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-white bg-blue-600 rounded-lg py-4 mb-4">
            {currentBPM} BPM
          </div>
          {isMetronomeMode && (
            <div className="text-sm font-medium text-blue-600 bg-blue-50 rounded-lg py-2 px-4 mx-4">
              🎵 METRONOME ACTIVE
            </div>
          )}
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
            disabled={audioLoading}
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
      <Card className="p-4 bg-cyan-100 text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-cyan-700" />
          <span className="text-lg font-medium text-cyan-900">Today's Practice Time</span>
        </div>
        <div className="text-4xl font-bold text-cyan-900">
          {formatTime(dailyPracticeTime)}
        </div>
      </Card>

      {/* Pitch Detection Section */}
      <Card className="p-6 bg-purple-50 border-purple-200">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Piano Note Detection</h3>
          <div className="space-y-2">
            <Button
              onClick={togglePitchDetection}
              className={`w-full ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5 mr-2" />
                  Stop Listening
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start Listening
                </>
              )}
            </Button>
            <Button
              onClick={testAudioContext}
              variant="outline"
              size="sm"
              className="w-full text-purple-600 border-purple-600 hover:bg-purple-50"
            >
              Test Audio Context (Chrome Debug)
            </Button>
          </div>
        </div>

        {isListening && (
          <div className="text-center">
            <div className="bg-white rounded-lg p-4 border-2 border-purple-200 mb-2">
              {detectedNote ? (
                <div>
                  <div className="text-3xl font-bold text-purple-900 mb-1">
                    {detectedNote}
                  </div>
                  <div className="text-sm text-purple-600">
                    {detectedFrequency} Hz
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  <div className="text-xl">🎵</div>
                  <div className="text-sm">Play a note on your piano...</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Check browser console for debug info
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-purple-600">
              🎤 Listening for piano notes... (Check volume levels)
            </div>
            <div className="mt-2">
              <div className="text-xs text-purple-600 mb-1">Volume Level: {volumeLevel}%</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(volumeLevel, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Scale Selection Modal */}
      <Dialog open={showScaleModal} onOpenChange={setShowScaleModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Select Scale</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {AVAILABLE_SCALES.map((scaleOption) => (
              <div
                key={scaleOption.name}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  scale === scaleOption.name 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const searchParams = new URLSearchParams(window.location.search);
                  searchParams.set('scale', scaleOption.name);
                  window.location.search = searchParams.toString();
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{scaleOption.name}</div>
                    <Badge 
                      variant="outline"
                      className={`mt-1 ${
                        scaleOption.difficulty === 'Easy' ? 'border-green-500 text-green-700' :
                        scaleOption.difficulty === 'Intermediate' ? 'border-yellow-500 text-yellow-700' :
                        'border-red-500 text-red-700'
                      }`}
                    >
                      {scaleOption.difficulty}
                    </Badge>
                  </div>
                  {scale === scaleOption.name && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Practice Type Modal */}
      <Dialog open={showTypeModal} onOpenChange={setShowTypeModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Select Practice Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {PRACTICE_TYPES.map((typeOption) => (
              <div
                key={typeOption}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  practiceType === typeOption 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const searchParams = new URLSearchParams(window.location.search);
                  searchParams.set('type', typeOption);
                  window.location.search = searchParams.toString();
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{typeOption}</div>
                  {practiceType === typeOption && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Octaves Modal */}
      <Dialog open={showOctavesModal} onOpenChange={setShowOctavesModal}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Select Octaves</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {OCTAVE_OPTIONS.map((octaveOption) => (
              <div
                key={octaveOption.value}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  octaves === octaveOption.value 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => {
                  const searchParams = new URLSearchParams(window.location.search);
                  searchParams.set('octaves', octaveOption.value);
                  window.location.search = searchParams.toString();
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{octaveOption.label}</div>
                  {octaves === octaveOption.value && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .react-piano {
          margin: 0 auto;
        }
        :global(.ReactPiano__Key--active) {
          background: #3b82f6 !important;
        }
        :global(.ReactPiano__Key--accidental.ReactPiano__Key--active) {
          background: #1d4ed8 !important;
        }
      `}</style>
    </div>
  );
} 
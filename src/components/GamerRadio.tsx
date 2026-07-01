import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  X, Gamepad2, Disc, Sliders, Radio, Heart, Sparkles, Flame, ListMusic
} from 'lucide-react';
import { LanguageType } from '../types';

interface GamerRadioProps {
  onClose: () => void;
  language: LanguageType;
}

interface Track {
  id: string;
  titleMn: string;
  titleEn: string;
  descriptionMn: string;
  descriptionEn: string;
  tempo: number;
  notes: number[];
  bass: number[];
  type: 'square' | 'triangle' | 'sine' | 'sawtooth';
}

const TRACKS: Track[] = [
  {
    id: 'cyberpunk',
    titleMn: 'Кибер Аялал (Cyberpunk Quest)',
    titleEn: 'Cyberpunk Quest',
    descriptionMn: 'Хурдан хэмнэлтэй, эрч хүчтэй 8-бит аялгуу 🚀',
    descriptionEn: 'Fast-paced, high-energy retro 8-bit theme 🚀',
    tempo: 135,
    notes: [60, 63, 65, 67, 70, 67, 65, 63, 60, 63, 65, 67, 72, 70, 67, 65],
    bass: [36, 36, 39, 39, 41, 41, 43, 43, 36, 36, 39, 39, 48, 48, 43, 41],
    type: 'square'
  },
  {
    id: 'space_vault',
    titleMn: 'Сансрын Сейф (Space Safe Symphony)',
    titleEn: 'Space Safe Symphony',
    descriptionMn: 'Уянгалаг, нууцлаг сансрын арпеж хөгжим 🌌',
    descriptionEn: 'Cosmic, floating synthwave arpeggios 🌌',
    tempo: 115,
    notes: [67, 71, 74, 79, 81, 79, 74, 71, 64, 67, 71, 76, 79, 76, 71, 67],
    bass: [43, 43, 43, 43, 40, 40, 40, 40, 36, 36, 36, 36, 38, 38, 38, 38],
    type: 'triangle'
  },
  {
    id: 'champions',
    titleMn: 'Аваргын Ялалт (Champion\'s Glory)',
    titleEn: 'Champion\'s Glory',
    descriptionMn: 'Тоглоомонд ялахад эгшиглэдэг баатарлаг дуу 🏆',
    descriptionEn: 'Epic, triumphant chiptune melody 🏆',
    tempo: 145,
    notes: [60, 64, 67, 72, 72, 74, 72, 67, 65, 69, 72, 77, 77, 79, 77, 72],
    bass: [48, 48, 52, 52, 53, 53, 53, 53, 41, 41, 45, 45, 48, 48, 48, 48],
    type: 'sawtooth'
  },
  {
    id: 'chill_gamer',
    titleMn: 'Тайван Тоглогч (Chill Lofi Gamer)',
    titleEn: 'Chill Lofi Gamer',
    descriptionMn: 'Төвлөрөх, суралцахад зориулсан зөөлөн аялгуу ☕',
    descriptionEn: 'Relaxed, warm lofi sine wave background ☕',
    tempo: 85,
    notes: [60, 64, 67, 71, 57, 60, 64, 67, 53, 57, 60, 64, 55, 59, 62, 65],
    bass: [36, 36, 36, 36, 33, 33, 33, 33, 29, 29, 29, 29, 31, 31, 31, 31],
    type: 'sine'
  }
];

export default function GamerRadio({ onClose, language }: GamerRadioProps) {
  const isMn = language === 'mn';
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [favoriteTracks, setFavoriteTracks] = useState<Record<string, boolean>>({
    cyberpunk: true
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Audio context and synthesizer references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const schedulerTimerId = useRef<number | null>(null);
  const sequencerStepRef = useRef(0);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(0.5);
  const isMutedRef = useRef(false);

  const currentTrack = TRACKS[currentTrackIndex];

  // Map MIDI note to frequency
  const midiToFreq = (note: number): number => {
    return 440 * Math.pow(2, (note - 69) / 12);
  };

  // Safe initialize AudioContext
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  // Trigger synthesizer note
  const playSynthNote = (freq: number, bassFreq: number, type: Track['type'], step: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const actVolume = isMutedRef.current ? 0 : volumeRef.current;
    if (actVolume <= 0) return;

    const now = ctx.currentTime;

    // 1. LEAD SYNTH OSCILLATOR
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    
    // Smooth ADSR envelope for lead
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12 * actVolume, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.start(now);
    osc.stop(now + 0.3);

    // 2. BASS OSCILLATOR
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    
    bassOsc.type = 'triangle'; // Soft deep bass
    bassOsc.frequency.setValueAtTime(bassFreq, now);
    
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.18 * actVolume, now + 0.05);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    bassOsc.start(now);
    bassOsc.stop(now + 0.4);

    // 3. SYNTHESIZED RETRO DRUM (Beats on steps 0, 4, 8, 12)
    if (step % 4 === 0) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      
      kickOsc.connect(kickGain);
      kickGain.connect(ctx.destination);
      
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(150, now);
      kickOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      kickGain.gain.setValueAtTime(0, now);
      kickGain.gain.linearRampToValueAtTime(0.25 * actVolume, now + 0.01);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      kickOsc.start(now);
      kickOsc.stop(now + 0.2);
    }

    // Retro Snare / Hi-hat (Click on steps 2, 6, 10, 14)
    if (step % 4 === 2 || step % 8 === 7) {
      const snareOsc = ctx.createOscillator();
      const snareGain = ctx.createGain();
      
      snareOsc.connect(snareGain);
      snareGain.connect(ctx.destination);
      
      snareOsc.type = 'triangle';
      snareOsc.frequency.setValueAtTime(1000, now);
      snareOsc.frequency.linearRampToValueAtTime(150, now + 0.08);
      
      snareGain.gain.setValueAtTime(0.08 * actVolume, now);
      snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      snareOsc.start(now);
      snareOsc.stop(now + 0.1);
    }
  };

  // Sync ref values
  useEffect(() => {
    volumeRef.current = volume;
    isMutedRef.current = isMuted;
  }, [volume, isMuted]);

  // Sequencer loop hook
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    
    if (!isPlaying) {
      if (schedulerTimerId.current) {
        clearInterval(schedulerTimerId.current);
        schedulerTimerId.current = null;
      }
      return;
    }

    initAudio();

    // Calculate tempo interval per step (16th note)
    // Interval ms = (60000 / BPM) / 4 steps
    const bpm = TRACKS[currentTrackIndex].tempo;
    const intervalMs = (60000 / bpm) / 2; // Fast 8th note rhythm

    schedulerTimerId.current = window.setInterval(() => {
      const step = sequencerStepRef.current;
      const track = TRACKS[currentTrackIndex];
      
      const midiNote = track.notes[step];
      const bassNote = track.bass[step];
      
      const leadFreq = midiToFreq(midiNote);
      const bassFreq = midiToFreq(bassNote);

      playSynthNote(leadFreq, bassFreq, track.type, step);

      // Trigger UI updates safely
      setCurrentStep(step);

      // Advance sequencer
      sequencerStepRef.current = (step + 1) % 16;
    }, intervalMs);

    return () => {
      if (schedulerTimerId.current) {
        clearInterval(schedulerTimerId.current);
        schedulerTimerId.current = null;
      }
    };
  }, [isPlaying, currentTrackIndex]);

  // Neon visualizer animation
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bars = Array(24).fill(4);

    const drawVisualizer = (time: number) => {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw gridlines
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Update and draw bars based on sequencer active beats
      const spacing = 4;
      const barWidth = (canvas.width - spacing * (bars.length + 1)) / bars.length;

      for (let i = 0; i < bars.length; i++) {
        let targetHeight = 4;
        
        if (isPlaying) {
          // React dynamically to visual pulses based on current steps & active playback
          const activePulse = (currentStep * 3) % bars.length;
          const dist = Math.abs(i - activePulse);
          
          if (dist === 0) {
            targetHeight = 62 + Math.sin(time * 0.05 + i) * 18;
          } else if (dist === 1) {
            targetHeight = 40 + Math.sin(time * 0.03 + i) * 12;
          } else if (dist === 2) {
            targetHeight = 22 + Math.cos(time * 0.04 + i) * 8;
          } else {
            targetHeight = 8 + Math.abs(Math.sin(time * 0.008 + i)) * 14;
          }
        } else {
          // IDLE wave pulse
          targetHeight = 8 + Math.sin(time * 0.003 + i * 0.5) * 6;
        }

        // Smooth decay lerp
        bars[i] += (targetHeight - bars[i]) * 0.25;

        // Colors
        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - bars[i]);
        grad.addColorStop(0, '#7342E2');
        grad.addColorStop(0.5, '#A855F7');
        grad.addColorStop(1, '#67E8F9'); // Cyan glowing tips

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Rounded bars
        ctx.roundRect(
          spacing + i * (barWidth + spacing),
          canvas.height - bars[i],
          barWidth,
          bars[i],
          3
        );
        ctx.fill();

        // Neon Glow Dot
        if (bars[i] > 15) {
          ctx.fillStyle = '#E9D5FF';
          ctx.fillRect(spacing + i * (barWidth + spacing) + barWidth / 2 - 1, canvas.height - bars[i] - 4, 2, 2);
        }
      }

      animId = requestAnimationFrame(drawVisualizer);
    };

    animId = requestAnimationFrame(drawVisualizer);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, currentStep]);

  // Next Track
  const handleNextTrack = () => {
    sequencerStepRef.current = 0;
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  // Prev Track
  const handlePrevTrack = () => {
    sequencerStepRef.current = 0;
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  // Favorite toggle
  const toggleFavorite = (id: string) => {
    setFavoriteTracks(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#192837]/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111827] text-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-purple-500/50 flex flex-col md:flex-row max-h-[92vh]">
        
        {/* Left Side: Active Track Playing detail & Visualizer */}
        <div className="flex-1 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-800 bg-gray-950/80">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="text-xs uppercase tracking-widest font-black font-mono">Bold Radio FM</span>
            </div>
            
            {/* Quick close button for mobile layout */}
            <button
              onClick={onClose}
              className="p-1.5 md:hidden bg-gray-900 hover:bg-red-950 rounded-xl text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Vinyl / Record Spinning Visual */}
          <div className="flex flex-col items-center justify-center py-4 relative">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Rotating glowing border */}
              <div 
                className={`absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-[#7342E2] to-cyan-400 p-0.5 shadow-2xl ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '8s' }}
              />
              
              {/* Dark internal disk */}
              <div className="absolute inset-1.5 rounded-full bg-gray-950 flex items-center justify-center">
                {/* Center label */}
                <div className="w-16 h-16 rounded-full bg-purple-900 border border-purple-400 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute w-4 h-4 rounded-full bg-gray-950" />
                  <Music className="w-5 h-5 text-purple-200 opacity-80" />
                </div>
              </div>

              {/* Orbiting stars */}
              {isPlaying && (
                <div className="absolute -inset-2 pointer-events-none">
                  <Sparkles className="w-5 h-5 text-yellow-400 absolute top-0 left-1/4 animate-bounce" />
                  <Flame className="w-4 h-4 text-red-500 absolute bottom-2 right-4 animate-pulse" />
                </div>
              )}
            </div>

            {/* Title & Artist */}
            <div className="text-center mt-6">
              <h4 className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-100 to-cyan-100 line-clamp-1">
                {isMn ? currentTrack.titleMn : currentTrack.titleEn}
              </h4>
              <p className="text-xs text-purple-400 font-mono mt-1">
                Artist: AI Synthesizer (Bold V9)
              </p>
              <p className="text-[11px] text-gray-400 mt-2 italic px-4">
                {isMn ? currentTrack.descriptionMn : currentTrack.descriptionEn}
              </p>
            </div>
          </div>

          {/* Real-time reactive Audio Visualizer Canvas */}
          <div className="mt-4 rounded-2xl overflow-hidden border border-gray-800 bg-gray-900 h-28 relative">
            <canvas ref={canvasRef} className="w-full h-full block" width={300} height={112} />
            
            {/* Visualizer overlay tag */}
            <div className="absolute top-2 left-3 bg-gray-950/80 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-400 uppercase tracking-widest border border-cyan-800">
              {isPlaying ? `Seq step: ${currentStep + 1}/16 • ${currentTrack.tempo} BPM` : 'Sequencer Idle'}
            </div>
          </div>

          {/* Visualizer Step dots */}
          <div className="flex justify-between gap-1 mt-3 px-2">
            {[...Array(16)].map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 flex-grow rounded transition-all duration-100 ${
                  i === currentStep && isPlaying
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] scale-y-125' 
                    : i % 4 === 0 
                      ? 'bg-purple-800' 
                      : 'bg-gray-800'
                }`}
              />
            ))}
          </div>

        </div>

        {/* Right Side: Tracklist, Playback controls, Volume */}
        <div className="flex-1 p-6 flex flex-col justify-between bg-gray-900/40">
          
          {/* Header */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <ListMusic className="w-4 h-4 text-purple-400" />
              <span>{isMn ? "Аялгууны жагсаалт" : "Synth Tracks"}</span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 bg-gray-800 hover:bg-red-950 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Tracks List */}
          <div className="flex-grow space-y-2 max-h-[220px] md:max-h-[280px] overflow-y-auto pr-1">
            {TRACKS.map((track, idx) => {
              const active = idx === currentTrackIndex;
              return (
                <div 
                  key={track.id}
                  onClick={() => {
                    sequencerStepRef.current = 0;
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    active 
                      ? 'bg-purple-950/40 border-purple-500/50 text-white' 
                      : 'bg-gray-950/20 hover:bg-gray-800/40 border-gray-800/50 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${
                      active ? 'bg-purple-600 text-white' : 'bg-gray-800 group-hover:bg-purple-900/30'
                    }`}>
                      {active && isPlaying ? (
                        <div className="flex items-center gap-0.5 h-4">
                          <span className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <span className="w-0.5 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                          <span className="w-0.5 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                        </div>
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </div>

                    <div className="text-left">
                      <div className="text-xs font-bold line-clamp-1">
                        {isMn ? track.titleMn : track.titleEn}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <span className="text-purple-400 uppercase">{track.type} wave</span>
                        <span>•</span>
                        <span>{track.tempo} BPM</span>
                      </div>
                    </div>
                  </div>

                  {/* Favorite heart */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(track.id);
                    }}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${favoriteTracks[track.id] ? 'text-red-500 fill-red-500' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Controls Panel */}
          <div className="border-t border-gray-800/80 pt-5 mt-4 space-y-4">
            
            {/* Playback Buttons */}
            <div className="flex items-center justify-center gap-5">
              <button
                onClick={handlePrevTrack}
                className="p-2.5 bg-gray-900 border border-gray-800 hover:border-purple-500/40 rounded-full text-gray-400 hover:text-white transition-all active:scale-90 cursor-pointer"
                title={isMn ? "Өмнөх дуу" : "Previous track"}
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 active:scale-95 text-white rounded-full shadow-lg shadow-purple-900/30 transition-all cursor-pointer border border-purple-500/30"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current text-white" />
                ) : (
                  <Play className="w-6 h-6 fill-current text-white translate-x-0.5" />
                )}
              </button>

              <button
                onClick={handleNextTrack}
                className="p-2.5 bg-gray-900 border border-gray-800 hover:border-purple-500/40 rounded-full text-gray-400 hover:text-white transition-all active:scale-90 cursor-pointer"
                title={isMn ? "Дараах дуу" : "Next track"}
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Volume control block */}
            <div className="bg-gray-950/40 p-3 rounded-2xl border border-gray-800/80 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
              </button>
              
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="flex-grow accent-purple-600 h-1 rounded-lg cursor-pointer bg-gray-800"
              />

              <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                {isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            {/* Note instruction info */}
            <div className="text-[10px] text-gray-500 text-center font-mono select-none">
              {isMn 
                ? "💡 Дуунууд нь хөтчөөр шууд үүсгэгддэг тул интернэт ашиглахгүй!"
                : "💡 Synths are computed dynamically inside your browser! Real chiptunes!"}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

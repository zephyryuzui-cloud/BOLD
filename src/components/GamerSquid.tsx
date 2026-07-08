import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Shield, X, Play, Volume2, VolumeX, AlertTriangle, 
  RotateCcw, Skull, Coins, ChevronRight, UserCheck, Eye, EyeOff
} from 'lucide-react';
import { LanguageType } from '../types';

interface GamerSquidProps {
  onClose: () => void;
  language: LanguageType;
}

interface Runner {
  id: string;
  number: string;
  x: number;
  y: number;
  targetX: number;
  speed: number;
  state: 'running' | 'standing' | 'stumbled' | 'dead' | 'finished';
  wobble: number;
  wobbleSpeed: number;
  isPlayer: boolean;
  reactionTime: number; // For AI
  lastStepTime: number;
  gender: 'm' | 'f';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

const LEVELS = [
  {
    num: 1,
    nameMn: 'Үе 1: Эхлэгч (Сургуулийн талбай)',
    nameEn: 'Level 1: Greenhorn (Playground)',
    aiStepProb: 0.02,
    aiReactionMin: 0.40,
    aiReactionMax: 0.60,
    chantSpeedMin: 0.75,
    chantSpeedMax: 1.05,
    prizePerSurvivor: 4.1,
    titleMn: 'Элсэн Цөл',
    titleEn: 'Sandy Arena',
  },
  {
    num: 2,
    nameMn: 'Үе 2: Хашир (Харанхуй талбай)',
    nameEn: 'Level 2: Hardened (Dark Arena)',
    aiStepProb: 0.03,
    aiReactionMin: 0.30,
    aiReactionMax: 0.48,
    chantSpeedMin: 0.95,
    chantSpeedMax: 1.35,
    prizePerSurvivor: 6.2,
    titleMn: 'Шаварлаг Хөндий',
    titleEn: 'Muddy Valley',
  },
  {
    num: 3,
    nameMn: 'Үе 3: Мэргэжил (Манантай хөндий)',
    nameEn: 'Level 3: Professional (Misty Valley)',
    aiStepProb: 0.04,
    aiReactionMin: 0.22,
    aiReactionMax: 0.38,
    chantSpeedMin: 1.15,
    chantSpeedMax: 1.65,
    prizePerSurvivor: 9.5,
    titleMn: 'Бүрхэг Тал',
    titleEn: 'Gloomy Fields',
  },
  {
    num: 4,
    nameMn: 'Үе 4: Элит (Аюултай бүс)',
    nameEn: 'Level 4: Elite (Danger Zone)',
    aiStepProb: 0.05,
    aiReactionMin: 0.15,
    aiReactionMax: 0.30,
    chantSpeedMin: 1.35,
    chantSpeedMax: 2.05,
    prizePerSurvivor: 12.0,
    titleMn: 'Манантай Хорго',
    titleEn: 'Mist Shelter',
  },
  {
    num: 5,
    nameMn: 'Үе 5: Сүүлчийн тулаан (Хүүхэлдэйн Орон)',
    nameEn: 'Level 5: Grand Finale (Palace)',
    aiStepProb: 0.06,
    aiReactionMin: 0.08,
    aiReactionMax: 0.24,
    chantSpeedMin: 1.60,
    chantSpeedMax: 2.60,
    prizePerSurvivor: 20.0,
    titleMn: 'Озин Хүүхэлдэйн Орон',
    titleEn: 'Young-hee Palace',
  },
];

export default function GamerSquid({ onClose, language }: GamerSquidProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameState, setGameState] = useState<'lobby' | 'countdown' | 'playing' | 'gameover' | 'victory'>('lobby');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [prizePool, setPrizePool] = useState(0); // in Billion Tugriks / Dollars
  const [survivorCount, setSurvivorCount] = useState(11); // 10 AI + 1 Player
  const [isMuted, setIsMuted] = useState(false);
  const [playerNumber] = useState('456');
  
  const [level, setLevel] = useState<number>(() => {
    return Number(localStorage.getItem('squid_current_level')) || 1;
  });
  
  // Game control state
  const [lightState, setLightState] = useState<'GREEN' | 'RED'>('GREEN');
  const [chantProgress, setChantProgress] = useState(0); // 0 to 1
  const [lastFoot, setLastFoot] = useState<'LEFT' | 'RIGHT' | null>(null);
  const [stumbleActive, setStumbleActive] = useState(false);
  
  // High scores & stats
  const [bestTime, setBestTime] = useState<number>(() => {
    return Number(localStorage.getItem('squid_best_time')) || 0;
  });
  const [totalWon, setTotalWon] = useState<number>(() => {
    return Number(localStorage.getItem('squid_total_won')) || 0;
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Game engine reference values
  const engineRef = useRef({
    runners: [] as Runner[],
    particles: [] as Particle[],
    playerSpeed: 0,
    playerX: 200,
    playerY: 450, // Starts at bottom of field
    lightState: 'GREEN' as 'GREEN' | 'RED',
    lightTimer: 0,
    chantSpeed: 1.0, // Speed multiplier
    dollAngle: 0, // 0 = looking away (green), Math.PI = looking at players (red)
    targetDollAngle: 0,
    gameTime: 0,
    isMuted: false,
    lastTime: 0,
    shootPulse: 0,
    pinkGuardFlash: 0,
    redDotIntensity: 0,
    gameState: 'lobby' as 'lobby' | 'countdown' | 'playing' | 'gameover' | 'victory',
    timeLeft: 60,
    stumbleActive: false,
    lastFoot: null as 'LEFT' | 'RIGHT' | null,
    level: 1,
  });

  // Localization content
  const t = {
    title: language === 'mn' ? 'Squid Game: Улаан гэрэл, Ногоон гэрэл' : 'Squid Game: Red Light, Green Light',
    rulesTitle: language === 'mn' ? 'Тоглоомын дүрэм' : 'Game Rules',
    rule1: language === 'mn' ? '🟢 НОГООН ГЭРЭЛ асахад урагш гүй. Урагшлахын тулд A болон D товчлууруудыг ээлжлэн дарна уу.' : '🟢 Move forward during GREEN LIGHT. Alternately tap A and D keys to step.',
    rule2: language === 'mn' ? '🔴 УЛААН ГЭРЭЛ асахад хөдөлгөөнөө бүрэн зогсоо. Өчүүхэн төдий хөдөлгөөн ч таныг устгахад хүргэнэ!' : '🔴 STOP completely on RED LIGHT. Any slight movement will get you eliminated instantly!',
    rule3: language === 'mn' ? '🚶‍♂️ Баруун зүүн хөлөө зэрэгцүүлж дарахгүй бол бүдэрч хурд саарна.' : '🚶‍♂️ Keep your rhythm! Tapping the same foot twice in a row causes a stumble.',
    rule4: language === 'mn' ? '⏱️ 60 секундийн дотор барианы улаан шугамыг давах хэрэгтэй.' : '⏱️ Reach the red finish line at the top within 60 seconds.',
    startBtn: language === 'mn' ? 'ТОГЛОХ 🔺' : 'START GAME 🔺',
    prizePot: language === 'mn' ? 'Шагналын Сан' : 'Prize Pool',
    survivors: language === 'mn' ? 'Амьд үлдэгсэд' : 'Survivors',
    sec: language === 'mn' ? 'сек' : 's',
    greenLight: language === 'mn' ? 'НОГООН ГЭРЭЛ' : 'GREEN LIGHT',
    redLight: language === 'mn' ? 'УЛААН ГЭРЭЛ' : 'RED LIGHT',
    stopMsg: language === 'mn' ? 'ЗОГС!' : 'STOP!',
    runMsg: language === 'mn' ? 'ГҮЙ!' : 'RUN!',
    stepLeft: language === 'mn' ? 'Зүүн хөл (A)' : 'Left Foot (A)',
    stepRight: language === 'mn' ? 'Баруун хөл (D)' : 'Right Foot (D)',
    gameoverTitle: language === 'mn' ? 'ТА УСТГАГДЛАА' : 'ELIMINATED',
    gameoverDesc: language === 'mn' ? 'Улаан гэрэл асахад хөдөлсөн тул таныг устгав.' : 'You were shot for moving during Red Light.',
    victoryTitle: language === 'mn' ? 'БАЯР ХҮРГЭЕ! ТА АМЬД ҮЛДЛЭЭ' : 'VICTORY! YOU SURVIVED',
    victoryDesc: language === 'mn' ? 'Та барианд орж амжилттай амьд үлдлээ!' : 'You crossed the finish line safely and survived!',
    restart: language === 'mn' ? 'Дахин оролдох' : 'Try Again',
    bestTimeText: language === 'mn' ? 'Хамгийн шилдэг хугацаа' : 'Personal Best Time',
    totalWonText: language === 'mn' ? 'Нийт цуглуулсан шагнал' : 'Total Prize Accumulation',
    playerLabel: language === 'mn' ? 'Та (Би)' : 'You',
    stumble: language === 'mn' ? 'БҮДЭРЛЭЭ!' : 'STUMBLED!',
    timeUp: language === 'mn' ? 'Хугацаа дууслаа!' : 'Time Out!',
    totalPrize: language === 'mn' ? '45.6 Тэрбум ₮' : '45.6 Billion ₮',
  };

  // Sound Synth Generator
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSynthTone = (freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error", e);
    }
  };

  // Procedural Gunshot sound
  const playGunshot = () => {
    if (isMuted || !audioCtxRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      const bufferSize = ctx.sampleRate * 0.4; // 0.4 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // White noise fill
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
      
      // Bass burst
      playSynthTone(80, 0.25, 'triangle', 0.5);
    } catch (e) {
      console.warn("Gunshot audio error", e);
    }
  };

  // Synthesizing "Mugunghwa kochi pieot seumnida" doll chant notes!
  // G4 (392Hz), G4 (392Hz), A4 (440Hz), G4 (392Hz), D5 (587Hz), D5 (587Hz), C5 (523Hz), A4 (440Hz), G4 (392Hz), G4 (392Hz)
  const chantNotes = [392, 392, 440, 392, 587, 587, 523, 440, 392, 392];
  const chantBeats = [0.8, 0.8, 1.2, 0.8, 1.0, 1.0, 1.0, 0.8, 1.2, 1.5]; // Relative length of note

  const playChantNote = (index: number, noteDuration: number) => {
    if (isMuted || index >= chantNotes.length) return;
    // Cute, slightly robotic square wave for the doll voice
    playSynthTone(chantNotes[index], noteDuration, 'sine', 0.18);
    
    // Add harmonic robotic layer
    setTimeout(() => {
      if (gameState === 'playing' && !isMuted) {
        playSynthTone(chantNotes[index] * 1.5, noteDuration * 0.8, 'triangle', 0.05);
      }
    }, 15);
  };

  // Triggering the next round of chant
  const triggerChantLoop = (speed: number) => {
    if (gameState !== 'playing') return;
    
    let noteIndex = 0;
    const baseDuration = 0.16 / speed; // faster or slower chant duration per beat
    
    const playNext = () => {
      if (gameState !== 'playing' || engineRef.current.lightState === 'RED') return;
      
      if (noteIndex < chantNotes.length) {
        const duration = baseDuration * chantBeats[noteIndex];
        playChantNote(noteIndex, duration);
        setChantProgress((noteIndex + 1) / chantNotes.length);
        
        noteIndex++;
        // Schedule next note
        setTimeout(playNext, duration * 800);
      } else {
        // Chanting complete! Immediately switch to RED LIGHT
        setChantProgress(1);
        switchToRedLight();
      }
    };

    playNext();
  };

  const switchToRedLight = () => {
    const engine = engineRef.current;
    engine.lightState = 'RED';
    engine.targetDollAngle = Math.PI; // Spin doll around
    setLightState('RED');
    
    // Double beep alarm
    playSynthTone(1200, 0.15, 'sawtooth', 0.08);
    setTimeout(() => playSynthTone(1000, 0.25, 'sawtooth', 0.08), 100);

    // Randomize the duration of Red Light (1.5 to 3.2 seconds)
    const redLightDuration = 1500 + Math.random() * 1700;
    
    setTimeout(() => {
      if (gameState === 'playing') {
        switchToGreenLight();
      }
    }, redLightDuration);
  };

  const switchToGreenLight = () => {
    const engine = engineRef.current;
    engine.lightState = 'GREEN';
    engine.targetDollAngle = 0; // Spin doll back
    setLightState('GREEN');
    setChantProgress(0);

    // Friendly green notification beep
    playSynthTone(600, 0.1, 'sine', 0.08);
    
    // Randomize chant speed based on current level configuration
    const currentLvl = engine.level || 1;
    const lvlCfg = LEVELS[currentLvl - 1] || LEVELS[0];
    engine.chantSpeed = lvlCfg.chantSpeedMin + Math.random() * (lvlCfg.chantSpeedMax - lvlCfg.chantSpeedMin);
    
    // Slight pause before chanting starts again
    setTimeout(() => {
      if (gameState === 'playing' && engine.lightState === 'GREEN') {
        triggerChantLoop(engine.chantSpeed);
      }
    }, 400);
  };

  // Start the Game session
  const startGame = (startLvl = level) => {
    initAudio();
    setCountdown(3);
    setGameState('countdown');
    setTimeLeft(60);
    setPrizePool(0);
    setSurvivorCount(11);
    setLastFoot(null);
    setStumbleActive(false);

    // Prepare engine values
    const engine = engineRef.current;
    engine.lightState = 'GREEN';
    engine.chantSpeed = 1.0;
    engine.dollAngle = 0;
    engine.targetDollAngle = 0;
    engine.gameTime = 0;
    engine.playerX = 200;
    engine.playerY = 450;
    engine.playerSpeed = 0;
    engine.particles = [];
    engine.gameState = 'countdown';
    engine.timeLeft = 60;
    engine.stumbleActive = false;
    engine.lastFoot = null;
    engine.level = startLvl;

    const lvlCfg = LEVELS[startLvl - 1] || LEVELS[0];

    // Spawn 10 AI runners
    const aiRunners: Runner[] = Array.from({ length: 10 }, (_, i) => {
      const numbers = ['001', '067', '218', '199', '101', '240', '096', '322', '045', '111'];
      const x = 30 + Math.random() * 340;
      const y = 440 + Math.random() * 25;
      return {
        id: `ai-${i}`,
        number: numbers[i] || `0${100 + i}`,
        x,
        y,
        targetX: x + (Math.random() * 40 - 20),
        speed: 0,
        state: 'standing' as const,
        wobble: Math.random() * Math.PI,
        wobbleSpeed: 0.1 + Math.random() * 0.15,
        isPlayer: false,
        reactionTime: lvlCfg.aiReactionMin + Math.random() * (lvlCfg.aiReactionMax - lvlCfg.aiReactionMin), // how fast they stop on Red Light based on level difficulty
        lastStepTime: 0,
        gender: Math.random() > 0.5 ? 'm' : 'f'
      };
    });

    // Add Player as one of the runners in list
    const playerRunner: Runner = {
      id: 'player',
      number: playerNumber,
      x: 200,
      y: 450,
      targetX: 200,
      speed: 0,
      state: 'standing' as const,
      wobble: 0,
      wobbleSpeed: 0.18,
      isPlayer: true,
      reactionTime: 0,
      lastStepTime: 0,
      gender: 'm'
    };

    engine.runners = [playerRunner, ...aiRunners];
  };

  // Sync core state hooks to engine ref to prevent stale closures in game loop
  useEffect(() => {
    engineRef.current.gameState = gameState;
    engineRef.current.timeLeft = timeLeft;
    engineRef.current.stumbleActive = stumbleActive;
    engineRef.current.lastFoot = lastFoot;
    engineRef.current.level = level;
  }, [gameState, timeLeft, stumbleActive, lastFoot, level]);

  // Countdown clock effect
  useEffect(() => {
    if (gameState === 'countdown') {
      engineRef.current.gameState = 'countdown';
      if (countdown > 0) {
        playSynthTone(500, 0.12, 'sawtooth', 0.1);
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        playSynthTone(1000, 0.4, 'sine', 0.15);
        setGameState('playing');
        engineRef.current.gameState = 'playing';
        
        // Start first chanting cycle shortly
        setTimeout(() => {
          if (engineRef.current.gameState === 'playing' || engineRef.current.gameTime === 0) {
            triggerChantLoop(1.0);
          }
        }, 500);
      }
    }
  }, [gameState, countdown]);

  // Main playing timer count down
  useEffect(() => {
    if (gameState === 'playing') {
      engineRef.current.gameState = 'playing';
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev <= 1 ? 0 : prev - 1;
          engineRef.current.timeLeft = next;
          if (next === 0) {
            clearInterval(timer);
            handleElimination('timeup');
          }
          return next;
        });
        
        // Background rhythmic heartbeat for tension
        playSynthTone(60, 0.1, 'triangle', 0.22);
        setTimeout(() => {
          if (engineRef.current.gameState === 'playing') playSynthTone(50, 0.1, 'triangle', 0.18);
        }, 300);

      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState]);

  // Sync mute state to engine ref
  useEffect(() => {
    engineRef.current.isMuted = isMuted;
  }, [isMuted]);

  // Handle game termination cases
  const handleElimination = (reason: 'shot' | 'timeup') => {
    setGameState('gameover');
    engineRef.current.gameState = 'gameover';
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    // Gruesome defeat notes
    playSynthTone(220, 0.4, 'sawtooth', 0.3);
    setTimeout(() => playSynthTone(147, 0.6, 'sawtooth', 0.35), 300);
  };

  const handleVictory = (completedTime: number) => {
    setGameState('victory');
    engineRef.current.gameState = 'victory';
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }

    const currentLvl = engineRef.current.level || 1;
    const lvlCfg = LEVELS[currentLvl - 1] || LEVELS[0];
    const wonAmount = survivorCount * lvlCfg.prizePerSurvivor;
    setTotalWon(prev => {
      const next = prev + wonAmount;
      localStorage.setItem('squid_total_won', String(next));
      return next;
    });

    if (bestTime === 0 || completedTime < bestTime) {
      setBestTime(completedTime);
      localStorage.setItem('squid_best_time', String(completedTime));
    }

    // Happy Korean folk-like synthesized winning chords
    playSynthTone(523, 0.2, 'sine', 0.2); // C5
    setTimeout(() => playSynthTone(587, 0.2, 'sine', 0.2), 150); // D5
    setTimeout(() => playSynthTone(659, 0.2, 'sine', 0.2), 300); // E5
    setTimeout(() => playSynthTone(784, 0.4, 'sine', 0.25), 450); // G5
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (engine.gameState !== 'playing') return;
      
      const key = e.key.toLowerCase();
      if (key === 'a' || e.key === 'ArrowLeft') {
        performStep('LEFT');
      } else if (key === 'd' || e.key === 'ArrowRight') {
        performStep('RIGHT');
      } else if (key === 'w' || e.key === 'ArrowUp' || key === ' ') {
        // Auto-alternate step for accessibility and fluidity
        const nextFoot = engine.lastFoot === 'LEFT' ? 'RIGHT' : 'LEFT';
        performStep(nextFoot);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Player action: move by stepping
  const performStep = (foot: 'LEFT' | 'RIGHT') => {
    const engine = engineRef.current;
    if (engine.gameState !== 'playing' || engine.stumbleActive) return;

    // Initialize audio on first click
    initAudio();

    const player = engine.runners.find(r => r.isPlayer);
    if (!player || player.state === 'dead' || player.state === 'finished') return;

    const now = Date.now();
    
    // Check for correct alternating rhythm using synchronized engine values
    if (engine.lastFoot === foot) {
      // Stumble! Tapped same foot twice
      engine.stumbleActive = true;
      setStumbleActive(true);
      player.state = 'stumbled';
      player.speed = 0;
      playSynthTone(180, 0.3, 'sawtooth', 0.12); // Dull failure thump
      
      // Release stumble after 800ms
      setTimeout(() => {
        engine.stumbleActive = false;
        setStumbleActive(false);
        if (player.state === 'stumbled') {
          player.state = 'standing';
        }
      }, 800);
      return;
    }

    // Step registered successfully!
    engine.lastFoot = foot;
    setLastFoot(foot);
    player.state = 'running';
    player.lastStepTime = now;

    // Movement impulse (add positive vertical speed towards top Y)
    // Canvas coords: Top is Y=0, Bottom is Y=480. We need to go towards Y=90 (Finish Line)
    // Tuned stride to 5.2 so that movement feels deliberate, responsive, and not too fast
    const stride = 5.2; 
    player.y -= stride;
    player.speed = stride;

    // Slight horizontal sway to feel natural
    const sway = foot === 'LEFT' ? -3.0 : 3.0;
    player.x += sway;
    // Contain player within fences
    player.x = Math.max(25, Math.min(375, player.x));

    // Play physical rustle footsteps
    playSynthTone(120 + Math.random() * 40, 0.05, 'triangle', 0.15);

    // Target tracking violation under RED LIGHT!
    if (engine.lightState === 'RED') {
      // Caught! Gunshot shot after 120ms to make it extremely dramatic
      player.state = 'dead';
      engine.redDotIntensity = 1.0;
      
      setTimeout(() => {
        playGunshot();
        createBloodExplosion(player.x, player.y);
        handleElimination('shot');
      }, 150);
    }
  };

  // Particle creator helper
  const createBloodExplosion = (x: number, y: number, count = 25) => {
    const engine = engineRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      engine.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (1.0 + Math.random() * 1.5), // fly slightly upward
        color: Math.random() > 0.15 ? '#b91c1c' : '#7f1d1d', // rich blood crimson
        size: 1.8 + Math.random() * 2.8,
        life: 0,
        maxLife: 40 + Math.random() * 30
      });
    }
  };

  // Sparkles or dust footprints when running
  const createFootprintParticle = (x: number, y: number) => {
    const engine = engineRef.current;
    engine.particles.push({
      x,
      y,
      vx: (Math.random() * 2 - 1) * 0.4,
      vy: Math.random() * 0.5,
      color: '#d1b894', // sandy beige dust
      size: 1.5 + Math.random() * 2.0,
      life: 0,
      maxLife: 20 + Math.random() * 15
    });
  };

  // Primary animation game loop
  const gameLoop = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = engineRef.current;
    if (engine.lastTime === 0) engine.lastTime = timestamp;
    const dt = (timestamp - engine.lastTime) / 1000;
    engine.lastTime = timestamp;

    // --- PHYSICS & AI UPDATES ---
    
    // Smooth Doll rotation animation
    const angleDiff = engine.targetDollAngle - engine.dollAngle;
    engine.dollAngle += angleDiff * 0.14; // smooth interpolation

    // Particle updater
    engine.particles = engine.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity force pull
      p.vx *= 0.96; // drag
      p.life += 1;
      return p.life < p.maxLife;
    });

    // Count current active AI & player
    let currentAlive = 0;
    let anyAIJustShot = false;

    // Run AI competitor logic
    engine.runners.forEach(runner => {
      if (runner.isPlayer) {
        // Decay player visual speed animation slowly
        runner.speed *= 0.85;
        if (runner.state === 'running' && runner.speed < 0.2) {
          runner.state = 'standing';
        }
        
        // Victory collision check! Passed the creepy Red Line at Y=90
        if (runner.y <= 90 && runner.state !== 'finished' && runner.state !== 'dead') {
          runner.state = 'finished';
          runner.speed = 0;
          const completionTime = 60 - engine.timeLeft;
          handleVictory(completionTime);
        }

        if (runner.state !== 'dead') currentAlive++;
        return;
      }

      // AI Runner behaviors
      if (runner.state === 'dead') return;

      if (runner.state === 'finished') {
        // Walk slow into safe end zone
        runner.y -= 0.6;
        runner.wobble += runner.wobbleSpeed;
        return;
      }

      currentAlive++;

      // AI stepping decision logic based on Light State
      const now = Date.now();
      if (engine.lightState === 'GREEN') {
        const currentLvl = engine.level || 1;
        const lvlCfg = LEVELS[currentLvl - 1] || LEVELS[0];
        // Decides to walk or run based on level-specific step probability
        if (Math.random() < lvlCfg.aiStepProb && now - runner.lastStepTime > 300) {
          runner.state = 'running';
          // Moderate, balanced AI stride to avoid moving too fast
          const stride = 1.4 + Math.random() * 2.2;
          runner.y -= stride;
          runner.speed = stride;
          runner.lastStepTime = now;
          runner.wobble += runner.wobbleSpeed;
          
          if (Math.random() < 0.3) {
            createFootprintParticle(runner.x, runner.y + 12);
          }
        }
      } else {
        // RED LIGHT ACTIVE
        // AI Reaction window check
        const elapsedSinceRed = now - runner.lastStepTime;
        
        // If AI was moving and fails to halt in time within its reaction latency window
        if (runner.speed > 0.05) {
          const delayInSeconds = (now - runner.lastStepTime) / 1000;
          if (delayInSeconds > runner.reactionTime) {
            // Eliminated AI!
            runner.state = 'dead';
            runner.speed = 0;
            anyAIJustShot = true;
            engine.pinkGuardFlash = 15; // flash gun nozzle visual

            // Spawn targeted sniper laser
            engine.shootPulse = 8;
            
            // Draw death burst
            setTimeout(() => {
              playGunshot();
              createBloodExplosion(runner.x, runner.y);
            }, 50 + Math.random() * 150);
          }
        }
      }

      // Slow down AI speed
      runner.speed *= 0.88;
      if (runner.speed < 0.1 && runner.state === 'running') {
        runner.state = 'standing';
      }

      // Did AI cross line?
      if (runner.y <= 90 && runner.state !== 'finished') {
        runner.state = 'finished';
        runner.speed = 0;
      }
    });

    if (anyAIJustShot) {
      // Increment financial bounty
      setPrizePool(prev => prev + 4.1);
      setSurvivorCount(currentAlive);
    }

    // --- SCREEN RENDER ---

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Field Background based on level difficulty
    const currentLevelNum = engine.level || 1;
    let fieldColor = '#dfc49f'; // Level 1 default (Sandy Arena)
    if (currentLevelNum === 2) fieldColor = '#c2a07c'; // Level 2 (Muddy Valley)
    else if (currentLevelNum === 3) fieldColor = '#9a8b7a'; // Level 3 (Gloomy Fields)
    else if (currentLevelNum === 4) fieldColor = '#7e786e'; // Level 4 (Mist Shelter)
    else if (currentLevelNum === 5) fieldColor = '#9d7c58'; // Level 5 (Young-hee Palace)
    
    ctx.fillStyle = fieldColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground texture lines / cracks
    ctx.strokeStyle = '#d0b289';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
      ctx.moveTo(0, i * 90);
      ctx.lineTo(canvas.width, i * 90);
    }
    ctx.stroke();

    // Creepy high outer concrete safety walls
    ctx.fillStyle = '#64748b'; // stone grey
    ctx.fillRect(0, 0, 18, canvas.height);
    ctx.fillRect(canvas.width - 18, 0, 18, canvas.height);
    
    // Wall brick seams
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(18, y);
      ctx.moveTo(canvas.width - 18, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // 2. Draw Creepy Pink Fences & Dead Trees far away
    ctx.strokeStyle = '#ec4899'; // squid game hot pink
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, 90);
    ctx.lineTo(canvas.width - 18, 90);
    ctx.stroke();

    // The iconic Dead Tree next to the Doll
    ctx.strokeStyle = '#3b2314';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(85, 90);
    ctx.lineTo(85, 45); // trunk
    ctx.lineTo(75, 30); // branches
    ctx.moveTo(85, 60);
    ctx.lineTo(95, 45);
    ctx.stroke();

    // 3. Draw iconic Creepy Giant Doll (Young-hee) at Y=45, X=200
    ctx.save();
    ctx.translate(200, 50);
    
    // Rotating her head based on DollAngle (Math.PI looking at player, 0 looking away)
    const backAngle = engine.dollAngle;
    
    // A. Dress (Orange pinafore over yellow collar shirt)
    ctx.fillStyle = '#f59e0b'; // yellow arms/shoulders
    ctx.beginPath();
    ctx.arc(-8, 12, 4, 0, Math.PI * 2);
    ctx.arc(8, 12, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ea580c'; // orange dress body
    ctx.beginPath();
    ctx.moveTo(-12, 14);
    ctx.lineTo(12, 14);
    ctx.lineTo(18, 38);
    ctx.lineTo(-18, 38);
    ctx.closePath();
    ctx.fill();

    // White socks & black mary-janes
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-8, 38, 5, 8);
    ctx.fillRect(3, 38, 5, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-10, 44, 8, 4);
    ctx.fillRect(2, 44, 8, 4);

    // B. Doll Head
    ctx.save();
    ctx.translate(0, 0); // Center of face
    
    // Smooth transition simulation for looking back
    const isLookingAtPlayer = Math.abs(backAngle) > Math.PI / 2;
    
    if (isLookingAtPlayer) {
      // --- CREEPY DOLL FACE LOOKING AT YOU ---
      // Flesh circle base
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      // Rosy blush cheeks
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.beginPath();
      ctx.arc(-7, 3, 3, 0, Math.PI * 2);
      ctx.arc(7, 3, 3, 0, Math.PI * 2);
      ctx.fill();

      // Dead black eyes
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
      ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Glowing surveillance lasers scanner effect (RED SCANNER BEAMS!)
      if (engine.lightState === 'RED') {
        const pulse = Math.abs(Math.sin(Date.now() * 0.02));
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.45 + pulse * 0.4})`;
        ctx.lineWidth = 1.2;
        
        // Scan line sweep down field
        ctx.beginPath();
        ctx.moveTo(-5, -2);
        ctx.lineTo(-200 + Math.sin(Date.now()*0.01) * 300, 400);
        ctx.moveTo(5, -2);
        ctx.lineTo(200 + Math.cos(Date.now()*0.01) * 300, 400);
        ctx.stroke();

        // Warning red glow eyes
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(-5, -2, 1.2, 0, Math.PI * 2);
        ctx.arc(5, -2, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Small creepy straight line mouth
      ctx.fillStyle = '#be123c';
      ctx.fillRect(-3, 4, 6, 1.8);

      // Pigtails Hair
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(-11, -8, 6, 0, Math.PI * 2);
      ctx.arc(11, -8, 6, 0, Math.PI * 2);
      ctx.fill();
      // Side hair bangs
      ctx.fillRect(-13, -12, 26, 6);
      ctx.fillRect(-13, -6, 4, 10);
      ctx.fillRect(9, -6, 4, 10);
      
      // Pink hair bow
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(-3, -14, 6, 3);
    } else {
      // --- DOLL BACK OF HEAD LOOKING AWAY ---
      // Jet black hair bowl-cut
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -1, 13.5, 0, Math.PI * 2);
      ctx.fill();

      // Pigtails on side
      ctx.beginPath();
      ctx.arc(-13, 2, 5, 0, Math.PI * 2);
      ctx.arc(13, 2, 5, 0, Math.PI * 2);
      ctx.fill();

      // Purple hair bow tie knots
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(-14, -2, 3, 3);
      ctx.fillRect(11, -2, 3, 3);
    }
    
    ctx.restore();
    ctx.restore();

    // 4. Draw Pink Guards on Left & Right of Doll
    // Guard 1: Left
    ctx.fillStyle = '#db2777'; // hot pink jumpsuits
    ctx.fillRect(145, 52, 12, 25);
    ctx.fillStyle = '#0f172a'; // black mask
    ctx.beginPath();
    ctx.arc(151, 46, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff'; // White symbol
    ctx.lineWidth = 1;
    // Circle mask symbol
    ctx.beginPath();
    ctx.arc(151, 46, 2.5, 0, Math.PI * 2);
    ctx.stroke();
    // Sniper rifle barrel
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(151, 52);
    ctx.lineTo(155, 66);
    ctx.stroke();

    // Guard 2: Right
    ctx.fillStyle = '#db2777';
    ctx.fillRect(243, 52, 12, 25);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(249, 46, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    // Triangle mask symbol
    ctx.beginPath();
    ctx.moveTo(249, 43.5);
    ctx.lineTo(246, 48.5);
    ctx.lineTo(252, 48.5);
    ctx.closePath();
    ctx.stroke();
    // Sniper rifle
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(249, 52);
    ctx.lineTo(245, 66);
    ctx.stroke();

    // Visual muzzle flash if sniper is firing at someone
    if (engine.pinkGuardFlash > 0) {
      engine.pinkGuardFlash--;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(155, 66, 6, 0, Math.PI * 2);
      ctx.arc(245, 66, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(155, 66, 3, 0, Math.PI * 2);
      ctx.arc(245, 66, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Draw Target Red Line behind Doll
    ctx.fillStyle = 'rgba(220, 38, 38, 0.25)'; // thick transparent red zone
    ctx.fillRect(18, 86, canvas.width - 36, 6);

    // 6. Draw Particles (Blood, sand dust)
    engine.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    });

    // Sort runners by Y so those closer to bottom are drawn in front (proper overlap depth)
    const sortedRunners = [...engine.runners].sort((a, b) => a.y - b.y);

    // 7. Draw Runners (Competitors + Player)
    sortedRunners.forEach(r => {
      ctx.save();
      ctx.translate(r.x, r.y);

      // Body sway wobble when walking
      const walkBounce = r.state === 'running' ? Math.abs(Math.sin(r.wobble * 2)) * 3 : 0;
      const angleSway = r.state === 'running' ? Math.sin(r.wobble) * 0.08 : 0;
      ctx.rotate(angleSway);

      if (r.state === 'dead') {
        // --- DEAD PLAYER RENDERED ON FLOOR ---
        ctx.fillStyle = '#047857'; // green track suit body laying flat
        ctx.fillRect(-10, 6, 18, 5);
        ctx.fillStyle = 'rgba(185, 28, 28, 0.8)'; // blood pool under body
        ctx.beginPath();
        ctx.arc(0, 10, 12 + Math.sin(Date.now() * 0.005) * 2, 0, Math.PI * 2);
        ctx.fill();

        // Rotting green pants leg crumpled
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(-9, 11, 4, 8);
        ctx.fillRect(5, 11, 4, 7);

        // Face flat on soil
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(-2, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        // Black hair
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-2, -2, 5.5, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        return;
      }

      // --- ALIVE COMPETITORS ---

      // Highlights Player with a subtle neon locator triangle / circle under feet
      if (r.isPlayer) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 12, 10 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
        ctx.stroke();

        // Miniature tag saying "YOU / БИ"
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 8px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(t.playerLabel, 0, -25);
      }

      // 1. Draw Leg Pants (Dark teal green)
      ctx.fillStyle = '#064e3b'; // deeper green shadow
      const leftLegOffset = r.state === 'running' ? Math.sin(r.wobble) * 4 : 0;
      const rightLegOffset = r.state === 'running' ? -Math.sin(r.wobble) * 4 : 0;
      ctx.fillRect(-6, 2 - walkBounce + leftLegOffset, 4, 10);
      ctx.fillRect(2, 2 - walkBounce + rightLegOffset, 4, 10);
      
      // White sneakers
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-7, 10 - walkBounce + leftLegOffset, 5, 3);
      ctx.fillRect(1, 10 - walkBounce + rightLegOffset, 5, 3);

      // 2. Torso Tracksuit (Green 456 jacket)
      ctx.fillStyle = '#047857'; // tracksuit green
      ctx.fillRect(-9, -12 - walkBounce, 18, 15);

      // White zip line down middle
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-0.8, -12 - walkBounce, 1.6, 15);

      // Competitor ID Number on chest / back (White circular patch)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -6 - walkBounce, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(r.number, 0, -5.5 - walkBounce);

      // Arms swing
      ctx.fillStyle = '#047857';
      const armSwing = r.state === 'running' ? Math.sin(r.wobble) * 6 : 0;
      ctx.fillRect(-12, -11 - walkBounce + armSwing, 3, 10);
      ctx.fillRect(9, -11 - walkBounce - armSwing, 3, 10);

      // 3. Human Head & Face
      ctx.fillStyle = '#fdba74'; // warm peach flesh
      ctx.beginPath();
      ctx.arc(0, -18 - walkBounce, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Hair (Black or Brown cuts)
      ctx.fillStyle = r.gender === 'm' ? '#0f172a' : '#78350f';
      ctx.beginPath();
      ctx.arc(0, -19 - walkBounce, 6, Math.PI, Math.PI * 2);
      ctx.fill();
      if (r.gender === 'f') {
        // give girls ponytails
        ctx.fillRect(-8, -17 - walkBounce, 3, 6);
        ctx.fillRect(5, -17 - walkBounce, 3, 6);
      }

      // If stumbling, show "💥" or stars over head
      if (r.state === 'stumbled' && r.isPlayer) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("⚠️", 0, -29);
      }

      // Draw red tracking laser lock-on if caught moving in Red Light
      if (engine.lightState === 'RED' && r.speed > 0.05 && !r.isPlayer) {
        // Red dot visual on torso
        const dotPulse = Math.sin(Date.now() * 0.04) > 0;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, -6 - walkBounce, 5 + Math.sin(Date.now()*0.02)*3, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = dotPulse ? '#ffffff' : '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -6 - walkBounce, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // Keep running animation loop
    if (engine.gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  };

  // Bind game loop on launch - only depends on gameState to avoid parallel loop race issues
  useEffect(() => {
    if (gameState === 'playing') {
      engineRef.current.lastTime = 0; // Reset frame timer
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameState]);

  return (
    <div id="squid-game-modal" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div 
        id="squid-game-panel" 
        className="relative w-full max-w-4xl bg-gradient-to-b from-[#111827] to-[#030712] border-2 border-[#ec4899] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[95vh] md:h-auto md:max-h-[85vh]"
        style={{ boxShadow: '0 0 35px rgba(236,72,153,0.3)' }}
      >
        {/* Neon Pink Bar Decorator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ec4899] to-transparent" />

        {/* --- LEFT SIDE: GAMEPLAY PORT / SCREEN (CANVAS) --- */}
        <div id="squid-canvas-wrapper" className="relative flex-1 bg-[#1e293b] flex items-center justify-center p-3 border-b md:border-b-0 md:border-r border-[#1f2937] overflow-hidden min-h-[300px] sm:min-h-[440px]">
          {/* Absolute Background atmospheric noise */}
          <div className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-10" />
          
          <canvas
            id="squid-viewport"
            ref={canvasRef}
            width={400}
            height={480}
            className="rounded-lg bg-[#dfc49f] border-4 border-black shadow-inner max-w-full aspect-[400/480] h-full object-contain cursor-pointer"
            onClick={() => {
              const engine = engineRef.current;
              if (engine.gameState !== 'playing') return;
              // Auto-alternate step on click/tap anywhere on the canvas
              const nextFoot = engine.lastFoot === 'LEFT' ? 'RIGHT' : 'LEFT';
              performStep(nextFoot);
            }}
          />

          {/* GREEN / RED LIGHT ATMOSPHERIC SCREEN GLOW */}
          <div 
            className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
              gameState === 'playing' 
                ? lightState === 'RED' 
                  ? 'bg-red-500/10 shadow-[inset_0_0_50px_rgba(239,68,68,0.2)]' 
                  : 'bg-emerald-500/5 shadow-[inset_0_0_50px_rgba(16,185,129,0.1)]'
                : ''
            }`} 
          />

          {/* Play/Lobby overlay */}
          <AnimatePresence>
            {gameState === 'lobby' && (
              <motion.div 
                id="squid-lobby-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#ec4899]/15 flex items-center justify-center border-2 border-[#ec4899] mb-4 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                  <Skull className="w-8 h-8 text-[#ec4899]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-widest uppercase mb-1">
                  SQUID GAME
                </h2>
                <p className="text-xs text-[#ec4899] font-mono tracking-widest uppercase mb-6">
                  {language === 'mn' ? 'УЛААН ГЭРЭЛ, НОГООН ГЭРЭЛ' : 'RED LIGHT, GREEN LIGHT'}
                </p>

                {/* Score stats */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-3.5 bg-slate-900/85 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-center border-r border-slate-800">
                    <p className="text-[9px] text-slate-500 font-mono uppercase">{t.bestTimeText}</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">
                      {bestTime > 0 ? `${bestTime.toFixed(1)} ${t.sec}` : '---'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-slate-500 font-mono uppercase">{t.totalWonText}</p>
                    <p className="text-sm font-bold text-yellow-400 font-mono">
                      {totalWon > 0 ? `${totalWon.toFixed(1)}B ₮` : '0 ₮'}
                    </p>
                  </div>
                </div>

                {/* Level Selection */}
                <div className="w-full max-w-sm mb-4 bg-slate-900/85 p-2.5 rounded-xl border border-slate-800 text-left">
                  <p className="text-[9px] text-[#ec4899] font-mono uppercase tracking-widest mb-1.5 font-black text-center">
                    {language === 'mn' ? 'ҮЕ СОНГОХ' : 'SELECT LEVEL'}
                  </p>
                  <div className="flex gap-1 justify-between">
                    {[1, 2, 3, 4, 5].map((lvlNum) => {
                      const lvl = LEVELS[lvlNum - 1];
                      const isSelected = level === lvlNum;
                      return (
                        <button
                          key={lvlNum}
                          onClick={() => {
                            setLevel(lvlNum);
                            localStorage.setItem('squid_current_level', String(lvlNum));
                            playSynthTone(400 + lvlNum * 50, 0.1, 'sine', 0.1);
                          }}
                          className={`flex-1 py-1 text-xs font-black rounded transition-all border ${
                            isSelected 
                              ? 'bg-[#ec4899] text-white border-[#ec4899] shadow-[0_0_8px_rgba(236,72,153,0.3)]' 
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {lvlNum}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1.5 text-center font-bold">
                    {language === 'mn' ? LEVELS[level - 1].nameMn : LEVELS[level - 1].nameEn}
                  </p>
                  <p className="text-[8px] text-slate-500 text-center italic">
                    {language === 'mn' 
                      ? `${LEVELS[level - 1].titleMn} • Дууны хурд: ${LEVELS[level - 1].chantSpeedMin}x-${LEVELS[level - 1].chantSpeedMax}x` 
                      : `${LEVELS[level - 1].titleEn} • Chant Speed: ${LEVELS[level - 1].chantSpeedMin}x-${LEVELS[level - 1].chantSpeedMax}x`}
                  </p>
                </div>

                <button
                  id="squid-lobby-start-btn"
                  onClick={() => startGame(level)}
                  className="px-8 py-3 rounded-full text-sm font-bold bg-[#ec4899] text-white hover:bg-pink-600 transition-all duration-200 cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(236,72,153,0.4)] flex items-center gap-2 group"
                >
                  <span>{t.startBtn}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            )}

            {gameState === 'countdown' && (
              <motion.div 
                id="squid-countdown-overlay"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none"
              >
                <div className="text-center">
                  <motion.p 
                    key={countdown}
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-8xl font-black text-[#ec4899] font-mono drop-shadow-[0_4px_15px_rgba(236,72,153,0.4)]"
                  >
                    {countdown}
                  </motion.p>
                  <p className="text-xs text-white/70 font-mono uppercase tracking-widest mt-2">
                    {language === 'mn' ? 'Бэлд...' : 'GET READY...'}
                  </p>
                </div>
              </motion.div>
            )}

            {gameState === 'gameover' && (
              <motion.div 
                id="squid-defeat-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-red-950/40 flex items-center justify-center border-2 border-red-500 mb-4 animate-bounce">
                  <Skull className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-3xl font-black text-red-500 uppercase tracking-wider mb-2">
                  {t.gameoverTitle}
                </h3>
                <p className="text-sm text-slate-400 max-w-xs mb-6">
                  {t.gameoverDesc}
                </p>

                <button
                  id="squid-defeat-retry-btn"
                  onClick={() => startGame(level)}
                  className="px-6 py-3 rounded-full text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.restart}</span>
                </button>
              </motion.div>
            )}

            {gameState === 'victory' && (
              <motion.div 
                id="squid-victory-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-950/40 flex items-center justify-center border-2 border-emerald-500 mb-3 animate-bounce">
                  <Trophy className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 uppercase tracking-wider mb-0.5">
                  {t.victoryTitle}
                </h3>
                <p className="text-xs text-slate-300 mb-4">
                  {t.victoryDesc}
                </p>

                <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl max-w-xs w-full mb-5 text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-mono mb-1">
                    {language === 'mn' ? 'Үеийн Шагнал' : 'Level Prize Gained'}
                  </p>
                  <p className="text-2xl font-black text-yellow-400 font-mono tracking-wide">
                    + {(survivorCount * (LEVELS[level - 1]?.prizePerSurvivor || 4.1)).toFixed(1)}B ₮
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    {language === 'mn' 
                      ? `Амьд үлдсэн тоглогч бүр ${LEVELS[level - 1]?.prizePerSurvivor || 4.1} Тэрбум ₮` 
                      : `${LEVELS[level - 1]?.prizePerSurvivor || 4.1} Billion ₮ for each survivor`}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-sm">
                  {level < 5 ? (
                    <>
                      <button
                        id="squid-victory-next-btn"
                        onClick={() => {
                          const nextLvl = level + 1;
                          setLevel(nextLvl);
                          localStorage.setItem('squid_current_level', String(nextLvl));
                          startGame(nextLvl);
                        }}
                        className="w-full sm:flex-1 px-6 py-3 rounded-full text-sm font-extrabold bg-[#ec4899] text-[#111827] bg-white hover:bg-pink-600 hover:text-white transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                      >
                        <span>{language === 'mn' ? 'Дараагийн үе ➡️' : 'Next Level ➡️'}</span>
                      </button>

                      <button
                        id="squid-victory-retry-btn"
                        onClick={() => startGame(level)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 border border-slate-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{language === 'mn' ? 'Дахин тоглуулах' : 'Replay'}</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center w-full">
                      <p className="text-xs text-yellow-400 font-extrabold animate-pulse mb-3 uppercase tracking-wider">
                        👑 {language === 'mn' ? 'ТА БҮХ ҮЕИЙГ ДАВЖ АВАРГА БОЛЛОО!' : 'YOU CONQUERED ALL LEVELS! CHAMPION!'}
                      </p>
                      <button
                        id="squid-victory-reset-btn"
                        onClick={() => {
                          setLevel(1);
                          localStorage.setItem('squid_current_level', '1');
                          startGame(1);
                        }}
                        className="w-full px-6 py-3 rounded-full text-sm font-extrabold bg-yellow-500 text-slate-950 hover:bg-yellow-400 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                      >
                        <span>🏆 {language === 'mn' ? '1-р үеэс дахин эхлэх' : 'Restart from Level 1'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- RIGHT SIDE: CONTROLS, PANEL CONTROLS & STATS --- */}
        <div id="squid-stats-panel" className="w-full md:w-80 flex flex-col p-4 sm:p-5 bg-slate-950 text-white select-none">
          {/* Header row with sound toggle and close button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xl">🦑</span>
              <span className="font-extrabold text-sm uppercase tracking-wider text-[#ec4899]">
                SQUID GAME
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                id="squid-mute-btn"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                id="squid-close-btn"
                onClick={onClose}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* HUD statistics while playing */}
          <div id="squid-hud" className="space-y-3 mb-4">
            {/* Tense light state banner */}
            <div 
              id="squid-state-banner"
              className={`rounded-xl p-3 border-2 flex items-center justify-between transition-all duration-300 ${
                gameState === 'playing'
                  ? lightState === 'GREEN'
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-pulse'
                    : 'bg-red-950/40 border-red-500/80 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${gameState === 'playing' ? (lightState === 'GREEN' ? 'bg-emerald-400' : 'bg-red-500') : 'bg-slate-500'}`} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  {gameState === 'playing' ? (lightState === 'GREEN' ? t.greenLight : t.redLight) : 'STANDBY'}
                </span>
              </div>
              <span className="text-base font-black font-mono">
                {gameState === 'playing' ? (lightState === 'GREEN' ? t.runMsg : t.stopMsg) : '---'}
              </span>
            </div>

            {/* Giant Doll progress chant bar */}
            {gameState === 'playing' && (
              <div id="squid-chant-bar-container" className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-1 text-[10px] font-mono text-slate-400 uppercase">
                  <span>{language === 'mn' ? 'Хүүхэлдэйн дуу' : 'Doll Chant Track'}</span>
                  <span className="text-pink-500">{Math.round(chantProgress * 100)}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-100 ${lightState === 'GREEN' ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${chantProgress * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Triple grid panel (Level, Timer & Survivor Count) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-center">
                <p className="text-[8px] text-[#ec4899] font-mono uppercase tracking-wider font-extrabold">⭐ {language === 'mn' ? 'ҮЕ' : 'LEVEL'}</p>
                <p className="text-lg font-black font-mono text-[#ec4899] mt-0.5">
                  {level} / 5
                </p>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-center">
                <p className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">⏱️ {language === 'mn' ? 'ХУГАЦАА' : 'TIME'}</p>
                <p className={`text-lg font-bold font-mono mt-0.5 ${timeLeft <= 10 && gameState === 'playing' ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
                  {timeLeft}s
                </p>
              </div>

              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 text-center">
                <p className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">💚 {language === 'mn' ? 'АМЬД' : 'ALIVE'}</p>
                <p className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                  {survivorCount}
                </p>
              </div>
            </div>

            {/* Prize pool money pot */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 border border-yellow-400/30">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-mono uppercase">{t.prizePot}</p>
                  <p className="text-sm font-bold text-slate-200">
                    {language === 'mn' ? 'Хуримтлагдсан' : 'Accumulated'}
                  </p>
                </div>
              </div>
              <p className="text-xl font-black text-yellow-400 font-mono tracking-tight">
                {prizePool > 0 ? `${prizePool.toFixed(1)}B ₮` : '0B ₮'}
              </p>
            </div>
          </div>

          {/* Interactive controls */}
          <div id="squid-control-pad" className="flex-1 flex flex-col justify-end mt-2 space-y-3">
            {gameState === 'playing' ? (
              <div className="space-y-3">
                {/* Rhythm / stumble notification indicator */}
                <div className="h-4 text-center">
                  <AnimatePresence>
                    {stumbleActive && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-500 font-bold tracking-wider"
                      >
                        ⚠️ {t.stumble}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {/* Left & Right active tap foot buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    id="squid-step-left-btn"
                    onClick={() => performStep('LEFT')}
                    disabled={stumbleActive}
                    className={`h-20 sm:h-24 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none active:scale-95 ${
                      stumbleActive 
                        ? 'bg-slate-900 border-red-500/20 text-slate-600 cursor-not-allowed'
                        : lastFoot === 'LEFT'
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-500 opacity-60'
                          : 'bg-slate-900 border-[#ec4899] hover:border-pink-500 text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">🦶</span>
                    <span className="text-xs tracking-wider font-semibold uppercase">{t.stepLeft}</span>
                  </button>

                  <button
                    id="squid-step-right-btn"
                    onClick={() => performStep('RIGHT')}
                    disabled={stumbleActive}
                    className={`h-20 sm:h-24 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none active:scale-95 ${
                      stumbleActive 
                        ? 'bg-slate-900 border-red-500/20 text-slate-600 cursor-not-allowed'
                        : lastFoot === 'RIGHT'
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-500 opacity-60'
                          : 'bg-slate-900 border-[#ec4899] hover:border-pink-500 text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-2xl">🦶</span>
                    <span className="text-xs tracking-wider font-semibold uppercase">{t.stepRight}</span>
                  </button>
                </div>

                {/* Keyboard keys helper guide */}
                <p className="text-center text-[10px] text-slate-500 font-mono">
                  {language === 'mn' 
                    ? '💡 Гараараа A болон D товчлуурыг ээлжилж даран урагшилж болно!' 
                    : '💡 Use your keyboard A and D keys to alternate steps quickly!'}
                </p>
              </div>
            ) : (
              // Instructions rulebook panel
              <div id="squid-rulebook" className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-left space-y-3">
                <p className="text-xs font-bold text-[#ec4899] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span>{t.rulesTitle}</span>
                </p>
                <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
                  <p>{t.rule1}</p>
                  <p className="text-red-400">{t.rule2}</p>
                  <p>{t.rule3}</p>
                  <p>{t.rule4}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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

const generateDalgonaPoints = (shape: string) => {
  const points: { x: number; y: number; carved: boolean }[] = [];
  if (shape === 'triangle') {
    const v = [
      { x: 150, y: 70 },
      { x: 75, y: 210 },
      { x: 225, y: 210 }
    ];
    // Interpolate side 1
    for (let i = 0; i < 6; i++) {
      points.push({ x: v[0].x + (v[1].x - v[0].x) * (i / 6), y: v[0].y + (v[1].y - v[0].y) * (i / 6), carved: false });
    }
    // Interpolate side 2
    for (let i = 0; i < 6; i++) {
      points.push({ x: v[1].x + (v[2].x - v[1].x) * (i / 6), y: v[1].y + (v[2].y - v[1].y) * (i / 6), carved: false });
    }
    // Interpolate side 3
    for (let i = 0; i < 6; i++) {
      points.push({ x: v[2].x + (v[0].x - v[2].x) * (i / 6), y: v[2].y + (v[0].y - v[2].y) * (i / 6), carved: false });
    }
  } else if (shape === 'circle') {
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      points.push({
        x: 150 + 70 * Math.cos(angle),
        y: 150 + 70 * Math.sin(angle),
        carved: false
      });
    }
  } else if (shape === 'star') {
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 80 : 35;
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      points.push({
        x: 150 + r * Math.cos(angle),
        y: 150 + r * Math.sin(angle),
        carved: false
      });
      // Interpolate midpoint
      const nextR = (i + 1) % 2 === 0 ? 80 : 35;
      const nextAngle = ((i + 1) * Math.PI) / 5 - Math.PI / 2;
      const midX = (150 + r * Math.cos(angle) + (150 + nextR * Math.cos(nextAngle))) / 2;
      const midY = (150 + r * Math.sin(angle) + (150 + nextR * Math.sin(nextAngle))) / 2;
      points.push({ x: midX, y: midY, carved: false });
    }
  } else {
    // umbrella
    // Canopy arc
    for (let i = 0; i <= 8; i++) {
      const angle = -Math.PI + (i * Math.PI) / 8;
      points.push({
        x: 150 + 75 * Math.cos(angle),
        y: 150 + 55 * Math.sin(angle),
        carved: false
      });
    }
    // Bottom waves
    for (let i = 0; i <= 4; i++) {
      points.push({ x: 75 + i * 37.5, y: 150, carved: false });
    }
    // Handle stem
    points.push({ x: 150, y: 165, carved: false });
    points.push({ x: 150, y: 185, carved: false });
    points.push({ x: 150, y: 205, carved: false });
    points.push({ x: 140, y: 215, carved: false });
    points.push({ x: 125, y: 210, carved: false });
  }
  return points;
};

const LEVELS = [
  {
    num: 1,
    nameMn: '1-р Тоглоом: Улаан гэрэл, Ногоон гэрэл',
    nameEn: 'Game 1: Red Light, Green Light',
    aiStepProb: 0.02,
    aiReactionMin: 0.40,
    aiReactionMax: 0.60,
    chantSpeedMin: 0.75,
    chantSpeedMax: 1.05,
    prizePerSurvivor: 4.1,
    titleMn: 'Сургуулийн талбай',
    titleEn: 'Playground',
  },
  {
    num: 2,
    nameMn: '2-р Тоглоом: Чихэрний хээ (Dalgona)',
    nameEn: 'Game 2: Honeycomb Candy (Dalgona)',
    aiStepProb: 0.03,
    aiReactionMin: 0.30,
    aiReactionMax: 0.48,
    chantSpeedMin: 0.95,
    chantSpeedMax: 1.35,
    prizePerSurvivor: 6.2,
    titleMn: 'Тамгатай Далгона',
    titleEn: 'Stamped Dalgona',
  },
  {
    num: 3,
    nameMn: '3-р Тоглоом: Олс таталт',
    nameEn: 'Game 3: Tug of War',
    aiStepProb: 0.04,
    aiReactionMin: 0.22,
    aiReactionMax: 0.38,
    chantSpeedMin: 1.15,
    chantSpeedMax: 1.65,
    prizePerSurvivor: 9.5,
    titleMn: 'Олсны Талбай',
    titleEn: 'Tug Platform',
  },
  {
    num: 4,
    nameMn: '4-р Тоглоом: Марблс (Тэгш Сондгой)',
    nameEn: 'Game 4: Marbles (Odd or Even)',
    aiStepProb: 0.05,
    aiReactionMin: 0.15,
    aiReactionMax: 0.30,
    chantSpeedMin: 1.35,
    chantSpeedMax: 2.05,
    prizePerSurvivor: 12.0,
    titleMn: 'Гэр хороолол',
    titleEn: 'Alleyway',
  },
  {
    num: 5,
    nameMn: '5-р Тоглоом: Шилэн гүүр',
    nameEn: 'Game 5: Glass Stepping Stones',
    aiStepProb: 0.06,
    aiReactionMin: 0.08,
    aiReactionMax: 0.24,
    chantSpeedMin: 1.60,
    chantSpeedMax: 2.60,
    prizePerSurvivor: 20.0,
    titleMn: 'Шилэн талбар',
    titleEn: 'Glass Canopy',
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

  // ==================== SUB-GAMES STATE ====================
  // Level 2: Dalgona
  const [dalgonaShape, setDalgonaShape] = useState<'triangle' | 'circle' | 'star' | 'umbrella'>('triangle');
  const [dalgonaPoints, setDalgonaPoints] = useState<{ x: number; y: number; carved: boolean }[]>([]);
  const [dalgonaIntegrity, setDalgonaIntegrity] = useState(100);
  const [dalgonaLicks, setDalgonaLicks] = useState(0);

  // Level 3: Tug of War
  const [tugSlider, setTugSlider] = useState(50);
  const [tugDirection, setTugDirection] = useState<'LEFT' | 'RIGHT'>('RIGHT');
  const [tugRopeOffset, setTugRopeOffset] = useState(0); // -100 to 100, 0 is center
  const [tugPerfectCount, setTugPerfectCount] = useState(0);

  // Level 4: Marbles
  const [playerMarbles, setPlayerMarbles] = useState(10);
  const [aiMarbles, setAiMarbles] = useState(10);
  const [marbleBet, setMarbleBet] = useState(2);
  const [marblePhase, setMarblePhase] = useState<'betting' | 'guessing' | 'showing' | 'result'>('betting');
  const [isPlayerDealer, setIsPlayerDealer] = useState(true);
  const [aiHiddenCount, setAiHiddenCount] = useState(3);
  const [playerHiddenCount, setPlayerHiddenCount] = useState(3);
  const [playerChoice, setPlayerChoice] = useState<'odd' | 'even' | null>(null);
  const [aiChoice, setAiChoice] = useState<'odd' | 'even' | null>(null);
  const [marbleFeedback, setMarbleFeedback] = useState('');

  // Level 5: Glass Bridge
  const [glassSequence, setGlassSequence] = useState<('L' | 'R')[]>([]);
  const [glassCurrentRow, setGlassCurrentRow] = useState(-1); // -1 is start platform, 0-7 are steps
  const [glassMarblesCount, setGlassMarblesCount] = useState(2);
  const [glassStatusList, setGlassStatusList] = useState<('normal' | 'broken' | 'safe')[][]>([]); // 8 rows, each having 2 items: [Left, Right]
  const [glassActiveMode, setGlassActiveMode] = useState<'step' | 'throw'>('step');

  const initializeSubGames = (startLvl: number) => {
    // Level 2 reset
    if (startLvl === 2) {
      const shapes: ('triangle' | 'circle' | 'star' | 'umbrella')[] = ['triangle', 'circle', 'star', 'umbrella'];
      const chosen = shapes[Math.floor(Math.random() * shapes.length)];
      setDalgonaShape(chosen);
      setDalgonaPoints(generateDalgonaPoints(chosen));
      setDalgonaIntegrity(100);
      setDalgonaLicks(0);
    }
    // Level 3 reset
    if (startLvl === 3) {
      setTugSlider(10);
      setTugDirection('RIGHT');
      setTugRopeOffset(0);
      setTugPerfectCount(0);
    }
    // Level 4 reset
    if (startLvl === 4) {
      setPlayerMarbles(10);
      setAiMarbles(10);
      setMarbleBet(2);
      setMarblePhase('betting');
      setIsPlayerDealer(Math.random() > 0.5);
      setPlayerChoice(null);
      setAiChoice(null);
      setMarbleFeedback('');
    }
    // Level 5 reset
    if (startLvl === 5) {
      const seq: ('L' | 'R')[] = Array.from({ length: 8 }, () => Math.random() > 0.5 ? 'L' : 'R');
      setGlassSequence(seq);
      setGlassCurrentRow(-1);
      setGlassMarblesCount(2);
      setGlassStatusList(Array.from({ length: 8 }, () => ['normal', 'normal']));
    }
  };
  
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
    if (gameState !== 'playing' || engineRef.current.level !== 1) return;
    
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
    initializeSubGames(startLvl);
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

  // ==================== SUB-GAMES PLAY LOGIC ====================
  // Level 2: Dalgona Carving
  const carveDalgonaPoint = (index: number) => {
    if (gameState !== 'playing' || level !== 2) return;
    if (dalgonaPoints[index].carved) return;

    // Must click in sequential order
    const firstUncarved = dalgonaPoints.findIndex(p => !p.carved);
    if (index !== firstUncarved) {
      // Needle slipped! Slip decreases integrity
      setDalgonaIntegrity(prev => {
        const damage = 8 + Math.floor(Math.random() * 8);
        const next = prev - damage;
        if (next <= 0) {
          playSynthTone(120, 0.4, 'sawtooth', 0.25);
          handleElimination('shot');
          return 0;
        }
        playSynthTone(330, 0.08, 'sawtooth', 0.15); // slip warning sound
        return next;
      });
      return;
    }

    // Succesful carve point
    const updated = [...dalgonaPoints];
    updated[index].carved = true;
    setDalgonaPoints(updated);

    playSynthTone(750 + index * 10, 0.04, 'triangle', 0.1);

    if (updated.every(p => p.carved)) {
      handleVictory(60 - timeLeft);
    }
  };

  const lickDalgona = () => {
    if (gameState !== 'playing' || level !== 2) return;
    setDalgonaLicks(prev => prev + 1);
    setDalgonaIntegrity(prev => Math.min(100, prev + 15));
    playSynthTone(600, 0.1, 'sine', 0.15); // Licking sound
  };

  // Level 3: Tug of War pull mechanics
  const pullTugOfWar = () => {
    if (gameState !== 'playing' || level !== 3) return;

    const pos = tugSlider;
    if (pos >= 40 && pos <= 60) {
      // Perfect pulling!
      setTugPerfectCount(prev => prev + 1);
      setTugRopeOffset(prev => {
        const next = Math.min(100, prev + 18);
        if (next >= 100) {
          handleVictory(60 - timeLeft);
        }
        return next;
      });
      playSynthTone(880, 0.15, 'sine', 0.2);
    } else if (pos >= 25 && pos <= 75) {
      // Good pulling!
      setTugRopeOffset(prev => {
        const next = Math.min(100, prev + 8);
        if (next >= 100) {
          handleVictory(60 - timeLeft);
        }
        return next;
      });
      playSynthTone(440, 0.12, 'sine', 0.15);
    } else {
      // Missed timing! Opposing guards pull massively
      setTugRopeOffset(prev => {
        const next = Math.max(-100, prev - 12);
        if (next <= -100) {
          handleElimination('shot');
        }
        return next;
      });
      playSynthTone(180, 0.2, 'sawtooth', 0.15);
    }
  };

  // Level 3 Tug of War sliding bar effect loop
  useEffect(() => {
    if (gameState !== 'playing' || level !== 3) return;

    let sliderVal = 10;
    let vel = 5 + (level * 0.5); // speed increases based on level

    const interval = setInterval(() => {
      sliderVal += vel;
      if (sliderVal >= 100) {
        sliderVal = 100;
        vel = -vel;
      } else if (sliderVal <= 0) {
        sliderVal = 0;
        vel = -vel;
      }
      setTugSlider(sliderVal);
      setTugDirection(vel > 0 ? 'RIGHT' : 'LEFT');

      // Heavy constant pull from AI guard team
      setTugRopeOffset(prev => {
        const decay = 0.45 + (level * 0.1);
        const next = prev - decay;
        if (next <= -100) {
          handleElimination('shot');
          return -100;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [gameState, level]);

  // Level 4: Marbles Guessing and Betting
  const playMarblesRound = (guess: 'odd' | 'even') => {
    if (gameState !== 'playing' || level !== 4 || marblePhase !== 'guessing') return;

    const actual = aiHiddenCount;
    const isActualEven = actual % 2 === 0;
    const actualType = isActualEven ? 'even' : 'odd';
    const isCorrect = guess === actualType;

    let nextPlayer = playerMarbles;
    let nextAi = aiMarbles;
    let feedback = '';

    if (isCorrect) {
      const count = Math.min(marbleBet, aiMarbles);
      nextPlayer += count;
      nextAi -= count;
      feedback = language === 'mn' 
        ? `Зөв! Тэр ${actual} ширхэг нуусан байв. Та ${count} шагай хожлоо!` 
        : `Correct! They hid ${actual} (${actualType}). You win ${count} marbles!`;
      playSynthTone(600, 0.12, 'sine', 0.15);
    } else {
      const count = Math.min(marbleBet, playerMarbles);
      nextPlayer -= count;
      nextAi += count;
      feedback = language === 'mn'
        ? `Буруу! Тэр ${actual} ширхэг нуусан байв. Та ${count} шагай алдлаа!`
        : `Wrong! They hid ${actual} (${actualType}). You lose ${count} marbles!`;
      playSynthTone(200, 0.18, 'sawtooth', 0.15);
    }

    setPlayerMarbles(nextPlayer);
    setAiMarbles(nextAi);
    setMarbleFeedback(feedback);
    setMarblePhase('showing');

    setTimeout(() => {
      if (nextPlayer >= 20) {
        handleVictory(60 - timeLeft);
      } else if (nextPlayer <= 0) {
        handleElimination('shot');
      } else {
        setIsPlayerDealer(true);
        setMarblePhase('betting');
        setAiHiddenCount(Math.floor(Math.random() * 5) + 1);
        setPlayerHiddenCount(3);
      }
    }, 2500);
  };

  const handlePlayerHideMarbles = (hiddenCount: number) => {
    if (gameState !== 'playing' || level !== 4 || marblePhase !== 'betting') return;

    setPlayerHiddenCount(hiddenCount);

    const aiBetAmt = Math.min(Math.floor(Math.random() * 4) + 1, aiMarbles, playerMarbles);
    const aiGuessChoice: 'odd' | 'even' = Math.random() > 0.5 ? 'odd' : 'even';

    const actual = hiddenCount;
    const isActualEven = actual % 2 === 0;
    const actualType = isActualEven ? 'even' : 'odd';
    const isAiCorrect = aiGuessChoice === actualType;

    let nextPlayer = playerMarbles;
    let nextAi = aiMarbles;
    let feedback = '';

    if (isAiCorrect) {
      const count = Math.min(aiBetAmt, playerMarbles);
      nextPlayer -= count;
      nextAi += count;
      feedback = language === 'mn'
        ? `Өрсөлдөгч зөв таав! Тэр "Тэгш/Сондгой"-г зөв тааж, танаас ${count} шагай хожлоо!`
        : `Opponent guessed correctly! They guessed "${aiGuessChoice}" and win ${count} of your marbles!`;
      playSynthTone(200, 0.18, 'sawtooth', 0.15);
    } else {
      const count = Math.min(aiBetAmt, aiMarbles);
      nextPlayer += count;
      nextAi -= count;
      feedback = language === 'mn'
        ? `Өрсөлдөгч буруу таав! Тэр "${aiGuessChoice}" гэж таамагласан тул та ${count} шагай хожлоо!`
        : `Opponent guessed wrong! They guessed "${aiGuessChoice}". You win ${count} of their marbles!`;
      playSynthTone(600, 0.12, 'sine', 0.15);
    }

    setPlayerMarbles(nextPlayer);
    setAiMarbles(nextAi);
    setMarbleFeedback(feedback);
    setMarblePhase('showing');

    setTimeout(() => {
      if (nextPlayer >= 20) {
        handleVictory(60 - timeLeft);
      } else if (nextPlayer <= 0) {
        handleElimination('shot');
      } else {
        setIsPlayerDealer(false);
        setMarblePhase('guessing');
        setAiHiddenCount(Math.floor(Math.random() * 5) + 1);
      }
    }, 2500);
  };

  // Level 5: Glass Bridge jumping
  const jumpGlassBridge = (side: 'L' | 'R') => {
    if (gameState !== 'playing' || level !== 5) return;
    
    const nextRow = glassCurrentRow + 1;
    if (nextRow >= 8) return;

    const correctSide = glassSequence[nextRow];
    const isCorrect = side === correctSide;

    const updated = [...glassStatusList];
    
    if (isCorrect) {
      updated[nextRow][side === 'L' ? 0 : 1] = 'safe';
      setGlassStatusList(updated);
      setGlassCurrentRow(nextRow);
      playSynthTone(700, 0.08, 'sine', 0.2); // firm step clink

      if (nextRow === 7) {
        setTimeout(() => {
          handleVictory(60 - timeLeft);
        }, 800);
      }
    } else {
      updated[nextRow][side === 'L' ? 0 : 1] = 'broken';
      setGlassStatusList(updated);
      
      // Glass shatters sound sequence
      playSynthTone(1200, 0.15, 'sawtooth', 0.25);
      setTimeout(() => playSynthTone(900, 0.12, 'sawtooth', 0.2), 60);
      setTimeout(() => playSynthTone(550, 0.2, 'sawtooth', 0.15), 120);

      setTimeout(() => {
        handleElimination('shot');
      }, 400);
    }
  };

  const throwGlassMarble = (side: 'L' | 'R') => {
    if (gameState !== 'playing' || level !== 5) return;
    if (glassMarblesCount <= 0) return;

    const nextRow = glassCurrentRow + 1;
    if (nextRow >= 8) return;

    const correctSide = glassSequence[nextRow];
    const isCorrect = side === correctSide;

    setGlassMarblesCount(prev => prev - 1);

    const updated = [...glassStatusList];
    if (isCorrect) {
      playSynthTone(950, 0.08, 'sine', 0.25); // Safe tempered glass ring
      updated[nextRow][side === 'L' ? 0 : 1] = 'safe';
    } else {
      playSynthTone(1100, 0.15, 'sawtooth', 0.2); // Broken glass crash
      updated[nextRow][side === 'L' ? 0 : 1] = 'broken';
    }
    setGlassStatusList(updated);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (engine.gameState !== 'playing') return;
      
      const key = e.key.toLowerCase();

      // Custom Tug of War Spacebar hook
      if (engine.level === 3) {
        if (e.key === ' ' || key === 'w' || e.key === 'ArrowUp') {
          e.preventDefault();
          pullTugOfWar();
        }
        return;
      }

      if (key === 'a' || e.key === 'ArrowLeft') {
        performStep('LEFT');
      } else if (key === 'd' || e.key === 'ArrowRight') {
        performStep('RIGHT');
      } else if (key === 'w' || e.key === 'ArrowUp' || key === ' ') {
        const nextFoot = engine.lastFoot === 'LEFT' ? 'RIGHT' : 'LEFT';
        performStep(nextFoot);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, level, tugSlider]);

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
    if (engineRef.current.level !== 1) return;
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
          
          {level === 1 ? (
            <canvas
              id="squid-viewport"
              ref={canvasRef}
              width={400}
              height={480}
              className="rounded-lg bg-[#dfc49f] border-4 border-black shadow-inner max-w-full aspect-[400/480] h-full object-contain cursor-pointer"
              onClick={() => {
                const engine = engineRef.current;
                if (engine.gameState !== 'playing') return;
                const nextFoot = engine.lastFoot === 'LEFT' ? 'RIGHT' : 'LEFT';
                performStep(nextFoot);
              }}
            />
          ) : level === 2 ? (
            <div className="flex flex-col items-center justify-center w-full h-full max-w-[320px] mx-auto p-2 select-none z-10">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-amber-800/30 p-2 border-2 border-amber-900/50 flex items-center justify-center">
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-amber-700 shadow-[inset_0_4px_12px_rgba(255,255,255,0.4),0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden border border-amber-800">
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#000_15%,transparent_16%)] bg-[length:6px_6px]" />
                  
                  <svg width="240" height="240" viewBox="0 0 300 300" className="relative z-10 w-full h-full p-2">
                    <path
                      d={
                        dalgonaShape === 'triangle' ? "M150,70 L75,210 L225,210 Z" :
                        dalgonaShape === 'circle' ? "M150,150 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0" :
                        dalgonaShape === 'star' ? "M150,70 L170,115 L225,115 L180,150 L197,195 L150,165 L103,195 L120,150 L75,115 L130,115 Z" :
                        "M75,150 A75,55 0 0,1 225,150 Q187.5,150 187.5,150 Q150,150 150,150 Q112.5,150 112.5,150 L75,150 M150,150 L150,205 Q150,215 140,215 Q125,210 125,210"
                      }
                      fill="none"
                      stroke="#451a03"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-75"
                    />
                    
                    {dalgonaPoints.map((pt, idx) => {
                      const isNext = idx === dalgonaPoints.findIndex(p => !p.carved);
                      return (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r={pt.carved ? 7 : isNext ? 11 : 6}
                          className={`cursor-pointer transition-all duration-150 ${
                            pt.carved 
                              ? 'fill-amber-350 stroke-amber-950 stroke-2 shadow-sm' 
                              : isNext 
                                ? 'fill-pink-500 stroke-white stroke-2 animate-pulse' 
                                : 'fill-amber-950/35 stroke-amber-850'
                          }`}
                          onClick={() => {
                            initAudio();
                            carveDalgonaPoint(idx);
                          }}
                        />
                      );
                    })}
                  </svg>
                  
                  {dalgonaIntegrity < 40 && (
                    <div className="absolute inset-0 pointer-events-none bg-red-950/20 backdrop-brightness-50 flex items-center justify-center">
                      <div className="text-red-500 font-black tracking-widest text-lg uppercase animate-ping">CRACKING!</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : level === 3 ? (
            <div className="flex flex-col items-center justify-between w-full h-full p-2 select-none bg-slate-950/60 rounded-xl z-10 max-w-sm">
              <div className="relative w-full h-44 bg-slate-900/90 border border-slate-800 rounded-lg overflow-hidden flex items-center justify-between px-3">
                <div className="absolute left-0 bottom-0 top-1/4 w-24 bg-emerald-950/30 border-r-2 border-emerald-500/20 flex flex-col justify-end p-1 items-center">
                  <div className="text-emerald-400 text-[8px] font-mono mb-1 uppercase tracking-wider font-bold">
                    {language === 'mn' ? 'ТА ХОЛБООТНУУД' : 'YOUR TEAM'}
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col items-center animate-bounce" style={{ animationDelay: `${i * 120}ms` }}>
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white" />
                        <div className="w-1 h-5 bg-emerald-600 rounded-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute right-0 bottom-0 top-1/4 w-24 bg-pink-950/30 border-l-2 border-pink-500/20 flex flex-col justify-end p-1 items-center">
                  <div className="text-pink-400 text-[8px] font-mono mb-1 uppercase tracking-wider font-bold">
                    {language === 'mn' ? 'ХАМГААЛАГЧИД' : 'GUARD TEAM'}
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col items-center animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                        <div className="w-3.5 h-3.5 rounded-full bg-pink-500 border border-black flex items-center justify-center text-[6px] text-white">▲</div>
                        <div className="w-1 h-5 bg-pink-600 rounded-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute inset-x-20 top-2/3 h-1.5 bg-yellow-800/50 flex items-center justify-center">
                  <div 
                    className="absolute w-3.5 h-5 bg-red-600 border border-white shadow-md transition-all duration-100"
                    style={{ left: `calc(50% + ${tugRopeOffset}px)` }}
                  >
                    <div className="absolute top-full left-1/2 w-0.5 h-4 bg-white" />
                  </div>
                </div>
              </div>

              <div className="w-full mt-3 bg-slate-900/95 p-3 rounded-xl border border-slate-850">
                <div className="relative h-5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden mb-2">
                  <div className="absolute inset-y-0 left-1/4 right-1/4 bg-yellow-500/15" />
                  <div className="absolute inset-y-0 left-[40%] right-[40%] bg-emerald-500/25 border-x border-emerald-500/40" />
                  
                  <div 
                    className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_8px_white] transition-all duration-75"
                    style={{ left: `${tugSlider}%` }}
                  />
                </div>

                <button
                  onClick={() => {
                    initAudio();
                    pullTugOfWar();
                  }}
                  className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-500 active:scale-95 text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                >
                  {language === 'mn' ? 'ТАТАХ (Spacebar) 💪' : 'PULL (Spacebar) 💪'}
                </button>
              </div>
            </div>
          ) : level === 4 ? (
            <div className="flex flex-col items-center justify-between w-full h-full p-2 bg-slate-950/60 rounded-xl select-none z-10 max-w-sm">
              <div className="grid grid-cols-2 gap-3 w-full mb-2">
                <div className="bg-emerald-950/25 border border-emerald-500/15 p-2 rounded-lg text-center">
                  <div className="text-[8px] font-mono text-emerald-400 uppercase tracking-wider font-bold mb-0.5">
                    {language === 'mn' ? 'Таны Шагай' : 'Your Marbles'}
                  </div>
                  <div className="text-lg font-black text-emerald-300 font-mono flex items-center justify-center gap-1">
                    🔵 <span className="text-xl">{playerMarbles}</span>
                  </div>
                </div>

                <div className="bg-red-950/25 border border-red-500/15 p-2 rounded-lg text-center">
                  <div className="text-[8px] font-mono text-red-400 uppercase tracking-wider font-bold mb-0.5">
                    {language === 'mn' ? 'Өрсөлдөгч (001)' : 'Opponent (001)'}
                  </div>
                  <div className="text-lg font-black text-red-300 font-mono flex items-center justify-center gap-1">
                    🔴 <span className="text-xl">{aiMarbles}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center text-center">
                {marblePhase === 'betting' && isPlayerDealer && (
                  <div className="animate-fade-in">
                    <p className="text-[11px] font-bold text-pink-400 mb-1 uppercase tracking-widest font-mono">
                      {language === 'mn' ? 'ШАГАЙ НУУХ ҮЕ!' : 'YOUR TURN TO HIDE!'}
                    </p>
                    <p className="text-[9px] text-slate-400 mb-3">
                      {language === 'mn' ? 'Гартаа хэдэн шагай нуух вэ?' : 'Choose how many marbles to hide in your hand.'}
                    </p>
                    
                    <div className="flex justify-center gap-1.5">
                      {Array.from({ length: Math.min(5, playerMarbles) }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          onClick={() => {
                            initAudio();
                            handlePlayerHideMarbles(n);
                          }}
                          className="w-9 h-9 rounded-full bg-slate-950 border border-emerald-500 text-emerald-400 font-black hover:bg-emerald-500 hover:text-white transition-all text-xs active:scale-95"
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {marblePhase === 'guessing' && !isPlayerDealer && (
                  <div className="animate-fade-in w-full max-w-[240px]">
                    <p className="text-[11px] font-bold text-pink-400 mb-1 uppercase tracking-widest font-mono">
                      {language === 'mn' ? 'ТА ТААХ ҮЕ!' : 'YOUR TURN TO GUESS!'}
                    </p>
                    
                    <div className="mb-2.5">
                      <p className="text-[8px] text-slate-400 uppercase mb-0.5">
                        {language === 'mn' ? 'Дэнчин (Мөрий):' : 'Bet Size:'} {marbleBet}
                      </p>
                      <input
                        type="range"
                        min="1"
                        max={Math.min(playerMarbles, aiMarbles, 5)}
                        value={marbleBet}
                        onChange={(e) => setMarbleBet(Number(e.target.value))}
                        className="w-full h-1 bg-slate-950 rounded cursor-pointer accent-pink-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          initAudio();
                          playMarblesRound('odd');
                        }}
                        className="py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase transition-all tracking-wider"
                      >
                        {language === 'mn' ? 'СОНДГОЙ' : 'ODD'}
                      </button>
                      <button
                        onClick={() => {
                          initAudio();
                          playMarblesRound('even');
                        }}
                        className="py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase transition-all tracking-wider"
                      >
                        {language === 'mn' ? 'ТЭГШ' : 'EVEN'}
                      </button>
                    </div>
                  </div>
                )}

                {marblePhase === 'showing' && (
                  <div className="flex flex-col items-center justify-center p-2">
                    <div className="w-12 h-12 rounded-full bg-pink-500/10 border border-pink-500 flex items-center justify-center mb-1 text-2xl animate-bounce">
                      ✊
                    </div>
                    <p className="text-[10px] text-slate-300">
                      {marbleFeedback}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-between w-full h-full p-2 bg-slate-950/60 rounded-xl select-none z-10 max-w-sm">
              <div className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-lg p-2 flex flex-col justify-end overflow-y-auto max-h-[260px] sm:max-h-[300px]">
                <div className="flex flex-col gap-1 w-full max-w-[220px] mx-auto">
                  {Array.from({ length: 8 }, (_, i) => 7 - i).map((rowIdx) => {
                    const isCurrentPlayerRow = glassCurrentRow === rowIdx;
                    const isNextInteractiveRow = rowIdx === glassCurrentRow + 1;
                    
                    return (
                      <div key={rowIdx} className={`flex items-center gap-1.5 p-0.5 rounded transition-all ${
                        isNextInteractiveRow ? 'bg-pink-500/5 border border-pink-500/15' : ''
                      }`}>
                        <span className="text-[8px] font-mono text-slate-500 font-bold w-3">{rowIdx + 1}</span>

                        <button
                          onClick={() => {
                            initAudio();
                            if (glassActiveMode === 'step') jumpGlassBridge('L');
                            else throwGlassMarble('L');
                          }}
                          className={`flex-1 py-1.5 rounded font-black text-[10px] border transition-all ${
                            glassStatusList[rowIdx]?.[0] === 'broken'
                              ? 'bg-red-950/40 text-red-500 border-red-900 line-through'
                              : glassStatusList[rowIdx]?.[0] === 'safe'
                                ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                : isNextInteractiveRow
                                  ? 'bg-cyan-950/30 text-cyan-400 border-cyan-800 hover:bg-cyan-900/50 hover:border-cyan-500'
                                  : 'bg-slate-950/50 text-slate-600 border-slate-800'
                          }`}
                          disabled={!isNextInteractiveRow || glassStatusList[rowIdx]?.[0] === 'broken'}
                        >
                          L {isCurrentPlayerRow && glassSequence[rowIdx] === 'L' && '👤'}
                        </button>

                        <button
                          onClick={() => {
                            initAudio();
                            if (glassActiveMode === 'step') jumpGlassBridge('R');
                            else throwGlassMarble('R');
                          }}
                          className={`flex-1 py-1.5 rounded font-black text-[10px] border transition-all ${
                            glassStatusList[rowIdx]?.[1] === 'broken'
                              ? 'bg-red-950/40 text-red-500 border-red-900 line-through'
                              : glassStatusList[rowIdx]?.[1] === 'safe'
                                ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                : isNextInteractiveRow
                                  ? 'bg-cyan-950/30 text-cyan-400 border-cyan-800 hover:bg-cyan-900/50 hover:border-cyan-500'
                                  : 'bg-slate-950/50 text-slate-600 border-slate-800'
                          }`}
                          disabled={!isNextInteractiveRow || glassStatusList[rowIdx]?.[1] === 'broken'}
                        >
                          R {isCurrentPlayerRow && glassSequence[rowIdx] === 'R' && '👤'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="w-full mt-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2 text-[9px] text-slate-400">
                  <span>🔮 {language === 'mn' ? 'Шагай:' : 'Marbles:'} <strong className="text-emerald-400">{glassMarblesCount}</strong></span>
                  <span>🏁 {language === 'mn' ? 'Байршил:' : 'Row:'} <strong className="text-pink-400">{glassCurrentRow + 1} / 8</strong></span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setGlassActiveMode('step')}
                    className={`py-1 rounded font-black text-[9px] uppercase transition-all ${
                      glassActiveMode === 'step' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    👣 {language === 'mn' ? 'АЛХАХ' : 'STEP'}
                  </button>
                  <button
                    onClick={() => setGlassActiveMode('throw')}
                    disabled={glassMarblesCount <= 0}
                    className={`py-1 rounded font-black text-[9px] uppercase transition-all disabled:opacity-45 ${
                      glassActiveMode === 'throw' ? 'bg-yellow-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    ☄️ {language === 'mn' ? 'ШИДЭХ' : 'THROW'}
                  </button>
                </div>
              </div>
            </div>
          )}

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
            {level === 1 ? (
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
            ) : level === 2 ? (
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-400 font-mono uppercase tracking-wider font-bold">🍯 {language === 'mn' ? 'Далгона хэлбэр' : 'Cookie Shape'}</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] uppercase">{dalgonaShape}</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400">
                    <span>{language === 'mn' ? 'Бүтэн байдал' : 'Cookie Integrity'}</span>
                    <span className={dalgonaIntegrity < 40 ? 'text-red-500 font-bold animate-pulse' : 'text-amber-300'}>{dalgonaIntegrity}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-300 ${dalgonaIntegrity < 40 ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${dalgonaIntegrity}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : level === 3 ? (
              <div className="bg-pink-950/10 border border-pink-500/20 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-pink-400 font-mono uppercase tracking-wider font-bold">🪢 {language === 'mn' ? 'Олсны зөрүү' : 'Rope Status'}</span>
                  <span className={`font-mono font-bold text-sm ${Math.abs(tugRopeOffset) > 40 ? 'text-red-500' : 'text-emerald-400'}`}>
                    {tugRopeOffset > 0 ? `+${tugRopeOffset}px ➡️` : `${tugRopeOffset}px ⬅️`}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                  <div className="absolute top-0 bottom-0 bg-pink-500 transition-all duration-150" style={{ left: '50%', width: `${(tugRopeOffset / 100) * 50}%` }} />
                </div>
              </div>
            ) : level === 4 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5 text-center">
                <span className="text-[10px] font-mono text-pink-400 uppercase tracking-widest block font-bold">🔮 {language === 'mn' ? 'МӨРИЙТЭЙ ТОГЛООМ' : 'MARBLE SHOWDOWN'}</span>
                <p className="text-xs text-slate-300 font-bold">
                  {isPlayerDealer 
                    ? (language === 'mn' ? 'Та шагайгаа нууж байна' : 'You are hiding marbles') 
                    : (language === 'mn' ? 'Та таахыг оролдож байна' : 'You are guessing')}
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5 text-center">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">🌉 {language === 'mn' ? 'ШИЛЭН ГҮҮР' : 'TEMPERED GLASS BRIDGE'}</span>
                <p className="text-xs text-slate-300 font-bold">
                  {language === 'mn' ? 'Аюулгүй шилэн дээр гишгэнэ үү' : 'Find the safe path to cross the chasm'}
                </p>
              </div>
            )}

            {/* Giant Doll progress chant bar */}
            {gameState === 'playing' && level === 1 && (
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
                {level === 1 ? (
                  <>
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
                  </>
                ) : level === 2 ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        initAudio();
                        lickDalgona();
                      }}
                      className="w-full py-4 sm:py-5 rounded-2xl border-2 border-amber-600 bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 font-extrabold uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    >
                      <span className="text-3xl">👅</span>
                      <span>{language === 'mn' ? 'ШҮЛСЭЭР ДОЛООХ (ОНЬС СЭРГЭЭХ)' : 'LICK CANDY (RESTORE INTEGRITY)'}</span>
                    </button>
                    <p className="text-center text-[9px] text-slate-500 font-mono leading-relaxed">
                      {language === 'mn' 
                        ? '💡 Долоосноор чихрийн бүтэн байдлыг сэргээж, унах эрсдлийг бууруулна! Гэхдээ цаг алдаж буйг анхаарна уу.' 
                        : '💡 Licking the candy restores its structural integrity but drains your precious time!'}
                    </p>
                  </div>
                ) : level === 3 ? (
                  <div className="space-y-3">
                    <p className="text-center text-[10px] text-slate-500 font-mono animate-pulse">
                      {language === 'mn' 
                        ? '💡 Сум ногоон голд орох үед SPACEBAR эсвэл зүүн талын товчийг дараарай!' 
                        : '💡 Hit SPACEBAR or the PULL button exactly when the indicator is in the green center!'}
                    </p>
                  </div>
                ) : level === 4 ? (
                  <div className="space-y-3">
                    <p className="text-center text-[10px] text-slate-500 font-mono">
                      {language === 'mn' 
                        ? '💡 Сөргөгчийн бүх 10 шагайг хожсон тохиолдолд чи дараагийн шатанд орно.' 
                        : '💡 Outsmart the opponent to claim all 10 marbles and secure your survival!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-center text-[10px] text-slate-450 font-mono bg-slate-900 p-2 rounded border border-slate-800 leading-relaxed">
                      {language === 'mn' 
                        ? '💡 Түрүүлж шагай шидэж шилийг шалгаж болно! Шил хагарах юм бол дараагийн гишгүүр өөр сонголт байна.' 
                        : '💡 Throw limited marbles to test glass safety! Tempered tiles reflect light, normal tiles explode.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Instructions rulebook panel
              <div id="squid-rulebook" className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-left space-y-3">
                <p className="text-xs font-bold text-[#ec4899] uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span>
                    {level === 1 ? t.rulesTitle : language === 'mn' ? 'ҮЕИЙН ДҮРЭМ' : 'LEVEL RULES'}
                  </span>
                </p>
                <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
                  {level === 1 ? (
                    <>
                      <p>{t.rule1}</p>
                      <p className="text-red-400">{t.rule2}</p>
                      <p>{t.rule3}</p>
                      <p>{t.rule4}</p>
                    </>
                  ) : level === 2 ? (
                    <>
                      <p>1. {language === 'mn' ? 'Зүүний улаан анивчиж буй цэгүүд дээр дараалж даран чихрийг зүснэ.' : 'Click or tap the blinking red target dots along the shape outline.'}</p>
                      <p className="text-red-400">2. {language === 'mn' ? 'Хэрэв буруу газар дарвал чихэр хагарч тоглоом дуусна!' : 'Clicking off-target damages the cookie integrity. At 0%, it shatters!'}</p>
                      <p>3. {language === 'mn' ? 'Долоох товчийг дарж чихрийн бүтэн байдлыг дахин сэргээж болно.' : 'Use the Lick Candy action to safely repair damaged integrity.'}</p>
                    </>
                  ) : level === 3 ? (
                    <>
                      <p>1. {language === 'mn' ? 'Олс татах хүч хэмжигч зүүний хэлбэлзлийг анхааралтай ажиглана.' : 'Observe the oscillating tension indicator needle closely.'}</p>
                      <p className="text-red-400">2. {language === 'mn' ? 'Зүү ногоон хэсэгт орсон яг тэр агшинд уу товч эсвэл SPACEBAR-г дараарай!' : 'Press SPACEBAR or the PULL button exactly when the needle hits the green center!'}</p>
                      <p>3. {language === 'mn' ? 'Зөрүү ихсэж хязгаарт хүрвэл чи унана.' : 'If the rope gets pulled too far to the guard side, your team falls!'}</p>
                    </>
                  ) : level === 4 ? (
                    <>
                      <p>1. {language === 'mn' ? 'Таны ээлж ирэхэд гартаа хэдэн шагай нуухаа сонгож өрсөлдөгчөө таалгана.' : 'When you are the dealer, hide 1 to 5 marbles in your fist.'}</p>
                      <p className="text-red-400">2. {language === 'mn' ? 'Өрсөлдөгчийн ээлж ирэхэд дэнчин тавьж ТЭГШ эсвэл СОНДГОЙ-г таана.' : 'When the opponent is the dealer, choose your bet and guess ODD or EVEN.'}</p>
                      <p>3. {language === 'mn' ? 'Сөргөгчийн бүх 10 шагайг хожсон тохиолдолд амьд үлдэнэ!' : 'Take all 10 marbles from the opponent to secure your survival.'}</p>
                    </>
                  ) : (
                    <>
                      <p>1. {language === 'mn' ? 'Алхах горимыг сонгоод Зүүн (L) эсвэл Баруун (R) шилийг сонгож харайгаарай.' : 'Choose STEP mode, then click L or R of the next row to jump.'}</p>
                      <p className="text-red-400">2. {language === 'mn' ? 'Нэг шил нь аюулгүй хатуу шил, нөгөө нь шууд хагарах энгийн шил байна.' : 'One tile is tempered glass, the other is normal and shatters instantly.'}</p>
                      <p>3. {language === 'mn' ? 'ШИДЭХ горимыг сонгон шагай шидэж шилний бат бэхийг урьдчилж шалгана уу.' : 'Switch to THROW mode to toss a limited marble and test the glass safely.'}</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

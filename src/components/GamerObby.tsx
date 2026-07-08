import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, AnimatePresence 
} from 'motion/react';
import { 
  Gamepad2, RefreshCw, X, Play, Volume2, VolumeX, 
  Sparkles, Award, ShoppingBag, CheckCircle, RotateCcw, 
  ArrowRight, Heart, Star, Compass, Zap, Trophy, Flame
} from 'lucide-react';
import { LanguageType } from '../types';

interface GamerObbyProps {
  onClose: () => void;
  language: LanguageType;
}

interface Skin {
  id: string;
  nameMn: string;
  nameEn: string;
  price: number;
  color: string;
  emoji: string;
  descriptionMn: string;
  descriptionEn: string;
}

interface Trail {
  id: string;
  nameMn: string;
  nameEn: string;
  price: number;
  color: string;
  descriptionMn: string;
  descriptionEn: string;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'lava' | 'bounce' | 'ice' | 'disappearing' | 'moving_v' | 'moving_h';
  // Disappearing state
  disappearTimer?: number; // active countdown
  isDisappeared?: boolean;
  regrowTimer?: number;
  // Moving state
  originX?: number;
  originY?: number;
  range?: number;
  speed?: number;
  dir?: number; // 1 or -1
}

interface Coin {
  id: string;
  x: number;
  y: number;
  collected: boolean;
  pulseOffset: number;
}

interface Checkpoint {
  id: string;
  x: number;
  y: number;
  activated: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

const SKINS: Skin[] = [
  { id: 'classic', nameMn: 'Үндсэн Куб', nameEn: 'Classic Cube', price: 0, color: '#A855F7', emoji: '👾', descriptionMn: 'Энгийн бас загварлаг нил ягаан шоо.', descriptionEn: 'Simple and stylish purple cuboid.' },
  { id: 'ninja', nameMn: 'Хурдны Нинжа', nameEn: 'Swift Ninja', price: 15, color: '#EF4444', emoji: '🥷', descriptionMn: 'Хурдны мэдрэмж өгөх улаан масктай шоо.', descriptionEn: 'High-visibility red ninja block.' },
  { id: 'cyber', nameMn: 'Кибер Бөмбөлөг', nameEn: 'Cyber Orb', price: 30, color: '#06B6D4', emoji: '🌐', descriptionMn: 'Гэрэлтдэг кибер цэнхэр бөмбөг.', descriptionEn: 'Glowing cyber-blue neon sphere.' },
  { id: 'gold', nameMn: 'Алтан Хаан', nameEn: 'Golden King', price: 50, color: '#F59E0B', emoji: '👑', descriptionMn: 'Эрхэмсэг алтлаг өнгөтэй хааны шоо.', descriptionEn: 'Royal golden majestic brick.' },
  { id: 'rainbow', nameMn: 'Астро Солонго', nameEn: 'Rainbow Astro', price: 80, color: '#ec4899', emoji: '🌈', descriptionMn: 'Төгс солонго өнгөтэй сансрын нисгэгч.', descriptionEn: 'Legendary cycling rainbow skin.' }
];

const TRAILS: Trail[] = [
  { id: 'none', nameMn: 'Утаагүй', nameEn: 'No Trail', price: 0, color: 'transparent', descriptionMn: 'Утаагүй энгийн.', descriptionEn: 'Standard particle trail.' },
  { id: 'purple_sparks', nameMn: 'Нил Оч', nameEn: 'Purple Sparks', price: 10, color: '#A855F7', descriptionMn: 'Нил ягаан өнгийн гэрлэн оч.', descriptionEn: 'Bright purple glowing sparks.' },
  { id: 'fire_trail', nameMn: 'Галт Сүүл', nameEn: 'Flame Trail', price: 25, color: '#F97316', descriptionMn: 'Ардаас улалзах халуухан дөл.', descriptionEn: 'Blazing hot flame particles.' },
  { id: 'cyan_laser', nameMn: 'Кибер Лазер', nameEn: 'Neon Cyan', price: 40, color: '#06B6D4', descriptionMn: 'Цэнхэр неон гэрлэн туяа.', descriptionEn: 'Futuristic cyan cyber laser trail.' }
];

// Synth sounds helper using Web Audio API
const playObbySound = (type: 'jump' | 'coin' | 'checkpoint' | 'die' | 'bounce' | 'win' | 'unlock') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'jump') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'bounce') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'coin') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'checkpoint') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.07);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.14);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.21);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'die') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.16, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'unlock') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.06);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12);
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'win') {
      // Happy chords
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + idx * 0.06);
        o.connect(g);
        g.connect(ctx.destination);
        g.gain.setValueAtTime(0.12, now + idx * 0.06);
        g.gain.exponentialRampToValueAtTime(0.005, now + 0.6);
        o.start(now + idx * 0.06);
        o.stop(now + 0.6);
      });
    }
  } catch (err) {
    // Audio Context not supported or blocked
  }
};

export default function GamerObby({ onClose, language }: GamerObbyProps) {
  const isMn = language === 'mn';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // App level states
  const [activeTab, setActiveTab] = useState<'lobby' | 'playing' | 'shop' | 'victory'>('lobby');
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const [coinsBalance, setCoinsBalance] = useState<number>(() => {
    return Number(localStorage.getItem('obby_coins_v1')) || 0;
  });
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem('obby_unlocked_skins_v1');
    return saved ? JSON.parse(saved) : ['classic'];
  });
  const [unlockedTrails, setUnlockedTrails] = useState<string[]>(() => {
    const saved = localStorage.getItem('obby_unlocked_trails_v1');
    return saved ? JSON.parse(saved) : ['none'];
  });
  const [equippedSkin, setEquippedSkin] = useState<string>(() => {
    return localStorage.getItem('obby_equipped_skin_v1') || 'classic';
  });
  const [equippedTrail, setEquippedTrail] = useState<string>(() => {
    return localStorage.getItem('obby_equipped_trail_v1') || 'none';
  });

  // Gameplay HUD states (synced from loop to React for rendering)
  const [deathsCount, setDeathsCount] = useState(0);
  const [currentLvlCoins, setCurrentLvlCoins] = useState(0);
  const [totalLvlCoins, setTotalLvlCoins] = useState(0);
  const [soundMuted, setSoundMuted] = useState(false);
  const [hardMode, setHardMode] = useState<boolean>(() => {
    return localStorage.getItem('obby_hard_mode_v1') === 'true';
  });

  // Game Engine ref
  const engineRef = useRef({
    // Physics properties
    playerX: 80,
    playerY: 300,
    playerWidth: 26,
    playerHeight: 26,
    vx: 0,
    vy: 0,
    isGrounded: false,
    doubleJumpAvailable: true,
    lastCheckpointX: 80,
    lastCheckpointY: 300,
    deaths: 0,

    // Controls
    keys: {} as Record<string, boolean>,

    // World & Camera
    cameraX: 0,
    cameraY: 0,
    worldWidth: 3000,
    worldHeight: 500,

    // Level structures
    blocks: [] as Block[],
    coins: [] as Coin[],
    checkpoints: [] as Checkpoint[],
    finishX: 2800,
    finishY: 280,
    particles: [] as Particle[],

    // Animation frame handle
    animFrameId: 0,

    // Timing
    lastTime: 0
  });

  // LEVEL BUILDER DEFINITIONS
  const buildLevel = (idx: number) => {
    const engine = engineRef.current;
    engine.particles = [];
    engine.vx = 0;
    engine.vy = 0;

    // Default Starting Points
    engine.playerX = 80;
    engine.playerY = 320;
    engine.lastCheckpointX = 80;
    engine.lastCheckpointY = 320;

    if (idx === 0) {
      // LEVEL 1: GREENHILL PLATFORMER (Intro to Parkour)
      engine.worldWidth = 3200;
      engine.worldHeight = 500;
      engine.finishX = 3000;
      engine.finishY = 300;

      engine.blocks = [
        // Solid Ground blocks
        { x: 0, y: 380, width: 400, height: 120, type: 'solid' },
        // Lava threat introduction
        { x: 400, y: 460, width: 250, height: 40, type: 'lava' },
        { x: 400, y: 420, width: hardMode ? 18 : 30, height: 40, type: 'solid' },
        { x: 620, y: 420, width: hardMode ? 18 : 30, height: 40, type: 'solid' },
        
        // Floating steps
        { x: 750, y: 340, width: hardMode ? 60 : 120, height: 25, type: 'solid' },
        ...(hardMode ? [
          { x: 950, y: 280, width: 45, height: 25, type: 'solid' },
          { x: 995, y: 270, width: 20, height: 10, type: 'lava' },
          { x: 1015, y: 280, width: 45, height: 25, type: 'solid' }
        ] : [
          { x: 950, y: 280, width: 120, height: 25, type: 'solid' }
        ]),
        
        // Slippery Ice platform
        { x: 1150, y: 260, width: hardMode ? 140 : 250, height: 25, type: 'ice' },
        ...(hardMode ? [
          { x: 1210, y: 245, width: 15, height: 15, type: 'lava' }
        ] : []),
        
        // Moving Platform vertical
        { x: 1480, y: 240, width: hardMode ? 50 : 90, height: 20, type: 'moving_v', originX: 1480, originY: 150, range: 180, speed: 1.5, dir: 1 },
        
        // Solid Island
        { x: 1650, y: 340, width: 180, height: 160, type: 'solid' },
        ...(hardMode ? [
          { x: 1730, y: 325, width: 20, height: 15, type: 'lava' }
        ] : []),
        
        // Trampoline introduction
        { x: 1900, y: 380, width: 140, height: 120, type: 'solid' },
        { x: 2040, y: 440, width: hardMode ? 35 : 60, height: 20, type: 'bounce' },
        { x: 2160, y: 260, width: 150, height: 240, type: 'solid' },
        
        // Disappearing hazard
        { x: 2380, y: 250, width: hardMode ? 40 : 80, height: 20, type: 'disappearing', disappearTimer: 0 },
        { x: 2520, y: 250, width: hardMode ? 40 : 80, height: 20, type: 'disappearing', disappearTimer: 0 },
        
        // Final stretches
        { x: 2680, y: 360, width: 500, height: 140, type: 'solid' },
        ...(hardMode ? [
          { x: 2850, y: 345, width: 40, height: 15, type: 'lava' }
        ] : []),
      ];

      // Setup coins
      engine.coins = [
        { id: '1_1', x: 250, y: 320, collected: false, pulseOffset: 0 },
        { id: '1_2', x: 520, y: 380, collected: false, pulseOffset: 1 },
        { id: '1_3', x: 810, y: 280, collected: false, pulseOffset: 2 },
        { id: '1_4', x: 1270, y: 200, collected: false, pulseOffset: 3 },
        { id: '1_5', x: 1740, y: 280, collected: false, pulseOffset: 4 },
        { id: '1_6', x: 2070, y: 340, collected: false, pulseOffset: 5 },
        { id: '1_7', x: 2420, y: 190, collected: false, pulseOffset: 6 },
        { id: '1_8', x: 2800, y: 300, collected: false, pulseOffset: 7 },
      ];

      // Setup Checkpoint flags
      engine.checkpoints = [
        { id: 'cp_1_1', x: 1170, y: 260, activated: false },
        { id: 'cp_1_2', x: 1740, y: 340, activated: false },
        { id: 'cp_1_3', x: 2240, y: 260, activated: false },
      ];

    } else if (idx === 1) {
      // LEVEL 2: CYBER LAVA CAVERN (Harder Jumps & Lasers)
      engine.worldWidth = 3400;
      engine.worldHeight = 500;
      engine.finishX = 3250;
      engine.finishY = 260;

      engine.blocks = [
        // Entry
        { x: 0, y: 380, width: 280, height: 120, type: 'solid' },
        
        // Moving Horizontal platform over lava lake
        { x: 340, y: 380, width: hardMode ? 45 : 80, height: 20, type: 'moving_h', originX: 340, originY: 380, range: 240, speed: 2, dir: 1 },
        { x: 300, y: 470, width: 700, height: 30, type: 'lava' },
        
        // Middle rest point
        { x: 680, y: 360, width: 140, height: 140, type: 'solid' },
        ...(hardMode ? [
          { x: 740, y: 345, width: 20, height: 15, type: 'lava' }
        ] : []),
        
        // Multiple lava jumps with safety blocks
        { x: 820, y: 470, width: 800, height: 30, type: 'lava' },
        { x: 890, y: 300, width: hardMode ? 25 : 50, height: 20, type: 'solid' },
        { x: 1010, y: 240, width: hardMode ? 25 : 50, height: 20, type: 'solid' },
        { x: 1130, y: 300, width: hardMode ? 25 : 50, height: 20, type: 'solid' },
        
        // High bouncy platform
        { x: 1250, y: 390, width: hardMode ? 50 : 90, height: 20, type: 'bounce' },
        { x: 1390, y: 210, width: 180, height: 290, type: 'solid' },
        ...(hardMode ? [
          { x: 1460, y: 195, width: 30, height: 15, type: 'lava' }
        ] : []),
        
        // Falling steps
        { x: 1650, y: 240, width: hardMode ? 35 : 60, height: 15, type: 'disappearing', disappearTimer: 0 },
        { x: 1780, y: 240, width: hardMode ? 35 : 60, height: 15, type: 'disappearing', disappearTimer: 0 },
        { x: 1910, y: 240, width: hardMode ? 35 : 60, height: 15, type: 'disappearing', disappearTimer: 0 },
        
        // Solid Island
        { x: 2040, y: 320, width: 160, height: 180, type: 'solid' },
        ...(hardMode ? [
          { x: 2100, y: 305, width: 20, height: 15, type: 'lava' }
        ] : []),
        
        // Slippery icy lava speed-pads
        { x: 2200, y: 480, width: 600, height: 20, type: 'lava' },
        { x: 2250, y: 320, width: hardMode ? 50 : 100, height: 15, type: 'ice' },
        { x: 2420, y: 270, width: hardMode ? 50 : 100, height: 15, type: 'ice' },
        { x: 2590, y: 220, width: hardMode ? 50 : 100, height: 15, type: 'ice' },
        
        // Moving lift over final drop
        { x: 2760, y: 320, width: hardMode ? 45 : 80, height: 20, type: 'moving_v', originX: 2760, originY: 140, range: 240, speed: 2.2, dir: 1 },
        { x: 2910, y: 320, width: 500, height: 180, type: 'solid' },
        ...(hardMode ? [
          { x: 3050, y: 305, width: 30, height: 15, type: 'lava' }
        ] : []),
      ];

      engine.coins = [
        { id: '2_1', x: 440, y: 300, collected: false, pulseOffset: 0 },
        { id: '2_2', x: 750, y: 290, collected: false, pulseOffset: 1 },
        { id: '2_3', x: 1010, y: 170, collected: false, pulseOffset: 2 },
        { id: '2_4', x: 1480, y: 140, collected: false, pulseOffset: 3 },
        { id: '2_5', x: 1780, y: 180, collected: false, pulseOffset: 4 },
        { id: '2_6', x: 2120, y: 260, collected: false, pulseOffset: 5 },
        { id: '2_7', x: 2470, y: 200, collected: false, pulseOffset: 6 },
        { id: '2_8', x: 3050, y: 260, collected: false, pulseOffset: 7 },
      ];

      engine.checkpoints = [
        { id: 'cp_2_1', x: 750, y: 360, activated: false },
        { id: 'cp_2_2', x: 1480, y: 210, activated: false },
        { id: 'cp_2_3', x: 2120, y: 320, activated: false },
      ];

    } else if (idx === 2) {
      // LEVEL 3: CELESTIAL CLOUDLANDS (Tricky Double Jumps, Bouncy Cloudlands)
      engine.worldWidth = 3600;
      engine.worldHeight = 550;
      engine.finishX = 3400;
      engine.finishY = 220;

      engine.blocks = [
        // Entry
        { x: 0, y: 400, width: 250, height: 150, type: 'solid' },
        
        // Jump Cloud series
        { x: 320, y: 340, width: hardMode ? 45 : 90, height: 20, type: 'solid' },
        { x: 460, y: 280, width: hardMode ? 45 : 90, height: 20, type: 'solid' },
        { x: 600, y: 220, width: hardMode ? 45 : 90, height: 20, type: 'solid' },
        
        // Giant cloud bounce padding
        { x: 750, y: 440, width: hardMode ? 80 : 160, height: 20, type: 'bounce' },
        { x: 960, y: 240, width: 200, height: 310, type: 'solid' },
        ...(hardMode ? [
          { x: 1040, y: 225, width: 30, height: 15, type: 'lava' }
        ] : []),
        
        // Long slippery ice slide challenge
        { x: 1220, y: 200, width: hardMode ? 180 : 350, height: 20, type: 'ice' },
        ...(hardMode ? [
          { x: 1460, y: 240, width: 60, height: 200, type: 'lava' }
        ] : []),
        
        // Disappearing platforms down below
        { x: 1620, y: 360, width: hardMode ? 40 : 80, height: 15, type: 'disappearing', disappearTimer: 0 },
        { x: 1750, y: 300, width: hardMode ? 40 : 80, height: 15, type: 'disappearing', disappearTimer: 0 },
        { x: 1880, y: 240, width: hardMode ? 40 : 80, height: 15, type: 'disappearing', disappearTimer: 0 },
        
        // Mid checkpoint island
        { x: 2020, y: 240, width: 200, height: 310, type: 'solid' },
        ...(hardMode ? [
          { x: 2090, y: 225, width: 30, height: 15, type: 'lava' }
        ] : []),
        
        // Moving platforms puzzle
        { x: 2300, y: 280, width: hardMode ? 40 : 70, height: 15, type: 'moving_h', originX: 2300, originY: 280, range: 200, speed: 1.8, dir: 1 },
        { x: 2580, y: 380, width: hardMode ? 40 : 70, height: 15, type: 'moving_v', originX: 2580, originY: 160, range: 220, speed: 2, dir: -1 },
        
        // Final trampoline sprint
        { x: 2740, y: 420, width: hardMode ? 50 : 100, height: 15, type: 'bounce' },
        { x: 2920, y: 300, width: hardMode ? 50 : 100, height: 15, type: 'bounce' },
        { x: 3100, y: 180, width: hardMode ? 50 : 100, height: 15, type: 'bounce' },
        
        // Final station
        { x: 3260, y: 280, width: 340, height: 270, type: 'solid' },
        ...(hardMode ? [
          { x: 3380, y: 265, width: 30, height: 15, type: 'lava' }
        ] : []),
      ];

      engine.coins = [
        { id: '3_1', x: 460, y: 220, collected: false, pulseOffset: 0 },
        { id: '3_2', x: 830, y: 320, collected: false, pulseOffset: 1 },
        { id: '3_3', x: 1060, y: 180, collected: false, pulseOffset: 2 },
        { id: '3_4', x: 1390, y: 140, collected: false, pulseOffset: 3 },
        { id: '3_5', x: 1750, y: 240, collected: false, pulseOffset: 4 },
        { id: '3_6', x: 2120, y: 170, collected: false, pulseOffset: 5 },
        { id: '3_7', x: 2420, y: 220, collected: false, pulseOffset: 6 },
        { id: '3_8', x: 2920, y: 220, collected: false, pulseOffset: 7 },
      ];

      engine.checkpoints = [
        { id: 'cp_3_1', x: 1060, y: 240, activated: false },
        { id: 'cp_3_2', x: 2120, y: 240, activated: false },
        { id: 'cp_3_3', x: 3320, y: 280, activated: false },
      ];

    } else if (idx === 3) {
      // LEVEL 4: QUANTUM SPACE STATION (Ultra Low-Gravity, Fast Hazards)
      engine.worldWidth = 3800;
      engine.worldHeight = 500;
      engine.finishX = 3600;
      engine.finishY = 240;

      engine.blocks = [
        // Launch station
        { x: 0, y: 350, width: 220, height: 150, type: 'solid' },
        
        // Spaceship jumps over electric hazard (made with lava style)
        { x: 220, y: 470, width: 1100, height: 30, type: 'lava' },
        { x: 310, y: 240, width: hardMode ? 30 : 60, height: 15, type: 'solid' },
        { x: 450, y: 240, width: hardMode ? 30 : 60, height: 15, type: 'solid' },
        { x: 590, y: 240, width: hardMode ? 30 : 60, height: 15, type: 'solid' },
        { x: 730, y: 240, width: hardMode ? 30 : 60, height: 15, type: 'solid' },
        { x: 870, y: 240, width: hardMode ? 30 : 60, height: 15, type: 'solid' },
        
        // Mid-way battery bounce
        { x: 1000, y: 380, width: hardMode ? 50 : 90, height: 15, type: 'bounce' },
        { x: 1140, y: 180, width: 220, height: 320, type: 'solid' },
        ...(hardMode ? [
          { x: 1220, y: 165, width: 30, height: 15, type: 'lava' }
        ] : []),
        
        // Hyper Horizontal sweeping lifts over abyss
        { x: 1360, y: 480, width: 1200, height: 20, type: 'lava' },
        { x: 1420, y: 280, width: hardMode ? 40 : 80, height: 15, type: 'moving_h', originX: 1420, originY: 280, range: 250, speed: 2.5, dir: 1 },
        { x: 1780, y: 220, width: hardMode ? 40 : 80, height: 15, type: 'moving_h', originX: 1780, originY: 220, range: 250, speed: 3.0, dir: -1 },
        
        // Quantum disintegrators
        { x: 2150, y: 250, width: hardMode ? 25 : 50, height: 15, type: 'disappearing', disappearTimer: 0 },
        { x: 2270, y: 250, width: hardMode ? 25 : 50, height: 15, type: 'disappearing', disappearTimer: 0 },
        { x: 2390, y: 250, width: hardMode ? 25 : 50, height: 15, type: 'disappearing', disappearTimer: 0 },
        
        // Next station
        { x: 2510, y: 280, width: 200, height: 220, type: 'solid' },
        ...(hardMode ? [
          { x: 2580, y: 265, width: 30, height: 15, type: 'lava' }
        ] : []),
        
        // Icy space tubes with traps
        { x: 2710, y: 480, width: 600, height: 20, type: 'lava' },
        { x: 2770, y: 260, width: hardMode ? 90 : 180, height: 15, type: 'ice' },
        { x: 3000, y: 220, width: hardMode ? 90 : 180, height: 15, type: 'ice' },
        
        // Vertical sweeping block
        { x: 3240, y: 350, width: hardMode ? 40 : 70, height: 15, type: 'moving_v', originX: 3240, originY: 150, range: 240, speed: 3.2, dir: 1 },
        
        // Final landing pod
        { x: 3400, y: 300, width: 400, height: 200, type: 'solid' },
        ...(hardMode ? [
          { x: 3550, y: 285, width: 30, height: 15, type: 'lava' }
        ] : []),
      ];

      engine.coins = [
        { id: '4_1', x: 310, y: 180, collected: false, pulseOffset: 0 },
        { id: '4_2', x: 590, y: 180, collected: false, pulseOffset: 1 },
        { id: '4_3', x: 870, y: 180, collected: false, pulseOffset: 2 },
        { id: '4_4', x: 1000, y: 300, collected: false, pulseOffset: 3 },
        { id: '4_5', x: 1250, y: 110, collected: false, pulseOffset: 4 },
        { id: '4_6', x: 1550, y: 220, collected: false, pulseOffset: 5 },
        { id: '4_7', x: 2270, y: 180, collected: false, pulseOffset: 6 },
        { id: '4_8', x: 2860, y: 200, collected: false, pulseOffset: 7 },
      ];

      engine.checkpoints = [
        { id: 'cp_4_1', x: 1250, y: 180, activated: false },
        { id: 'cp_4_2', x: 2610, y: 280, activated: false },
        { id: 'cp_4_3', x: 3480, y: 300, activated: false },
      ];
    }

    // Set react states
    setCurrentLvlCoins(0);
    setTotalLvlCoins(engine.coins.length);
  };

  // Keyboard controls effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'playing') return;
      engineRef.current.keys[e.key] = true;
      
      // Prevent scrolling in iframe for arrow keys & space
      if (['ArrowUp', 'ArrowDown', ' ', 'Spacebar'].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTab]);

  // Main game loop (when activeTab is playing)
  useEffect(() => {
    if (activeTab !== 'playing') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset loop timestamps
    engineRef.current.lastTime = performance.now();

    const updateAndRender = (timestamp: number) => {
      const engine = engineRef.current;
      const elapsed = Math.min(timestamp - engine.lastTime, 100); // capped to avoid huge teleportation jumps
      engine.lastTime = timestamp;

      // PHYSICS CONSTANTS
      // Low gravity in level 4 (Space)
      const isSpace = levelIndex === 3;
      const GRAVITY = isSpace ? (hardMode ? 0.44 : 0.32) : (hardMode ? 0.76 : 0.65);
      const MAX_FALL_SPEED = isSpace ? (hardMode ? 10 : 8) : (hardMode ? 14 : 12);
      const MOVE_ACCEL_SOLID = 0.5;
      const MOVE_ACCEL_ICE = 0.12; // lower acceleration = slides
      const DRAG_SOLID = 0.82;
      const DRAG_ICE = 0.985; // extremely low drag = slides and continues moving
      const JUMP_FORCE = isSpace ? -7.8 : -11.0;
      const DOUBLE_JUMP_FORCE = isSpace ? -6.0 : -8.5;

      // 1. UPDATE MOVING BLOCKS & LIFTS
      engine.blocks.forEach(block => {
        if (block.type === 'moving_v' && block.originY !== undefined && block.range !== undefined && block.speed !== undefined && block.dir !== undefined) {
          const actualSpeed = hardMode ? block.speed * 1.8 : block.speed;
          block.y += actualSpeed * block.dir;
          const dist = block.y - block.originY;
          if (dist > block.range) {
            block.y = block.originY + block.range;
            block.dir = -1;
          } else if (dist < 0) {
            block.y = block.originY;
            block.dir = 1;
          }
        } else if (block.type === 'moving_h' && block.originX !== undefined && block.range !== undefined && block.speed !== undefined && block.dir !== undefined) {
          const actualSpeed = hardMode ? block.speed * 1.8 : block.speed;
          block.x += actualSpeed * block.dir;
          const dist = block.x - block.originX;
          if (dist > block.range) {
            block.x = block.originX + block.range;
            block.dir = -1;
          } else if (dist < 0) {
            block.x = block.originX;
            block.dir = 1;
          }
        }

        // UPDATE DISAPPEARING platforms
        if (block.type === 'disappearing') {
          if (block.isDisappeared) {
            if (block.regrowTimer !== undefined) {
              block.regrowTimer -= elapsed;
              if (block.regrowTimer <= 0) {
                block.isDisappeared = false;
                block.disappearTimer = 0; // reset
              }
            }
          } else if (block.disappearTimer && block.disappearTimer > 0) {
            block.disappearTimer -= elapsed;
            if (block.disappearTimer <= 0) {
              block.isDisappeared = true;
              block.regrowTimer = hardMode ? 3000 : 2000; // disappears for 3 seconds in hard mode
              // spawn break particles
              createSparks(block.x + block.width / 2, block.y + block.height / 2, '#EF4444', 15);
            }
          }
        }
      });

      // 2. DETECT CURRENT PLATFORM TYPE FOR PHYSICS
      // Determine if player is standing on ice or solid to adjust drag/accel
      let standingOnIce = false;
      let standingOnMovingBlock: Block | null = null;

      // Temporary player bounds
      const px = engine.playerX;
      const py = engine.playerY;
      const pw = engine.playerWidth;
      const ph = engine.playerHeight;

      // 3. APPLY CONTROLS & HORIZONTAL PHYSICS
      let inputX = 0;
      if (engine.keys['ArrowLeft'] || engine.keys['a']) inputX = -1;
      if (engine.keys['ArrowRight'] || engine.keys['d']) inputX = 1;

      // Jump control (W, ArrowUp, or Space)
      const wantsToJump = engine.keys['ArrowUp'] || engine.keys['w'] || engine.keys[' '];
      
      // Determine floor properties just below player
      engine.blocks.forEach(block => {
        if (block.isDisappeared) return;
        const colH = px + pw > block.x && px < block.x + block.width;
        const colV = Math.abs((py + ph) - block.y) < 2.5; // very close to top
        if (colH && colV) {
          if (block.type === 'ice') standingOnIce = true;
          if (block.type === 'moving_v' || block.type === 'moving_h') standingOnMovingBlock = block;
        }
      });

      const accel = standingOnIce ? MOVE_ACCEL_ICE : MOVE_ACCEL_SOLID;
      const drag = standingOnIce ? DRAG_ICE : DRAG_SOLID;

      engine.vx += inputX * accel;
      engine.vx *= drag;

      // If standing on a moving horizontal platform, carry its velocity
      if (standingOnMovingBlock && standingOnMovingBlock.type === 'moving_h' && standingOnMovingBlock.speed !== undefined && standingOnMovingBlock.dir !== undefined) {
        engine.playerX += standingOnMovingBlock.speed * standingOnMovingBlock.dir;
      }

      // Apply horizontal position change
      engine.playerX += engine.vx;

      // Wall collisions (horizontal resolution)
      engine.blocks.forEach(block => {
        if (block.isDisappeared || block.type === 'lava') return;
        // Collision check
        const overlapX = Math.min(engine.playerX + pw - block.x, block.x + block.width - engine.playerX);
        const overlapY = Math.min(engine.playerY + ph - block.y, block.y + block.height - engine.playerY);

        if (engine.playerX + pw > block.x && engine.playerX < block.x + block.width &&
            engine.playerY + ph > block.y && engine.playerY < block.y + block.height) {
          // Resolve on the shallower axis
          if (overlapX < overlapY) {
            if (engine.playerX + pw / 2 < block.x + block.width / 2) {
              engine.playerX -= overlapX;
            } else {
              engine.playerX += overlapX;
            }
            engine.vx = 0;
          }
        }
      });

      // 4. VERTICAL PHYSICS (GRAVITY)
      engine.vy += GRAVITY;
      if (engine.vy > MAX_FALL_SPEED) engine.vy = MAX_FALL_SPEED;
      engine.playerY += engine.vy;

      // Ground & platform collisions (vertical resolution)
      engine.isGrounded = false;
      engine.blocks.forEach(block => {
        if (block.isDisappeared || block.type === 'lava') return;

        if (engine.playerX + pw > block.x && engine.playerX < block.x + block.width &&
            engine.playerY + ph > block.y && engine.playerY < block.y + block.height) {
          
          const overlapX = Math.min(engine.playerX + pw - block.x, block.x + block.width - engine.playerX);
          const overlapY = Math.min(engine.playerY + ph - block.y, block.y + block.height - engine.playerY);

          if (overlapY <= overlapX) {
            if (engine.playerY + ph / 2 < block.y + block.height / 2) {
              // Stepped on top of block
              engine.playerY -= overlapY;
              engine.vy = 0;
              engine.isGrounded = true;
              engine.doubleJumpAvailable = true;

              // Bouncy Trampoline action!
              if (block.type === 'bounce') {
                engine.vy = isSpace ? -10.5 : -14.5; // super spring!
                engine.isGrounded = false;
                if (!soundMuted) playObbySound('bounce');
                createSparks(engine.playerX + pw / 2, block.y, '#10B981', 12);
              }

              // Trigger Disappearing platform countdown
              if (block.type === 'disappearing' && (!block.disappearTimer || block.disappearTimer === 0)) {
                block.disappearTimer = hardMode ? 220 : 450; // starts disappearing in 220ms in hard mode
              }
            } else {
              // Hit head from below
              engine.playerY += overlapY;
              engine.vy = 0.5; // bounce slightly downwards
            }
          }
        }
      });

      // 5. JUMPING LOGIC (With single-key trigger debounce)
      if (wantsToJump) {
        if (engine.isGrounded) {
          engine.vy = JUMP_FORCE;
          engine.isGrounded = false;
          if (!soundMuted) playObbySound('jump');
          // spawn small puff particles
          createSparks(engine.playerX + pw / 2, engine.playerY + ph, '#FFFFFF', 6);
          engine.keys['ArrowUp'] = false; // consume input
          engine.keys['w'] = false;
          engine.keys[' '] = false;
        } else if (engine.doubleJumpAvailable) {
          // Double jump trigger
          engine.vy = DOUBLE_JUMP_FORCE;
          engine.doubleJumpAvailable = false;
          if (!soundMuted) playObbySound('jump');
          createSparks(engine.playerX + pw / 2, engine.playerY + ph / 2, '#3B82F6', 10);
          engine.keys['ArrowUp'] = false; // consume
          engine.keys['w'] = false;
          engine.keys[' '] = false;
        }
      }

      // Boundary limits & bottomless pits death
      if (engine.playerX < 0) engine.playerX = 0;
      if (engine.playerY > engine.worldHeight + 100) {
        triggerDeath();
      }

      // 6. COLLISION WITH HAZARDS (LAVA)
      engine.blocks.forEach(block => {
        if (block.type === 'lava' && !block.isDisappeared) {
          if (engine.playerX + pw - 2 > block.x && engine.playerX + 2 < block.x + block.width &&
              engine.playerY + ph - 2 > block.y && engine.playerY + 2 < block.y + block.height) {
            triggerDeath();
          }
        }
      });

      // 7. CHECKPOINT TRIGGER
      engine.checkpoints.forEach(cp => {
        if (!cp.activated) {
          const dist = Math.hypot((engine.playerX + pw/2) - cp.x, (engine.playerY + ph/2) - cp.y);
          if (dist < 40) {
            cp.activated = true;
            engine.lastCheckpointX = cp.x;
            engine.lastCheckpointY = cp.y - 20;
            if (!soundMuted) playObbySound('checkpoint');
            createSparks(cp.x, cp.y, '#10B981', 25);
          }
        }
      });

      // 8. COIN COLLECTION
      engine.coins.forEach(coin => {
        if (!coin.collected) {
          const dist = Math.hypot((engine.playerX + pw/2) - coin.x, (engine.playerY + ph/2) - coin.y);
          if (dist < 28) {
            coin.collected = true;
            if (!soundMuted) playObbySound('coin');
            createSparks(coin.x, coin.y, '#F59E0B', 15);
            
            // Increment local level state & total balance
            setCoinsBalance(prev => {
              const next = prev + 1;
              localStorage.setItem('obby_coins_v1', String(next));
              return next;
            });
            setCurrentLvlCoins(prev => prev + 1);
          }
        }
      });

      // 9. REACH FINISH LINE PORTAL
      const finishPortalDist = Math.hypot((engine.playerX + pw/2) - engine.finishX, (engine.playerY + ph/2) - engine.finishY);
      if (finishPortalDist < 45) {
        // Complete stage!
        handleLevelComplete();
        return; // stop loop
      }

      // 10. GENERATE CHOSEN AVATAR TRAIL PARTICLES
      if (equippedTrail !== 'none' && Math.random() < 0.35) {
        const trailColor = TRAILS.find(t => t.id === equippedTrail)?.color || '#A855F7';
        engine.particles.push({
          x: engine.playerX + pw / 2 - 4 + Math.random() * 8,
          y: engine.playerY + ph / 2 - 4 + Math.random() * 8,
          vx: -engine.vx * 0.4 + (Math.random() - 0.5) * 0.5,
          vy: -engine.vy * 0.4 + (Math.random() - 0.5) * 0.5,
          color: trailColor,
          size: 2 + Math.random() * 3,
          alpha: 1,
          life: 1
        });
      }

      // 11. CAMERA TRACKING SMOOTHLY
      // center on player, boundary clamped
      const targetCamX = engine.playerX - canvas.width / 2;
      const targetCamY = engine.playerY - canvas.height / 2 - 40;
      engine.cameraX += (targetCamX - engine.cameraX) * 0.1;
      engine.cameraY += (targetCamY - engine.cameraY) * 0.1;

      const maxCamX = engine.worldWidth - canvas.width;
      const maxCamY = engine.worldHeight - canvas.height;
      if (engine.cameraX < 0) engine.cameraX = 0;
      if (engine.cameraX > maxCamX) engine.cameraX = maxCamX;
      if (engine.cameraY < -100) engine.cameraY = -100;
      if (engine.cameraY > maxCamY) engine.cameraY = maxCamY;

      // 12. RENDER THE SCENE
      // Fill beautiful sky backdrop gradient matching stage theme
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (levelIndex === 0) {
        // Greenhills Day Sky
        gradient.addColorStop(0, '#0F172A');
        gradient.addColorStop(0.5, '#1E1B4B');
        gradient.addColorStop(1, '#311042');
      } else if (levelIndex === 1) {
        // Cyber Lava Cave Sunset/Red
        gradient.addColorStop(0, '#110202');
        gradient.addColorStop(0.5, '#2D0606');
        gradient.addColorStop(1, '#530A0A');
      } else if (levelIndex === 2) {
        // Celestial Cloud blue/pink
        gradient.addColorStop(0, '#1E1B4B');
        gradient.addColorStop(0.5, '#4C1D95');
        gradient.addColorStop(1, '#831843');
      } else {
        // Quantum Space starscape
        gradient.addColorStop(0, '#020617');
        gradient.addColorStop(0.5, '#0B1329');
        gradient.addColorStop(1, '#1E1B4B');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Star particles or atmospheric details for space/sky
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let i = 0; i < 25; i++) {
        const starX = (Math.sin(i * 123.45) * 0.5 + 0.5) * canvas.width;
        const starY = (Math.cos(i * 987.6) * 0.5 + 0.5) * canvas.height;
        ctx.fillRect(starX, starY, 1.5, 1.5);
      }

      ctx.save();
      // Translate by camera position
      ctx.translate(-engine.cameraX, -engine.cameraY);

      // RENDER LEVEL SOLID BLOCKS & HAZARDS
      engine.blocks.forEach(block => {
        if (block.isDisappeared) return;

        ctx.save();
        ctx.beginPath();
        
        // Define style based on blocks
        if (block.type === 'solid') {
          // Glassy cyber grid look
          const platGrad = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.height);
          platGrad.addColorStop(0, '#334155');
          platGrad.addColorStop(1, '#1E293B');
          ctx.fillStyle = platGrad;
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.fillRect(block.x, block.y, block.width, block.height);
          ctx.strokeRect(block.x, block.y, block.width, block.height);
          
          // Draw simple top grassy line
          ctx.fillStyle = levelIndex === 0 ? '#10B981' : '#6366F1';
          ctx.fillRect(block.x, block.y, block.width, 4);

        } else if (block.type === 'ice') {
          // Cyan icy slippery platform
          ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
          ctx.strokeStyle = '#22D3EE';
          ctx.lineWidth = 2;
          ctx.fillRect(block.x, block.y, block.width, block.height);
          ctx.strokeRect(block.x, block.y, block.width, block.height);
          
          // Shining icicles highlight
          ctx.fillStyle = '#E0F7FA';
          ctx.fillRect(block.x, block.y, block.width, 3);

        } else if (block.type === 'bounce') {
          // Bouncy neon green spring pad
          ctx.fillStyle = '#059669';
          ctx.strokeStyle = '#34D399';
          ctx.lineWidth = 2;
          ctx.fillRect(block.x, block.y, block.width, block.height);
          ctx.strokeRect(block.x, block.y, block.width, block.height);
          
          // Draw dynamic zigzag springs
          ctx.fillStyle = '#10B981';
          ctx.fillRect(block.x + 8, block.y + 4, block.width - 16, 4);
          ctx.fillRect(block.x + 16, block.y + 10, block.width - 32, 4);

        } else if (block.type === 'disappearing') {
          // Fading platform
          const opacity = block.disappearTimer ? (block.disappearTimer / 450) : 1;
          ctx.fillStyle = `rgba(239, 68, 68, ${opacity})`;
          ctx.strokeStyle = `rgba(248, 113, 113, ${opacity})`;
          ctx.lineWidth = 1.5;
          ctx.fillRect(block.x, block.y, block.width, block.height);
          ctx.strokeRect(block.x, block.y, block.width, block.height);
          
          // Danger Warning lines inside
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.4})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(block.x, block.y);
          ctx.lineTo(block.x + block.width, block.y + block.height);
          ctx.stroke();

        } else if (block.type === 'lava') {
          // Glowing hazard block (red-orange lava stream)
          const lavaGrad = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.height);
          lavaGrad.addColorStop(0, '#DC2626');
          lavaGrad.addColorStop(0.5, '#EA580C');
          lavaGrad.addColorStop(1, '#7C2D12');
          ctx.fillStyle = lavaGrad;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#EA580C';
          ctx.fillRect(block.x, block.y, block.width, block.height);
          
          // Draw bubbles
          ctx.fillStyle = '#F97316';
          for (let b = 0; b < block.width / 40; b++) {
            const bX = block.x + (b * 40) + ((timestamp * 0.05 + b * 200) % 30);
            const bY = block.y + 6 + (Math.sin(timestamp * 0.01 + b) * 3);
            ctx.beginPath();
            ctx.arc(bX, bY, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

        } else if (block.type === 'moving_v' || block.type === 'moving_h') {
          // Yellow moving lift
          ctx.fillStyle = '#4F46E5';
          ctx.strokeStyle = '#818CF8';
          ctx.lineWidth = 2;
          ctx.fillRect(block.x, block.y, block.width, block.height);
          ctx.strokeRect(block.x, block.y, block.width, block.height);
          // arrow indicators
          ctx.fillStyle = '#A5B4FC';
          ctx.fillRect(block.x + block.width / 2 - 10, block.y + block.height / 2 - 2, 20, 4);
        }
        ctx.restore();
      });

      // RENDER CHECKPOINT FLAGS
      engine.checkpoints.forEach(cp => {
        ctx.save();
        // Flag pole
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y);
        ctx.lineTo(cp.x, cp.y - 45);
        ctx.stroke();

        // Flag triangle banner
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y - 45);
        ctx.lineTo(cp.x + 22, cp.y - 34);
        ctx.lineTo(cp.x, cp.y - 23);
        ctx.closePath();

        if (cp.activated) {
          ctx.fillStyle = '#10B981'; // Green (Active)
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#10B981';
        } else {
          ctx.fillStyle = '#EF4444'; // Red (Inactive)
        }
        ctx.fill();

        // Glow circle on base
        ctx.fillStyle = cp.activated ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.1)';
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // RENDER COINS (GOLD STAR)
      engine.coins.forEach(coin => {
        if (coin.collected) return;
        
        ctx.save();
        const floatY = Math.sin(timestamp * 0.005 + coin.pulseOffset) * 6;
        const cy = coin.y + floatY;

        // Shiny golden coin
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#F59E0B';
        ctx.fillStyle = '#FBBF24';
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(coin.x, cy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner star shine
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('$', coin.x - 3, cy + 3.5);

        ctx.restore();
      });

      // RENDER FINISH LINE PORTAL
      ctx.save();
      ctx.translate(engine.finishX, engine.finishY);
      // Spinning portals
      const rotation = timestamp * 0.0025;
      ctx.rotate(rotation);
      
      const portalGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, 35);
      portalGrad.addColorStop(0, '#FFFFFF');
      portalGrad.addColorStop(0.3, '#EC4899');
      portalGrad.addColorStop(0.7, '#8B5CF6');
      portalGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
      
      ctx.fillStyle = portalGrad;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#EC4899';
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.fill();

      // Spinning spiral sparks
      ctx.fillStyle = '#FFF';
      for (let s = 0; s < 4; s++) {
        const angle = s * (Math.PI / 2);
        ctx.fillRect(Math.cos(angle) * 18 - 2, Math.sin(angle) * 18 - 2, 4, 4);
      }
      ctx.restore();

      // RENDER PARTICLE SYSTEMS (sparks, explosions)
      engine.particles = engine.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.022;
        p.life -= 0.02;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return p.alpha > 0 && p.life > 0;
      });

      // RENDER PLAYER CHARACTER WITH SKINS & ANIME EMOTION
      ctx.save();
      ctx.shadowBlur = 12;
      
      const currentSkin = SKINS.find(s => s.id === equippedSkin) || SKINS[0];
      ctx.shadowColor = currentSkin.color;
      
      // Cycling Rainbow effect for legendary skin
      let drawColor = currentSkin.color;
      if (currentSkin.id === 'rainbow') {
        const hue = (timestamp * 0.15) % 360;
        drawColor = `hsl(${hue}, 90%, 65%)`;
      }

      // Draw cube body
      ctx.fillStyle = drawColor;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.fillRect(engine.playerX, engine.playerY, pw, ph);
      ctx.strokeRect(engine.playerX, engine.playerY, pw, ph);

      // Cute face eyes & mouth (responsive to speed / jump)
      ctx.fillStyle = '#FFF';
      const lookDirection = engine.vx >= 0.1 ? 2 : (engine.vx <= -0.1 ? -2 : 0);
      
      // Eyes
      const eyeHeight = engine.vy < -0.5 ? 4 : (Math.random() < 0.015 ? 1 : 6); // squint on jump / blink
      ctx.fillRect(engine.playerX + 5 + lookDirection, engine.playerY + 6, 4, eyeHeight);
      ctx.fillRect(engine.playerX + 15 + lookDirection, engine.playerY + 6, 4, eyeHeight);

      // Cute mouth
      ctx.fillStyle = '#000';
      if (engine.vy > 1.5) {
        // Falling (scared face "O")
        ctx.beginPath();
        ctx.arc(engine.playerX + 12 + lookDirection, engine.playerY + 18, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Happy smile smile
        ctx.fillRect(engine.playerX + 10 + lookDirection, engine.playerY + 17, 4, 2);
      }

      ctx.restore();
      ctx.restore(); // camera translate restore

      // LOOP AGAIN
      engine.animFrameId = requestAnimationFrame(updateAndRender);
    };

    // Sparks generator helper
    const createSparks = (x: number, y: number, color: string, count = 10) => {
      const engine = engineRef.current;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 3.5;
        engine.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: 1.5 + Math.random() * 3,
          alpha: 1,
          life: 1
        });
      }
    };

    // Trigger death and respawn at checkpoint
    const triggerDeath = () => {
      const engine = engineRef.current;
      if (!soundMuted) playObbySound('die');
      
      // Spawn lots of death sparks
      const skinColor = SKINS.find(s => s.id === equippedSkin)?.color || '#A855F7';
      createSparks(engine.playerX + engine.playerWidth / 2, engine.playerY + engine.playerHeight / 2, skinColor, 35);

      // Increment death metrics
      engine.deaths += 1;
      setDeathsCount(engine.deaths);

      // Reset velocities
      engine.vx = 0;
      engine.vy = 0;

      // Teleport back to last checkpoint
      engine.playerX = engine.lastCheckpointX;
      engine.playerY = engine.lastCheckpointY;
    };

    animId = requestAnimationFrame(updateAndRender);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeTab, levelIndex, equippedSkin, equippedTrail, soundMuted, hardMode]);

  // Clean-up controls on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current.animFrameId) {
        cancelAnimationFrame(engineRef.current.animFrameId);
      }
    };
  }, []);

  const handleStartGame = (idx = levelIndex) => {
    setLevelIndex(idx);
    engineRef.current.deaths = 0;
    setDeathsCount(0);
    buildLevel(idx);
    setActiveTab('playing');
    if (!soundMuted) playObbySound('jump');
  };

  const handleLevelComplete = () => {
    if (!soundMuted) playObbySound('win');
    
    // Add completion bonus coins! (doubled in hardMode!)
    const baseBonus = 15 + levelIndex * 10;
    const bonus = hardMode ? baseBonus * 2 : baseBonus;
    setCoinsBalance(prev => {
      const next = prev + bonus;
      localStorage.setItem('obby_coins_v1', String(next));
      return next;
    });

    // Advance level if possible, else go to victory
    if (levelIndex < 3) {
      setActiveTab('victory');
    } else {
      // Finished all levels! Legendary!
      setActiveTab('victory');
    }
  };

  // Mobile virtual buttons support
  const pressVirtualKey = (key: string, pressed: boolean) => {
    engineRef.current.keys[key] = pressed;
  };

  // Buy Skin or Trail inside Shop
  const buySkin = (skin: Skin) => {
    if (coinsBalance < skin.price) return;
    
    // Deduct coins
    const nextCoins = coinsBalance - skin.price;
    setCoinsBalance(nextCoins);
    localStorage.setItem('obby_coins_v1', String(nextCoins));

    // Add to unlocked list
    const nextUnlocked = [...unlockedSkins, skin.id];
    setUnlockedSkins(nextUnlocked);
    localStorage.setItem('obby_unlocked_skins_v1', JSON.stringify(nextUnlocked));

    // Auto-equip
    setEquippedSkin(skin.id);
    localStorage.setItem('obby_equipped_skin_v1', skin.id);

    if (!soundMuted) playObbySound('unlock');
  };

  const buyTrail = (trail: Trail) => {
    if (coinsBalance < trail.price) return;

    // Deduct
    const nextCoins = coinsBalance - trail.price;
    setCoinsBalance(nextCoins);
    localStorage.setItem('obby_coins_v1', String(nextCoins));

    // Unlock
    const nextUnlocked = [...unlockedTrails, trail.id];
    setUnlockedTrails(nextUnlocked);
    localStorage.setItem('obby_unlocked_trails_v1', JSON.stringify(nextUnlocked));

    // Equip
    setEquippedTrail(trail.id);
    localStorage.setItem('obby_equipped_trail_v1', trail.id);

    if (!soundMuted) playObbySound('unlock');
  };

  const selectSkin = (id: string) => {
    setEquippedSkin(id);
    localStorage.setItem('obby_equipped_skin_v1', id);
    if (!soundMuted) playObbySound('jump');
  };

  const selectTrail = (id: string) => {
    setEquippedTrail(id);
    localStorage.setItem('obby_equipped_trail_v1', id);
    if (!soundMuted) playObbySound('jump');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#192837] bg-opacity-75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] text-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border-2 border-indigo-500/60 flex flex-col relative select-none">
        
        {/* Game Header */}
        <div className="bg-slate-950 px-5 py-4 flex items-center justify-between border-b border-indigo-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl text-white">
              <Gamepad2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-tight uppercase text-indigo-400 flex items-center gap-2">
                {isMn ? "Болдын Обби Саад" : "Bold's Obby Adventure"}
                <span className="text-[9px] bg-indigo-900/40 text-indigo-200 border border-indigo-700 px-1 rounded font-mono">BETA v1.1</span>
              </h3>
              <p className="text-[10px] text-slate-400">
                {isMn ? "Хөгжилтэй паркур, саадыг даван туулаарай! 🏃‍♂️💨" : "Epic jumping obstacle course game! Collect cash!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundMuted(!soundMuted)}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Toggle sound"
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-900 hover:bg-red-950 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Inner Tab Router */}
        <AnimatePresence mode="wait">
          
          {/* LOBBY TAB */}
          {activeTab === 'lobby' && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="p-5 flex flex-col space-y-4"
            >
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-xl border border-yellow-500/20 flex items-center justify-center text-yellow-400 text-lg">
                    🪙
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{isMn ? "Миний Зоос" : "Total Cash Balance"}</p>
                    <p className="text-lg font-black text-yellow-400 font-mono">{coinsBalance} <span className="text-xs">COINS</span></p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('shop')}
                  className="px-4 py-2 bg-indigo-900/50 hover:bg-indigo-900 border border-indigo-700/50 rounded-xl text-xs font-bold text-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isMn ? "Шоо Хэлбэр, Утаа" : "Skins & Trails Shop"}</span>
                </button>
              </div>

              {/* Difficulty Mode Toggle */}
              <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg transition-all ${
                    hardMode 
                      ? "bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]" 
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}>
                    {hardMode ? "🔥" : "🟢"}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{isMn ? "Хүндрэлийн Шат" : "DIFFICULTY LEVEL"}</p>
                    <p className={`text-xs sm:text-sm font-black tracking-wide ${hardMode ? "text-red-400" : "text-emerald-400"}`}>
                      {hardMode 
                        ? (isMn ? "ЧАНГА / HARD MODE 🔥" : "HARD MODE 🔥") 
                        : (isMn ? "ХЭВИЙН / NORMAL MODE" : "NORMAL MODE")}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const nextMode = !hardMode;
                    setHardMode(nextMode);
                    localStorage.setItem('obby_hard_mode_v1', String(nextMode));
                    if (!soundMuted) playObbySound('checkpoint');
                  }}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                    hardMode 
                      ? "bg-red-950/60 hover:bg-red-950 border-red-500 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                  }`}
                >
                  <span>{hardMode ? (isMn ? "Хэвийн болгох" : "Switch to Normal") : (isMn ? "Чанга болгох 🔥" : "Activate Hard Mode 🔥")}</span>
                </button>
              </div>

              {/* Levels Selection List */}
              <div className="space-y-2.5">
                <p className="text-xs text-[#ec4899] font-mono uppercase tracking-widest font-black flex items-center gap-1">
                  <Compass className="w-4 h-4" />
                  <span>{isMn ? "Үе Сонгох (4 ҮЕ)" : "SELECT STAGE (4 CHAPTERS)"}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* STAGE 1 */}
                  <button
                    onClick={() => handleStartGame(0)}
                    className="p-3.5 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500 text-left transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs text-emerald-400 font-bold font-mono">STAGE 1</p>
                      <p className="text-sm font-black text-white mt-0.5">{isMn ? "Анхан Шатны Хөндий" : "Greenhill Valley"}</p>
                      <p className="text-[10px] text-slate-400">{isMn ? "Саадад суралцах анхны үе" : "Intro to jumping & checkpoints"}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform group-hover:text-emerald-400" />
                  </button>

                  {/* STAGE 2 */}
                  <button
                    onClick={() => handleStartGame(1)}
                    className="p-3.5 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-red-500 text-left transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs text-red-400 font-bold font-mono">STAGE 2</p>
                      <p className="text-sm font-black text-white mt-0.5">{isMn ? "Кибер Лаавын Агуй" : "Cyber Lava Cavern"}</p>
                      <p className="text-[10px] text-slate-400">{isMn ? "Халтиргаатай мөс, улаан лаав" : "Slippery ice & moving hazards"}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform group-hover:text-red-400" />
                  </button>

                  {/* STAGE 3 */}
                  <button
                    onClick={() => handleStartGame(2)}
                    className="p-3.5 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-400 text-left transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs text-indigo-400 font-bold font-mono">STAGE 3</p>
                      <p className="text-sm font-black text-white mt-0.5">{isMn ? "Тэнгэрийн Үүлэн Орон" : "Celestial Cloudlands"}</p>
                      <p className="text-[10px] text-slate-400">{isMn ? "Үсрэлт, сарних тавцангууд" : "Trampolines & vanishing clouds"}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform group-hover:text-indigo-400" />
                  </button>

                  {/* STAGE 4 */}
                  <button
                    onClick={() => handleStartGame(3)}
                    className="p-3.5 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-400 text-left transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs text-purple-400 font-bold font-mono">STAGE 4</p>
                      <p className="text-sm font-black text-white mt-0.5">{isMn ? "Сансрын Саад Станц" : "Quantum Space Station"}</p>
                      <p className="text-[10px] text-slate-400">{isMn ? "Гравитаци багатай сансар" : "Ultra low-gravity laser jumps"}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform group-hover:text-purple-400" />
                  </button>
                </div>
              </div>

              {/* Instructions and tips */}
              <div className="bg-slate-900/30 border border-slate-950 p-3.5 rounded-2xl text-xs text-slate-400 leading-relaxed font-mono">
                <p className="font-bold text-slate-300 flex items-center gap-1 mb-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
                  <span>{isMn ? "🕹️ Тоглох заавар:" : "🕹️ Gameplay Instructions:"}</span>
                </p>
                <p>{isMn ? "• Хөдлөх: А / D эсвэл Зүүн / Баруун сумнууд" : "• Move: A / D or Left / Right Arrows"}</p>
                <p>{isMn ? "• Үсрэх: W, СУМ ДЭЭШ эсвэл Хоосон зай (Space) - Давхар үсрэх боломжтой!" : "• Jump: W, UP Arrow, or SPACE - Double Jump is enabled!"}</p>
                <p>{isMn ? "• Улаан лаав болон аюулд хүрвэл сүүлчийн далбаан дээрээ дахин амилна." : "• Avoid red lava and hazards! Reach glowing Checkpoint flags to save progress."}</p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => handleStartGame(0)}
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-sm px-14 py-3.5 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isMn ? "ЭХНИЙ ҮЕЭС ТОГЛОХ 🚀" : "START ADVENTURE 🚀"}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* SHOP TAB */}
          {activeTab === 'shop' && (
            <motion.div 
              key="shop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-5 flex flex-col space-y-4 max-h-[480px] overflow-y-auto"
            >
              {/* shop balance header */}
              <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-300 font-mono">
                  {isMn ? "МӨНГӨНИЙ БАЛАНС:" : "YOUR BALANCE:"} <strong className="text-yellow-400 font-black text-sm">{coinsBalance} 🪙</strong>
                </div>
                <button
                  onClick={() => setActiveTab('lobby')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-bold transition-all cursor-pointer"
                >
                  {isMn ? "Буцах" : "Back to Lobby"}
                </button>
              </div>

              {/* Skins shop section */}
              <div className="space-y-2">
                <h4 className="text-xs text-[#ec4899] font-mono font-black uppercase tracking-widest flex items-center gap-1">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isMn ? "ШОО АВАТАРУУД" : "CHARACTER SKINS"}</span>
                </h4>

                <div className="grid grid-cols-1 gap-2">
                  {SKINS.map(skin => {
                    const isUnlocked = unlockedSkins.includes(skin.id);
                    const isEquipped = equippedSkin === skin.id;

                    return (
                      <div 
                        key={skin.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isEquipped 
                            ? 'bg-indigo-950/40 border-indigo-500/80' 
                            : 'bg-slate-900/40 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl border shadow-md font-black shrink-0"
                            style={{ backgroundColor: skin.color, borderColor: '#fff' }}
                          >
                            {skin.emoji}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">{isMn ? skin.nameMn : skin.nameEn}</p>
                            <p className="text-[10px] text-slate-400">{isMn ? skin.descriptionMn : skin.descriptionEn}</p>
                          </div>
                        </div>

                        {isUnlocked ? (
                          isEquipped ? (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-bold">
                              {isMn ? "Өмссөн" : "Equipped"}
                            </span>
                          ) : (
                            <button
                              onClick={() => selectSkin(skin.id)}
                              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200 font-bold transition-all cursor-pointer"
                            >
                              {isMn ? "Өмсөх" : "Equip"}
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => buySkin(skin)}
                            disabled={coinsBalance < skin.price}
                            className={`text-[10px] px-3 py-1.5 rounded-lg font-black transition-all flex items-center gap-1 cursor-pointer ${
                              coinsBalance >= skin.price 
                                ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <span>🪙 {skin.price}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trails shop section */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs text-cyan-400 font-mono font-black uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                  <span>{isMn ? "ГЭРЛЭН СҮҮЛ, УТАА" : "PARTICLE TRAILS"}</span>
                </h4>

                <div className="grid grid-cols-1 gap-2">
                  {TRAILS.map(trail => {
                    const isUnlocked = unlockedTrails.includes(trail.id);
                    const isEquipped = equippedTrail === trail.id;

                    return (
                      <div 
                        key={trail.id}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isEquipped 
                            ? 'bg-indigo-950/40 border-cyan-500/80' 
                            : 'bg-slate-900/40 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center border border-dashed border-slate-700 shrink-0"
                            style={{ boxShadow: trail.color !== 'transparent' ? `0 0 10px ${trail.color}` : 'none' }}
                          >
                            <span className="text-xs" style={{ color: trail.color }}>✴️</span>
                          </div>
                          <div>
                            <p className="text-xs font-black text-white">{isMn ? trail.nameMn : trail.nameEn}</p>
                            <p className="text-[10px] text-slate-400">{isMn ? trail.descriptionMn : trail.descriptionEn}</p>
                          </div>
                        </div>

                        {isUnlocked ? (
                          isEquipped ? (
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full font-bold">
                              {isMn ? "Сонгосон" : "Active"}
                            </span>
                          ) : (
                            <button
                              onClick={() => selectTrail(trail.id)}
                              className="text-[10px] bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200 font-bold transition-all cursor-pointer"
                            >
                              {isMn ? "Сонгох" : "Use"}
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => buyTrail(trail)}
                            disabled={coinsBalance < trail.price}
                            className={`text-[10px] px-3 py-1.5 rounded-lg font-black transition-all flex items-center gap-1 cursor-pointer ${
                              coinsBalance >= trail.price 
                                ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <span>🪙 {trail.price}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ACTIVE PLAYING SCREEN */}
          {activeTab === 'playing' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col"
            >
              {/* Heads Up Display (HUD) */}
              <div className="bg-slate-950 px-5 py-2.5 flex justify-between items-center text-xs font-mono border-b border-indigo-950/60">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-[#ec4899] font-black">STAGE {levelIndex + 1}:</span>
                    <span className="text-slate-300 font-bold">
                      {levelIndex === 0 && (isMn ? "Маргад Хөндий" : "Greenhill")}
                      {levelIndex === 1 && (isMn ? "Кибер Лаав" : "Lava Cavern")}
                      {levelIndex === 2 && (isMn ? "Тэнгэрийн Үүлс" : "Celestial Clouds")}
                      {levelIndex === 3 && (isMn ? "Сантрын Станц" : "Space Station")}
                    </span>
                  </div>

                  {hardMode && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-950 text-red-400 border border-red-800/60 animate-pulse flex items-center gap-0.5 shrink-0">
                      <span>🔥</span>
                      <span>{isMn ? "ЧАНГА" : "HARD"}</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1 text-yellow-400 font-extrabold">
                    <span>🪙</span>
                    <span>{currentLvlCoins} / {totalLvlCoins}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 font-bold text-red-400">
                    <Heart className="w-3.5 h-3.5 fill-red-400" />
                    <span>{deathsCount} {isMn ? "Үхэл" : "Deaths"}</span>
                  </div>

                  <button
                    onClick={() => {
                      if (engineRef.current.animFrameId) {
                        cancelAnimationFrame(engineRef.current.animFrameId);
                      }
                      setActiveTab('lobby');
                    }}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded"
                  >
                    {isMn ? "Буцах" : "Exit"}
                  </button>
                </div>
              </div>

              {/* Game canvas window */}
              <div className="relative bg-black flex justify-center items-center h-[350px] sm:h-[400px]">
                <canvas
                  ref={canvasRef}
                  width={540}
                  height={400}
                  className="w-full h-full max-w-[540px] block"
                />

                {/* Mobile Virtual Controls */}
                <div className="absolute bottom-3 left-4 right-4 flex justify-between pointer-events-none md:hidden">
                  
                  {/* Left / Right directional buttons */}
                  <div className="flex gap-2 pointer-events-auto">
                    <button
                      onTouchStart={() => pressVirtualKey('a', true)}
                      onTouchEnd={() => pressVirtualKey('a', false)}
                      className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-slate-800 text-white font-extrabold text-2xl border border-slate-700 select-none touch-none shadow-md flex items-center justify-center active:scale-95"
                    >
                      ◀
                    </button>
                    <button
                      onTouchStart={() => pressVirtualKey('d', true)}
                      onTouchEnd={() => pressVirtualKey('d', false)}
                      className="w-14 h-14 rounded-2xl bg-slate-900/80 active:bg-slate-800 text-white font-extrabold text-2xl border border-slate-700 select-none touch-none shadow-md flex items-center justify-center active:scale-95"
                    >
                      ▶
                    </button>
                  </div>

                  {/* Jump button */}
                  <div className="pointer-events-auto">
                    <button
                      onTouchStart={() => pressVirtualKey(' ', true)}
                      onTouchEnd={() => pressVirtualKey(' ', false)}
                      className="w-16 h-14 rounded-2xl bg-indigo-600/95 active:bg-indigo-500 text-white font-extrabold border border-indigo-400 select-none touch-none shadow-lg shadow-indigo-600/30 flex items-center justify-center active:scale-95"
                    >
                      🚀 {isMn ? "ҮСРЭХ" : "JUMP"}
                    </button>
                  </div>

                </div>
              </div>

              {/* Help strip footer */}
              <div className="bg-slate-950 p-2 text-center text-[9px] text-slate-500 font-mono border-t border-indigo-950/60">
                {isMn 
                  ? "⌨️ [A / D эсвэл сумнууд] хөдөлнө. [Space / W] үсрэнэ. Давхар үсрэх боломжтой."
                  : "⌨️ Move with [A/D] or arrows. Jump with [Space/W]. Supports double jumping!"}
              </div>
            </motion.div>
          )}

          {/* VICTORY / STAGE CLEAR TAB */}
          {activeTab === 'victory' && (
            <motion.div 
              key="victory"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-950/40 flex items-center justify-center border-2 border-emerald-500 animate-bounce">
                <Trophy className="w-9 h-9 text-emerald-400" />
              </div>
              
              <div>
                <h4 className="text-2xl font-black text-emerald-400 uppercase tracking-wider">
                  {isMn ? "ҮЕИЙГ ДАВЛАА! 🎉" : "STAGE CLEARED! 🎉"}
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mt-1 mx-auto leading-relaxed">
                  {isMn 
                    ? `Баяр хүргэе! Та үеийг амжилттай давлаа. Хадгалсан далбаа болон цуглуулсан зоосоороо гоё хэлбэр худалдаж аваарай.`
                    : `Amazing platforming skills! You reached the portal with minimal casualties. Bonus coins have been deposited to your gamer pocket.`}
                </p>
              </div>

              {/* Stage metrics summary */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 font-mono text-center">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">{isMn ? "Үхлийн Тоо" : "Casualties"}</p>
                  <p className="text-base font-black text-red-400">{deathsCount} 💀</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase">{isMn ? "Авсан Урамшуулал" : "Chapter Bonus"}</p>
                  <p className="text-base font-black text-yellow-400">
                    +{hardMode ? (15 + levelIndex * 10) * 2 : (15 + levelIndex * 10)} 🪙
                    {hardMode && <span className="block text-[8px] text-red-400 font-bold tracking-tight mt-0.5 animate-pulse">(HARD x2 BONUS!)</span>}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2.5 w-full max-w-sm justify-center">
                <button
                  onClick={() => setActiveTab('shop')}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isMn ? "Шоп орох" : "Go to Shop"}</span>
                </button>

                {levelIndex < 3 ? (
                  <button
                    onClick={() => {
                      const nextLvl = levelIndex + 1;
                      setLevelIndex(nextLvl);
                      handleStartGame(nextLvl);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-black bg-[#ec4899] text-white hover:bg-pink-600 transition-all flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(236,72,153,0.3)] cursor-pointer"
                  >
                    <span>{isMn ? "Дараагийн үе ➡️" : "Next Stage ➡️"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setLevelIndex(0);
                      setActiveTab('lobby');
                    }}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(79,70,229,0.3)] cursor-pointer"
                  >
                    <span>{isMn ? "Лобби руу Буцах" : "Back to Lobby"}</span>
                  </button>
                )}
              </div>

              {levelIndex >= 3 && (
                <p className="text-[10px] text-yellow-400 font-extrabold animate-pulse uppercase tracking-wider">
                  👑 {isMn ? "ТА БҮХ ҮЕИЙГ ДАВЖ АВАРГА БОЛЛОО!" : "YOU HAVE CONQUERED ALL LEVELS! PLATFORMING LEGEND!"}
                </p>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* Modal footer credits */}
        <div className="bg-slate-950 px-5 py-3 text-center text-[9px] text-slate-500 border-t border-indigo-950/60 font-mono flex justify-between items-center">
          <span>{isMn ? "🎮 БОЛДЫН СЕЙФ ТОГЛООМЫН САН" : "🎮 BOLD'S VAULTSHIELD PLAYGROUND"}</span>
          <span className="text-indigo-400/80">{isMn ? "Бууж өгч болохгүй шүү!" : "Never give up!"}</span>
        </div>

      </div>
    </div>
  );
}

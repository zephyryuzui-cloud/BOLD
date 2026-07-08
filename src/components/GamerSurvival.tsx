import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, Shield, Heart, Trophy, RefreshCw, X, Play, Pause,
  Volume2, VolumeX, Sparkles, Flame, ShieldAlert, Star, Zap, Award, Skull, Eye
} from 'lucide-react';
import { LanguageType } from '../types';

interface GamerSurvivalProps {
  onClose: () => void;
  language: LanguageType;
}

// 2D Map Grid (1 is Wall, 0 is Empty Space)
const MAP_SIZE = 16;
const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,0,1,0,1,1,1,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1],
  [1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1],
  [1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,1],
  [1,1,1,0,1,0,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,1,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,0,0,0,0,1,1,1,0,1,0,1],
  [1,0,1,0,1,1,0,0,1,1,0,1,0,1,0,1],
  [1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Audio Sound Synthesis with 3D spatial surround sound panning
const playSound = (
  type: 'shoot' | 'reload' | 'zombie_hurt' | 'zombie_growl' | 'player_hurt' | 'heal' | 'upgrade' | 'gameover' | 'acid_spit',
  pan: number = 0,
  volumeScale: number = 1
) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Connect to a Stereo Panner Node if supported for immersive audio spatial panning
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
      osc.connect(panner);
      panner.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(ctx.destination);
    
    if (type === 'shoot') {
      // Explosive rifle blast with sweeping pitch
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3 * volumeScale, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'reload') {
      // Mechanical metallic reload sounds
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.setValueAtTime(350, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(200, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15 * volumeScale, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'zombie_hurt') {
      // Wet squishy groan sound
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2 * volumeScale, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'zombie_growl') {
      // Deep demonic throat growl
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(45, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.18 * volumeScale, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'player_hurt') {
      // Low organic impact grunt
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.4 * volumeScale, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.24);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    } else if (type === 'acid_spit') {
      // Hissing high-pitch spit sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12 * volumeScale, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'heal') {
      // High chime synthesizer
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.18 * volumeScale, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'upgrade') {
      // Sci-fi powerup arpeggio
      osc.type = 'sine';
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      });
      gain.gain.setValueAtTime(0.2 * volumeScale, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'gameover') {
      // Eerie slow pitch drop
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.35 * volumeScale, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
    }
  } catch (e) {
    // Web Audio blocked or not supported
  }
};

interface Sprite {
  id: string;
  x: number;
  y: number;
  type: 'walker' | 'runner' | 'spitter' | 'boss' | 'acid' | 'battery' | 'ammo' | 'heal';
  hp: number;
  maxHp: number;
  speed: number;
  angle: number;
  size: number;
  stateTimer: number;
  wobble: number;
  damageFlash: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface BloodSplatter {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export default function GamerSurvival({ onClose, language }: GamerSurvivalProps) {
  const isMn = language === 'mn';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpNeeded, setXpNeeded] = useState(100);
  const [hp, setHp] = useState(100);
  const [maxHp] = useState(100);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Weapon HUD States
  const [currentWeapon, setCurrentWeapon] = useState<'rifle' | 'shotgun' | 'plasma'>('shotgun');
  const [ammo, setAmmo] = useState(8);
  const [maxAmmo, setMaxAmmo] = useState(8);
  const [reserveAmmo, setReserveAmmo] = useState(120);
  const [isReloading, setIsReloading] = useState(false);
  const [flashlightBattery, setFlashlightBattery] = useState(100);
  const [isNightVision, setIsNightVision] = useState(false);

  // Upgrades Overlay
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<string[]>([]);
  const [laserSight, setLaserSight] = useState(false);
  const [kevlarLevel, setKevlarLevel] = useState(0);
  const [bootsLevel, setBootsLevel] = useState(0);

  // Damage Indicator Splash Overlay
  const [screenDamageFlash, setScreenDamageFlash] = useState(0);
  const [onScreenSplatters, setOnScreenSplatters] = useState<BloodSplatter[]>([]);

  // Combat Logs Feed for high-tech realistic visor feel
  const [combatLogs, setCombatLogs] = useState<string[]>([]);

  const addLogRef = useRef<(msg: string) => void>(() => {});
  addLogRef.current = (msg: string) => {
    setCombatLogs(prev => [msg, ...prev].slice(0, 5));
  };

  // Helper to spawn a new enemy at a random valid location
  const spawnEnemyAtRandomLocation = (state: any, forceFar = true) => {
    let sx = 0, sy = 0;
    let spawnedOk = false;
    const playerX = state.playerX ?? 1.5;
    const playerY = state.playerY ?? 1.5;

    for (let tries = 0; tries < 40; tries++) {
      sx = Math.random() * (MAP_SIZE - 2) + 1;
      sy = Math.random() * (MAP_SIZE - 2) + 1;
      if (MAP[Math.floor(sy)][Math.floor(sx)] === 0) {
        if (!forceFar || Math.hypot(sx - playerX, sy - playerY) > 3.5) {
          spawnedOk = true;
          break;
        }
      }
    }

    if (spawnedOk) {
      const r = Math.random();
      let sType: 'walker' | 'runner' | 'spitter' | 'boss' = 'walker';
      const currentLevel = state.level || 1;
      let sHp = 45 + currentLevel * 10;
      let sSpeed = 0.015 + Math.random() * 0.012;
      let sSize = 0.45;

      const secondsPlayed = state.secondsPlayed || 0;
      if (secondsPlayed > 50 && r < 0.12) {
        // GOLIATH BEAST BOSS
        sType = 'boss';
        sHp = 300 + currentLevel * 150;
        sSpeed = 0.013;
        sSize = 0.85; // huge
      } else if (r > 0.7) {
        // SPEED RUNNER INFECTED
        sType = 'runner';
        sHp = 25 + currentLevel * 6;
        sSpeed = 0.038;
        sSize = 0.38;
      } else if (r > 0.4) {
        // TOXIC ACID SPITTER
        sType = 'spitter';
        sHp = 35 + currentLevel * 8;
        sSpeed = 0.018;
        sSize = 0.42;
      }

      state.sprites.push({
        id: Math.random().toString(),
        x: sx,
        y: sy,
        type: sType,
        hp: sHp,
        maxHp: sHp,
        speed: sSpeed,
        angle: 0,
        size: sSize,
        stateTimer: 0,
        wobble: Math.random() * 100,
        damageFlash: 0
      });
    }
  };

  // Ref container for smooth high performance physics loop
  const gameRef = useRef({
    playerX: 1.5,
    playerY: 1.5,
    playerAngle: Math.PI / 4, // angle of rotation
    playerSpeed: 0.08,
    rotSpeed: 0.045,
    fov: Math.PI / 3, // 60 degrees field of view
    sprites: [] as Sprite[],
    particles: [] as Particle[],
    keysPressed: {} as Record<string, boolean>,
    lastShootTime: 0,
    recoilY: 0,
    muzzleFlash: 0,
    lastSpawnTime: 0,
    spawnCooldown: 3000, // ms
    secondsPlayed: 0,
    flashlightBattery: 100,
    zBuffer: [] as number[], // for proper sprite occlusion
    shakeAmount: 0
  });

  // Sound and high score local storage loading
  useEffect(() => {
    const saved = localStorage.getItem('zombie_3d_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Controls Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameRef.current.keysPressed[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'r') {
        triggerReload();
      }
      // Weapon swapping via number keys
      if (e.key === '1') swapWeapon('rifle');
      if (e.key === '2') swapWeapon('shotgun');
      if (e.key === '3') swapWeapon('plasma');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameRef.current.keysPressed[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [ammo, reserveAmmo, isReloading, currentWeapon]);

  // Elapsed Survival Timer Loop
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || showUpgrades) return;

    const timer = setInterval(() => {
      gameRef.current.secondsPlayed += 1;
      setElapsedTime(gameRef.current.secondsPlayed);

      // Deplete or recharge flashlight battery
      if (isNightVision) {
        setFlashlightBattery(b => {
          const next = Math.max(0, b - 1.5);
          gameRef.current.flashlightBattery = next;
          if (next <= 0) setIsNightVision(false);
          return next;
        });
      } else {
        setFlashlightBattery(b => {
          const next = Math.max(0, b - 0.4);
          gameRef.current.flashlightBattery = next;
          return next;
        });
      }

      // Random zombie background growl to increase realistic horror feel in 3D surround sound
      if (Math.random() < 0.2) {
        if (soundEnabled) {
          const aliveZombies = gameRef.current.sprites.filter(s => s.type === 'walker' || s.type === 'runner' || s.type === 'spitter' || s.type === 'boss');
          if (aliveZombies.length > 0) {
            const randZ = aliveZombies[Math.floor(Math.random() * aliveZombies.length)];
            const dx = randZ.x - gameRef.current.playerX;
            const dy = randZ.y - gameRef.current.playerY;
            const dist = Math.hypot(dx, dy);
            const zAngle = Math.atan2(dy, dx);
            let relAngle = zAngle - gameRef.current.playerAngle;
            relAngle = Math.atan2(Math.sin(relAngle), Math.cos(relAngle));
            const p = Math.sin(relAngle); // pan: -1 left, 1 right
            const vol = Math.max(0.08, 1.1 - dist / 7.0);
            playSound('zombie_growl', p, vol);
          } else {
            playSound('zombie_growl', Math.random() * 2 - 1, 0.4);
          }
        }
      }

      // Progressively reduce spawn cooldown down to 800ms for chaotic intense endgames
      gameRef.current.spawnCooldown = Math.max(800, 3000 - gameRef.current.secondsPlayed * 15);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isPaused, isGameOver, showUpgrades, isNightVision, soundEnabled]);

  const swapWeapon = (w: 'rifle' | 'shotgun' | 'plasma') => {
    if (isReloading) return;
    setCurrentWeapon(w);
    if (w === 'rifle') {
      setMaxAmmo(30);
      setAmmo(30);
    } else if (w === 'shotgun') {
      setMaxAmmo(8);
      setAmmo(8);
    } else {
      setMaxAmmo(50);
      setAmmo(50);
    }
    if (soundEnabled) playSound('reload');
    addLogRef.current(isMn ? `ЗЭВСЭГ СОЛЬСОН: ${w === 'rifle' ? 'AR-30 АВТОМАТ' : w === 'shotgun' ? 'SG-8 ШОТГАН' : 'PLASMA-50 ПЛАЗМА'}` : `WEAPON ENGAGED: ${w.toUpperCase()}`);
  };

  const triggerReload = () => {
    if (isReloading || ammo === maxAmmo || reserveAmmo <= 0) return;
    setIsReloading(true);
    addLogRef.current(isMn ? "ХОЛБОО СУМЛАЖ БАЙНА..." : "INITIATING SYSTEM RELOAD");
    if (soundEnabled) playSound('reload');
    setTimeout(() => {
      const needed = maxAmmo - ammo;
      const reloadAmount = Math.min(needed, reserveAmmo);
      setAmmo(ammo + reloadAmount);
      setReserveAmmo(reserveAmmo - reloadAmount);
      setIsReloading(false);
      addLogRef.current(isMn ? "ЗЭВСЭГ СУМЛАГДЛАА" : "TACTICAL MAGAZINE SECURED");
    }, 1200);
  };

  const handleShoot = () => {
    if (!isPlaying || isPaused || isGameOver || showUpgrades || isReloading) return;
    if (ammo <= 0) {
      triggerReload();
      return;
    }

    const state = gameRef.current;
    const now = Date.now();
    let fireInterval = 200; // ms
    if (currentWeapon === 'shotgun') fireInterval = 850;
    if (currentWeapon === 'plasma') fireInterval = 100;

    if (now - state.lastShootTime < fireInterval) return;
    state.lastShootTime = now;

    // Deduct ammo
    setAmmo(a => a - 1);

    // Physical muzzle flash & screen shake recoil
    state.muzzleFlash = 3;
    state.recoilY = currentWeapon === 'shotgun' ? 32 : currentWeapon === 'rifle' ? 12 : 6;
    state.shakeAmount = currentWeapon === 'shotgun' ? 14 : currentWeapon === 'rifle' ? 5 : 2;

    if (soundEnabled) playSound('shoot');

    // Create exhaust gun smoke particles in 3D direction
    const gunX = state.playerX + Math.cos(state.playerAngle) * 0.4;
    const gunY = state.playerY + Math.sin(state.playerAngle) * 0.4;
    for (let k = 0; k < 5; k++) {
      const pAngle = state.playerAngle + (Math.random() * 0.4 - 0.2);
      const speed = 0.05 + Math.random() * 0.08;
      state.particles.push({
        x: gunX,
        y: gunY,
        z: -0.1 + (Math.random() * 0.1),
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        vz: Math.random() * 0.01 - 0.005,
        color: 'rgba(255,255,255,0.4)',
        size: 3 + Math.random() * 4,
        alpha: 0.8,
        decay: 0.04
      });
    }

    // Configure Pellets (Multiple spreading pellets for Shotgun, single tracer for rifle/plasma)
    const pellets: { angle: number; maxDist: number; dmg: number }[] = [];

    if (currentWeapon === 'shotgun') {
      // 6 spreading pellets, extreme range increased up to 24 units! (Long-range shotgun)
      const numPellets = 6;
      for (let p = 0; p < numPellets; p++) {
        const spread = (p - (numPellets - 1) / 2) * 0.025 + (Math.random() * 0.016 - 0.008);
        pellets.push({
          angle: state.playerAngle + spread,
          maxDist: 24.0, // Long Range Shotgun
          dmg: 45 // High saturation damage per pellet
        });
      }
    } else if (currentWeapon === 'rifle') {
      // Single long range precision rifle shot
      pellets.push({
        angle: state.playerAngle + (Math.random() * 0.02 - 0.01),
        maxDist: 32.0, // Very long range
        dmg: 34
      });
    } else {
      // Plasma long-range bolt
      pellets.push({
        angle: state.playerAngle,
        maxDist: 26.0, // Long range
        dmg: 22
      });
    }

    // Trace each pellet individually
    pellets.forEach((pellet) => {
      let rx = state.playerX;
      let ry = state.playerY;
      const cosAngle = Math.cos(pellet.angle);
      const sinAngle = Math.sin(pellet.angle);

      let step = 0.05;
      let hitWall = false;
      let hitSprite: Sprite | null = null;
      let distToHit = pellet.maxDist;

      for (let d = 0; d < pellet.maxDist; d += step) {
        rx += cosAngle * step;
        ry += sinAngle * step;

        // Check map wall collision
        const mx = Math.floor(rx);
        const my = Math.floor(ry);
        if (mx >= 0 && mx < MAP_SIZE && my >= 0 && my < MAP_SIZE) {
          if (MAP[my][mx] > 0) {
            hitWall = true;
            distToHit = d;
            break;
          }
        }

        // Check zombie sprite collision
        const zombieHits = state.sprites.filter(s => 
          (s.type === 'walker' || s.type === 'runner' || s.type === 'spitter' || s.type === 'boss') &&
          Math.hypot(s.x - rx, s.y - ry) < s.size * 0.7 &&
          s.hp > 0
        );

        if (zombieHits.length > 0) {
          hitSprite = zombieHits[0];
          distToHit = d;
          break;
        }
      }

      // Apply Damage
      if (hitSprite) {
        hitSprite.hp -= pellet.dmg;
        hitSprite.damageFlash = 4; // visual white flashing

        // Blood mist particles at hit point
        const bloodColor = hitSprite.type === 'spitter' ? '#84CC16' : '#DC2626';
        const particleCount = currentWeapon === 'shotgun' ? 4 : 12;
        for (let p = 0; p < particleCount; p++) {
          const bloodAngle = Math.random() * Math.PI * 2;
          const bSpeed = 0.02 + Math.random() * 0.06;
          state.particles.push({
            x: hitSprite.x,
            y: hitSprite.y,
            z: (Math.random() * 0.3 - 0.15),
            vx: Math.cos(bloodAngle) * bSpeed,
            vy: Math.sin(bloodAngle) * bSpeed,
            vz: Math.random() * 0.02 - 0.01,
            color: bloodColor,
            size: 2 + Math.random() * 3,
            alpha: 1,
            decay: 0.03
          });
        }

        // Spatial 3D Audio panning
        const dx = hitSprite.x - state.playerX;
        const dy = hitSprite.y - state.playerY;
        const dist = Math.hypot(dx, dy);
        const zAngle = Math.atan2(dy, dx);
        let relAngle = zAngle - state.playerAngle;
        relAngle = Math.atan2(Math.sin(relAngle), Math.cos(relAngle));
        const p = Math.sin(relAngle);
        const vol = Math.max(0.15, 1 - (dist / 8.0));

        if (soundEnabled) {
          playSound('zombie_hurt', p, vol);
        }

        // Check if zombie died
        if (hitSprite.hp <= 0) {
          setScore(s => s + (hitSprite!.type === 'boss' ? 150 : 25));
          
          const mobNames: Record<string, string> = {
            walker: isMn ? 'ШАМБЛЕР (ЗОМБИ)' : 'SHAMBLER INFECTED',
            runner: isMn ? 'ГҮЙГҮҮР (ЗОМБИ)' : 'FAST RUNNER INFECTED',
            spitter: isMn ? 'ХОРТ СПИТТЕР' : 'TOXIC ACID SPITTER',
            boss: isMn ? 'АВУРГА ГОЛИАТ' : 'MUTANT GOLIATH BEAST'
          };
          const currentMobName = mobNames[hitSprite.type] || 'HOSTILE';
          addLogRef.current(isMn ? `УСТГАВ: ${currentMobName}` : `KILLED: ${currentMobName}`);
          
          // Spawn loot item drops (Ammo, Battery, Medpack)
          const roll = Math.random();
          if (roll < 0.2) {
            state.sprites.push({
              id: Math.random().toString(),
              x: hitSprite.x,
              y: hitSprite.y,
              type: 'ammo',
              hp: 1, maxHp: 1, speed: 0, angle: 0, size: 0.2, stateTimer: 0, wobble: 0, damageFlash: 0
            });
          } else if (roll < 0.35) {
            state.sprites.push({
              id: Math.random().toString(),
              x: hitSprite.x,
              y: hitSprite.y,
              type: 'battery',
              hp: 1, maxHp: 1, speed: 0, angle: 0, size: 0.2, stateTimer: 0, wobble: 0, damageFlash: 0
            });
          } else if (roll < 0.45) {
            state.sprites.push({
              id: Math.random().toString(),
              x: hitSprite.x,
              y: hitSprite.y,
              type: 'heal',
              hp: 1, maxHp: 1, speed: 0, angle: 0, size: 0.2, stateTimer: 0, wobble: 0, damageFlash: 0
            });
          }

          setXp(currentXp => {
            const gained = hitSprite!.type === 'boss' ? 80 : 18;
            const nextXp = currentXp + gained;
            if (nextXp >= xpNeeded) {
              triggerLevelUp(nextXp - xpNeeded);
            }
            return nextXp % xpNeeded;
          });

          // Kill sprite
          state.sprites = state.sprites.filter(s => s.id !== hitSprite!.id);

          // Spawn back immediately when killed!
          spawnEnemyAtRandomLocation(state, true);
        }
      } else if (hitWall) {
        // Sparks
        for (let p = 0; p < 2; p++) {
          const sparkAngle = Math.random() * Math.PI * 2;
          const sSpeed = 0.01 + Math.random() * 0.04;
          state.particles.push({
            x: rx,
            y: ry,
            z: (Math.random() * 0.4 - 0.2),
            vx: Math.cos(sparkAngle) * sSpeed,
            vy: Math.sin(sparkAngle) * sSpeed,
            vz: Math.random() * 0.01 - 0.005,
            color: '#FBBF24',
            size: 1.5 + Math.random() * 2,
            alpha: 0.9,
            decay: 0.05
          });
        }
      }
    });
  };

  const triggerLevelUp = (overflowXp: number) => {
    const state = gameRef.current;
    state.level += 1;
    setLevel(state.level);
    setXpNeeded(prev => Math.round(prev * 1.35));
    
    // Choose 3 tactical upgrades
    const upgrades = [
      isMn ? 'ХОЛООН ОНОВЧТОЙ ЛАЗЕР (LASER SIGHT)' : 'RED TACTICAL LASER SIGHT',
      isMn ? 'КЕВЛАР ХУЯГ (+ХАМГААЛАЛТ)' : 'KEVLAR TACTICAL VEST (+ARMOR)',
      isMn ? 'АРМИЙН ХУРДАН ГУТАЛ (SPEED BOOTS)' : 'ADRENALINE LEATHER BOOTS',
      isMn ? 'БЭЛТГЭЛ СУМ (MAX REFILL)' : 'RESERVE BATTERY & AMMO LOAD'
    ];
    const shuffled = [...upgrades].sort(() => 0.5 - Math.random());
    setUpgradeOptions(shuffled.slice(0, 3));
    setShowUpgrades(true);
    if (soundEnabled) playSound('upgrade');
  };

  const selectUpgrade = (opt: string) => {
    if (opt.includes('LASER') || opt.includes('ХОЛООН')) {
      setLaserSight(true);
    } else if (opt.includes('KEVLAR') || opt.includes('КЕВЛАР')) {
      setKevlarLevel(k => k + 1);
    } else if (opt.includes('BOOTS') || opt.includes('ГУТАЛ')) {
      setBootsLevel(b => b + 1);
      gameRef.current.playerSpeed = 0.08 + (bootsLevel + 1) * 0.012;
    } else if (opt.includes('REFILL') || opt.includes('СУМ')) {
      setReserveAmmo(prev => prev + 90);
      setFlashlightBattery(100);
      gameRef.current.flashlightBattery = 100;
    }
    setShowUpgrades(false);
  };

  // 3D Engine Physics and Rendering
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || showUpgrades) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Procedural generation of highly detailed, realistic night-time textures (64x64)
    // Reusable offscreen canvas for rendering highly detailed, realistic zombie and item sprites
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 128;
    spriteCanvas.height = 128;
    const sCtx = spriteCanvas.getContext('2d')!;

    // 1. Infected Bloody Stone Brick
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 64;
    textureCanvas.height = 64;
    const texCtx = textureCanvas.getContext('2d')!;
    texCtx.fillStyle = '#111827'; // very dark slate base
    texCtx.fillRect(0, 0, 64, 64);
    
    // Draw brick shadows and highlights
    for (let y = 0; y < 64; y += 16) {
      texCtx.fillStyle = '#1e293b'; // slightly lighter brick face
      texCtx.fillRect(1, y + 1, 62, 14);
      
      // Horizontal seam shadow
      texCtx.strokeStyle = '#030712';
      texCtx.lineWidth = 1;
      texCtx.beginPath();
      texCtx.moveTo(0, y);
      texCtx.lineTo(64, y);
      texCtx.stroke();
    }
    // Vertical seams with offsets
    for (let y = 0; y < 64; y += 16) {
      const offset = (y % 32 === 0) ? 16 : 0;
      for (let x = 0; x < 64; x += 32) {
        texCtx.strokeStyle = '#030712';
        texCtx.beginPath();
        texCtx.moveTo(x + offset, y);
        texCtx.lineTo(x + offset, y + 16);
        texCtx.stroke();
      }
    }
    // Grimy dirt and blood trickles
    texCtx.fillStyle = 'rgba(127, 29, 29, 0.75)'; // Crimson blood splats
    texCtx.beginPath();
    texCtx.arc(32, 28, 6, 0, Math.PI * 2);
    texCtx.arc(30, 36, 3, 0, Math.PI * 2);
    texCtx.arc(33, 44, 2, 0, Math.PI * 2);
    texCtx.fill();
    // Running drip
    texCtx.fillRect(31, 28, 2, 18);

    // 2. Toxic Spore Bio-Infected Wall (Mossy)
    const mossCanvas = document.createElement('canvas');
    mossCanvas.width = 64;
    mossCanvas.height = 64;
    const mossCtx = mossCanvas.getContext('2d')!;
    mossCtx.fillStyle = '#0a0f1d';
    mossCtx.fillRect(0, 0, 64, 64);
    // Draw brick layout
    mossCtx.strokeStyle = '#020617';
    for (let y = 0; y < 64; y += 16) {
      mossCtx.beginPath();
      mossCtx.moveTo(0, y);
      mossCtx.lineTo(64, y);
      mossCtx.stroke();
      const offset = (y % 32 === 0) ? 16 : 0;
      for (let x = 0; x < 64; x += 32) {
        mossCtx.beginPath();
        mossCtx.moveTo(x + offset, y);
        mossCtx.lineTo(x + offset, y + 16);
        mossCtx.stroke();
      }
    }
    // Organic rotting green lichen & moss stains
    mossCtx.fillStyle = '#14532d';
    mossCtx.beginPath();
    mossCtx.arc(12, 18, 12, 0, Math.PI * 2);
    mossCtx.arc(48, 42, 10, 0, Math.PI * 2);
    mossCtx.fill();
    
    // Radioactive toxic slime veins
    mossCtx.strokeStyle = '#84cc16';
    mossCtx.lineWidth = 1;
    mossCtx.beginPath();
    mossCtx.moveTo(10, 0);
    mossCtx.quadraticCurveTo(15, 20, 8, 35);
    mossCtx.quadraticCurveTo(12, 50, 48, 64);
    mossCtx.stroke();
    // Spore lights
    mossCtx.fillStyle = '#a3e635';
    mossCtx.fillRect(14, 20, 2, 2);
    mossCtx.fillRect(45, 38, 2, 2);

    // 3. Heavy Rusty Industrial Steel Plating with Rivets & Hazard stripes
    const metalCanvas = document.createElement('canvas');
    metalCanvas.width = 64;
    metalCanvas.height = 64;
    const metalCtx = metalCanvas.getContext('2d')!;
    metalCtx.fillStyle = '#334155'; // Dark industrial slate steel
    metalCtx.fillRect(0, 0, 64, 64);
    
    // Plate border outlines
    metalCtx.strokeStyle = '#1e293b';
    metalCtx.lineWidth = 2;
    metalCtx.strokeRect(1, 1, 62, 62);
    metalCtx.strokeRect(1, 1, 62, 30); // split into dual plates
    
    // Yellow & Black caution stripes running across panel 2
    metalCtx.fillStyle = '#eab308'; // hazard amber
    metalCtx.beginPath();
    for (let offset = -20; offset < 80; offset += 16) {
      metalCtx.moveTo(offset, 32);
      metalCtx.lineTo(offset + 10, 32);
      metalCtx.lineTo(offset - 2, 64);
      metalCtx.lineTo(offset - 12, 64);
      metalCtx.closePath();
      metalCtx.fill();
    }
    // Dark stripe paint
    metalCtx.fillStyle = '#1e293b';
    for (let offset = -12; offset < 80; offset += 16) {
      metalCtx.beginPath();
      metalCtx.moveTo(offset, 32);
      metalCtx.lineTo(offset + 6, 32);
      metalCtx.lineTo(offset - 6, 64);
      metalCtx.lineTo(offset - 12, 64);
      metalCtx.closePath();
      metalCtx.fill();
    }
    
    // Little metallic rivet studs at the corners of both panels
    const rivets = [
      [4, 4], [60, 4], [4, 28], [60, 28],
      [4, 36], [60, 36], [4, 60], [60, 60]
    ];
    rivets.forEach(([rx, ry]) => {
      // 3D rivet illusion: white specular highlight and dark drop-shadow
      metalCtx.fillStyle = '#0f172a';
      metalCtx.fillRect(rx, ry + 1, 2, 2);
      metalCtx.fillStyle = '#94a3b8';
      metalCtx.fillRect(rx, ry, 2, 2);
    });

    // Grimy orange-brown rust rot spots
    metalCtx.fillStyle = 'rgba(154, 52, 18, 0.65)';
    metalCtx.beginPath();
    metalCtx.arc(52, 12, 4, 0, Math.PI * 2);
    metalCtx.arc(10, 45, 6, 0, Math.PI * 2);
    metalCtx.fill();

    // 4. Server Rack Mainframe Terminal Wall
    const terminalCanvas = document.createElement('canvas');
    terminalCanvas.width = 64;
    terminalCanvas.height = 64;
    const termCtx = terminalCanvas.getContext('2d')!;
    termCtx.fillStyle = '#090d16'; // deep mainframe body
    termCtx.fillRect(0, 0, 64, 64);
    
    // Draw horizontal rack partitions
    termCtx.fillStyle = '#1e293b';
    for (let r = 4; r < 64; r += 20) {
      termCtx.fillRect(2, r, 60, 14);
      
      // Cyber wiring circuitry details
      termCtx.strokeStyle = '#1e293b';
      termCtx.lineWidth = 1;
      termCtx.beginPath();
      termCtx.moveTo(8, r + 7);
      termCtx.lineTo(56, r + 7);
      termCtx.stroke();
    }

    const loop = () => {
      const state = gameRef.current;

      // Deduct recoil animation back down smoothly
      if (state.recoilY > 0) state.recoilY -= 1.8;
      if (state.muzzleFlash > 0) state.muzzleFlash -= 1;
      if (state.shakeAmount > 0) state.shakeAmount *= 0.85;

      // 1. INPUT MOVEMENT PHYSICS
      const keys = state.keysPressed;
      let moveStepX = 0;
      let moveStepY = 0;

      const cosP = Math.cos(state.playerAngle);
      const sinP = Math.sin(state.playerAngle);

      // WS / UP DOWN: Forward backward
      if (keys['w'] || keys['arrowup']) {
        moveStepX += cosP * state.playerSpeed;
        moveStepY += sinP * state.playerSpeed;
      }
      if (keys['s'] || keys['arrowdown']) {
        moveStepX -= cosP * state.playerSpeed;
        moveStepY -= sinP * state.playerSpeed;
      }
      // AD: Strafe sideward
      if (keys['a']) {
        moveStepX += sinP * (state.playerSpeed * 0.7);
        moveStepY -= cosP * (state.playerSpeed * 0.7);
      }
      if (keys['d']) {
        moveStepX -= sinP * (state.playerSpeed * 0.7);
        moveStepY += cosP * (state.playerSpeed * 0.7);
      }
      // Q / Left Arrow: Turn Left
      if (keys['q'] || keys['arrowleft']) {
        state.playerAngle -= state.rotSpeed;
      }
      // E / Right Arrow: Turn Right
      if (keys['e'] || keys['arrowright']) {
        state.playerAngle += state.rotSpeed;
      }

      // Wall collision checking (Sliding along walls)
      const nextX = state.playerX + moveStepX;
      const nextY = state.playerY + moveStepY;

      if (nextX >= 0 && nextX < MAP_SIZE && nextY >= 0 && nextY < MAP_SIZE) {
        // X-Axis collision
        if (MAP[Math.floor(state.playerY)][Math.floor(nextX + (moveStepX > 0 ? 0.2 : -0.2))] === 0) {
          state.playerX = nextX;
        }
        // Y-Axis collision
        if (MAP[Math.floor(nextY + (moveStepY > 0 ? 0.2 : -0.2))][Math.floor(state.playerX)] === 0) {
          state.playerY = nextY;
        }
      }

      // Wrap angle in 2PI bounds
      state.playerAngle = (state.playerAngle + Math.PI * 2) % (Math.PI * 2);

      // 2. ENEMY / ITEM SPRITE UPDATES
      // Choose a direction to approach the player
      state.sprites.forEach(s => {
        if (s.type === 'walker' || s.type === 'runner' || s.type === 'spitter' || s.type === 'boss') {
          s.wobble += 0.08;
          const sAngle = Math.atan2(state.playerY - s.y, state.playerX - s.x);
          s.angle = sAngle;

          // Simple pathfinding: step toward player if unobstructed
          const stepX = Math.cos(sAngle) * s.speed;
          const stepY = Math.sin(sAngle) * s.speed;

          if (MAP[Math.floor(s.y)][Math.floor(s.x + stepX)] === 0) s.x += stepX;
          if (MAP[Math.floor(s.y + stepY)][Math.floor(s.x)] === 0) s.y += stepY;

          // Hurt the player if too close
          const distToPlayer = Math.hypot(state.playerX - s.x, state.playerY - s.y);
          if (distToPlayer < 0.35) {
            let baseDmg = s.type === 'boss' ? 35 : s.type === 'runner' ? 12 : 16;
            // Armor damage reduction factor
            const actualDmg = Math.max(2, baseDmg - kevlarLevel * 3);
            
            setHp(prev => {
              const next = Math.max(0, prev - actualDmg);
              addLogRef.current(isMn ? `АНХААР: ХУЯГ ЦОХИГДЛОО • АМЬ: ${next}%` : `WARNING: SUIT INTEGRITY COMPROMISED • HEALTH: ${next}%`);
              if (next <= 0) {
                setIsGameOver(true);
                if (soundEnabled) playSound('gameover');
              }
              return next;
            });

            // Splatter screen with gore vignette
            setScreenDamageFlash(85);
            setOnScreenSplatters(current => {
              const list = [...current, {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 20 + Math.random() * 45,
                opacity: 0.95
              }];
              return list.slice(-8); // Max 8 blood stains on helmet screen
            });

            if (soundEnabled) playSound('player_hurt');

            // Bounce back the zombie slightly
            s.x -= Math.cos(sAngle) * 0.25;
            s.y -= Math.sin(sAngle) * 0.25;
          }

          // Toxic Spitter range shooting behavior
          if (s.type === 'spitter') {
            s.stateTimer += 1;
            if (distToPlayer < 4.5 && s.stateTimer > 90) {
              s.stateTimer = 0;
              // Spit radioactive acid glob at player
              state.sprites.push({
                id: Math.random().toString(),
                x: s.x,
                y: s.y,
                type: 'acid',
                hp: 1, maxHp: 1,
                speed: 0.09, // fly speed
                angle: sAngle,
                size: 0.12,
                stateTimer: 0,
                wobble: 0,
                damageFlash: 0
              });
              
              // Spatial audio panning for Spitter acid launch
              const dx = s.x - state.playerX;
              const dy = s.y - state.playerY;
              const dist = Math.hypot(dx, dy);
              const zAngle = Math.atan2(dy, dx);
              let relAngle = zAngle - state.playerAngle;
              relAngle = Math.atan2(Math.sin(relAngle), Math.cos(relAngle));
              const p = Math.sin(relAngle);
              const vol = Math.max(0.12, 1.1 - dist / 7.5);

              if (soundEnabled) {
                playSound('acid_spit', p, vol);
              }
            }
          }
        } 
        else if (s.type === 'acid') {
          // Acid flying in 3D straight vector
          s.x += Math.cos(s.angle) * s.speed;
          s.y += Math.sin(s.angle) * s.speed;

          // Check acid splash collision with player
          const dist = Math.hypot(state.playerX - s.x, state.playerY - s.y);
          if (dist < 0.28) {
            const actualDmg = Math.max(1, 14 - kevlarLevel * 2);
            setHp(prev => {
              const next = Math.max(0, prev - actualDmg);
              addLogRef.current(isMn ? `АНХААР: ХУЯГ ХОРДОЛД ОРЛОО • АМЬ: ${next}%` : `WARNING: ACID BURN SPATTER • HEALTH: ${next}%`);
              if (next <= 0) {
                setIsGameOver(true);
                if (soundEnabled) playSound('gameover');
              }
              return next;
            });
            setScreenDamageFlash(60);
            if (soundEnabled) playSound('player_hurt');
            s.hp = 0; // self-destruct acid
          }

          // Self destruct on wall hit
          if (MAP[Math.floor(s.y)][Math.floor(s.x)] > 0) {
            s.hp = 0;
          }
        } 
        else if (s.type === 'ammo' || s.type === 'battery' || s.type === 'heal') {
          // Loot item magnet collecting trigger
          const dist = Math.hypot(state.playerX - s.x, state.playerY - s.y);
          if (dist < 0.4) {
            if (s.type === 'ammo') {
              setReserveAmmo(r => r + 45);
              addLogRef.current(isMn ? "+45 СУМНЫ НӨӨЦ ШИНЭЭР АВЛАА" : "AMMO RESTORED: +45 ROUNDS");
            } else if (s.type === 'battery') {
              setFlashlightBattery(b => {
                const next = Math.min(100, b + 40);
                state.flashlightBattery = next;
                return next;
              });
              addLogRef.current(isMn ? "ТАКТИКИЙН ЦЭНЭГ: +40% ЦЭНЭГЛЭГДЭВ" : "ENERGY CONDUIT RECHARGED: +40% CELL");
            } else if (s.type === 'heal') {
              setHp(h => {
                const next = Math.min(100, h + 35);
                return next;
              });
              addLogRef.current(isMn ? "ЭРҮҮЛ МЭНД: +35% НӨХӨГДӨВ" : "BIOMED INJECTED: BIOMASS INTEGRITY RECOVERED");
            }
            if (soundEnabled) playSound('heal');
            s.hp = 0; // consume loot
          }
        }
      });

      // Filter out dead sprites
      state.sprites = state.sprites.filter(s => s.hp > 0);

      // 3. SPAWN EXTRA IN-GAME THREATS OVER TIME
      const now = Date.now();
      if (now - state.lastSpawnTime > state.spawnCooldown) {
        state.lastSpawnTime = now;

        // Spawn multiple enemies at once for more continuous challenge and density!
        spawnEnemyAtRandomLocation(state, true);
        spawnEnemyAtRandomLocation(state, true);
      }

      // 4. RENDERING PHASE: 3D RAYCASTING ALGORITHM
      const fov = state.fov;
      const numRays = canvas.width;
      const halfFov = fov / 2;
      const dWidth = canvas.width;
      const dHeight = canvas.height;

      // Fill ceiling (Spooky night-time dark sky with faint stars)
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, dWidth, dHeight / 2);

      // Draw faint procedurally projected starry night sky
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let s = 0; s < 12; s++) {
        const starX = (s * 45 - (state.playerAngle * 120)) % dWidth;
        const finalStarX = starX < 0 ? starX + dWidth : starX;
        ctx.fillRect(finalStarX, 10 + (s % 4) * 15, 1.5, 1.5);
      }

      // Fill Floor (Dark dirty basement/road)
      ctx.fillStyle = '#090e15';
      ctx.fillRect(0, dHeight / 2, dWidth, dHeight / 2);

      // Clear the z-buffer depth array for proper sprites clipping
      state.zBuffer = new Array(numRays).fill(99999);

      // Raycast loop across the screen width columns
      for (let i = 0; i < numRays; i++) {
        // Angle of this specific column ray
        const rayAngle = state.playerAngle - halfFov + (i / numRays) * fov;
        const cosR = Math.cos(rayAngle);
        const sinR = Math.sin(rayAngle);

        // Digital Differential Analysis (DDA) algorithm for lightning speed walls intersections
        let mapX = Math.floor(state.playerX);
        let mapY = Math.floor(state.playerY);

        const deltaDistX = Math.abs(1 / cosR);
        const deltaDistY = Math.abs(1 / sinR);

        let stepX = 0;
        let stepY = 0;
        let sideDistX = 0;
        let sideDistY = 0;

        if (cosR < 0) {
          stepX = -1;
          sideDistX = (state.playerX - mapX) * deltaDistX;
        } else {
          stepX = 1;
          sideDistX = (mapX + 1.0 - state.playerX) * deltaDistX;
        }

        if (sinR < 0) {
          stepY = -1;
          sideDistY = (state.playerY - mapY) * deltaDistY;
        } else {
          stepY = 1;
          sideDistY = (mapY + 1.0 - state.playerY) * deltaDistY;
        }

        let hit = 0;
        let side = 0; // 0 = NS, 1 = EW wall hit

        // Perform DDA trace step
        while (hit === 0) {
          if (sideDistX < sideDistY) {
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
          } else {
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
          }

          // Out of bounds check
          if (mapX < 0 || mapX >= MAP_SIZE || mapY < 0 || mapY >= MAP_SIZE) {
            break;
          }

          if (MAP[mapY][mapX] > 0) {
            hit = MAP[mapY][mapX];
          }
        }

        // Calculate final perpendicular distance to prevent fisheye effect lens distortion
        let perpWallDist = 0;
        if (side === 0) {
          perpWallDist = (mapX - state.playerX + (1 - stepX) / 2) / cosR;
        } else {
          perpWallDist = (mapY - state.playerY + (1 - stepY) / 2) / sinR;
        }

        // Store in Z-Buffer depth array
        state.zBuffer[i] = perpWallDist;

        // Calculate vertical wall projection height on screen
        const wallHeight = Math.round(dHeight / (perpWallDist || 0.01));

        // Start and end pixels for the wall column strip
        let drawStart = -wallHeight / 2 + dHeight / 2;
        let drawEnd = wallHeight / 2 + dHeight / 2;

        // Real textured vertical line slices
        // Find exact fraction of wall that was hit to map texture coords
        let wallX = 0;
        if (side === 0) {
          wallX = state.playerY + perpWallDist * sinR;
        } else {
          wallX = state.playerX + perpWallDist * cosR;
        }
        wallX -= Math.floor(wallX);

        // Texture X coordinate
        const texX = Math.floor(wallX * 64);

        // Draw textured wall column from the generated HTML5 procedurals
        let activeTexture = textureCanvas;
        const gridHash = (mapX + mapY) % 4;
        if (gridHash === 0) {
          activeTexture = mossCanvas;
        } else if (gridHash === 1) {
          activeTexture = metalCanvas;
        } else if (gridHash === 2) {
          activeTexture = terminalCanvas;
        }
        
        ctx.drawImage(
          activeTexture,
          texX, 0, 1, 64, // src
          i, drawStart, 1, (drawEnd - drawStart) // dest
        );

        // --- REALISTIC CORNER AMBIENT OCCLUSION (AO) ---
        // Darken slices close to vertical grid joints to simulate corner shadows
        let edgeAO = 0;
        if (wallX < 0.08) {
          edgeAO = (1.0 - (wallX / 0.08)) * 0.45;
        } else if (wallX > 0.92) {
          edgeAO = ((wallX - 0.92) / 0.08) * 0.45;
        }
        if (edgeAO > 0) {
          ctx.fillStyle = `rgba(2, 3, 6, ${edgeAO})`;
          ctx.fillRect(i, drawStart, 1, (drawEnd - drawStart));
        }

        // --- DYNAMIC FLASHLIGHT / ATMOSPHERIC NIGHT LIGHTING SHADING ---
        // Shading intensity declines with distance (Fog)
        let ambientDarkness = Math.min(1.0, perpWallDist / 7.2); // Fades completely to black at 7.2 units

        // Calculate flashlight brightness: depends on player's view direction center
        const angleDiff = Math.abs(rayAngle - state.playerAngle);
        let flashlightBright = 0;

        // Implement realistic low battery flickering
        let flick = 1.0;
        if (flashlightBattery < 25 && flashlightBattery > 0) {
          flick = Math.random() < 0.18 ? 0.15 : (Math.sin(Date.now() * 0.09) > -0.3 ? 1.0 : 0.35);
        }

        if (flashlightBattery > 0) {
          // Strong center cone of light
          if (angleDiff < 0.16) {
            flashlightBright = 0.95 * (1 - angleDiff / 0.16) * (1 - Math.min(1.0, perpWallDist / 5.5)) * flick;
          } else if (angleDiff < 0.28) {
            // Dimmer outer halo cone of light
            flashlightBright = 0.4 * (1 - angleDiff / 0.28) * (1 - Math.min(1.0, perpWallDist / 3.8)) * flick;
          }
        }

        // Night vision neon green highlight boost
        if (isNightVision) {
          ctx.fillStyle = 'rgba(34,197,94,0.25)'; // bright toxic night-vision green overlay
          ctx.fillRect(i, drawStart, 1, (drawEnd - drawStart));
          ambientDarkness *= 0.15; // see through darkness
        }

        // Muzzle flash amber light burst
        const shootFlash = state.muzzleFlash * 0.25 * (1 - Math.min(1.0, perpWallDist / 2.8));

        // Combine lighting multipliers together
        const shadowOpacity = Math.max(0, ambientDarkness - flashlightBright - shootFlash);

        if (shadowOpacity > 0) {
          ctx.fillStyle = `rgba(3, 5, 10, ${shadowOpacity})`;
          ctx.fillRect(i, drawStart, 1, (drawEnd - drawStart));
        }
      }

      // 5. RENDERING 3D SPRITES (Zombies, Spitters, Flying Acid, Ammo loot)
      // Sort sprites by distance from player (far first) for correct painters algorithm rendering
      const sortedSprites = state.sprites
        .map(s => {
          const dist = Math.hypot(s.x - state.playerX, s.y - state.playerY);
          return { sprite: s, distance: dist };
        })
        .sort((a, b) => b.distance - a.distance);

      sortedSprites.forEach(({ sprite: s, distance: dist }) => {
        if (dist < 0.18) return; // behind camera clip

        // Translate sprite relative to player position
        const spriteX = s.x - state.playerX;
        const spriteY = s.y - state.playerY;

        // Rotate sprite around player's view vector
        const invDet = 1.0 / (cosP * cosP + sinP * sinP); // 1.0
        const transformX = invDet * (cosP * spriteY - sinP * spriteX);
        const transformY = invDet * (cosP * spriteX + sinP * spriteY); // depth distance in 3D

        if (transformY <= 0) return; // behind camera

        // Screen center position projected
        const spriteScreenX = Math.floor((dWidth / 2) * (1 + transformX / transformY));

        // Projected height and width of sprite in pixels
        const spriteSize = Math.abs(Math.floor(dHeight / transformY)) * s.size;
        const drawStartY = -spriteSize / 2 + dHeight / 2;
        const drawEndY = spriteSize / 2 + dHeight / 2;

        const drawStartX = -spriteSize / 2 + spriteScreenX;
        const drawEndX = spriteSize / 2 + spriteScreenX;

        // --- RENDER DETAILED SPRITE TO OFFSCREEN CANVAS ONCE PER FRAME ---
        sCtx.clearRect(0, 0, 128, 128);

        if (s.type === 'walker') {
          const wobbleX = Math.sin(s.wobble) * 4;
          const bobY = Math.cos(s.wobble * 2) * 3;

          // Legs (Pants)
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#1e293b'; // dirty slate pants
          sCtx.fillRect(44, 96 + bobY, 12, 20); // Left leg
          sCtx.fillRect(72, 96 + bobY, 12, 20); // Right leg
          
          // Rotting green/grey feet
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#2d3748';
          sCtx.fillRect(38, 116 + bobY, 18, 5);
          sCtx.fillRect(72, 116 + bobY, 18, 5);

          // Torso / Suit (Amber-orange tattered hazard suit)
          const torsoGrad = sCtx.createLinearGradient(40, 35, 88, 35);
          torsoGrad.addColorStop(0, '#7c2d12');
          torsoGrad.addColorStop(0.5, '#9a3412');
          torsoGrad.addColorStop(1, '#431407');
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : torsoGrad;
          sCtx.fillRect(40, 35 + bobY, 48, 61);

          // Gory chest wound (Exposed ribs)
          sCtx.fillStyle = '#450a0a'; // dark blood cavity
          sCtx.fillRect(52, 45 + bobY, 24, 35);
          sCtx.fillStyle = '#f1f5f9'; // white bones
          sCtx.fillRect(54, 52 + bobY, 20, 2);
          sCtx.fillRect(54, 60 + bobY, 20, 2);
          sCtx.fillRect(54, 68 + bobY, 20, 2);
          sCtx.fillStyle = '#dc2626'; // wet blood splash
          sCtx.fillRect(58, 48 + bobY, 4, 30);

          // Arms
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#14532d'; // rotting green arms
          sCtx.fillRect(15 + wobbleX, 42 + bobY, 26, 12);
          sCtx.fillStyle = '#e2e8f0';
          sCtx.fillRect(10 + wobbleX, 42 + bobY + 2, 6, 6);

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#14532d';
          sCtx.fillRect(87, 45 + bobY, 15, 30);
          sCtx.fillStyle = '#e2e8f0';
          sCtx.fillRect(89, 75 + bobY, 4, 6);

          // Head (Rotting green, partially skull exposed)
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#14532d';
          sCtx.beginPath();
          sCtx.arc(64 + wobbleX * 0.5, 20 + bobY, 16, 0, Math.PI * 2);
          sCtx.fill();

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#e2e8f0';
          sCtx.beginPath();
          sCtx.arc(55 + wobbleX * 0.5, 16 + bobY, 7, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.fillStyle = '#7f1d1d';
          sCtx.fillRect(58 + wobbleX * 0.5, 12 + bobY, 4, 10);

          // Hair
          sCtx.strokeStyle = '#64748b';
          sCtx.lineWidth = 1.5;
          sCtx.beginPath();
          sCtx.moveTo(56 + wobbleX * 0.5, 6 + bobY);
          sCtx.quadraticCurveTo(64 + wobbleX * 0.5, 2 + bobY, 72 + wobbleX * 0.5, 6 + bobY);
          sCtx.stroke();

          // Mouth
          sCtx.fillStyle = '#020617';
          sCtx.fillRect(58 + wobbleX * 0.5, 24 + bobY, 12, 6);
          sCtx.fillStyle = '#fef08a';
          sCtx.fillRect(60 + wobbleX * 0.5, 24 + bobY, 2, 2);
          sCtx.fillRect(66 + wobbleX * 0.5, 24 + bobY, 2, 2);
          sCtx.fillRect(63 + wobbleX * 0.5, 28 + bobY, 2, 2);

          // Eye
          sCtx.fillStyle = '#ef4444';
          sCtx.shadowBlur = 6;
          sCtx.shadowColor = '#ef4444';
          sCtx.fillRect(67 + wobbleX * 0.5, 15 + bobY, 3, 3);
          sCtx.shadowBlur = 0;
        } else if (s.type === 'runner') {
          const runWobble = Math.sin(s.wobble * 2) * 6;
          const runBob = Math.abs(Math.sin(s.wobble * 2)) * 5;

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#7f1d1d';
          sCtx.fillRect(36 + runWobble * 0.5, 96 - runBob, 12, 18);
          sCtx.fillRect(76 - runWobble * 0.5, 96 - runBob, 12, 18);
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#450a0a';
          sCtx.fillRect(32 + runWobble * 0.5, 114 - runBob, 16, 5);
          sCtx.fillRect(76 - runWobble * 0.5, 114 - runBob, 16, 5);

          const muscleGrad = sCtx.createLinearGradient(40, 35, 88, 35);
          muscleGrad.addColorStop(0, '#5c0d0d');
          muscleGrad.addColorStop(0.5, '#991b1b');
          muscleGrad.addColorStop(1, '#3b0707');
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : muscleGrad;
          sCtx.fillRect(40, 35 - runBob, 48, 61);

          const hPulse = Math.sin(Date.now() * 0.02) > 0;
          sCtx.fillStyle = hPulse ? '#f43f5e' : '#9f1239';
          sCtx.shadowBlur = hPulse ? 10 : 2;
          sCtx.shadowColor = '#f43f5e';
          sCtx.beginPath();
          sCtx.arc(64, 55 - runBob, 8, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.shadowBlur = 0;

          sCtx.fillStyle = '#f1f5f9';
          sCtx.fillRect(63, 40 - runBob, 2, 30);

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#991b1b';
          sCtx.fillRect(10, 40 - runBob + runWobble, 30, 10);
          sCtx.fillStyle = '#e2e8f0';
          sCtx.fillRect(4, 38 - runBob + runWobble, 7, 14);

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#991b1b';
          sCtx.fillRect(88, 40 - runBob - runWobble, 30, 10);
          sCtx.fillStyle = '#e2e8f0';
          sCtx.fillRect(117, 38 - runBob - runWobble, 7, 14);

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#991b1b';
          sCtx.beginPath();
          sCtx.arc(64, 20 - runBob, 14, 0, Math.PI * 2);
          sCtx.fill();

          sCtx.fillStyle = '#020617';
          sCtx.fillRect(58, 22 - runBob, 12, 10);
          sCtx.fillStyle = '#ffffff';
          sCtx.fillRect(59, 22 - runBob, 1.5, 3);
          sCtx.fillRect(62, 22 - runBob, 1.5, 3);
          sCtx.fillRect(65, 22 - runBob, 1.5, 3);
          sCtx.fillRect(68, 22 - runBob, 1.5, 3);
          sCtx.fillRect(60, 29 - runBob, 1.5, 3);
          sCtx.fillRect(66, 29 - runBob, 1.5, 3);

          sCtx.fillStyle = '#f59e0b';
          sCtx.shadowBlur = 12;
          sCtx.shadowColor = '#f59e0b';
          sCtx.fillRect(57, 14 - runBob, 3, 3);
          sCtx.fillRect(68, 14 - runBob, 3, 3);
          sCtx.shadowBlur = 0;
        } else if (s.type === 'spitter') {
          const spitWobble = Math.sin(s.wobble) * 3;
          const spitBob = Math.cos(s.wobble * 1.5) * 4;

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#2e1065';
          sCtx.fillRect(46, 96 + spitBob, 12, 20);
          sCtx.fillRect(70, 96 + spitBob, 12, 20);
          sCtx.fillStyle = '#14532d';
          sCtx.fillRect(42, 116 + spitBob, 16, 5);
          sCtx.fillRect(70, 116 + spitBob, 16, 5);

          const bloatGrad = sCtx.createRadialGradient(64, 65 + spitBob, 10, 64, 65 + spitBob, 30);
          bloatGrad.addColorStop(0, '#581c87');
          bloatGrad.addColorStop(0.7, '#3b0764');
          bloatGrad.addColorStop(1, '#0f052d');
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : bloatGrad;
          sCtx.beginPath();
          sCtx.arc(64, 65 + spitBob, 26, 0, Math.PI * 2);
          sCtx.fill();

          sCtx.fillStyle = '#84cc16';
          sCtx.shadowBlur = 8;
          sCtx.shadowColor = '#84cc16';
          sCtx.beginPath();
          sCtx.arc(52, 55 + spitBob, 5, 0, Math.PI * 2);
          sCtx.arc(76, 70 + spitBob, 6, 0, Math.PI * 2);
          sCtx.arc(60, 75 + spitBob, 4, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.shadowBlur = 0;

          sCtx.strokeStyle = '#4c1d95';
          sCtx.lineWidth = 4;
          sCtx.beginPath();
          sCtx.moveTo(40, 55 + spitBob);
          sCtx.lineTo(24 + spitWobble, 65 + spitBob);
          sCtx.lineTo(16 + spitWobble, 80 + spitBob);
          sCtx.moveTo(88, 55 + spitBob);
          sCtx.lineTo(104 - spitWobble, 65 + spitBob);
          sCtx.lineTo(112 - spitWobble, 80 + spitBob);
          sCtx.stroke();

          const pulse = Math.abs(Math.sin(Date.now() * 0.012)) * 6;
          const sacGrad = sCtx.createRadialGradient(64, 38 + spitBob, 4, 64, 38 + spitBob, 12 + pulse);
          sacGrad.addColorStop(0, '#a3e635');
          sacGrad.addColorStop(0.6, '#65a30d');
          sacGrad.addColorStop(1, '#224d08');
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : sacGrad;
          sCtx.shadowBlur = 14;
          sCtx.shadowColor = '#a3e635';
          sCtx.beginPath();
          sCtx.arc(64, 38 + spitBob, 12 + pulse, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.shadowBlur = 0;

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#be123c';
          sCtx.beginPath();
          sCtx.arc(64, 18 + spitBob, 11, 0, Math.PI * 2);
          sCtx.fill();

          sCtx.fillStyle = '#1e050d';
          sCtx.fillRect(60, 21 + spitBob, 8, 8);
          sCtx.fillStyle = '#84cc16';
          sCtx.fillRect(63, 27 + spitBob, 2, 5);

          sCtx.fillStyle = '#a3e635';
          sCtx.shadowBlur = 6;
          sCtx.shadowColor = '#a3e635';
          sCtx.fillRect(57, 14 + spitBob, 3, 2);
          sCtx.fillRect(64, 14 + spitBob, 3, 2);
          sCtx.shadowBlur = 0;
        } else if (s.type === 'boss') {
          const bossWobble = Math.sin(s.wobble * 1.5) * 5;
          const bossBob = Math.cos(s.wobble * 2) * 4;

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#1e1b4b';
          sCtx.fillRect(34 + bossWobble * 0.3, 90 + bossBob, 18, 28);
          sCtx.fillRect(76 - bossWobble * 0.3, 90 + bossBob, 18, 28);
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#0f172a';
          sCtx.fillRect(28 + bossWobble * 0.3, 118 + bossBob, 24, 8);
          sCtx.fillRect(76 - bossWobble * 0.3, 118 + bossBob, 24, 8);

          const bossGrad = sCtx.createLinearGradient(20, 30, 108, 30);
          bossGrad.addColorStop(0, '#312e81');
          bossGrad.addColorStop(0.5, '#4338ca');
          bossGrad.addColorStop(1, '#1e1b4b');
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : bossGrad;
          sCtx.fillRect(24, 30 + bossBob, 80, 62);

          sCtx.fillStyle = '#475569';
          sCtx.fillRect(36, 40 + bossBob, 56, 35);
          sCtx.fillStyle = '#94a3b8';
          sCtx.fillRect(38, 42 + bossBob, 2, 2);
          sCtx.fillRect(90, 42 + bossBob, 2, 2);
          sCtx.fillRect(38, 70 + bossBob, 2, 2);
          sCtx.fillRect(90, 70 + bossBob, 2, 2);

          sCtx.strokeStyle = '#9a3412';
          sCtx.lineWidth = 1.5;
          sCtx.beginPath();
          sCtx.moveTo(45, 45 + bossBob);
          sCtx.lineTo(52, 60 + bossBob);
          sCtx.stroke();

          const corePulse = 2 + Math.abs(Math.sin(Date.now() * 0.015)) * 5;
          const purpleCore = sCtx.createRadialGradient(64, 58 + bossBob, 2, 64, 58 + bossBob, 10 + corePulse);
          purpleCore.addColorStop(0, '#d946ef');
          purpleCore.addColorStop(0.6, '#a21caf');
          purpleCore.addColorStop(1, '#4c1d95');
          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : purpleCore;
          sCtx.shadowBlur = 12 + corePulse;
          sCtx.shadowColor = '#d946ef';
          sCtx.beginPath();
          sCtx.arc(64, 58 + bossBob, 10 + corePulse, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.shadowBlur = 0;

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#1e1b4b';
          sCtx.fillRect(4, 35 + bossBob, 22, 50);
          sCtx.fillStyle = '#c084fc';
          sCtx.beginPath();
          sCtx.moveTo(4, 45 + bossBob);
          sCtx.lineTo(-6, 48 + bossBob);
          sCtx.lineTo(4, 55 + bossBob);
          sCtx.moveTo(4, 65 + bossBob);
          sCtx.lineTo(-8, 68 + bossBob);
          sCtx.lineTo(4, 75 + bossBob);
          sCtx.fill();

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#1e1b4b';
          sCtx.fillRect(102, 35 + bossBob, 22, 45);
          sCtx.fillStyle = '#475569';
          sCtx.fillRect(100, 30 + bossBob, 26, 15);
          sCtx.fillStyle = '#94a3b8';
          sCtx.fillRect(102, 32 + bossBob, 2, 2);
          sCtx.fillRect(122, 32 + bossBob, 2, 2);

          sCtx.fillStyle = s.damageFlash > 0 ? '#FFFFFF' : '#1e1b4b';
          sCtx.beginPath();
          sCtx.arc(64, 15 + bossBob, 15, 0, Math.PI * 2);
          sCtx.fill();

          sCtx.fillStyle = '#0f172a';
          sCtx.beginPath();
          sCtx.moveTo(52, 10 + bossBob);
          sCtx.quadraticCurveTo(36, 0 + bossBob, 24, -12 + bossBob);
          sCtx.quadraticCurveTo(44, 4 + bossBob, 50, 15 + bossBob);
          sCtx.fill();
          sCtx.beginPath();
          sCtx.moveTo(76, 10 + bossBob);
          sCtx.quadraticCurveTo(92, 0 + bossBob, 104, -12 + bossBob);
          sCtx.quadraticCurveTo(84, 4 + bossBob, 78, 15 + bossBob);
          sCtx.fill();

          sCtx.fillStyle = '#ef4444';
          sCtx.shadowBlur = 10;
          sCtx.shadowColor = '#ef4444';
          sCtx.fillRect(55, 10 + bossBob, 4, 3);
          sCtx.fillRect(69, 10 + bossBob, 4, 3);
          sCtx.shadowBlur = 0;

          sCtx.fillStyle = '#334155';
          sCtx.fillRect(54, 2 + bossBob, 20, 6);

          sCtx.fillStyle = '#020617';
          sCtx.fillRect(52, 18 + bossBob, 24, 11);
          sCtx.fillStyle = '#94a3b8';
          sCtx.fillRect(54, 18 + bossBob, 2, 4);
          sCtx.fillRect(59, 18 + bossBob, 2, 4);
          sCtx.fillRect(64, 18 + bossBob, 2, 4);
          sCtx.fillRect(69, 18 + bossBob, 2, 4);
          sCtx.fillRect(74, 18 + bossBob, 2, 4);
          sCtx.fillRect(56, 25 + bossBob, 2, 4);
          sCtx.fillRect(62, 25 + bossBob, 2, 4);
          sCtx.fillRect(68, 25 + bossBob, 2, 4);
          sCtx.fillRect(72, 25 + bossBob, 2, 4);
        } else if (s.type === 'acid') {
          const acidGrad = sCtx.createRadialGradient(64, 64, 4, 64, 64, 32);
          acidGrad.addColorStop(0, '#ffffff');
          acidGrad.addColorStop(0.3, '#a3e635');
          acidGrad.addColorStop(0.7, '#4d7c0f');
          acidGrad.addColorStop(1, 'rgba(77, 124, 15, 0)');
          sCtx.fillStyle = acidGrad;
          sCtx.shadowBlur = 16;
          sCtx.shadowColor = '#a3e635';
          sCtx.beginPath();
          sCtx.arc(64, 64, 30, 0, Math.PI * 2);
          sCtx.fill();
          sCtx.shadowBlur = 0;

          sCtx.fillStyle = '#ffffff';
          sCtx.beginPath();
          sCtx.arc(58, 58, 4, 0, Math.PI * 2);
          sCtx.arc(70, 68, 3, 0, Math.PI * 2);
          sCtx.fill();
        } else if (s.type === 'ammo') {
          const boxGrad = sCtx.createLinearGradient(20, 40, 108, 88);
          boxGrad.addColorStop(0, '#ca8a04');
          boxGrad.addColorStop(0.5, '#a16207');
          boxGrad.addColorStop(1, '#713f12');
          sCtx.fillStyle = boxGrad;
          sCtx.beginPath();
          sCtx.roundRect(24, 44, 80, 48, 6);
          sCtx.fill();

          sCtx.fillStyle = '#475569';
          sCtx.fillRect(60, 44, 8, 12);
          sCtx.fillStyle = '#94a3b8';
          sCtx.fillRect(61, 44, 6, 2);

          sCtx.strokeStyle = '#3f2c06';
          sCtx.lineWidth = 2;
          sCtx.strokeRect(28, 48, 72, 40);

          sCtx.fillStyle = '#451a03';
          sCtx.font = 'bold 12px monospace';
          sCtx.textAlign = 'center';
          sCtx.fillText("AMMO", 64, 68);
          sCtx.font = 'bold 8px monospace';
          sCtx.fillText("CLASS V", 64, 80);
        } else if (s.type === 'battery') {
          sCtx.fillStyle = '#475569';
          sCtx.fillRect(44, 28, 40, 8);
          sCtx.fillRect(44, 92, 40, 8);
          
          const battGrad = sCtx.createLinearGradient(48, 36, 80, 36);
          battGrad.addColorStop(0, '#0284c7');
          battGrad.addColorStop(0.5, '#38bdf8');
          battGrad.addColorStop(1, '#0369a1');
          sCtx.fillStyle = battGrad;
          sCtx.shadowBlur = 14;
          sCtx.shadowColor = '#38bdf8';
          sCtx.fillRect(48, 36, 32, 56);
          sCtx.shadowBlur = 0;

          sCtx.fillStyle = '#e0f2fe';
          sCtx.fillRect(52, 44, 24, 6);
          sCtx.fillRect(52, 56, 24, 6);
          sCtx.fillRect(52, 68, 24, 6);
          sCtx.fillStyle = '#0284c7';
          sCtx.fillRect(52, 80, 24, 6);
        } else if (s.type === 'heal') {
          const medGrad = sCtx.createLinearGradient(20, 35, 108, 93);
          medGrad.addColorStop(0, '#ef4444');
          medGrad.addColorStop(0.6, '#b91c1c');
          medGrad.addColorStop(1, '#7f1d1d');
          sCtx.fillStyle = medGrad;
          sCtx.beginPath();
          sCtx.roundRect(24, 38, 80, 52, 8);
          sCtx.fill();

          sCtx.fillStyle = '#ffffff';
          sCtx.beginPath();
          sCtx.arc(64, 64, 18, 0, Math.PI * 2);
          sCtx.fill();

          sCtx.fillStyle = '#dc2626';
          sCtx.fillRect(61, 52, 6, 24);
          sCtx.fillRect(52, 61, 24, 6);

          sCtx.fillStyle = '#94a3b8';
          sCtx.fillRect(24, 38, 8, 8);
          sCtx.fillRect(96, 38, 8, 8);
          sCtx.fillRect(24, 82, 8, 8);
          sCtx.fillRect(96, 82, 8, 8);
        }

        // Loop over vertical slices of this sprite to draw and check z-buffer clipping
        for (let col = drawStartX; col < drawEndX; col++) {
          if (col < 0 || col >= dWidth) continue; // off screen bounds

          // Check if wall is closer than sprite at this vertical column
          if (transformY > state.zBuffer[col]) continue; // Occluded behind a wall!

          // DRAW DETAILED ZOMBIE PIXELS ON COLUMN SLICE FROM DYNAMIC OFFSCREEN CANVAS
          const sliceFraction = (col - drawStartX) / spriteSize; // 0.0 to 1.0
          if (sliceFraction < 0 || sliceFraction >= 1.0) continue;

          // Dark atmospheric shading matching depth distance
          let shadow = Math.min(1.0, dist / 7.2);
          const angleDiff = Math.abs(Math.atan2(spriteY, spriteX) - state.playerAngle);
          let flashlightBright = 0;
          if (flashlightBattery > 0) {
            if (angleDiff < 0.22) {
              flashlightBright = 0.9 * (1 - angleDiff / 0.22) * (1 - Math.min(1.0, dist / 5.2));
            }
          }
          const finalShadow = Math.max(0, shadow - flashlightBright - (state.muzzleFlash * 0.2));

          const srcX = Math.floor(sliceFraction * 128);
          
          // Draw the sliced column directly
          ctx.drawImage(
            spriteCanvas,
            srcX, 0, 1, 128,          // src (x, y, w, h)
            col, drawStartY, 1, spriteSize // dest (x, y, w, h)
          );

          // Apply distance and flashlight ambient shadow overlay
          if (finalShadow > 0) {
            ctx.fillStyle = `rgba(3, 5, 10, ${finalShadow})`;
            ctx.fillRect(col, drawStartY, 1, spriteSize);
          }
        }

        // Reduce damage flash animation counter incrementally
        if (s.damageFlash > 0) s.damageFlash -= 1;
      });

      // 6. DRAW PARTICLES IN 3D SPACE
      state.particles = state.particles.filter(p => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.alpha -= p.decay;

        // Calculate world coordinates relative to player view
        const pX = p.x - state.playerX;
        const pY = p.y - state.playerY;

        const transformX = cosP * pY - sinP * pX;
        const transformY = cosP * pX + sinP * pY;

        if (transformY > 0) {
          const pScreenX = Math.floor((dWidth / 2) * (1 + transformX / transformY));
          // Project Z height offset
          const pScreenY = Math.floor((dHeight / 2) * (1 + p.z / transformY)) + (dHeight / 2);
          const pSize = Math.max(1, (dHeight / transformY) * p.size * 0.1);

          // Depth bounds verify
          if (pScreenX >= 0 && pScreenX < dWidth && transformY < state.zBuffer[pScreenX]) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(pScreenX, pScreenY, pSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
        return p.alpha > 0;
      });

      // 7. DRAW RED TACTICAL LASER SIGHT RETICLE
      if (laserSight) {
        ctx.fillStyle = '#EF4444';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#EF4444';
        ctx.beginPath();
        ctx.arc(dWidth / 2, dHeight / 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Standard combat green crosshair
        ctx.strokeStyle = '#22C55E';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(dWidth / 2 - 8, dHeight / 2);
        ctx.lineTo(dWidth / 2 - 2, dHeight / 2);
        ctx.moveTo(dWidth / 2 + 2, dHeight / 2);
        ctx.lineTo(dWidth / 2 + 8, dHeight / 2);
        ctx.moveTo(dWidth / 2, dHeight / 2 - 8);
        ctx.lineTo(dWidth / 2, dHeight / 2 - 2);
        ctx.moveTo(dWidth / 2, dHeight / 2 + 2);
        ctx.lineTo(dWidth / 2, dHeight / 2 + 8);
        ctx.stroke();
      }

      // 8. FOREGROUND HELD 3D TACTICAL WEAPON HANDS (Bobbing/swaying)
      ctx.save();
      
      const swayX = Math.sin(Date.now() * 0.007) * (keys['w'] || keys['s'] || keys['a'] || keys['d'] ? 14 : 2);
      const swayY = Math.cos(Date.now() * 0.014) * (keys['w'] || keys['s'] || keys['a'] || keys['d'] ? 8 : 1) + state.recoilY;

      ctx.translate(dWidth / 2 + swayX, dHeight + swayY);

      // --- DRAW TWO FIRST-PERSON TACTICAL SUIT ARMS (UNDERNEATH THE WEAPON) ---
      // Left Arm: Slants from far bottom-left corner to hold the front of the gun barrel/grip
      ctx.save();
      ctx.strokeStyle = '#1E293B'; // Tactical Navy Suit
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-dWidth / 2.5, 45);
      ctx.lineTo(-24, -45); // connect to left-grip coordinate
      ctx.stroke();

      // Camouflage pattern on Left Arm
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(-dWidth / 2.5 + 40, 38);
      ctx.lineTo(-24 - 15, -45 + 15);
      ctx.stroke();
      ctx.strokeStyle = '#166534'; // Olive military spots
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-dWidth / 2.5 + 80, 28);
      ctx.lineTo(-24 - 30, -45 + 30);
      ctx.stroke();

      // Cybernetic Bio-Sensor Wrist-Watch on Left Arm
      ctx.fillStyle = '#090D16';
      ctx.fillRect(-85, -2, 22, 16);
      ctx.fillStyle = '#22C55E'; // glowing emerald watch screen
      ctx.fillRect(-82, 1, 16, 10);
      ctx.fillStyle = '#020617';
      ctx.font = 'bold 5px monospace';
      ctx.fillText("SYS_OK", -80, 8);
      ctx.restore();

      // Right Arm: Slants from bottom-right corner to grasp the rear trigger-grip
      ctx.save();
      ctx.strokeStyle = '#1E293B'; // Matching Tactical Suit
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(dWidth / 2.5, 45);
      ctx.lineTo(24, -20); // connect to right rear stock coordinate
      ctx.stroke();

      // Camouflage pattern on Right Arm
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(dWidth / 2.5 - 40, 38);
      ctx.lineTo(24 + 15, -20 + 15);
      ctx.stroke();
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(dWidth / 2.5 - 80, 28);
      ctx.lineTo(24 + 30, -20 + 30);
      ctx.stroke();
      ctx.restore();

      // --- DRAW THE WEAPON CHASSIS AND FOREGROUND GRIPPING HANDS ---
      if (currentWeapon === 'shotgun') {
        // --- HEAVY PUMP ACTION SHOTGUN ---
        // Steel weapon receiver
        ctx.fillStyle = '#334155'; // gun slate metal
        ctx.fillRect(-22, -110, 44, 110);
        
        // Specular metallic sheen
        ctx.fillStyle = '#64748B';
        ctx.fillRect(-19, -105, 3, 100);
        
        // Venting gas ports
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(-12, -90, 8, 5);
        ctx.fillRect(4, -90, 8, 5);

        // Double brutal barrels
        ctx.fillStyle = '#475569';
        ctx.fillRect(-16, -150, 14, 50);
        ctx.fillRect(2, -150, 14, 50);
        
        // Black hollow openings of the barrels
        ctx.fillStyle = '#020617';
        ctx.fillRect(-13, -154, 8, 5);
        ctx.fillRect(5, -154, 8, 5);

        // Brown wooden tactical pump slide (Recoils back on firing)
        const pumpY = state.recoilY > 2 ? 16 : 0;
        ctx.fillStyle = '#7C2D12'; // rich wood stain
        ctx.fillRect(-25, -75 + pumpY, 50, 30);
        ctx.fillStyle = '#451A03'; // grip notches
        ctx.fillRect(-25, -67 + pumpY, 50, 2);
        ctx.fillRect(-25, -59 + pumpY, 50, 2);

        // Holographic power LED dot on back plate
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(10, -32, 4, 4);

        // --- DRAW GRIPPING GLOVES ---
        // Left glove holding the sliding pump
        ctx.save();
        ctx.fillStyle = '#0F172A'; // Black leather combat glove
        ctx.fillRect(-28, -72 + pumpY, 15, 24);
        ctx.fillStyle = '#D97706'; // Golden armor knuckles
        ctx.fillRect(-26, -66 + pumpY, 8, 6);
        // Wrapped fingers
        ctx.fillStyle = '#111827';
        ctx.fillRect(-28, -50 + pumpY, 14, 4);
        ctx.restore();

        // Right glove holding the trigger and stock
        ctx.save();
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(10, -36, 18, 26);
        ctx.fillStyle = '#D97706'; // knuckle plate
        ctx.fillRect(14, -30, 8, 6);
        // Fingers
        ctx.fillStyle = '#111827';
        ctx.fillRect(8, -16, 12, 4);
        ctx.restore();
      } 
      else if (currentWeapon === 'plasma') {
        // --- SHINY NEON PLASMA RIFLE ---
        // Deep obsidian mainframe casing
        ctx.fillStyle = '#090D16';
        ctx.fillRect(-18, -130, 36, 130);

        // Glowing cyan plasma core chambers (pulsing neon energy)
        ctx.fillStyle = '#0EA5E9';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#0EA5E9';
        const pulseGlow = Math.abs(Math.sin(Date.now() * 0.015)) * 0.35 + 0.65;
        ctx.globalAlpha = pulseGlow;
        ctx.fillRect(-10, -110, 20, 24);
        ctx.fillRect(-10, -74, 20, 14);
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        // Shiny titanium metal barrel and vents
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(-6, -165, 12, 35);
        ctx.fillStyle = '#38BDF8'; // cyan glowing core nozzle
        ctx.fillRect(-3, -168, 6, 4);

        // Weapon dashboard screen (Holographic plasma ammo monitor)
        ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
        ctx.fillRect(-12, -42, 24, 18);
        ctx.strokeStyle = '#0EA5E9';
        ctx.lineWidth = 1;
        ctx.strokeRect(-12, -42, 24, 18);
        
        ctx.fillStyle = '#0EA5E9';
        ctx.font = 'bold 7px monospace';
        ctx.fillText(`P:${Math.round((ammo / maxAmmo) * 100)}`, -10, -32);
        ctx.fillRect(-9, -27, Math.max(0, 18 * (ammo / maxAmmo)), 2);

        // --- DRAW GRIPPING GLOVES ---
        // Left glove on the forearm rail
        ctx.save();
        ctx.fillStyle = '#1F2937';
        ctx.fillRect(-22, -64, 15, 22);
        ctx.fillStyle = '#38BDF8'; // glowing neon energy wire on wrist
        ctx.fillRect(-20, -58, 4, 4);
        ctx.restore();

        // Right glove squeezing the power grip
        ctx.save();
        ctx.fillStyle = '#1F2937';
        ctx.fillRect(8, -34, 16, 24);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(10, -28, 4, 4);
        ctx.restore();
      } 
      else {
        // --- MILITARY COVERT ASSAULT RIFLE ---
        // Carbon black silencer barrel extension
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(-4, -170, 8, 60);
        // Cool textured ribs
        ctx.fillStyle = '#020617';
        ctx.fillRect(-4, -152, 8, 2);
        ctx.fillRect(-4, -142, 8, 2);
        ctx.fillRect(-4, -132, 8, 2);

        // Main gun chassis receiver
        ctx.fillStyle = '#1E293B'; 
        ctx.fillRect(-15, -120, 30, 70);

        // Flash hider and gas block adapter
        ctx.fillStyle = '#475569';
        ctx.fillRect(-3, -115, 6, 20);
        
        // Tactical scope with red-dot lens glowing glass
        ctx.fillStyle = '#020617';
        ctx.fillRect(-7, -100, 14, 12);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.7)'; // glowing laser lens
        ctx.fillRect(-4, -97, 8, 5);

        // TACTICAL VISOR LCD BULLET COUNT SCREEN ON BACKPLATE
        ctx.fillStyle = '#020617';
        ctx.fillRect(-10, -55, 20, 16);
        ctx.strokeStyle = '#EF4444';
        ctx.strokeRect(-10, -55, 20, 16);
        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 8px monospace';
        const padAmmo = ammo.toString().padStart(2, '0');
        ctx.fillText(padAmmo, -8, -43);
        
        // Micro indicator heart/status icon on gun screen
        ctx.fillRect(4, -48, 2, 2);
        ctx.fillRect(3, -49, 4, 1);

        // --- DRAW GRIPPING GLOVES ---
        // Left glove supporting gun rail
        ctx.save();
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(-20, -82, 14, 20);
        ctx.fillStyle = '#475569'; // steel armor knuckle plate
        ctx.fillRect(-18, -78, 6, 4);
        ctx.restore();

        // Right glove holding handle trigger
        ctx.save();
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(8, -34, 15, 22);
        ctx.fillStyle = '#475569';
        ctx.fillRect(10, -30, 6, 4);
        ctx.restore();
      }

      ctx.restore();

      // CONTINUOUS ENGINE LOOP
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isPaused, isGameOver, showUpgrades, currentWeapon, soundEnabled, isNightVision, bootsLevel, flashlightBattery, laserSight, kevlarLevel]);

  const handleButtonPressStart = (key: string) => {
    gameRef.current.keysPressed[key.toLowerCase()] = true;
  };

  const handleButtonPressEnd = (key: string) => {
    gameRef.current.keysPressed[key.toLowerCase()] = false;
  };

  const startNewGame = () => {
    const state = gameRef.current;
    state.playerX = 1.5;
    state.playerY = 1.5;
    state.playerAngle = Math.PI / 4;
    state.level = 1;
    state.sprites = [];
    
    // Spawn 15 initial ambient zombies distributed across the map for dense starting action!
    for (let i = 0; i < 15; i++) {
      spawnEnemyAtRandomLocation(state, true);
    }
    state.particles = [];
    state.secondsPlayed = 0;
    state.spawnCooldown = 3000;
    state.flashlightBattery = 100;

    setScore(0);
    setLevel(1);
    setXp(0);
    setXpNeeded(100);
    setHp(100);
    setElapsedTime(0);
    setFlashlightBattery(100);
    setIsNightVision(false);
    setLaserSight(false);
    setKevlarLevel(0);
    setBootsLevel(0);
    setOnScreenSplatters([]);
    setIsGameOver(false);
    setIsPaused(false);
    setShowUpgrades(false);
    setIsPlaying(true);
    setAmmo(8);
    setReserveAmmo(120);
    setCurrentWeapon('shotgun');

    setCombatLogs([
      isMn ? "СИСТЕМ ШАЛГАЛТ: ИДЭВХТЭЙ v2.4" : "VISOR DETECTED: SYSTEM ONLINE v2.4",
      isMn ? "РАДАР: ДИГИТАЛ ТОХИРГОО OK" : "RADAR SENSORS: 100% OPERATIONAL",
      isMn ? "МӨРДӨГЧ: БЭЛЭН" : "COMBAT RETINA HUD: CALIBRATED"
    ]);

    if (soundEnabled) playSound('upgrade');
  };

  useEffect(() => {
    if (isGameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('zombie_3d_highscore', score.toString());
    }
  }, [isGameOver, score, highScore]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#05090f] text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-red-600/40 flex flex-col relative font-sans">
        
        {/* HELMET HUD DAMAGE BLOOD SPLATTERS GLASS EFFECTS */}
        {onScreenSplatters.map((splat, idx) => (
          <div 
            key={idx}
            className="absolute pointer-events-none z-10 transition-opacity duration-1000"
            style={{
              left: `${splat.x}px`,
              top: `${splat.y}px`,
              width: `${splat.size}px`,
              height: `${splat.size}px`,
              backgroundColor: 'rgba(185, 28, 28, 0.45)',
              borderRadius: '50%',
              filter: 'blur(3px)',
              boxShadow: '0 0 10px rgba(185, 28, 28, 0.6)'
            }}
          />
        ))}

        {/* Dynamic screen flash overlay */}
        {screenDamageFlash > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none z-10 transition-all border-[14px] border-red-600/70"
            style={{ 
              opacity: screenDamageFlash / 100,
              boxShadow: 'inset 0 0 60px rgba(185,28,28,0.85)'
            }}
          />
        )}

        {/* Title Bar Header */}
        <div className="bg-gray-950 px-5 py-3 flex items-center justify-between border-b border-gray-900/80 z-20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-600/20 text-red-500 rounded-lg border border-red-800">
              <Skull className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-red-500 flex items-center gap-1.5 uppercase">
                {isMn ? "СЕЙФ: ЗОМБИ 3D" : "TACTICAL DEAD 3D"}
                <span className="text-[9px] bg-red-950/50 text-red-400 border border-red-800/40 px-1 rounded-full font-mono font-black animate-pulse">3D NIGHT</span>
              </h3>
              <p className="text-[10px] text-gray-400">
                {isMn ? "3D харанхуй коридор болон флаш-лайт" : "Real 3D Raycasting Night Horror Outpost"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Night Vision Switch */}
            <button
              onClick={() => {
                if (flashlightBattery > 0) {
                  setIsNightVision(!isNightVision);
                  if (soundEnabled) playSound('reload');
                }
              }}
              className={`p-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                isNightVision ? 'bg-green-600/20 text-green-400 border-green-500' : 'bg-gray-900 text-gray-400 border-gray-800'
              }`}
              title="Toggle Night Vision Scope"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isMn ? "НҮД" : "NVG"}</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-gray-900 border border-gray-800 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-red-500" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 bg-gray-900 border border-gray-800 hover:bg-red-950 rounded-lg text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HUD Info Stats */}
        <div className="bg-gray-950/95 px-5 py-2.5 flex items-center justify-between text-xs border-b border-gray-900 font-mono z-20">
          <div className="flex items-center gap-3">
            <span>{isMn ? "ОНОО:" : "SCORE:"} <strong className="text-red-400 text-sm font-black">{score}</strong></span>
            <span>{isMn ? "ТҮВШИН:" : "LV:"} <strong className="text-amber-400 font-black">{level}</strong></span>
          </div>

          {/* Spooky pulsating heart rate simulator */}
          <div className="flex items-center gap-2 text-xs bg-red-950/40 border border-red-900/30 px-2.5 py-0.5 rounded-full font-bold">
            <span className={`w-2.5 h-2.5 rounded-full bg-red-500 animate-ping`} style={{ animationDuration: hp < 40 ? '0.4s' : '1.2s' }} />
            <span className="text-[10px] text-red-400">{hp < 40 ? 'CRITICAL HR' : '90 BPM'}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span>{isMn ? "ДЭЭД:" : "BEST:"} <strong className="text-yellow-500 font-bold">{highScore}</strong></span>
          </div>
        </div>

        {/* Vital Health & Battery Bars */}
        {isPlaying && !isGameOver && (
          <div className="bg-gray-950/95 px-5 py-2 flex flex-col gap-1.5 border-b border-gray-900 font-mono z-20">
            <div className="grid grid-cols-2 gap-4">
              {/* HP Meter */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-red-400">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 fill-red-500/10 text-red-500" /> {isMn ? "АМЬ:" : "VITAL HEALTH:"}</span>
                  <span>{hp}%</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-md overflow-hidden border border-gray-800">
                  <div 
                    className={`h-full transition-all duration-150 ${hp < 40 ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`}
                    style={{ width: `${hp}%` }}
                  />
                </div>
              </div>

              {/* Flashlight/Nightvision battery reserve */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-cyan-400">
                  <span className="flex items-center gap-1">🔦 {isMn ? "ЦЭНЭГ:" : "POWER CELL:"}</span>
                  <span>{Math.round(flashlightBattery)}%</span>
                </div>
                <div className="h-2 bg-gray-900 rounded-md overflow-hidden border border-gray-800">
                  <div 
                    className={`h-full ${flashlightBattery < 25 ? 'bg-yellow-500 animate-pulse' : 'bg-cyan-500'}`}
                    style={{ width: `${flashlightBattery}%` }}
                  />
                </div>
              </div>
            </div>

            {/* XP Progression Bar */}
            <div className="flex items-center justify-between gap-3 mt-1">
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5" /> {isMn ? "ТУРШЛАГА:" : "XP PATCH:"}
              </span>
              <div className="flex-grow h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                  style={{ width: `${(xp / xpNeeded) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-400 w-12 text-right">
                {xp}/{xpNeeded}
              </span>
            </div>
          </div>
        )}

        {/* 3D Render Screen Stage */}
        <div className="relative bg-black flex justify-center items-center h-[340px] select-none">
          <canvas
            ref={canvasRef}
            tabIndex={0}
            width={400}
            height={340}
            className="w-full h-full max-w-[400px] block cursor-crosshair focus:outline-none focus:ring-2 focus:ring-red-600/30"
            onClick={() => {
              canvasRef.current?.focus();
              handleShoot();
            }}
          />

          {/* Tactical Visor Combat Logs overlay */}
          {isPlaying && !isGameOver && !showUpgrades && (
            <div className="absolute bottom-3 left-3 flex flex-col gap-0.5 pointer-events-none font-mono text-[8px] text-green-400 bg-black/65 p-2 rounded-xl border border-green-500/20 max-w-[170px] backdrop-blur-xs">
              <div className="text-[7px] text-green-500 font-extrabold uppercase tracking-widest border-b border-green-500/25 pb-0.5 mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                SYSTEM LOGS
              </div>
              {combatLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`truncate leading-tight transition-opacity duration-300 ${
                    idx === 0 ? 'text-green-300 font-bold animate-pulse' : 'text-green-500/70'
                  }`}
                >
                  &gt; {log}
                </div>
              ))}
            </div>
          )}

          {/* Tactical Heart-Rate ECG Overlay */}
          {isPlaying && !isGameOver && !showUpgrades && (
            <div className="absolute bottom-3 right-3 pointer-events-none font-mono text-[7px] bg-black/65 p-2 rounded-xl border border-red-500/25 backdrop-blur-xs flex flex-col gap-0.5 max-w-[100px]">
              <div className="text-red-500 font-extrabold uppercase tracking-widest border-b border-red-500/20 pb-0.5 mb-0.5">HR MONITOR</div>
              <div className="flex items-center gap-1.5 justify-between">
                <svg className="w-10 h-4 text-red-500" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path 
                    d={hp < 40 
                      ? "M0,10 L10,10 L13,3 L16,17 L19,10 L25,10 L28,2 L31,18 L34,10 L50,10" 
                      : "M0,10 L15,10 L18,2 L21,18 L24,10 L35,10 L38,2 L41,18 L44,10 L50,10"
                    } 
                    strokeDasharray="50"
                    strokeDashoffset="0"
                  />
                </svg>
                <div className={`font-black text-[10px] shrink-0 leading-none ${hp < 40 ? 'text-red-500 animate-pulse font-black' : 'text-green-400'}`}>
                  {hp < 40 ? '145' : '76'} <span className="text-[6px] text-gray-500 font-medium">BPM</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive tactical mini radar map display overlay */}
          {isPlaying && !isGameOver && !showUpgrades && (
            <div className="absolute top-3 right-3 bg-gray-950/90 border border-gray-800 p-1.5 rounded-2xl flex flex-col items-center gap-1 shadow-lg shadow-black/80">
              <div className="text-[8px] font-mono text-green-500 animate-pulse flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-green-500" />
                <span>GPS RADAR</span>
              </div>
              <div className="relative w-16 h-16 bg-black/60 rounded-full border border-green-900/60 overflow-hidden flex items-center justify-center">
                {/* Radar sweeping line */}
                <div className="absolute inset-0 border-r border-green-500/20 origin-center animate-spin" style={{ animationDuration: '3s' }} />
                
                {/* Player center dot */}
                <div className="absolute w-1.5 h-1.5 rounded-full bg-blue-500 z-10" />

                {/* Draw surrounding zombie red blips */}
                {gameRef.current.sprites.filter(s => s.type !== 'acid').map((s, idx) => {
                  const dx = s.x - gameRef.current.playerX;
                  const dy = s.y - gameRef.current.playerY;
                  const dist = Math.hypot(dx, dy);
                  if (dist > 5) return null; // out of radar range
                  
                  // Translate world offset to map coordinate pixels
                  const px = 32 + (dx * 5.5);
                  const py = 32 + (dy * 5.5);

                  return (
                    <div 
                      key={idx}
                      className="absolute w-1 h-1 rounded-full bg-red-500 animate-ping"
                      style={{ left: `${px}px`, top: `${py}px` }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Level UP upgrade options overlay */}
          {showUpgrades && (
            <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-5 text-center space-y-3.5 z-30">
              <div className="p-3 bg-emerald-500/20 rounded-full border border-emerald-500/30 text-emerald-300 animate-bounce">
                <Award className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-emerald-300 uppercase tracking-tight">
                  {isMn ? "ЦЭРГИЙН ЗЭВСРЭГ САЙЖРУУЛАХ ⚔️" : "TACTICAL LEVEL UP PATCH! 🏆"}
                </h4>
                <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-relaxed">
                  {isMn ? "Дараах тактикийн сайжруулалтуудаас нэгийг нь сонгоорой:" : "Select one critical system hardware boost for your next encounter:"}
                </p>
              </div>

              <div className="w-full max-w-xs space-y-1.5 pt-1">
                {upgradeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => selectUpgrade(opt)}
                    className="w-full text-left p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500/60 transition-all hover:bg-emerald-950/25 active:scale-98 cursor-pointer flex items-center justify-between"
                  >
                    <div className="text-[10px] font-bold text-white uppercase">{opt}</div>
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lobby Start Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4 z-30">
              <div className="p-4 bg-red-600/10 rounded-full border border-red-500/30 text-red-500 animate-pulse">
                <Skull className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 tracking-tight uppercase">
                  {isMn ? "СЕЙФ: ЗОМБИ 3D" : "TACTICAL DEAD 3D"}
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mt-1.5 leading-relaxed">
                  {isMn 
                    ? "Удирдлага: WASD эсвэл Сумнуудаар 3D коридорт хөдөлнө. Товчлуурууд: [Q] зүүн тийш харах, [E] баруун тийш харах, [Мулти-Медиа клик] - буудна. Амьд үлдэхийг хичээгээрэй!" 
                    : "Fly down 3D night alleys with a fading flashlight. Turn using Q/E or arrow keys. W/S to move. CLICK to fire at shamblers. Find escape nodes!"}
                </p>
              </div>

              <button
                onClick={startNewGame}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 hover:scale-105 active:scale-95 text-white font-black text-xs px-8 py-3.5 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isMn ? "СОРЬЖ ҮЗЭХ 🚀" : "ENTER SURVIVAL OUTPOST 🚀"}</span>
              </button>

              <div className="text-[9px] text-gray-500 font-mono mt-4 uppercase">
                {isMn ? "⌨️ Гарны товчлуур дэмжинэ • Сул гэрлийн горим" : "⌨️ FULL KEYBOARD CONTROLS • horror atmosphere"}
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {isGameOver && (
            <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-5 text-center space-y-3 z-30">
              <div className="p-3 bg-red-950/20 rounded-full border border-red-500/30 text-red-500 animate-bounce">
                <ShieldAlert className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-xl font-black text-red-500 tracking-tight uppercase">
                  {isMn ? "ХАМГААЛАЛТ СҮЙРЛЭЭ!" : "WIPED OUT BY INFECTED!"}
                </h4>
                <p className="text-[11px] text-gray-400 max-w-xs mt-1 leading-relaxed">
                  {isMn ? "Зомби таныг устгалаа. Илүү хурдан сайжруулалт сонгоорой!" : "Malware hordes breached your tactical visor suit. Spawn again and deploy shotgun patches early!"}
                </p>
              </div>

              {score === highScore && score > 0 && (
                <div className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  <span>{isMn ? "ТАКТИКИЙН ШИНЭ РЕКОРД! 🏆" : "NEW HIGHSCORE RECORD! 🏆"}</span>
                </div>
              )}

              <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-2.5 flex gap-6 justify-center items-center font-mono">
                <div className="text-center">
                  <div className="text-[9px] text-gray-500 uppercase">{isMn ? "Авсан оноо" : "Score"}</div>
                  <div className="text-lg font-black text-red-400">{score}</div>
                </div>
                <div className="w-[1px] h-6 bg-gray-800" />
                <div className="text-center">
                  <div className="text-[9px] text-gray-500 uppercase">{isMn ? "Амьд үлдсэн" : "Time"}</div>
                  <div className="text-lg font-black text-yellow-400">{formatTime(elapsedTime)}</div>
                </div>
              </div>

              <button
                onClick={startNewGame}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 hover:scale-105 active:scale-95 text-white font-bold text-[10px] px-6 py-3 rounded-full transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>{isMn ? "ШИНЭЭР ЭХЛЭХ ⚔️" : "RESPAWN SOLDIER ⚔️"}</span>
              </button>
            </div>
          )}

        </div>

        {/* Weapons Switching & HUD Panels */}
        {isPlaying && !isGameOver && (
          <div className="bg-gray-950 px-4 py-3 border-t border-gray-900 flex justify-between items-center z-20">
            {/* AMMO HUD GAUGE */}
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-gray-500 uppercase">{isMn ? "Сумны нөөц" : "MAGAZINE RESERVE"}</span>
              <div className="flex items-baseline gap-1 font-mono">
                <strong className={`text-xl font-black ${ammo < 8 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                  {ammo}
                </strong>
                <span className="text-gray-500 text-xs">/</span>
                <span className="text-gray-400 text-xs font-semibold">{reserveAmmo}</span>
              </div>
            </div>

            {/* QUICK WEAPONS BAR */}
            <div className="flex items-center gap-1.5 bg-gray-900/60 p-1 rounded-xl border border-gray-800/40">
              <button
                onClick={() => swapWeapon('rifle')}
                className={`px-2 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  currentWeapon === 'rifle' ? 'bg-[#7342E2] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                AR-30
              </button>
              <button
                onClick={() => swapWeapon('shotgun')}
                className={`px-2 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  currentWeapon === 'shotgun' ? 'bg-[#7342E2] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                SG-8
              </button>
              <button
                onClick={() => swapWeapon('plasma')}
                className={`px-2 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  currentWeapon === 'plasma' ? 'bg-[#7342E2] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                PLASMA-50
              </button>
            </div>

            {/* Action buttons (Reload, Strafe turn for mobile touch support) */}
            <div className="flex gap-1.5">
              <button
                onClick={triggerReload}
                className="bg-gray-900 border border-gray-800 hover:bg-gray-800 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all text-yellow-400 cursor-pointer uppercase"
              >
                {isMn ? "СУМЛАХ" : "RELOAD [R]"}
              </button>
            </div>
          </div>
        )}

        {/* Tactical turn buttons overlay for Mobile responsive comfort */}
        {isPlaying && !isGameOver && (
          <div className="bg-gray-950 px-4 py-3 text-center text-[10px] text-gray-500 border-t border-gray-900 font-mono z-20 flex flex-col gap-2.5 items-center w-full">
            <div className="grid grid-cols-2 gap-4 items-center w-full max-w-sm">
              
              {/* Movement Pad (D-pad layout) */}
              <div className="flex flex-col items-center gap-1 bg-gray-900/40 p-2 rounded-2xl border border-gray-800/60 w-full">
                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {isMn ? "ХӨДЛӨХ" : "MOVEMENT"}
                </div>
                <div className="grid grid-cols-3 gap-1 w-24">
                  <div />
                  <button
                    onMouseDown={() => handleButtonPressStart('w')}
                    onMouseUp={() => handleButtonPressEnd('w')}
                    onMouseLeave={() => handleButtonPressEnd('w')}
                    onTouchStart={(e) => { e.preventDefault(); handleButtonPressStart('w'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleButtonPressEnd('w'); }}
                    className="h-8 w-8 bg-gray-800 border border-gray-700 active:bg-red-900/60 rounded-lg font-bold flex items-center justify-center text-[10px] select-none cursor-pointer"
                    title="Move Forward"
                  >
                    ▲
                  </button>
                  <div />

                  <button
                    onMouseDown={() => handleButtonPressStart('a')}
                    onMouseUp={() => handleButtonPressEnd('a')}
                    onMouseLeave={() => handleButtonPressEnd('a')}
                    onTouchStart={(e) => { e.preventDefault(); handleButtonPressStart('a'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleButtonPressEnd('a'); }}
                    className="h-8 w-8 bg-gray-800 border border-gray-700 active:bg-red-900/60 rounded-lg font-bold flex items-center justify-center text-[10px] select-none cursor-pointer"
                    title="Strafe Left"
                  >
                    ◀
                  </button>
                  <button
                    onMouseDown={() => handleButtonPressStart('s')}
                    onMouseUp={() => handleButtonPressEnd('s')}
                    onMouseLeave={() => handleButtonPressEnd('s')}
                    onTouchStart={(e) => { e.preventDefault(); handleButtonPressStart('s'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleButtonPressEnd('s'); }}
                    className="h-8 w-8 bg-gray-800 border border-gray-700 active:bg-red-900/60 rounded-lg font-bold flex items-center justify-center text-[10px] select-none cursor-pointer"
                    title="Move Backward"
                  >
                    ▼
                  </button>
                  <button
                    onMouseDown={() => handleButtonPressStart('d')}
                    onMouseUp={() => handleButtonPressEnd('d')}
                    onMouseLeave={() => handleButtonPressEnd('d')}
                    onTouchStart={(e) => { e.preventDefault(); handleButtonPressStart('d'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleButtonPressEnd('d'); }}
                    className="h-8 w-8 bg-gray-800 border border-gray-700 active:bg-red-900/60 rounded-lg font-bold flex items-center justify-center text-[10px] select-none cursor-pointer"
                    title="Strafe Right"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* Rotation & Action Pad */}
              <div className="flex flex-col items-center gap-1 bg-gray-900/40 p-2 rounded-2xl border border-gray-800/60 w-full">
                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {isMn ? "ЭРГЭХ & БУУДАХ" : "ROTATION & FIRE"}
                </div>
                <div className="flex gap-1.5 items-center justify-center h-18">
                  <button
                    onMouseDown={() => handleButtonPressStart('q')}
                    onMouseUp={() => handleButtonPressEnd('q')}
                    onMouseLeave={() => handleButtonPressEnd('q')}
                    onTouchStart={(e) => { e.preventDefault(); handleButtonPressStart('q'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleButtonPressEnd('q'); }}
                    className="h-9 w-10 bg-gray-800 border border-gray-700 active:bg-[#7342E2]/60 rounded-xl font-bold flex flex-col items-center justify-center text-[10px] select-none cursor-pointer gap-0.5"
                  >
                    <span>↺</span>
                    <span className="text-[7px] opacity-70">Q</span>
                  </button>
                  
                  {/* Shoot virtual button */}
                  <button
                    onClick={handleShoot}
                    className="h-11 w-11 bg-red-600 hover:bg-red-500 border border-red-500 active:scale-95 text-white rounded-full font-black flex flex-col items-center justify-center text-[8px] select-none cursor-pointer shadow-lg shadow-red-950/50"
                  >
                    <span>FIRE</span>
                  </button>

                  <button
                    onMouseDown={() => handleButtonPressStart('e')}
                    onMouseUp={() => handleButtonPressEnd('e')}
                    onMouseLeave={() => handleButtonPressEnd('e')}
                    onTouchStart={(e) => { e.preventDefault(); handleButtonPressStart('e'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleButtonPressEnd('e'); }}
                    className="h-9 w-10 bg-gray-800 border border-gray-700 active:bg-[#7342E2]/60 rounded-xl font-bold flex flex-col items-center justify-center text-[10px] select-none cursor-pointer gap-0.5"
                  >
                    <span>↻</span>
                    <span className="text-[7px] opacity-70">E</span>
                  </button>
                </div>
              </div>

            </div>
            <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-1">
              {isMn 
                ? "⌨️ Гар: WASD - Хөдлөх, Q/E - Эргэх, Клик - Буудах" 
                : "⌨️ Keyboard: WASD to move • Q/E to Turn • CLICK to Shoot"}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}

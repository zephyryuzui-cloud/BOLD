import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, Shield, Heart, Trophy, RefreshCw, X, Play, Pause,
  Volume2, VolumeX, Sparkles, Flame, ShieldAlert, Star, Zap, Award
} from 'lucide-react';
import { LanguageType } from '../types';

interface GamerSurvivalProps {
  onClose: () => void;
  language: LanguageType;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  type: 'crawler' | 'speeder' | 'boss';
  hp: number;
  maxHp: number;
  speed: number;
  size: number;
  color: string;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  damage: number;
}

interface XPNode {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

// Retro 8-bit synthesizer engine for juicy survival gameplay sounds
const playSound = (type: 'xp' | 'hurt' | 'gameover' | 'shoot' | 'upgrade' | 'boss') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'xp') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'hurt') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === 'shoot') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'upgrade') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
      osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.08); // E4
      osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.16); // G4
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.24); // C5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'boss') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.85);
      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    }
  } catch (e) {
    // Audio Context is not supported or was blocked
  }
};

export default function GamerSurvival({ onClose, language }: GamerSurvivalProps) {
  const isMn = language === 'mn';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [xpNeeded, setXpNeeded] = useState(100);
  const [hp, setHp] = useState(100);
  const [maxHp, setMaxHp] = useState(100);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Upgrade option system
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<string[]>([]);

  // Stats
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [fireRateLevel, setFireRateLevel] = useState(1);
  const [speedLevel, setSpeedLevel] = useState(1);

  // Game references
  const gameRef = useRef({
    playerX: 220,
    playerY: 230,
    playerSpeed: 3.5,
    playerSize: 14,
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    xpNodes: [] as XPNode[],
    particles: [] as Particle[],
    keysPressed: {} as Record<string, boolean>,
    lastShootTime: 0,
    shootCooldown: 500, // ms
    lastSpawnTime: 0,
    spawnCooldown: 1800, // ms
    gameStartTime: 0,
    score: 0,
    level: 1,
    xp: 0,
    xpNeeded: 100,
    hp: 100,
    maxHp: 100,
    secondsPlayed: 0,
    weaponType: 1, // 1 = Single, 2 = Twin, 3 = Quad, 4 = Nova
    fireRateLevel: 1,
    speedLevel: 1,
    orbitAngle: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('bold_survival_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Controls Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameRef.current.keysPressed[e.key.toLowerCase()] = true;
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
  }, []);

  // Timer interval for clock
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || showUpgrades) return;

    const timer = setInterval(() => {
      gameRef.current.secondsPlayed += 1;
      setElapsedTime(gameRef.current.secondsPlayed);
      
      // Gradually make spawns faster as survival time increases
      gameRef.current.spawnCooldown = Math.max(500, 1800 - gameRef.current.secondsPlayed * 15);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isPaused, isGameOver, showUpgrades]);

  const generateUpgrades = () => {
    const upgrades = [
      isMn ? 'УЛААН ЛАЗЕР (ХОС БУУДАЛТ)' : 'TWIN LASER (MULTISHOT)',
      isMn ? 'МЭДРЭГЧ (ХУРДАН БУУДАХ)' : 'CHIP BOOST (FIRE RATE)',
      isMn ? 'НАВИГАТОР (ХӨЛГИЙН ХУРД)' : 'PROPULSION DRIVE (SPEED)',
      isMn ? 'АМЬ СЭРГЭЭХ (БҮРЭН ЦЭНЭГЛЭХ)' : 'HEAL DRIVE (FULL RESTORE)'
    ];
    
    // Pick 3 random
    const shuffled = [...upgrades].sort(() => 0.5 - Math.random());
    setUpgradeOptions(shuffled.slice(0, 3));
    setShowUpgrades(true);
    if (soundEnabled) playSound('upgrade');
  };

  const handleSelectUpgrade = (option: string) => {
    const state = gameRef.current;
    
    if (option.includes('TWIN') || option.includes('ХОС')) {
      state.weaponType = Math.min(4, state.weaponType + 1);
      setWeaponLevel(state.weaponType);
    } else if (option.includes('CHIP') || option.includes('ХУРДАН')) {
      state.fireRateLevel += 1;
      state.shootCooldown = Math.max(150, 500 - state.fireRateLevel * 60);
      setFireRateLevel(state.fireRateLevel);
    } else if (option.includes('PROPULSION') || option.includes('ХӨЛГИЙН')) {
      state.speedLevel += 1;
      state.playerSpeed = 3.5 + state.speedLevel * 0.5;
      setSpeedLevel(state.speedLevel);
    } else if (option.includes('HEAL') || option.includes('АМЬ')) {
      state.hp = state.maxHp;
      setHp(state.hp);
    }

    setShowUpgrades(false);
    // Resume game loop after upgrade selected
  };

  const createExplosion = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4.5;
      gameRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02
      });
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || showUpgrades) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      const state = gameRef.current;

      // 1. Clear background with grid pattern
      ctx.fillStyle = '#080c14'; // cyber dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid mesh lines
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 2. Player Input Movement
      let dx = 0;
      let dy = 0;
      const keys = state.keysPressed;

      if (keys['arrowleft'] || keys['a']) dx = -1;
      if (keys['arrowright'] || keys['d']) dx = 1;
      if (keys['arrowup'] || keys['w']) dy = -1;
      if (keys['arrowdown'] || keys['s']) dy = 1;

      // Normalize diagonal speed
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      state.playerX = Math.max(state.playerSize, Math.min(canvas.width - state.playerSize, state.playerX + dx * state.playerSpeed));
      state.playerY = Math.max(state.playerSize, Math.min(canvas.height - state.playerSize, state.playerY + dy * state.playerSpeed));

      // 3. Automated shooting logic at nearest enemy
      if (state.enemies.length > 0) {
        const now = Date.now();
        if (now - state.lastShootTime > state.shootCooldown) {
          state.lastShootTime = now;

          // Find nearest enemy
          let nearestEnemy: Enemy | null = null;
          let minDist = 999999;
          for (const enemy of state.enemies) {
            const dist = Math.hypot(enemy.x - state.playerX, enemy.y - state.playerY);
            if (dist < minDist) {
              minDist = dist;
              nearestEnemy = enemy;
            }
          }

          if (nearestEnemy) {
            // Target vector
            const angle = Math.atan2(nearestEnemy.y - state.playerY, nearestEnemy.x - state.playerX);
            const bSpeed = 7.5;

            // Shoot based on weapon level
            if (state.weaponType === 1) {
              // Single shot
              state.bullets.push({
                id: Math.random().toString(),
                x: state.playerX,
                y: state.playerY,
                vx: Math.cos(angle) * bSpeed,
                vy: Math.sin(angle) * bSpeed,
                size: 3.5,
                color: '#67E8F9', // Cyan laser
                damage: 25
              });
            } else if (state.weaponType === 2) {
              // Double shot spread
              state.bullets.push({
                id: Math.random().toString(),
                x: state.playerX,
                y: state.playerY,
                vx: Math.cos(angle - 0.15) * bSpeed,
                vy: Math.sin(angle - 0.15) * bSpeed,
                size: 3.5,
                color: '#A855F7', // Purple spread
                damage: 25
              });
              state.bullets.push({
                id: Math.random().toString(),
                x: state.playerX,
                y: state.playerY,
                vx: Math.cos(angle + 0.15) * bSpeed,
                vy: Math.sin(angle + 0.15) * bSpeed,
                size: 3.5,
                color: '#A855F7',
                damage: 25
              });
            } else if (state.weaponType === 3) {
              // Tri-directional + Piercing power
              state.bullets.push({
                id: Math.random().toString(),
                x: state.playerX,
                y: state.playerY,
                vx: Math.cos(angle) * bSpeed,
                vy: Math.sin(angle) * bSpeed,
                size: 4.5,
                color: '#10B981', // Green ultra
                damage: 35
              });
              state.bullets.push({
                id: Math.random().toString(),
                x: state.playerX,
                y: state.playerY,
                vx: Math.cos(angle - 0.35) * bSpeed,
                vy: Math.sin(angle - 0.35) * bSpeed,
                size: 3.5,
                color: '#3B82F6',
                damage: 20
              });
              state.bullets.push({
                id: Math.random().toString(),
                x: state.playerX,
                y: state.playerY,
                vx: Math.cos(angle + 0.35) * bSpeed,
                vy: Math.sin(angle + 0.35) * bSpeed,
                size: 3.5,
                color: '#3B82F6',
                damage: 20
              });
            } else {
              // Level 4 Nova shot: 8-direction explosive rings
              for (let i = 0; i < 8; i++) {
                const stepAngle = angle + (i * Math.PI) / 4;
                state.bullets.push({
                  id: Math.random().toString(),
                  x: state.playerX,
                  y: state.playerY,
                  vx: Math.cos(stepAngle) * bSpeed,
                  vy: Math.sin(stepAngle) * bSpeed,
                  size: 4,
                  color: '#EC4899', // Pink ring
                  damage: 30
                });
              }
            }

            if (soundEnabled) playSound('shoot');
          }
        }
      }

      // 4. Enemy Spawning Logic
      const now = Date.now();
      if (now - state.lastSpawnTime > state.spawnCooldown) {
        state.lastSpawnTime = now;

        // Choose random spawn location just off-screen
        let sx = 0, sy = 0;
        if (Math.random() < 0.5) {
          sx = Math.random() < 0.5 ? -20 : canvas.width + 20;
          sy = Math.random() * canvas.height;
        } else {
          sx = Math.random() * canvas.width;
          sy = Math.random() < 0.5 ? -20 : canvas.height + 20;
        }

        // Difficulty increases based on elapsed time
        const r = Math.random();
        let eType: Enemy['type'] = 'crawler';
        let eHp = 40 + state.level * 10;
        let eSpeed = 1.2 + Math.random() * 0.8;
        let eSize = 10;
        let eColor = '#EF4444'; // Red Trojan crawler

        if (state.secondsPlayed > 50 && r < 0.25) {
          // Boss virus
          eType = 'boss';
          eHp = 250 + state.level * 100;
          eSpeed = 0.8;
          eSize = 20;
          eColor = '#F59E0B'; // Amber boss hacker
          if (soundEnabled) playSound('boss');
        } else if (r > 0.7) {
          // Fast worm speeder
          eType = 'speeder';
          eHp = 20 + state.level * 5;
          eSpeed = 2.4;
          eSize = 8;
          eColor = '#F43F5E'; // Pink phish speeder
        }

        state.enemies.push({
          id: Math.random().toString(),
          x: sx,
          y: sy,
          type: eType,
          hp: eHp,
          maxHp: eHp,
          speed: eSpeed,
          size: eSize,
          color: eColor
        });
      }

      // 5. Update and Draw XP Nodes
      state.xpNodes = state.xpNodes.filter(node => {
        // Simple magnet pull effect when player gets close (within 100px)
        const dist = Math.hypot(node.x - state.playerX, node.y - state.playerY);
        if (dist < 100) {
          const angle = Math.atan2(state.playerY - node.y, state.playerX - node.x);
          // Pull speed increases as player gets closer
          const pull = 4.5 * (1 - dist / 100) + 1;
          node.x += Math.cos(angle) * pull;
          node.y += Math.sin(angle) * pull;
        }

        // Collision with player
        if (dist < state.playerSize + node.size) {
          // Collect XP!
          state.xp += node.value;
          state.score += 5;
          setScore(state.score);
          setXp(state.xp);
          if (soundEnabled) playSound('xp');

          // Check Level Up trigger
          if (state.xp >= state.xpNeeded) {
            state.xp -= state.xpNeeded;
            state.level += 1;
            state.xpNeeded = Math.round(state.xpNeeded * 1.35);
            setLevel(state.level);
            setXp(state.xp);
            setXpNeeded(state.xpNeeded);
            
            // Show level-up upgrades selection overlay
            generateUpgrades();
          }
          return false;
        }

        // Draw XP Node
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = node.color;
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
      });

      // 6. Update and Draw Bullets
      state.bullets = state.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Draw laser bolt
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = bullet.color;
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Check laser collision with enemies
        let hitEnemy = false;
        state.enemies = state.enemies.filter(enemy => {
          const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
          if (dist < enemy.size + bullet.size) {
            enemy.hp -= bullet.damage;
            hitEnemy = true;
            createExplosion(bullet.x, bullet.y, bullet.color, 4);

            // Is enemy dead?
            if (enemy.hp <= 0) {
              // Spawn an XP node drop
              state.xpNodes.push({
                id: Math.random().toString(),
                x: enemy.x,
                y: enemy.y,
                value: enemy.type === 'boss' ? 50 : 15,
                color: enemy.type === 'boss' ? '#F59E0B' : '#67E8F9',
                size: enemy.type === 'boss' ? 5 : 3
              });

              // Explode nicely
              createExplosion(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 24 : 10);
              state.score += enemy.type === 'boss' ? 100 : 15;
              setScore(state.score);
              return false; // Remove enemy
            }
          }
          return true;
        });

        if (hitEnemy) return false; // Remove bullet
        
        // Keep bullet inside game screen boundaries
        return (
          bullet.x > -10 && 
          bullet.x < canvas.width + 10 && 
          bullet.y > -10 && 
          bullet.y < canvas.height + 10
        );
      });

      // 7. Update and Move Enemies towards Player
      state.enemies = state.enemies.filter(enemy => {
        const angle = Math.atan2(state.playerY - enemy.y, state.playerX - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Draw enemy cyber bug shape
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = enemy.color;
        ctx.fillStyle = enemy.color;

        ctx.beginPath();
        if (enemy.type === 'boss') {
          // Heavy octagon boss
          const sides = 8;
          for (let i = 0; i <= sides; i++) {
            const step = (i * 2 * Math.PI) / sides;
            const px = enemy.x + Math.cos(step) * enemy.size;
            const py = enemy.y + Math.sin(step) * enemy.size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        } else if (enemy.type === 'speeder') {
          // Sharp fast triangle bug
          ctx.moveTo(enemy.x + Math.cos(angle) * enemy.size * 1.5, enemy.y + Math.sin(angle) * enemy.size * 1.5);
          ctx.lineTo(enemy.x + Math.cos(angle + 2.3) * enemy.size, enemy.y + Math.sin(angle + 2.3) * enemy.size);
          ctx.lineTo(enemy.x + Math.cos(angle - 2.3) * enemy.size, enemy.y + Math.sin(angle - 2.3) * enemy.size);
        } else {
          // Standard crawler square bug
          ctx.rect(enemy.x - enemy.size, enemy.y - enemy.size, enemy.size * 2, enemy.size * 2);
        }
        ctx.closePath();
        ctx.fill();

        // Draw boss health bar overlay
        if (enemy.type === 'boss' && enemy.hp < enemy.maxHp) {
          const barW = enemy.size * 1.6;
          ctx.fillStyle = '#374151';
          ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.size - 10, barW, 4);
          ctx.fillStyle = '#10B981';
          ctx.fillRect(enemy.x - barW / 2, enemy.y - enemy.size - 10, barW * (enemy.hp / enemy.maxHp), 4);
        }

        ctx.restore();

        // Collision check with player
        const dist = Math.hypot(enemy.x - state.playerX, enemy.y - state.playerY);
        if (dist < state.playerSize + enemy.size) {
          // Player hit! Lose HP
          state.hp = Math.max(0, state.hp - (enemy.type === 'boss' ? 25 : 12));
          setHp(state.hp);
          createExplosion(state.playerX, state.playerY, '#EF4444', 15);
          if (soundEnabled) playSound('hurt');

          if (state.hp <= 0) {
            setIsGameOver(true);
            if (soundEnabled) playSound('gameover');
          }

          return false; // Enemy self-destructs on player touch
        }

        return true;
      });

      // 8. Draw Player Spaceship (VaultShield Core Defender)
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#7342E2';
      ctx.fillStyle = '#7342E2';

      // 360-degree orientation based on motion keys
      let drawAngle = state.orbitAngle;
      if (dx !== 0 || dy !== 0) {
        drawAngle = Math.atan2(dy, dx);
        state.orbitAngle = drawAngle;
      }

      // Draw Spaceship triangular thrust shape
      ctx.translate(state.playerX, state.playerY);
      ctx.rotate(drawAngle);

      // Jet exhaust fire
      if (dx !== 0 || dy !== 0) {
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(-state.playerSize, -4);
        ctx.lineTo(-state.playerSize - 10 - Math.random() * 6, 0);
        ctx.lineTo(-state.playerSize, 4);
        ctx.fill();
      }

      // Core spaceship hull
      ctx.fillStyle = '#7342E2';
      ctx.beginPath();
      ctx.moveTo(state.playerSize * 1.3, 0);
      ctx.lineTo(-state.playerSize, -state.playerSize * 0.8);
      ctx.lineTo(-state.playerSize * 0.4, 0);
      ctx.lineTo(-state.playerSize, state.playerSize * 0.8);
      ctx.closePath();
      ctx.fill();

      // Cockpit shield color
      ctx.fillStyle = '#67E8F9';
      ctx.beginPath();
      ctx.moveTo(state.playerSize * 0.5, 0);
      ctx.lineTo(-state.playerSize * 0.2, -state.playerSize * 0.4);
      ctx.lineTo(-state.playerSize * 0.2, state.playerSize * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 9. Draw Particle explosions
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return p.alpha > 0;
      });

      // 10. Loop
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isPaused, isGameOver, showUpgrades, soundEnabled]);

  // Handle Touch drag movement on Mobile screens smoothly
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused || isGameOver || showUpgrades) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;

    // Direct drag target positioning
    const state = gameRef.current;
    state.playerX = Math.max(state.playerSize, Math.min(canvas.width - state.playerSize, touchX));
    state.playerY = Math.max(state.playerSize, Math.min(canvas.height - state.playerSize, touchY));
  };

  const handleStartGame = () => {
    gameRef.current = {
      playerX: 220,
      playerY: 230,
      playerSpeed: 3.5,
      playerSize: 14,
      enemies: [],
      bullets: [],
      xpNodes: [],
      particles: [],
      keysPressed: {},
      lastShootTime: 0,
      shootCooldown: 500,
      lastSpawnTime: 0,
      spawnCooldown: 1800,
      gameStartTime: Date.now(),
      score: 0,
      level: 1,
      xp: 0,
      xpNeeded: 100,
      hp: 100,
      maxHp: 100,
      secondsPlayed: 0,
      weaponType: 1,
      fireRateLevel: 1,
      speedLevel: 1,
      orbitAngle: 0
    };
    setScore(0);
    setLevel(1);
    setXp(0);
    setXpNeeded(100);
    setHp(100);
    setElapsedTime(0);
    setIsGameOver(false);
    setIsPaused(false);
    setShowUpgrades(false);
    setWeaponLevel(1);
    setFireRateLevel(1);
    setSpeedLevel(1);
    setIsPlaying(true);
    if (soundEnabled) playSound('upgrade');
  };

  // Keep Track of Highscore
  useEffect(() => {
    if (isGameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('bold_survival_highscore', score.toString());
    }
  }, [isGameOver, score, highScore]);

  // Readable timer helper
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#192837] bg-opacity-70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b0f19] text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/50 flex flex-col">
        
        {/* Game Title Bar */}
        <div className="bg-gray-950 px-5 py-4 flex items-center justify-between border-b border-gray-900">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <Flame className="w-5 h-5 animate-pulse text-yellow-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight uppercase text-emerald-400 flex items-center gap-1.5">
                {isMn ? "Болдын Сейф Амьд Үлдэхүй" : "Bold's Safe Cyber Survivor"}
                <span className="text-[9px] bg-emerald-900/40 text-emerald-200 border border-emerald-700 px-1 rounded font-mono">BETA</span>
              </h3>
              <p className="text-[10px] text-gray-400">
                {isMn ? "Бүх зүгээс ирэх вирусийг устгаад амьд үлд! 👾" : "Dodge & blast 360° incoming Trojans! Survive! 👾"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound controls */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 bg-gray-900 hover:bg-red-950 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Stats Bar */}
        <div className="bg-gray-950 px-5 py-2.5 flex items-center justify-between text-xs border-b border-gray-900 font-mono">
          <div className="flex items-center gap-3">
            <span>{isMn ? "ОНОО:" : "SCORE:"} <strong className="text-emerald-400 text-sm font-bold">{score}</strong></span>
            <span>{isMn ? "ТҮВШИН:" : "LV:"} <strong className="text-amber-400 font-bold">{level}</strong></span>
          </div>

          {/* Time Counter */}
          <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-semibold bg-yellow-950/40 border border-yellow-800/30 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>{formatTime(elapsedTime)}</span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            <span>{isMn ? "ДЭЭД:" : "BEST:"} <strong className="text-yellow-500 font-bold">{highScore}</strong></span>
          </div>
        </div>

        {/* Health HP & XP Progress HUD */}
        {isPlaying && !isGameOver && (
          <div className="bg-gray-950 px-5 py-2 flex flex-col gap-1.5 border-b border-gray-900 font-mono">
            {/* HP Bar */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold text-red-400 flex items-center gap-1 shrink-0">
                <Heart className="w-3.5 h-3.5 fill-current" /> {isMn ? "АМЬ:" : "HP:"} {hp}%
              </span>
              <div className="flex-grow h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                <div 
                  className={`h-full transition-all duration-150 ${
                    hp >= 50 ? 'bg-red-500' : 'bg-red-600 animate-pulse'
                  }`}
                  style={{ width: `${hp}%` }}
                />
              </div>
            </div>

            {/* XP progress bar */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5" /> {isMn ? "ТУРШЛАГА:" : "XP:"}
              </span>
              <div className="flex-grow h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
                  style={{ width: `${(xp / xpNeeded) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-400 text-right w-12 shrink-0">
                {xp}/{xpNeeded}
              </span>
            </div>
          </div>
        )}

        {/* Active game Canvas */}
        <div className="relative bg-gray-950 flex justify-center items-center h-[460px] select-none">
          
          <canvas
            ref={canvasRef}
            width={440}
            height={460}
            onTouchMove={handleTouchMove}
            className="w-full h-full max-w-[440px] block cursor-pointer"
          />

          {/* Level UP upgrade selection overlay */}
          {showUpgrades && (
            <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4 z-20">
              <div className="p-3 bg-amber-500/20 rounded-full border border-amber-500/30 text-amber-300 animate-bounce">
                <Award className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-xl font-black text-amber-300 tracking-tight uppercase">
                  {isMn ? "ТҮВШИН АХИЛАА! 🏆" : "LEVEL UP REACHED! 🏆"}
                </h4>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs">
                  {isMn ? "Доорх хэсгээс ашиглах зэвсэг болон хөлгийн сайжруулалтаа сонгоно уу:" : "Choose one critical system patch for your Core Defender:"}
                </p>
              </div>

              <div className="w-full max-w-xs space-y-2 pt-2">
                {upgradeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleSelectUpgrade(opt)}
                    className="w-full text-left p-3.5 rounded-2xl bg-gray-900 hover:bg-[#7342E2]/30 border border-gray-800 hover:border-purple-500/70 transition-all active:scale-98 cursor-pointer flex items-center justify-between"
                  >
                    <div className="text-xs font-bold text-white uppercase">{opt}</div>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start Screen overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 bg-emerald-600/10 rounded-full border border-emerald-500/30 text-emerald-400 animate-pulse">
                <Flame className="w-16 h-16 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400 font-heading tracking-tight uppercase">
                  {isMn ? "CYBER SURVIVOR ТОГЛООМ" : "CYBER SURVIVAL ARENA"}
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mt-1.5 leading-relaxed">
                  {isMn 
                    ? "Удирдлага: Гарны WASD буюу Сумнуудаар 360 зүгт чөлөөтэй шилжинэ. Лазер ойролцоо байгаа вирусийг автоматаар устгана. Цэнхэр кристаллуудыг цуглуулж түвшин ахиарай!" 
                    : "Move freely in 360° using WASD or arrow keys. Your cyber core automatically targets and shoots down malware. Gather glowing cyber gems to level up!"}
                </p>
              </div>

              <button
                onClick={handleStartGame}
                className="bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 hover:scale-105 active:scale-95 text-white font-black text-sm px-10 py-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isMn ? "АЯНД ГАРАХ 🚀" : "ENTER SURVIVAL ARENA 🚀"}</span>
              </button>

              <div className="text-[10px] text-gray-500 font-mono mt-4">
                {isMn ? "🕹️ Гарны товчлуурууд ашиглана • Болдын Сейф" : "🕹️ Keyboard input support • Specially styled for Bold"}
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {isGameOver && (
            <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 bg-red-950/20 rounded-full border border-red-500/30 text-red-500">
                <ShieldAlert className="w-16 h-16 animate-bounce" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-red-500 tracking-tight uppercase">
                  {isMn ? "УСТГАГДЛАА!" : "DIED IN OUTPOST!"}
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mt-1">
                  {isMn ? "Олон тооны Trojan вирусүүд хөлгийг чинь сүйтгэлээ. Хамгаалалтаа улам чангалаарай!" : "Malware overloaded your defenses. Upgrade your weapons earlier next time!"}
                </p>
              </div>

              {score === highScore && score > 0 && (
                <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 animate-pulse">
                  <Star className="w-4 h-4 fill-amber-300" />
                  <span>{isMn ? "СЕЙФИЙН ШИНЭ РЕКОРД! 🏆" : "SURVIVAL HIGH RECORD! 🏆"}</span>
                </div>
              )}

              <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-3 flex gap-8 justify-center items-center">
                <div className="text-center">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">{isMn ? "Авсан оноо" : "Score"}</div>
                  <div className="text-xl font-mono font-black text-emerald-400">{score}</div>
                </div>
                <div className="w-[1px] h-8 bg-gray-800" />
                <div className="text-center">
                  <div className="text-[10px] text-gray-400 uppercase font-mono">{isMn ? "Амьд үлдсэн" : "Time"}</div>
                  <div className="text-xl font-mono font-black text-yellow-400">{formatTime(elapsedTime)}</div>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                className="bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 hover:scale-105 active:scale-95 text-white font-bold text-xs px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>{isMn ? "ДАХИН ТЭМЦЭХ ⚔️" : "RESPAWN CHAMPION ⚔️"}</span>
              </button>
            </div>
          )}

        </div>

        {/* Game Footer Help */}
        <div className="bg-gray-950 px-5 py-3 text-center text-[10px] text-gray-400 border-t border-gray-900 font-mono">
          {isMn 
            ? "⌨️ [WASD] эсвэл [СУМНУУД] - хөдөлнө. Утасгүй үед хуруугаараа чирч хөдөлгөнө үү." 
            : "⌨️ Use WASD or Arrows to fly in 360°. On mobile touch screens, drag directly to steer."}
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, Shield, Heart, Trophy, RefreshCw, X, Play, 
  Volume2, VolumeX, Sparkles, Flame, ShieldAlert, Star, Zap
} from 'lucide-react';
import { LanguageType } from '../types';

interface GamerArcadeProps {
  onClose: () => void;
  language: LanguageType;
}

interface GameObject {
  id: string;
  x: number;
  y: number;
  type: 'weak_pw' | 'virus' | 'diamond' | 'key' | 'shield_token';
  text: string;
  speed: number;
  size: number;
}

interface Bullet {
  id: string;
  x: number;
  y: number;
  speed: number;
}

// Simple browser synth for amazing game sounds
const playSound = (type: 'collect' | 'hit' | 'gameover' | 'levelup' | 'laser') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'collect') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // C6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'levelup') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } else if (type === 'laser') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {
    // Audio context not supported or blocked
  }
};

export default function GamerArcade({ onClose, language }: GamerArcadeProps) {
  const isMn = language === 'mn';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game configuration
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Laser Weapon Systems
  const [shieldPower, setShieldPower] = useState(100);

  // Active game data references for loop
  const gameStateRef = useRef({
    playerX: 200,
    playerWidth: 60,
    playerHeight: 25,
    objects: [] as GameObject[],
    bullets: [] as Bullet[],
    score: 0,
    lives: 3,
    level: 1,
    shieldPower: 100,
    lastSpawnTime: 0,
    lastShootTime: 0,
    speedMultiplier: 1.0,
    particles: [] as { x: number; y: number; vx: number; vy: number; color: string; size: number; alpha: number }[],
    keysPressed: {} as Record<string, boolean>
  });

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('bold_gamer_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  const shootLaser = () => {
    const now = Date.now();
    const state = gameStateRef.current;
    
    // 150ms cooldown for high responsiveness
    if (now - state.lastShootTime < 160) return;
    state.lastShootTime = now;

    // Bullet starts at the middle of player ship
    const bulletX = state.playerX + state.playerWidth / 2;
    const bulletY = 410;

    state.bullets.push({
      id: Math.random().toString(),
      x: bulletX,
      y: bulletY,
      speed: 10
    });

    if (soundEnabled) playSound('laser');
  };

  // Set keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keysPressed[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        shootLaser();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keysPressed[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [soundEnabled, isPlaying, isPaused, isGameOver]);

  const triggerShieldBlast = () => {
    if (!isPlaying || isPaused || isGameOver) return;
    if (gameStateRef.current.shieldPower < 30) return;

    // Use shield power
    gameStateRef.current.shieldPower -= 30;
    setShieldPower(gameStateRef.current.shieldPower);
    if (soundEnabled) playSound('laser');

    // Zap closest incoming threats (viruses and weak passwords)
    const objects = gameStateRef.current.objects;
    gameStateRef.current.objects = objects.filter(obj => {
      const isThreat = obj.type === 'weak_pw' || obj.type === 'virus';
      const distanceY = 400 - obj.y;
      
      // Zap if it is in the range of the shield blast (lower half)
      if (isThreat && distanceY < 200) {
        // Create zap particles
        createExplosion(obj.x, obj.y, '#A855F7', 15);
        gameStateRef.current.score += 15;
        setScore(gameStateRef.current.score);
        return false;
      }
      return true;
    });
  };

  const createExplosion = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5;
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2.5 + Math.random() * 4,
        alpha: 1
      });
    }
  };

  // Main Canvas Render loop
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      // 1. Clear Screen with deep cyber grid space feel
      ctx.fillStyle = '#0B0F19'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 20; i++) {
        const starX = (Math.sin(i * 342) * 0.5 + 0.5) * canvas.width;
        const starY = ((timestamp * 0.05 + i * 25) % canvas.height);
        ctx.fillRect(starX, starY, 1.5, 1.5);
      }

      // Draw horizontal retro scanlines
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      for (let y = 40; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const state = gameStateRef.current;

      // Check key controls for shooting stream
      if (state.keysPressed[' ']) {
        shootLaser();
      }

      // 2. Spawn incoming items
      const now = timestamp;
      const spawnInterval = Math.max(1000 - state.level * 100, 400);
      if (now - state.lastSpawnTime > spawnInterval) {
        state.lastSpawnTime = now;
        
        // Decide item type
        const rand = Math.random();
        let type: GameObject['type'] = 'weak_pw';
        let text = '123456';
        let size = 14;

        if (rand < 0.35) {
          type = 'weak_pw';
          const weakPasswords = ['123456', 'password', 'admin', 'qwerty', 'guest', 'bold123', 'abcd'];
          text = weakPasswords[Math.floor(Math.random() * weakPasswords.length)];
        } else if (rand < 0.65) {
          type = 'virus';
          const malwareNames = ['👾 VIRUS', '🐛 WORM', '💀 HACK', '⚠️ PHISH', '🐴 TROJAN', '🔥 SCAM'];
          text = malwareNames[Math.floor(Math.random() * malwareNames.length)];
        } else if (rand < 0.78) {
          type = 'diamond';
          text = '💎 DIAMOND';
        } else if (rand < 0.9) {
          type = 'shield_token';
          text = '🛡️ BATTERY';
        } else {
          type = 'key';
          text = '🔑 CYPHER';
        }

        state.objects.push({
          id: Math.random().toString(),
          x: 40 + Math.random() * (canvas.width - 80),
          y: -20,
          type,
          text,
          speed: (1.2 + Math.random() * 2.2) * state.speedMultiplier,
          size
        });
      }

      // 3. Move Player (Left/Right)
      const moveSpeed = 7;
      if (state.keysPressed['ArrowLeft'] || state.keysPressed['a']) {
        state.playerX = Math.max(0, state.playerX - moveSpeed);
      }
      if (state.keysPressed['ArrowRight'] || state.keysPressed['d']) {
        state.playerX = Math.min(canvas.width - state.playerWidth, state.playerX + moveSpeed);
      }

      // 4. Update and Draw Bullets
      state.bullets = state.bullets.filter(bullet => {
        bullet.y -= bullet.speed;

        // Draw neon laser bolt
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#C084FC';
        ctx.fillStyle = '#E9D5FF';
        ctx.fillRect(bullet.x - 2, bullet.y, 4, 12);
        ctx.restore();

        // Check if bullet hit any target (threat)
        let hitSomething = false;
        state.objects = state.objects.filter(obj => {
          const isThreat = obj.type === 'weak_pw' || obj.type === 'virus';
          if (!isThreat) return true; // Friendly collectibles can't be shot down!

          const dist = Math.hypot(bullet.x - obj.x, bullet.y - obj.y);
          if (dist < 28) {
            hitSomething = true;
            // Create nice threat explosion!
            createExplosion(obj.x, obj.y, obj.type === 'virus' ? '#EF4444' : '#F59E0B', 14);
            state.score += 10;
            setScore(state.score);
            
            // Re-gain minor shield charge on successful hits!
            state.shieldPower = Math.min(100, state.shieldPower + 2);
            setShieldPower(state.shieldPower);

            if (soundEnabled) playSound('collect');
            
            // Level up trigger
            const nextLevel = Math.floor(state.score / 180) + 1;
            if (nextLevel > state.level) {
              state.level = nextLevel;
              setLevel(state.level);
              state.speedMultiplier += 0.22;
              if (soundEnabled) playSound('levelup');
            }
            return false; // Remove shot target
          }
          return true;
        });

        if (hitSomething) return false; // Remove this bullet
        return bullet.y > -20; // Keep if inside screen
      });

      // 5. Update and Draw Objects (descending threats or goodies)
      state.objects = state.objects.filter((obj) => {
        obj.y += obj.speed;

        // Draw Object
        ctx.save();
        ctx.font = 'bold 12px var(--font-mono)';
        if (obj.type === 'weak_pw') {
          ctx.fillStyle = '#F59E0B'; // Amber alert
          ctx.fillText('⚡ ' + obj.text, obj.x - 25, obj.y);
        } else if (obj.type === 'virus') {
          ctx.fillStyle = '#EF4444'; // Red threat
          ctx.fillText(obj.text, obj.x - 25, obj.y);
        } else if (obj.type === 'diamond') {
          ctx.fillStyle = '#06B6D4'; // Cyan reward
          ctx.fillText(obj.text, obj.x - 25, obj.y);
        } else if (obj.type === 'shield_token') {
          ctx.fillStyle = '#3B82F6'; // Blue power-up
          ctx.fillText(obj.text, obj.x - 25, obj.y);
        } else {
          ctx.fillStyle = '#10B981'; // Green reward
          ctx.fillText(obj.text, obj.x - 25, obj.y);
        }
        ctx.restore();

        // Check Collision with player's ship body
        const playerY = 410;
        const collided = (
          obj.y >= playerY - 15 && 
          obj.y <= playerY + state.playerHeight &&
          obj.x >= state.playerX - 20 &&
          obj.x <= state.playerX + state.playerWidth + 20
        );

        if (collided) {
          if (obj.type === 'weak_pw' || obj.type === 'virus') {
            // Dangerous crash!
            state.lives -= 1;
            setLives(state.lives);
            createExplosion(obj.x, obj.y, '#EF4444', 20);
            if (soundEnabled) playSound('hit');

            if (state.lives <= 0) {
              setIsGameOver(true);
              if (soundEnabled) playSound('gameover');
            }
          } else {
            // Friendly collectable caught by ship!
            let points = 20;
            let particleColor = '#10B981';
            
            if (obj.type === 'diamond') {
              points = 40;
              particleColor = '#06B6D4';
            } else if (obj.type === 'shield_token') {
              state.shieldPower = Math.min(100, state.shieldPower + 35);
              setShieldPower(state.shieldPower);
              particleColor = '#3B82F6';
              points = 10;
            }

            state.score += points;
            setScore(state.score);
            createExplosion(obj.x, obj.y, particleColor, 12);
            if (soundEnabled) playSound('levelup');
          }
          return false; // Remove collected object
        }

        // Out of bounds
        if (obj.y > canvas.height) {
          // If a threat hits the ground unstopped, the player loses shield power
          if (obj.type === 'weak_pw' || obj.type === 'virus') {
            state.shieldPower = Math.max(0, state.shieldPower - 8);
            setShieldPower(state.shieldPower);
          }
          return false;
        }

        return true;
      });

      // 6. Draw Spaceship (VaultShield Cyber Jet)
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#7342E2';

      // Futuristic spacecraft drawing
      const startX = state.playerX;
      const startY = 415;
      const w = state.playerWidth;
      const h = state.playerHeight;

      // Draw engine fire trail
      const flameHeight = 10 + Math.sin(timestamp * 0.08) * 5;
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(startX + w / 2 - 8, startY + h);
      ctx.lineTo(startX + w / 2, startY + h + flameHeight);
      ctx.lineTo(startX + w / 2 + 8, startY + h);
      ctx.fill();

      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(startX + w / 2 - 4, startY + h);
      ctx.lineTo(startX + w / 2, startY + h + flameHeight * 0.6);
      ctx.lineTo(startX + w / 2 + 4, startY + h);
      ctx.fill();

      // Spaceship cockpit
      ctx.fillStyle = '#7342E2';
      ctx.beginPath();
      ctx.moveTo(startX + w / 2, startY - 12); // nose cone
      ctx.lineTo(startX + w, startY + h); // right corner
      ctx.lineTo(startX, startY + h); // left corner
      ctx.closePath();
      ctx.fill();

      // Wing accents
      ctx.fillStyle = '#A855F7';
      ctx.fillRect(startX - 5, startY + h - 10, 8, 12);
      ctx.fillRect(startX + w - 3, startY + h - 10, 8, 12);

      // Energy Shield shell overlay
      ctx.strokeStyle = `rgba(168, 85, 247, ${state.shieldPower / 100})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(startX + w / 2, startY + h / 2 - 5, w * 0.7, Math.PI, 0);
      ctx.stroke();

      ctx.restore();

      // 7. Draw explosion particles
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.024;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return p.alpha > 0;
      });

      // 8. Loop
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isPaused, isGameOver, soundEnabled]);

  // Handle canvas click/tap to shoot lasers easily
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused || isGameOver) return;
    
    // Quick shoot trigger on clicks/taps
    shootLaser();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused || isGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    
    // Update player ship x coordinate smoothly
    const state = gameStateRef.current;
    state.playerX = Math.max(0, Math.min(canvas.width - state.playerWidth, touchX - state.playerWidth / 2));
    
    // Shoot while moving on mobile screen!
    shootLaser();
  };

  const handleStartGame = () => {
    gameStateRef.current = {
      playerX: 190,
      playerWidth: 60,
      playerHeight: 25,
      objects: [],
      bullets: [],
      score: 0,
      lives: 3,
      level: 1,
      shieldPower: 100,
      lastSpawnTime: 0,
      lastShootTime: 0,
      speedMultiplier: 1.0,
      particles: [],
      keysPressed: {}
    };
    setScore(0);
    setLives(3);
    setLevel(1);
    setShieldPower(100);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    if (soundEnabled) playSound('levelup');
  };

  useEffect(() => {
    if (isGameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('bold_gamer_highscore', score.toString());
    }
  }, [isGameOver, score, highScore]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#192837] bg-opacity-70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111827] text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-500/60 flex flex-col">
        
        {/* Game Header */}
        <div className="bg-gray-950 px-5 py-4 flex items-center justify-between border-b border-gray-900">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#7342E2] rounded-lg text-white">
              <Gamepad2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight uppercase text-purple-400 flex items-center gap-1.5">
                {isMn ? "Болдын Буудагч Сейф" : "Bold's Safe Space Shooter"}
                <span className="text-[9px] bg-purple-900/50 text-purple-200 border border-purple-700 px-1 rounded">V2.0</span>
              </h3>
              <p className="text-[10px] text-gray-400">
                {isMn ? "Нууц үг, вирусүүдийг устга! Алмаз цуглуул 🎮" : "Destroy malware & bad passwords! Collect keys! 👾"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-gray-900 hover:bg-red-950 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Stats Bar */}
        <div className="bg-gray-950 px-5 py-2.5 flex items-center justify-between text-xs border-b border-gray-900 font-mono">
          <div className="flex items-center gap-3">
            <span>{isMn ? "ОНОО:" : "SCORE:"} <strong className="text-purple-400 text-sm font-bold">{score}</strong></span>
            <span>{isMn ? "ТҮВШИН:" : "LV:"} <strong className="text-amber-400 font-bold">{level}</strong></span>
          </div>

          {/* Lives indicator */}
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                className={`w-4 h-4 shrink-0 transition-transform ${
                  i < lives ? 'text-red-500 fill-red-500 scale-110' : 'text-gray-700 scale-90'
                }`} 
              />
            ))}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>{isMn ? "ДЭЭД:" : "BEST:"} <strong className="text-yellow-400 font-bold">{highScore}</strong></span>
          </div>
        </div>

        {/* Shield Power Bar */}
        {isPlaying && !isGameOver && (
          <div className="bg-gray-950 px-5 py-2 flex items-center justify-between gap-3 border-b border-gray-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> {isMn ? "БАМБАЙ:" : "SHIELD:"}
            </span>
            <div className="flex-grow h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <div 
                className={`h-full transition-all duration-300 ${
                  shieldPower >= 60 ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-red-500'
                }`}
                style={{ width: `${shieldPower}%` }}
              />
            </div>
            <button
              onClick={triggerShieldBlast}
              disabled={shieldPower < 30}
              className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border transition-all ${
                shieldPower >= 30 
                  ? 'bg-purple-600 hover:bg-purple-500 border-purple-400 text-white cursor-pointer animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]' 
                  : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              {isMn ? "БАМБАЙ ДЭЛБЭЛЭХ (СУМ ДЭЭШ)" : "ZAP BUGS (Up/W)"}
            </button>
          </div>
        )}

        {/* Game Canvas Box */}
        <div className="relative bg-gray-950 flex justify-center items-center h-[460px] select-none">
          
          <canvas
            ref={canvasRef}
            width={440}
            height={460}
            onClick={handleCanvasClick}
            onTouchMove={handleTouchMove}
            className="w-full h-full max-w-[440px] block cursor-crosshair"
          />

          {/* Overlay state screens */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 bg-[#7342E2]/10 rounded-full border border-purple-500/30 text-purple-400 animate-pulse">
                <Gamepad2 className="w-16 h-16" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 font-heading tracking-tight uppercase">
                  {isMn ? "CYBER SHOOTER ТОГЛООМ" : "CYBER SECURITY SHOOTER"}
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mt-1.5 leading-relaxed">
                  {isMn 
                    ? "Зүүн, баруун сум эсвэл А, D үсгээр хөлгөө удирдана. ХОД БАЙГААР лазер буудаж нууц үг, вирусийг устга! Алмаз 💎 цуглуулаарай." 
                    : "Use Arrow keys or touch to steer your ship. Press SPACE or Click/Tap the screen to shoot down security threats and save diamonds!"}
                </p>
              </div>

              <button
                onClick={handleStartGame}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-105 active:scale-95 text-white font-black text-sm px-10 py-4 rounded-full shadow-[0_0_20px_rgba(115,66,226,0.4)] transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isMn ? "ТОГЛОЖ ЭХЛЭХ 🚀" : "LAUNCH SPACE SHIP 🚀"}</span>
              </button>

              <div className="text-[10px] text-gray-500 font-mono mt-4">
                {isMn ? "🕹️ Хоосон зайгаар буудна • Болдын Сейф хамгаалалт" : "🕹️ Spacebar or click to shoot • Bold's Vault Defense"}
              </div>
            </div>
          )}

          {isGameOver && (
            <div className="absolute inset-0 bg-gray-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 bg-red-950/20 rounded-full border border-red-500/30 text-red-500">
                <ShieldAlert className="w-16 h-16 animate-bounce" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-red-500 tracking-tight uppercase">
                  {isMn ? "ТОГЛООМ ДУУСЛАА!" : "MISSION FAILED!"}
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mt-1">
                  {isMn ? "Хөлөг сүйрлээ. Гэхдээ нууц үгээ хүчирхэгжүүлж вирусээс үргэлж сэргийлээрэй!" : "Ship destroyed! Keep playing to improve your cyber defense score!"}
                </p>
              </div>

              {score === highScore && score > 0 && (
                <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 animate-pulse">
                  <Star className="w-4 h-4 fill-amber-300" />
                  <span>{isMn ? "ШИНЭ ДЭЭД ОНОО! 🏆" : "NEW RECORD SET! 🏆"}</span>
                </div>
              )}

              <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-2.5 text-center">
                <div className="text-xs text-gray-400">{isMn ? "Таны авсан оноо" : "Cyber Score Obtained"}</div>
                <div className="text-2xl font-mono font-black text-purple-400">{score}</div>
              </div>

              <button
                onClick={handleStartGame}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:scale-105 active:scale-95 text-white font-bold text-xs px-8 py-3.5 rounded-full transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(115,66,226,0.3)]"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>{isMn ? "ДАХИН ТОГЛОХ ⚔️" : "RESPAWN SHIP ⚔️"}</span>
              </button>
            </div>
          )}

        </div>

        {/* Game Footer */}
        <div className="bg-gray-950 px-5 py-3.5 text-center text-[10px] text-gray-400 border-t border-gray-900 font-mono">
          {isMn 
            ? "⌨️ [A/D] эсвэл [СУМ] - хөдөлнө. [ХОД БАЙ] эсвэл [МАНЬ ХӨРӨНГӨ] - лазер буудна." 
            : "⌨️ Use A/D or Arrow Keys to Move. Press SPACEBAR or Click screen to Shoot lasers!"}
        </div>

      </div>
    </div>
  );
}

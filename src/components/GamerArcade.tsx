import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, Shield, Heart, Trophy, RefreshCw, X, Play, Pause, 
  Volume2, VolumeX, Sparkles, Flame, ShieldAlert, Award, Star
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
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
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

  // Interactive defense power-ups
  const [shieldPower, setShieldPower] = useState(100);

  // Active game data references for loop
  const gameStateRef = useRef({
    playerX: 200,
    playerWidth: 90,
    playerHeight: 14,
    objects: [] as GameObject[],
    score: 0,
    lives: 3,
    level: 1,
    shieldPower: 100,
    lastSpawnTime: 0,
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

  // Set keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keysPressed[e.key] = true;
      if (e.key === ' ' || e.key === 'ArrowUp') {
        // Laser / Shield blast
        triggerShieldBlast();
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
  }, []);

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
      if (isThreat && distanceY < 180) {
        // Create zap particles
        createExplosion(obj.x, obj.y, '#E11D48', 12);
        gameStateRef.current.score += 5;
        setScore(gameStateRef.current.score);
        return false;
      }
      return true;
    });
  };

  const createExplosion = (x: number, y: number, color: string, count = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      gameStateRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 4,
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
      // 1. Clear Screen
      ctx.fillStyle = '#111827'; // Dark cyber theme
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw horizontal reference lines for retro look
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      for (let y = 50; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const state = gameStateRef.current;

      // 2. Spawn incoming items
      const now = timestamp;
      const spawnInterval = Math.max(1200 - state.level * 150, 500);
      if (now - state.lastSpawnTime > spawnInterval) {
        state.lastSpawnTime = now;
        
        // Decide item type
        const rand = Math.random();
        let type: GameObject['type'] = 'weak_pw';
        let text = '123456';
        let size = 14;

        if (rand < 0.3) {
          type = 'weak_pw';
          const weakPasswords = ['password', 'qwerty', 'admin', 'bold123', 'ilovegames', 'abcd', '111111'];
          text = weakPasswords[Math.floor(Math.random() * weakPasswords.length)];
        } else if (rand < 0.6) {
          type = 'virus';
          const malwareNames = ['Malware 👾', 'Worm 🐛', 'Trojan 🐴', 'Hacker 💀', 'Phish 🎣', 'Scam ⚠️'];
          text = malwareNames[Math.floor(Math.random() * malwareNames.length)];
        } else if (rand < 0.75) {
          type = 'diamond';
          text = '💎 DIAMOND';
        } else if (rand < 0.9) {
          type = 'shield_token';
          text = '🛡️ SHIELD';
        } else {
          type = 'key';
          text = '🔑 STRONGER';
        }

        state.objects.push({
          id: Math.random().toString(),
          x: 40 + Math.random() * (canvas.width - 80),
          y: -20,
          type,
          text,
          speed: (1.5 + Math.random() * 2) * state.speedMultiplier,
          size
        });
      }

      // 3. Move Player (Left/Right)
      const moveSpeed = 6;
      if (state.keysPressed['ArrowLeft'] || state.keysPressed['a']) {
        state.playerX = Math.max(0, state.playerX - moveSpeed);
      }
      if (state.keysPressed['ArrowRight'] || state.keysPressed['d']) {
        state.playerX = Math.min(canvas.width - state.playerWidth, state.playerX + moveSpeed);
      }

      // 4. Update and Draw Objects
      state.objects = state.objects.filter((obj) => {
        obj.y += obj.speed;

        // Draw Object
        ctx.save();
        if (obj.type === 'weak_pw') {
          ctx.fillStyle = '#EF4444'; // Red threat
          ctx.font = 'bold 11px var(--font-body)';
          ctx.fillText('❌ ' + obj.text, obj.x - 20, obj.y);
        } else if (obj.type === 'virus') {
          ctx.fillStyle = '#F43F5E'; // Crimson threat
          ctx.font = 'bold 12px var(--font-body)';
          ctx.fillText(obj.text, obj.x - 20, obj.y);
        } else if (obj.type === 'diamond') {
          ctx.fillStyle = '#06B6D4'; // Cyan reward
          ctx.font = 'bold 12px var(--font-body)';
          ctx.fillText(obj.text, obj.x - 20, obj.y);
        } else if (obj.type === 'shield_token') {
          ctx.fillStyle = '#3B82F6'; // Blue power-up
          ctx.font = 'bold 12px var(--font-body)';
          ctx.fillText(obj.text, obj.x - 20, obj.y);
        } else {
          ctx.fillStyle = '#10B981'; // Green reward
          ctx.font = 'bold 12px var(--font-body)';
          ctx.fillText(obj.text, obj.x - 20, obj.y);
        }
        ctx.restore();

        // Check Collision with player shield bar (at y=430)
        const playerY = 430;
        const collided = (
          obj.y >= playerY - 10 && 
          obj.y <= playerY + state.playerHeight &&
          obj.x >= state.playerX - 20 &&
          obj.x <= state.playerX + state.playerWidth + 10
        );

        if (collided) {
          if (obj.type === 'weak_pw' || obj.type === 'virus') {
            // Hit! Loose life
            state.lives -= 1;
            setLives(state.lives);
            createExplosion(obj.x, obj.y, '#F43F5E', 15);
            if (soundEnabled) playSound('hit');

            if (state.lives <= 0) {
              setIsGameOver(true);
              if (soundEnabled) playSound('gameover');
            }
          } else {
            // Collected positive item
            let points = 10;
            let particleColor = '#10B981';
            
            if (obj.type === 'diamond') {
              points = 25;
              particleColor = '#06B6D4';
              // Reward custom message
            } else if (obj.type === 'shield_token') {
              state.shieldPower = Math.min(100, state.shieldPower + 40);
              setShieldPower(state.shieldPower);
              particleColor = '#3B82F6';
            }

            state.score += points;
            setScore(state.score);
            createExplosion(obj.x, obj.y, particleColor, 12);
            if (soundEnabled) playSound('collect');

            // Level Up criteria
            const nextLevel = Math.floor(state.score / 150) + 1;
            if (nextLevel > state.level) {
              state.level = nextLevel;
              setLevel(state.level);
              state.speedMultiplier += 0.2;
              if (soundEnabled) playSound('levelup');
            }
          }
          return false; // Remove object
        }

        // Out of bounds (uncollected)
        if (obj.y > canvas.height) {
          // If a threat reaches the bottom undetected, lose shield power
          if (obj.type === 'weak_pw' || obj.type === 'virus') {
            state.shieldPower = Math.max(0, state.shieldPower - 10);
            setShieldPower(state.shieldPower);
          }
          return false; // Remove
        }

        return true;
      });

      // 5. Draw Player Shield
      ctx.save();
      const grad = ctx.createLinearGradient(state.playerX, 0, state.playerX + state.playerWidth, 0);
      grad.addColorStop(0, '#7342E2');
      grad.addColorStop(0.5, '#A855F7');
      grad.addColorStop(1, '#6366F1');

      ctx.fillStyle = grad;
      // Rounded corner box for player shield
      ctx.beginPath();
      ctx.roundRect(state.playerX, 430, state.playerWidth, state.playerHeight, 8);
      ctx.fill();

      // Shield active electric effect glow
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Shield icon indicator centered on paddle
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '9px var(--font-body)';
      ctx.fillText('SHIELD-9', state.playerX + 22, 441);
      ctx.restore();

      // 6. Draw particles explosion
      state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return p.alpha > 0;
      });

      // 7. Request Next Frame
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, isPaused, isGameOver, soundEnabled]);

  // Touch handlers for mobile players
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isPlaying || isPaused || isGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchX = touch.clientX - rect.left;
    
    // Set player position bounded
    const state = gameStateRef.current;
    state.playerX = Math.max(0, Math.min(canvas.width - state.playerWidth, touchX - state.playerWidth / 2));
  };

  const handleStartGame = () => {
    gameStateRef.current = {
      playerX: 200,
      playerWidth: 95,
      playerHeight: 14,
      objects: [],
      score: 0,
      lives: 3,
      level: 1,
      shieldPower: 100,
      lastSpawnTime: 0,
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

  // Save new high score if game over
  useEffect(() => {
    if (isGameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('bold_gamer_highscore', score.toString());
    }
  }, [isGameOver, score, highScore]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#192837] bg-opacity-70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1F2937] text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-500/50 flex flex-col">
        
        {/* Game Title Bar */}
        <div className="bg-gray-900 px-5 py-4 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#7342E2] rounded-lg text-white">
              <Gamepad2 className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight uppercase text-purple-300">
                {isMn ? "Болдын Сейф хамгаалагч" : "Bold's Safe Arcade"}
              </h3>
              <p className="text-[10px] text-gray-400">
                {isMn ? "Вируснаас хамгаалж, алмаз цуглуулаарай! 🎮" : "Zap weak passwords, grab diamonds! 👾"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound controls */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              title="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-1.5 bg-gray-800 hover:bg-red-900 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info Stats Bar */}
        <div className="bg-gray-900/50 px-5 py-2.5 flex items-center justify-between text-xs border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-400">{isMn ? "Оноо:" : "Score:"} <strong className="text-purple-400 font-mono text-sm">{score}</strong></span>
            <span className="font-semibold text-gray-400">{isMn ? "Түвшин:" : "Lv:"} <strong className="text-amber-400 font-mono">{level}</strong></span>
          </div>

          {/* Lives indicator */}
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart 
                key={i} 
                className={`w-4 h-4 shrink-0 transition-transform ${
                  i < lives ? 'text-red-500 fill-red-500 scale-100' : 'text-gray-600 scale-90'
                }`} 
              />
            ))}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-400">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>{isMn ? "Дээд:" : "Best:"} <strong className="text-yellow-400 font-mono">{highScore}</strong></span>
          </div>
        </div>

        {/* Shield Power Bar */}
        {isPlaying && !isGameOver && (
          <div className="bg-gray-950 px-5 py-1.5 flex items-center justify-between gap-3 border-b border-gray-900">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <Shield className="w-3 h-3" /> {isMn ? "Бамбай цэнэг:" : "Shield charge:"}
            </span>
            <div className="flex-grow h-2 bg-gray-800 rounded-full overflow-hidden">
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
              className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                shieldPower >= 30 
                  ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer animate-pulse' 
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isMn ? "Дэлбэлэх (Хоосон зай)" : "Blast (Space)"}
            </button>
          </div>
        )}

        {/* Game Canvas Box */}
        <div className="relative bg-gray-950 flex justify-center items-center h-[460px] select-none">
          
          <canvas
            ref={canvasRef}
            width={440}
            height={460}
            onTouchMove={handleTouchMove}
            className="w-full h-full max-w-[440px] block cursor-none"
          />

          {/* Overlay state screens */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-gray-950/90 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 bg-[#7342E2]/10 rounded-full border border-[#7342E2]/30 text-purple-400 animate-pulse">
                <Gamepad2 className="w-16 h-16" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white font-heading tracking-tight uppercase">
                  {isMn ? "СЕЙФ ХАМГААЛАГЧ ТОГЛООМ" : "PASSWORD DEFENDER"}
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mt-1.5 leading-relaxed">
                  {isMn 
                    ? "Зүүн, баруун сумаар бамбайг удирдаж, нууц үг, вирусүүдийг хаагаарай. Алмаз 💎 цуглуулж оноо аваарай!" 
                    : "Use Arrow keys or touch screen to move your shield bar. Block weak passwords/malware, collect diamonds!"}
                </p>
              </div>

              <button
                onClick={handleStartGame}
                className="bg-[#7342E2] hover:bg-opacity-90 hover:scale-105 active:scale-95 text-white font-extrabold text-sm px-8 py-3.5 rounded-full shadow-lg transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isMn ? "Тоглож эхлэх 🚀" : "Start Game Now 🚀"}</span>
              </button>

              <div className="text-[10px] text-gray-500 font-mono mt-4">
                {isMn ? "👤 Болдод зориулсан 9 түвшний хамгаалалт" : "👤 Specially personalized for Bold"}
              </div>
            </div>
          )}

          {isGameOver && (
            <div className="absolute inset-0 bg-gray-950/90 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 bg-red-900/20 rounded-full border border-red-500/30 text-red-500">
                <ShieldAlert className="w-16 h-16 animate-bounce" />
              </div>
              <div>
                <h4 className="text-2xl font-black text-red-500 tracking-tight uppercase">
                  {isMn ? "Тоглоом дууслаа!" : "GAME OVER!"}
                </h4>
                <p className="text-xs text-gray-400 max-w-xs mt-1">
                  {isMn ? "Бамбай эвдэрлээ. Гэхдээ нууц үгээ хүчтэй болгосноор чи ялагдашгүй болно!" : "Your shield got broken! Improve your real game passwords to win next time!"}
                </p>
              </div>

              {score === highScore && score > 0 && (
                <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 animate-pulse">
                  <Star className="w-4 h-4 fill-amber-300" />
                  <span>{isMn ? "ШИНЭ ДЭЭД ОНОО! 🏆" : "NEW HIGH SCORE! 🏆"}</span>
                </div>
              )}

              <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-2.5 text-center">
                <div className="text-xs text-gray-400">{isMn ? "Чиний авсан оноо" : "Final Score"}</div>
                <div className="text-2xl font-mono font-black text-purple-400">{score}</div>
              </div>

              <button
                onClick={handleStartGame}
                className="bg-[#7342E2] hover:bg-opacity-90 hover:scale-105 active:scale-95 text-white font-bold text-xs px-6 py-3 rounded-full transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isMn ? "Дахин тоглох ⚔️" : "Play Again ⚔️"}</span>
              </button>
            </div>
          )}

        </div>

        {/* Help controls footer */}
        <div className="bg-gray-900 px-5 py-3 text-center text-[10px] text-gray-500 border-t border-gray-800">
          {isMn 
            ? "⌨️ Гарны зүүн, баруун сум эсвэл А, D үсгээр удирдана уу. Хоосон зайгаар дэлбэлнэ." 
            : "⌨️ Use Left/Right Arrow keys or A/D to move. Press Space to blast threats."}
        </div>

      </div>
    </div>
  );
}

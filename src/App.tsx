import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRightCircle, Zap, LockKeyhole, Fingerprint, 
  Menu, X, Gamepad2, ShieldCheck, Trophy, Sparkles, AlertCircle, Radio, Flame
} from 'lucide-react';
import GamerVault from './components/GamerVault';
import GamerArcade from './components/GamerArcade';
import GamerRadio from './components/GamerRadio';
import GamerSurvival from './components/GamerSurvival';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gamerVaultOpen, setGamerVaultOpen] = useState(false);
  const [gamerArcadeOpen, setGamerArcadeOpen] = useState(false);
  const [gamerRadioOpen, setGamerRadioOpen] = useState(false);
  const [gamerSurvivalOpen, setGamerSurvivalOpen] = useState(false);
  const [hoverGamerBadge, setHoverGamerBadge] = useState(false);

  // Staggered fadeUp animation for hero elements
  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { 
        delay: i * 0.15, 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1] 
      }
    })
  };

  return (
    <div id="vaultshield-root" className="relative w-full min-h-screen text-[#192837] overflow-x-hidden select-none" style={{ fontFamily: 'var(--font-body)' }}>
      
      {/* 1. Full-screen Background Video with Ambient Soft Backdrop-Blur and High-Contrast Overlay */}
      <div className="absolute inset-0 -z-20 overflow-hidden bg-[#F2F2EE]">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4"
        />
        {/* Overlay for readability matching the Frosted Glass theme */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
      </div>

      {/* 2. Responsive Premium Navbar */}
      <nav id="navbar" className="relative z-30 max-w-[1280px] mx-auto px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
        
        {/* Left: Custom SVG Logo */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2 group focus:outline-none" aria-label="VaultShield Home">
            <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" overflow="visible" viewBox="0 0 256 256">
                <path d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z" fill="#192837"/>
              </svg>
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-[#192837]">
              VaultShield
            </span>
          </a>

          {/* Bold's Active Gamer Profile Pulse Badge - Integrated to fulfill Bold's info */}
          <div 
            onClick={() => setGamerVaultOpen(true)}
            onMouseEnter={() => setHoverGamerBadge(true)}
            onMouseLeave={() => setHoverGamerBadge(false)}
            className="hidden sm:flex items-center gap-1.5 ml-4 bg-[#7342E2]/10 hover:bg-[#7342E2]/20 border border-[#7342E2]/20 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#7342E2] cursor-pointer transition-all active:scale-95 relative"
            title="Bold's Safe Gaming Vault"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7342E2]"></span>
            </span>
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Болд (9 настай) Сейф</span>
            
            <AnimatePresence>
              {hoverGamerBadge && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute left-0 top-8 bg-[#192837] text-white text-[10px] p-2.5 rounded-xl w-48 shadow-lg border border-purple-500 z-50 pointer-events-none"
                >
                  <div className="font-bold flex items-center gap-1 text-purple-300">
                    <Trophy className="w-3 h-3" /> Тоглоомын Сейф Идэвхтэй
                  </div>
                  <p className="font-light text-gray-300 mt-0.5 leading-snug">Сайн уу Болд! Тоглоомын нууц үгнүүдээ энд хадгалаарай.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Desktop Action CTAs - Fully functional */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => setGamerRadioOpen(true)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-white/80 backdrop-blur-md border border-[#CFC8C5] hover:border-cyan-500 hover:bg-white text-[#192837] transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span>Хөгжмийн булан 🎵</span>
          </button>

          <button
            onClick={() => setGamerVaultOpen(true)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-white/80 backdrop-blur-md border border-[#CFC8C5] hover:border-[#7342E2] hover:bg-white text-[#192837] transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span>Миний Сейф 🔐</span>
          </button>
          
          <button
            onClick={() => setGamerArcadeOpen(true)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#7342E2] hover:bg-opacity-95 hover:shadow-lg text-white transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5"
            style={{ boxShadow: '0 4px 14px rgba(115,66,226,0.25)' }}
          >
            <span>Буудагч 🎮</span>
          </button>

          <button
            onClick={() => setGamerSurvivalOpen(true)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#10B981] hover:bg-opacity-95 hover:shadow-lg text-white transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5"
            style={{ boxShadow: '0 4px 14px rgba(16,185,129,0.25)' }}
          >
            <span>Амьд үлдэх ⚔️</span>
          </button>
        </div>

        {/* Mobile: Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Quick gaming badge for mobile too */}
          <button 
            onClick={() => setGamerVaultOpen(true)}
            className="p-1.5 bg-[#7342E2]/10 text-[#7342E2] rounded-full active:scale-90"
            aria-label="Bold's Gamer Safe"
          >
            <Gamepad2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-[#192837] hover:bg-white/50 rounded-lg transition-colors focus:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

      </nav>

      {/* 3. Hero Content Block */}
      <main className="relative z-10 max-w-[1280px] mx-auto px-5 sm:px-8 flex flex-col justify-center min-h-[calc(100vh-80px)]">
        
        <div className="max-w-[620px] flex flex-col justify-center" style={{ paddingTop: 'clamp(40px, 8vw, 72px)', paddingBottom: '40px' }}>
          
          {/* Bold's Welcome Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onClick={() => setGamerVaultOpen(true)}
            className="mb-6 inline-flex items-center gap-2 bg-[#7342E2]/10 border border-[#7342E2]/30 px-3.5 py-2 rounded-2xl cursor-pointer hover:bg-[#7342E2]/15 transition-all text-xs font-semibold text-[#7342E2] w-fit active:scale-95 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-600 animate-spin-slow" />
            <span>
              Сайн уу, Болд! (9 настай) Сейф рүү орох бол энд дар 🎮
            </span>
            <ArrowRightCircle className="w-3.5 h-3.5 text-[#7342E2]" />
          </motion.div>

          {/* Hero Heading with custom fonts and inline Lucide icons */}
          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-[#192837] font-bold leading-[1.05] tracking-[-0.01em] mb-6"
            style={{ 
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.65rem, 5vw, 3rem)'
            }}
          >
            <Zap className="inline-block align-middle mr-1 -mt-1 w-6 h-6 text-[#192837]" strokeWidth={2.5} />
            Болдын тоглоомын ертөнцийг 
            <LockKeyhole className="inline-block align-middle mx-1 -mt-1 w-6 h-6 text-[#192837]" strokeWidth={2.5} />
            төмөр мэт хамгаална
            <Fingerprint className="inline-block align-middle ml-1 -mt-1 w-6 h-6 text-[#192837]" strokeWidth={2.5} />
          </motion.h1>

          {/* Hero Subtext */}
          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-base text-[#192837] opacity-80 leading-[1.65] mb-8 font-light"
            style={{ 
              fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)'
            }}
          >
            9 настай Болд шиг мундаг тоглогчдод зориулсан Zero stress хамгаалалт. Тоглоомын бүх данс, нууц үг, рекорд амжилтуудаа VaultShield-ээр найдвартай хадгалж, зөвхөн тоглоомондоо анхаарлаа хандуулаарай.
          </motion.p>

          {/* Primary CTA Button with dual choices: Game or Safe */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-4 items-center"
          >
            <motion.button
              onClick={() => setGamerArcadeOpen(true)}
              whileHover={{ scale: 1.04, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.96 }}
              className="bg-[#7342E2] text-white flex items-center justify-between font-semibold tracking-tight transition-all cursor-pointer"
              style={{
                borderRadius: '50px',
                padding: '17px 32px',
                fontSize: 'clamp(0.95rem, 2vw, 1.125rem)',
                boxShadow: '0 4px 24px rgba(115,66,226,0.28)',
                minWidth: '220px',
                gap: '24px'
              }}
            >
              <span>Тоглож эхлэх 🎮</span>
              <ArrowRightCircle className="w-5 h-5 text-white shrink-0 animate-pulse" />
            </motion.button>

            <motion.button
              onClick={() => setGamerVaultOpen(true)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="bg-white/80 backdrop-blur-md text-[#192837] border border-[#CFC8C5] hover:bg-white flex items-center justify-between font-semibold tracking-tight transition-all cursor-pointer"
              style={{
                borderRadius: '50px',
                padding: '17px 32px',
                fontSize: 'clamp(0.95rem, 2vw, 1.125rem)',
                minWidth: '220px',
                gap: '24px'
              }}
            >
              <span>Миний Сейф 🔐</span>
              <ShieldCheck className="w-5 h-5 text-[#7342E2] shrink-0" />
            </motion.button>
          </motion.div>

          {/* Game details mini status strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex items-center gap-2 text-xs font-medium text-gray-500"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Монгол тоглоомын аюулгүй байдал идэвхтэй байна.</span>
          </motion.div>

        </div>

      </main>

      {/* Aesthetic Frosted Glass element from theme */}
      <div className="absolute bottom-8 right-8 z-10 hidden sm:flex flex-col items-end">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          onClick={() => setGamerVaultOpen(true)}
          className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg cursor-pointer hover:bg-white/50 transition-all active:scale-95"
        >
          <div className="text-[10px] uppercase tracking-widest font-bold opacity-60 mb-1">Pro Gamer Status</div>
          <div className="text-sm font-bold text-[#192837]">Bold • Level 9</div>
        </motion.div>
      </div>

      {/* 4. Mobile Menu Sheet (AnimatePresence + Framer Motion) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-[#192837]/35 backdrop-blur-[4px]"
            />

            {/* Slide-out Sheet */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
              className="fixed right-0 top-0 z-50 h-[100dvh] bg-[#CFC8C5] flex flex-col justify-between p-6 shadow-2xl"
              style={{ width: 'min(88vw, 360px)', boxShadow: '-12px 0 48px rgba(25,40,55,0.18)' }}
            >
              <div>
                {/* Sheet Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 256 256">
                      <path d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z" fill="#192837"/>
                    </svg>
                    <span className="font-heading font-extrabold text-lg text-[#192837]">
                      VaultShield
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 hover:bg-white/30 rounded-lg transition-colors text-[#192837] focus:outline-none"
                    aria-label="Close navigation menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* 1px Divider */}
                <div className="h-[1px] bg-[#192837]/10 mb-6" />

                {/* Staggered Nav Links */}
                <div className="flex flex-col gap-6">
                  {/* Special Mobile Gaming Safe link */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setGamerVaultOpen(true);
                    }}
                    className="flex items-center gap-3 text-xl font-extrabold text-[#7342E2] text-left hover:opacity-80 transition-opacity"
                  >
                    <ShieldCheck className="w-6 h-6" />
                    <span>Болдын Сейф 🔐</span>
                  </motion.button>

                  {/* Special Mobile Game link */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.22, duration: 0.3 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setGamerArcadeOpen(true);
                    }}
                    className="flex items-center gap-3 text-xl font-extrabold text-[#A855F7] text-left hover:opacity-80 transition-opacity"
                  >
                    <Gamepad2 className="w-6 h-6 animate-pulse" />
                    <span>Буудагч 🎮</span>
                  </motion.button>

                  {/* Special Mobile Survival link */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.26, duration: 0.3 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setGamerSurvivalOpen(true);
                    }}
                    className="flex items-center gap-3 text-xl font-extrabold text-[#10B981] text-left hover:opacity-80 transition-opacity"
                  >
                    <Flame className="w-6 h-6 animate-pulse text-yellow-500" />
                    <span>Амьд үлдэх ⚔️</span>
                  </motion.button>

                  {/* Special Mobile Radio link */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.29, duration: 0.3 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setGamerRadioOpen(true);
                    }}
                    className="flex items-center gap-3 text-xl font-extrabold text-cyan-500 text-left hover:opacity-80 transition-opacity"
                  >
                    <Radio className="w-6 h-6 animate-pulse" />
                    <span>Хөгжмийн булан 🎵</span>
                  </motion.button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 5. Custom Gamer Dashboard Modal for Bold */}
      <AnimatePresence>
        {gamerVaultOpen && (
          <GamerVault onClose={() => setGamerVaultOpen(false)} />
        )}
      </AnimatePresence>

      {/* 6. Custom Interactive Cyber Game Modal for Bold */}
      <AnimatePresence>
        {gamerArcadeOpen && (
          <GamerArcade onClose={() => setGamerArcadeOpen(false)} language="mn" />
        )}
      </AnimatePresence>

      {/* 7. Custom Gamer Music Player / Synthesizer for Bold */}
      <AnimatePresence>
        {gamerRadioOpen && (
          <GamerRadio onClose={() => setGamerRadioOpen(false)} language="mn" />
        )}
      </AnimatePresence>

      {/* 8. Custom Interactive Survival Game Modal for Bold */}
      <AnimatePresence>
        {gamerSurvivalOpen && (
          <GamerSurvival onClose={() => setGamerSurvivalOpen(false)} language="mn" />
        )}
      </AnimatePresence>

    </div>
  );
}

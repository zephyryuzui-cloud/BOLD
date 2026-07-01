import React, { useState } from 'react';
import { Copy, Check, Sparkles, RefreshCw } from 'lucide-react';
import { LanguageType } from '../types';

interface PasswordGeneratorProps {
  onSelectPassword: (pw: string) => void;
  language: LanguageType;
}

export default function PasswordGenerator({ onSelectPassword, language }: PasswordGeneratorProps) {
  const isMn = language === 'mn';
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState('');
  const [mode, setMode] = useState<'minecraft' | 'roblox' | 'fortnite' | 'random'>('minecraft');

  const gameWords = {
    minecraft: ['Steve', 'Alex', 'Creeper', 'Diamond', 'Netherite', 'Minecart', 'Ender', 'Craft', 'Obby', 'Portal'],
    roblox: ['AdoptMe', 'Bloxburg', 'Royale', 'BuildABoat', 'Robux', 'BaconHair', 'Noob', 'Obby', 'Tycoon'],
    fortnite: ['Jonesy', 'Victory', 'Royale', 'ChugJug', 'Llama', 'VBucks', 'Build', 'Sniper', 'BattleBus']
  };

  const symbols = ['!', '@', '#', '$', '%', '&', '*', '?'];

  const handleGenerate = () => {
    let base = '';
    if (mode === 'random') {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
      for (let i = 0; i < 14; i++) {
        base += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } else {
      const words = gameWords[mode];
      const w1 = words[Math.floor(Math.random() * words.length)];
      const w2 = words[Math.floor(Math.random() * words.length)];
      const num = Math.floor(100 + Math.random() * 899);
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const sym2 = symbols[Math.floor(Math.random() * symbols.length)];
      
      // Capitalize first letters and mix
      base = `${sym}${w1}${sym2}${w2}${num}`;
    }
    setGenerated(base);
    onSelectPassword(base);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#EBEAE4] mt-2 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#7342E2]" />
        <h4 className="font-semibold text-xs text-[#192837] tracking-tight uppercase">
          {isMn ? "Тоглоомын нууц үг үүсгэгч" : "Gamer Password Generator"}
        </h4>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        {(['minecraft', 'roblox', 'fortnite', 'random'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-[10px] font-medium py-1.5 px-1 rounded-lg border transition-all capitalize ${
              mode === m
                ? 'bg-[#7342E2] text-white border-[#7342E2] shadow-sm'
                : 'bg-white text-[#192837] border-[#EBEAE4] hover:bg-gray-50'
            }`}
          >
            {m === 'random' ? (isMn ? 'Санамсаргүй' : 'Super Random') : m}
          </button>
        ))}
      </div>

      {/* Generated Output */}
      <div className="flex gap-2 items-center">
        <div className="bg-white border border-[#EBEAE4] rounded-lg px-3 py-2 flex-grow font-mono text-sm h-10 flex items-center justify-between overflow-x-auto text-[#192837] tracking-wide select-all">
          {generated || (isMn ? "Үүсгэх товчийг дарна уу..." : "Press generate...")}
        </div>
        
        <button
          onClick={handleGenerate}
          title="Generate"
          className="p-2 bg-[#F2F2EE] hover:bg-[#EBEAE4] text-[#192837] rounded-lg border border-[#EBEAE4] transition-colors active:scale-95 shrink-0 h-10 w-10 flex items-center justify-center"
        >
          <RefreshCw className="w-4 h-4 animate-hover-spin" />
        </button>

        <button
          onClick={handleCopy}
          disabled={!generated}
          className={`p-2 rounded-lg border transition-colors shrink-0 h-10 w-10 flex items-center justify-center ${
            copied
              ? 'bg-green-100 border-green-300 text-green-700'
              : 'bg-white hover:bg-gray-50 border-[#EBEAE4] text-[#192837] disabled:opacity-50'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {generated && (
        <div className="text-[10px] text-green-600 mt-1.5 font-medium flex items-center gap-1">
          ✓ {isMn ? "Энэ нууц үгийг ашиглахад бэлэн боллоо!" : "Gamer password generated successfully!"}
        </div>
      )}
    </div>
  );
}

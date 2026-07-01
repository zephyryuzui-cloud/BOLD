import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Swords, Trophy } from 'lucide-react';
import { LanguageType } from '../types';

interface PasswordStrengthTesterProps {
  password: string;
  language: LanguageType;
}

export function evaluateStrength(pw: string): 'weak' | 'medium' | 'strong' | 'legendary' {
  if (!pw) return 'weak';
  
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return 'weak';
  if (score === 2) return 'medium';
  if (score === 3 || score === 4) return 'strong';
  return 'legendary';
}

export default function PasswordStrengthTester({ password, language }: PasswordStrengthTesterProps) {
  const isMn = language === 'mn';
  const strength = evaluateStrength(password);

  const config = {
    weak: {
      label: isMn ? "Модон бамбай (Сул)" : "Wooden Shield (Weak)",
      desc: isMn ? "Аймшигтай мангасуудаас хамгаалж чадахгүй!" : "Zombies and Slimes can easily break this!",
      color: "bg-red-500",
      textColor: "text-red-600",
      bgColor: "bg-red-50",
      icon: ShieldAlert,
    },
    medium: {
      label: isMn ? "Төмөр илд (Дундаж)" : "Iron Sword (Medium)",
      desc: isMn ? "Энгийн хамгаалалтанд ашиглаж болно." : "Ready for basic defense, but you can do better!",
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
      icon: Swords,
    },
    strong: {
      label: isMn ? "Алмазан хуяг (Хүчтэй)" : "Diamond Armor (Strong)",
      desc: isMn ? "Лууны галаас ч хамгаалж чадна!" : "Ender Dragon proof! Extremely secure.",
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
      icon: ShieldCheck,
    },
    legendary: {
      label: isMn ? "Недерит цайз (Мэргэжлийн)" : "Netherite Citadel (Legendary)",
      desc: isMn ? "Ямар ч хакер нэвтэрч чадахгүй төгс хамгаалалт!" : "Completely hacker-proof! Ultimate gaming fortress.",
      color: "bg-purple-600 animate-pulse",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
      icon: Trophy,
    }
  };

  const current = config[strength];
  const Icon = current.icon;

  return (
    <div className="mt-3 p-3.5 rounded-xl border border-[#EBEAE4] bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[#192837] opacity-80">
          {isMn ? "Бамбайн түвшин:" : "Shield Security Level:"}
        </span>
        <div className="flex items-center gap-1.5">
          <Icon className={`w-4 h-4 ${current.textColor}`} />
          <span className={`text-xs font-bold ${current.textColor}`}>{current.label}</span>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-4 gap-1.5 my-2">
        <div className={`h-1.5 rounded-full ${password ? (strength === 'weak' ? 'bg-red-500' : strength === 'medium' ? 'bg-amber-500' : strength === 'strong' ? 'bg-green-500' : 'bg-purple-500') : 'bg-gray-200'}`} />
        <div className={`h-1.5 rounded-full ${password && strength !== 'weak' ? (strength === 'medium' ? 'bg-amber-500' : strength === 'strong' ? 'bg-green-500' : 'bg-purple-500') : 'bg-gray-200'}`} />
        <div className={`h-1.5 rounded-full ${password && (strength === 'strong' || strength === 'legendary') ? (strength === 'strong' ? 'bg-green-500' : 'bg-purple-500') : 'bg-gray-200'}`} />
        <div className={`h-1.5 rounded-full ${password && strength === 'legendary' ? 'bg-purple-500' : 'bg-gray-200'}`} />
      </div>

      <p className="text-[11px] text-gray-500 leading-snug">
        {password ? current.desc : (isMn ? "Аюулгүй байдлын үнэлгээг харахын тулд нууц үг оруулна уу." : "Type a password to test your defense.")}
      </p>
    </div>
  );
}

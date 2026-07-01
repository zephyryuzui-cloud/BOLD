import React from 'react';
import { ShieldCheck, Flame, Trophy, Sparkles } from 'lucide-react';
import { LanguageType } from '../types';

interface GamerTipsProps {
  language: LanguageType;
}

export default function GamerTips({ language }: GamerTipsProps) {
  const isMn = language === 'mn';

  const tips = isMn
    ? [
        {
          title: "Тоглоомын аюулгүй байдал",
          desc: "Нууц үгээ хэзээ ч хэнд ч, тэр байтугай хамгийн сайн найздаа ч битгий хэлээрэй! Энэ бол чиний хувийн цайз юм.",
          icon: ShieldCheck,
          color: "text-green-500 bg-green-50"
        },
        {
          title: "Хүчтэй Нууц Үг Үүсгэх",
          desc: "Том жижиг үсэг, тоо болон тэмдэгтүүдийг хамт оруулж нууц үгээ хакердуулахааргүй хүчирхэг болгоорой.",
          icon: Flame,
          color: "text-amber-500 bg-amber-50"
        },
        {
          title: "Тоглоомоо хамгаалах",
          desc: "Хэрэв хэн нэгэн чиний нууц үгийг мэдчихсэн байж магадгүй гэж бодвол шууд шинээр сольж байгаарай!",
          icon: Trophy,
          color: "text-purple-500 bg-purple-50"
        }
      ]
    : [
        {
          title: "Keep it Secret",
          desc: "Never share your password with anyone, not even your best friends! It is your personal gaming fortress.",
          icon: ShieldCheck,
          color: "text-green-500 bg-green-50 bg-opacity-80"
        },
        {
          title: "Unbeatable Passwords",
          desc: "Mix uppercase letters, lowercase letters, numbers, and symbols like # or ! to make your password hacker-proof.",
          icon: Flame,
          color: "text-amber-500 bg-amber-50 bg-opacity-80"
        },
        {
          title: "Reset Regularly",
          desc: "If you think someone saw your password, change it right away to keep your gaming achievements safe!",
          icon: Trophy,
          color: "text-purple-500 bg-purple-50 bg-opacity-80"
        }
      ];

  return (
    <div className="bg-[#FAF9F5] rounded-2xl p-6 border border-[#EBEAE4] shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 height-5 text-purple-600 animate-pulse" />
        <h3 className="font-semibold text-lg text-[#192837] tracking-tight">
          {isMn ? "🎮 Болдын аюулгүй байдлын зөвлөгөө" : "🎮 Bold's Security Advice"}
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tips.map((tip, index) => {
          const Icon = tip.icon;
          return (
            <div key={index} className="flex gap-3 bg-white p-4 rounded-xl border border-[#F2F2EE] hover:border-purple-300 transition-colors">
              <div className={`p-2 rounded-lg shrink-0 self-start ${tip.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-[#192837] mb-1">{tip.title}</h4>
                <p className="text-xs text-[#192837] opacity-80 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-[#F2F2EE] flex justify-between items-center text-xs text-[#192837] opacity-70">
        <div>
          {isMn ? (
            <span>👤 <strong>Болд</strong> • 9 настай • Тоглоом тоглох дуртай 🎮</span>
          ) : (
            <span>👤 <strong>Bold</strong> • 9 years old • Loves playing games 🎮</span>
          )}
        </div>
        <div className="font-mono text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
          Level 9 Gamer Shield Active
        </div>
      </div>
    </div>
  );
}

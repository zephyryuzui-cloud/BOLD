import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, Plus, Search, Eye, EyeOff, Trash2, Shield, 
  Sparkles, CheckCircle2, ChevronRight, X, User, Languages, 
  Check, Info, RefreshCw
} from 'lucide-react';
import { GameAccount, PlatformType, LanguageType } from '../types';
import PasswordStrengthTester, { evaluateStrength } from './PasswordStrengthTester';
import PasswordGenerator from './PasswordGenerator';
import GamerTips from './GamerTips';

interface GamerVaultProps {
  onClose: () => void;
}

export default function GamerVault({ onClose }: GamerVaultProps) {
  const [language, setLanguage] = useState<LanguageType>('mn'); // Default to Mongolian since the user requested in Mongolian
  const [accounts, setAccounts] = useState<GameAccount[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | 'All'>('All');
  
  // Form states
  const [formPlatform, setFormPlatform] = useState<PlatformType>('Minecraft');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Password visibility states
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const isMn = language === 'mn';

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('bold_gamer_vault');
    if (saved) {
      try {
        setAccounts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse accounts", e);
      }
    } else {
      // Seed default accounts for a lovely initial experience
      const defaultAccounts: GameAccount[] = [
        {
          id: '1',
          platform: 'Minecraft',
          username: 'BoldBuilder99',
          password: '💎MineCraftCraftSteve99!',
          strength: 'strong',
          notes: 'My main survival world with Netherite Armor!',
          createdAt: new Date().toLocaleDateString()
        },
        {
          id: '2',
          platform: 'Roblox',
          username: 'BoldRobloxKid',
          password: 'BaconAdoptMeNoob88*',
          strength: 'medium',
          notes: 'Used in Adopt Me and Bloxburg!',
          createdAt: new Date().toLocaleDateString()
        },
        {
          id: '3',
          platform: 'Fortnite',
          username: 'BoldVictoryRoyale',
          password: '🔥JonesyVictoryChugJug99!',
          strength: 'legendary',
          notes: 'Unbeatable gamer account!',
          createdAt: new Date().toLocaleDateString()
        }
      ];
      setAccounts(defaultAccounts);
      localStorage.setItem('bold_gamer_vault', JSON.stringify(defaultAccounts));
    }
  }, []);

  // Save to local storage
  const saveAccounts = (newAccounts: GameAccount[]) => {
    setAccounts(newAccounts);
    localStorage.setItem('bold_gamer_vault', JSON.stringify(newAccounts));
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername || !formPassword) return;

    const strength = evaluateStrength(formPassword);
    const newAccount: GameAccount = {
      id: Math.random().toString(36).substring(2, 9),
      platform: formPlatform,
      username: formUsername,
      password: formPassword,
      strength,
      notes: formNotes || undefined,
      createdAt: new Date().toLocaleDateString()
    };

    const updated = [newAccount, ...accounts];
    saveAccounts(updated);

    // Reset Form
    setFormUsername('');
    setFormPassword('');
    setFormNotes('');
    setShowAddForm(false);
    
    // Show success message
    setSuccessMessage(isMn ? "Амжилттай хадгаллаа! 🎮" : "Saved successfully! 🎮");
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteAccount = (id: string) => {
    if (confirm(isMn ? "Энэ тоглоомын нууц үгийг устгах уу?" : "Are you sure you want to delete this password?")) {
      const updated = accounts.filter(acc => acc.id !== id);
      saveAccounts(updated);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const selectSuggestedPassword = (pw: string) => {
    setFormPassword(pw);
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.username.toLowerCase().includes(search.toLowerCase()) || 
                          (acc.notes && acc.notes.toLowerCase().includes(search.toLowerCase())) ||
                          acc.platform.toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = selectedPlatform === 'All' || acc.platform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  // Calculate stats
  const totalCount = accounts.length;
  const strongCount = accounts.filter(acc => acc.strength === 'strong' || acc.strength === 'legendary').length;
  const safetyPercent = totalCount > 0 ? Math.round((strongCount / totalCount) * 100) : 0;

  // Theme configuration for platforms
  const getPlatformStyle = (platform: PlatformType) => {
    switch (platform) {
      case 'Minecraft':
        return {
          bg: 'bg-emerald-50 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800',
          logoColor: 'text-emerald-600',
          borderHover: 'hover:border-emerald-400'
        };
      case 'Roblox':
        return {
          bg: 'bg-rose-50 border-rose-200',
          badge: 'bg-rose-100 text-rose-800',
          logoColor: 'text-rose-600',
          borderHover: 'hover:border-rose-400'
        };
      case 'Fortnite':
        return {
          bg: 'bg-indigo-50 border-indigo-200',
          badge: 'bg-indigo-100 text-indigo-800',
          logoColor: 'text-indigo-600',
          borderHover: 'hover:border-indigo-400'
        };
      case 'Steam':
        return {
          bg: 'bg-slate-50 border-slate-200',
          badge: 'bg-slate-100 text-slate-800',
          logoColor: 'text-slate-600',
          borderHover: 'hover:border-slate-400'
        };
      case 'Nintendo':
        return {
          bg: 'bg-red-50 border-red-200',
          badge: 'bg-red-100 text-red-800',
          logoColor: 'text-red-600',
          borderHover: 'hover:border-red-400'
        };
      default:
        return {
          bg: 'bg-sky-50 border-sky-200',
          badge: 'bg-sky-100 text-sky-800',
          logoColor: 'text-sky-600',
          borderHover: 'hover:border-sky-400'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#192837] bg-opacity-60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#F2F2EE]/85 backdrop-blur-xl w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-white/30">
        
        {/* Header Dashboard */}
        <div className="bg-[#192837]/90 backdrop-blur-md text-white px-6 py-5 flex items-center justify-between border-b border-[#2C3E50]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7342E2] rounded-xl text-white">
              <Gamepad2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight font-heading">
                  {isMn ? "Болдын тоглоомын сейф" : "Bold's Safe Gaming Vault"}
                </h2>
                <span className="text-xs bg-[#7342E2] px-2 py-0.5 rounded-full font-mono">
                  Age 9
                </span>
              </div>
              <p className="text-xs text-gray-400 font-light mt-0.5">
                {isMn ? "Миний тоглоомуудын нууц үг хадгалагч цайз ⚔️" : "My super-secure game password manager dashboard ⚔️"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'mn' ? 'en' : 'mn')}
              className="flex items-center gap-1 text-xs font-semibold bg-[#2C3E50] hover:bg-opacity-80 transition-all border border-gray-600 px-3 py-1.5 rounded-full"
            >
              <Languages className="w-3.5 h-3.5 text-purple-400" />
              <span>{isMn ? "English" : "Монгол"}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          
          {/* Welcome Panel & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Bold Profile Card */}
            <div className="bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute right-[-15px] bottom-[-15px] opacity-10">
                <Gamepad2 className="w-24 h-24 text-[#7342E2]" />
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 shrink-0 font-bold text-lg border border-purple-200">
                B
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#192837]">{isMn ? "Болд (9 настай)" : "Bold (9 Years Old)"}</h4>
                <p className="text-xs text-gray-500">
                  {isMn ? "🎮 Тоглоом тоглох дуртай!" : "🎮 Loves playing games!"}
                </p>
                <div className="mt-1 flex gap-1">
                  <span className="text-[10px] bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-md">Roblox</span>
                  <span className="text-[10px] bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-md">Minecraft</span>
                </div>
              </div>
            </div>

            {/* Safety Score Card */}
            <div className="bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm flex items-center justify-between relative overflow-hidden">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  {isMn ? "ХАМГААЛАЛТЫН ОНОО" : "SECURITY SCORE"}
                </span>
                <h3 className="text-2xl font-extrabold text-[#192837] mt-1">{safetyPercent}%</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isMn ? "Хүчтэй нууц үгнүүд" : "Strong passwords saved"}
                </p>
              </div>
              <div className="relative flex items-center justify-center">
                {/* Visual circle gauge */}
                <div className="w-14 h-14 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
                  <div className="absolute inset-[-4px] rounded-full border-4 border-purple-600 border-r-transparent border-b-transparent animate-spin-slow opacity-20"></div>
                  <Shield className="w-6 h-6 text-[#7342E2]" />
                </div>
              </div>
            </div>

            {/* Total Accounts Card */}
            <div className="bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  {isMn ? "ХАДГАЛСАН СЕЙФ" : "SAVED ACCOUNTS"}
                </span>
                <h3 className="text-2xl font-extrabold text-[#192837] mt-1">{totalCount}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isMn ? "Нийт тоглоомын бүртгэл" : "Active game accounts"}
                </p>
              </div>
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-[#7342E2] hover:bg-opacity-90 text-white p-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

          </div>

          {/* Toast Alert Success */}
          {successMessage && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Add Account Modal Form Panel */}
          {showAddForm && (
            <div className="bg-white p-5 rounded-2xl border-2 border-purple-200 shadow-md space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[#F2F2EE]">
                <h3 className="font-extrabold text-sm text-[#192837] uppercase tracking-wider flex items-center gap-2">
                  <span className="p-1 bg-purple-100 rounded-md text-purple-700">⚔️</span>
                  {isMn ? "Шинэ Тоглоомын Сейф Нэмэх" : "Add New Game Password"}
                </h3>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  {isMn ? "Болих" : "Cancel"}
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#192837] mb-1">
                      {isMn ? "Тоглоом сонгох:" : "Select Game:"}
                    </label>
                    <select
                      value={formPlatform}
                      onChange={(e) => setFormPlatform(e.target.value as PlatformType)}
                      className="w-full bg-[#FAF9F5] border border-[#EBEAE4] px-3 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
                    >
                      <option value="Minecraft">⛏️ Minecraft</option>
                      <option value="Roblox">🧱 Roblox</option>
                      <option value="Fortnite">🔫 Fortnite</option>
                      <option value="Steam">🎮 Steam</option>
                      <option value="Nintendo">🔴 Nintendo Switch</option>
                      <option value="Other">✨ Other App / Game</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#192837] mb-1">
                      {isMn ? "Хэрэглэгчийн нэр:" : "Username / Character Name:"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isMn ? "Жишээ нь: BoldBuilder99" : "e.g., BoldGamer"}
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#EBEAE4] px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#192837] mb-1">
                      {isMn ? "Тэмдэглэл (Сонголтоор):" : "Notes / Levels / Goals (Optional):"}
                    </label>
                    <textarea
                      placeholder={isMn ? "Миний хадгалсан нөөцүүд эсвэл тоглоомын зорилго..." : "My main survival base, rare skins, or game goals..."}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-[#FAF9F5] border border-[#EBEAE4] px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#7342E2] resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#192837] mb-1">
                      {isMn ? "Нууц үг:" : "Game Password:"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isMn ? "Нууц үгээ энд бичнэ үү" : "Type game password here"}
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full bg-[#FAF9F5] border border-[#EBEAE4] px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#7342E2] font-mono"
                    />
                  </div>

                  {/* Gamer Password Generator inside form */}
                  <PasswordGenerator onSelectPassword={selectSuggestedPassword} language={language} />

                  {/* Password Strength display */}
                  <PasswordStrengthTester password={formPassword} language={language} />
                </div>

                <div className="md:col-span-2 pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#7342E2] hover:bg-opacity-95 text-white font-semibold text-xs px-5 py-2.5 rounded-full shadow-md active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isMn ? "Тоглоомын Сейфэнд Хадгалах" : "Save to Game Vault"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white p-3.5 rounded-2xl border border-[#EBEAE4]">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={isMn ? "Тоглоом эсвэл нэрээр хайх..." : "Search game or nickname..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-[#EBEAE4] pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
              />
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {(['All', 'Minecraft', 'Roblox', 'Fortnite', 'Steam', 'Nintendo'] as const).map((plt) => (
                <button
                  key={plt}
                  onClick={() => setSelectedPlatform(plt)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all shrink-0 ${
                    selectedPlatform === plt
                      ? 'bg-[#192837] text-white shadow-sm'
                      : 'bg-[#FAF9F5] hover:bg-gray-100 text-[#192837]'
                  }`}
                >
                  {plt === 'All' ? (isMn ? 'Бүгд' : 'All') : plt}
                </button>
              ))}
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((acc) => {
                const style = getPlatformStyle(acc.platform);
                const isPasswordVisible = visiblePasswords[acc.id] || false;

                return (
                  <div 
                    key={acc.id} 
                    className={`bg-white border rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 shadow-sm ${style.borderHover} hover:shadow-md relative overflow-hidden`}
                  >
                    
                    {/* Accent strip */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${style.badge}`} />

                    <div>
                      {/* Logo and Platform */}
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">
                            {acc.platform === 'Minecraft' ? '⛏️' : 
                             acc.platform === 'Roblox' ? '🧱' : 
                             acc.platform === 'Fortnite' ? '🔫' : 
                             acc.platform === 'Steam' ? '🎮' : 
                             acc.platform === 'Nintendo' ? '🔴' : '✨'}
                          </span>
                          <span className="text-xs font-bold text-[#192837] tracking-tight">{acc.platform}</span>
                        </div>
                        
                        {/* Strength Badge */}
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          acc.strength === 'weak' ? 'bg-red-100 text-red-700' :
                          acc.strength === 'medium' ? 'bg-amber-100 text-amber-700' :
                          acc.strength === 'strong' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700 animate-pulse'
                        }`}>
                          {acc.strength === 'weak' ? (isMn ? 'Сул' : 'Weak') :
                           acc.strength === 'medium' ? (isMn ? 'Дундаж' : 'Medium') :
                           acc.strength === 'strong' ? (isMn ? 'Хүчтэй' : 'Strong') :
                           (isMn ? 'Домогт 👑' : 'Legend 👑')}
                        </span>
                      </div>

                      {/* Username */}
                      <div className="space-y-1 mb-2 bg-[#FAF9F5] p-2.5 rounded-xl border border-[#F2F2EE]">
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                          {isMn ? "ХЭРЭГЛЭГЧИЙН НЭР" : "CHARACTER / USER"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-bold text-[#192837] break-all">{acc.username}</span>
                        </div>
                      </div>

                      {/* Password Eye Toggle */}
                      <div className="space-y-1 mb-3 bg-[#FAF9F5] p-2.5 rounded-xl border border-[#F2F2EE]">
                        <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wider">
                          {isMn ? "НУУЦ ҮГ" : "PASSWORD"}
                        </span>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-xs text-[#192837] font-semibold tracking-wide truncate max-w-[140px]">
                            {isPasswordVisible ? acc.password : '••••••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(acc.id)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-purple-600 transition-colors shrink-0"
                          >
                            {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Custom notes */}
                      {acc.notes && (
                        <div className="text-[11px] text-gray-500 italic bg-[#FAF9F5] p-2 rounded-lg border border-[#F2F2EE] mb-3">
                          💡 {acc.notes}
                        </div>
                      )}
                    </div>

                    {/* Footer card actions */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#F2F2EE] text-[10px] text-gray-400">
                      <span>{acc.createdAt}</span>
                      
                      <button
                        onClick={() => handleDeleteAccount(acc.id)}
                        title={isMn ? "Устгах" : "Delete"}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="col-span-full bg-white rounded-2xl py-12 px-4 border border-[#EBEAE4] text-center flex flex-col items-center justify-center space-y-3">
                <Shield className="w-12 h-12 text-gray-300" />
                <h4 className="font-bold text-sm text-[#192837]">
                  {isMn ? "Тохирох сейф олдсонгүй" : "No gamer passwords found"}
                </h4>
                <p className="text-xs text-gray-500 max-w-xs">
                  {isMn ? "Хайлтын үгийг өөрчлөх эсвэл шинээр тоглоомын нууц үг нэмж оруулаарай!" : "Try searching something else, or hit the plus button to add your first secure game password!"}
                </p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-[#7342E2] text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isMn ? "Нууц үг нэмэх" : "Add Password"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tips card personalized for Bold */}
          <GamerTips language={language} />

        </div>

        {/* Safe Footing info */}
        <div className="bg-white border-t border-[#EBEAE4] px-6 py-4 flex flex-col sm:flex-row gap-2 justify-between items-center text-xs text-gray-500">
          <div>
            <span>🔐 VaultShield local data protection active</span>
          </div>
          <div>
            <span>{isMn ? "Болд, хүчтэй хамгаалалттай аюулгүй тоглоорой! 🚀" : "Play safe and keep your loot secure, Bold! 🚀"}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

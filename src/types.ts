export type PlatformType = 'Minecraft' | 'Roblox' | 'Fortnite' | 'Steam' | 'Nintendo' | 'Other';

export interface GameAccount {
  id: string;
  platform: PlatformType;
  username: string;
  password:  string;
  strength: 'weak' | 'medium' | 'strong' | 'legendary';
  notes?: string;
  createdAt: string;
}

export type LanguageType = 'mn' | 'en';

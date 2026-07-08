import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Heart, Sparkles, RefreshCw, X, Play, 
  Volume2, VolumeX, HelpCircle, Award, Compass, 
  BookOpen, Zap, Brain, Check, AlertCircle, 
  ArrowRight, Lock, Unlock, Info, Smile, Sparkle, Gamepad2
} from 'lucide-react';
import { LanguageType } from '../types';

interface GamerAnimeGuessProps {
  onClose: () => void;
  language: LanguageType;
}

interface AnimeQuestion {
  id: string;
  englishTitle: string;
  romajiTitle: string;
  synonyms: string[];
  year: number;
  studio: string;
  genres: string[];
  emojis: string;
  quotes: {
    mn: string;
    en: string;
  };
  characters: string[];
  plotHint: {
    mn: string;
    en: string;
  };
  keywords: string[];
  artType: string;
}

// Top 20 classic anime questions
const ANIME_DATASET: AnimeQuestion[] = [
  {
    id: "1",
    englishTitle: "Naruto",
    romajiTitle: "Naruto",
    synonyms: ["naruto", "naruto shippuden", "shippuden", "наруто", "борото", "boruto"],
    year: 2002,
    studio: "Studio Pierrot",
    genres: ["Shonen", "Action", "Ninja", "Adventure"],
    emojis: "🦊🍜🌪️🥋",
    quotes: {
      mn: "Би хэзээ ч амлалтаасаа буцахгүй. Энэ бол миний нинжагийн зам!",
      en: "I never go back on my word. That's my nindo, my ninja way!"
    },
    characters: ["Naruto Uzumaki", "Sasuke Uchiha", "Kakashi Hatake", "Sakura Haruno"],
    plotHint: {
      mn: "Эцэг эхгүй өссөн, дотроо есөн сүүлт үнэгний сүнстэй хүү тосгоныхоо хамгийн агуу удирдагч Хокагэ болохыг мөрөөддөг.",
      en: "An orphan boy with a nine-tailed fox sealed inside him dreams of becoming the greatest leader (Hokage) of his ninja village."
    },
    keywords: ["Rasengan", "Konoha", "Chidori", "Uchiha", "Nine-Tails"],
    artType: "naruto"
  },
  {
    id: "2",
    englishTitle: "One Piece",
    romajiTitle: "One Piece",
    synonyms: ["one piece", "ван пис", "ванпис", "luffy", "луффи", "zoro", "зоро"],
    year: 1999,
    studio: "Toei Animation",
    genres: ["Shonen", "Adventure", "Pirates", "Action"],
    emojis: "👒🏴‍☠️🌊⛵",
    quotes: {
      mn: "Би далайн дээрэмчдийн хаан болно!",
      en: "I'm going to become the King of the Pirates!"
    },
    characters: ["Monkey D. Luffy", "Roronoa Zoro", "Nami", "Vinsmoke Sanji", "Nico Robin"],
    plotHint: {
      mn: "Резинэн биетэй хүү өөрийн гэсэн багийг цуглуулан, агуу далайн дээрэмчний үлдээсэн нууцлаг эрдэнэсийг олохоор аялна.",
      en: "A boy made of rubber recruits an eclectic crew of pirates to search for the ultimate treasure left behind by the legendary Pirate King."
    },
    keywords: ["Devil Fruit", "Gum-Gum", "Grand Line", "Straw Hat", "Going Merry"],
    artType: "one_piece"
  },
  {
    id: "3",
    englishTitle: "Attack on Titan",
    romajiTitle: "Shingeki no Kyojin",
    synonyms: ["attack on titan", "shingeki no kyojin", "aot", "титан", "attack on titans", "эрэн", "eren"],
    year: 2013,
    studio: "WIT Studio / MAPPA",
    genres: ["Dark Fantasy", "Action", "Drama", "Mystery"],
    emojis: "⚔️🧗‍♂️🥩👹",
    quotes: {
      mn: "Хэрэв бид ялахгүй бол үхнэ. Хэрэв бид тэмцэхгүй бол ялж чадахгүй. Тэмц!",
      en: "If we don't win, we die. If we don't fight, we can't win. Fight!"
    },
    characters: ["Eren Yeager", "Mikasa Ackerman", "Levi Ackerman", "Armin Arlert"],
    plotHint: {
      mn: "Хүн төрөлхтөн аварга биетүүдээс хамгаалж гурван давхар аварга том хананы ард амьдардаг боловч нэг өдөр хамгийн гадна талын хана нурна.",
      en: "Humanity lives inside cities surrounded by three enormous concentric walls that protect them from gigantic, mindless man-eating giants."
    },
    keywords: ["Colossal Titan", "Survey Corps", "ODM Gear", "Shiganshina", "Eldia"],
    artType: "aot"
  },
  {
    id: "4",
    englishTitle: "Death Note",
    romajiTitle: "Death Note",
    synonyms: ["death note", "дэт ноут", "үхлийн дэвтэр", "deathnote", "kira", "кира", "l lawliet"],
    year: 2006,
    studio: "Madhouse",
    genres: ["Psychological Thriller", "Supernatural", "Mystery"],
    emojis: "📓🍎💀✍️",
    quotes: {
      mn: "Би энэ дэлхийг шинэчилж, зөвхөн сайн хүмүүсийн амьдрах шинэ ертөнцийг бүтээнэ. Би шинэ ертөнцийн Бурхан болно!",
      en: "I'll make this world a better place... and I will become the God of this new world!"
    },
    characters: ["Light Yagami", "L Lawliet", "Ryuk", "Misa Amane", "Near"],
    plotHint: {
      mn: "Нэгэн суут ахлах ангийн сурагч нэрийг нь бичихэд хүн үхдэг ид шидийн дэвтэр олсноор гэмт хэрэгтнүүдийг устгаж эхэлнэ.",
      en: "A brilliant high school student discovers a supernatural notebook that allows him to kill anyone whose name and face he writes in it."
    },
    keywords: ["Shinigami", "Kira", "L", "Ryuk", "Apple", "Justice"],
    artType: "death_note"
  },
  {
    id: "5",
    englishTitle: "Demon Slayer",
    romajiTitle: "Kimetsu no Yaiba",
    synonyms: ["demon slayer", "kimetsu no yaiba", "димон слэйр", "чөтгөр устгагч", "nezuko", "tanjiro", "незуко", "танжиро"],
    year: 2019,
    studio: "ufotable",
    genres: ["Shonen", "Action", "Historical", "Supernatural"],
    emojis: "⚔️👺🐗🌸",
    quotes: {
      mn: "Урагшаа тэмц! Битгий уйл, битгий бууж өг! Сэтгэлээ бадраа!",
      en: "Move forward! Don't cry, don't give up! Set your heart ablaze, go beyond your limits!"
    },
    characters: ["Tanjiro Kamado", "Nezuko Kamado", "Zenitsu Agatsuma", "Inosuke Hashibira", "Kyojuro Rengoku"],
    plotHint: {
      mn: "Чөтгөрт гэр бүлээ хядуулж, цорын ганц амьд үлдсэн дүү нь чөтгөр болон хувирсан хүү дүүгээ буцааж хүн болгохын тулд чөтгөр устгагч болно.",
      en: "A kindhearted boy sets out to become a demon slayer after his family is slaughtered and his younger sister is turned into a demon."
    },
    keywords: ["Hinokami Kagura", "Water Breathing", "Muzan", "Nichirin Blade", "Hashira"],
    artType: "demon_slayer"
  },
  {
    id: "6",
    englishTitle: "Jujutsu Kaisen",
    romajiTitle: "Jujutsu Kaisen",
    synonyms: ["jujutsu kaisen", "жүжүцү кайсен", "жүжүцү", "jjk", "gojo", "itadori", "гожо", "сукуна", "sukuna"],
    year: 2020,
    studio: "MAPPA",
    genres: ["Dark Fantasy", "Action", "Supernatural"],
    emojis: "🤞👁️👹🏫",
    quotes: {
      mn: "Санаа зоволтгүй дээ, би чинь хамгийн хүчтэй нь шүү дээ.",
      en: "Don't worry, I'm the strongest. There's no way I will lose."
    },
    characters: ["Yuji Itadori", "Satoru Gojo", "Megumi Fushiguro", "Nobara Kugisaki", "Ryomen Sukuna"],
    plotHint: {
      mn: "Ахлах ангийн сурагч сургуулийнхаа найзуудыг аврахын тулд хамгийн хүчирхэг хараалт хааны хурууг залгиснаар хараалын аюултай ертөнцөд хөл тавина.",
      en: "A high school student swallows a rotting, cursed finger to save his friends, becoming the host of the King of Curses, and joins a secret academy."
    },
    keywords: ["Domain Expansion", "Cursed Energy", "Six Eyes", "Sukuna Finger", "Shibuya"],
    artType: "jjk"
  },
  {
    id: "7",
    englishTitle: "Dragon Ball Z",
    romajiTitle: "Dragon Ball Z",
    synonyms: ["dragon ball", "dragon ball z", "драгонбол", "драгон бол", "goku", "гоку", "vegeta", "вэжита"],
    year: 1989,
    studio: "Toei Animation",
    genres: ["Shonen", "Action", "Martial Arts", "Sci-Fi"],
    emojis: "🐉🟠⚡🥋",
    quotes: {
      mn: "Миний хүч чадал асар их нэмэгдэж байна! Энэ бол Сүпер Сайян!",
      en: "And this... is to go even further beyond! Super Saiyan!"
    },
    characters: ["Goku", "Vegeta", "Gohan", "Piccolo", "Frieza"],
    plotHint: {
      mn: "Сайян угсааны хүчирхэг тулаанч эр дэлхийг сансрын болон бусад аюулт дайснуудаас хамгаалахын тулд хязгааргүй хүчээ ашиглан тэмцэнэ.",
      en: "A mighty alien warrior raised on Earth defends his adopted planet against galactic emperors, bio-engineered androids, and ancient magical beasts."
    },
    keywords: ["Kamehameha", "Super Saiyan", "Senzu Bean", "Fuzion", "Namek", "Shenron"],
    artType: "dbz"
  },
  {
    id: "8",
    englishTitle: "My Hero Academia",
    romajiTitle: "Boku no Hero Academia",
    synonyms: ["my hero academia", "boku no hero academia", "mha", "миний баатрын академи", "deku", "деку", "all might"],
    year: 2016,
    studio: "Bones",
    genres: ["Shonen", "Superhero", "School", "Action"],
    emojis: "🥦🦸‍♂️💥🏫",
    quotes: {
      mn: "Илүү хол явж тэмц! Плус Ультра!",
      en: "Go beyond! Plus Ultra! Everything will be fine, because I am here!"
    },
    characters: ["Izuku Midoriya (Deku)", "All Might", "Katsuki Bakugo", "Shoto Todoroki"],
    plotHint: {
      mn: "Хүн амын 80% нь тусгай хүч чадалтай төрдөг ертөнцөд ямар ч хүчгүй төрсөн хүү хамгийн агуу баатрын хүчийг өвлөн авч сургуульд суралцана.",
      en: "In a world where most of the human population possesses superpowers called Quirks, a powerless boy inherits the power of the world's symbol of peace."
    },
    keywords: ["One For All", "Quirk", "UA High", "All For One", "Detroit Smash"],
    artType: "mha"
  },
  {
    id: "9",
    englishTitle: "Sword Art Online",
    romajiTitle: "Sword Art Online",
    synonyms: ["sword art online", "sao", "сорд арт онлайн", "kirito", "кирито", "asuna", "асуна"],
    year: 2012,
    studio: "A-1 Pictures",
    genres: ["Sci-Fi", "Action", "Romance", "Virtual Reality"],
    emojis: "⚔️🎮👓💻",
    quotes: {
      mn: "Энэ бол зүгээр нэг тоглоом биш. Үүнд бидний амь амьдрал шийдэгдэж байна.",
      en: "This may be a game, but it's not something you play. If you die in here, you die out there."
    },
    characters: ["Kirito (Kazuto Kirigaya)", "Asuna Yuuki", "Sinon", "Yui", "Suguha"],
    plotHint: {
      mn: "Виртуал бодит байдлын тоглоомд гацсан мянга мянган тоглогчид тоглоомоос гарахын тулд 100 давхар цайзыг давж ялах ёстой, тэгэхгүй бол бодит амьдрал дээр үхнэ.",
      en: "Ten thousand players find themselves trapped in a virtual reality MMORPG where dying in-game results in death in real life, and they must beat 100 floors."
    },
    keywords: ["Aincrad", "Dual Blades", "NerveGear", "Black Swordsman", "Elucidator"],
    artType: "sao"
  },
  {
    id: "10",
    englishTitle: "Your Name",
    romajiTitle: "Kimi no Na wa",
    synonyms: ["your name", "kimi no na wa", "чиний нэр", "чиний нэрийг хэн гэдэг вэ", "taki", "mitsuha"],
    year: 2016,
    studio: "CoMix Wave Films",
    genres: ["Romance", "Drama", "Supernatural", "Fantasy"],
    emojis: "☄️📿🌄🌌",
    quotes: {
      mn: "Миний байнга хайж байсан тэр хүн... чи байсан уу?",
      en: "I feel like I'm always searching for someone, or something. What is your name?"
    },
    characters: ["Taki Tachibana", "Mitsuha Miyamizu", "Yotsuha"],
    plotHint: {
      mn: "Токиогийн хүү, хөдөөний охин хоёр унтаж байхдаа бие биенийхээ биед шилжин орж байгаагаа олж мэдэн, унах гэж буй солироос тосгоныг аврахаар оролдоно.",
      en: "A high school boy in Tokyo and a high school girl in a rural town swap bodies periodically, leading to a magical romance and a race to survive a comet collision."
    },
    keywords: ["Comet Tiamat", "Itomori", "Kuchikamizake", "Red String", "Twilight Hour"],
    artType: "your_name"
  },
  {
    id: "11",
    englishTitle: "One Punch Man",
    romajiTitle: "One Punch Man",
    synonyms: ["one punch man", "ванпанчмэн", "ван панч мэн", "saitama", "сайтама", "genos", "генос"],
    year: 2015,
    studio: "Madhouse",
    genres: ["Action", "Comedy", "Superhero", "Parody"],
    emojis: "🥊🧑‍🦲🦸‍♂️💥",
    quotes: {
      mn: "Би зүгээр л хоббигоороо баатар хийж яваа хүн байна.",
      en: "I'm just a guy who is a hero for fun. I became too strong and lost all my hair."
    },
    characters: ["Saitama", "Genos", "Speed-o'-Sound Sonic", "Mumen Rider", "King"],
    plotHint: {
      mn: "Ширүүн бэлтгэлийн ачаар бүх үсээ алдсан боловч ямар ч дайсныг ганцхан цохилтоор унагаж чаддаг болсон тулаанч уйдсандаа баатруудын холбоонд элсэнэ.",
      en: "A hero who trained so hard that he lost all his hair can defeat any enemy with a single punch, leaving him perpetually bored and seeking a real challenge."
    },
    keywords: ["Saitama", "Hero Association", "Genos", "One Punch", "100 Pushups"],
    artType: "one_punch"
  },
  {
    id: "12",
    englishTitle: "Fullmetal Alchemist",
    romajiTitle: "Fullmetal Alchemist: Brotherhood",
    synonyms: ["fullmetal alchemist", "fma", "fmab", "алхимич", "ган алхимич", "edward", "эдвард", "alphonse"],
    year: 2009,
    studio: "Bones",
    genres: ["Adventure", "Fantasy", "Action", "Military"],
    emojis: "🦾🧱🦁🔥",
    quotes: {
      mn: "Ямар нэгэн зүйлийг авахын тулд ижил хэмжээний үнэ цэнэтэй зүйлийг золиослох хэрэгтэй. Энэ бол Тэнцүү Солилцооны хууль!",
      en: "Humankind cannot gain anything without first giving something in return. To obtain, something of equal value must be lost. That is Equivalent Exchange!"
    },
    characters: ["Edward Elric", "Alphonse Elric", "Roy Mustang", "Winry Rockbell", "Scar"],
    plotHint: {
      mn: "Алхимийн аюултай туршилт хийн ээжийгээ сэргээх гэж оролдоод бие болон гараа алдсан ах дүү хоёр Философичийн чулууг хайн аялалд гарна.",
      en: "Two alchemist brothers seek the legendary Philosopher's Stone to restore their bodies after a failed attempt to bring their deceased mother back to life."
    },
    keywords: ["State Alchemist", "Amestris", "Elric Brothers", "Transmutation Circle", "Homunculus"],
    artType: "fma"
  },
  {
    id: "13",
    englishTitle: "Spy x Family",
    romajiTitle: "Spy x Family",
    synonyms: ["spy x family", "спай фэмили", "гүйцэтгэх ажиллагаа", "anya", "аня", "loid", "лоид", "yor", "ёр"],
    year: 2022,
    studio: "Wit Studio / CloverWorks",
    genres: ["Comedy", "Action", "Slice of Life", "Spy"],
    emojis: "🕵️‍♂️🥜🔫🧸",
    quotes: {
      mn: "Аня самар идмээр байна! Ваку Ваку!",
      en: "Anya loves peanuts! Waku Waku! Papa is a liar, but he is the coolest spy!"
    },
    characters: ["Loid Forger (Twilight)", "Yor Forger (Thorn Princess)", "Anya Forger", "Bond"],
    plotHint: {
      mn: "Нэгэн чадварлаг тагнуулч энх тайвны нууц даалгаврыг биелүүлэхийн тулд хуурамч гэр бүл зохиохдоо мэргэжлийн алуурчин эхнэр, бодлыг уншдаг охин авна.",
      en: "A master spy constructs a fake family for a peace mission, unaware that his adoptive daughter is a telepath and his fake wife is a lethal assassin."
    },
    keywords: ["Eden Academy", "Strix", "Ostania", "Telepath", "Thorn Princess", "Peanuts"],
    artType: "spy_family"
  },
  {
    id: "14",
    englishTitle: "Hunter x Hunter",
    romajiTitle: "Hunter x Hunter",
    synonyms: ["hunter x hunter", "хантер", "хантер хантер", "hxh", "gon", "гон", "killua", "киллуа"],
    year: 2011,
    studio: "Madhouse",
    genres: ["Shonen", "Adventure", "Action", "Supernatural"],
    emojis: "🎣👁️🃏🛹",
    quotes: {
      mn: "Чи миний хамгийн дотны найз шүү дээ. Чи байхгүй бол би...",
      en: "You should enjoy the little detours to the utmost. Because that's where you'll find the things more important than what you want."
    },
    characters: ["Gon Freecss", "Killua Zoldyck", "Kurapika", "Leorio", "Hisoka"],
    plotHint: {
      mn: "Өөрийг нь орхиод явсан аавыгаа ямар ажил хийдгийг мэдэхээр шийдсэн хүү дэлхийн хамгийн хэцүү шалгалтад орж Хантер буюу Ангууч болно.",
      en: "A young boy named Gon sets out to become a licensed Hunter, a legendary adventurer, in order to search for his elusive and world-renowned father."
    },
    keywords: ["Nen", "Greed Island", "Chimera Ant", "Hunter License", "Killua Yo-Yos"],
    artType: "hxh"
  },
  {
    id: "15",
    englishTitle: "Spirited Away",
    romajiTitle: "Sen to Chihiro no Kamikakushi",
    synonyms: ["spirited away", "утсаар хамгаалагдсан", "сүнсээр туугдагсад", "chihiro", "чихиро", "haku", "хаку"],
    year: 2001,
    studio: "Studio Ghibli",
    genres: ["Fantasy", "Adventure", "Family", "Spirit"],
    emojis: "🏮🐷🐉⛩️",
    quotes: {
      mn: "Битгий мартаарай, чиний жинхэнэ нэр бол Чихиро шүү.",
      en: "Once you've met someone, you never really forget them. It just takes a while for your memories to return."
    },
    characters: ["Chihiro Ogino (Sen)", "Haku", "No-Face (Kaonashi)", "Yubaba", "Kamaji"],
    plotHint: {
      mn: "Нүүж явах замдаа хаягдсан зугаа цэнгэлийн паркт орж эцэг эх нь гахай болон хувирсан охин сүнсний халуун усны газарт ажиллан тэднийг аврахыг хичээнэ.",
      en: "A young girl wanders into a magical world of spirits governed by an evil witch, where she must work in a mystical bathhouse to free her pig-turned parents."
    },
    keywords: ["Bathhouse", "Soot Sprites", "Haku Dragon", "No-Face", "Yubaba", "Zeniba"],
    artType: "spirited_away"
  }
];

// Simple synthesizer sounds for games
const playSynthSound = (type: 'correct' | 'wrong' | 'hint' | 'levelup' | 'gameover' | 'click' | 'victory') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.08); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.16); // C6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.linearRampToValueAtTime(130.81, ctx.currentTime + 0.28); // C3
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'hint') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1); // E6
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'levelup') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'gameover') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'victory') {
      // Epic fanfare chord
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); // C6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch (e) {
    // Ignored if blocked
  }
};

export default function GamerAnimeGuess({ onClose, language }: GamerAnimeGuessProps) {
  const isMn = language === 'mn';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState<'classic' | 'quote' | 'emoji' | 'character'>('classic');
  const [questions, setQuestions] = useState<AnimeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(4);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [guessInput, setGuessInput] = useState("");
  const [isWrongAnimation, setIsWrongAnimation] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'choice'>('choice');
  const [choices, setChoices] = useState<string[]>([]);
  const [isGameOverState, setIsGameOverState] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [rankName, setRankName] = useState("");

  // Hint unlocks state
  const [unlockedHints, setUnlockedHints] = useState<string[]>([]); // 'genres', 'studio', 'character', 'plot', 'visual'
  const [goldenHintsLeft, setGoldenHintsLeft] = useState(3);
  const [letterReveal, setLetterReveal] = useState<string>("");

  // Canvas animation variables
  const animationFrameId = useRef<number | null>(null);
  const particleArray = useRef<any[]>([]);

  // Get active question safely
  const currentQuestion = questions[currentIndex] || null;

  // Set Ranking Name based on Score
  const computeRank = (s: number) => {
    if (isMn) {
      if (s >= 1000) return "Домогт Отаку 👑";
      if (s >= 600) return "Хокагэ Ангилал 🔥";
      if (s >= 350) return "Аниме Мэргэжилтэн ⚔️";
      if (s >= 150) return "Отаку Эхлэл 🍙";
      return "Шинэ Нинжа 🦊";
    } else {
      if (s >= 1000) return "Legendary Otaku 👑";
      if (s >= 600) return "Hokage Rank 🔥";
      if (s >= 350) return "Anime Elite ⚔️";
      if (s >= 150) return "Otaku Rookie 🍙";
      return "Genin Recruit 🦊";
    }
  };

  useEffect(() => {
    setRankName(computeRank(score));
  }, [score, language]);

  // Load highscore on start
  useEffect(() => {
    const saved = localStorage.getItem('vaultshield_anime_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Save highscore on change
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('vaultshield_anime_highscore', score.toString());
    }
  }, [score, highScore]);

  // Handle setting up multiple choice options
  useEffect(() => {
    if (!currentQuestion) return;

    // Pick 3 wrong options randomly
    const incorrect = ANIME_DATASET
      .filter(a => a.id !== currentQuestion.id)
      .map(a => a.englishTitle);
    
    // Shuffle and slice 3
    const shuffledIncorrect = [...incorrect].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [...shuffledIncorrect, currentQuestion.englishTitle].sort(() => 0.5 - Math.random());
    setChoices(options);

    // Reset current question letter reveal
    setLetterReveal(generateObfuscatedTitle(currentQuestion.englishTitle));
  }, [currentQuestion, currentIndex]);

  // Generate blank template: e.g., "N _ r _ t _"
  const generateObfuscatedTitle = (title: string) => {
    return title.split('').map((char, index) => {
      if (char === ' ') return '  ';
      if (index === 0) return char; // Reveal first letter
      return '_';
    }).join(' ');
  };

  // Sound triggering utility
  const triggerSound = (type: 'correct' | 'wrong' | 'hint' | 'levelup' | 'gameover' | 'click' | 'victory') => {
    if (soundEnabled) playSynthSound(type);
  };

  // Start the game!
  const startGame = (mode: typeof gameMode) => {
    triggerSound('click');
    setGameMode(mode);
    
    // Shuffle questions
    const shuffled = [...ANIME_DATASET].sort(() => 0.5 - Math.random());
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setLives(4);
    setUnlockedHints([]);
    setGoldenHintsLeft(3);
    setGuessInput("");
    setFeedback(null);
    setIsGameOverState(false);
    setIsVictory(false);
    setIsPlaying(true);
  };

  // Fuzzy matching for typed answers
  const checkAnswerFuzzy = (userInput: string): boolean => {
    if (!currentQuestion) return false;
    const clean = userInput.trim().toLowerCase().replace(/[^a-zA-Z0-9а-яөүжэийклнорстуфхцчшщыьэюяё]/g, "");
    if (!clean) return false;

    // List of allowed names
    const allowed = [
      currentQuestion.englishTitle.toLowerCase().replace(/[^a-zA-Z0-9а-яөүжэийклнорстуфхцчшщыьэюяё]/g, ""),
      currentQuestion.romajiTitle.toLowerCase().replace(/[^a-zA-Z0-9а-яөүжэийклнорстуфхцчшщыьэюяё]/g, ""),
      ...currentQuestion.synonyms.map(s => s.toLowerCase().replace(/[^a-zA-Z0-9а-яөүжэийклнорстуфхцчшщыьэюяё]/g, ""))
    ];

    // Check exact or substring
    return allowed.some(ans => clean === ans || ans.includes(clean) && clean.length > 2);
  };

  // Answer submit handler
  const handleAnswerSubmit = (selectedAnswer?: string) => {
    if (feedback || isGameOverState || isVictory) return;

    const answerToTest = selectedAnswer || guessInput;
    if (!answerToTest.trim()) return;

    const isCorrect = selectedAnswer 
      ? (selectedAnswer === currentQuestion.englishTitle)
      : checkAnswerFuzzy(answerToTest);

    if (isCorrect) {
      // Calculate reward points based on clues used and game mode
      const hintsUsedCount = unlockedHints.length;
      let basePoints = 100;
      if (gameMode === 'quote') basePoints = 120;
      if (gameMode === 'emoji') basePoints = 80;
      if (gameMode === 'character') basePoints = 110;

      // Subtract points for hints, but ensure minimum 40 points
      const deduction = hintsUsedCount * 15;
      const pointsEarned = Math.max(40, basePoints - deduction) + (streak * 10);

      setScore(prev => prev + pointsEarned);
      const newStreak = streak + 1;
      setStreak(newStreak);

      triggerSound('correct');

      // Trigger high-streak effects or level up sound if score crosses major markers
      if (newStreak % 3 === 0) {
        setTimeout(() => triggerSound('levelup'), 400);
      }

      setFeedback({
        isCorrect: true,
        text: isMn 
          ? `Зөв хариуллаа! 🎉 +${pointsEarned} оноо. (Хариулт: ${currentQuestion.englishTitle})`
          : `Correct Answer! 🎉 +${pointsEarned} Points. (Answer: ${currentQuestion.englishTitle})`
      });

    } else {
      // Wrong answer
      const remainingLives = lives - 1;
      setLives(remainingLives);
      setStreak(0);
      setIsWrongAnimation(true);
      setTimeout(() => setIsWrongAnimation(false), 500);

      triggerSound('wrong');

      if (remainingLives <= 0) {
        // Trigger Game Over
        setTimeout(() => {
          setIsGameOverState(true);
          triggerSound('gameover');
        }, 1000);
      }

      setFeedback({
        isCorrect: false,
        text: isMn
          ? `Буруу байна! ❌ Зөв хариулт нь: "${currentQuestion.englishTitle}"`
          : `Wrong! ❌ Correct answer was: "${currentQuestion.englishTitle}"`
      });
    }
  };

  // Move to next question or end on victory
  const nextQuestion = () => {
    triggerSound('click');
    setFeedback(null);
    setGuessInput("");
    setUnlockedHints([]);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // All questions solved - Complete Victory!
      setIsVictory(true);
      triggerSound('victory');
    }
  };

  // Unlock single hint
  const unlockHint = (hintKey: string) => {
    if (unlockedHints.includes(hintKey)) return;
    triggerSound('hint');
    setUnlockedHints(prev => [...prev, hintKey]);
    // Deduct 5 points per hint from score if score > 10
    if (score > 10) setScore(prev => prev - 5);
  };

  // Golden hint - reveals characters one by one
  const revealGoldenLetter = () => {
    if (goldenHintsLeft <= 0 || !currentQuestion) return;
    triggerSound('hint');
    setGoldenHintsLeft(prev => prev - 1);

    const title = currentQuestion.englishTitle;
    // Find unrevealed indices
    const letters = letterReveal.replace(/\s/g, '').split(''); // Obfuscated letters without spaces
    const titleLetters = title.split('');

    const unrevealedIndices: number[] = [];
    titleLetters.forEach((char, idx) => {
      const displayChar = letterReveal.split(' ')[idx];
      if (displayChar === '_' && char !== ' ') {
        unrevealedIndices.push(idx);
      }
    });

    if (unrevealedIndices.length > 0) {
      // Pick random index
      const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      const updatedReveal = titleLetters.map((char, index) => {
        if (char === ' ') return '  ';
        // Keep already revealed or newly revealed
        const displayChar = letterReveal.split(' ')[index];
        if (displayChar !== '_' && displayChar !== undefined) {
          return displayChar;
        }
        if (index === randomIndex) return char;
        return '_';
      }).join(' ');

      setLetterReveal(updatedReveal);
    }
  };

  // Render Canvas Procedural Graphics based on artType & hint reveals
  useEffect(() => {
    if (!isPlaying || !canvasRef.current || !currentQuestion) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high pixel density
    const width = 380;
    const height = 180;
    canvas.width = width;
    canvas.height = height;

    let particles: any[] = particleArray.current;

    // Reset particles on question change
    if (particles.length === 0 || currentIndex !== particleArray.current[0]?.qIdx) {
      particles = [];
      const count = 30;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.5,
          size: Math.random() * 3 + 1,
          color: 'rgba(255,255,255,0.4)',
          qIdx: currentIndex
        });
      }
      particleArray.current = particles;
    }

    const hasVisualHint = unlockedHints.includes('visual') || feedback !== null;
    const blurAmount = hasVisualHint ? 0 : 25; // Decreases blur as hints are unlocked

    const drawProceduralArt = (timestamp: number) => {
      ctx.clearRect(0, 0, width, height);

      // Create Cyberpunk Grid Background
      ctx.fillStyle = "#0c131d";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(115, 66, 226, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // If Visual is completely locked, draw security hacker terminal blocks
      if (!hasVisualHint) {
        ctx.fillStyle = "rgba(16, 185, 129, 0.05)";
        ctx.fillRect(10, 10, width - 20, height - 20);

        ctx.font = "11px 'JetBrains Mono', monospace";
        ctx.fillStyle = "rgba(16, 185, 129, 0.6)";
        ctx.fillText("[ SYSTEM ENCRYPTED ]", width / 2 - 60, height / 2 - 10);
        ctx.fillText("REVEAL VISUAL SIGNAL FOR -15 XP", width / 2 - 100, height / 2 + 15);

        // Draw dynamic random binary noise code
        ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
        for (let i = 0; i < 5; i++) {
          const randomText = Math.random() > 0.5 ? "01101011" : "ERROR_LOCK";
          ctx.fillText(randomText, (i * 75) + 20, Math.sin((timestamp / 500) + i) * 10 + 150);
        }

        // Draw warning border
        ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
        ctx.strokeRect(15, 15, width - 30, height - 30);
      } else {
        // Draw the specific procedural art styled for each anime!
        ctx.save();
        
        // Add subtle procedural animations depending on anime type
        const timeFactor = timestamp / 1000;
        
        if (currentQuestion.artType === "naruto") {
          // Uzumaki Orange Spiral Badge + Flying Shurikens
          const centerX = width / 2;
          const centerY = height / 2;
          
          // Orange glowing backdrop
          const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 80);
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
          gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          // Draw the spiral
          ctx.strokeStyle = "#f97316";
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.beginPath();
          for (let i = 0; i < 50; i++) {
            const angle = 0.2 * i + timeFactor * 1.5;
            const r = 2.5 * i;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Subtext
          ctx.font = "10px 'JetBrains Mono', monospace";
          ctx.fillStyle = "#ffedd5";
          ctx.fillText("NINJA CHAKRA EMBLEM", 20, 160);

        } else if (currentQuestion.artType === "one_piece") {
          // Golden Straw Hat outline + sailing waves
          const centerX = width / 2;
          const centerY = height / 2;

          // Blue ocean gradient
          const gradient = ctx.createRadialGradient(centerX, centerY, 20, centerX, centerY, 100);
          gradient.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
          gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          // Draw Straw Hat
          ctx.beginPath();
          ctx.fillStyle = "#fbbf24"; // Straw color
          ctx.ellipse(centerX, centerY + 15, 38, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(centerX, centerY + 5, 22, Math.PI, 0, false);
          ctx.fillStyle = "#fbbf24";
          ctx.fill();

          // Red Ribbon
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(centerX - 21, centerY + 4, 42, 6);

          // Waves
          ctx.strokeStyle = "#06b6d4";
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i < width; i += 10) {
            const y = 145 + Math.sin(i * 0.05 + timeFactor * 3) * 6;
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
          }
          ctx.stroke();

        } else if (currentQuestion.artType === "aot") {
          // Three Concentric Walls + Blue/White overlap Wing
          const centerX = width / 2;
          const centerY = height / 2;

          // Wall backgrounds
          ctx.strokeStyle = "rgba(156, 163, 175, 0.4)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
          ctx.arc(centerX, centerY, 55, 0, Math.PI * 2);
          ctx.stroke();

          // Wings of Freedom (Blue & White vector triangles)
          ctx.fillStyle = "#3b82f6"; // Blue wing
          ctx.beginPath();
          ctx.moveTo(centerX - 15, centerY - 25);
          ctx.lineTo(centerX, centerY - 15);
          ctx.lineTo(centerX - 5, centerY + 15);
          ctx.lineTo(centerX - 25, centerY + 5);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#ffffff"; // White wing overlay
          ctx.beginPath();
          ctx.moveTo(centerX + 15, centerY - 20);
          ctx.lineTo(centerX, centerY - 10);
          ctx.lineTo(centerX + 5, centerY + 20);
          ctx.lineTo(centerX + 25, centerY + 10);
          ctx.closePath();
          ctx.fill();

          // Titan smoke effect
          ctx.fillStyle = "rgba(239, 68, 68, 0.2)";
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const sy = centerY + Math.sin(timeFactor + i) * 35;
            ctx.arc(centerX - 60 + i * 30, sy + 30, 15, 0, Math.PI * 2);
            ctx.fill();
          }

        } else if (currentQuestion.artType === "death_note") {
          // Dark Notebook outline + glowing purple book cover
          const centerX = width / 2;
          const centerY = height / 2;

          const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 80);
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          // Draw Notebook
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(centerX - 35, centerY - 50, 70, 95);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(centerX - 35, centerY - 50, 70, 95);

          // Notebook binding spirals
          ctx.fillStyle = "#cbd5e1";
          for (let i = 0; i < 6; i++) {
            ctx.fillRect(centerX - 39, centerY - 40 + i * 15, 7, 3);
          }

          // Crimson apple on bottom corner
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(centerX + 40, centerY + 30, 12, 0, Math.PI * 2);
          ctx.fill();
          // Stem
          ctx.strokeStyle = "#854d0e";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(centerX + 40, centerY + 18);
          ctx.quadraticCurveTo(centerX + 43, centerY + 12, centerX + 46, centerY + 14);
          ctx.stroke();

        } else if (currentQuestion.artType === "demon_slayer") {
          // Green & Black Checkerboard box + Glowing Pink Cherry Blossom
          const centerX = width / 2;
          const centerY = height / 2;

          // Draw 4x4 checkers grid in a center box
          const boxSize = 70;
          const startX = centerX - boxSize / 2;
          const startY = centerY - boxSize / 2;
          const cellSize = boxSize / 4;

          for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
              ctx.fillStyle = (row + col) % 2 === 0 ? "#065f46" : "#111827"; // Dark Green vs Black
              ctx.fillRect(startX + col * cellSize, startY + row * cellSize, cellSize, cellSize);
            }
          }

          // Overlay cherry blossom star
          ctx.fillStyle = "rgba(244, 114, 182, 0.8)";
          ctx.beginPath();
          ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
          ctx.fill();

          // Diagonal water ripple cut
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(centerX - 60, centerY + 30 + Math.sin(timeFactor * 3) * 5);
          ctx.lineTo(centerX + 60, centerY - 30 + Math.sin(timeFactor * 3) * 5);
          ctx.stroke();

        } else if (currentQuestion.artType === "jjk") {
          // Double crossed neon purple domains + Gojo's Eye
          const centerX = width / 2;
          const centerY = height / 2;

          // Black domain background
          const radGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 75);
          radGrad.addColorStop(0, '#7c3aed');
          radGrad.addColorStop(0.5, '#1e1b4b');
          radGrad.addColorStop(1, '#090514');
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 55, 0, Math.PI * 2);
          ctx.fill();

          // Satoru's bright blue neon eye slice
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 4;
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, 24, 7, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset

        } else if (currentQuestion.artType === "dbz") {
          // Golden Dragon Ball with stars + Super Saiyan electric yellow fire
          const centerX = width / 2;
          const centerY = height / 2;

          // Aura particles
          ctx.fillStyle = `rgba(253, 224, 71, ${0.1 + Math.random() * 0.2})`;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 45 + Math.sin(timeFactor * 8) * 12, 0, Math.PI * 2);
          ctx.fill();

          // Dragon ball sphere
          const ballGrad = ctx.createRadialGradient(centerX - 10, centerY - 10, 2, centerX, centerY, 30);
          ballGrad.addColorStop(0, '#fef08a');
          ballGrad.addColorStop(0.6, '#f97316');
          ballGrad.addColorStop(1, '#ea580c');
          ctx.fillStyle = ballGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 26, 0, Math.PI * 2);
          ctx.fill();

          // Draw four stars inside
          ctx.fillStyle = "#ef4444";
          ctx.font = "12px sans-serif";
          ctx.fillText("★", centerX - 10, centerY - 4);
          ctx.fillText("★", centerX + 3, centerY - 4);
          ctx.fillText("★", centerX - 10, centerY + 8);
          ctx.fillText("★", centerX + 3, centerY + 8);

        } else if (currentQuestion.artType === "mha") {
          // Blue and yellow glowing letter A with green spark aura
          const centerX = width / 2;
          const centerY = height / 2;

          ctx.fillStyle = "rgba(74, 222, 128, 0.15)";
          for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            const angle = (i * Math.PI / 3) + timeFactor;
            ctx.arc(centerX + Math.cos(angle) * 40, centerY + Math.sin(angle) * 30, 8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Drawing huge stylized symbol "A" with shield style
          ctx.fillStyle = "#3b82f6";
          ctx.beginPath();
          ctx.moveTo(centerX - 30, centerY + 35);
          ctx.lineTo(centerX - 5, centerY - 40);
          ctx.lineTo(centerX + 5, centerY - 40);
          ctx.lineTo(centerX + 30, centerY + 35);
          ctx.lineTo(centerX + 15, centerY + 35);
          ctx.lineTo(centerX + 8, centerY + 10);
          ctx.lineTo(centerX - 8, centerY + 10);
          ctx.lineTo(centerX - 15, centerY + 35);
          ctx.closePath();
          ctx.fill();

          // Red belt line
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(centerX - 12, centerY + 15, 24, 5);

          // All Might Yellow Hair Antennae
          ctx.strokeStyle = "#eab308";
          ctx.lineWidth = 5;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(centerX - 15, centerY - 38);
          ctx.quadraticCurveTo(centerX - 35, centerY - 65, centerX - 55, centerY - 55);
          ctx.moveTo(centerX + 15, centerY - 38);
          ctx.quadraticCurveTo(centerX + 35, centerY - 65, centerX + 55, centerY - 55);
          ctx.stroke();

        } else if (currentQuestion.artType === "sao") {
          // Two Crossed Swords (teal and black) inside cyber grid
          const centerX = width / 2;
          const centerY = height / 2;

          // Teal Sword (Lambent Light)
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(Math.PI / 4 + Math.sin(timeFactor) * 0.1);
          ctx.strokeStyle = "#2dd4bf";
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(0, -50);
          ctx.lineTo(0, 30);
          ctx.stroke();
          // Hilt
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-6, 30, 12, 4);
          ctx.fillStyle = "#2dd4bf";
          ctx.fillRect(-2, 34, 4, 15);
          ctx.restore();

          // Black Sword (Elucidator)
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(-Math.PI / 4 - Math.sin(timeFactor) * 0.1);
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(0, -50);
          ctx.lineTo(0, 30);
          ctx.stroke();
          // Hilt
          ctx.fillStyle = "#e2e8f0";
          ctx.fillRect(-8, 30, 16, 5);
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(-3, 35, 6, 15);
          ctx.restore();

        } else if (currentQuestion.artType === "your_name") {
          // Starry sky background with two crossing shooting stars
          const centerX = width / 2;
          const centerY = height / 2;

          // Blue & Violet cosmic gradient
          const grad = ctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(0.5, '#311042');
          grad.addColorStop(1, '#090514');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Stars
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          for (let i = 0; i < 15; i++) {
            const sx = (i * 37) % width;
            const sy = (i * i * 19) % height;
            ctx.fillRect(sx, sy, 1.5, 1.5);
          }

          // Blue Comet
          ctx.shadowColor = "#06b6d4";
          ctx.shadowBlur = 10;
          ctx.strokeStyle = "rgba(6, 182, 212, 0.8)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          const cx1 = centerX - 80 + Math.sin(timeFactor) * 10;
          const cy1 = centerY - 50 + Math.cos(timeFactor) * 5;
          ctx.moveTo(cx1, cy1);
          ctx.lineTo(cx1 + 60, cy1 + 60);
          ctx.stroke();

          // Red/Pink Comet crossing
          ctx.shadowColor = "#ec4899";
          ctx.shadowBlur = 10;
          ctx.strokeStyle = "rgba(236, 72, 153, 0.8)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          const cx2 = centerX + 80 - Math.sin(timeFactor) * 10;
          const cy2 = centerY - 50 + Math.cos(timeFactor) * 5;
          ctx.moveTo(cx2, cy2);
          ctx.lineTo(cx2 - 60, cy2 + 60);
          ctx.stroke();

          ctx.shadowBlur = 0; // reset

        } else if (currentQuestion.artType === "spirited_away") {
          // Lanterns floating + Haku Dragon shape or soot sprites
          const centerX = width / 2;
          const centerY = height / 2;

          // Soft river gradient background
          const river = ctx.createLinearGradient(0, 0, 0, height);
          river.addColorStop(0, "#082f49");
          river.addColorStop(1, "#0369a1");
          ctx.fillStyle = river;
          ctx.fillRect(0, 0, width, height);

          // Floating red lanterns
          for (let i = 0; i < 4; i++) {
            const lx = 40 + i * 90 + Math.sin(timeFactor + i) * 10;
            const ly = 35 + Math.cos(timeFactor * 1.5 + i) * 15;
            
            // Glow
            ctx.fillStyle = "rgba(249, 115, 22, 0.3)";
            ctx.beginPath();
            ctx.arc(lx, ly, 15, 0, Math.PI * 2);
            ctx.fill();

            // Lantern body
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(lx - 6, ly - 10, 12, 18);
            // Gold trim
            ctx.fillStyle = "#eab308";
            ctx.fillRect(lx - 6, ly - 12, 12, 2);
            ctx.fillRect(lx - 6, ly + 8, 12, 2);
          }

          // Soot sprites (little black balls with white eyes)
          ctx.fillStyle = "#111827";
          ctx.beginPath();
          ctx.arc(centerX - 50, centerY + 40, 10, 0, Math.PI * 2);
          ctx.arc(centerX + 60, centerY + 45, 8, 0, Math.PI * 2);
          ctx.fill();

          // Eyes
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(centerX - 53, centerY + 38, 3, 0, Math.PI * 2);
          ctx.arc(centerX - 47, centerY + 38, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#000000";
          ctx.beginPath();
          ctx.arc(centerX - 53, centerY + 38, 1, 0, Math.PI * 2);
          ctx.arc(centerX - 47, centerY + 38, 1, 0, Math.PI * 2);
          ctx.fill();

        } else {
          // Default cool futuristic gaming dynamic shield badge
          const centerX = width / 2;
          const centerY = height / 2;

          const circleGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 60);
          circleGrad.addColorStop(0, '#10b981');
          circleGrad.addColorStop(1, '#0c131d');
          ctx.fillStyle = circleGrad;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
          ctx.fill();

          // Glowing hacker bracket
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 38, -Math.PI / 4, Math.PI / 4, false);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(centerX, centerY, 38, Math.PI * 3/4, Math.PI * 5/4, false);
          ctx.stroke();

          // Floating neon star
          ctx.fillStyle = "#ffffff";
          ctx.font = "18px sans-serif";
          ctx.fillText("✨", centerX - 10, centerY + 6);
        }

        ctx.restore();

        // Draw animated cyber particle effects on top
        particles.forEach((p) => {
          p.y += p.vy;
          p.x += p.vx;

          if (p.y < 0) {
            p.y = height;
            p.x = Math.random() * width;
          }
          if (p.x < 0 || p.x > width) {
            p.vx *= -1;
          }

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId.current = requestAnimationFrame(drawProceduralArt);
    };

    // Run custom animation
    animationFrameId.current = requestAnimationFrame(drawProceduralArt);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, currentIndex, unlockedHints, feedback, currentQuestion]);

  return (
    <div id="anime-guess-game-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none bg-[#0a0f18]/85 backdrop-blur-md">
      
      {/* Container Card */}
      <div className="bg-[#0c1624] text-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-600/50 flex flex-col relative font-sans max-h-[92vh]">
        
        {/* Top bar with level stats, streak points, and closing X */}
        <div className="px-6 py-4 bg-[#111e32] border-b border-purple-500/20 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-purple-300">
                {isMn ? "Болдын Аниме Ертөнц 🎮" : "Bold's Anime Realm 🎮"}
              </h2>
              <p className="text-[10px] font-mono text-gray-400">
                {isMn ? `Шанс: ${lives} ❤️ • Одоогийн рекорд: ${highScore}` : `Lives: ${lives} ❤️ • High Score: ${highScore}`}
              </p>
            </div>
          </div>

          {/* Sound Toggle & Closing */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                triggerSound('click');
                setSoundEnabled(!soundEnabled);
              }}
              className="p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 transition-colors"
              title={soundEnabled ? "Хаах" : "Асаах"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
            </button>
            <button
              onClick={() => {
                triggerSound('click');
                onClose();
              }}
              className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors cursor-pointer"
              aria-label="Хаах"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Game Screens */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col justify-center min-h-[380px]">
          
          {/* SCREEN 1: Welcome / Mode Selection Screen */}
          {!isPlaying && (
            <div className="text-center py-6 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4"
              >
                <Sparkles className="w-9 h-9 text-white animate-pulse" />
              </motion.div>

              <h1 className="text-2xl font-black tracking-tight text-white mb-2">
                {isMn ? "АНИМЕ ТААГЧ ТОГЛООМ" : "ANIME GUESSING GAME"}
              </h1>
              <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
                {isMn 
                  ? "Янз бүрийн хөгжилтэй горимуудыг сонгон аниме тааж, өөрийн Отаку цолыг ахиулаарай! 9 настай Болдод зориулсан тусгай хувилбар." 
                  : "Choose from various interactive modes, solve anime riddles, and increase your Otaku rank! Customized version for Bold."}
              </p>

              {/* Grid of game modes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                
                {/* 1. Classic Trivia */}
                <button
                  onClick={() => startGame('classic')}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-800/40 hover:bg-purple-600/10 border border-gray-700/60 hover:border-purple-500/40 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <div className="p-2 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 text-purple-400 shrink-0">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-purple-300">
                      {isMn ? "Сонгодог тривиа" : "Classic Trivia"}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {isMn ? "Студи, жанр, богино түүхийг нээж таах горим" : "Reveal studio, genre, and plot details to guess"}
                    </p>
                  </div>
                </button>

                {/* 2. Quote Mode */}
                <button
                  onClick={() => startGame('quote')}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-800/40 hover:bg-cyan-600/10 border border-gray-700/60 hover:border-cyan-500/40 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <div className="p-2 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-400 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-cyan-300">
                      {isMn ? "Алдарт ишлэл таах" : "Famous Quotes"}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {isMn ? "Аниме баатрын хэлсэн алдартай ишлэлээр таах" : "Guess the anime based on iconic character quotes"}
                    </p>
                  </div>
                </button>

                {/* 3. Emoji Mode */}
                <button
                  onClick={() => startGame('emoji')}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-800/40 hover:bg-pink-600/10 border border-gray-700/60 hover:border-pink-500/40 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <div className="p-2 rounded-xl bg-pink-500/10 group-hover:bg-pink-500/20 text-pink-400 shrink-0">
                    <Smile className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-pink-300">
                      {isMn ? "Эможи оньсого" : "Emoji Riddles"}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {isMn ? "3-4 ширхэг эможиноос анимег нэрлэх" : "Deduce the anime from an emoji combination"}
                    </p>
                  </div>
                </button>

                {/* 4. Character Mode */}
                <button
                  onClick={() => startGame('character')}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-800/40 hover:bg-emerald-600/10 border border-gray-700/60 hover:border-emerald-500/40 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <div className="p-2 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-emerald-300">
                      {isMn ? "Баатрын дүрүүд" : "Character Clues"}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {isMn ? "Гол дүрүүдийн нэрс болон чадвараар таах" : "Identify the anime using famous characters"}
                    </p>
                  </div>
                </button>

              </div>

              {/* Personal Record Indicator */}
              <div className="mt-8 bg-gray-800/30 px-5 py-2.5 rounded-2xl border border-gray-700/40 text-xs flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>
                  {isMn ? `Болдын хувийн дээд амжилт: ${highScore} оноо` : `Bold's Personal Best: ${highScore} Points`}
                </span>
              </div>
            </div>
          )}

          {/* SCREEN 2: Active Gameplay Board */}
          {isPlaying && !isGameOverState && !isVictory && currentQuestion && (
            <div className="flex flex-col gap-4">
              
              {/* HUD Header stats: Streak, Score, Hearts, Golden Help */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-900/40 p-3 rounded-2xl border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="text-xs">
                    <span className="text-gray-400 mr-1 font-mono">RANK:</span>
                    <span className="text-yellow-400 font-bold">{rankName}</span>
                  </div>
                  <div className="h-4 w-[1px] bg-gray-700" />
                  <div className="text-xs">
                    <span className="text-gray-400 mr-1 font-mono">XP:</span>
                    <span className="text-purple-400 font-bold">{score}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Streak bonus counter */}
                  {streak > 0 && (
                    <div className="px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-[10px] font-bold text-orange-400 flex items-center gap-1 animate-bounce">
                      <Zap className="w-3 h-3 fill-orange-400" />
                      <span>{streak} Streak!</span>
                    </div>
                  )}

                  {/* Hearts */}
                  <div className="flex items-center gap-1 bg-red-950/40 px-2.5 py-1 rounded-xl border border-red-900/40">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Heart 
                        key={i} 
                        className={`w-4 h-4 ${i < lives ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} 
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Question Display according to GameMode */}
              <div className="bg-gray-900/30 rounded-2xl p-4 border border-gray-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-purple-400 font-mono">
                    {isMn ? `Асуулт ${currentIndex + 1} / ${questions.length}` : `Question ${currentIndex + 1} of ${questions.length}`}
                  </span>
                  
                  {/* Obfuscated word display to guide spelling */}
                  <div className="text-xs font-mono tracking-widest bg-gray-800/60 px-3 py-1 rounded-xl border border-gray-700/60 text-yellow-300">
                    {letterReveal}
                  </div>
                </div>

                {/* Main Hint Board depending on Active Mode */}
                <div className="min-h-[70px] flex flex-col justify-center py-2">
                  {gameMode === 'classic' && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold leading-relaxed text-gray-200">
                        <span className="text-purple-400 font-bold mr-1 font-mono">STORY:</span> 
                        {isMn ? currentQuestion.plotHint.mn : currentQuestion.plotHint.en}
                      </div>
                    </div>
                  )}

                  {gameMode === 'quote' && (
                    <div className="bg-cyan-950/20 p-3.5 rounded-xl border border-cyan-500/20 relative">
                      <div className="absolute top-1 right-2 text-cyan-500/20 text-3xl font-serif font-black select-none pointer-events-none">“</div>
                      <p className="text-sm italic font-medium leading-relaxed text-cyan-200">
                        "{isMn ? currentQuestion.quotes.mn : currentQuestion.quotes.en}"
                      </p>
                    </div>
                  )}

                  {gameMode === 'emoji' && (
                    <div className="text-center py-3">
                      <div className="text-4xl tracking-widest bg-pink-950/10 p-4 rounded-2xl inline-block border border-pink-500/10 animate-pulse">
                        {currentQuestion.emojis}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">
                        {isMn ? "Эдгээр эможи ямар анимег илтгэж байна вэ?" : "Which anime do these emojis represent?"}
                      </p>
                    </div>
                  )}

                  {gameMode === 'character' && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-gray-400 font-mono">FAMOUS CHARACTERS:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentQuestion.characters.map((char, index) => (
                          <span key={index} className="px-3 py-1 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-medium">
                            👤 {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progressive Hints Unlocking Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1 border-t border-gray-800/80 pt-3">
                  
                  {/* Genre Clue */}
                  <button
                    onClick={() => unlockHint('genres')}
                    disabled={unlockedHints.includes('genres')}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors border ${
                      unlockedHints.includes('genres')
                        ? 'bg-purple-950/20 border-purple-900/30 text-purple-300'
                        : 'bg-gray-800/80 border-gray-700/60 hover:border-purple-500/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-purple-400" />
                      <span>{isMn ? "Жанр" : "Genres"}</span>
                    </div>
                    {unlockedHints.includes('genres') ? (
                      <span className="font-bold text-[10px] text-purple-400 max-w-[54px] truncate" title={currentQuestion.genres.join(', ')}>
                        {currentQuestion.genres[0]}
                      </span>
                    ) : (
                      <Lock className="w-3 h-3 text-gray-500" />
                    )}
                  </button>

                  {/* Studio Clue */}
                  <button
                    onClick={() => unlockHint('studio')}
                    disabled={unlockedHints.includes('studio')}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors border ${
                      unlockedHints.includes('studio')
                        ? 'bg-purple-950/20 border-purple-900/30 text-purple-300'
                        : 'bg-gray-800/80 border-gray-700/60 hover:border-purple-500/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-pink-400" />
                      <span>{isMn ? "Студи" : "Studio"}</span>
                    </div>
                    {unlockedHints.includes('studio') ? (
                      <span className="font-bold text-[10px] text-pink-400 max-w-[54px] truncate" title={currentQuestion.studio}>
                        {currentQuestion.studio}
                      </span>
                    ) : (
                      <Lock className="w-3 h-3 text-gray-500" />
                    )}
                  </button>

                  {/* Year Clue */}
                  <button
                    onClick={() => unlockHint('year')}
                    disabled={unlockedHints.includes('year')}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors border ${
                      unlockedHints.includes('year')
                        ? 'bg-purple-950/20 border-purple-900/30 text-purple-300'
                        : 'bg-gray-800/80 border-gray-700/60 hover:border-purple-500/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      <span>{isMn ? "Оноо" : "Year"}</span>
                    </div>
                    {unlockedHints.includes('year') ? (
                      <span className="font-bold text-[10px] text-yellow-400">
                        {currentQuestion.year}
                      </span>
                    ) : (
                      <Lock className="w-3 h-3 text-gray-500" />
                    )}
                  </button>

                  {/* Visual Art Reveal (The most fun one!) */}
                  <button
                    onClick={() => unlockHint('visual')}
                    disabled={unlockedHints.includes('visual')}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors border ${
                      unlockedHints.includes('visual')
                        ? 'bg-purple-950/20 border-purple-900/30 text-purple-300'
                        : 'bg-gray-800/80 border-gray-700/60 hover:border-purple-500/40 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isMn ? "Зураг" : "Visual"}</span>
                    </div>
                    {unlockedHints.includes('visual') ? (
                      <span className="font-bold text-[10px] text-cyan-400">{isMn ? "Нээлттэй" : "Unlocked"}</span>
                    ) : (
                      <Lock className="w-3 h-3 text-gray-500" />
                    )}
                  </button>

                </div>

              </div>

              {/* PROCEDURAL VISUAL GAME SCREEN (Draws animated canvas with dynamic blur) */}
              <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 bg-black/40 h-[180px] flex items-center justify-center">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full block" 
                  style={{ 
                    filter: unlockedHints.includes('visual') ? 'none' : 'blur(1px)' 
                  }}
                />
                
                {/* Visual Reveal Overlay Info */}
                {!unlockedHints.includes('visual') && (
                  <div className="absolute top-2.5 left-3.5 bg-black/60 px-2 py-0.5 rounded text-[9px] text-gray-400 font-mono tracking-wider">
                    REVEAL VISUAL SIGNAL FOR -15 XP
                  </div>
                )}
              </div>

              {/* INPUT SECTION (Fuzzy Text input OR Multiple Choice Selection Buttons) */}
              <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{isMn ? "ХАРИУЛАХ ХЭЛБЭР СОНГОХ:" : "SELECT INPUT METHOD:"}</span>
                  <div className="flex bg-gray-800/80 p-0.5 rounded-lg border border-gray-700">
                    <button
                      onClick={() => { triggerSound('click'); setInputMode('choice'); }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${inputMode === 'choice' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      {isMn ? "Сонголтоор" : "Choices"}
                    </button>
                    <button
                      onClick={() => { triggerSound('click'); setInputMode('text'); }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${inputMode === 'text' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                      {isMn ? "Шууд бичих" : "Direct Input"}
                    </button>
                  </div>
                </div>

                {/* Submitting Interface */}
                <AnimatePresence mode="wait">
                  {feedback ? (
                    /* FEEDBACK NOTIFICATION AREA */
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                        feedback.isCorrect
                          ? 'bg-green-950/30 border-green-500/40 text-green-300'
                          : 'bg-red-950/30 border-red-500/40 text-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {feedback.isCorrect ? (
                          <Check className="w-5 h-5 text-green-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                        )}
                        <p className="text-xs font-semibold">{feedback.text}</p>
                      </div>

                      <button
                        onClick={nextQuestion}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0 shadow-lg"
                      >
                        <span>{isMn ? "Дараагийнх" : "Next"}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ) : (
                    /* INTERACTIVE GUESS BOARD AREA */
                    <motion.div
                      key="guess-inputs"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {inputMode === 'choice' ? (
                        /* MULTIPLE CHOICE GRID BUTTONS */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {choices.map((opt, i) => (
                            <button
                              key={i}
                              onClick={() => handleAnswerSubmit(opt)}
                              className="px-4 py-3 rounded-xl bg-gray-800/80 hover:bg-purple-600/20 hover:border-purple-500 text-left border border-gray-700/60 font-medium text-xs sm:text-sm text-gray-200 transition-all hover:translate-x-1 active:scale-[0.98] cursor-pointer"
                            >
                              <span className="text-purple-400 mr-2 font-mono">{(i+1)}.</span> {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        /* DIRECT TEXT INPUT FORM */
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleAnswerSubmit(); }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={guessInput}
                            onChange={(e) => setGuessInput(e.target.value)}
                            placeholder={isMn ? "Аниме нэр эсвэл гол дүрийг бичнэ үү..." : "Type anime title or character name..."}
                            className={`flex-1 bg-gray-900 border px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-500 ${isWrongAnimation ? 'border-red-500 animate-shake' : 'border-gray-700'}`}
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-purple-500/10 shrink-0 cursor-pointer"
                          >
                            {isMn ? "Илгээх ⚡" : "Submit ⚡"}
                          </button>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Golden Reveal Hint Assistant */}
                {!feedback && (
                  <div className="mt-2 flex items-center justify-between border-t border-gray-800/60 pt-2.5">
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Info className="w-3 h-3 text-purple-400" />
                      <span>{isMn ? "Бага зэрэг үсгийн алдаатай бичсэн ч зөв гэж тооцох болно!" : "Fuzzy-typing helper is active!"}</span>
                    </p>

                    <button
                      onClick={revealGoldenLetter}
                      disabled={goldenHintsLeft <= 0}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        goldenHintsLeft <= 0
                          ? 'bg-gray-800/20 border-gray-800 text-gray-500'
                          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                      }`}
                      title={isMn ? "Үсэг ил болгох" : "Reveal letters"}
                    >
                      <Sparkle className="w-3.5 h-3.5 fill-yellow-400" />
                      <span>{isMn ? `Шидэт үсэг (${goldenHintsLeft})` : `Golden Help (${goldenHintsLeft})`}</span>
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* SCREEN 3: GAME OVER SCREEN */}
          {isPlaying && isGameOverState && (
            <div className="text-center py-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4 animate-pulse">
                <AlertCircle className="w-9 h-9" />
              </div>

              <h2 className="text-2xl font-black text-red-500 mb-2">
                {isMn ? "ТОГЛООМ ДУУСЛАА!" : "GAME OVER!"}
              </h2>
              <p className="text-sm text-gray-300 max-w-xs mb-6">
                {isMn 
                  ? `Болдын сүүлчийн амь дууслаа. Гэхдээ битгий бууж өгөөрэй! Та ${score} XP оноо цуглууллаа.` 
                  : `You ran out of lives. But don't give up, try again! You accumulated ${score} XP.`}
              </p>

              {/* Rank Reward */}
              <div className="bg-gray-900/60 p-4 rounded-2xl border border-purple-500/20 max-w-sm mb-8 w-full">
                <p className="text-[10px] text-gray-400 font-mono">YOUR REWARD TITLE:</p>
                <p className="text-lg font-black text-yellow-400 mt-1">{rankName}</p>
                <div className="h-[1px] bg-gray-800 my-2.5" />
                <p className="text-xs text-gray-400">
                  {isMn ? "Эргэн аялалдаа нэгдээрэй, Отаку дайчин!" : "Jump back into your quest, Otaku warrior!"}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(gameMode)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 active:scale-95 rounded-xl text-xs font-bold text-white transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isMn ? "Дахин оролдох" : "Try Again"}</span>
                </button>
                <button
                  onClick={() => setIsPlaying(false)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-xl text-xs font-bold text-gray-300 transition-all border border-gray-700 cursor-pointer"
                >
                  {isMn ? "Горим Сонгох" : "Exit to Menu"}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 4: COMPLETE VICTORY SCREEN */}
          {isPlaying && isVictory && (
            <div className="text-center py-8 flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-yellow-500 to-amber-400 flex items-center justify-center text-white mb-4 shadow-xl shadow-yellow-500/20 animate-bounce">
                <Trophy className="w-10 h-10 fill-amber-300" />
              </div>

              <h2 className="text-2xl font-black text-yellow-400 mb-2">
                {isMn ? "ДОМОГТ ОТАКУ СУУТ VICTORY! 👑" : "COMPLETE OTACU VICTORY! 👑"}
              </h2>
              <p className="text-sm text-gray-300 max-w-sm mb-6 leading-relaxed">
                {isMn 
                  ? `Гайхалтай! Та анимеguessing тоглоомын бүх асуултанд амжилттай хариуллаа! Нийт ${score} XP оноогоор манай шилдэг тоглогч боллоо.` 
                  : `Amazing! You successfully cleared all anime trivia cards! With a final score of ${score} XP, you are our true Otaku Champion.`}
              </p>

              {/* Rank Showcase */}
              <div className="bg-gray-900/60 p-5 rounded-2xl border border-yellow-500/30 max-w-sm mb-8 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-yellow-500/5 animate-pulse" />
                <p className="text-[10px] text-yellow-500 font-mono font-black tracking-widest uppercase">OTAKU EMPEROR UNLOCKED</p>
                <p className="text-2xl font-black text-white mt-1.5">{rankName}</p>
                <div className="h-[1px] bg-gray-800 my-3" />
                <p className="text-xs text-gray-400">
                  {isMn ? "Болдын бүртгэлийг үүрд хамгаалж, аваргуудын танхимд нэрээ үлдээлээ!" : "Your name has been forever etched into the Hall of Fame!"}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => startGame(gameMode)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 active:scale-95 rounded-xl text-xs font-bold text-white transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{isMn ? "Дахин тоглуулах" : "Replay Pack"}</span>
                </button>
                <button
                  onClick={() => setIsPlaying(false)}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-xl text-xs font-bold text-gray-300 transition-all border border-gray-700 cursor-pointer"
                >
                  {isMn ? "Баяртай" : "Back to Main"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer info explaining scoring and help triggers */}
        <div className="px-6 py-3 bg-[#0a0f18]/90 border-t border-purple-500/10 text-[10px] text-gray-500 font-mono text-center flex items-center justify-between">
          <span>VAULTSHIELD RETRO ARCADE v2.4</span>
          <span>© 2026 ZEPHYR LABS</span>
        </div>

      </div>
    </div>
  );
}

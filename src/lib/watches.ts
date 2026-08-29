import watchGreen from "@/assets/watch-green.jpg.asset.json";
import watchBlack from "@/assets/watch-black.jpg.asset.json";
import watchCarbon from "@/assets/watch-carbon.jpg.asset.json";
import watchBlue from "@/assets/watch-blue.jpg.asset.json";
import watchNavy from "@/assets/watch-navy.jpg.asset.json";
import watchPink from "@/assets/watch-pink.jpg.asset.json";
import watchGold from "@/assets/watch-gold.jpg.asset.json";
import watchOrange from "@/assets/watch-orange.jpg.asset.json";
import watchPurple from "@/assets/watch-purple.jpg.asset.json";
import watchMaroon from "@/assets/watch-maroon.jpg.asset.json";

export type WatchSpecs = {
  case: string;
  strap: string;
  battery: string;
  water: string;
  display: string;
};

export type WatchModel = {
  id: string;
  name: string;
  tagline: string;
  category: "رجالي" | "نسائي";
  badge: "حصري" | "جديد" | "الأكثر طلباً";
  image: string;
  specs: WatchSpecs;
};

export const WATCHES: WatchModel[] = [
  {
    id: "black",
    name: "نبض أونيكس برو",
    tagline: "أناقة الأسود المطلق بإطار ألومنيوم مصقول",
    category: "رجالي",
    badge: "الأكثر طلباً",
    image: watchBlack.url,
    specs: {
      case: "46 مم — ألومنيوم أونيكس",
      strap: "سيليكون فلوروإيلاستومر أسود",
      battery: "7 أيام",
      water: "5 ATM",
      display: 'AMOLED 1.43"',
    },
  },
  {
    id: "green",
    name: "نبض الأهرام إديشن",
    tagline: "إصدار محدود بلمسة ذهبية فرعونية",
    category: "رجالي",
    badge: "حصري",
    image: watchGreen.url,
    specs: {
      case: "46 مم — ألومنيوم زمردي",
      strap: "سيليكون زيتوني بتطعيم ذهبي",
      battery: "7 أيام",
      water: "5 ATM",
      display: 'AMOLED 1.43"',
    },
  },
  {
    id: "carbon",
    name: "نبض كربون سبورت",
    tagline: "ألياف كربون خفيفة وسوار جلد بخياطة حمراء",
    category: "رجالي",
    badge: "جديد",
    image: watchCarbon.url,
    specs: {
      case: "47 مم — ألياف كربون",
      strap: "جلد إيطالي أسود",
      battery: "9 أيام",
      water: "10 ATM",
      display: 'AMOLED 1.45"',
    },
  },
  {
    id: "navy",
    name: "نبض ميدنايت ستيل",
    tagline: "ستانلس ستيل بلمسات فضية هادئة",
    category: "رجالي",
    badge: "جديد",
    image: watchNavy.url,
    specs: {
      case: "45 مم — ستانلس ستيل 316L",
      strap: "سيليكون كحلي",
      battery: "6 أيام",
      water: "5 ATM",
      display: 'AMOLED 1.39"',
    },
  },
  {
    id: "blue",
    name: "نبض أزور اير",
    tagline: "خفة الألومنيوم بإطلالة سماوية منعشة",
    category: "نسائي",
    badge: "جديد",
    image: watchBlue.url,
    specs: {
      case: "42 مم — ألومنيوم أزور",
      strap: "سيليكون سماوي حريري",
      battery: "6 أيام",
      water: "5 ATM",
      display: 'AMOLED 1.32"',
    },
  },
  {
    id: "orange",
    name: "نبض سولار تيتان",
    tagline: "تيتانيوم بلون شمسي للأداء الرياضي",
    category: "رجالي",
    badge: "حصري",
    image: watchOrange.url,
    specs: {
      case: "46 مم — تيتانيوم درجة 2",
      strap: "سيليكون برتقالي عالي المرونة",
      battery: "8 أيام",
      water: "5 ATM",
      display: 'AMOLED 1.43"',
    },
  },
  {
    id: "purple",
    name: "نبض أوركيد ميش",
    tagline: "بنفسجي جريء مع سوار شبك ميلانو",
    category: "نسائي",
    badge: "حصري",
    image: watchPurple.url,
    specs: {
      case: "42 مم — ألومنيوم أوركيد",
      strap: "شبك معدني ميلانو",
      battery: "6 أيام",
      water: "3 ATM",
      display: 'AMOLED 1.32"',
    },
  },
  {
    id: "pink",
    name: "نبض روز بلوم",
    tagline: "تصميم ناعم بروح عصرية مميزة",
    category: "نسائي",
    badge: "الأكثر طلباً",
    image: watchPink.url,
    specs: {
      case: "41 مم — ألومنيوم فضي بلاتيني",
      strap: "سيليكون وردي لؤلؤي",
      battery: "6 أيام",
      water: "3 ATM",
      display: 'AMOLED 1.28"',
    },
  },
  {
    id: "gold",
    name: "نبض إمبريال جولد",
    tagline: "ستانلس ذهبي مع جلد بيج فاخر",
    category: "نسائي",
    badge: "حصري",
    image: watchGold.url,
    specs: {
      case: "42 مم — ستانلس ستيل مطلي ذهباً",
      strap: "جلد نابا بيج",
      battery: "7 أيام",
      water: "5 ATM",
      display: 'AMOLED 1.32"',
    },
  },
  {
    id: "maroon",
    name: "نبض روزت رويال",
    tagline: "ذهبي وردي مع جلد نبيتي ملكي",
    category: "نسائي",
    badge: "جديد",
    image: watchMaroon.url,
    specs: {
      case: "42 مم — ذهبي وردي",
      strap: "جلد نبيتي مصقول",
      battery: "7 أيام",
      water: "5 ATM",
      display: 'AMOLED 1.32"',
    },
  },
];

export const COLOR_CHOICES = WATCHES.filter((w) =>
  ["black", "green", "gold", "blue"].includes(w.id),
);

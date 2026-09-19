export type Language = "fr" | "en";

export interface Translations {
  nav: {
    howItWorks: string;
    reviews: string;
    faq: string;
    login: string;
    startFree: string;
  };
  hero: {
    badge: string;
    titlePrefix: string;
    words: string[];
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustBadges: {
      free: string;
      noCard: string;
      time: string;
    };
    socialProof: {
      rating: string;
      quote: string;
    };
    mockup: {
      welcome: string;
      welcomeSub: string;
      payCycleTitle: string;
      payCycleDate: string;
      payCycleCalc: string;
      daysRemaining: string;
      dayUnit: string;
      dailyBudgetAuthorized: string;
      recalculatedDirect: string;
      simSliderLabel: string;
      totalBalance: string;
      spentToday: string;
      criticalWarning: string;
      quickAddPlaceholder: string;
      quickAddBtn: string;
    };
  };
  comparison: {
    title: string;
    subtitle: string;
    card1Badge: string;
    card1Title: string;
    card1Desc: string;
    card2Badge: string;
    card2Title: string;
    card2Desc: string;
    card3Badge: string;
    card3Title: string;
    card3Desc: string;
    card4Badge: string;
    card4Title: string;
    card4Desc: string;
  };
  howItWorks: {
    badge: string;
    title: string;
    subtitle: string;
    step1Num: string;
    step1Title: string;
    step1Desc: string;
    step2Num: string;
    step2Title: string;
    step2Desc: string;
    step3Num: string;
    step3Title: string;
    step3Desc: string;
  };
  features: {
    badge: string;
    title: string;
    subtitle: string;
    feat1Title: string;
    feat1Desc: string;
    feat2Title: string;
    feat2Desc: string;
    feat3Title: string;
    feat3Desc: string;
    feat4Title: string;
    feat4Desc: string;
  };
  goals: {
    badge: string;
    title: string;
    subtitle: string;
    goal1Title: string;
    goal2Title: string;
    goal3Title: string;
  };
  reviews: {
    badge: string;
    title: string;
    subtitle: string;
    rev1Role: string;
    rev1Text: string;
    rev2Role: string;
    rev2Text: string;
    rev3Role: string;
    rev3Text: string;
  };
  faq: {
    badge: string;
    title: string;
    subtitle: string;
    q1: string;
    a1: string;
    q2: string;
    a2: string;
    q3: string;
    a3: string;
    q4: string;
    a4: string;
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
    guarantee: string;
  };
  footer: {
    desc: string;
    rights: string;
    privacy: string;
    terms: string;
    contact: string;
  };
  dashboard: {
    tabs: {
      accueil: string;
      comptes: string;
      historique: string;
      statistiques: string;
      objectifs: string;
      reglages: string;
      guide: string;
    };
    balance: string;
    dailyBudget: string;
    payCycle: string;
    todayExpenses: string;
    addTransaction: string;
  };
}

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
    navSection: string;
    toolsSection: string;
    balance: string;
    dailyBudget: string;
    payCycle: string;
    todayExpenses: string;
    addTransaction: string;
    activeCycle: string;
    personalAccount: string;
    logout: string;
    settings: string;
    notificationsTitle: string;
    noNotifications: string;
    markAllRead: string;
    seeMore: string;
    darkMode: string;
    lightMode: string;
    switchToLight: string;
    switchToDark: string;
    toggleSidebar: string;
    collapseSidebar: string;
    expandSidebar: string;
    smartFinanceSubtitle: string;
    loading: string;
    
    // View - Accueil
    home: {
      greetingMorning: string;
      greetingAfternoon: string;
      greetingEvening: string;
      welcomeSubtitle: string;
      activeAccounts: string;
      lastTransaction: string;
      noRecentTransaction: string;
      availablePerDay: string;
      daysRemaining: string;
      quickAddTitle: string;
      quickAddPlaceholder: string;
      quickAddSubmit: string;
      quickAddHint: string;
      cashflowTitle: string;
      cashflowSubtitle: string;
      income: string;
      expenses: string;
      netEvolution: string;
      loadingChart: string;
      categoryDistribution: string;
      noExpensesMonth: string;
      recentTransactionsTitle: string;
      viewAll: string;
      noTransactions: string;
      addFirstExpense: string;
      yourAccounts: string;
      manageAccounts: string;
      savingsGoals: string;
      seeAllGoals: string;
      reached: string;
      remaining: string;
      target: string;
      dayUnit: string;
      daysUnit: string;
      simSlider: string;
    };

    // Payday Card
    paydayCard: {
      title: string;
      subtitleActive: string;
      subtitleInactive: string;
      payOnDay: string;
      notSetConfigure: string;
      daysRemainingLabel: string;
      dailyBudgetLabel: string;
      authorizedPerDay: string;
      totalAvailable: string;
      spentSoFar: string;
      salaryLabel: string;
      simulationLabel: string;
      urgentWarning: string;
      budgetRecalculated: string;
    };

    // Accounts tab
    accountsPage: {
      title: string;
      subtitle: string;
      cleanDuplicates: string;
      addAccountBtn: string;
      totalBalance: string;
      numberOfAccounts: string;
      cashAccounts: string;
      mobileMoneyAccounts: string;
      bankAccounts: string;
      modalAddTitle: string;
      modalEditTitle: string;
      accountNameLabel: string;
      accountNamePlaceholder: string;
      accountTypeLabel: string;
      initialBalanceLabel: string;
      colorLabel: string;
      cancelBtn: string;
      saveBtn: string;
      deleteBtn: string;
      deleteConfirm: string;
      typeCash: string;
      typeWave: string;
      typeOrangeMoney: string;
      typeMtn: string;
      typeMoov: string;
      typeBank: string;
      typeOther: string;
      emptyAccounts: string;
    };

    // History tab
    historyPage: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      filterAll: string;
      filterExpenses: string;
      filterIncome: string;
      exportCsv: string;
      colDate: string;
      colDescription: string;
      colCategory: string;
      colAccount: string;
      colAmount: string;
      colActions: string;
      emptyState: string;
      deleteConfirm: string;
      today: string;
      yesterday: string;
    };

    // Stats tab
    statsPage: {
      title: string;
      subtitle: string;
      currentMonth: string;
      totalExpenses: string;
      totalIncome: string;
      netBalance: string;
      savingsRate: string;
      topExpenseCategory: string;
      expensesByCategory: string;
      evolutionOverTime: string;
      noDataForPeriod: string;
    };

    // Goals tab
    goalsPage: {
      title: string;
      subtitle: string;
      addGoalBtn: string;
      modalTitle: string;
      goalTitleLabel: string;
      goalTitlePlaceholder: string;
      targetAmountLabel: string;
      currentAmountLabel: string;
      deadlineLabel: string;
      cancelBtn: string;
      saveBtn: string;
      deleteConfirm: string;
      goalCompleted: string;
      inProgress: string;
      emptyGoals: string;
      addFirstGoal: string;
    };

    // Settings tab
    settingsPage: {
      title: string;
      subtitle: string;
      fullNameLabel: string;
      fullNamePlaceholder: string;
      monthlySalaryLabel: string;
      monthlySalaryPlaceholder: string;
      monthlySalaryHint: string;
      paydayLabel: string;
      paydayHint: string;
      languageLabel: string;
      themeLabel: string;
      saveChangesBtn: string;
      saving: string;
      savedSuccess: string;
    };

    // Guide tab
    guidePage: {
      title: string;
      subtitle: string;
      howToStartTitle: string;
      howToStartDesc: string;
      payCycleExplanationTitle: string;
      payCycleExplanationDesc: string;
      dailyBudgetExplanationTitle: string;
      dailyBudgetExplanationDesc: string;
      accountsExplanationTitle: string;
      accountsExplanationDesc: string;
      faqTitle: string;
    };

    // Add Expense / Income Modal
    transactionModal: {
      titleExpense: string;
      titleIncome: string;
      typeExpense: string;
      typeIncome: string;
      amountLabel: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
      categoryLabel: string;
      accountLabel: string;
      dateLabel: string;
      submitBtn: string;
      submitting: string;
      cancelBtn: string;
      categories: {
        food: string;
        transport: string;
        housing: string;
        utilities: string;
        health: string;
        education: string;
        leisure: string;
        shopping: string;
        salary: string;
        business: string;
        gift: string;
        other: string;
      };
    };

    // Date formatting strings
    days: [string, string, string, string, string, string, string];
    months: [string, string, string, string, string, string, string, string, string, string, string, string];
  };
}

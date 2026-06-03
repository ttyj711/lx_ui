/**
 * TripLedger — Shared Data Model (Multi-Trip)
 * All screens render from this single source of truth.
 * Multiple trips supported; current trip resolves via getters.
 * Switch trips with TripData.switchTrip(id) — all pages refresh on next load.
 *
 * Persistence: localStorage key 'tripLedgerData'.
 * Reset: call TripData.resetData() or clear localStorage.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'tripLedgerData';

  // ── Category icon SVGs ──────────────────────────────────────
  var ICONS = {
    food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>',
    hotel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>',
    transport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    ticket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 013-3h14a3 3 0 013 3"/><path d="M2 9v6a3 3 0 003 3h14a3 3 0 003-3V9"/><path d="M2 9a3 3 0 003 3h0a3 3 0 003-3"/><line x1="12" y1="12" x2="12" y2="18"/></svg>',
    shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
    fun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    medical: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
    other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
    custom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'
  };

  // ── Default factories ───────────────────────────────────────
  function defaultCategories() {
    return [
      { id: 'food', name: '餐饮', color: '#E65100', bgColor: '#FFF3E0', visible: true },
      { id: 'hotel', name: '住宿', color: '#7B1FA2', bgColor: '#F3E5F5', visible: true },
      { id: 'transport', name: '交通', color: '#1565C0', bgColor: '#E3F2FD', visible: true },
      { id: 'ticket', name: '门票', color: '#2E7D32', bgColor: '#E8F5E9', visible: true },
      { id: 'shop', name: '购物', color: '#C62828', bgColor: '#FCE4EC', visible: true },
      { id: 'fun', name: '娱乐', color: '#F57F17', bgColor: '#FFF8E1', visible: true },
      { id: 'medical', name: '医疗', color: '#2E7D32', bgColor: '#E8F5E9', visible: true },
      { id: 'other', name: '其他', color: '#6E7179', bgColor: '#F5F5F5', visible: true }
    ];
  }

  function defaultDashboardMetrics() {
    return [
      { id: 'todayCount', label: '今日笔数', icon: 'chart', visible: true },
      { id: 'pendingSplit', label: '待分摊', icon: 'users', visible: true }
    ];
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  // ── Default trips ───────────────────────────────────────────
  var TRIP_DEMO = {
    id: 'trip_demo',
    name: '川西自驾7日游',
    startDate: '2025-06-15',
    endDate: '2025-06-21',
    budget: 15000,
    currency: '¥',
    archived: false,
    members: [
      { id: 1, name: '张伟', tag: 'adult', color: '#2D8B7A' },
      { id: 2, name: '李娜', tag: 'adult', color: '#E05A38' },
      { id: 3, name: '王磊', tag: 'adult', color: '#5C6BC0' },
      { id: 4, name: '赵敏', tag: 'adult', color: '#E8A020' },
      { id: 5, name: '刘洋', tag: 'adult', color: '#D93025' }
    ],
    categories: defaultCategories(),
    expenses: [
      { id: 1, cat: 'hotel', amount: 420, desc: '住宿 · 康定情歌酒店', loc: '康定', date: '2025-06-15', time: '21:00', p: [1,2,3,4,5] },
      { id: 2, cat: 'food', amount: 380, desc: '午餐 · 成都火锅', loc: '成都', date: '2025-06-15', time: '12:30', p: [1,2,3,4,5] },
      { id: 3, cat: 'transport', amount: 350, desc: '加油 · 中石油成都站', loc: '成都', date: '2025-06-15', time: '08:00', p: [1,2,3,4,5] },
      { id: 4, cat: 'food', amount: 260, desc: '晚餐 · 康定藏餐', loc: '康定', date: '2025-06-15', time: '19:00', p: [1,2,3,4,5] },
      { id: 5, cat: 'transport', amount: 120, desc: '高速过路费', loc: '', date: '2025-06-15', time: '09:30', p: [1,2,3,4,5] },
      { id: 6, cat: 'food', amount: 150, desc: '早餐 · 酒店自助', loc: '成都', date: '2025-06-15', time: '07:30', p: [1,2,3,4,5] },
      { id: 7, cat: 'hotel', amount: 300, desc: '住宿 · 新都桥星空客栈', loc: '新都桥', date: '2025-06-16', time: '20:00', p: [1,2,3,4,5] },
      { id: 8, cat: 'food', amount: 180, desc: '午餐 · 路边餐厅', loc: '折多山', date: '2025-06-16', time: '12:00', p: [1,2,3,4,5] },
      { id: 9, cat: 'transport', amount: 380, desc: '加油 · 中石油康定站', loc: '康定', date: '2025-06-16', time: '08:30', p: [1,2,3,4,5] },
      { id: 10, cat: 'ticket', amount: 100, desc: '折多山观景台', loc: '折多山', date: '2025-06-16', time: '10:30', p: [1,2,3,4] },
      { id: 11, cat: 'food', amount: 320, desc: '晚餐 · 牦牛肉汤锅', loc: '新都桥', date: '2025-06-16', time: '18:30', p: [1,2,3,4,5] },
      { id: 12, cat: 'shop', amount: 240, desc: '新都桥特产', loc: '新都桥', date: '2025-06-16', time: '16:00', p: [1,2,4] },
      { id: 13, cat: 'transport', amount: 30, desc: '停车费', loc: '新都桥', date: '2025-06-16', time: '14:00', p: [1,2,3,4,5] },
      { id: 14, cat: 'fun', amount: 150, desc: '藏民家访', loc: '新都桥', date: '2025-06-16', time: '15:00', p: [1,2,3,4,5] },
      { id: 15, cat: 'food', amount: 120, desc: '早餐 · 客栈', loc: '新都桥', date: '2025-06-16', time: '07:00', p: [1,2,3,4,5] },
      { id: 16, cat: 'transport', amount: 200, desc: '租车费 Day2', loc: '', date: '2025-06-16', time: '07:30', p: [1,2,3,4,5] },
      { id: 17, cat: 'hotel', amount: 300, desc: '住宿 · 新都桥星空客栈', loc: '新都桥', date: '2025-06-17', time: '09:00', p: [1,2,3,4,5] },
      { id: 18, cat: 'ticket', amount: 160, desc: '塔公草原门票', loc: '塔公草原', date: '2025-06-17', time: '10:00', p: [1,2,3,4] },
      { id: 19, cat: 'transport', amount: 420, desc: '加油 · 中石油新都桥站', loc: '新都桥', date: '2025-06-17', time: '12:15', p: [1,2,3,4,5] },
      { id: 20, cat: 'food', amount: 380, desc: '午餐 · 牦牛肉汤锅', loc: '新都桥', date: '2025-06-17', time: '14:30', p: [1,2,3,4,5] },
      { id: 21, cat: 'hotel', amount: 680, desc: '住宿 · 稻城亚丁酒店', loc: '稻城', date: '2025-06-18', time: '19:00', p: [1,2,3,4,5] },
      { id: 22, cat: 'food', amount: 280, desc: '午餐 · 理塘餐厅', loc: '理塘', date: '2025-06-18', time: '12:00', p: [1,2,3,4,5] },
      { id: 23, cat: 'transport', amount: 400, desc: '加油 · 中石油理塘站', loc: '理塘', date: '2025-06-18', time: '08:00', p: [1,2,3,4,5] },
      { id: 24, cat: 'ticket', amount: 80, desc: '兔儿山观景台', loc: '理塘', date: '2025-06-18', time: '10:30', p: [1,2,3,4,5] },
      { id: 25, cat: 'food', amount: 220, desc: '晚餐 · 稻城川菜', loc: '稻城', date: '2025-06-18', time: '18:00', p: [1,2,3,4,5] },
      { id: 26, cat: 'food', amount: 122, desc: '早餐 · 酒店自助', loc: '稻城', date: '2025-06-18', time: '07:00', p: [1,2,3,4,5] },
      { id: 27, cat: 'hotel', amount: 680, desc: '住宿 · 稻城亚丁酒店', loc: '稻城', date: '2025-06-19', time: '20:00', p: [1,2,3,4,5] },
      { id: 28, cat: 'ticket', amount: 860, desc: '亚丁景区门票（含观光车）', loc: '亚丁', date: '2025-06-19', time: '08:00', p: [1,2,3,4,5] },
      { id: 29, cat: 'food', amount: 160, desc: '午餐 · 景区内简餐', loc: '亚丁', date: '2025-06-19', time: '12:30', p: [1,2,3,4,5] },
      { id: 30, cat: 'transport', amount: 200, desc: '景区观光车', loc: '亚丁', date: '2025-06-19', time: '08:30', p: [1,2,3,4,5] },
      { id: 31, cat: 'shop', amount: 320, desc: '亚丁纪念品', loc: '亚丁', date: '2025-06-19', time: '16:00', p: [1,2] },
      { id: 32, cat: 'hotel', amount: 380, desc: '住宿 · 康定酒店', loc: '康定', date: '2025-06-20', time: '20:00', p: [1,2,3,4,5] },
      { id: 33, cat: 'food', amount: 240, desc: '午餐 · 雅江餐厅', loc: '雅江', date: '2025-06-20', time: '12:00', p: [1,2,3,4,5] },
      { id: 34, cat: 'transport', amount: 360, desc: '加油', loc: '雅江', date: '2025-06-20', time: '08:00', p: [1,2,3,4,5] },
      { id: 35, cat: 'fun', amount: 250, desc: '泡温泉', loc: '康定', date: '2025-06-20', time: '15:00', p: [1,2,4,5] },
      { id: 36, cat: 'food', amount: 200, desc: '晚餐 · 康定串串', loc: '康定', date: '2025-06-20', time: '18:30', p: [1,2,3,4,5] },
      { id: 37, cat: 'food', amount: 80, desc: '早餐 · 客栈', loc: '康定', date: '2025-06-20', time: '07:30', p: [1,2,3,4,5] },
      { id: 38, cat: 'food', amount: 180, desc: '午餐 · 成都小吃', loc: '成都', date: '2025-06-21', time: '12:00', p: [1,2,3,4,5] },
      { id: 39, cat: 'transport', amount: 120, desc: '高速过路费', loc: '', date: '2025-06-21', time: '08:30', p: [1,2,3,4,5] },
      { id: 40, cat: 'shop', amount: 440, desc: '成都伴手礼', loc: '成都', date: '2025-06-21', time: '15:00', p: [1,2,4] },
      { id: 41, cat: 'food', amount: 100, desc: '早餐 · 酒店自助', loc: '康定', date: '2025-06-21', time: '07:00', p: [1,2,3,4,5] },
      { id: 42, cat: 'transport', amount: 350, desc: '加油 · 返程', loc: '雅安', date: '2025-06-21', time: '09:30', p: [1,2,3,4,5] },
      { id: 43, cat: 'food', amount: 260, desc: '晚餐 · 成都火锅', loc: '成都', date: '2025-06-21', time: '18:00', p: [1,2,3,4,5] },
      { id: 44, cat: 'fun', amount: 400, desc: '宽窄巷子游览', loc: '成都', date: '2025-06-21', time: '14:00', p: [1,2,3,4,5] },
      { id: 45, cat: 'ticket', amount: 500, desc: '都江堰门票', loc: '都江堰', date: '2025-06-21', time: '10:00', p: [1,2,3,4,5] },
      { id: 46, cat: 'food', amount: 160, desc: '下午茶 · 人民公园', loc: '成都', date: '2025-06-21', time: '15:30', p: [1,2,3] },
      { id: 47, cat: 'shop', amount: 200, desc: '超市采购', loc: '成都', date: '2025-06-21', time: '16:30', p: [1,2] }
    ],
    dashboardMetrics: defaultDashboardMetrics(),
    referenceDate: '2025-06-17'
  };

  var TRIP_NINGBO = {
    id: 'trip_ningbo',
    name: '宁波亲子5日游',
    startDate: '2025-07-10',
    endDate: '2025-07-14',
    budget: 8000,
    currency: '¥',
    archived: false,
    members: [
      { id: 1, name: '张伟', tag: 'adult', color: '#2D8B7A' },
      { id: 2, name: '李娜', tag: 'adult', color: '#E05A38' },
      { id: 3, name: '小宝', tag: 'child', color: '#5C6BC0' }
    ],
    categories: defaultCategories(),
    expenses: [
      { id: 1, cat: 'transport', amount: 520, desc: '高铁 · 上海→宁波', loc: '上海', date: '2025-07-10', time: '08:00', p: [1,2,3] },
      { id: 2, cat: 'hotel', amount: 480, desc: '住宿 · 东钱湖民宿', loc: '宁波', date: '2025-07-10', time: '14:00', p: [1,2,3] },
      { id: 3, cat: 'food', amount: 260, desc: '晚餐 · 宁海食府', loc: '宁波', date: '2025-07-10', time: '18:30', p: [1,2,3] }
    ],
    dashboardMetrics: defaultDashboardMetrics(),
    referenceDate: null
  };

  // ── Default configuration ───────────────────────────────────
  var DEFAULTS = {
    currentTripId: 'trip_demo',
    trips: [TRIP_DEMO, TRIP_NINGBO],
    settings: {
      defaultBudget: 10000,
      defaultCurrency: 'CNY',
      defaultTravelers: 2,
      defaultSplitRule: 'participation',
      templates: [
        { id: 'road-trip', name: '自驾游', icon: 'car', budget: 15000 },
        { id: 'family', name: '亲子游', icon: 'baby', budget: 20000 },
        { id: 'couple', name: '情侣游', icon: 'heart', budget: 12000 },
        { id: 'team', name: '团建活动', icon: 'building', budget: 30000 },
        { id: 'overseas', name: '境外自由行', icon: 'plane', budget: 25000 }
      ],
      memberTypes: [
        { id: 'adult', name: '成人', weight: 1, enabled: true },
        { id: 'child', name: '儿童', weight: 0.5, enabled: true },
        { id: 'elder', name: '老人', weight: 0.8, enabled: true }
      ],
      splitMethods: ['average', 'participation', 'weight', 'custom'],
      splitMethodLabels: { average: '平均分摊', participation: '按参与人数', weight: '按成员权重', custom: '自定义比例' },
      budgetMode: 'total',
      budgetModeLabels: { total: '总预算', daily: '每日预算', perPerson: '人均预算' },
      budgetWarning80: true,
      budgetWarning90: true,
      budgetWarning100: true,
      currencies: [
        { code: 'CNY', name: '人民币', symbol: '¥', rate: 1 },
        { code: 'JPY', name: '日元', symbol: '¥', rate: 0.048 },
        { code: 'USD', name: '美元', symbol: '$', rate: 7.25 },
        { code: 'EUR', name: '欧元', symbol: '€', rate: 7.85 },
        { code: 'KRW', name: '韩元', symbol: '₩', rate: 0.0053 },
        { code: 'THB', name: '泰铢', symbol: '฿', rate: 0.20 },
        { code: 'GBP', name: '英镑', symbol: '£', rate: 9.15 },
        { code: 'AUD', name: '澳元', symbol: 'A$', rate: 4.72 }
      ],
      currencyDisplay: 'original',
      currencyDisplayLabels: { original: '原币种', cny: '统一转人民币', both: '同时展示' },
      autoExchangeRate: true,
      autoRecordTime: true,
      autoGetLocation: false,
      autoSelectCategory: true,
      autoCalculateSplit: true,
      ocrEnabled: false,
      dayNaming: 'day',
      dayNamingLabels: { day: 'Day1, Day2…', custom: '自定义名称' },
      longTripScroll: true,
      dashboardCards: [
        { id: 'totalSpent', label: '总消费', visible: true },
        { id: 'todaySpent', label: '今日消费', visible: true },
        { id: 'perPerson', label: '人均消费', visible: true },
        { id: 'remainBudget', label: '剩余预算', visible: true },
        { id: 'totalCount', label: '消费次数', visible: false },
        { id: 'budgetRate', label: '预算执行率', visible: true },
        { id: 'tripProgress', label: '行程进度', visible: false }
      ],
      statsModules: [
        { id: 'structure', label: '消费结构分析', visible: true },
        { id: 'dailyTrend', label: '每日消费趋势', visible: true },
        { id: 'memberRank', label: '成员消费排行', visible: true },
        { id: 'categoryRank', label: '分类消费排行', visible: true },
        { id: 'locationRank', label: '地点消费排行', visible: false },
        { id: 'budgetAnalysis', label: '预算执行分析', visible: true }
      ],
      dailyReport: true,
      weeklySummary: true,
      tripEndReport: true,
      overBudgetAlert: true,
      abnormalSpendingAlert: false,
      cloudSync: false,
      autoBackup: true,
      lastBackupDate: '2025-06-17',
      theme: 'light',
      themeLabels: { light: '浅色模式', dark: '深色模式', system: '跟随系统' },
      themeColor: '#2D8B7A',
      themeColors: ['#2D8B7A', '#5C6BC0', '#E05A38', '#7B1FA2', '#00838F', '#C62828'],
      cardStyle: 'rounded',
      cardStyleLabels: { rounded: '圆角', flat: '扁平', shadow: '阴影' },
      chartStyle: 'colorful',
      chartStyleLabels: { colorful: '彩色', monochrome: '单色' },
      fontSize: 'medium',
      fontSizeLabels: { small: '小', medium: '标准', large: '大' }
    },
    notifications: []
  };

  // ── Load / Save / Migrate ───────────────────────────────────
  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  function saveData(d) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch (e) { /* ignore */ }
  }

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  function ensureExpensePayers(root) {
    if (!root || !root.trips) return root;
    root.trips.forEach(function (trip) {
      (trip.expenses || []).forEach(function (expense) {
        if (!expense.payerId) {
          expense.payerId = expense.p && expense.p.length > 0 ? expense.p[0] : (trip.members[0] && trip.members[0].id);
        }
      });
    });
    return root;
  }

  function migrateData(d) {
    if (!d) return null;
    // Old format: has 'trip' at root level but no 'trips' array
    if (d.trip && !d.trips) {
      var trip = {
        id: 'trip_migrated_' + Date.now(),
        name: d.trip.name || '我的旅程',
        startDate: d.trip.startDate || todayStr(),
        endDate: d.trip.endDate || todayStr(),
        budget: d.trip.budget || 0,
        currency: d.trip.currency || '¥',
        archived: false,
        members: d.members || [],
        categories: d.categories || defaultCategories(),
        expenses: d.expenses || [],
        dashboardMetrics: d.dashboardMetrics || defaultDashboardMetrics(),
        referenceDate: d.referenceDate || null
      };
      return ensureExpensePayers({
        currentTripId: trip.id,
        trips: [trip],
        settings: d.settings || cloneDefaults().settings
      });
    }
    return ensureExpensePayers(d);
  }

  var data = ensureExpensePayers(migrateData(loadData()) || cloneDefaults());

  // ── Current trip resolver ───────────────────────────────────
  function ct() {
    var trip = null;
    if (data.currentTripId) {
      trip = data.trips.find(function (t) { return t.id === data.currentTripId; });
    }
    if (!trip && data.trips.length > 0) {
      trip = data.trips[0];
      data.currentTripId = trip.id;
    }
    if (!trip) {
      // Should never happen, but safety fallback
      trip = { id: '_fallback', name: '暂无旅程', startDate: todayStr(), endDate: todayStr(),
        budget: 0, currency: '¥', archived: false, members: [], categories: defaultCategories(),
        expenses: [], dashboardMetrics: defaultDashboardMetrics(), referenceDate: null };
    }
    return trip;
  }

  // ── Helper: date math ───────────────────────────────────────
  function parseDate(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

  function daysBetween(a, b) {
    var ms = parseDate(b).getTime() - parseDate(a).getTime();
    return Math.round(ms / 86400000) + 1;
  }

  function dayOfTrip(dateStr) {
    return daysBetween(ct().startDate, dateStr);
  }

  function formatDate(s) {
    var d = parseDate(s);
    return (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function formatDateRange() {
    return formatDate(ct().startDate) + ' — ' + formatDate(ct().endDate);
  }

  function formatDateShort(s) {
    var d = parseDate(s);
    return (d.getMonth() + 1) + '.' + d.getDate();
  }

  // ── Computed: current day ───────────────────────────────────
  function getReferenceDate() {
    var ref = ct().referenceDate ? parseDate(ct().referenceDate) : new Date();
    return ref;
  }

  function getCurrentDayNumber() {
    var ref = getReferenceDate();
    var start = parseDate(ct().startDate);
    var diff = Math.round((ref.getTime() - start.getTime()) / 86400000) + 1;
    return Math.max(1, Math.min(diff, getTotalDays()));
  }

  function getTotalDays() {
    return daysBetween(ct().startDate, ct().endDate);
  }

  function isTripOver() {
    return getCurrentDayNumber() > getTotalDays();
  }

  // ── Computed: spending ──────────────────────────────────────
  function getExpensesForDay(dayNum) {
    var target = dayNumToDate(dayNum);
    return ct().expenses.filter(function (e) { return e.date === target; });
  }

  function dayNumToDate(dayNum) {
    var start = parseDate(ct().startDate);
    var d = new Date(start.getTime() + (dayNum - 1) * 86400000);
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var dd = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + dd;
  }

  function dayNumToName(dayNum) {
    var d = dayNumToDate(dayNum);
    var parts = d.split('-');
    return parseInt(parts[1]) + '月' + parseInt(parts[2]) + '日';
  }

  function sumExpenses(list) {
    return list.reduce(function (s, e) { return s + e.amount; }, 0);
  }

  function getTotalSpent(upToDay) {
    var list = upToDay
      ? ct().expenses.filter(function (e) { return dayOfTrip(e.date) <= upToDay; })
      : ct().expenses;
    return sumExpenses(list);
  }

  function getTodaySpent() {
    return sumExpenses(getExpensesForDay(getCurrentDayNumber()));
  }

  function getTodayExpenses() {
    return getExpensesForDay(getCurrentDayNumber());
  }

  // ── Computed: per-person (actual participation) ─────────────
  function getMemberSpending(memberId, upToDay) {
    var list = upToDay
      ? ct().expenses.filter(function (e) { return dayOfTrip(e.date) <= upToDay; })
      : ct().expenses;
    var total = 0;
    list.forEach(function (e) {
      if (e.p.indexOf(memberId) !== -1) {
        total += e.amount / e.p.length;
      }
    });
    return Math.round(total);
  }

  function getMemberPaid(memberId, upToDay) {
    var list = upToDay
      ? ct().expenses.filter(function (e) { return dayOfTrip(e.date) <= upToDay; })
      : ct().expenses;
    var total = 0;
    list.forEach(function (e) {
      if ((e.payerId || (e.p && e.p[0])) === memberId) total += e.amount;
    });
    return Math.round(total);
  }

  function getMemberSettlementRows(upToDay) {
    return ct().members.map(function (m) {
      var paid = getMemberPaid(m.id, upToDay);
      var owed = getMemberSpending(m.id, upToDay);
      return {
        id: m.id,
        name: m.name,
        color: m.color,
        tag: m.tag,
        paid: paid,
        owed: owed,
        balance: Math.round(paid - owed),
        count: getMemberExpenseCount(m.id, upToDay),
        absent: getMemberAbsentCount(m.id, upToDay)
      };
    });
  }

  function getSettlementSuggestions(upToDay) {
    var rows = getMemberSettlementRows(upToDay);
    var receivers = rows.filter(function (r) { return r.balance > 0; }).map(function (r) {
      return Object.assign({}, r, { left: r.balance });
    }).sort(function (a, b) { return b.left - a.left; });
    var payers = rows.filter(function (r) { return r.balance < 0; }).map(function (r) {
      return Object.assign({}, r, { left: Math.abs(r.balance) });
    }).sort(function (a, b) { return b.left - a.left; });
    var suggestions = [];
    var pi = 0, ri = 0;
    while (pi < payers.length && ri < receivers.length) {
      var amount = Math.min(payers[pi].left, receivers[ri].left);
      if (amount >= 1) {
        suggestions.push({
          fromId: payers[pi].id,
          from: payers[pi].name,
          toId: receivers[ri].id,
          to: receivers[ri].name,
          amount: Math.round(amount)
        });
      }
      payers[pi].left -= amount;
      receivers[ri].left -= amount;
      if (payers[pi].left <= 1) pi++;
      if (receivers[ri].left <= 1) ri++;
    }
    return suggestions;
  }

  function getMemberExpenseCount(memberId, upToDay) {
    var list = upToDay
      ? ct().expenses.filter(function (e) { return dayOfTrip(e.date) <= upToDay; })
      : ct().expenses;
    return list.filter(function (e) { return e.p.indexOf(memberId) !== -1; }).length;
  }

  function getMemberAbsentCount(memberId, upToDay) {
    var list = upToDay
      ? ct().expenses.filter(function (e) { return dayOfTrip(e.date) <= upToDay; })
      : ct().expenses;
    return list.filter(function (e) { return e.p.indexOf(memberId) === -1; }).length;
  }

  function getPerPersonAvg(upToDay) {
    var memberTotals = ct().members.map(function (m) { return getMemberSpending(m.id, upToDay); });
    var sum = memberTotals.reduce(function (a, b) { return a + b; }, 0);
    return ct().members.length > 0 ? Math.round(sum / ct().members.length) : 0;
  }

  // ── Computed: category breakdown ────────────────────────────
  function getCategoryBreakdown(upToDay) {
    var list = upToDay
      ? ct().expenses.filter(function (e) { return dayOfTrip(e.date) <= upToDay; })
      : ct().expenses;
    var total = sumExpenses(list);
    var map = {};
    list.forEach(function (e) {
      if (!map[e.cat]) map[e.cat] = { catId: e.cat, total: 0, count: 0 };
      map[e.cat].total += e.amount;
      map[e.cat].count++;
    });
    var arr = [];
    for (var k in map) {
      map[k].pct = total > 0 ? Math.round(map[k].total / total * 100) : 0;
      arr.push(map[k]);
    }
    arr.sort(function (a, b) { return b.total - a.total; });
    return arr;
  }

  // ── Computed: daily breakdown ───────────────────────────────
  function getDailyBreakdown(upToDay) {
    var days = upToDay || getTotalDays();
    var result = [];
    for (var i = 1; i <= days; i++) {
      var exps = getExpensesForDay(i);
      var participants = {};
      exps.forEach(function (e) { e.p.forEach(function (pid) { participants[pid] = true; }); });
      var pCount = Object.keys(participants).length;
      var dayTotal = sumExpenses(exps);
      result.push({
        day: i, date: dayNumToDate(i), total: dayTotal, count: exps.length,
        participantCount: pCount, perPerson: pCount > 0 ? Math.round(dayTotal / pCount) : 0,
        expenses: exps
      });
    }
    return result;
  }

  // ── Computed: member ranking ────────────────────────────────
  function getMemberRanking(upToDay) {
    return ct().members.map(function (m) {
      return {
        id: m.id, name: m.name, color: m.color, tag: m.tag,
        total: getMemberSpending(m.id, upToDay),
        count: getMemberExpenseCount(m.id, upToDay),
        absent: getMemberAbsentCount(m.id, upToDay)
      };
    }).sort(function (a, b) { return b.total - a.total; });
  }

  function getExpenseById(id) {
    return ct().expenses.find(function (e) { return e.id === id; });
  }

  // ── Computed: highlights ────────────────────────────────────
  function getHighlights() {
    var daily = getDailyBreakdown();
    if (daily.length === 0 || ct().expenses.length === 0) {
      return { highestDay: { day: 0, total: 0, count: 0 }, biggestExpense: { amount: 0, desc: '' }, topCategory: { catId: 'other', total: 0, count: 0 } };
    }
    var highestDay = daily.reduce(function (max, d) { return d.total > max.total ? d : max; }, daily[0]);
    var biggestExpense = ct().expenses.reduce(function (max, e) { return e.amount > max.amount ? e : max; }, ct().expenses[0]);
    var breakdown = getCategoryBreakdown();
    var topCategory = breakdown[0] || { catId: 'other', total: 0, count: 0 };
    return { highestDay: highestDay, biggestExpense: biggestExpense, topCategory: topCategory };
  }

  // ── Lookups ─────────────────────────────────────────────────
  function getCategoryById(id) {
    return ct().categories.find(function (c) { return c.id === id; });
  }

  function getMemberById(id) {
    return ct().members.find(function (m) { return m.id === id; });
  }

  function getVisibleCategories() {
    return ct().categories.filter(function (c) { return c.visible !== false; });
  }

  function getIcon(catId) {
    return ICONS[catId] || ICONS.custom;
  }

  // ── Formatting ──────────────────────────────────────────────
  function formatMoney(amount) {
    return ct().currency + amount.toLocaleString('zh-CN');
  }

  function formatMoneyNoSymbol(amount) {
    return amount.toLocaleString('zh-CN');
  }

  // ── Trip management ─────────────────────────────────────────
  function getTrips() {
    return data.trips;
  }

  function getActiveTrips() {
    return data.trips.filter(function (t) { return !t.archived; });
  }

  function getArchivedTrips() {
    return data.trips.filter(function (t) { return t.archived; });
  }

  function getCurrentTripId() {
    return data.currentTripId;
  }

  function switchTrip(id) {
    var trip = data.trips.find(function (t) { return t.id === id; });
    if (trip) {
      data.currentTripId = id;
      saveData(data);
    }
  }

  function createTrip(config) {
    config = config || {};
    var id = 'trip_' + Date.now();
    var trip = {
      id: id,
      name: config.name || '新旅程',
      startDate: config.startDate || todayStr(),
      endDate: config.endDate || todayStr(),
      budget: config.budget || 0,
      currency: config.currency || '¥',
      archived: false,
      members: config.members || [],
      categories: defaultCategories(),
      expenses: [],
      dashboardMetrics: defaultDashboardMetrics(),
      referenceDate: null
    };
    data.trips.push(trip);
    data.currentTripId = id;
    saveData(data);
    return id;
  }

  function updateTrip(id, config) {
    var trip = data.trips.find(function (t) { return t.id === id; });
    if (trip) {
      Object.assign(trip, config);
      saveData(data);
    }
  }

  function archiveTrip(id) {
    var trip = data.trips.find(function (t) { return t.id === id; });
    if (trip) {
      trip.archived = true;
      if (data.currentTripId === id) {
        var active = getActiveTrips();
        if (active.length > 0) data.currentTripId = active[0].id;
      }
      saveData(data);
    }
  }

  function unarchiveTrip(id) {
    var trip = data.trips.find(function (t) { return t.id === id; });
    if (trip) { trip.archived = false; saveData(data); }
  }

  function deleteTrip(id) {
    if (data.trips.length <= 1) return; // Keep at least one trip
    data.trips = data.trips.filter(function (t) { return t.id !== id; });
    if (data.currentTripId === id) {
      data.currentTripId = data.trips[0].id;
    }
    saveData(data);
  }

  // ── Mutations (with persistence) ────────────────────────────
  function addMember(name, tag) {
    var t = ct();
    var colors = ['#2D8B7A', '#E05A38', '#5C6BC0', '#E8A020', '#D93025', '#7B1FA2', '#00838F', '#4E342E'];
    var id = t.members.length > 0 ? Math.max.apply(null, t.members.map(function (m) { return m.id; })) + 1 : 1;
    t.members.push({ id: id, name: name, tag: tag || 'adult', color: colors[id % colors.length] });
    saveData(data);
    return id;
  }

  function removeMember(id) {
    var t = ct();
    t.members = t.members.filter(function (m) { return m.id !== id; });
    saveData(data);
  }

  function addCategory(name, color, bgColor) {
    var t = ct();
    var id = 'cat_' + Date.now();
    t.categories.push({
      id: id, name: name,
      color: color || '#6E7179', bgColor: bgColor || '#F5F5F5', visible: true
    });
    saveData(data);
    return id;
  }

  function removeCategory(id) {
    var t = ct();
    t.categories = t.categories.filter(function (c) { return c.id !== id; });
    saveData(data);
  }

  function toggleCategoryVisibility(id) {
    var cat = getCategoryById(id);
    if (cat) { cat.visible = !cat.visible; saveData(data); }
  }

  function addExpense(expense) {
    var t = ct();
    var id = t.expenses.length > 0 ? Math.max.apply(null, t.expenses.map(function (e) { return e.id; })) + 1 : 1;
    expense.id = id;
    if (!expense.payerId) expense.payerId = expense.p && expense.p.length > 0 ? expense.p[0] : (t.members[0] && t.members[0].id);
    t.expenses.push(expense);
    saveData(data);
    return id;
  }

  function updateExpense(id, patch) {
    var expense = getExpenseById(id);
    if (!expense) return false;
    Object.assign(expense, patch);
    if (!expense.payerId) expense.payerId = expense.p && expense.p.length > 0 ? expense.p[0] : (ct().members[0] && ct().members[0].id);
    saveData(data);
    return true;
  }

  function deleteExpense(id) {
    var t = ct();
    var before = t.expenses.length;
    t.expenses = t.expenses.filter(function (e) { return e.id !== id; });
    if (t.expenses.length !== before) {
      saveData(data);
      return true;
    }
    return false;
  }

  function updateTripConfig(config) {
    Object.assign(ct(), config);
    saveData(data);
  }

  function updateDashboardMetrics(metrics) {
    ct().dashboardMetrics = metrics;
    saveData(data);
  }

  function updateSetting(key, value) {
    var parts = key.split('.');
    var obj = data.settings;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    saveData(data);
  }

  function getSetting(key) {
    var parts = key.split('.');
    var obj = data.settings;
    for (var i = 0; i < parts.length; i++) {
      if (obj == null) return undefined;
      obj = obj[parts[i]];
    }
    return obj;
  }

  function toggleDashboardCard(cardId) {
    var cards = data.settings.dashboardCards;
    var card = cards.find(function (c) { return c.id === cardId; });
    if (card) { card.visible = !card.visible; saveData(data); }
  }

  function toggleStatsModule(moduleId) {
    var modules = data.settings.statsModules;
    var mod = modules.find(function (m) { return m.id === moduleId; });
    if (mod) { mod.visible = !mod.visible; saveData(data); }
  }

  // ── Notifications ─────────────────────────────────────────────
  function generateNotifications() {
    var trip = ct();
    var notifs = [];
    var totalSpent = getTotalSpent();
    var totalDays = getTotalDays();
    var curDay = getCurrentDayNumber();
    var budget = trip.budget || 0;
    var s = data.settings;

    // ── Budget alerts ──────────────────────────────────────
    if (budget > 0) {
      var rate = totalSpent / budget;
      var remainBudget = Math.max(0, budget - totalSpent);
      var remainingDays = Math.max(1, totalDays - curDay + 1);
      var dailyBudget = Math.round(remainBudget / remainingDays);
      var pct = Math.round(rate * 100);

      if (rate >= 1 && s.budgetWarning100) {
        notifs.push({
          id: 'budget_100_' + trip.id, type: 'budget_alert', category: 'budget',
          title: '预算已超支', message: '已超出预算 ¥' + formatMoneyNoSymbol(totalSpent - budget),
          time: new Date().toISOString(), read: false,
          data: { spent: totalSpent, budget: budget, pct: pct, over: totalSpent - budget }
        });
      } else if (rate >= 0.9 && s.budgetWarning90) {
        notifs.push({
          id: 'budget_90_' + trip.id, type: 'budget_alert', category: 'budget',
          title: '预算预警', message: '已使用预算的 ' + pct + '%，建议控制支出',
          time: new Date().toISOString(), read: false,
          data: { spent: totalSpent, budget: budget, pct: pct, remain: remainBudget, dailyBudget: dailyBudget, remainingDays: remainingDays }
        });
      } else if (rate >= 0.8 && s.budgetWarning80) {
        notifs.push({
          id: 'budget_80_' + trip.id, type: 'budget_alert', category: 'budget',
          title: '预算提醒', message: '已使用预算的 ' + pct + '%，节奏正常',
          time: new Date().toISOString(), read: false,
          data: { spent: totalSpent, budget: budget, pct: pct, remain: remainBudget, dailyBudget: dailyBudget, remainingDays: remainingDays }
        });
      }
    }

    // ── Daily report ────────────────────────────────────────
    if (s.dailyReport) {
      var todayExps = getTodayExpenses();
      if (todayExps.length > 0) {
        var todayTotal = getTodaySpent();
        var todayPerPerson = Math.round(todayTotal / trip.members.length);
        var catMap = {};
        todayExps.forEach(function (e) {
          if (!catMap[e.cat]) catMap[e.cat] = { amount: 0, count: 0 };
          catMap[e.cat].amount += e.amount;
          catMap[e.cat].count++;
        });
        var topCats = Object.keys(catMap).map(function (k) { return { cat: k, amount: catMap[k].amount, count: catMap[k].count }; })
          .sort(function (a, b) { return b.amount - a.amount; }).slice(0, 3);
        var yesterdayExps = getExpensesForDay(curDay - 1);
        var yesterdayTotal = sumExpenses(yesterdayExps);
        var vsYesterday = yesterdayTotal > 0 ? todayTotal - yesterdayTotal : null;

        notifs.push({
          id: 'daily_report_' + todayStr(), type: 'daily_report', category: 'daily',
          title: '今日消费日报', message: '¥' + formatMoneyNoSymbol(todayTotal) + ' · ' + todayExps.length + '笔 · 人均 ¥' + formatMoneyNoSymbol(todayPerPerson),
          time: new Date().toISOString(), read: false,
          data: { total: todayTotal, count: todayExps.length, perPerson: todayPerPerson, topCats: topCats, vsYesterday: vsYesterday }
        });
      }
    }

    // ── Abnormal spending ───────────────────────────────────
    if (s.abnormalSpendingAlert && trip.expenses.length >= 5) {
      var avgAmount = totalSpent / trip.expenses.length;
      var recentExps = trip.expenses.slice(-5);
      recentExps.forEach(function (exp) {
        if (exp.amount > avgAmount * 2.5) {
          var cat = getCategoryById(exp.cat);
          notifs.push({
            id: 'abnormal_' + exp.id, type: 'abnormal_spending', category: 'alert',
            title: '大额消费提醒', message: (cat ? cat.name : '') + ' · ' + exp.desc + ' ¥' + exp.amount,
            time: new Date().toISOString(), read: false,
            data: { expId: exp.id, cat: exp.cat, catName: cat ? cat.name : '', desc: exp.desc, amount: exp.amount, avgAmount: Math.round(avgAmount), participants: exp.p, loc: exp.loc }
          });
        }
      });
    }

    // ── Trip milestones ─────────────────────────────────────
    var milestonePct = Math.round(curDay / totalDays * 100);
    if (curDay === totalDays && totalDays > 1) {
      notifs.push({
        id: 'milestone_last_' + trip.id, type: 'trip_milestone', category: 'daily',
        title: '旅程最后一天', message: trip.name + ' 今天结束，别忘了生成旅行总结',
        time: new Date().toISOString(), read: false,
        data: { day: curDay, totalDays: totalDays, pct: 100, totalSpent: totalSpent, remain: Math.max(0, budget - totalSpent) }
      });
    } else if (curDay === Math.floor(totalDays / 2) + 1 && totalDays >= 4) {
      notifs.push({
        id: 'milestone_half_' + trip.id, type: 'trip_milestone', category: 'daily',
        title: '行程过半', message: 'Day ' + curDay + '/' + totalDays + ' 已完成，注意预算节奏',
        time: new Date().toISOString(), read: false,
        data: { day: curDay, totalDays: totalDays, pct: milestonePct, totalSpent: totalSpent, remain: Math.max(0, budget - totalSpent) }
      });
    }

    // ── Category overspend ───────────────────────────────
    if (budget > 0) {
      var catBreakdown = getCategoryBreakdown();
      catBreakdown.forEach(function (cb) {
        var cat = getCategoryById(cb.catId);
        if (cb.pct >= 25 && cb.total >= 800) {
          notifs.push({
            id: 'cat_over_' + cb.catId + '_' + trip.id,
            type: 'category_overspend', category: 'budget',
            title: (cat ? cat.name : cb.catId) + '消费偏高',
            message: (cat ? cat.name : cb.catId) + '占比达 ' + cb.pct + '%',
            time: new Date().toISOString(), read: false,
            data: { catId: cb.catId, catName: cat ? cat.name : cb.catId, total: cb.total, count: cb.count, pct: cb.pct, avgPerExpense: Math.round(cb.total / Math.max(1, cb.count)) }
          });
        }
      });
    }

    // ── Daily average overspend ──────────────────────────
    if (budget > 0 && curDay > 1) {
      var budgetDailyAvg = Math.round(budget / totalDays);
      var actualDailyAvg = Math.round(totalSpent / curDay);
      if (actualDailyAvg > budgetDailyAvg * 1.2) {
        var overAmt = actualDailyAvg - budgetDailyAvg;
        var adjDaily = Math.round(remainBudget / Math.max(1, totalDays - curDay + 1));
        notifs.push({
          id: 'daily_avg_over_' + trip.id,
          type: 'daily_avg_overspend', category: 'budget',
          title: '日均消费超支',
          message: '实际日均 ¥' + formatMoneyNoSymbol(actualDailyAvg) + ' 超出预算日均',
          time: new Date().toISOString(), read: false,
          data: { actualDailyAvg: actualDailyAvg, budgetDailyAvg: budgetDailyAvg, overAmount: overAmt, totalSpent: totalSpent, daysElapsed: curDay, adjustedDailyBudget: adjDaily }
        });
      }
    }

    // ── Record reminder ──────────────────────────────────
    if (s.dailyReport) {
      var todayRecs = getTodayExpenses();
      if (todayRecs.length === 0) {
        notifs.push({
          id: 'record_reminder_' + todayStr(),
          type: 'record_reminder', category: 'daily',
          title: '记账提醒',
          message: '今天还没有消费记录，别忘了记账',
          time: new Date().toISOString(), read: false,
          data: { todayCount: 0, hint: '旅途中及时记账，避免遗漏' }
        });
      } else if (todayRecs.length < 3) {
        notifs.push({
          id: 'record_reminder_few_' + todayStr(),
          type: 'record_reminder', category: 'daily',
          title: '记账提醒',
          message: '今天只记了 ' + todayRecs.length + ' 笔，确认没有遗漏？',
          time: new Date().toISOString(), read: false,
          data: { todayCount: todayRecs.length, hint: '睡前确认今日消费是否记录完整' }
        });
      }
    }

    // ── Split pending confirmation ───────────────────────
    if (trip.members.length >= 3) {
      var pendingSplits = [];
      var recent2Day = trip.expenses.filter(function (e) { return dayOfTrip(e.date) >= curDay - 1 && dayOfTrip(e.date) <= curDay; });
      recent2Day.forEach(function (exp) {
        var absent = trip.members.filter(function (m) { return exp.p.indexOf(m.id) === -1; });
        if (absent.length > 0 && absent.length < trip.members.length) {
          pendingSplits.push({
            desc: exp.desc, amount: exp.amount, cat: exp.cat,
            absentNames: absent.map(function (m) { return m.name; }),
            participantCount: exp.p.length, totalMembers: trip.members.length
          });
        }
      });
      if (pendingSplits.length >= 2) {
        var absentMap = {};
        pendingSplits.forEach(function (ps) {
          ps.absentNames.forEach(function (name) {
            if (!absentMap[name]) absentMap[name] = 0;
            absentMap[name]++;
          });
        });
        var topAbsent = Object.keys(absentMap).sort(function (a, b) { return absentMap[b] - absentMap[a]; }).slice(0, 3);
        notifs.push({
          id: 'split_pending_' + trip.id,
          type: 'split_pending', category: 'alert',
          title: '分摊待确认',
          message: pendingSplits.length + ' 笔消费有人未参与，请确认分摊',
          time: new Date().toISOString(), read: false,
          data: {
            pendingCount: pendingSplits.length,
            absentMembers: topAbsent,
            recentItems: pendingSplits.slice(0, 2).map(function (ps) {
              return { desc: ps.desc, amount: ps.amount, absentNames: ps.absentNames.join('、') };
            })
          }
        });
      }
    }

    // ── Settlement reminder ──────────────────────────────
    if (curDay >= 2 && trip.expenses.length >= 5) {
      var settlements = getSettlementSuggestions();
      if (settlements.length > 0) {
        notifs.push({
          id: 'settlement_' + trip.id,
          type: 'settlement_reminder', category: 'alert',
          title: '结算提醒',
          message: '有人还有待结算金额，建议提前确认',
          time: new Date().toISOString(), read: false,
          data: {
            settlements: settlements.slice(0, 3),
            totalUnsettled: Math.round(settlements.reduce(function (s, item) { return s + item.amount; }, 0))
          }
        });
      }
    }

    // ── Duplicate expense detection ──────────────────────
    if (trip.expenses.length >= 3) {
      var dupes = [];
      var recent10 = trip.expenses.slice(-10);
      for (var di = 0; di < recent10.length; di++) {
        for (var dj = di + 1; dj < recent10.length; dj++) {
          var ea = recent10[di], eb = recent10[dj];
          if (ea.cat === eb.cat && ea.amount === eb.amount && ea.id !== eb.id) {
            var dayDiff = Math.abs(dayOfTrip(ea.date) - dayOfTrip(eb.date));
            if (dayDiff <= 2) { dupes.push({ a: ea, b: eb }); }
          }
        }
      }
      if (dupes.length > 0) {
        var dupe = dupes[0];
        var dupeCat = getCategoryById(dupe.a.cat);
        notifs.push({
          id: 'duplicate_' + dupe.a.id + '_' + dupe.b.id,
          type: 'duplicate_expense', category: 'alert',
          title: '重复消费检测',
          message: '发现相似消费记录，请确认是否重复',
          time: new Date().toISOString(), read: false,
          data: {
            expense1: { desc: dupe.a.desc, amount: dupe.a.amount, cat: dupe.a.cat, catName: dupeCat ? dupeCat.name : dupe.a.cat, date: dupe.a.date, time: dupe.a.time },
            expense2: { desc: dupe.b.desc, amount: dupe.b.amount, cat: dupe.b.cat, catName: dupeCat ? dupeCat.name : dupe.b.cat, date: dupe.b.date, time: dupe.b.time },
            sameAmount: dupe.a.amount === dupe.b.amount,
            sameCategory: dupe.a.cat === dupe.b.cat
          }
        });
      }
    }

    // ── Merge with existing ─────────────────────────────────
    var existingNotifs = data.notifications || [];
    var merged = notifs.map(function (n) {
      var existing = existingNotifs.find(function (e) { return e.id === n.id; });
      return existing ? Object.assign({}, n, { read: existing.read }) : n;
    });

    var weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    existingNotifs.forEach(function (old) {
      if (!merged.find(function (m) { return m.id === old.id; })) {
        if (new Date(old.time).getTime() > weekAgo) {
          merged.push(old);
        }
      }
    });

    // Sort: unread first, then newest
    merged.sort(function (a, b) {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.time) - new Date(a.time);
    });

    data.notifications = merged;
    saveData(data);
    return merged;
  }

  function getNotifications() {
    if (!data.notifications || data.notifications.length === 0) {
      return generateNotifications();
    }
    // Sort: unread first, then by time
    return data.notifications.sort(function (a, b) {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.time) - new Date(a.time);
    });
  }

  function markNotificationRead(id) {
    var notif = data.notifications.find(function (n) { return n.id === id; });
    if (notif) {
      notif.read = true;
      saveData(data);
    }
  }

  function markAllNotificationsRead() {
    if (!data.notifications) return;
    data.notifications.forEach(function (n) { n.read = true; });
    saveData(data);
  }

  function clearNotifications() {
    data.notifications = [];
    saveData(data);
  }

  function resetData() {
    data = cloneDefaults();
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── Tag labels ──────────────────────────────────────────────
  var TAG_LABELS = { adult: '成人', child: '儿童', elder: '老人' };

  // ── Public API ──────────────────────────────────────────────
  var api = {
    // Computed
    getTotalDays: getTotalDays,
    getCurrentDayNumber: getCurrentDayNumber,
    isTripOver: isTripOver,
    getTotalSpent: getTotalSpent,
    getTodaySpent: getTodaySpent,
    getTodayExpenses: getTodayExpenses,
    getPerPersonAvg: getPerPersonAvg,
    getMemberSpending: getMemberSpending,
    getMemberExpenseCount: getMemberExpenseCount,
    getMemberAbsentCount: getMemberAbsentCount,
    getMemberPaid: getMemberPaid,
    getMemberSettlementRows: getMemberSettlementRows,
    getSettlementSuggestions: getSettlementSuggestions,
    getCategoryBreakdown: getCategoryBreakdown,
    getDailyBreakdown: getDailyBreakdown,
    getMemberRanking: getMemberRanking,
    getHighlights: getHighlights,
    getExpensesForDay: getExpensesForDay,
    getExpenseById: getExpenseById,
    dayNumToDate: dayNumToDate,
    dayNumToName: dayNumToName,

    // Lookups
    getCategoryById: getCategoryById,
    getMemberById: getMemberById,
    getVisibleCategories: getVisibleCategories,
    getIcon: getIcon,
    TAG_LABELS: TAG_LABELS,

    // Formatting
    formatMoney: formatMoney,
    formatMoneyNoSymbol: formatMoneyNoSymbol,
    formatDate: formatDate,
    formatDateRange: formatDateRange,
    formatDateShort: formatDateShort,

    // Trip management
    getTrips: getTrips,
    getActiveTrips: getActiveTrips,
    getArchivedTrips: getArchivedTrips,
    getCurrentTripId: getCurrentTripId,
    switchTrip: switchTrip,
    createTrip: createTrip,
    updateTrip: updateTrip,
    archiveTrip: archiveTrip,
    unarchiveTrip: unarchiveTrip,
    deleteTrip: deleteTrip,

    // Data mutations
    addMember: addMember,
    removeMember: removeMember,
    addCategory: addCategory,
    removeCategory: removeCategory,
    toggleCategoryVisibility: toggleCategoryVisibility,
    addExpense: addExpense,
    updateExpense: updateExpense,
    deleteExpense: deleteExpense,
    updateTripConfig: updateTripConfig,
    updateDashboardMetrics: updateDashboardMetrics,
    updateSetting: updateSetting,
    getSetting: getSetting,
    toggleDashboardCard: toggleDashboardCard,
    toggleStatsModule: toggleStatsModule,
    resetData: resetData,
    saveData: function () { saveData(data); },

    // Notifications
    generateNotifications: generateNotifications,
    getNotifications: getNotifications,
    markNotificationRead: markNotificationRead,
    markAllNotificationsRead: markAllNotificationsRead,
    clearNotifications: clearNotifications
  };

  // Getter properties — resolve to current trip's data
  Object.defineProperties(api, {
    trip:            { get: function () { return ct(); },                          configurable: true },
    members:         { get: function () { return ct().members; },                  configurable: true },
    categories:      { get: function () { return ct().categories; },               configurable: true },
    expenses:        { get: function () { return ct().expenses; },                 configurable: true },
    dashboardMetrics:{ get: function () { return ct().dashboardMetrics; },         configurable: true },
    referenceDate:   { get: function () { return ct().referenceDate; },            configurable: true },
    settings:        { get: function () { return data.settings; },                 configurable: true }
  });

  window.TripData = api;
})();

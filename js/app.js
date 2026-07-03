// === 主应用控制器（移动端优化版）===

const App = {
  init() {
    this.showBoot();
    this.bindBootEvents();
    this.bindMobileNav();
    this.bindChapterButtons();
    this.updateClock();
    setInterval(() => this.updateClock(), 30000);
  },

  // === 启动画面 ===
  showBoot() {
    document.getElementById('screen-boot').classList.add('active');
    document.getElementById('screen-dashboard').classList.remove('active');
    setTimeout(() => document.getElementById('login-input').focus(), 500);
  },

  bindBootEvents() {
    document.getElementById('login-btn').onclick = () => this.login();
    document.getElementById('login-input').onkeydown = (e) => {
      if (e.key === 'Enter') this.login();
    };
  },

  login() {
    const input = document.getElementById('login-input').value.trim();
    const id = input || 'DET-' + String(Math.floor(Math.random() * 9000) + 1000);
    GameState.detectiveId = id.toUpperCase();
    document.getElementById('detective-id').textContent = `调查员：${GameState.detectiveId}`;
    document.getElementById('assigned-detective').textContent = GameState.detectiveId;

    document.getElementById('screen-boot').classList.remove('active');
    document.getElementById('screen-dashboard').classList.add('active');

    Chapters.addLog('系统登录：' + GameState.detectiveId);
    Chapters.addLog('新案件分配：CASE-2026-0714');

    this.showView('dashboard');
    this.updateBottomBar('dashboard');
  },

  // === 移动端导航 ===
  bindMobileNav() {
    // 汉堡菜单
    document.getElementById('btn-hamburger').onclick = () => this.toggleMenu(true);
    document.getElementById('btn-menu-close').onclick = () => this.toggleMenu(false);
    document.getElementById('menu-overlay').onclick = () => this.toggleMenu(false);

    // 抽屉菜单导航
    document.querySelectorAll('#menu-drawer .nav-item').forEach(item => {
      item.onclick = () => {
        this.toggleMenu(false);
        const nav = item.dataset.nav;
        if (item.classList.contains('locked')) return;
        if (nav === 'cases') this.showChapter(-1);
        else if (nav === 'suspects-nav') this.showChapter(4);
        else if (nav === 'evidence-nav') this.showChapter(1);
        else if (nav === 'surveillance-nav') this.showChapter(3);
        else if (nav === 'closed-nav') this.showChapter(9);
      };
    });

    // 桌面端侧边栏
    document.querySelectorAll('#sidebar-desktop .nav-item').forEach(item => {
      item.onclick = () => {
        const nav = item.dataset.nav;
        if (item.classList.contains('locked')) return;
        if (nav === 'cases') this.showChapter(-1);
        else if (nav === 'suspects-nav') this.showChapter(4);
        else if (nav === 'evidence-nav') this.showChapter(1);
        else if (nav === 'surveillance-nav') this.showChapter(3);
        else if (nav === 'closed-nav') this.showChapter(9);
      };
    });

    // 底部导航栏
    document.querySelectorAll('.bottom-tab').forEach(tab => {
      tab.onclick = () => {
        const t = tab.dataset.tab;
        const map = { dashboard:-1, crimescene:0, evidence:1, suspects:4, deduction:7 };
        if (map[t] !== undefined) {
          this.showChapter(map[t]);
          this.updateBottomBar(t);
        }
      };
    });

    // 移动端快速chips
    document.querySelectorAll('.mobile-nav-chip').forEach(chip => {
      chip.onclick = () => {
        const ch = parseInt(chip.dataset.chapter);
        this.showChapter(ch);
        this.updateMobileChips(ch);
      };
    });

    // FAB + 右侧面板
    document.getElementById('fab-panel').onclick = () => this.togglePanel(true);
    document.getElementById('btn-panel-close').onclick = () => this.togglePanel(false);
    document.getElementById('panel-overlay').onclick = () => this.togglePanel(false);
  },

  toggleMenu(open) {
    document.getElementById('menu-overlay').classList.toggle('open', open);
    document.getElementById('menu-drawer').classList.toggle('open', open);
  },

  togglePanel(open) {
    document.getElementById('panel-overlay').classList.toggle('open', open);
    document.getElementById('panel-sheet').classList.toggle('open', open);
    if (open) {
      // 同步日志和证据墙到弹窗
      document.getElementById('panel-log-entries').innerHTML = document.getElementById('log-entries').innerHTML;
      document.getElementById('panel-evidence-wall').innerHTML = document.getElementById('evidence-wall').innerHTML;
    }
  },

  updateBottomBar(tab) {
    document.querySelectorAll('.bottom-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  },

  updateMobileChips(chapter) {
    document.querySelectorAll('.mobile-nav-chip').forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.chapter) === chapter);
    });
  },

  // === 章节按钮 ===
  bindChapterButtons() {
    document.getElementById('btn-start-investigation').onclick = () => this.showChapter(0);
    document.getElementById('btn-to-evidence').onclick = () => this.showChapter(1);
    document.getElementById('btn-to-autopsy').onclick = () => this.showChapter(2);
    document.getElementById('btn-to-surveillance').onclick = () => this.showChapter(3);
    document.getElementById('btn-to-suspects').onclick = () => this.showChapter(4);
    document.getElementById('btn-to-deduction').onclick = () => this.showChapter(7);
    document.getElementById('btn-to-arrest').onclick = () => this.showChapter(8);
    document.getElementById('btn-restart').onclick = () => this.restart();
  },

  // === 视图切换 ===
  showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById('view-' + viewName);
    if (view) view.classList.add('active');
  },

  showChapter(chapter) {
    if (chapter === -1) chapter = 10; // dashboard
    GameState.currentChapter = chapter;

    const viewMap = { 0:'crimescene', 1:'evidence', 2:'autopsy', 3:'surveillance', 4:'suspects', 5:'interrogation', 6:'timeline', 7:'deduction', 8:'arrest', 9:'ending', 10:'dashboard' };
    this.showView(viewMap[chapter] || 'dashboard');

    // 更新底部栏
    const tabMap = { 0:'crimescene', 1:'evidence', 4:'suspects', 7:'deduction', 10:'dashboard' };
    if (tabMap[chapter]) this.updateBottomBar(tabMap[chapter]);

    // 更新移动chips
    this.updateMobileChips(chapter);

    // 自动解锁侧边栏
    const unlockMap = {
      0:['suspects-nav','evidence-nav'],
      1:['suspects-nav','evidence-nav','surveillance-nav'],
      2:['suspects-nav','evidence-nav','surveillance-nav'],
      3:['suspects-nav','evidence-nav','surveillance-nav'],
      4:['suspects-nav','evidence-nav','surveillance-nav','dna-nav'],
    };
    (unlockMap[chapter] || []).forEach(navId => {
      document.querySelectorAll('[data-nav="'+navId+'"]').forEach(el => {
        el.classList.remove('locked');
        el.style.opacity = '1';
        el.style.cursor = 'pointer';
      });
    });

    // 初始化各章节
    switch(chapter) {
      case 0: Chapters.initCrimeScene(); break;
      case 1: Chapters.initEvidenceCenter(); break;
      case 2: Chapters.initAutopsy(); break;
      case 3: Chapters.initSurveillance(); break;
      case 4: Chapters.initSuspects(); break;
      case 5: break;
      case 6: Chapters.initTimeline(); break;
      case 7: Chapters.initDeduction(); break;
      case 8: Chapters.initArrest(); break;
      case 9: Chapters.initEnding(); break;
    }

    // 滚动到顶部
    document.querySelector('.content').scrollTop = 0;
  },

  // === 时钟 ===
  updateClock() {
    const now = new Date();
    document.getElementById('sys-clock').textContent =
      String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  },

  // === 重启 ===
  restart() {
    GameState.currentChapter = 0;
    GameState.collectedEvidence = [];
    GameState.analyzedEvidence = [];
    GameState.searchedRooms = [];
    GameState.suspectsInterviewed = [];
    GameState.timelineCorrect = false;
    GameState.deductionCorrect = false;
    GameState.arrestCorrect = false;
    GameState.hintCount = 0;
    GameState.logs = [];
    GameState.ending = null;
    GameState.deductionConnections = [];
    GameState.currentSuspect = null;

    Object.values(Suspects).forEach(s => s._told = false);

    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.nav !== 'cases') {
        el.classList.add('locked'); el.style.opacity = '0.5'; el.style.cursor = 'not-allowed';
      }
    });
    document.querySelectorAll('.nav-item[data-nav="cases"]').forEach(el => el.classList.add('active'));

    document.querySelectorAll('.room').forEach(r => r.classList.remove('searched'));
    document.getElementById('arrest-result').classList.add('hidden');
    document.getElementById('surv-player').classList.add('hidden');
    document.getElementById('timeline-feedback').textContent = '';

    this.showView('dashboard');
    this.updateBottomBar('dashboard');
    this.updateMobileChips(-1);
    Chapters.addLog('案件已重置');
    Chapters.renderLogs();
    Chapters.updateEvidenceWall();
  },
};

// === 初始化 ===
document.addEventListener('DOMContentLoaded', () => App.init());

// === 切换视图时滚动到顶部 ===
const contentObserver = new MutationObserver(() => {
  const c = document.querySelector('.content');
  if (c) c.scrollTop = 0;
});
document.addEventListener('DOMContentLoaded', () => {
  const c = document.querySelector('.content');
  if (c) contentObserver.observe(c, { childList:true, subtree:true });
});
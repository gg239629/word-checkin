// === 主应用控制器 ===

const App = {
  init() {
    // 启动画面
    this.showBoot();
    this.bindBootEvents();
    this.bindNavEvents();
    this.bindChapterButtons();
    this.updateClock();
    setInterval(() => this.updateClock(), 30000);
  },

  // === 启动画面 ===
  showBoot() {
    document.getElementById('screen-boot').classList.add('active');
    document.getElementById('screen-dashboard').classList.remove('active');
    setTimeout(() => {
      document.getElementById('login-input').focus();
    }, 500);
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
    Chapters.addLog('新案件分配：CASE-2026-0714 青禾公寓命案');
    
    this.showView('dashboard');
  },

  // === 导航 ===
  bindNavEvents() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.onclick = () => {
        const nav = item.dataset.nav;
        if (item.classList.contains('locked')) return;
        
        // 更新活跃状态
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        // 根据导航切换
        if (nav === 'cases') this.showView('dashboard');
        else if (nav === 'suspects-nav') this.showChapter(4);
        else if (nav === 'evidence-nav') this.showChapter(1);
        else if (nav === 'surveillance-nav') this.showChapter(3);
        else if (nav === 'closed-nav') this.showChapter(9);
      };
    });
  },

  // === 章节按钮绑定 ===
  bindChapterButtons() {
    document.getElementById('btn-start-investigation').onclick = () => this.showChapter(0);
    document.getElementById('btn-to-evidence').onclick = () => this.showChapter(1);
    document.getElementById('btn-to-autopsy').onclick = () => this.showChapter(2);
    document.getElementById('btn-to-surveillance').onclick = () => this.showChapter(3);
    document.getElementById('btn-to-suspects').onclick = () => this.showChapter(4);
    document.getElementById('btn-to-deduction').onclick = () => this.showChapter(7);
    document.getElementById('btn-to-arrest').onclick = () => this.showChapter(8);
    document.getElementById('btn-restart').onclick = () => this.restart();

    // 时间线的去推理板按钮
    const btnTL = document.getElementById('btn-to-deduction');
    // 证据中心按钮
    const btnAutopsy = document.getElementById('btn-to-autopsy');
    if (btnAutopsy) btnAutopsy.onclick = () => this.showChapter(2);
  },

  // === 视图切换 ===
  showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById(`view-${viewName}`);
    if (view) view.classList.add('active');
  },

  showChapter(chapter) {
    GameState.currentChapter = chapter;
    const viewMap = ['crimescene', 'evidence', 'autopsy', 'surveillance', 'suspects', 'interrogation', 'timeline', 'deduction', 'arrest', 'ending'];
    this.showView(viewMap[chapter]);

    // 自动解锁侧边栏
    const navMap = {
      0: ['cases'],
      1: ['cases', 'evidence-nav'],
      2: ['cases', 'evidence-nav'],
      3: ['cases', 'evidence-nav', 'surveillance-nav'],
      4: ['cases', 'evidence-nav', 'surveillance-nav', 'suspects-nav'],
      5: ['cases', 'evidence-nav', 'surveillance-nav', 'suspects-nav'],
      6: ['cases', 'evidence-nav', 'surveillance-nav', 'suspects-nav'],
      7: ['cases', 'evidence-nav', 'surveillance-nav', 'suspects-nav'],
      8: ['cases', 'evidence-nav', 'surveillance-nav', 'suspects-nav'],
      9: ['cases', 'evidence-nav', 'surveillance-nav', 'suspects-nav', 'closed-nav'],
    };

    (navMap[chapter] || []).forEach(navId => {
      const el = document.querySelector(`[data-nav="${navId}"]`);
      if (el) {
        el.classList.remove('locked');
        el.style.opacity = '1';
        el.style.cursor = 'pointer';
      }
    });

    // 初始化各章节
    switch(chapter) {
      case 0: Chapters.initCrimeScene(); break;
      case 1: Chapters.initEvidenceCenter(); break;
      case 2: Chapters.initAutopsy(); break;
      case 3: Chapters.initSurveillance(); break;
      case 4: Chapters.initSuspects(); break;
      case 5: break; // 询问室由嫌疑人页面触发
      case 6: Chapters.initTimeline(); break;
      case 7: Chapters.initDeduction(); break;
      case 8: Chapters.initArrest(); break;
      case 9: Chapters.initEnding(); break;
    }
  },

  // === 时钟 ===
  updateClock() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    document.getElementById('sys-clock').textContent = time;
  },

  // === 重启 ===
  restart() {
    // 重置状态
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

    // 重置嫌疑人tell状态
    Object.values(Suspects).forEach(s => s._told = false);

    // 重置侧边栏
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.nav !== 'cases') {
        el.classList.add('locked');
        el.style.opacity = '0.5';
        el.style.cursor = 'not-allowed';
      }
    });
    document.querySelector('[data-nav="cases"]').classList.add('active');

    // 清除session
    sessionStorage.removeItem('viewedSurv');

    // 重置UI
    document.querySelectorAll('.room').forEach(r => r.classList.remove('searched'));
    document.getElementById('arrest-result').classList.add('hidden');
    document.getElementById('surv-player').classList.add('hidden');
    document.getElementById('surv-enhanced').classList.add('hidden');
    document.getElementById('timeline-feedback').textContent = '';
    document.getElementById('deduction-feedback').textContent = '';

    // 返回案件大厅
    this.showView('dashboard');
    Chapters.addLog('案件已重置，准备接受新任务');
    Chapters.renderLogs();
    Chapters.updateEvidenceWall();
  },
};

// 平滑滚动到内容区
function scrollToView() {
  document.querySelector('.content').scrollTo({ top: 0, behavior: 'smooth' });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// 监听视图切换后滚动到顶部
const observer = new MutationObserver(() => {
  const content = document.querySelector('.content');
  if (content) content.scrollTop = 0;
});
document.addEventListener('DOMContentLoaded', () => {
  const content = document.querySelector('.content');
  if (content) observer.observe(content, { childList: true, subtree: true });
});

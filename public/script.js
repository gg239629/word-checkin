// ===== 菲菲打卡日记 =====
var $ = function(id) { return document.getElementById(id); };

// State
var curY = new Date().getFullYear();
var curM = new Date().getMonth() + 1;
var selDate = fmt(new Date());
var selMood = '';
var curImg = null;
var checks = {};

function fmt(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function pad(n) { return String(n).padStart(2, '0'); }
function parse(s) { return new Date(s + 'T00:00:00'); }
function md(d) { return (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
function wd(d) { return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]; }

// Toast
function toast(msg, type) {
  var e = $('toast'); e.textContent = msg;
  e.className = 'toast show ' + (type || 'success');
  setTimeout(function() { e.className = 'toast'; }, 2000);
}

// API
async function api(method, url, body) {
  var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  var res = await fetch(url, opts);
  return res.json();
}

// Load
async function loadChecks(y, m) {
  try {
    var data = await api('GET', '/api/checkins?year=' + y + '&month=' + m);
    checks = {};
    for (var i = 0; i < data.length; i++) checks[data[i].date] = data[i];
    renderCal();
    renderGal();
  } catch (e) { console.error(e); }
}

async function loadStats() {
  try {
    var data = await api('GET', '/api/stats');
    $('streakNum').textContent = data.streak;
    $('streakCount').textContent = data.streak;
    $('totalCount').textContent = data.total;
    $('monthDone').textContent = data.currentMonth;
    $('monthTotal').textContent = data.monthTotal;
  } catch (e) {}
}

// Calendar
function renderCal() {
  var fd = new Date(curY, curM - 1, 1);
  var ld = new Date(curY, curM, 0);
  var start = fd.getDay();
  var days = ld.getDate();
  var prevDays = new Date(curY, curM - 1, 0).getDate();
  var today = fmt(new Date());

  $('currentMonthLabel').textContent = curY + '年' + curM + '月';
  var h = '';

  for (var i = start - 1; i >= 0; i--) {
    h += '<div class="cal-day other-month">' + (prevDays - i) + '</div>';
  }

  for (var d = 1; d <= days; d++) {
    var ds = curY + '-' + pad(curM) + '-' + pad(d);
    var cls = 'cal-day';
    if (ds === today) cls += ' today';
    if (checks[ds]) { cls += ' checked'; if (checks[ds].mood) cls += ' has-mood'; }
    if (ds === selDate) cls += ' selected';
    h += '<div class="' + cls + '" data-date="' + ds + '"' +
         (checks[ds] && checks[ds].mood ? ' data-mood="' + checks[ds].mood + '"' : '') + '>' + d + '</div>';
  }

  var total = start + days;
  var rem = (7 - total % 7) % 7;
  for (var d = 1; d <= rem; d++) h += '<div class="cal-day other-month">' + d + '</div>';

  $('calendarGrid').innerHTML = h;

  var cells = document.querySelectorAll('.cal-day[data-date]');
  for (var i = 0; i < cells.length; i++) {
    cells[i].addEventListener('click', function() { selectDate(this.dataset.date); });
  }
}

function selectDate(ds) {
  selDate = ds;
  var d = parse(ds);
  var today = fmt(new Date());
  $('checkinDate').textContent = (ds === today ? '今天 · ' : '') + md(d) + ' ' + wd(d);

  var all = document.querySelectorAll('.cal-day');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('selected');
  var sel = document.querySelector('.cal-day[data-date="' + ds + '"]');
  if (sel) sel.classList.add('selected');

  var c = checks[ds];
  var dot = $('checkinStatusDot');
  if (c) {
    dot.className = 'status-dot checked';
    $('noteInput').value = c.note || '';
    selMood = c.mood || '';
    if (c.image) {
      $('uploadEmpty').style.display = 'none';
      $('uploadFilled').style.display = 'block';
      $('previewThumb').src = c.image;
      curImg = c.image;
    } else {
      resetUpload();
    }
  } else {
    dot.className = 'status-dot unchecked';
    $('noteInput').value = '';
    selMood = '';
    resetUpload();
  }

  // Mood buttons
  var btns = document.querySelectorAll('.mood-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].dataset.mood === selMood);
  }
}

function resetUpload() {
  $('uploadEmpty').style.display = 'flex';
  $('uploadFilled').style.display = 'none';
  $('previewThumb').src = '';
  $('imageInput').value = '';
  curImg = null;
}

// Mood
var moodBtns = document.querySelectorAll('.mood-btn');
for (var i = 0; i < moodBtns.length; i++) {
  moodBtns[i].addEventListener('click', function() {
    for (var j = 0; j < moodBtns.length; j++) moodBtns[j].classList.remove('active');
    this.classList.add('active');
    selMood = this.dataset.mood;
  });
}

// Upload
var upArea = $('uploadArea');
var imgIn = $('imageInput');
var upEmpty = $('uploadEmpty');
var upFilled = $('uploadFilled');
var upThumb = $('previewThumb');

upArea.addEventListener('click', function() { imgIn.click(); });

function compressImg(file) {
  return new Promise(function(resolve) {
    var MAX = 400 * 1024;
    if (file.size <= MAX) {
      var r = new FileReader();
      r.onload = function(e) { resolve(e.target.result); };
      r.readAsDataURL(file);
      return;
    }
    var r = new FileReader();
    r.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var c = document.createElement('canvas');
        var w = img.width, h = img.height;
        if (w > 1000 || h > 1000) { var ra = Math.min(1000 / w, 1000 / h); w *= ra; h *= ra; }
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });
}

imgIn.addEventListener('change', async function(e) {
  var file = e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { toast('图片超过10MB', 'error'); return; }
  try {
    var url = await compressImg(file);
    upEmpty.style.display = 'none';
    upFilled.style.display = 'block';
    upThumb.src = url;
    curImg = url;
  } catch (ex) { toast('图片处理失败', 'error'); }
});

$('removeImage').addEventListener('click', function(e) {
  e.stopPropagation();
  resetUpload();
});

// Check-in
$('checkinBtn').addEventListener('click', async function() {
  var note = $('noteInput').value.trim();
  var body = { date: selDate, note: note, mood: selMood };
  if (curImg && curImg.indexOf('data:') === 0) body.image = curImg;
  else if (curImg) body.image = curImg;
  else body.image = '';

  var btn = $('checkinBtn');
  btn.disabled = true;
  btn.textContent = '处理中...';

  try {
    var res = await api('POST', '/api/checkin', body);
    if (res.success) {
      checks[selDate] = res.data;
      toast('打卡成功！🌸', 'success');
      spawnConfetti();
      selectDate(selDate);
      renderCal();
      loadStats();
      renderGal();
      resetUpload();
      $('noteInput').value = '';
      selMood = '';
      var btns = document.querySelectorAll('.mood-btn');
      for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    } else {
      toast(res.error || '打卡失败', 'error');
    }
  } catch (ex) {
    toast('网络错误，请重试', 'error');
  }
  btn.disabled = false;
  btn.textContent = '✅ 打卡签到';
});

// Gallery
function renderGal() {
  var items = [];
  var keys = Object.keys(checks);
  for (var i = 0; i < keys.length; i++) {
    if (checks[keys[i]].image) items.push(checks[keys[i]]);
  }
  items.sort(function(a, b) { return b.date.localeCompare(a.date); });

  var grid = $('galleryGrid');
  if (items.length === 0) {
    grid.innerHTML = '<div class="gallery-empty">还没有打卡记录<br>开始记录吧～</div>';
    return;
  }

  var h = '';
  for (var i = 0; i < items.length; i++) {
    var c = items[i];
    h += '<div class="gallery-item" data-img="' + c.image + '">';
    h += '<img src="' + c.image + '" loading="lazy">';
    h += '<div class="gallery-meta">';
    h += '<span class="gallery-date">' + c.date + '</span>';
    if (c.mood) h += '<span class="gallery-mood">' + c.mood + '</span>';
    h += '</div></div>';
  }
  grid.innerHTML = h;

  var items = grid.querySelectorAll('.gallery-item');
  for (var i = 0; i < items.length; i++) {
    items[i].addEventListener('click', function() { showLb(this.dataset.img); });
  }
}

// Lightbox
var lb = $('lightbox');
var lbImg = $('lightboxImg');

function showLb(src) {
  lbImg.src = src;
  lb.classList.add('show');
}
$('lbClose').addEventListener('click', function() { lb.classList.remove('show'); });
lb.addEventListener('click', function(e) { if (e.target === lb) lb.classList.remove('show'); });

// Confetti
var ctx = document.getElementById('confettiCanvas').getContext('2d');
var pieces = [];
var animId = null;

function spawnConfetti() {
  var w = window.innerWidth, h = window.innerHeight;
  document.getElementById('confettiCanvas').width = w;
  document.getElementById('confettiCanvas').height = h;
  var colors = ['#ff6b9d', '#ff8eb3', '#ff4081', '#ffb347', '#66bb6a', '#81d4fa', '#ce93d8'];
  pieces = [];
  for (var i = 0; i < 50; i++) {
    pieces.push({
      x: Math.random() * w, y: -20, w: Math.random() * 6 + 3, h: Math.random() * 10 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3, vy: Math.random() * 2 + 1,
      rot: Math.random() * 360, rv: (Math.random() - 0.5) * 8, op: 1
    });
  }
  if (animId) cancelAnimationFrame(animId);
  var f = 0;
  (function loop() {
    f++;
    if (f > 150) { ctx.clearRect(0, 0, w, h); animId = null; return; }
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      p.x += p.vx; p.vy += 0.06; p.y += p.vy; p.vx *= 0.995; p.rot += p.rv; p.op -= 0.007;
      if (p.op > 0) {
        ctx.save(); ctx.globalAlpha = p.op; ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
    }
    animId = requestAnimationFrame(loop);
  })();
}

// Navigation
$('prevMonth').addEventListener('click', function() {
  curM--; if (curM === 0) { curM = 12; curY--; }
  loadChecks(curY, curM);
});
$('nextMonth').addEventListener('click', function() {
  curM++; if (curM === 13) { curM = 1; curY++; }
  loadChecks(curY, curM);
});

// Init
loadChecks(curY, curM);
loadStats();
selectDate(fmt(new Date()));

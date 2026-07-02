// ============================================================
//  背单词打卡 - 前端逻辑
// ============================================================

// ===== State =====
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let selectedDate = formatDate(new Date());
let checkins = {};
let currentImageDataUrl = null;
let isLoading = false;

// ===== DOM Refs =====
const $ = id => document.getElementById(id);
const calendarGrid = $('calendarGrid');
const monthLabel = $('currentMonthLabel');
const streakCount = $('streakCount');
const totalCount = $('totalCount');
const totalWords = $('totalWords');
const monthCount = $('monthCount');
const monthTotalEl = $('monthTotal');
const progressFill = $('progressFill');
const progressPercent = $('progressPercent');
const streakBadge = $('streakBadge');
const streakBadgeText = $('streakBadgeText');
const checkinDateEl = $('checkinDate');
const checkedBadge = $('checkedBadge');
const notCheckedBadge = $('notCheckedBadge');
const existingImage = $('existingImage');
const existingImagePreview = $('existingImagePreview');
const existingImageRemove = $('existingImageRemove');
const wordCount = $('wordCount');
const noteInput = $('noteInput');
const imageInput = $('imageInput');
const uploadArea = $('uploadArea');
const uploadPlaceholder = $('uploadPlaceholder');
const uploadPreview = $('uploadPreview');
const previewImage = $('previewImage');
const removeImageBtn = $('removeImage');
const checkinBtn = $('checkinBtn');
const deleteBtn = $('deleteBtn');
const galleryGrid = $('galleryGrid');
const toast = $('toast');
const loadingOverlay = $('loadingOverlay');
const confettiCanvas = $('confettiCanvas');
const ctx = confettiCanvas.getContext('2d');

// ===== Helpers =====
function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function showLoading() { loadingOverlay.classList.add('show'); isLoading = true; }
function hideLoading() { loadingOverlay.classList.remove('show'); isLoading = false; }

function showToast(msg, type) {
  toast.textContent = msg;
  toast.className = 'toast show ' + (type || 'info');
  setTimeout(() => { toast.className = 'toast'; }, 2200);
}

// ===== API =====
async function fetchCheckins(year, month) {
  showLoading();
  try {
    const res = await fetch('/api/checkins?year=' + year + '&month=' + month);
    const data = await res.json();
    checkins = {};
    data.forEach(c => { checkins[c.date] = c; });
    renderCalendar();
    renderGallery();
    updateProgress();
  } catch (e) {
    console.error('Failed to fetch checkins:', e);
    showToast('加载数据失败，请检查网络连接', 'error');
  } finally {
    hideLoading();
  }
}

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    streakCount.textContent = data.streak;
    totalCount.textContent = data.total;
    monthCount.textContent = data.currentMonth;
    monthTotalEl.textContent = data.monthTotal;

    totalWords.textContent = data.totalWords || 0;

    // Streak badge
    updateStreakBadge(data.streak);
    // Progress bar
    const pct = data.monthTotal > 0 ? Math.round(data.currentMonth / data.monthTotal * 100) : 0;
    progressFill.style.width = pct + '%';
    progressPercent.textContent = data.currentMonth + '/' + data.monthTotal + ' (' + pct + '%)';
  } catch (e) { console.error(e); }
}

function updateStreakBadge(streak) {
  if (streak >= 365) {
    streakBadge.className = 'streak-badge';
    streakBadgeText.textContent = '🏆 传奇！连续打卡 ' + streak + ' 天！';
  } else if (streak >= 100) {
    streakBadge.className = 'streak-badge';
    streakBadgeText.textContent = '🌟 百天成就！连续打卡 ' + streak + ' 天！';
  } else if (streak >= 30) {
    streakBadge.className = 'streak-badge';
    streakBadgeText.textContent = '🔥 一个月啦！连续打卡 ' + streak + ' 天！';
  } else if (streak >= 7) {
    streakBadge.className = 'streak-badge';
    streakBadgeText.textContent = '💪 坚持一周！连续打卡 ' + streak + ' 天！';
  } else if (streak >= 3) {
    streakBadge.className = 'streak-badge';
    streakBadgeText.textContent = '✨ 势头不错！连续打卡 ' + streak + ' 天！';
  } else {
    streakBadge.className = 'streak-badge hidden';
  }
}

function updateProgress() {
  const now = new Date();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthPrefix = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const done = Object.keys(checkins).filter(d => d.startsWith(monthPrefix)).length;
  const pct = totalDays > 0 ? Math.round(done / totalDays * 100) : 0;
  progressFill.style.width = pct + '%';
  progressPercent.textContent = done + '/' + totalDays + ' (' + pct + '%)';
}

// ===== Calendar =====
function renderCalendar() {
  const firstDay = new Date(currentYear, currentMonth - 1, 1);
  const lastDay = new Date(currentYear, currentMonth, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const daysInPrev = new Date(currentYear, currentMonth - 1, 0).getDate();
  const todayStr = formatDate(new Date());

  monthLabel.textContent = currentYear + '\u5e74' + currentMonth + '\u6708';

  let html = '';

  // Previous month days
  for (let i = startDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const dateStr = prevYear + '-' + String(prevMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    html += '<div class="cal-day other-month" data-date="' + dateStr + '">' + d + '</div>';
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = currentYear + '-' + String(currentMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    let cls = 'cal-day';
    if (dateStr === todayStr) cls += ' today';
    if (checkins[dateStr]) {
      cls += ' checked';
      if (checkins[dateStr].image) cls += ' has-image';
    }
    if (dateStr === selectedDate) cls += ' selected';
    html += '<div class="' + cls + '" data-date="' + dateStr + '">' + d + '</div>';
  }

  // Next month days
  const totalCells = startDay + daysInMonth;
  const remaining = (7 - totalCells % 7) % 7;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  for (let d = 1; d <= remaining; d++) {
    const dateStr = nextYear + '-' + String(nextMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    html += '<div class="cal-day other-month" data-date="' + dateStr + '">' + d + '</div>';
  }

  calendarGrid.innerHTML = html;

  calendarGrid.querySelectorAll('.cal-day').forEach(el => {
    el.addEventListener('click', () => { if (el.dataset.date) selectDate(el.dataset.date); });
  });
}

function selectDate(date) {
  selectedDate = date;
  const d = new Date(date);
  const weekdays = ['\u65e5', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d'];
  const isToday = date === formatDate(new Date());
  checkinDateEl.textContent = (isToday ? '\u4eca\u5929 ' : '') + date + ' \u661f\u671f' + weekdays[d.getDay()];

  // Highlight
  document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
  const sel = document.querySelector('.cal-day[data-date="' + date + '"]');
  if (sel) sel.classList.add('selected');

  // Update check-in panel
  const c = checkins[date];
  if (c) {
    checkedBadge.style.display = 'inline-flex';
    notCheckedBadge.style.display = 'none';
    noteInput.value = c.note || '';
    wordCount.value = c.words || '';

    if (c.image) {
      existingImage.style.display = 'inline-block';
      existingImagePreview.src = c.image;
      uploadPlaceholder.style.display = 'none';
      uploadPreview.style.display = 'none';
    } else {
      existingImage.style.display = 'none';
      resetUpload();
    }
    deleteBtn.style.display = 'block';
    checkinBtn.textContent = '\u2705 \u66f4\u65b0\u6253\u5361';
  } else {
    checkedBadge.style.display = 'none';
    notCheckedBadge.style.display = 'inline-flex';
    noteInput.value = '';
    wordCount.value = '';
    existingImage.style.display = 'none';
    resetUpload();
    deleteBtn.style.display = 'none';
    checkinBtn.textContent = '\u2705 \u6253\u5361';
  }
}

function resetUpload() {
  uploadPlaceholder.style.display = 'flex';
  uploadPreview.style.display = 'none';
  previewImage.src = '';
  imageInput.value = '';
  currentImageDataUrl = null;
}

// ===== Image Upload (with compression) =====
uploadArea.addEventListener('click', () => imageInput.click());

function compressImage(file) {
  return new Promise((resolve) => {
    const MAX_SIZE = 500 * 1024; // 500KB target
    if (file.size <= MAX_SIZE) {
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target.result);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width *= ratio; height *= ratio;
        }
        canvas.width = width; canvas.height = height;
        const ctx2 = canvas.getContext('2d');
        ctx2.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

imageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { showToast('图片超过 10MB 限制', 'error'); return; }
  showToast('正在处理图片...', 'info');
  try {
    const dataUrl = await compressImage(file);
    uploadPlaceholder.style.display = 'none';
    uploadPreview.style.display = 'block';
    previewImage.src = dataUrl;
    existingImage.style.display = 'none';
    currentImageDataUrl = dataUrl;
    showToast('图片已加载 ✓', 'success');
  } catch (e) {
    showToast('图片处理失败', 'error');
  }
});

removeImageBtn.addEventListener('click', (e) => { e.stopPropagation(); resetUpload(); });
existingImageRemove.addEventListener('click', (e) => {
  e.stopPropagation();
  existingImage.style.display = 'none';
  // Also clear current image data if we had one loaded
});

// ===== Drag & Drop =====
uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', async (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) {
    showToast('请拖入图片文件', 'error'); return;
  }
  if (file.size > 10 * 1024 * 1024) { showToast('图片超过 10MB 限制', 'error'); return; }
  showToast('正在处理图片...', 'info');
  try {
    const dataUrl = await compressImage(file);
    uploadPlaceholder.style.display = 'none';
    uploadPreview.style.display = 'block';
    previewImage.src = dataUrl;
    existingImage.style.display = 'none';
    currentImageDataUrl = dataUrl;
    showToast('图片已加载 ✓', 'success');
  } catch (e) { showToast('图片处理失败', 'error'); }
});

// ===== Check-in =====
checkinBtn.addEventListener('click', doCheckin);

// Keyboard shortcut: Enter to check in
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.target.closest('input, textarea, select')) {
    e.preventDefault();
    doCheckin();
  }
});

async function doCheckin() {
  if (isLoading) return;
  const words = parseInt(wordCount.value) || 0;
  const note = noteInput.value.trim();
  const body = { date: selectedDate, note, words };

  // Determine image source
  if (currentImageDataUrl) {
    body.image = currentImageDataUrl;
  } else if (existingImage.style.display !== 'none') {
    body.image = existingImagePreview.src;
  }

  checkinBtn.disabled = true;
  showLoading();
  checkinBtn.textContent = '\u5904\u7406\u4e2d...';
  try {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await res.json();
    if (result.success) {
      checkins[selectedDate] = result.data;
      showToast('\u6253\u5361\u6210\u529f! \u52a0\u6cb9! \ud83c\udf89', 'success');
      spawnConfetti();
      selectDate(selectedDate);
      renderCalendar();
      fetchStats();
      renderGallery();
    } else {
      showToast(result.error || '\u6253\u5361\u5931\u8d25', 'error');
    }
  } catch (e) {
    showToast('\u7f51\u7edc\u9519\u8bef: ' + e.message, 'error');
  }
  checkinBtn.disabled = false;
  checkinBtn.textContent = checkins[selectedDate] ? '\u2705 \u66f4\u65b0\u6253\u5361' : '\u2705 \u6253\u5361';
  hideLoading();
}

// ===== Delete =====
deleteBtn.addEventListener('click', async () => {
  if (!confirm('\u786e\u5b9a\u5220\u9664 ' + selectedDate + ' \u7684\u6253\u5361\u8bb0\u5f55\u5417\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u6062\u590d\u3002')) return;
  showLoading();
  try {
    const res = await fetch('/api/checkin/' + selectedDate, { method: 'DELETE' });
    if (res.ok) {
      delete checkins[selectedDate];
      showToast('\u5df2\u5220\u9664', 'info');
      selectDate(selectedDate);
      renderCalendar();
      fetchStats();
      renderGallery();
    }
  } catch (e) { showToast('\u5220\u9664\u5931\u8d25', 'error'); }
  hideLoading();
});

// ===== Gallery =====
function renderGallery() {
  const images = Object.values(checkins).filter(c => c.image).sort((a, b) => b.date.localeCompare(a.date));
  if (images.length === 0) {
    galleryGrid.innerHTML = '<div class="gallery-empty"><span class="empty-icon">\ud83d\udcf7</span>\u8fd8\u6ca1\u6709\u4e0a\u4f20\u622a\u56fe<br>\u52a0\u6cb9\u5f00\u59cb\u6253\u5361\u5427!</div>';
    return;
  }
  galleryGrid.innerHTML = images.map(c =>
    '<div class="gallery-item" data-image="' + c.image + '"><img src="' + c.image + '" loading="lazy" alt="' + c.date + '"><div class="gallery-date">' + c.date + (c.words ? ' \ud83d\udcd6' + c.words + '\u8bcd' : '') + '</div></div>'
  ).join('');

  galleryGrid.querySelectorAll('.gallery-item').forEach(el => {
    el.addEventListener('click', () => showLightbox(el.dataset.image));
  });
}

// ===== Lightbox =====
let lightbox = null;
function showLightbox(src) {
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.innerHTML = '<span class="lb-close">\u2715</span><img>';
    document.body.appendChild(lightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lb-close')) {
        lightbox.classList.remove('active');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        lightbox.classList.remove('active');
      }
    });
  }
  lightbox.querySelector('img').src = src;
  lightbox.classList.add('active');
}

// ===== Confetti =====
let confettiPieces = [];
let confettiAnimId = null;

function spawnConfetti() {
  const W = confettiCanvas.width = window.innerWidth;
  const H = confettiCanvas.height = window.innerHeight;
  confettiPieces = [];

  const colors = ['#667eea', '#764ba2', '#48bb78', '#fbbf24', '#fc8181', '#f687b3', '#63b3ed', '#f6ad55'];
  for (let i = 0; i < 80; i++) {
    confettiPieces.push({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.5,
      w: Math.random() * 8 + 4,
      h: Math.random() * 12 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 2 + 1.5,
      rotation: Math.random() * 360,
      rv: (Math.random() - 0.5) * 10,
      opacity: 1,
      decay: 0.003 + Math.random() * 0.004
    });
  }

  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
  let frame = 0;

  function animate() {
    frame++;
    if (frame > 200) { ctx.clearRect(0, 0, W, H); confettiAnimId = null; return; }
    ctx.clearRect(0, 0, W, H);
    for (const p of confettiPieces) {
      p.x += p.vx;
      p.vy += 0.08;
      p.y += p.vy;
      p.vx *= 0.995;
      p.rotation += p.rv;
      p.opacity -= p.decay;
      if (p.opacity > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }
    confettiAnimId = requestAnimationFrame(animate);
  }
  animate();
}

// ===== Navigation =====
$('prevMonth').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth === 0) { currentMonth = 12; currentYear--; }
  loadMonth();
});
$('nextMonth').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth === 13) { currentMonth = 1; currentYear++; }
  loadMonth();
});
$('goToday').addEventListener('click', goToday);

function goToday() {
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth() + 1;
  loadMonth().then(() => selectDate(formatDate(today)));
}

function loadMonth() {
  return fetchCheckins(currentYear, currentMonth);
}

// ===== Init =====
async function init() {
  await fetchCheckins(currentYear, currentMonth);
  await fetchStats();
  selectDate(formatDate(new Date()));
}

init();

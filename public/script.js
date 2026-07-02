// ============================================================
//  菲菲打卡日记 · 手机端逻辑
// ============================================================

// ===== State =====
let currentYear, currentMonth, selectedDate, selectedMood, currentImageUrl, isEditMode;
let checkins = {};

// ===== Helpers =====
function fmtDate(d) {
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function toDate(s) { return new Date(s + 'T00:00:00'); }
function md(d) { return d.getMonth()+1 + '月' + d.getDate() + '日'; }
function wd(d) {
  return ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
}

// ===== Init State =====
(function reset() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth() + 1;
  selectedDate = fmtDate(now);
  selectedMood = '';
  currentImageUrl = null;
  isEditMode = false;
  checkins = {};
})();

// ===== Show Toast =====
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'toast show '+(type||'success');
  setTimeout(() => { if(el.classList.contains('show')) el.className='toast'; }, 1800);
}

// ===== API =====
async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
}

async function loadCheckins(y, m) {
  try {
    const data = await api('GET', '/api/checkins?year='+y+'&month='+m);
    checkins = {};
    data.forEach(c => { checkins[c.date] = c; });
    renderCalendar();
    renderGallery();
  } catch(e) { console.error(e); toast('加载失败','error'); }
}

async function loadStats() {
  try {
    const data = await api('GET', '/api/stats');
    document.getElementById('streakNum').textContent = data.streak;
    document.getElementById('streakCount').textContent = data.streak;
    document.getElementById('totalCount').textContent = data.total;
    document.getElementById('monthDone').textContent = data.currentMonth;
    document.getElementById('monthTotal').textContent = data.monthTotal;
    // Highlight streak
    const sh = document.getElementById('streakHighlight');
    sh.style.opacity = data.streak >= 3 ? '1' : '0.4';
  } catch(e) {}
}

// ===== Calendar =====
function renderCalendar() {
  const fd = new Date(currentYear, currentMonth-1, 1);
  const ld = new Date(currentYear, currentMonth, 0);
  const sd = fd.getDay(), dim = ld.getDate();
  const dps = new Date(currentYear, currentMonth-1, 0).getDate();
  const today = fmtDate(new Date());
  const l = document.getElementById('currentMonthLabel');
  l.textContent = currentYear+'年'+currentMonth+'月';

  let h = '';
  // prev month
  for(let i=sd-1;i>=0;i--) {
    const pm = currentMonth===1?12:currentMonth-1, py = currentMonth===1?currentYear-1:currentYear;
    h += '<div class="cal-day other-month">'+(dps-i)+'</div>';
  }
  // current month
  for(let d=1;d<=dim;d++) {
    const ds = currentYear+'-'+String(currentMonth).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    let cls = 'cal-day';
    if(ds===today) cls+=' today';
    if(checkins[ds]) {
      cls+=' checked';
      if(checkins[ds].mood) { cls+=' mood'; }
    }
    if(ds===selectedDate) cls+=' selected';
    h += '<div class="'+cls+'" data-date="'+ds+'"'+(checkins[ds]&&checkins[ds].mood?' data-mood="'+checkins[ds].mood+'"':'')+'>'+d+'</div>';
  }
  // next month
  const tc = sd+dim, rem = (7-tc%7)%7;
  for(let d=1;d<=rem;d++) h+='<div class="cal-day other-month">'+d+'</div>';

  document.getElementById('calendarGrid').innerHTML = h;

  document.querySelectorAll('.cal-day[data-date]').forEach(el => {
    el.addEventListener('click', () => selectDate(el.dataset.date));
  });
}

function selectDate(ds) {
  selectedDate = ds;
  const d = toDate(ds);
  const isToday = ds === fmtDate(new Date());
  document.getElementById('checkinDate').textContent = (isToday?'今天 · ':'')+md(d)+' '+wd(d);

  // Calendar highlight
  document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('selected'));
  const sel = document.querySelector('.cal-day[data-date="'+ds+'"]');
  if(sel) sel.classList.add('selected');

  const c = checkins[ds];
  const dot = document.getElementById('checkinStatusDot');
  document.getElementById('checkedState').style.display = c?'block':'none';
  document.getElementById('uncheckedState').style.display = c?'none':'block';

  if(c) {
    dot.className = 'status-dot checked';
    document.getElementById('checkedNote').textContent = c.note || '';
    document.getElementById('checkedImage').src = c.image || '';
    document.getElementById('checkedImage').style.display = c.image?'block':'none';
    isEditMode = false;
  } else {
    dot.className = 'status-dot unchecked';
    document.getElementById('noteInput').value = '';
    document.getElementById('uploadEmpty').style.display = 'flex';
    document.getElementById('uploadFilled').style.display = 'none';
    currentImageUrl = null;
    selectedMood = '';
    isEditMode = false;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  }
}

// ===== Edit mode =====
document.getElementById('editBtn').addEventListener('click', () => {
  isEditMode = true;
  const c = checkins[selectedDate];
  document.getElementById('checkedState').style.display = 'none';
  document.getElementById('uncheckedState').style.display = 'block';
  document.getElementById('noteInput').value = c?.note || '';
  selectedMood = c?.mood || '';
  document.querySelectorAll('.mood-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.mood === selectedMood);
  });
  if(c?.image) {
    currentImageUrl = c.image;
    document.getElementById('uploadEmpty').style.display = 'none';
    document.getElementById('uploadFilled').style.display = 'flex';
    document.getElementById('previewThumb').src = c.image;
  }
  document.getElementById('checkinBtn').textContent = '✏️ 更新打卡';
});

// ===== Mood Picker =====
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
  });
});

// ===== Image Upload =====
const imgInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const uploadEmpty = document.getElementById('uploadEmpty');
const uploadFilled = document.getElementById('uploadFilled');
const previewThumb = document.getElementById('previewThumb');

uploadArea.addEventListener('click', () => imgInput.click());

function compressImg(file) {
  return new Promise(resolve => {
    const MAX = 400 * 1024;
    if(file.size <= MAX) {
      const r = new FileReader(); r.onload = e => resolve(e.target.result); r.readAsDataURL(file);
      return;
    }
    const r = new FileReader();
    r.onload = e => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        let w = img.width, h2 = img.height;
        const maxDim = 1000;
        if(w>maxDim||h2>maxDim) { const ra=Math.min(maxDim/w,maxDim/h2); w*=ra; h2*=ra; }
        c.width=w; c.height=h2; c.getContext('2d').drawImage(img,0,0,w,h2);
        resolve(c.toDataURL('image/jpeg',0.7));
      };
      img.src = e.target.result;
    };
    r.readAsDataURL(file);
  });
}

imgInput.addEventListener('change', async e => {
  const file = e.target.files[0];
  if(!file) return;
  if(file.size>10*1024*1024) { toast('图片太大','error'); return; }
  try {
    const url = await compressImg(file);
    uploadEmpty.style.display='none'; uploadFilled.style.display='flex';
    previewThumb.src=url; currentImageUrl=url;
  } catch(ex) { toast('图片处理失败','error'); }
});

document.getElementById('removeImage').addEventListener('click', e => {
  e.stopPropagation();
  uploadEmpty.style.display='flex'; uploadFilled.style.display='none';
  previewThumb.src=''; currentImageUrl=null; imgInput.value='';
});

// ===== Check-in =====
document.getElementById('checkinBtn').addEventListener('click', async () => {
  const note = document.getElementById('noteInput').value.trim();
  const body = { date: selectedDate, note, mood: selectedMood };

  if(currentImageUrl && currentImageUrl.startsWith('data:')) {
    body.image = currentImageUrl;
  } else if(currentImageUrl) {
    body.image = currentImageUrl;
  } else {
    body.image = '';
  }

  const btn = document.getElementById('checkinBtn');
  btn.disabled = true; btn.textContent = '处理中...';

  try {
    const res = await api('POST', '/api/checkin', body);
    if(res.success) {
      checkins[selectedDate] = res.data;
      toast('打卡成功！🌸','success');
      spawnConfetti();
      selectDate(selectedDate);
      renderCalendar();
      loadStats();
      renderGallery();
      isEditMode = false;
      btn.textContent = '✅ 打卡签到';
      // Reset form
      document.getElementById('noteInput').value = '';
      selectedMood = '';
      currentImageUrl = null;
      uploadEmpty.style.display='flex'; uploadFilled.style.display='none';
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    } else {
      toast(res.error||'打卡失败','error');
    }
  } catch(ex) { toast('网络错误','error'); }
  btn.disabled = false;
});

// ===== Delete =====
document.getElementById('deleteBtn2').addEventListener('click', async () => {
  if(!confirm('确定删除 '+selectedDate+' 的打卡记录吗？')) return;
  try {
    const res = await fetch('/api/checkin/'+selectedDate, { method: 'DELETE' });
    if(res.ok) {
      delete checkins[selectedDate];
      toast('已删除','');
      selectDate(selectedDate);
      renderCalendar();
      loadStats();
      renderGallery();
    }
  } catch(e) { toast('删除失败','error'); }
});

// ===== Gallery =====
function renderGallery() {
  const items = Object.values(checkins).filter(c => c.image).sort((a,b)=>b.date.localeCompare(a.date));
  const grid = document.getElementById('galleryGrid');
  if(!items.length) {
    grid.innerHTML = '<div class="gallery-empty">还没有图片记录<br>开始打卡吧～</div>'; return;
  }
  grid.innerHTML = items.map(c =>
    '<div class="gallery-item" data-img="'+c.image+'"><img src="'+c.image+'" loading="lazy"><div class="gallery-meta"><span class="gallery-date">'+c.date+'</span>'+(c.mood?'<span class="gallery-mood">'+c.mood+'</span>':'')+'</div></div>'
  ).join('');
  grid.querySelectorAll('.gallery-item').forEach(el => {
    el.addEventListener('click', () => showLightbox(el.dataset.img));
  });
}

// ===== Lightbox =====
const lb = document.getElementById('lightbox'), lbImg = document.getElementById('lightboxImg');
function showLightbox(src) {
  lbImg.src = src; lb.classList.add('active');
}
document.getElementById('lbClose').addEventListener('click', () => lb.classList.remove('active'));
lb.addEventListener('click', e => { if(e.target===lb) lb.classList.remove('active'); });
document.addEventListener('keydown', e => { if(e.key==='Escape') lb.classList.remove('active'); });

// ===== Confetti =====
const confCv = document.getElementById('confettiCanvas'), cCtx = confCv.getContext('2d');
let cPieces=[], cId=null;
function spawnConfetti() {
  const W=confCv.width=window.innerWidth, H=confCv.height=window.innerHeight;
  const cols=['#ff6b9d','#ff8eb3','#ff4081','#ffb347','#66bb6a','#81d4fa','#ce93d8'];
  cPieces=[]; for(let i=0;i<60;i++) cPieces.push({
    x:Math.random()*W,y:-20-Math.random()*H*.3,w:Math.random()*6+3,h:Math.random()*10+4,
    color:cols[Math.floor(Math.random()*cols.length)],
    vx:(Math.random()-.5)*3,vy:Math.random()*2+1,rot:Math.random()*360,rv:(Math.random()-.5)*8,op:1,dc:.005+Math.random()*.005
  });
  if(cId) cancelAnimationFrame(cId);
  let f=0;
  (function anim(){
    f++; if(f>180){cCtx.clearRect(0,0,W,H);cId=null;return;}
    cCtx.clearRect(0,0,W,H);
    for(const p of cPieces){
      p.x+=p.vx;p.vy+=.06;p.y+=p.vy;p.vx*=.995;p.rot+=p.rv;p.op-=p.dc;
      if(p.op>0){cCtx.save();cCtx.globalAlpha=Math.max(0,p.op);cCtx.fillStyle=p.color;
      cCtx.translate(p.x,p.y);cCtx.rotate(p.rot*Math.PI/180);cCtx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cCtx.restore();}
    }
    cId=requestAnimationFrame(anim);
  })();
}

// ===== Navigation =====
document.getElementById('prevMonth').addEventListener('click',()=>{
  currentMonth--; if(currentMonth===0){currentMonth=12;currentYear--;} loadCheckins(currentYear,currentMonth);
});
document.getElementById('nextMonth').addEventListener('click',()=>{
  currentMonth++; if(currentMonth===13){currentMonth=1;currentYear++;} loadCheckins(currentYear,currentMonth);
});

// ===== Block body scroll when touching panel (prevent bounce) =====
document.getElementById('checkinPanel').addEventListener('touchmove', e => e.stopPropagation());

// ===== Init =====
(async function init(){
  await loadCheckins(currentYear, currentMonth);
  loadStats();
  selectDate(fmtDate(new Date()));
})();

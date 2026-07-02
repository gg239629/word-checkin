// ============================================================
//  菲菲打卡日记 · 登录+打卡+管理 全逻辑
// ============================================================

// ===== State =====
let currentYear, currentMonth, selectedDate, selectedMood, currentImageUrl, isEditMode;
let checkins = {};
let allCheckins = []; // admin view cache
let userRole = null; // 'admin' | 'user'

// ===== Helpers =====
const $=id=>document.getElementById(id);
function fmtD(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function toD(s){return new Date(s+'T00:00:00')}
function md(d){return (d.getMonth()+1)+'月'+d.getDate()+'日'}
function wd(d){return['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]}
(function rs(){const n=new Date();currentYear=n.getFullYear();currentMonth=n.getMonth()+1;selectedDate=fmtD(n);selectedMood='';currentImageUrl=null;isEditMode=false;checkins={};allCheckins=[]})();

function toast(msg,type){
  const e=$('toast');e.textContent=msg;e.className='toast show '+(type||'success');
  setTimeout(()=>{if(e.classList.contains('show'))e.className='toast'},1800);
}

async function api(method,url,body){
  const o={method,headers:{'Content-Type':'application/json'}};
  if(body)o.body=JSON.stringify(body);
  return (await fetch(url,o)).json();
}

// ============================================================
//  LOGIN SYSTEM
// ============================================================
const PASSWORDS = { loveguan: 'admin', lovefei: 'user' };
const passInput = $('passInput');
const passDots = $('passDots');
const loginHint = $('loginHint');
const loginError = $('loginError');
const loginCard = $('loginCard');
const loginView = $('loginView');
let loginLocked = false;

// Floating particles
function spawnParticles(){
  const c=$('particles');
  const emojis=['🌸','💕','✨','🦋','💖','🌷','🎀','💫','🌟','🍬'];
  for(let i=0;i<20;i++){
    const e=document.createElement('div');e.className='particle';
    e.textContent=emojis[Math.floor(Math.random()*emojis.length)];
    e.style.left=Math.random()*100+'%';
    e.style.animationDuration=(6+Math.random()*10)+'s';
    e.style.animationDelay=Math.random()*8+'s';
    e.style.fontSize=(16+Math.random()*20)+'px';
    c.appendChild(e);
  }
}
spawnParticles();

// Auto-focus on load
setTimeout(()=>passInput.focus(),500);

// Update dots as user types
passInput.addEventListener('input',()=>{
  const v=passInput.value;
  const dots=passDots.querySelectorAll('.dot');
  dots.forEach((d,i)=>{
    d.classList.toggle('filled',i<v.length);
    d.classList.remove('wrong');
  });
  loginError.textContent='';
  loginHint.textContent='';
});

// Handle Enter key
passInput.addEventListener('keydown',e=>{
  if(e.key==='Enter') tryLogin();
});

// Re-focus on any touch/click
loginView.addEventListener('click',(e)=>{
  if(!loginLocked&&document.activeElement!==passInput) passInput.focus();
});

function tryLogin(){
  if(loginLocked)return;
  const v=passInput.value.toLowerCase().trim();
  if(!v)return;

  if(PASSWORDS[v]==='admin'){
    userRole='admin';
    loginSuccess();
  }else if(PASSWORDS[v]==='user'){
    userRole='user';
    loginSuccess();
  }else{
    loginFail();
  }
}

function loginFail(){
  loginLocked=true;
  const dots=passDots.querySelectorAll('.dot');
  dots.forEach(d=>d.classList.add('wrong'));
  loginCard.classList.add('shake');
  loginError.textContent='🔒 魔法钥匙不正确，请重试';
  loginHint.textContent='';

  setTimeout(()=>{
    passInput.value='';
    dots.forEach(d=>{d.classList.remove('filled','wrong')});
    loginCard.classList.remove('shake');
    loginError.textContent='';
    loginLocked=false;
    passInput.focus();
  },800);
}

function loginSuccess(){
  loginLocked=true;
  loginHint.textContent=userRole==='admin'?'✨ 管理员，欢迎回来！':'💖 菲菲，今天也要开心哦！';
  loginHint.style.color='var(--green)';
  const dots=passDots.querySelectorAll('.dot');
  dots.forEach(d=>{d.classList.add('filled');d.style.background='var(--green)'});

  // Save to session
  sessionStorage.setItem('ff_role',userRole);

  setTimeout(()=>{
    loginView.classList.add('leaving');
    setTimeout(()=>{
      loginView.style.display='none';
      if(userRole==='admin'){
        $('adminBadge').style.display='flex';
        $('userView').style.display='block';
      }else{
        $('userView').style.display='block';
      }
      // Init user view
      loadCheckins(currentYear,currentMonth);
      loadStats();
      selectDate(fmtD(new Date()));
      if(userRole==='admin') loadAdminData();
    },400);
  },600);
}

// ============================================================
//  LOGOUT
// ============================================================
function doLogout(){
  sessionStorage.removeItem('ff_role');
  location.reload();
}

// Check existing session on load
(function checkSession(){
  const role=sessionStorage.getItem('ff_role');
  if(role==='admin'||role==='user'){
    userRole=role;
    loginView.style.display='none';
    if(role==='admin') $('adminBadge').style.display='flex';
    $('userView').style.display='block';
    loadCheckins(currentYear,currentMonth);
    loadStats();
    selectDate(fmtD(new Date()));
    if(role==='admin') loadAdminData();
  }
})();

// ============================================================
//  USER VIEW - Calendar & Check-in
// ============================================================
async function loadCheckins(y,m){
  try{
    const d=await api('GET','/api/checkins?year='+y+'&month='+m);
    checkins={};d.forEach(c=>{checkins[c.date]=c});
    renderCalendar();renderGallery();
  }catch(e){toast('加载失败','error')}
}
async function loadStats(){
  try{
    const d=await api('GET','/api/stats');
    $('streakNum').textContent=d.streak;$('streakCount').textContent=d.streak;
    $('totalCount').textContent=d.total;$('monthDone').textContent=d.currentMonth;
    $('monthTotal').textContent=d.monthTotal;
    $('streakHighlight').style.opacity=d.streak>=3?'1':'0.4';
  }catch(e){}
}

function renderCalendar(){
  const fd=new Date(currentYear,currentMonth-1,1),ld=new Date(currentYear,currentMonth,0);
  const sd=fd.getDay(),dim=ld.getDate();
  const dps=new Date(currentYear,currentMonth-1,0).getDate();
  const today=fmtD(new Date());
  $('currentMonthLabel').textContent=currentYear+'年'+currentMonth+'月';
  let h='';
  for(let i=sd-1;i>=0;i--)h+='<div class="cal-day other-month">'+(dps-i)+'</div>';
  for(let d=1;d<=dim;d++){
    const ds=currentYear+'-'+String(currentMonth).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    let cls='cal-day';if(ds===today)cls+=' today';
    if(checkins[ds]){cls+=' checked';if(checkins[ds].mood)cls+=' mood';}
    if(ds===selectedDate)cls+=' selected';
    h+='<div class="'+cls+'" data-date="'+ds+'"'+(checkins[ds]&&checkins[ds].mood?' data-mood="'+checkins[ds].mood+'"':'')+'>'+d+'</div>';
  }
  const tc=sd+dim,rem=(7-tc%7)%7;
  for(let d=1;d<=rem;d++)h+='<div class="cal-day other-month">'+d+'</div>';
  $('calendarGrid').innerHTML=h;
  document.querySelectorAll('.cal-day[data-date]').forEach(el=>el.addEventListener('click',()=>selectDate(el.dataset.date)));
}

function selectDate(ds){
  selectedDate=ds;const d=toD(ds);
  const isToday=ds===fmtD(new Date());
  $('checkinDate').textContent=(isToday?'今天 · ':'')+md(d)+' '+wd(d);
  document.querySelectorAll('.cal-day').forEach(el=>el.classList.remove('selected'));
  const sel=document.querySelector('.cal-day[data-date="'+ds+'"]');if(sel)sel.classList.add('selected');
  const c=checkins[ds],dot=$('checkinStatusDot');
  $('checkedState').style.display=c?'block':'none';
  $('uncheckedState').style.display=c?'none':'block';
  if(c){
    dot.className='status-dot checked';
    $('checkedNote').textContent=c.note||'';
    $('checkedImage').src=c.image||'';
    $('checkedImage').style.display=c.image?'block':'none';
    isEditMode=false;$('checkinBtn').textContent='✅ 打卡签到';
  }else{
    dot.className='status-dot unchecked';
    $('noteInput').value='';$('uploadEmpty').style.display='flex';
    $('uploadFilled').style.display='none';currentImageUrl=null;selectedMood='';isEditMode=false;
    $('checkinBtn').textContent='✅ 打卡签到';
    document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('selected'));
  }
}

// Edit button
$('editBtn').addEventListener('click',()=>{
  isEditMode=true;const c=checkins[selectedDate];
  $('checkedState').style.display='none';$('uncheckedState').style.display='block';
  $('noteInput').value=c?.note||'';selectedMood=c?.mood||'';
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.toggle('selected',b.dataset.mood===selectedMood));
  if(c?.image){currentImageUrl=c.image;$('uploadEmpty').style.display='none';$('uploadFilled').style.display='flex';$('previewThumb').src=c.image;}
  $('checkinBtn').textContent='✏️ 更新打卡';
});

// Mood picker
document.querySelectorAll('.mood-btn').forEach(btn=>{btn.addEventListener('click',()=>{
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');selectedMood=btn.dataset.mood;
})});

// Image upload
const imgInput=$('imageInput'),upArea=$('uploadArea'),upEmpty=$('uploadEmpty'),upFilled=$('uploadFilled'),upThumb=$('previewThumb');
upArea.addEventListener('click',()=>imgInput.click());
function compressImg(file){return new Promise(resolve=>{
  const MAX=400*1024;if(file.size<=MAX){const r=new FileReader();r.onload=e=>resolve(e.target.result);r.readAsDataURL(file);return}
  const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');let w=img.width,h2=img.height;const maxDim=1000;if(w>maxDim||h2>maxDim){const ra=Math.min(maxDim/w,maxDim/h2);w*=ra;h2*=ra}c.width=w;c.height=h2;c.getContext('2d').drawImage(img,0,0,w,h2);resolve(c.toDataURL('image/jpeg',0.7))};img.src=e.target.result};r.readAsDataURL(file)})}
imgInput.addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;if(file.size>10*1024*1024){toast('图片太大','error');return}
  try{const url=await compressImg(file);upEmpty.style.display='none';upFilled.style.display='flex';upThumb.src=url;currentImageUrl=url}catch(ex){toast('图片处理失败','error')}
});
$('removeImage').addEventListener('click',e=>{e.stopPropagation();upEmpty.style.display='flex';upFilled.style.display='none';upThumb.src='';currentImageUrl=null;imgInput.value=''});

// Check-in button
$('checkinBtn').addEventListener('click',async()=>{
  const note=$('noteInput').value.trim();
  const body={date:selectedDate,note,mood:selectedMood};
  if(currentImageUrl&&currentImageUrl.startsWith('data:'))body.image=currentImageUrl;
  else if(currentImageUrl)body.image=currentImageUrl;
  else body.image='';
  const btn=$('checkinBtn');btn.disabled=true;btn.textContent='处理中...';
  try{
    const res=await api('POST','/api/checkin',body);
    if(res.success){checkins[selectedDate]=res.data;toast('打卡成功！🌸','success');spawnConfetti();selectDate(selectedDate);renderCalendar();loadStats();renderGallery();isEditMode=false;btn.textContent='✅ 打卡签到';$('noteInput').value='';selectedMood='';currentImageUrl=null;upEmpty.style.display='flex';upFilled.style.display='none';document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('selected'));if(userRole==='admin')loadAdminData()}
    else toast(res.error||'打卡失败','error');
  }catch(ex){toast('网络错误','error')}
  btn.disabled=false;
});

// Delete button
$('deleteBtn2').addEventListener('click',async()=>{
  if(!confirm('确定删除 '+selectedDate+' 的打卡记录吗？'))return;
  try{const res=await fetch('/api/checkin/'+selectedDate,{method:'DELETE'});if(res.ok){delete checkins[selectedDate];toast('已删除','');selectDate(selectedDate);renderCalendar();loadStats();renderGallery();if(userRole==='admin')loadAdminData()}}catch(e){toast('删除失败','error')}
});

// Gallery
function renderGallery(){
  const items=Object.values(checkins).filter(c=>c.image).sort((a,b)=>b.date.localeCompare(a.date));
  const grid=$('galleryGrid');
  if(!items.length){grid.innerHTML='<div class="gallery-empty">还没有图片记录<br>开始打卡吧～</div>';return}
  grid.innerHTML=items.map(c=>'<div class="gallery-item" data-img="'+c.image+'"><img src="'+c.image+'" loading="lazy"><div class="gallery-meta"><span class="gallery-date">'+c.date+'</span>'+(c.mood?'<span class="gallery-mood">'+c.mood+'</span>':'')+'</div></div>').join('');
  grid.querySelectorAll('.gallery-item').forEach(el=>el.addEventListener('click',()=>showLightbox(el.dataset.img)));
}

// Lightbox
const lb=$('lightbox'),lbImg=$('lightboxImg');
window._showLightbox=function(src){lbImg.src=src;lb.classList.add('active')};
function showLightbox(src){window._showLightbox(src)}
$('lbClose').addEventListener('click',()=>lb.classList.remove('active'));
lb.addEventListener('click',e=>{if(e.target===lb)lb.classList.remove('active')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('active')});

// Confetti
const confCv=$('confettiCanvas'),cCtx=confCv.getContext('2d');let cPieces=[],cId=null;
function spawnConfetti(){
  const W=confCv.width=window.innerWidth,H=confCv.height=window.innerHeight;
  const cols=['#ff6b9d','#ff8eb3','#ff4081','#ffb347','#66bb6a','#81d4fa','#ce93d8'];
  cPieces=[];for(let i=0;i<60;i++)cPieces.push({x:Math.random()*W,y:-20-Math.random()*H*.3,w:Math.random()*6+3,h:Math.random()*10+4,color:cols[Math.floor(Math.random()*cols.length)],vx:(Math.random()-.5)*3,vy:Math.random()*2+1,rot:Math.random()*360,rv:(Math.random()-.5)*8,op:1,dc:.005+Math.random()*.005});
  if(cId)cancelAnimationFrame(cId);let f=0;
  (function anim(){f++;if(f>180){cCtx.clearRect(0,0,W,H);cId=null;return}cCtx.clearRect(0,0,W,H);for(const p of cPieces){p.x+=p.vx;p.vy+=.06;p.y+=p.vy;p.vx*=.995;p.rot+=p.rv;p.op-=p.dc;if(p.op>0){cCtx.save();cCtx.globalAlpha=Math.max(0,p.op);cCtx.fillStyle=p.color;cCtx.translate(p.x,p.y);cCtx.rotate(p.rot*Math.PI/180);cCtx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cCtx.restore()}}cId=requestAnimationFrame(anim)})();
}

// Navigation
$('prevMonth').addEventListener('click',()=>{currentMonth--;if(currentMonth===0){currentMonth=12;currentYear--}loadCheckins(currentYear,currentMonth)});
$('nextMonth').addEventListener('click',()=>{currentMonth++;if(currentMonth===13){currentMonth=1;currentYear++}loadCheckins(currentYear,currentMonth)});
$('checkinPanel').addEventListener('touchmove',e=>e.stopPropagation());

// ============================================================
//  ADMIN VIEW
// ============================================================
async function loadAdminData(){
  try{
    const res=await fetch('/api/checkins');allCheckins=(await res.json()).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date));
    const stats=await api('GET','/api/stats');
    $('adminTotal').textContent=stats.total;
    $('adminStreak').textContent=stats.streak;
    $('adminMonth').textContent=stats.currentMonth;
    $('adminImages').textContent=allCheckins.filter(c=>c.image).length;
    $('adminListCount').textContent=allCheckins.length+'条';
    renderAdminList();
  }catch(e){console.error(e)}
}

function renderAdminList(){
  const list=$('adminList');
  if(!allCheckins.length){list.innerHTML='<div class="admin-empty">暂无打卡记录</div>';return}
  list.innerHTML=allCheckins.map(c=>
    '<div class="admin-item">'+
      (c.image?'<img class="admin-item-img" src="'+c.image+'" loading="lazy" onclick="event.stopPropagation();window._showLightbox(''+c.image+'')">':'<div class="admin-item-img" style="display:flex;align-items:center;justify-content:center;font-size:20px">'+(c.mood||'📝')+'</div>')+
      '<div class="admin-item-info">'+
        '<div class="admin-item-date">'+c.date+'</div>'+
        '<div class="admin-item-note">'+(c.note||'无备注')+'</div>'+
      '</div>'+
      '<div class="admin-item-meta">'+
        (c.mood?'<span class="admin-item-mood">'+c.mood+'</span>':'')+
        '<button class="admin-item-del" data-date="'+c.date+'" title="删除">🗑️</button>'+
      '</div>'+
    '</div>'
  ).join('');
  // Delete handlers
  list.querySelectorAll('.admin-item-del').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const date=btn.dataset.date;
      if(!confirm('确定删除 '+date+' 吗？'))return;
      try{
        const res=await fetch('/api/checkin/'+date,{method:'DELETE'});
        if(res.ok){toast('已删除','');loadAdminData();loadCheckins(currentYear,currentMonth);loadStats();renderGallery()}
      }catch(e){toast('删除失败','error')}
    });
  });
}

// Switch to admin view
$('switchToAdmin').addEventListener('click',()=>{
  $('userView').style.display='none';$('adminView').style.display='block';loadAdminData();
});
// Back to user view
$('backToUser').addEventListener('click',()=>{
  $('adminView').style.display='none';$('userView').style.display='block';loadCheckins(currentYear,currentMonth);loadStats();selectDate(fmtD(new Date()));
});
// Logout
$('logoutAdmin').addEventListener('click',doLogout);

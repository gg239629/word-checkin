// ==== 菲菲打卡日记 ====
const $=id=>document.getElementById(id);

// State
let currentYear,currentMonth,selectedDate,selectedMood,currentImageUrl,isEditMode,checkins={},allCheckins=[],userRole=null;
function fmtD(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function toD(s){return new Date(s+'T00:00:00')}
function md(d){return (d.getMonth()+1)+'月'+d.getDate()+'日'}
function wd(d){return['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]}
(function rs(){var n=new Date();currentYear=n.getFullYear();currentMonth=n.getMonth()+1;selectedDate=fmtD(n);selectedMood='';currentImageUrl=null;isEditMode=false;checkins={};allCheckins=[]})();

function toast(msg,type){var e=$('toast');e.textContent=msg;e.className='toast show '+(type||'success');setTimeout(function(){if(e.classList.contains('show'))e.className='toast'},1800)}
async function api(m,u,b){var o={method:m,headers:{'Content-Type':'application/json'}};if(b)o.body=JSON.stringify(b);return(await fetch(u,o)).json()}

// ============ LOGIN ============
var PASSWORDS={loveguan:'admin',lovefei:'user'};
var passInput=$('passInput'),passDotsEl=$('passDots'),loginBtn=$('loginBtn'),loginError=$('loginError'),loginCard=$('loginCard'),loginView=$('loginView'),loginLocked=false;

// Particles
(function(){
  var c=$('particles'),emojis=['🌸','💕','✨','🦋','💖','🌷','🎀','💫','🌟','🍬'];
  for(var i=0;i<18;i++){var e=document.createElement('div');e.className='particle';e.textContent=emojis[Math.floor(Math.random()*emojis.length)];e.style.left=(5+Math.random()*90)+'%';e.style.animationDuration=(6+Math.random()*10)+'s';e.style.animationDelay=Math.random()*8+'s';e.style.fontSize=(16+Math.random()*18)+'px';c.appendChild(e)}
})();

setTimeout(function(){try{passInput.focus()}catch(e){}},300);

// Update dots as user types
passInput.addEventListener('input',function(){
  var v=passInput.value,dots=passDotsEl.querySelectorAll('.dot');
  for(var i=0;i<dots.length;i++){dots[i].classList.toggle('filled',i<v.length);dots[i].classList.remove('wrong')}
  loginError.textContent='';loginError.style.color='';
});

// Enter key
passInput.addEventListener('keydown',function(e){if(e.key==='Enter')tryLogin()});

// Login button
loginBtn.addEventListener('click',tryLogin);

// Click card to refocus
loginCard.addEventListener('click',function(){
  if(!loginLocked&&document.activeElement!==passInput)passInput.focus();
});

function tryLogin(){
  if(loginLocked)return;
  var v=passInput.value.toLowerCase().trim();
  if(!v)return;
  if(PASSWORDS[v]==='admin'){userRole='admin';loginSuccess()}
  else if(PASSWORDS[v]==='user'){userRole='user';loginSuccess()}
  else loginFail();
}

function loginFail(){
  loginLocked=true;
  var dots=passDotsEl.querySelectorAll('.dot');
  for(var i=0;i<dots.length;i++)dots[i].classList.add('wrong');
  loginCard.classList.add('shake');
  loginError.textContent='🔒 魔法钥匙不正确，请重试';
  setTimeout(function(){
    passInput.value='';
    for(var i=0;i<dots.length;i++){dots[i].classList.remove('filled','wrong')}
    loginCard.classList.remove('shake');loginError.textContent='';
    loginLocked=false;try{passInput.focus()}catch(e){}
  },800);
}

function loginSuccess(){
  loginLocked=true;
  var dots=passDotsEl.querySelectorAll('.dot');
  for(var i=0;i<dots.length;i++){dots[i].classList.add('filled');dots[i].style.background='var(--green)'}
  loginError.textContent=userRole==='admin'?'✨ 管理员，欢迎回来！':'💖 菲菲，今天也要开心哦！';
  loginError.style.color='var(--green)';
  sessionStorage.setItem('ff_role',userRole);
  setTimeout(function(){
    loginView.classList.add('leaving');
    setTimeout(function(){
      loginView.style.display='none';
      if(userRole==='admin'){$('adminBadge').style.display='flex'}
      $('userView').style.display='block';
      loadCheckins(currentYear,currentMonth);loadStats();selectDate(fmtD(new Date()));
      if(userRole==='admin')loadAdminData();
    },400);
  },600);
}

// Logout
function doLogout(){sessionStorage.removeItem('ff_role');location.reload()}

// Check existing session
(function(){
  var role=sessionStorage.getItem('ff_role');
  if(role==='admin'||role==='user'){userRole=role;loginView.style.display='none';if(role==='admin')$('adminBadge').style.display='flex';$('userView').style.display='block';loadCheckins(currentYear,currentMonth);loadStats();selectDate(fmtD(new Date()));if(role==='admin')loadAdminData()}
})();

// ============ USER VIEW ============
async function loadCheckins(y,m){
  try{var d=await api('GET','/api/checkins?year='+y+'&month='+m);checkins={};d.forEach(function(c){checkins[c.date]=c});renderCalendar();renderGallery()}catch(e){toast('加载失败','error')}
}
async function loadStats(){
  try{var d=await api('GET','/api/stats');$('streakNum').textContent=d.streak;$('streakCount').textContent=d.streak;$('totalCount').textContent=d.total;$('monthDone').textContent=d.currentMonth;$('monthTotal').textContent=d.monthTotal;$('streakHighlight').style.opacity=d.streak>=3?'1':'0.4'}catch(e){}
}

function renderCalendar(){
  var fd=new Date(currentYear,currentMonth-1,1),ld=new Date(currentYear,currentMonth,0),sd=fd.getDay(),dim=ld.getDate(),dps=new Date(currentYear,currentMonth-1,0).getDate(),today=fmtD(new Date());
  $('currentMonthLabel').textContent=currentYear+'年'+currentMonth+'月';
  var h='';
  for(var i=sd-1;i>=0;i--)h+='<div class="cal-day other-month">'+(dps-i)+'</div>';
  for(var d=1;d<=dim;d++){
    var ds=currentYear+'-'+String(currentMonth).padStart(2,'0')+'-'+String(d).padStart(2,'0'),cls='cal-day';
    if(ds===today)cls+=' today';if(checkins[ds]){cls+=' checked';if(checkins[ds].mood)cls+=' mood'}
    if(ds===selectedDate)cls+=' selected';
    h+='<div class="'+cls+'" data-date="'+ds+'"'+(checkins[ds]&&checkins[ds].mood?' data-mood="'+checkins[ds].mood+'"':'')+'>'+d+'</div>';
  }
  var tc=sd+dim,rem=(7-tc%7)%7;for(var d=1;d<=rem;d++)h+='<div class="cal-day other-month">'+d+'</div>';
  $('calendarGrid').innerHTML=h;
  document.querySelectorAll('.cal-day[data-date]').forEach(function(el){el.addEventListener('click',function(){selectDate(el.dataset.date)})});
}

function selectDate(ds){
  selectedDate=ds;var d=toD(ds),isToday=ds===fmtD(new Date());
  $('checkinDate').textContent=(isToday?'今天 · ':'')+md(d)+' '+wd(d);
  document.querySelectorAll('.cal-day').forEach(function(el){el.classList.remove('selected')});
  var sel=document.querySelector('.cal-day[data-date="'+ds+'"]');if(sel)sel.classList.add('selected');
  var c=checkins[ds],dot=$('checkinStatusDot');
  $('checkedState').style.display=c?'block':'none';$('uncheckedState').style.display=c?'none':'block';
  if(c){
    dot.className='status-dot checked';$('checkedNote').textContent=c.note||'';
    $('checkedImage').src=c.image||'';$('checkedImage').style.display=c.image?'block':'none';
    isEditMode=false;$('checkinBtn').textContent='✅ 打卡签到';
  }else{
    dot.className='status-dot unchecked';$('noteInput').value='';
    $('uploadEmpty').style.display='flex';$('uploadFilled').style.display='none';
    currentImageUrl=null;selectedMood='';isEditMode=false;$('checkinBtn').textContent='✅ 打卡签到';
    document.querySelectorAll('.mood-btn').forEach(function(b){b.classList.remove('selected')});
  }
}

$('editBtn').addEventListener('click',function(){
  isEditMode=true;var c=checkins[selectedDate];
  $('checkedState').style.display='none';$('uncheckedState').style.display='block';
  $('noteInput').value=c&&c.note||'';selectedMood=c&&c.mood||'';
  document.querySelectorAll('.mood-btn').forEach(function(b){b.classList.toggle('selected',b.dataset.mood===selectedMood)});
  if(c&&c.image){currentImageUrl=c.image;$('uploadEmpty').style.display='none';$('uploadFilled').style.display='flex';$('previewThumb').src=c.image}
  $('checkinBtn').textContent='✏️ 更新打卡';
});

document.querySelectorAll('.mood-btn').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('.mood-btn').forEach(function(b){b.classList.remove('selected')});btn.classList.add('selected');selectedMood=btn.dataset.mood})});

var imgInput=$('imageInput'),upArea=$('uploadArea'),upEmpty=$('uploadEmpty'),upFilled=$('uploadFilled'),upThumb=$('previewThumb');
upArea.addEventListener('click',function(){imgInput.click()});
function compressImg(file){return new Promise(function(resolve){var MAX=400*1024;if(file.size<=MAX){var r=new FileReader();r.onload=function(e){resolve(e.target.result)};r.readAsDataURL(file);return}var r=new FileReader();r.onload=function(e){var img=new Image();img.onload=function(){var c=document.createElement('canvas'),w=img.width,h2=img.height,maxDim=1000;if(w>maxDim||h2>maxDim){var ra=Math.min(maxDim/w,maxDim/h2);w*=ra;h2*=ra}c.width=w;c.height=h2;c.getContext('2d').drawImage(img,0,0,w,h2);resolve(c.toDataURL('image/jpeg',0.7))};img.src=e.target.result};r.readAsDataURL(file)})}
imgInput.addEventListener('change',async function(e){
  var file=e.target.files[0];if(!file)return;if(file.size>10*1024*1024){toast('图片太大','error');return}
  try{var url=await compressImg(file);upEmpty.style.display='none';upFilled.style.display='flex';upThumb.src=url;currentImageUrl=url}catch(ex){toast('图片处理失败','error')}
});
$('removeImage').addEventListener('click',function(e){e.stopPropagation();upEmpty.style.display='flex';upFilled.style.display='none';upThumb.src='';currentImageUrl=null;imgInput.value=''});

$('checkinBtn').addEventListener('click',async function(){
  var note=$('noteInput').value.trim(),body={date:selectedDate,note:note,mood:selectedMood};
  if(currentImageUrl&&currentImageUrl.startsWith('data:'))body.image=currentImageUrl;else if(currentImageUrl)body.image=currentImageUrl;else body.image='';
  var btn=$('checkinBtn');btn.disabled=true;btn.textContent='处理中...';
  try{var res=await api('POST','/api/checkin',body);if(res.success){checkins[selectedDate]=res.data;toast('打卡成功！🌸','success');spawnConfetti();selectDate(selectedDate);renderCalendar();loadStats();renderGallery();isEditMode=false;btn.textContent='✅ 打卡签到';$('noteInput').value='';selectedMood='';currentImageUrl=null;upEmpty.style.display='flex';upFilled.style.display='none';document.querySelectorAll('.mood-btn').forEach(function(b){b.classList.remove('selected')});if(userRole==='admin')loadAdminData()}else toast(res.error||'打卡失败','error')}catch(ex){toast('网络错误','error')}
  btn.disabled=false;
});

$('deleteBtn2').addEventListener('click',async function(){
  if(!confirm('确定删除 '+selectedDate+' 的打卡记录吗？'))return;
  try{var res=await fetch('/api/checkin/'+selectedDate,{method:'DELETE'});if(res.ok){delete checkins[selectedDate];toast('已删除','');selectDate(selectedDate);renderCalendar();loadStats();renderGallery();if(userRole==='admin')loadAdminData()}}catch(e){toast('删除失败','error')}
});

function renderGallery(){
  var items=Object.values(checkins).filter(function(c){return c.image}).sort(function(a,b){return b.date.localeCompare(a.date)}),grid=$('galleryGrid');
  if(!items.length){grid.innerHTML='<div class="gallery-empty">还没有图片记录<br>开始打卡吧～</div>';return}
  grid.innerHTML=items.map(function(c){return '<div class="gallery-item" data-img="'+c.image+'"><img src="'+c.image+'" loading="lazy"><div class="gallery-meta"><span class="gallery-date">'+c.date+'</span>'+(c.mood?'<span class="gallery-mood">'+c.mood+'</span>':'')+'</div></div>'}).join('');
  grid.querySelectorAll('.gallery-item').forEach(function(el){el.addEventListener('click',function(){showLightbox(el.dataset.img)})});
}

var lb=$('lightbox'),lbImg=$('lightboxImg');
window._showLightbox=function(src){lbImg.src=src;lb.classList.add('active')};
function showLightbox(src){window._showLightbox(src)}
$('lbClose').addEventListener('click',function(){lb.classList.remove('active')});
lb.addEventListener('click',function(e){if(e.target===lb)lb.classList.remove('active')});
document.addEventListener('keydown',function(e){if(e.key==='Escape')lb.classList.remove('active')});

var confCv=$('confettiCanvas'),cCtx=confCv.getContext('2d'),cPieces=[],cId=null;
function spawnConfetti(){
  var W=confCv.width=window.innerWidth,H=confCv.height=window.innerHeight,cols=['#ff6b9d','#ff8eb3','#ff4081','#ffb347','#66bb6a','#81d4fa','#ce93d8'];
  cPieces=[];for(var i=0;i<60;i++)cPieces.push({x:Math.random()*W,y:-20-Math.random()*H*.3,w:Math.random()*6+3,h:Math.random()*10+4,color:cols[Math.floor(Math.random()*cols.length)],vx:(Math.random()-.5)*3,vy:Math.random()*2+1,rot:Math.random()*360,rv:(Math.random()-.5)*8,op:1,dc:.005+Math.random()*.005});
  if(cId)cancelAnimationFrame(cId);var f=0;
  (function anim(){f++;if(f>180){cCtx.clearRect(0,0,W,H);cId=null;return}cCtx.clearRect(0,0,W,H);for(var i=0;i<cPieces.length;i++){var p=cPieces[i];p.x+=p.vx;p.vy+=.06;p.y+=p.vy;p.vx*=.995;p.rot+=p.rv;p.op-=p.dc;if(p.op>0){cCtx.save();cCtx.globalAlpha=Math.max(0,p.op);cCtx.fillStyle=p.color;cCtx.translate(p.x,p.y);cCtx.rotate(p.rot*Math.PI/180);cCtx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cCtx.restore()}}cId=requestAnimationFrame(anim)})();
}

$('prevMonth').addEventListener('click',function(){currentMonth--;if(currentMonth===0){currentMonth=12;currentYear--}loadCheckins(currentYear,currentMonth)});
$('nextMonth').addEventListener('click',function(){currentMonth++;if(currentMonth===13){currentMonth=1;currentYear++}loadCheckins(currentYear,currentMonth)});
$('checkinPanel').addEventListener('touchmove',function(e){e.stopPropagation()});

// ============ ADMIN ============
async function loadAdminData(){
  try{var res=await fetch('/api/checkins');allCheckins=(await res.json()).filter(Boolean).sort(function(a,b){return b.date.localeCompare(a.date)});var stats=await api('GET','/api/stats');$('adminTotal').textContent=stats.total;$('adminStreak').textContent=stats.streak;$('adminMonth').textContent=stats.currentMonth;$('adminImages').textContent=allCheckins.filter(function(c){return c.image}).length;$('adminListCount').textContent=allCheckins.length+'条';renderAdminList()}catch(e){}
}
function renderAdminList(){
  var list=$('adminList');if(!allCheckins.length){list.innerHTML='<div class="admin-empty">暂无打卡记录</div>';return}
  list.innerHTML=allCheckins.map(function(c){return '<div class="admin-item">'+(c.image?'<img class="admin-item-img" src="'+c.image+'" loading="lazy" onclick="event.stopPropagation();window._showLightbox(''+c.image+'')">':'<div class="admin-item-img" style="display:flex;align-items:center;justify-content:center;font-size:20px">'+(c.mood||'📝')+'</div>')+'<div class="admin-item-info"><div class="admin-item-date">'+c.date+'</div><div class="admin-item-note">'+(c.note||'无备注')+'</div></div><div class="admin-item-meta">'+(c.mood?'<span class="admin-item-mood">'+c.mood+'</span>':'')+'<button class="admin-item-del" data-date="'+c.date+'" title="删除">🗑️</button></div></div>'}).join('');
  list.querySelectorAll('.admin-item-del').forEach(function(btn){btn.addEventListener('click',async function(){var date=btn.dataset.date;if(!confirm('确定删除 '+date+' 吗？'))return;try{var res=await fetch('/api/checkin/'+date,{method:'DELETE'});if(res.ok){toast('已删除','');loadAdminData();loadCheckins(currentYear,currentMonth);loadStats();renderGallery()}}catch(e){toast('删除失败','error')}})});
}
$('switchToAdmin').addEventListener('click',function(){$('userView').style.display='none';$('adminView').style.display='block';loadAdminData()});
$('backToUser').addEventListener('click',function(){$('adminView').style.display='none';$('userView').style.display='block';loadCheckins(currentYear,currentMonth);loadStats();selectDate(fmtD(new Date()))});
$('logoutAdmin').addEventListener('click',doLogout);

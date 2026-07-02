// 菲菲打卡日记
var $=function(id){return document.getElementById(id)};

var curY,curM,selDate,selMood,curImg,editMode,checks={},allCs=[],role='user';
function fd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function td(s){return new Date(s+'T00:00:00')}
function md(d){return (d.getMonth()+1)+'月'+d.getDate()+'日'}
function wd(d){return ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]}
(function(){var n=new Date();curY=n.getFullYear();curM=n.getMonth()+1;selDate=fd(n);selMood='';curImg=null;editMode=false})();

function toast(msg,t){var e=$('toast');e.textContent=msg;e.className='toast show '+(t||'success');setTimeout(function(){if(e.classList.contains('show'))e.className='toast'},1800)}
async function api(m,u,b){var o={method:m,headers:{'Content-Type':'application/json'}};if(b)o.body=JSON.stringify(b);return(await fetch(u,o)).json()}

// ===== USER VIEW =====
async function loadChecks(y,m){try{var d=await api('GET','/api/checkins?year='+y+'&month='+m);checks={};d.forEach(function(c){checks[c.date]=c});renderCal();renderGal()}catch(e){}}
async function loadStats(){try{var d=await api('GET','/api/stats');$('streakNum').textContent=d.streak;$('streakCount').textContent=d.streak;$('totalCount').textContent=d.total;$('monthDone').textContent=d.currentMonth;$('monthTotal').textContent=d.monthTotal;$('streakHighlight').style.opacity=d.streak>=3?'1':'0.4'}catch(e){}}

function renderCal(){
  var fd1=new Date(curY,curM-1,1),ld=new Date(curY,curM,0),sd=fd1.getDay(),dim=ld.getDate(),dps=new Date(curY,curM-1,0).getDate(),today=fd(new Date());
  $('currentMonthLabel').textContent=curY+'年'+curM+'月';var h='';
  for(var i=sd-1;i>=0;i--)h+='<div class="cal-day other-month">'+(dps-i)+'</div>';
  for(var d=1;d<=dim;d++){var ds=curY+'-'+String(curM).padStart(2,'0')+'-'+String(d).padStart(2,'0'),cls='cal-day';if(ds===today)cls+=' today';if(checks[ds]){cls+=' checked';if(checks[ds].mood)cls+=' mood'}if(ds===selDate)cls+=' selected';h+='<div class="'+cls+'" data-date="'+ds+'"'+(checks[ds]&&checks[ds].mood?' data-mood="'+checks[ds].mood+'"':'')+'>'+d+'</div>'}
  var tc=sd+dim,rem=(7-tc%7)%7;for(var d=1;d<=rem;d++)h+='<div class="cal-day other-month">'+d+'</div>';
  $('calendarGrid').innerHTML=h;
  document.querySelectorAll('.cal-day[data-date]').forEach(function(el){el.addEventListener('click',function(){sel(el.dataset.date)})});
}

function sel(ds){
  selDate=ds;var d=td(ds),isToday=ds===fd(new Date());
  $('checkinDate').textContent=(isToday?'今天 · ':'')+md(d)+' '+wd(d);
  document.querySelectorAll('.cal-day').forEach(function(el){el.classList.remove('selected')});
  var s=document.querySelector('.cal-day[data-date="'+ds+'"]');if(s)s.classList.add('selected');
  var c=checks[ds],dot=$('checkinStatusDot');
  $('checkedState').style.display=c?'block':'none';$('uncheckedState').style.display=c?'none':'block';
  if(c){dot.className='status-dot checked';$('checkedNote').textContent=c.note||'';$('checkedImage').src=c.image||'';$('checkedImage').style.display=c.image?'block':'none';editMode=false;$('checkinBtn').textContent='✅ 打卡签到'}
  else{dot.className='status-dot unchecked';$('noteInput').value='';$('uploadEmpty').style.display='flex';$('uploadFilled').style.display='none';curImg=null;selMood='';editMode=false;$('checkinBtn').textContent='✅ 打卡签到';document.querySelectorAll('.mood-btn').forEach(function(b){b.classList.remove('selected')})}
}

$('editBtn').addEventListener('click',function(){editMode=true;var c=checks[selDate];$('checkedState').style.display='none';$('uncheckedState').style.display='block';$('noteInput').value=c&&c.note||'';selMood=c&&c.mood||'';document.querySelectorAll('.mood-btn').forEach(function(b){b.classList.toggle('selected',b.dataset.mood===selMood)});if(c&&c.image){curImg=c.image;$('uploadEmpty').style.display='none';$('uploadFilled').style.display='flex';$('previewThumb').src=c.image}$('checkinBtn').textContent='✏️ 更新打卡'});

document.querySelectorAll('.mood-btn').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('.mood-btn').forEach(function(b){b.classList.remove('selected')});btn.classList.add('selected');selMood=btn.dataset.mood})});

var imgIn=$('imageInput'),ua=$('uploadArea'),ue=$('uploadEmpty'),uf=$('uploadFilled'),ut=$('previewThumb');
ua.addEventListener('click',function(){imgIn.click()});
function compImg(file){return new Promise(function(resolve){var MAX=400*1024;if(file.size<=MAX){var r=new FileReader();r.onload=function(e){resolve(e.target.result)};r.readAsDataURL(file);return}var r=new FileReader();r.onload=function(e){var img=new Image();img.onload=function(){var c=document.createElement('canvas'),w=img.width,h2=img.height,maxDim=1000;if(w>maxDim||h2>maxDim){var ra=Math.min(maxDim/w,maxDim/h2);w*=ra;h2*=ra}c.width=w;c.height=h2;c.getContext('2d').drawImage(img,0,0,w,h2);resolve(c.toDataURL('image/jpeg',0.7))};img.src=e.target.result};r.readAsDataURL(file)})}
imgIn.addEventListener('change',async function(e){var file=e.target.files[0];if(!file)return;if(file.size>10*1024*1024){toast('图片太大','error');return}try{var url=await compImg(file);ue.style.display='none';uf.style.display='flex';ut.src=url;curImg=url}catch(ex){toast('图片处理失败','error')}});
$('removeImage').addEventListener('click',function(e){e.stopPropagation();ue.style.display='flex';uf.style.display='none';ut.src='';curImg=null;imgIn.value=''});

$('checkinBtn').addEventListener('click',async function(){var note=$('noteInput').value.trim(),body={date:selDate,note:note,mood:selMood};if(curImg&&curImg.startsWith('data:'))body.image=curImg;else if(curImg)body.image=curImg;else body.image='';var btn=$('checkinBtn');btn.disabled=true;btn.textContent='处理中...';try{var res=await api('POST','/api/checkin',body);if(res.success){checks[selDate]=res.data;toast('打卡成功！🌸','success');spawnConf();sel(selDate);renderCal();loadStats();renderGal();editMode=false;btn.textContent='✅ 打卡签到';$('noteInput').value='';selMood='';curImg=null;ue.style.display='flex';uf.style.display='none';document.querySelectorAll('.mood-btn').forEach(function(b){b.classList.remove('selected')});if(role==='admin')loadAdm()}else toast(res.error||'失败','error')}catch(ex){toast('网络错误','error')}btn.disabled=false});

$('deleteBtn2').addEventListener('click',async function(){if(!confirm('确定删除 '+selDate+' 的记录吗？'))return;try{var res=await fetch('/api/checkin/'+selDate,{method:'DELETE'});if(res.ok){delete checks[selDate];toast('已删除','');sel(selDate);renderCal();loadStats();renderGal();if(role==='admin')loadAdm()}}catch(e){toast('删除失败','error')}});

function renderGal(){var items=Object.values(checks).filter(function(c){return c.image}).sort(function(a,b){return b.date.localeCompare(a.date)}),grid=$('galleryGrid');if(!items.length){grid.innerHTML='<div class="gallery-empty">还没有图片记录<br>开始打卡吧～</div>';return}grid.innerHTML=items.map(function(c){return '<div class="gallery-item" data-img="'+c.image+'"><img src="'+c.image+'" loading="lazy"><div class="gallery-meta"><span class="gallery-date">'+c.date+'</span>'+(c.mood?'<span class="gallery-mood">'+c.mood+'</span>':'')+'</div></div>'}).join('');grid.querySelectorAll('.gallery-item').forEach(function(el){el.addEventListener('click',function(){showLb(el.dataset.img)})})}

var lbEl=$('lightbox'),lbImg=$('lightboxImg');
window._showLightbox=function(src){lbImg.src=src;lbEl.classList.add('active')};
function showLb(src){window._showLightbox(src)}
$('lbClose').addEventListener('click',function(){lbEl.classList.remove('active')});
lbEl.addEventListener('click',function(e){if(e.target===lbEl)lbEl.classList.remove('active')});
document.addEventListener('keydown',function(e){if(e.key==='Escape')lbEl.classList.remove('active')});

var cCv=$('confettiCanvas'),cCtx=cCv.getContext('2d'),cPs=[],cId=null;
function spawnConf(){var W=cCv.width=window.innerWidth,H=cCv.height=window.innerHeight,cols=['#ff6b9d','#ff8eb3','#ff4081','#ffb347','#66bb6a','#81d4fa','#ce93d8'];cPs=[];for(var i=0;i<60;i++)cPs.push({x:Math.random()*W,y:-20-Math.random()*H*.3,w:Math.random()*6+3,h:Math.random()*10+4,color:cols[Math.floor(Math.random()*cols.length)],vx:(Math.random()-.5)*3,vy:Math.random()*2+1,rot:Math.random()*360,rv:(Math.random()-.5)*8,op:1,dc:.005+Math.random()*.005});if(cId)cancelAnimationFrame(cId);var f=0;(function anim(){f++;if(f>180){cCtx.clearRect(0,0,W,H);cId=null;return}cCtx.clearRect(0,0,W,H);for(var i=0;i<cPs.length;i++){var p=cPs[i];p.x+=p.vx;p.vy+=.06;p.y+=p.vy;p.vx*=.995;p.rot+=p.rv;p.op-=p.dc;if(p.op>0){cCtx.save();cCtx.globalAlpha=Math.max(0,p.op);cCtx.fillStyle=p.color;cCtx.translate(p.x,p.y);cCtx.rotate(p.rot*Math.PI/180);cCtx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cCtx.restore()}}cId=requestAnimationFrame(anim)})()}

$('prevMonth').addEventListener('click',function(){curM--;if(curM===0){curM=12;curY--}loadChecks(curY,curM)});
$('nextMonth').addEventListener('click',function(){curM++;if(curM===13){curM=1;curY++}loadChecks(curY,curM)});
$('checkinPanel').addEventListener('touchmove',function(e){e.stopPropagation()});

// ===== ADMIN =====
async function loadAdm(){try{var res=await fetch('/api/checkins');allCs=(await res.json()).filter(Boolean).sort(function(a,b){return b.date.localeCompare(a.date)});var st=await api('GET','/api/stats');$('adminTotal').textContent=st.total;$('adminStreak').textContent=st.streak;$('adminMonth').textContent=st.currentMonth;$('adminImages').textContent=allCs.filter(function(c){return c.image}).length;$('adminListCount').textContent=allCs.length+'条';renderAdmList()}catch(e){}}
function renderAdmList(){var list=$('adminList');if(!allCs.length){list.innerHTML='<div class="admin-empty">暂无打卡记录</div>';return}list.innerHTML=allCs.map(function(c){return '<div class="admin-item">'+(c.image?'<img class="admin-item-img" src="'+c.image+'" loading="lazy" onclick="event.stopPropagation();window._showLightbox(''+c.image+'')">':'<div class="admin-item-img" style="display:flex;align-items:center;justify-content:center;font-size:20px">'+(c.mood||'📝')+'</div>')+'<div class="admin-item-info"><div class="admin-item-date">'+c.date+'</div><div class="admin-item-note">'+(c.note||'无备注')+'</div></div><div class="admin-item-meta">'+(c.mood?'<span class="admin-item-mood">'+c.mood+'</span>':'')+'<button class="admin-item-del" data-date="'+c.date+'" title="删除">🗑️</button></div></div>'}).join('');list.querySelectorAll('.admin-item-del').forEach(function(btn){btn.addEventListener('click',async function(){var date=btn.dataset.date;if(!confirm('确定删除 '+date+' 吗？'))return;try{var res=await fetch('/api/checkin/'+date,{method:'DELETE'});if(res.ok){toast('已删除','');loadAdm();loadChecks(curY,curM);loadStats();renderGal()}}catch(e){toast('删除失败','error')}})})}
$('switchToAdmin').addEventListener('click',function(){$('userView').style.display='none';$('adminView').style.display='block';loadAdm()});
$('backToUser').addEventListener('click',function(){$('adminView').style.display='none';$('userView').style.display='block';loadChecks(curY,curM);loadStats();sel(fd(new Date()))});
$('logoutAdmin').addEventListener('click',doLogout);

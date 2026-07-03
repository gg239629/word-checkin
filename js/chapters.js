// === 章节逻辑引擎 ===

const Chapters = {
  // 添加日志
  addLog(msg) {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    GameState.logs.push({ time, msg });
    this.renderLogs();
  },

  renderLogs() {
    const el = document.getElementById('log-entries');
    if (!el) return;
    el.innerHTML = GameState.logs.slice(-20).map(l =>
      `<div class="log-entry"><span class="log-time">${l.time}</span>${l.msg}</div>`
    ).join('');
    el.scrollTop = el.scrollHeight;
  },

  // 更新证据墙
  updateEvidenceWall() {
    const el = document.getElementById('evidence-wall');
    if (!el) return;
    el.innerHTML = GameState.collectedEvidence.map(id => {
      const ev = findEvidenceById(id);
      return `<div class="wall-item">${ev ? ev.icon : '📌'} ${ev ? ev.name : id}</div>`;
    }).join('');
  },

  // === 第0章：案发现场 ===
  initCrimeScene() {
    this.addLog('进入案发现场：青禾公寓1204室');
    document.querySelectorAll('.room').forEach(r => {
      r.classList.remove('searched');
      r.querySelector('.room-status').textContent = '未勘查';
    });
    GameState.searchedRooms.forEach(roomId => {
      const roomEl = document.getElementById(`room-${roomId}`);
      if (roomEl) {
        roomEl.classList.add('searched');
        roomEl.querySelector('.room-status').textContent = '已勘查';
      }
    });
    document.getElementById('scene-detail').classList.add('hidden');
    document.getElementById('btn-to-evidence').style.display = 'none';
    if (GameState.searchedRooms.length >= 5) {
      document.getElementById('btn-to-evidence').style.display = 'inline-block';
    }

    // 绑定房间点击
    document.querySelectorAll('.room').forEach(room => {
      room.onclick = () => this.searchRoom(room.dataset.room);
    });
    document.getElementById('btn-collect-evidence').onclick = () => this.collectEvidence();
  },

  searchRoom(roomId) {
    const room = CrimeScene[roomId];
    if (!room) return;
    
    if (!GameState.searchedRooms.includes(roomId)) {
      GameState.searchedRooms.push(roomId);
      const roomEl = document.getElementById(`room-${roomId}`);
      if (roomEl) {
        roomEl.classList.add('searched');
        roomEl.querySelector('.room-status').textContent = '已勘查';
      }
    }

    document.getElementById('scene-room-name').textContent = `${room.icon} ${room.name}`;
    document.getElementById('scene-room-desc').textContent = room.desc;
    document.getElementById('scene-detail').classList.remove('hidden');
    document.getElementById('scene-detail').dataset.currentRoom = roomId;
    this.addLog(`勘查${room.name}`);
  },

  collectEvidence() {
    const roomId = document.getElementById('scene-detail').dataset.currentRoom;
    const room = CrimeScene[roomId];
    if (!room) return;

    if (!GameState.collectedEvidence.includes(room.evidence.id)) {
      GameState.collectedEvidence.push(room.evidence.id);
      this.addLog(`采集证据：${room.evidence.name}`);
      this.updateEvidenceWall();
      document.getElementById('scene-room-desc').textContent = 
        room.desc + '\n\n✅ 证据已采集：' + room.evidence.name;
    }

    if (GameState.searchedRooms.length >= 5) {
      document.getElementById('btn-to-evidence').style.display = 'inline-block';
    }
  },

  // === 第1章：证据中心 ===
  initEvidenceCenter() {
    this.addLog('进入证据中心');
    const grid = document.getElementById('evidence-grid');
    grid.innerHTML = '';

    GameState.collectedEvidence.forEach(evId => {
      const ev = findEvidenceById(evId);
      if (!ev) return;
      const analyzed = GameState.analyzedEvidence.includes(evId);
      const div = document.createElement('div');
      div.className = `ev-item ${analyzed ? 'analyzed' : ''}`;
      div.innerHTML = `
        <div class="ev-icon">${ev.icon}</div>
        <div class="ev-label">${ev.name}</div>
        <div class="ev-badge ${analyzed ? 'done' : 'new'}">${analyzed ? '已分析' : '待分析'}</div>
      `;
      div.onclick = () => this.showEvidenceDetail(ev);
      grid.appendChild(div);
    });

    document.getElementById('evidence-detail').classList.add('hidden');
    this.updateNextButtons();
  },

  showEvidenceDetail(ev) {
    const detail = document.getElementById('evidence-detail');
    detail.classList.remove('hidden');
    document.getElementById('ev-name').textContent = `${ev.icon} ${ev.name}`;
    document.getElementById('ev-desc').textContent = ev.detail;

    const actions = document.getElementById('ev-actions');
    actions.innerHTML = '';

    if (ev.canAnalyze && !GameState.analyzedEvidence.includes(ev.id)) {
      const btn = document.createElement('button');
      btn.className = 'btn-secondary';
      btn.textContent = `🔬 送检：${ev.analysisType}`;
      btn.onclick = async () => {
        btn.textContent = '⏳ 检测中...';
        btn.disabled = true;
        this.addLog(`送检：${ev.name} → ${ev.analysisType}`);
        await new Promise(r => setTimeout(r, ev.analysisWait));
        GameState.analyzedEvidence.push(ev.id);
        document.getElementById('ev-desc').textContent = ev.analysisResult;
        btn.textContent = '✅ 检测完成';
        this.addLog(`检测完成：${ev.name}`);
        this.initEvidenceCenter();
        this.updateNextButtons();
      };
      actions.appendChild(btn);
    } else if (GameState.analyzedEvidence.includes(ev.id)) {
      const span = document.createElement('span');
      span.style.color = 'var(--success)';
      span.textContent = '✅ 已完成分析';
      actions.appendChild(span);
    }

    this.updateNextButtons();
  },

  updateNextButtons() {
    const allAnalyzed = GameState.collectedEvidence.every(id => GameState.analyzedEvidence.includes(id));
    const btnAutopsy = document.getElementById('btn-to-autopsy');
    const btnSurveillance = document.getElementById('btn-to-surveillance');
    const btnSuspects = document.getElementById('btn-to-suspects');
    const btnTimeline = document.getElementById('btn-to-timeline');
    const btnDeduction = document.getElementById('btn-to-deduction');

    if (btnAutopsy) btnAutopsy.style.display = (GameState.collectedEvidence.length >= 5 && allAnalyzed) ? 'inline-block' : 'none';

    // 后续按钮根据章节进度显示
    if (btnSurveillance) btnSurveillance.style.display = (GameState.currentChapter >= 2) ? 'inline-block' : 'none';
    if (btnSuspects) btnSuspects.style.display = (GameState.currentChapter >= 3) ? 'inline-block' : 'none';
    if (btnTimeline) btnTimeline.style.display = (GameState.currentChapter >= 4) ? 'inline-block' : 'none';
    if (btnDeduction) btnDeduction.style.display = (GameState.currentChapter >= 5) ? 'inline-block' : 'none';
  },

  // === 第2章：尸检报告 ===
  initAutopsy() {
    this.addLog('查阅尸检报告');
    this.updateNextButtons();
  },

  // === 第3章：监控中心 ===
  initSurveillance() {
    this.addLog('进入监控中心');
    document.getElementById('surv-player').classList.add('hidden');
    document.getElementById('surv-enhanced').classList.add('hidden');

    document.querySelectorAll('.btn-play').forEach(btn => {
      btn.onclick = () => this.playSurveillance(btn.dataset.surv);
    });

    document.getElementById('btn-enhance').onclick = () => this.enhanceSurveillance();
    document.getElementById('btn-to-suspects').style.display = 'inline-block';
  },

  playSurveillance(id) {
    const data = SurveillanceData[id];
    if (!data) return;
    const player = document.getElementById('surv-player');
    const screen = document.getElementById('surv-screen');
    const enhanced = document.getElementById('surv-enhanced');
    
    player.classList.remove('hidden');
    enhanced.classList.add('hidden');
    player.dataset.currentSurv = id;

    screen.innerHTML = `
      <div style="text-align:center;padding:40px;">
        <div style="font-size:48px;margin-bottom:12px;">📹</div>
        <div style="color:var(--cyan);font-size:18px;">${data.time}</div>
        <div style="color:var(--text-secondary);margin-top:12px;max-width:400px;margin-left:auto;margin-right:auto;">${data.detail}</div>
        <div style="color:var(--text-dim);margin-top:20px;font-size:12px;">[ 模拟监控画面 · 文字描述模式 ]</div>
      </div>
    `;
    this.addLog(`查看监控：${data.time} - ${data.desc}`);
    
    // 已查看所有监控
    const viewed = new Set(JSON.parse(sessionStorage.getItem('viewedSurv') || '[]'));
    viewed.add(id);
    sessionStorage.setItem('viewedSurv', JSON.stringify([...viewed]));
  },

  enhanceSurveillance() {
    const player = document.getElementById('surv-player');
    const id = player.dataset.currentSurv;
    const data = SurveillanceData[id];
    if (!data) return;

    const enhanced = document.getElementById('surv-enhanced');
    enhanced.classList.remove('hidden');

    const btn = document.getElementById('btn-enhance');
    btn.textContent = '⏳ 处理中...';
    btn.disabled = true;

    setTimeout(() => {
      enhanced.innerHTML = `
        <div style="background:var(--bg-card);border:1px solid var(--success);border-radius:6px;padding:16px;margin-top:8px;">
          <div style="color:var(--success);font-weight:600;margin-bottom:8px;">🔍 图像增强结果</div>
          <div style="color:var(--text-primary);line-height:1.6;">${data.enhanced}</div>
        </div>
      `;
      btn.textContent = '✅ 处理完成';
      this.addLog(`图像增强：${data.time}监控画面`);
    }, 2000);
  },

  // === 第4章：嫌疑人 ===
  initSuspects() {
    this.addLog('调阅嫌疑人档案');
    const list = document.getElementById('suspect-list');
    list.innerHTML = '';

    Object.values(Suspects).forEach(s => {
      const card = document.createElement('div');
      card.className = 'suspect-card';
      card.innerHTML = `
        <div class="s-avatar">${s.avatar}</div>
        <div class="s-name">${s.name}</div>
        <div class="s-relation">${s.relation}</div>
        <div style="font-size:11px;color:var(--text-dim);margin-top:4px;">${s.age}岁 · ${s.occupation}</div>
      `;
      card.onclick = () => this.showSuspectDetail(s);
      list.appendChild(card);
    });

    document.getElementById('suspect-detail').classList.add('hidden');
  },

  showSuspectDetail(s) {
    const detail = document.getElementById('suspect-detail');
    detail.classList.remove('hidden');
    detail.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
        <div style="font-size:48px;">${s.avatar}</div>
        <div>
          <h3 style="margin:0;">${s.name}</h3>
          <div style="font-size:12px;color:var(--text-secondary);">${s.age}岁 · ${s.occupation}</div>
          <div style="font-size:12px;color:var(--text-secondary);">${s.relation}</div>
        </div>
      </div>
      <p style="margin-bottom:8px;"><strong>不在场证明：</strong>${s.alibi}</p>
      <p style="margin-bottom:8px;"><strong>动机分析：</strong>${s.motive}</p>
      <p style="margin-bottom:12px;color:var(--text-secondary);">${s.profile}</p>

      <h4 style="margin-top:12px;">💬 聊天记录</h4>
      <div style="background:var(--bg-primary);border-radius:6px;padding:12px;margin:8px 0;max-height:150px;overflow-y:auto;">
        ${s.chatLogs.map(c => 
          `<div style="margin-bottom:4px;font-size:12px;">
            <span style="color:var(--text-dim);">${c.time}</span>
            <span style="color:${c.from==='victim'?'var(--danger)':'var(--accent)'};"> ${c.from === 'victim' ? '林雨晴' : s.name}：</span>
            <span style="color:var(--text-secondary);">${c.content}</span>
          </div>`
        ).join('')}
        ${s.chatLogs.length === 0 ? '<div style="color:var(--text-dim);font-size:12px;">无聊天记录</div>' : ''}
      </div>

      <h4 style="margin-top:12px;">📞 通话 & 定位</h4>
      <div style="background:var(--bg-primary);border-radius:6px;padding:12px;margin:8px 0;font-size:12px;">
        ${s.phoneData.calls.map(c => 
          `<div style="margin-bottom:4px;">📞 ${c.time} → ${c.to} (${c.duration})</div>`
        ).join('')}
        <div>📍 ${s.phoneData.location}</div>
        ${s.phoneData.payments.map(p => `<div>💳 ${p}</div>`).join('')}
      </div>

      <button class="btn-primary" style="margin-top:12px;" onclick="Chapters.startInterrogation('${s.id}')">
        🔍 进入询问室
      </button>
    `;
    this.addLog(`查看嫌疑人档案：${s.name}`);
  },

  // === 第5章：询问室 ===
  startInterrogation(suspectId) {
    GameState.currentSuspect = suspectId;
    const s = Suspects[suspectId];
    if (!s) return;

    document.getElementById('interro-select').classList.add('hidden');
    document.getElementById('interro-chat').classList.remove('hidden');
    document.getElementById('interro-input-area').classList.remove('hidden');
    
    const chat = document.getElementById('interro-chat');
    chat.innerHTML = '';
    this.addInterroMsg('system', `询问对象：${s.name} · ${s.occupation}`);
    this.addInterroMsg('system', '你可以自由输入问题，或尝试询问：昨晚在哪里、跟死者的关系、不在场证明等。');
    this.addInterroMsg('suspect', s.interrogate.initial);

    if (!GameState.suspectsInterviewed.includes(suspectId)) {
      GameState.suspectsInterviewed.push(suspectId);
    }

    document.getElementById('interro-input').focus();
    document.getElementById('btn-interro-send').onclick = () => this.sendInterroQuestion();
    document.getElementById('interro-input').onkeydown = (e) => {
      if (e.key === 'Enter') this.sendInterroQuestion();
    };

    this.addLog(`进入询问室：${s.name}`);
  },

  addInterroMsg(type, text) {
    const chat = document.getElementById('interro-chat');
    const div = document.createElement('div');
    div.className = `interro-msg ${type}`;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  },

  sendInterroQuestion() {
    const input = document.getElementById('interro-input');
    const question = input.value.trim();
    if (!question) return;

    const s = Suspects[GameState.currentSuspect];
    if (!s) return;

    this.addInterroMsg('detective', question);
    input.value = '';

    // AI模拟：匹配关键词回答问题
    setTimeout(() => {
      const answer = this.matchInterroAnswer(s, question);
      this.addInterroMsg('suspect', answer);

      // 检查是否问到了关键点，触发tell
      const tellTriggers = ['河豚', '毒', '日料', '刀', '指纹'];
      const triggered = tellTriggers.some(t => question.includes(t));
      if (triggered && !s._told) {
        s._told = true;
        setTimeout(() => {
          this.addInterroMsg('system', '⚠ 嫌疑人犹豫了一下...');
          this.addInterroMsg('suspect', s.interrogate.tell);
          this.addLog(`${s.name}出现了破绽`);
        }, 1500);
      }
    }, 800 + Math.random() * 1000);
  },

  matchInterroAnswer(s, question) {
    const qs = s.interrogate.questions;
    const q = question.toLowerCase();

    // 关键词匹配
    for (const [key, answer] of Object.entries(qs)) {
      const keywords = key.split('').join('.*');
      try {
        if (new RegExp(keywords).test(q) || q.includes(key) || key.includes(q)) {
          return answer;
        }
      } catch(e) {
        if (q.includes(key) || key.includes(q)) return answer;
      }
    }

    // 模糊匹配
    const fuzzyMatches = [
      { keys: ['时间', '几点', '当时'], answer: qs['昨晚在哪里'] },
      { keys: ['认识', '关系', '熟悉'], answer: qs['你跟雨晴竞争升职的事'] || qs['你和死者的纠纷'] },
      { keys: ['证人', '证明', '看到'], answer: '我不确定有没有人看到我。你自己去查监控吧。' },
      { keys: ['为什么', '动机', '理由'], answer: '我没有动机。我跟她无冤无仇。' },
    ];

    for (const fm of fuzzyMatches) {
      if (fm.keys.some(k => q.includes(k)) && fm.answer) {
        return fm.answer;
      }
    }

    return '这个问题...我不太清楚你在问什么。能不能换个问法？';
  },

  // === 第6章：时间线 ===
  initTimeline() {
    this.addLog('进入时间线重构');
    const pool = document.getElementById('timeline-evidence-pool');
    pool.innerHTML = '';

    TimelineEvidences.forEach(te => {
      const div = document.createElement('div');
      div.className = 'tl-ev';
      div.textContent = te.label;
      div.draggable = true;
      div.dataset.id = te.id;
      div.dataset.correct = te.correct;
      div.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: te.id, correct: te.correct }));
        e.target.style.opacity = '0.5';
      };
      div.ondragend = (e) => {
        e.target.style.opacity = '1';
      };
      pool.appendChild(div);
    });

    // 时间线槽位拖放
    document.querySelectorAll('.tl-slot').forEach(slot => {
      slot.innerHTML = `<div style="font-size:13px;font-weight:600;">${slot.dataset.hour}</div><div class="slot-content"></div>`;
      slot.classList.remove('filled');
      slot.ondragover = (e) => { e.preventDefault(); slot.classList.add('drag-over'); };
      slot.ondragleave = () => slot.classList.remove('drag-over');
      slot.ondrop = (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        const content = slot.querySelector('.slot-content');
        
        // 移除旧位置的相同证据
        document.querySelectorAll('.tl-slot .slot-content').forEach(c => {
          if (c.dataset.placedId === data.id) c.innerHTML = '';
        });

        content.innerHTML = `<span style="font-size:11px;color:var(--cyan);">${data.id}</span>`;
        content.dataset.placedId = data.id;
        content.dataset.correctHour = data.correct;
        slot.classList.add('filled');

        this.checkTimeline();
      };
    });

    document.getElementById('timeline-feedback').textContent = '';
    document.getElementById('btn-to-deduction').style.display = 'none';
  },

  checkTimeline() {
    let correct = 0;
    let total = 0;
    document.querySelectorAll('.tl-slot .slot-content').forEach(c => {
      if (c.dataset.placedId) {
        total++;
        if (c.dataset.correctHour === c.parentElement.dataset.hour) {
          correct++;
        }
      }
    });

    const fb = document.getElementById('timeline-feedback');
    if (total === 0) {
      fb.textContent = '';
      fb.className = '';
    } else if (total < TimelineEvidences.length) {
      fb.textContent = `已放置 ${total}/${TimelineEvidences.length} 条证据...`;
      fb.className = '';
    } else if (correct === TimelineEvidences.length) {
      fb.textContent = '✅ 时间线完全正确！所有证据位置准确。';
      fb.className = 'success';
      GameState.timelineCorrect = true;
      document.getElementById('btn-to-deduction').style.display = 'inline-block';
      this.addLog('时间线重构完成');
    } else {
      fb.textContent = '⚠ 存在矛盾。部分证据的时间位置不正确，请重新检查。';
      fb.className = 'error';
      GameState.timelineCorrect = false;
      document.getElementById('btn-to-deduction').style.display = 'none';
    }
  },

  // === 第7章：推理板 ===
  initDeduction() {
    this.addLog('进入推理板');
    document.getElementById('deduction-feedback').textContent = '';
    document.getElementById('btn-to-arrest').style.display = 'none';
    this.drawDeductionBoard();
  },

  drawDeductionBoard() {
    const canvas = document.getElementById('deduction-canvas');
    const container = document.getElementById('deduction-board');
    canvas.width = container.clientWidth;
    canvas.height = 500;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制网格背景
    ctx.strokeStyle = 'rgba(38,48,64,0.3)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 500); ctx.stroke();
    }
    for (let y = 0; y < 500; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // 存储节点位置用于点击检测
    const nodePositions = [];

    // 绘制节点
    DeductionNodes.forEach(node => {
      const x = node.x * (canvas.width / 800);
      const y = node.y;
      const colors = {
        victim: '#dc2626',
        evidence: '#f59e0b',
        suspect: '#2563eb',
        witness: '#6b7280',
      };
      const color = colors[node.type] || '#6b7280';

      // 绘制节点背景
      ctx.fillStyle = 'rgba(24,30,40,0.95)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - 55, y - 20, 110, 45, 8);
      ctx.fill();
      ctx.stroke();

      // 绘制文字
      ctx.fillStyle = '#c8d6e5';
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      const lines = node.label.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, x, y + i * 16 - (lines.length - 1) * 8 + 6);
      });

      nodePositions.push({ ...node, x, y, color });
    });

    // 存储连线状态
    GameState.deductionConnections = GameState.deductionConnections || [];
    GameState._nodePositions = nodePositions;

    // 绘制已有连线
    GameState.deductionConnections.forEach(([fromId, toId]) => {
      const from = nodePositions.find(n => n.id === fromId);
      const to = nodePositions.find(n => n.id === toId);
      if (from && to) {
        ctx.strokeStyle = 'rgba(220,38,38,0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // 连线交互：点击两个节点连线
    let selectedNode = null;

    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const hit = nodePositions.find(n => 
        mx > n.x - 55 && mx < n.x + 55 && my > n.y - 20 && my < n.y + 25
      );

      if (hit) {
        if (!selectedNode) {
          selectedNode = hit;
          this.addLog(`推理板：选中节点 "${hit.label.replace('\n','')}"`);
          // 高亮选中节点
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(hit.x - 55, hit.y - 20, 110, 45, 8);
          ctx.stroke();
        } else if (selectedNode.id !== hit.id) {
          // 连线
          const conn = [selectedNode.id, hit.id].sort();
          const existing = GameState.deductionConnections.find(
            c => c[0] === conn[0] && c[1] === conn[1]
          );
          if (!existing) {
            GameState.deductionConnections.push(conn);
            this.addLog(`推理板：连接 "${selectedNode.label.replace('\n','')}" ↔ "${hit.label.replace('\n','')}"`);
          }
          selectedNode = null;
          this.drawDeductionBoard();
          this.checkDeduction();
        } else {
          selectedNode = null;
          this.drawDeductionBoard();
        }
      } else {
        selectedNode = null;
        this.drawDeductionBoard();
      }
    };

    // 检查按钮
    this.addDeductionCheckBtn();
  },

  addDeductionCheckBtn() {
    const fb = document.getElementById('deduction-feedback');
    if (!fb.querySelector('button')) {
      const btn = document.createElement('button');
      btn.className = 'btn-primary';
      btn.textContent = '验证推理';
      btn.style.marginTop = '8px';
      btn.onclick = () => this.checkDeduction();
      fb.appendChild(btn);
    }
  },

  checkDeduction() {
    const conns = GameState.deductionConnections || [];
    let matched = 0;
    
    CorrectConnections.forEach(cc => {
      const sorted = [cc[0], cc[1]].sort();
      if (conns.some(c => c[0] === sorted[0] && c[1] === sorted[1])) {
        matched++;
      }
    });

    const fb = document.getElementById('deduction-feedback');
    if (matched >= CorrectConnections.length) {
      fb.innerHTML = '<div style="color:var(--success);padding:8px;">✅ 证据链完整！关键关联已建立：毒咖啡 → 日料外卖 → 陈雪</div>';
      GameState.deductionCorrect = true;
      document.getElementById('btn-to-arrest').style.display = 'inline-block';
      this.addLog('推理板：证据链验证通过');
    } else if (matched >= 2) {
      fb.innerHTML = `<div style="color:var(--warning);padding:8px;">推理进行中：已建立 ${matched}/${CorrectConnections.length} 条关键关联。继续分析...</div>`;
    } else {
      fb.innerHTML = '<div style="color:var(--text-secondary);padding:8px;">证据链不完整。请将相关证据与嫌疑人连接起来。</div>';
    }
  },

  // === 第8章：逮捕 ===
  initArrest() {
    this.addLog('进入逮捕决策');
    const choices = document.getElementById('arrest-choices');
    choices.innerHTML = '';

    Object.values(Suspects).forEach(s => {
      const card = document.createElement('div');
      card.className = 'arrest-card';
      card.innerHTML = `
        <div class="a-name">${s.name}</div>
        <div style="font-size:12px;color:var(--text-secondary);">${s.occupation}</div>
        <div class="a-hint">${s.relation}</div>
      `;
      card.onclick = () => this.executeArrest(s.id);
      choices.appendChild(card);
    });

    document.getElementById('arrest-result').classList.add('hidden');
  },

  executeArrest(suspectId) {
    const result = document.getElementById('arrest-result');
    result.classList.remove('hidden');

    if (suspectId === DeductionAnswer) {
      GameState.arrestCorrect = true;
      GameState.ending = GameState.collectedEvidence.length >= 5 && 
                        GameState.analyzedEvidence.length >= 5 ? 'A' : 'B';
      
      const endingData = GameState.ending === 'A' ? StoryContent.endingA : StoryContent.endingB;
      
      result.innerHTML = `
        <h3 style="color:var(--success);">✅ 逮捕正确！</h3>
        <p>${endingData.desc}</p>
        <p style="margin-top:12px;color:var(--text-secondary);">嫌疑人已被拘留，等待进一步审讯。</p>
        <button class="btn-primary" style="margin-top:16px;" onclick="App.showChapter(9)">查看结案报告 →</button>
      `;
      this.addLog(`逮捕：${Suspects[suspectId].name} - 正确！`);
    } else {
      GameState.arrestCorrect = false;
      GameState.ending = 'C';
      
      result.innerHTML = `
        <h3 style="color:var(--danger);">❌ 逮捕错误！</h3>
        <p>你逮捕了无辜的人。真正的凶手正在销毁证据...</p>
        <p style="margin-top:12px;color:var(--text-secondary);">错误逮捕导致了严重后果。</p>
        <button class="btn-primary" style="margin-top:16px;" onclick="App.showChapter(9)">查看结案报告 →</button>
      `;
      this.addLog(`逮捕：${Suspects[suspectId].name} - 错误！`);
    }
  },

  // === 第9章：结局 ===
  initEnding() {
    const endingData = GameState.ending === 'A' ? StoryContent.endingA :
                       GameState.ending === 'B' ? StoryContent.endingB :
                       StoryContent.endingC;
    
    const content = document.getElementById('ending-content');
    content.innerHTML = `
      <div class="ending-grade ${endingData.grade.toLowerCase()}">评级：${endingData.grade}级</div>
      <h3 style="color:var(--cyan);">${endingData.title}</h3>
      <div class="ending-detail">
        <pre style="white-space:pre-wrap;font-family:'Microsoft YaHei',sans-serif;font-size:13px;line-height:1.8;">${endingData.detail}</pre>
      </div>
      <div style="margin-top:16px;font-size:14px;color:var(--warning);">${endingData.rating}</div>
    `;

    // 更新导航（如果已结案）
    const closedNav = document.querySelector('[data-nav="closed-nav"]');
    if (closedNav) {
      closedNav.classList.remove('locked');
      closedNav.style.opacity = '1';
      closedNav.style.cursor = 'pointer';
      closedNav.textContent = '📂 已结案 (1)';
    }

    this.addLog(`案件结束：${endingData.title}`);
  },
};

// 辅助函数
function findEvidenceById(id) {
  for (const room of Object.values(CrimeScene)) {
    if (room.evidence.id === id) return room.evidence;
  }
  return null;
}

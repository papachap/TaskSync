const STORAGE_KEY = 'tasksync_data';

let state = {
  tasks: [],
  timeLogs: [],
};

function saveState() {
  setSaveStatus('saving');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  setTimeout(() => setSaveStatus('saved'), 600);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try { state = JSON.parse(raw); }
    catch(e) { console.warn('Failed to parse stored data', e); }
  }
}

function setSaveStatus(status) {
  const el = document.getElementById('save-status');
  if (status === 'saving') {
    el.textContent = '◌ Saving...';
    el.className = 'saving';
  } else {
    el.textContent = '● All saved';
    el.className = 'saved';
  }
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    if (view === 'dashboard') renderDashboard();
    if (view === 'tasks')     renderTasks();
    if (view === 'time')      renderTimeLog();
    if (view === 'calendar')  renderCalendar();
  });
});

function setGreeting() {
  const h = new Date().getHours();
  const el = document.getElementById('greeting-time');
  if (h < 12) el.textContent = 'morning';
  else if (h < 18) el.textContent = 'afternoon';
  else el.textContent = 'evening';
}

function renderDashboard() {
  const total = state.tasks.length;
  const done  = state.tasks.filter(t => t.status === 'done').length;
  const inprog = state.tasks.filter(t => t.status === 'inprogress').length;

  const totalHours = state.timeLogs.reduce((sum, log) => {
    const [sh, sm] = log.start.split(':').map(Number);
    const [eh, em] = log.end.split(':').map(Number);
    return sum + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, 0);

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-inprogress').textContent = inprog;
  document.getElementById('stat-hours').textContent = totalHours.toFixed(1) + 'h';

  const ul = document.getElementById('recent-tasks');
  const recent = [...state.tasks].reverse().slice(0, 5);
  ul.innerHTML = recent.length
    ? recent.map(taskHTML).join('')
    : '<div class="empty-state">No tasks yet — add your first task!</div>';
  bindDeleteButtons(ul);
}

let currentFilter = 'all';

function renderTasks() {
  const ul = document.getElementById('all-tasks');
  let filtered = state.tasks;
  if (currentFilter !== 'all') filtered = filtered.filter(t => t.status === currentFilter);
  ul.innerHTML = filtered.length
    ? [...filtered].reverse().map(taskHTML).join('')
    : '<div class="empty-state">No tasks found.</div>';
  bindDeleteButtons(ul);
}

function taskHTML(task) {
  return `
    <li class="task-item" data-id="${task.id}">
      <div class="task-info">
        <div class="task-name">${escapeHTML(task.title)}</div>
        <div class="task-meta">${task.category ? task.category + ' · ' : ''}${task.due || 'No due date'}</div>
      </div>
      <span class="badge badge-${task.status}">${statusLabel(task.status)}</span>
      <button class="task-delete" data-id="${task.id}" title="Delete">✕</button>
    </li>`;
}

function bindDeleteButtons(container) {
  container.querySelectorAll('.task-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      state.tasks = state.tasks.filter(t => t.id !== id);
      saveState();
      renderTasks();
      renderDashboard();
    });
  });
}

function statusLabel(s) {
  return { todo: 'To Do', inprogress: 'In Progress', done: 'Done' }[s] || s;
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

document.getElementById('open-task-modal').addEventListener('click', () => {
  document.getElementById('task-modal').classList.add('open');
});

document.getElementById('close-task-modal').addEventListener('click', () => {
  document.getElementById('task-modal').classList.remove('open');
});

document.getElementById('task-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

document.getElementById('save-task').addEventListener('click', () => {
  const title = document.getElementById('task-title').value.trim();
  if (!title) { alert('Please enter a task title.'); return; }

  const task = {
    id: Date.now().toString(),
    title,
    desc: document.getElementById('task-desc').value.trim(),
    due: document.getElementById('task-due').value,
    status: document.getElementById('task-status').value,
    category: document.getElementById('task-category').value.trim(),
    createdAt: new Date().toISOString(),
  };

  state.tasks.push(task);
  saveState();

  ['task-title','task-desc','task-due','task-category'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('task-status').value = 'todo';
  document.getElementById('task-modal').classList.remove('open');

  renderTasks();
  renderDashboard();
  populateTaskSelect();
});

function renderTimeLog() {
  const tbody = document.getElementById('time-log-body');
  if (!state.timeLogs.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:40px">No time logged yet.</td></tr>';
    return;
  }
  tbody.innerHTML = [...state.timeLogs].reverse().map(log => {
    const task = state.tasks.find(t => t.id === log.taskId);
    const taskName = task ? escapeHTML(task.title) : '(deleted task)';
    const duration = calcDuration(log.start, log.end);
    return `
      <tr>
        <td>${taskName}</td>
        <td>${log.date}</td>
        <td>${log.start}</td>
        <td>${log.end}</td>
        <td><span class="duration-pill">${duration}</span></td>
        <td><button class="task-delete" data-log-id="${log.id}" title="Delete">✕</button></td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-log-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.timeLogs = state.timeLogs.filter(l => l.id !== btn.dataset.logId);
      saveState();
      renderTimeLog();
      renderDashboard();
    });
  });
}

function calcDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function populateTaskSelect() {
  const sel = document.getElementById('log-task-select');
  sel.innerHTML = state.tasks.length
    ? state.tasks.map(t => `<option value="${t.id}">${escapeHTML(t.title)}</option>`).join('')
    : '<option value="">No tasks available</option>';
}

document.getElementById('open-timelog-modal').addEventListener('click', () => {
  populateTaskSelect();
  document.getElementById('log-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('timelog-modal').classList.add('open');
});

document.getElementById('close-timelog-modal').addEventListener('click', () => {
  document.getElementById('timelog-modal').classList.remove('open');
});

document.getElementById('timelog-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
});

document.getElementById('save-timelog').addEventListener('click', () => {
  const taskId = document.getElementById('log-task-select').value;
  const date   = document.getElementById('log-date').value;
  const start  = document.getElementById('log-start').value;
  const end    = document.getElementById('log-end').value;

  if (!taskId || !date || !start || !end) { alert('Please fill all fields.'); return; }
  if (start >= end) { alert('End time must be after start time.'); return; }

  state.timeLogs.push({ id: Date.now().toString(), taskId, date, start, end });
  saveState();
  document.getElementById('timelog-modal').classList.remove('open');
  renderTimeLog();
  renderDashboard();
});

let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function renderCalendar() {
  document.getElementById('cal-month-label').textContent = `${MONTHS[calMonth]} ${calYear}`;
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  DAYS.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-header';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    el.className = 'cal-day';
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    if (today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d) {
      el.classList.add('today');
    }

    const dateEl = document.createElement('div');
    dateEl.className = 'cal-date';
    dateEl.textContent = d;
    el.appendChild(dateEl);

    state.tasks
      .filter(t => t.due === dateStr)
      .slice(0, 3)
      .forEach(t => {
        const dot = document.createElement('div');
        dot.className = 'cal-task-dot';
        dot.textContent = '· ' + t.title;
        el.appendChild(dot);
      });

    grid.appendChild(el);
  }
}

document.getElementById('cal-prev').addEventListener('click', () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

loadState();
setGreeting();
renderDashboard();
renderTasks();
populateTaskSelect();
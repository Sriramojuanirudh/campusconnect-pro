import { mockReports } from '../data/mockData.js';
import { calculateSimilarity } from '../lib/matcher.js';

const state = {
  reports: [...mockReports],
  currentUser: null,
  mode: 'login',
  admin: false,
};

const els = {
  authPanel: document.querySelector('#authPanel'),
  appPanel: document.querySelector('#appPanel'),
  userLabel: document.querySelector('#userLabel'),
  authSubmit: document.querySelector('#authSubmit'),
  authForm: document.querySelector('#authForm'),
  authMessage: document.querySelector('#authMessage'),
  reportForm: document.querySelector('#reportForm'),
  reportMessage: document.querySelector('#reportMessage'),
  reportList: document.querySelector('#reportList'),
  matchList: document.querySelector('#matchList'),
  activityList: document.querySelector('#activityList'),
  adminList: document.querySelector('#adminList'),
  totalReports: document.querySelector('#totalReports'),
  lostReports: document.querySelector('#lostReports'),
  foundReports: document.querySelector('#foundReports'),
  searchInput: document.querySelector('#searchInput'),
  filterType: document.querySelector('#filterType'),
  tabs: [...document.querySelectorAll('.tab')],
  segments: [...document.querySelectorAll('.segment')],
};

function notify(element, message, variant = 'info') {
  element.textContent = message;
  element.className = `notice ${variant}`;
}

function setView(viewName) {
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('hidden', view.id !== viewName);
    view.classList.toggle('active', view.id === viewName);
  });

  els.tabs.forEach((button) => {
    const active = button.dataset.view === viewName;
    button.classList.toggle('active', active);
  });
}

function renderStats() {
  const lost = state.reports.filter((report) => report.type === 'Lost').length;
  const found = state.reports.filter((report) => report.type === 'Found').length;

  els.totalReports.textContent = state.reports.length;
  els.lostReports.textContent = lost;
  els.foundReports.textContent = found;

  document.querySelector('#adminTotal').textContent = state.reports.length;
  document.querySelector('#adminPending').textContent = state.reports.filter((report) => report.status !== 'resolved').length;
  document.querySelector('#adminResolved').textContent = state.reports.filter((report) => report.status === 'resolved').length;
}

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function renderReports() {
  const query = els.searchInput.value.trim().toLowerCase();
  const filter = els.filterType.value;

  const filtered = state.reports.filter((report) => {
    const typeMatch = filter === 'All' || report.type === filter;
    const searchableText = `${report.item} ${report.description} ${report.location}`.toLowerCase();
    const queryMatch = !query || searchableText.includes(query);
    return typeMatch && queryMatch;
  });

  els.reportList.innerHTML = filtered
    .map(
      (report) => `
        <article class="report-card ${report.type.toLowerCase()}">
          <div class="report-topline">
            <span class="badge ${report.type.toLowerCase()}">${report.type}</span>
            <span class="status ${report.status}">${report.status}</span>
          </div>
          <h4>${report.item}</h4>
          <p>${report.location}</p>
          <div class="meta">${formatDate(report.created_at)}</div>
          <p class="summary">${report.description}</p>
        </article>
      `
    )
    .join('') || '<div class="empty-state">No reports match your filters.</div>';
}

function renderMatches() {
  const lostReports = state.reports.filter((report) => report.type === 'Lost');
  const foundReports = state.reports.filter((report) => report.type === 'Found');

  const matches = [];

  for (const lost of lostReports) {
    for (const found of foundReports) {
      const score = calculateSimilarity(lost, found);
      if (score >= 0.35) {
        matches.push({ lost, found, score });
      }
    }
  }

  matches.sort((a, b) => b.score - a.score);

  els.matchList.innerHTML = matches
    .slice(0, 8)
    .map(
      ({ lost, found, score }) => `
        <article class="match-card">
          <div>
            <span class="badge lost">Lost: ${lost.item}</span>
            <span class="badge found">Found: ${found.item}</span>
          </div>
          <div class="score-row">
            <strong>${Math.round(score * 100)}%</strong>
            <span>match confidence</span>
          </div>
          <p>${lost.location} ↔ ${found.location}</p>
        </article>
      `
    )
    .join('') || '<div class="empty-state">No strong matches yet.</div>';
}

function renderActivity() {
  const latest = [...state.reports]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);

  els.activityList.innerHTML = latest
    .map(
      (item) => `
        <div class="activity-item">
          <span class="badge ${item.type.toLowerCase()}">${item.type}</span>
          <div>
            <strong>${item.item}</strong>
            <p>${item.location}</p>
          </div>
        </div>
      `
    )
    .join('');
}

function renderAdmin() {
  const queue = state.reports.filter((report) => report.status !== 'resolved');
  els.adminList.innerHTML = queue
    .map(
      (report) => `
        <article class="report-card admin-card">
          <div class="report-topline">
            <span class="badge ${report.type.toLowerCase()}">${report.type}</span>
            <span class="status ${report.status}">${report.status}</span>
          </div>
          <h4>${report.item}</h4>
          <p>${report.location}</p>
          <div class="admin-actions">
            <button type="button" class="small-btn approve">Resolve</button>
            <button type="button" class="small-btn danger">Flag</button>
          </div>
        </article>
      `
    )
    .join('') || '<div class="empty-state">No pending admin actions.</div>';
}

function renderAll() {
  renderStats();
  renderReports();
  renderMatches();
  renderActivity();
  renderAdmin();
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value.trim();

  if (password.length < 8) {
    notify(els.authMessage, 'Password must be at least 8 characters.', 'error');
    return;
  }

  state.currentUser = { email, role: 'student' };
  state.admin = email.toLowerCase().includes('admin');

  els.userLabel.textContent = state.admin ? `Admin • ${email}` : `Student • ${email}`;
  els.authPanel.classList.add('hidden');
  els.appPanel.classList.remove('hidden');
  notify(els.authMessage, 'Signed in successfully.', 'success');
  setView('overviewView');
  renderAll();
}

function handleReportSubmit(event) {
  event.preventDefault();

  const newReport = {
    id: Date.now(),
    user_id: state.currentUser?.email || 'anonymous',
    type: document.querySelector('#reportType').value,
    item: document.querySelector('#itemName').value.trim(),
    location: document.querySelector('#locationName').value.trim(),
    description: document.querySelector('#description').value.trim() || 'No notes provided.',
    image_path: '',
    created_at: new Date().toISOString(),
    status: 'pending',
  };

  if (!newReport.item || !newReport.location) {
    notify(els.reportMessage, 'Please fill in the item and location fields.', 'error');
    return;
  }

  state.reports.unshift(newReport);
  notify(els.reportMessage, 'Report published successfully.', 'success');
  state.reports = [...state.reports];
  renderAll();
  event.target.reset();
}

els.searchInput.addEventListener('input', renderReports);
els.filterType.addEventListener('change', renderReports);
els.tabs.forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
els.segments.forEach((button) => {
  button.addEventListener('click', () => {
    els.segments.forEach((item) => item.classList.toggle('active', item === button));
    state.mode = button.dataset.mode;
    els.authSubmit.textContent = state.mode === 'login' ? 'Log in' : 'Create account';
  });
});
els.authForm.addEventListener('submit', handleAuthSubmit);
els.reportForm.addEventListener('submit', handleReportSubmit);

renderAll();
setView('overviewView');

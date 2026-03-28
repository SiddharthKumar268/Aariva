// ── API helper ──
async function api(method, url, body = null, isForm = false) {
  const opts = {
    method,
    headers: isForm ? {} : { 'Content-Type': 'application/json' },
    body: body ? (isForm ? body : JSON.stringify(body)) : null
  };
  const res = await fetch(url, opts);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) throw new Error((data && (data.message || data.error)) || 'Request failed');
  return data;
}

// ── Toast notification ──
function showToast(message, type = 'success') {
  const existing = document.getElementById('toast-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    display:flex;flex-direction:column;gap:8px;`;

  const toast = document.createElement('div');
  const colors = {
    success: '#1D9E75',
    error: '#e05c5c',
    info: '#378ADD',
    warning: '#BA7517'
  };
  toast.style.cssText = `
    background:${colors[type] || colors.info};color:#fff;
    padding:12px 20px;border-radius:8px;font-size:13px;font-weight:500;
    box-shadow:0 4px 16px rgba(0,0,0,0.18);min-width:240px;max-width:360px;
    animation:slideIn .2s ease;`;
  toast.textContent = message;

  const style = document.createElement('style');
  style.textContent = `@keyframes slideIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(style);

  container.appendChild(toast);
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 3500);
}

// ── Show alert (inline) ──
function showAlert(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = message;
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ── Status badge ──
function statusBadge(status) {
  const normalized = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  const map = {
    pending: ['badge-pending', 'Pending'],
    under_review: ['badge-review', 'Under Review'],
    awaiting_evaluation: ['badge-evaluation', 'Awaiting Evaluation'],
    approved: ['badge-approved', 'Approved'],
    rejected: ['badge-rejected', 'Rejected'],
    clarification_needed: ['badge-clarify', 'Clarification Needed']
  };
  const [cls, label] = map[normalized] || ['badge-pending', status || 'Pending'];
  return `<span class="badge ${cls}">${label}</span>`;
}

// ── Priority badge ──
function priorityBadge(priority) {
  const map = {
    High: 'badge-rejected',
    Medium: 'badge-evaluation',
    Low: 'badge-approved'
  };
  return `<span class="badge ${map[priority] || 'badge-pending'}">${priority || 'Low'}</span>`;
}

// ── Format date ──
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ── Timeline progress bar ──
function renderTimeline(status) {
  const steps = [
    { key: 'pending', label: 'Submitted' },
    { key: 'under_review', label: 'Verified' },
    { key: 'awaiting_evaluation', label: 'Evaluated' },
    { key: 'approved', label: 'Decision' }
  ];

  const stepMap = {
    pending: 0,
    under_review: 1,
    awaiting_evaluation: 2,
    approved: 3,
    rejected: 3,
    clarification_needed: 2
  };
  const activeStep = stepMap[status] ?? 0;

  return `
    <div class="timeline-bar">
      ${steps.map((s, i) => `
        <div class="tl-step ${i < activeStep ? 'done' : ''} ${i === activeStep ? 'active' : ''}">
          <div class="tl-circle">${i < activeStep ? '✓' : i + 1}</div>
          <div class="tl-step-label">${s.label}</div>
        </div>
        ${i < steps.length - 1 ? `<div class="tl-connector ${i < activeStep ? 'done' : ''}"></div>` : ''}
      `).join('')}
    </div>`;
}

// ── Redirect if not logged in ──
// FIX: use alias routes (/login, /dashboard) not .html paths
async function requireAuth(allowedRoles = []) {
  try {
    const user = await api('GET', '/api/auth/me');
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      // Redirect to the correct role-based page instead of looping back to /dashboard
      const roleRoutes = {
        admin: '/admin',
        doctor: '/evaluation',
        caseworker: '/dashboard',
        applicant: '/track-case'
      };
      window.location.href = roleRoutes[user.role] || '/login';
      return null;
    }
    return user;
  } catch {
    // FIX: was '/login.html' — must match Express alias route
    window.location.href = '/login';
    return null;
  }
}

// ── Load notifications ──
async function loadNotifications() {
  try {
    const payload = await api('GET', '/api/auth/notifications');
    const notifs = Array.isArray(payload) ? payload : (payload?.notifications || []);
    const unread = notifs.filter(n => !n.read).length;
    const dot = document.getElementById('notif-dot');
    const list = document.getElementById('notif-list');
    if (dot) dot.style.display = unread > 0 ? 'inline-block' : 'none';
    if (list) {
      list.innerHTML = notifs.length === 0
        ? '<p style="color:var(--text-muted);font-size:13px;padding:8px 0">No notifications</p>'
        : notifs.slice(0, 8).map(n => `
            <div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;">
              <div style="color:${n.read ? 'var(--text-muted)' : 'var(--text)'};">${n.message}</div>
              <div style="font-size:11px;color:var(--text-faint);margin-top:3px">${formatDate(n.createdAt)}</div>
            </div>`).join('');
    }
  } catch {}
}

// ── Set active nav ──
function setActiveNav(page) {
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });
}

// ── Logout ──
async function logout() {
  await api('POST', '/api/auth/logout');
  window.location.href = '/';
}
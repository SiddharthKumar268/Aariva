(async () => {
  const user = await requireAuth();
  if (!user) return;

  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-role').textContent = capitalize(user.role);

  buildSidebar(user.role);
  buildContent(user.role);
  loadNotifications();
})();

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function buildSidebar(role) {
  const nav = document.getElementById('sidebar-nav');
  const links = {
    caseworker: `
      <a href="/dashboard" class="nav-link active"><span class="icon">📋</span> My Cases</a>
      <a href="/submit-case" class="nav-link"><span class="icon">➕</span> Submit Case</a>
      <a href="/track-case" class="nav-link"><span class="icon">🔍</span> Track Case</a>`,
    applicant: `
      <a href="/dashboard" class="nav-link active"><span class="icon">📋</span> My Status</a>
      <a href="/track-case" class="nav-link"><span class="icon">🔍</span> Track Case</a>`,
    doctor: `
      <a href="/dashboard" class="nav-link active"><span class="icon">📋</span> Overview</a>
      <a href="/evaluation" class="nav-link"><span class="icon">🩺</span> Evaluations</a>`,
    admin: `
      <a href="/dashboard" class="nav-link active"><span class="icon">📋</span> Overview</a>
      <a href="/admin" class="nav-link"><span class="icon">⚙️</span> Admin Panel</a>
      <a href="/track-case" class="nav-link"><span class="icon">🔍</span> Track Case</a>`
  };
  nav.innerHTML = links[role] || links['applicant'];
}

function buildContent(role) {
  const title    = document.getElementById('page-title');
  const subtitle = document.getElementById('page-subtitle');
  const content  = document.getElementById('role-content');

  if (role === 'caseworker') {
    title.textContent    = 'My Cases';
    subtitle.textContent = 'Cases you have submitted on behalf of applicants';
    content.innerHTML    = caseworkerHTML();
    loadCaseworkerCases();
  } else if (role === 'applicant') {
    title.textContent    = 'My Status';
    subtitle.textContent = 'Your disability case at a glance';
    content.innerHTML    = applicantHTML();
    loadApplicantStatus();
  } else if (role === 'doctor') {
    title.textContent    = 'Doctor Overview';
    subtitle.textContent = 'Cases assigned to you for medical evaluation';
    content.innerHTML    = doctorHTML();
    loadDoctorOverview();
  } else if (role === 'admin') {
    title.textContent    = 'Admin Overview';
    subtitle.textContent = 'System summary and quick actions';
    content.innerHTML    = adminHTML();
    loadAdminOverview();
  }
}

// =============================================================================
// CASE WORKER
// Features:
//   - Stats breakdown (total / pending / approved / rejected / escalated)
//   - Clarification banner listing which cases need a response
//   - Filter table by status
//   - Inline "Add Note" per case — posts to POST /api/cases/:id/notes
//   - View full details link
// =============================================================================
function caseworkerHTML() {
  return `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value" id="stat-total">—</div><div class="stat-label">Total</div></div>
      <div class="stat-card stat-card--blue"><div class="stat-value" id="stat-pending">—</div><div class="stat-label">Pending</div></div>
      <div class="stat-card stat-card--green"><div class="stat-value" id="stat-approved">—</div><div class="stat-label">Approved</div></div>
      <div class="stat-card stat-card--red"><div class="stat-value" id="stat-rejected">—</div><div class="stat-label">Rejected</div></div>
      <div class="stat-card stat-card--orange"><div class="stat-value" id="stat-escalated">—</div><div class="stat-label">Escalated</div></div>
    </div>

    <!-- Clarification cases — actionable list, not just a banner -->
    <div id="clarification-section" style="display:none">
      <div class="card" style="border-color:rgba(251,191,36,0.30)">
        <div class="card-header">
          <span class="card-title" style="color:var(--warning)">💬 Clarification Required</span>
          <small>Admin has requested more info on these cases. Add a note to respond.</small>
        </div>
        <div id="clarification-list"></div>
      </div>
    </div>

    <!-- Escalated cases — separate urgent section -->
    <div id="escalation-section" style="display:none">
      <div class="card" style="border-color:rgba(248,113,113,0.30)">
        <div class="card-header">
          <span class="card-title" style="color:var(--danger)">⚠️ Escalated — Overdue 7+ Days</span>
          <small>Follow up with admin or re-submit supporting documents.</small>
        </div>
        <div id="escalation-list"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">All Cases</span>
        <div style="display:flex;gap:8px;align-items:center">
          <select id="cw-filter-status" class="input-sm" onchange="filterCaseworkerTable()">
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Verified">Verified</option>
            <option value="Evaluated">Evaluated</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Clarification Requested">Clarification Requested</option>
          </select>
          <a href="/submit-case" class="btn btn-primary btn-sm">+ New Case</a>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Case ID</th><th>Applicant</th><th>Disability Type</th>
            <th>Severity</th><th>Status</th><th>Submitted</th><th>Actions</th>
          </tr></thead>
          <tbody id="cases-tbody">
            <tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Inline note modal -->
    <div class="modal-overlay" id="note-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeNoteModal()">✕</button>
        <h3>Add Note</h3>
        <p class="modal-subtitle">Case <span id="note-case-id-display" style="font-family:monospace;font-size:0.8rem"></span></p>
        <div class="form-group">
          <label>Note</label>
          <textarea id="note-text" rows="4" placeholder="Type your note or clarification response here..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeNoteModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitNote()">Submit Note</button>
        </div>
      </div>
    </div>`;
}

let _allCaseworkerCases = [];
let _activeCaseId = null;

async function loadCaseworkerCases() {
  try {
    const cases = await api('GET', '/api/cases/my-cases');
    _allCaseworkerCases = cases || [];

    document.getElementById('stat-total').textContent     = _allCaseworkerCases.length;
    document.getElementById('stat-pending').textContent   = _allCaseworkerCases.filter(c => ['Submitted','Verified','Evaluated'].includes(c.caseStatus)).length;
    document.getElementById('stat-approved').textContent  = _allCaseworkerCases.filter(c => c.caseStatus === 'Approved').length;
    document.getElementById('stat-rejected').textContent  = _allCaseworkerCases.filter(c => c.caseStatus === 'Rejected').length;
    document.getElementById('stat-escalated').textContent = _allCaseworkerCases.filter(c => c.escalated).length;

    // Clarification section — show each case needing a response
    const clarify = _allCaseworkerCases.filter(c => c.caseStatus === 'Clarification Requested');
    if (clarify.length) {
      document.getElementById('clarification-section').style.display = 'block';
      document.getElementById('clarification-list').innerHTML = clarify.map(c => `
        <div style="padding:12px 20px;border-bottom:1px solid var(--border-dim);display:flex;justify-content:space-between;align-items:center;gap:16px">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text-bright)">${c.applicant?.firstName || ''} ${c.applicant?.lastName || ''}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${c.clarificationRequest?.details || 'Admin requested additional information.'}</div>
            <div style="font-size:11px;color:var(--text-faint);margin-top:4px">Requested ${formatDate(c.clarificationRequest?.requestedAt)}</div>
          </div>
          <button class="btn btn-warning btn-sm" onclick="openNoteModal('${c._id}')">Respond with Note</button>
        </div>`).join('');
    }

    // Escalation section
    const escalated = _allCaseworkerCases.filter(c => c.escalated);
    if (escalated.length) {
      document.getElementById('escalation-section').style.display = 'block';
      document.getElementById('escalation-list').innerHTML = escalated.map(c => `
        <div style="padding:12px 20px;border-bottom:1px solid var(--border-dim);display:flex;justify-content:space-between;align-items:center;gap:16px">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--text-bright)">${c.applicant?.firstName || ''} ${c.applicant?.lastName || ''} — ${c.disability?.disabilityType || '—'}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Submitted ${formatDate(c.submissionDate)} · Status: ${c.caseStatus}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="viewSummary('${c._id}')">View Details</button>
        </div>`).join('');
    }

    renderCaseworkerTable(_allCaseworkerCases);
  } catch (err) {
    showToast(err.message || 'Failed to load cases', 'error');
  }
}

function filterCaseworkerTable() {
  const status = document.getElementById('cw-filter-status').value;
  renderCaseworkerTable(status ? _allCaseworkerCases.filter(c => c.caseStatus === status) : _allCaseworkerCases);
}

function renderCaseworkerTable(cases) {
  const tbody = document.getElementById('cases-tbody');
  if (!tbody) return;
  if (!cases.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">No cases found</td></tr>';
    return;
  }
  tbody.innerHTML = cases.map(c => `
    <tr>
      <td><span style="font-family:monospace;font-size:11px">${c._id.slice(-8)}</span></td>
      <td>${c.applicant?.firstName || ''} ${c.applicant?.lastName || ''}</td>
      <td>${c.disability?.disabilityType || '—'}</td>
      <td>${severityBadge(c.disability?.severity)}</td>
      <td>
        ${statusBadge(c.caseStatus || 'Submitted')}
        ${c.escalated ? ' <span class="badge badge-escalated">Escalated</span>' : ''}
      </td>
      <td>${formatDate(c.submissionDate)}</td>
      <td style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="viewSummary('${c._id}')">View</button>
        <button class="btn btn-ghost btn-sm" onclick="openNoteModal('${c._id}')">+ Note</button>
      </td>
    </tr>`).join('');
}

function openNoteModal(caseId) {
  _activeCaseId = caseId;
  document.getElementById('note-case-id-display').textContent = '#' + caseId;
  document.getElementById('note-text').value = '';
  document.getElementById('note-modal').classList.add('open');
}

function closeNoteModal() {
  document.getElementById('note-modal').classList.remove('open');
  _activeCaseId = null;
}

async function submitNote() {
  const text = document.getElementById('note-text').value.trim();
  if (!text) { showToast('Note cannot be empty', 'error'); return; }
  try {
    await api('POST', `/api/cases/${_activeCaseId}/notes`, { text });
    showToast('Note added successfully', 'success');
    closeNoteModal();
  } catch (err) {
    showToast(err.message || 'Failed to add note', 'error');
  }
}

// =============================================================================
// APPLICANT
// Features:
//   - Latest case status hero with all key fields
//   - Clarification details displayed clearly if admin flagged it
//   - Case progress timeline (horizontal stepper)
//   - Print case summary button (calls /api/admin/cases/:id/summary)
//   - What happens next explanation per status
// =============================================================================
function applicantHTML() {
  return `
    <div id="applicant-no-case" style="display:none" class="card">
      <div style="padding:32px;text-align:center">
        <div style="font-size:2rem;margin-bottom:12px">📭</div>
        <div style="font-weight:600;margin-bottom:8px;color:var(--text-bright)">No case on file</div>
        <div style="color:var(--text-muted);margin-bottom:20px">Your case worker hasn't submitted a case for you yet.</div>
        <a href="/track-case" class="btn btn-primary">Track by Case ID</a>
      </div>
    </div>

    <div id="applicant-main" style="display:none">

      <!-- Clarification alert — shown only when admin requests more info -->
      <div id="clarif-alert" style="display:none" class="alert alert-warning" style="display:flex">
        <div>
          <strong>Action Required — Clarification Requested</strong>
          <div id="clarif-details" style="margin-top:4px;font-size:13px"></div>
          <div id="clarif-date" style="margin-top:2px;font-size:11px;opacity:0.7"></div>
        </div>
      </div>

      <!-- Case summary card -->
      <div class="card" style="border-top:2px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px">
          <div>
            <div style="font-size:11px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.08em">Case ID</div>
            <div id="app-case-id" style="font-family:monospace;font-size:13px;color:var(--text-muted);margin-top:2px"></div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <div id="app-status-badge"></div>
            <button id="app-print-btn" class="btn btn-outline btn-sm" onclick="printCaseSummary()" style="display:none">🖨 Print Summary</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px">
          <div>
            <div style="font-size:11px;color:var(--text-faint)">Applicant</div>
            <div id="app-name" style="font-weight:600;color:var(--text-bright);margin-top:3px"></div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-faint)">Disability Type</div>
            <div id="app-dtype" style="font-weight:600;color:var(--text-bright);margin-top:3px"></div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-faint)">Severity</div>
            <div id="app-severity" style="font-weight:600;color:var(--text-bright);margin-top:3px"></div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-faint)">Onset Date</div>
            <div id="app-onset" style="font-weight:600;color:var(--text-bright);margin-top:3px"></div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text-faint)">Submitted</div>
            <div id="app-submitted" style="font-weight:600;color:var(--text-bright);margin-top:3px"></div>
          </div>
          <div id="app-escalated-cell" style="display:none">
            <div style="font-size:11px;color:var(--text-faint)">Flag</div>
            <div style="font-weight:600;color:var(--warning);margin-top:3px">⚠ Escalated</div>
          </div>
        </div>
      </div>

      <!-- Case progress stepper -->
      <div class="card">
        <div class="card-header"><span class="card-title">Case Progress</span></div>
        <div class="timeline-steps" id="applicant-timeline"></div>
      </div>

      <!-- What happens next — changes per status -->
      <div class="card">
        <div class="card-header"><span class="card-title">What Happens Next</span></div>
        <div id="app-next" style="padding:16px 20px;font-size:14px;color:var(--text-muted);line-height:1.7"></div>
      </div>

      <!-- Decision details — shown only when Approved or Rejected -->
      <div id="app-decision-card" style="display:none" class="card">
        <div class="card-header"><span class="card-title">Decision Details</span></div>
        <div id="app-decision-body" style="padding:16px 20px;font-size:14px;color:var(--text-muted)"></div>
      </div>

    </div>`;
}

let _applicantCaseId = null;

async function loadApplicantStatus() {
  try {
    let cases = [];
    try { cases = await api('GET', '/api/cases/my-cases'); } catch (_) {}

    if (!cases || !cases.length) {
      document.getElementById('applicant-no-case').style.display = 'block';
      return;
    }

    const latest = cases[cases.length - 1];
    _applicantCaseId = latest._id;

    document.getElementById('applicant-main').style.display  = 'block';
    document.getElementById('app-case-id').textContent       = '#' + latest._id;
    document.getElementById('app-name').textContent          = `${latest.applicant?.firstName || ''} ${latest.applicant?.lastName || ''}`.trim() || '—';
    document.getElementById('app-dtype').textContent         = latest.disability?.disabilityType || '—';
    document.getElementById('app-severity').textContent      = latest.disability?.severity || '—';
    document.getElementById('app-onset').textContent         = latest.disability?.onsetDate || '—';
    document.getElementById('app-submitted').textContent     = formatDate(latest.submissionDate);
    document.getElementById('app-status-badge').innerHTML    = statusBadge(latest.caseStatus || 'Submitted');

    if (latest.escalated) document.getElementById('app-escalated-cell').style.display = 'block';

    // Show print button once there's a decision
    if (['Approved','Rejected'].includes(latest.caseStatus)) {
      document.getElementById('app-print-btn').style.display = 'inline-flex';
    }

    // Clarification alert
    if (latest.caseStatus === 'Clarification Requested' && latest.clarificationRequest?.details) {
      const ca = document.getElementById('clarif-alert');
      ca.style.display = 'flex';
      document.getElementById('clarif-details').textContent = latest.clarificationRequest.details;
      document.getElementById('clarif-date').textContent    = 'Requested on ' + formatDate(latest.clarificationRequest.requestedAt);
    }

    // Timeline stepper
    const steps     = ['Submitted','Verified','Evaluated','Decision'];
    const stepIndex = { Submitted:0, Verified:1, Evaluated:2, Approved:3, Rejected:3, 'Clarification Requested':2 };
    const current   = stepIndex[latest.caseStatus] ?? 0;
    document.getElementById('applicant-timeline').innerHTML = steps.map((step, i) => `
      <div class="timeline-step ${i < current ? 'done' : i === current ? 'active' : ''}">
        <div class="timeline-circle">${i < current ? '✓' : i + 1}</div>
        <div class="timeline-label">${step}</div>
      </div>${i < steps.length - 1 ? '<div class="timeline-connector"></div>' : ''}`).join('');

    // What happens next
    const nextMap = {
      'Submitted':               'Your case has been received and is waiting for a case worker to verify your documents.',
      'Verified':                'Documents verified. A doctor will now review your case and submit a medical evaluation.',
      'Evaluated':               'Medical evaluation complete. An admin will review all information and issue a final decision.',
      'Clarification Requested': 'The admin needs more information. Your case worker has been notified and will contact you.',
      'Approved':                '✅ Your case has been approved. Contact your case worker regarding next steps for your disability services.',
      'Rejected':                '❌ Your case was not approved. Contact your case worker to discuss grounds for resubmission or an appeal.',
    };
    document.getElementById('app-next').textContent = nextMap[latest.caseStatus] || 'Your case is being processed.';

    // Decision block — fetch decision record if decided
    if (['Approved','Rejected'].includes(latest.caseStatus)) {
      try {
        const summary = await api('GET', `/api/cases/${latest._id}`);
        const dec = summary?.decision;
        if (dec?.remarks) {
          document.getElementById('app-decision-card').style.display = 'block';
          document.getElementById('app-decision-body').innerHTML = `
            <div style="margin-bottom:8px"><span style="color:var(--text-faint);font-size:12px">Decision by</span> <strong>${dec.decidedBy || 'Admin'}</strong> on ${formatDate(dec.decidedAt)}</div>
            <div style="background:var(--bg-overlay);border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:12px 16px;font-size:13px;line-height:1.6">${dec.remarks}</div>`;
        }
      } catch (_) {}
    }

  } catch (err) {
    showToast(err.message || 'Failed to load status', 'error');
  }
}

async function printCaseSummary() {
  if (!_applicantCaseId) return;
  try {
    const summary = await api('GET', `/api/admin/cases/${_applicantCaseId}/summary`);
    const w = window.open('', '_blank');
    w.document.write(`<pre style="font-family:monospace;padding:24px">${JSON.stringify(summary, null, 2)}</pre>`);
    w.print();
  } catch (err) {
    // Fallback — open track page and let user print from there
    window.open(`/track-case?id=${_applicantCaseId}`, '_blank');
  }
}

// =============================================================================
// DOCTOR
// Features:
//   - Count of pending evaluations + high severity count
//   - Table of pending cases sorted by severity (Critical first)
//   - Direct link to evaluation page pre-filled with case ID
//   - Days pending shown — so doctor knows which are overdue
//   - Cases already evaluated today shown separately
// =============================================================================
function doctorHTML() {
  return `
    <div class="stats-grid">
      <div class="stat-card stat-card--blue"><div class="stat-value" id="doc-pending">—</div><div class="stat-label">Pending Evaluations</div></div>
      <div class="stat-card stat-card--red"><div class="stat-value" id="doc-critical">—</div><div class="stat-label">Critical / Severe</div></div>
      <div class="stat-card stat-card--orange"><div class="stat-value" id="doc-overdue">—</div><div class="stat-label">Overdue (&gt;7 days)</div></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Pending Evaluations</span>
        <small style="color:var(--text-muted)">Sorted by severity — Critical first</small>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Case ID</th><th>Applicant</th><th>Disability</th>
            <th>Severity</th><th>Days Pending</th><th>Action</th>
          </tr></thead>
          <tbody id="doc-tbody">
            <tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

async function loadDoctorOverview() {
  try {
    const cases = (await api('GET', '/api/evaluation/queue')) || [];

    const severityOrder = { Critical:0, Severe:1, Moderate:2, Mild:3 };
    cases.sort((a, b) => (severityOrder[a.disability?.severity] ?? 4) - (severityOrder[b.disability?.severity] ?? 4));

    const critical = cases.filter(c => ['Critical','Severe'].includes(c.disability?.severity)).length;
    const overdue  = cases.filter(c => daysPending(c.submissionDate) > 7).length;

    document.getElementById('doc-pending').textContent  = cases.length;
    document.getElementById('doc-critical').textContent = critical;
    document.getElementById('doc-overdue').textContent  = overdue;

    const tbody = document.getElementById('doc-tbody');
    if (!cases.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:32px">No pending evaluations 🎉</td></tr>';
      return;
    }

    tbody.innerHTML = cases.map(c => {
      const days    = daysPending(c.submissionDate);
      const overdue = days > 7;
      return `<tr>
        <td><span style="font-family:monospace;font-size:11px">${c._id.slice(-8)}</span></td>
        <td>${c.applicant?.firstName || ''} ${c.applicant?.lastName || ''}</td>
        <td>${c.disability?.disabilityType || '—'}</td>
        <td>${severityBadge(c.disability?.severity)}</td>
        <td style="color:${overdue ? 'var(--danger)' : 'var(--text-muted)'}">
          ${days} day${days !== 1 ? 's' : ''}${overdue ? ' ⚠' : ''}
        </td>
        <td><a href="/evaluation?case=${c._id}" class="btn btn-primary btn-sm">Evaluate</a></td>
      </tr>`;
    }).join('');
  } catch (err) {
    showToast(err.message || 'Failed to load evaluations', 'error');
  }
}

// =============================================================================
// ADMIN
// Features:
//   - Stats: total / pending / approved / rejected / escalated / clarification
//   - Inline approve / reject / clarify directly from dashboard (no page hop)
//   - Filter table by status
//   - Days pending shown — overdue cases highlighted
//   - Recent audit log
// =============================================================================
function adminHTML() {
  return `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value" id="adm-total">—</div><div class="stat-label">Total</div></div>
      <div class="stat-card stat-card--blue"><div class="stat-value" id="adm-pending">—</div><div class="stat-label">Awaiting Decision</div></div>
      <div class="stat-card stat-card--green"><div class="stat-value" id="adm-approved">—</div><div class="stat-label">Approved</div></div>
      <div class="stat-card stat-card--red"><div class="stat-value" id="adm-rejected">—</div><div class="stat-label">Rejected</div></div>
      <div class="stat-card stat-card--orange"><div class="stat-value" id="adm-escalated">—</div><div class="stat-label">Escalated</div></div>
      <div class="stat-card stat-card--purple"><div class="stat-value" id="adm-clarify">—</div><div class="stat-label">Needs Clarification</div></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Cases</span>
        <select id="adm-filter" class="input-sm" onchange="filterAdminTable()">
          <option value="">All</option>
          <option value="Evaluated">Ready for Decision</option>
          <option value="Submitted">Submitted</option>
          <option value="Verified">Verified</option>
          <option value="Clarification Requested">Clarification Requested</option>
          <option value="escalated">Escalated Only</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Case ID</th><th>Applicant</th><th>Disability</th>
            <th>Severity</th><th>Status</th><th>Days Pending</th><th>Actions</th>
          </tr></thead>
          <tbody id="adm-cases-tbody">
            <tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Recent audit log -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">Audit Log</span>
        <a href="/admin#logs" class="btn btn-outline btn-sm">View All</a>
      </div>
      <div id="adm-audit-feed" class="activity-feed">
        <div style="color:var(--text-muted);padding:16px">Loading...</div>
      </div>
    </div>

    <!-- Inline action modal (approve / reject / clarify) -->
    <div class="modal-overlay" id="adm-action-modal">
      <div class="modal">
        <button class="modal-close" onclick="closeAdminModal()">✕</button>
        <h3 id="adm-modal-title">Action</h3>
        <p class="modal-subtitle">Case <span id="adm-modal-case-id" style="font-family:monospace;font-size:0.8rem"></span></p>
        <div class="form-group">
          <label id="adm-modal-label">Remarks</label>
          <textarea id="adm-modal-remarks" rows="4" placeholder="Required — provide justification or clarification details..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeAdminModal()">Cancel</button>
          <button id="adm-modal-confirm" class="btn btn-primary" onclick="submitAdminAction()">Confirm</button>
        </div>
      </div>
    </div>`;
}

let _allAdminCases  = [];
let _adminActionCase = null;
let _adminAction    = null;

async function loadAdminOverview() {
  try {
    const [cases, logsData] = await Promise.all([
      api('GET', '/api/admin/cases').catch(() => []),
      api('GET', '/api/admin/logs').catch(() => [])
    ]);

    _allAdminCases = cases || [];

    document.getElementById('adm-total').textContent     = _allAdminCases.length;
    document.getElementById('adm-pending').textContent   = _allAdminCases.filter(c => ['Submitted','Verified','Evaluated'].includes(c.caseStatus)).length;
    document.getElementById('adm-approved').textContent  = _allAdminCases.filter(c => c.caseStatus === 'Approved').length;
    document.getElementById('adm-rejected').textContent  = _allAdminCases.filter(c => c.caseStatus === 'Rejected').length;
    document.getElementById('adm-escalated').textContent = _allAdminCases.filter(c => c.escalated).length;
    document.getElementById('adm-clarify').textContent   = _allAdminCases.filter(c => c.caseStatus === 'Clarification Requested').length;

    renderAdminTable(_allAdminCases);
    renderAuditLog(logsData);
  } catch (err) {
    showToast(err.message || 'Failed to load admin overview', 'error');
  }
}

function filterAdminTable() {
  const val = document.getElementById('adm-filter').value;
  let filtered = _allAdminCases;
  if (val === 'escalated') filtered = _allAdminCases.filter(c => c.escalated);
  else if (val)            filtered = _allAdminCases.filter(c => c.caseStatus === val);
  renderAdminTable(filtered);
}

function renderAdminTable(cases) {
  const tbody = document.getElementById('adm-cases-tbody');
  if (!tbody) return;
  if (!cases.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:32px">No cases found</td></tr>';
    return;
  }
  // Sort: escalated first, then by days pending desc
  const sorted = [...cases].sort((a, b) => {
    if (a.escalated !== b.escalated) return a.escalated ? -1 : 1;
    return daysPending(b.submissionDate) - daysPending(a.submissionDate);
  });

  tbody.innerHTML = sorted.slice(0, 15).map(c => {
    const days    = daysPending(c.submissionDate);
    const overdue = days > 7;
    const decided = ['Approved','Rejected'].includes(c.caseStatus);
    return `<tr>
      <td><span style="font-family:monospace;font-size:11px">${c._id.slice(-8)}</span></td>
      <td>${c.applicant?.firstName || ''} ${c.applicant?.lastName || ''}</td>
      <td>${c.disability?.disabilityType || '—'}</td>
      <td>${severityBadge(c.disability?.severity)}</td>
      <td>
        ${statusBadge(c.caseStatus || 'Submitted')}
        ${c.escalated ? ' <span class="badge badge-escalated">Escalated</span>' : ''}
      </td>
      <td style="color:${overdue ? 'var(--danger)' : 'var(--text-muted)'}">
        ${days}d${overdue ? ' ⚠' : ''}
      </td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" onclick="viewSummary('${c._id}')">View</button>
          ${!decided ? `
          <button class="btn btn-success btn-sm" onclick="openAdminModal('${c._id}','approve')">✓ Approve</button>
          <button class="btn btn-danger btn-sm"  onclick="openAdminModal('${c._id}','reject')">✗ Reject</button>
          <button class="btn btn-warning btn-sm" onclick="openAdminModal('${c._id}','clarify')">? Clarify</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  if (cases.length > 15) {
    tbody.innerHTML += `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:12px;font-size:13px">
      Showing 15 of ${cases.length}. <a href="/admin" style="color:var(--accent)">View all →</a>
    </td></tr>`;
  }
}

function openAdminModal(caseId, action) {
  _adminActionCase = caseId;
  _adminAction     = action;
  const labels = { approve:'Approve Case', reject:'Reject Case', clarify:'Request Clarification' };
  const btnCls  = { approve:'btn-success', reject:'btn-danger', clarify:'btn-warning' };
  document.getElementById('adm-modal-title').textContent    = labels[action];
  document.getElementById('adm-modal-case-id').textContent  = '#' + caseId;
  document.getElementById('adm-modal-label').textContent    = action === 'clarify' ? 'What information is needed?' : 'Remarks (required)';
  document.getElementById('adm-modal-remarks').value        = '';
  document.getElementById('adm-modal-remarks').placeholder  = action === 'clarify'
    ? 'Describe what additional information or documents are required...'
    : 'Provide justification for this decision...';
  const btn = document.getElementById('adm-modal-confirm');
  btn.className = `btn ${btnCls[action]}`;
  btn.textContent = labels[action];
  document.getElementById('adm-action-modal').classList.add('open');
}

function closeAdminModal() {
  document.getElementById('adm-action-modal').classList.remove('open');
  _adminActionCase = null;
  _adminAction     = null;
}

async function submitAdminAction() {
  const remarks = document.getElementById('adm-modal-remarks').value.trim();
  if (!remarks) { showToast('Remarks are required', 'error'); return; }
  const endpoints = { approve:'approve', reject:'reject', clarify:'clarify' };
  try {
    await api('POST', `/api/admin/cases/${_adminActionCase}/${endpoints[_adminAction]}`, { remarks });
    showToast(`Case ${_adminAction}d successfully`, 'success');
    closeAdminModal();
    loadAdminOverview(); // refresh table and stats
  } catch (err) {
    showToast(err.message || 'Action failed', 'error');
  }
}

function renderAuditLog(logs) {
  const el = document.getElementById('adm-audit-feed');
  if (!el) return;
  const items = Array.isArray(logs) ? logs : (logs?.logs || []);
  if (!items.length) { el.innerHTML = '<div style="color:var(--text-muted);padding:16px">No audit entries yet.</div>'; return; }
  const dotClass = { approve:'dot-green', reject:'dot-red', escalate:'dot-orange', clarify:'dot-orange' };
  el.innerHTML = items.slice(0, 10).map(log => `
    <div class="activity-item">
      <div class="activity-dot ${dotClass[log.action] || 'dot-blue'}"></div>
      <div class="activity-body">
        <div class="activity-title"><strong>${log.action || 'Action'}</strong> — Case #${(log.caseId || '').toString().slice(-6)}</div>
        <div class="activity-sub">${log.performedBy || 'System'}${log.details ? ' · ' + log.details : ''}</div>
      </div>
      <div class="activity-time">${formatDate(log.timestamp)}</div>
    </div>`).join('');
}

// =============================================================================
// SHARED HELPERS
// =============================================================================
function viewSummary(caseId) {
  window.open(`/track-case?id=${caseId}`, '_blank');
}

function daysPending(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

function severityBadge(severity) {
  if (!severity) return '<span style="color:var(--text-faint)">—</span>';
  const map = { Mild:'badge-mild', Moderate:'badge-moderate', Severe:'badge-severe', Critical:'badge-critical' };
  return `<span class="badge ${map[severity] || 'badge-moderate'}">${severity}</span>`;
}

// Notifications
document.getElementById('notif-btn')?.addEventListener('click', async () => {
  const panel = document.getElementById('notif-panel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  if (panel.style.display === 'block') {
    await api('PATCH', '/api/auth/notifications/read');
    document.getElementById('notif-dot').style.display = 'none';
    loadNotifications();
  }
});
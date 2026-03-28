// ── Case Submission ──
const submitForm = document.getElementById('submit-case-form');
if (submitForm) {
  submitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.innerHTML = '<span class="spinner"></span> Submitting...';
    btn.disabled = true;

    const formData = new FormData(submitForm);
    try {
      const data = await api('POST', '/api/cases/submit', formData, true);
      showToast(`Case submitted! ID: ${data.caseId}`, 'success');
      showAlert('alert', `Case submitted successfully! Case ID: ${data.caseId}`, 'success');
      submitForm.reset();
      document.getElementById('file-names').textContent = '';
    } catch (err) {
      showToast(err.message, 'error');
      showAlert('alert', err.message);
    } finally {
      btn.innerHTML = 'Submit Case';
      btn.disabled = false;
    }
  });

  const fileInput = document.getElementById('documents');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const names = Array.from(fileInput.files).map(f => f.name).join(', ');
      document.getElementById('file-names').textContent = names || '';
    });
  }
}

// ── Case Tracking ──
const trackForm = document.getElementById('track-form');
if (trackForm) {
  trackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const caseId = document.getElementById('case-id-input').value.trim();
    if (!caseId) return showToast('Please enter a Case ID', 'error');

    const btn = trackForm.querySelector('button[type="submit"]');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      const data = await api('GET', `/api/cases/track/${caseId}`);
      renderTrackResult(data);
    } catch (err) {
      showToast(err.message, 'error');
      showAlert('alert', err.message);
      document.getElementById('track-result').style.display = 'none';
    } finally {
      btn.innerHTML = 'Track';
      btn.disabled = false;
    }
  });
}

function renderTrackResult(c) {
  const el = document.getElementById('track-result');
  const escalatedBadge = c.isEscalated ? '<span class="badge badge-escalated">⚠ Escalated</span>' : '';

  el.innerHTML = `
    <div class="card" style="margin-top:24px">
      <div class="card-header">
        <div>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px">Case ID</div>
          <div style="font-size:22px;font-weight:600">${c.caseId}</div>
        </div>
        <div style="text-align:right;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${statusBadge(c.status)}
          ${priorityBadge(c.priority)}
          ${escalatedBadge}
        </div>
      </div>

      ${renderTimeline(c.status)}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0">
        <div><div class="stat-label" style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Applicant</div><div style="font-weight:500">${c.applicantName}</div></div>
        <div><div class="stat-label" style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Disability Type</div><div style="font-weight:500">${c.disabilityType}</div></div>
        <div><div class="stat-label" style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Severity</div><div style="font-weight:500;text-transform:capitalize">${c.severity}</div></div>
        <div><div class="stat-label" style="font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">Submitted</div><div style="font-weight:500">${formatDate(c.createdAt)}</div></div>
      </div>

      ${c.clarificationNote ? `<div class="alert alert-info show" style="margin-bottom:16px">📋 Clarification needed: ${c.clarificationNote}</div>` : ''}

      <div style="margin-top:16px">
        <div style="font-size:13px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.8px;margin-bottom:14px">Status History</div>
        <ul class="timeline">
          ${c.statusHistory.map(h => `
            <li>
              <div class="tl-time">${formatDate(h.changedAt)}</div>
              <div class="tl-label">${statusBadge(h.status)}</div>
              <div class="tl-note">${h.note || ''}</div>
            </li>`).join('')}
        </ul>
      </div>

      <div style="margin-top:20px;text-align:right">
        <button class="btn btn-outline btn-sm" onclick="printSummary('${c.caseId}')">🖨 Print Summary</button>
      </div>
    </div>`;
  el.style.display = 'block';
}

async function printSummary(caseId) {
  try {
    const data = await api('GET', `/api/cases/summary/${caseId}`);
    const w = window.open('', '_blank');
    const c = data.case;
    const ev = data.evaluation;
    const dec = data.decision;
    w.document.write(`
      <html><head><title>Case Summary - ${c.caseId}</title>
      <style>body{font-family:sans-serif;padding:40px;color:#111}h1{color:#1a3a6b}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{border:1px solid #ddd;padding:8px 12px;font-size:13px}th{background:#f5f5f5}h3{margin-top:24px;color:#333}</style>
      </head><body>
      <h1>Aariva — Case Summary</h1>
      <p style="color:#666">Generated: ${new Date().toLocaleString()}</p>
      <h3>Case Details</h3>
      <table>
        <tr><th>Case ID</th><td>${c.caseId}</td><th>Status</th><td>${c.status}</td></tr>
        <tr><th>Applicant</th><td>${c.applicantName}</td><th>Email</th><td>${c.applicantEmail}</td></tr>
        <tr><th>Age</th><td>${c.age}</td><th>Gender</th><td>${c.gender}</td></tr>
        <tr><th>Disability Type</th><td>${c.disabilityType}</td><th>Severity</th><td>${c.severity}</td></tr>
        <tr><th>Priority</th><td>${c.priority}</td><th>Submitted</th><td>${formatDate(c.createdAt)}</td></tr>
        <tr><th colspan="4">Description: ${c.disabilityDescription}</th></tr>
      </table>
      ${ev ? `<h3>Medical Evaluation</h3>
      <table>
        <tr><th>Doctor</th><td>${ev.doctor?.name || '—'}</td><th>Confirmed</th><td>${ev.disabilityConfirmed ? 'Yes' : 'No'}</td></tr>
        <tr><th>Diagnosis</th><td colspan="3">${ev.diagnosis}</td></tr>
        <tr><th>Severity Score</th><td>${ev.severityScore}/5</td><th>Assessment</th><td style="text-transform:capitalize">${ev.severityAssessment}</td></tr>
        <tr><th>Notes</th><td colspan="3">${ev.evaluationNotes}</td></tr>
        ${ev.recommendedTreatment ? `<tr><th>Treatment</th><td colspan="3">${ev.recommendedTreatment}</td></tr>` : ''}
      </table>` : ''}
      ${dec ? `<h3>Admin Decision</h3>
      <table>
        <tr><th>Decision</th><td>${dec.decision}</td><th>By</th><td>${dec.admin?.name || '—'}</td></tr>
        <tr><th>Remarks</th><td colspan="3">${dec.remarks}</td></tr>
        <tr><th>Date</th><td colspan="3">${formatDate(dec.decidedAt)}</td></tr>
      </table>` : ''}
      <h3>Status History</h3>
      <table><tr><th>Status</th><th>Note</th><th>Date</th></tr>
        ${c.statusHistory.map(h => `<tr><td>${h.status}</td><td>${h.note || '—'}</td><td>${formatDate(h.changedAt)}</td></tr>`).join('')}
      </table>
      </body></html>`);
    w.document.close();
    w.print();
  } catch (err) {
    showToast('Could not generate summary', 'error');
  }
}
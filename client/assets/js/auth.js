// ─────────────────────────────────────────────
//  Aariva · auth.js  — Login + OTP Flow
// ─────────────────────────────────────────────

// ── Helpers ──────────────────────────────────

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function storeOTP(otp) {
  sessionStorage.setItem('aariva_otp', otp);
  sessionStorage.setItem('aariva_otp_expiry', Date.now() + 5 * 60 * 1000);
}

function verifyOTP(enteredOTP) {
  const storedOTP = sessionStorage.getItem('aariva_otp');
  const expiry = parseInt(sessionStorage.getItem('aariva_otp_expiry'));

  if (!storedOTP || !expiry) return { valid: false, reason: 'No OTP found. Please request a new one.' };
  if (Date.now() > expiry)   return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  if (enteredOTP.trim() !== storedOTP) return { valid: false, reason: 'Incorrect OTP. Please try again.' };

  sessionStorage.removeItem('aariva_otp');
  sessionStorage.removeItem('aariva_otp_expiry');
  return { valid: true };
}

function clearOTPState() {
  sessionStorage.removeItem('aariva_otp');
  sessionStorage.removeItem('aariva_otp_expiry');
  sessionStorage.removeItem('aariva_pending_email');
  sessionStorage.removeItem('aariva_pending_role');
  sessionStorage.removeItem('aariva_pending_name');
}

// ── Internal show/hide helpers ────────────────
// These work with element IDs (strings) so they are
// compatible with both auth.js usage AND the
// window.showError / window.showSuccess overrides
// defined in login.html's inline <script>.

function _showMsg(elId, type, text) {
  const el = typeof elId === 'string' ? document.getElementById(elId) : elId;
  if (!el) return;
  el.textContent = text;
  // Use gold for errors and muted green for success — matches dark theme
  el.style.color   = type === 'error' ? '#c8a96e' : '#7ec8a0';
  el.style.display = 'block';
}

function _hideMsg(elId) {
  const el = typeof elId === 'string' ? document.getElementById(elId) : elId;
  if (!el) return;
  el.textContent   = '';
  el.style.display = 'none';
}

// ── EmailJS Send ──────────────────────────────

async function sendOTPEmail(toEmail, userName) {
  const otp = generateOTP();
  storeOTP(otp);

  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      {
        to_email:       toEmail,
        to_name:        userName || 'User',
        otp_code:       otp,
        expiry_minutes: '5'
      }
    );
    return { success: true };
  } catch (err) {
    console.error('EmailJS error:', err);
    return { success: false, error: err.text || 'Failed to send OTP email.' };
  }
}

// ── Resend Cooldown Timer ─────────────────────

function startResendCooldown(btnId = 'resend-btn', seconds = 30) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.disabled = true;
  let remaining = seconds;

  const interval = setInterval(() => {
    btn.textContent = `Resend OTP (${remaining}s)`;
    remaining--;

    if (remaining < 0) {
      clearInterval(interval);
      btn.disabled    = false;
      btn.textContent = 'Resend OTP';
    }
  }, 1000);
}

// ── Step 1: Login Form Submit ─────────────────

async function handleLoginSubmit(e) {
  e.preventDefault();

  const email     = document.getElementById('email').value.trim();
  const password  = document.getElementById('password').value.trim();
  const submitBtn = document.getElementById('login-btn');

  // Clear any previous error
  _hideMsg('login-error');

  if (!email || !password) {
    _showMsg('login-error', 'error', 'Please enter both email and password.');
    return;
  }

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Verifying...';

  try {
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      // ✅ FIX: show popup-style error — user not found or wrong password
      _showMsg(
        'login-error',
        'error',
        data.message || 'No account found with these credentials. Please register first.'
      );
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Continue →';
      return;
    }

    sessionStorage.setItem('aariva_pending_email', email);
    sessionStorage.setItem('aariva_pending_role',  data.role);
    sessionStorage.setItem('aariva_pending_name',  data.name || '');

    submitBtn.textContent = 'Sending OTP...';
    const otpResult = await sendOTPEmail(email, data.name);

    if (!otpResult.success) {
      _showMsg('login-error', 'error', 'Could not send OTP. Please try again.');
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Continue →';
      return;
    }

    showOTPStep(email);
    startResendCooldown('resend-btn', 30);

  } catch (err) {
    console.error(err);
    _showMsg('login-error', 'error', 'Server error. Please try again.');
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Continue →';
  }
}

// ── Step 2: OTP Verify Submit ─────────────────

async function handleOTPSubmit(e) {
  e.preventDefault();

  const otp       = document.getElementById('otp-input')?.value.trim();
  const submitBtn = document.getElementById('otp-btn');

  _hideMsg('otp-error');
  _hideMsg('otp-success');

  if (!otp || otp.length !== 6) {
    _showMsg('otp-error', 'error', 'Please enter the 6-digit OTP.');
    return;
  }

  const result = verifyOTP(otp);

  if (!result.valid) {
    // ✅ FIX: error now reliably appears
    _showMsg('otp-error', 'error', result.reason);
    return;
  }

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Verifying...';

  try {
    const email = sessionStorage.getItem('aariva_pending_email');
    const res   = await fetch('/api/auth/verify-otp', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, otpVerified: true })
    });

    const data = await res.json();

    if (!res.ok) {
      _showMsg('otp-error', 'error', data.message || 'Session error. Please login again.');
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Verify & Login';
      return;
    }

    clearOTPState();
    redirectByRole(data.role);

  } catch (err) {
    console.error(err);
    _showMsg('otp-error', 'error', 'Server error. Please try again.');
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Verify & Login';
  }
}

// ── Resend OTP ────────────────────────────────

async function handleResendOTP() {
  const email = sessionStorage.getItem('aariva_pending_email');
  const name  = sessionStorage.getItem('aariva_pending_name');

  _hideMsg('otp-error');
  _hideMsg('otp-success');

  if (!email) {
    _showMsg('otp-error', 'error', 'Session expired. Please login again.');
    showLoginStep();
    return;
  }

  const result = await sendOTPEmail(email, name);

  if (!result.success) {
    _showMsg('otp-error', 'error', 'Could not resend OTP. Please try again.');
    return;
  }

  _showMsg('otp-success', 'success', 'A new OTP has been sent to your email.');
  startResendCooldown('resend-btn', 30);
}

// ── UI Helpers ────────────────────────────────

function showLoginStep() {
  document.getElementById('step-login').style.display = 'block';
  document.getElementById('step-otp').style.display   = 'none';
}

function showOTPStep(email) {
  document.getElementById('step-login').style.display = 'none';
  document.getElementById('step-otp').style.display   = 'block';

  const hint = document.getElementById('otp-email-hint');
  if (hint && email) {
    const [user, domain] = email.split('@');
    const masked = user.slice(0, 2) + '****@' + domain;
    hint.textContent = `OTP sent to ${masked}`;
  }
}

function redirectByRole(role) {
  const routes = {
    admin:      '/admin',
    doctor:     '/evaluation',
    caseworker: '/dashboard',
    applicant:  '/track-case'
  };
  window.location.href = routes[role] || '/dashboard';
}

// ── OTP Input Auto-format ─────────────────────

function setupOTPInput() {
  const input = document.getElementById('otp-input');
  if (!input) return;

  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 6);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('otp-btn')?.click();
    }
  });
}

// ── Register Form Submit ──────────────────────

async function handleRegisterSubmit(e) {
  e.preventDefault();

  const name            = document.getElementById('name')?.value.trim();
  const email           = document.getElementById('email')?.value.trim();
  const role            = document.getElementById('role')?.value;
  const password        = document.getElementById('password')?.value || '';
  const confirmPassword = document.getElementById('confirm-password')?.value || '';
  const alertEl         = document.getElementById('alert');
  const submitBtn       = document.getElementById('register-btn');

  function setAlert(type, msg) {
    if (!alertEl) return;
    alertEl.className    = `alert ${type}`;
    alertEl.textContent  = msg;
    alertEl.style.display = 'block';
  }

  if (!name || !email || !role || !password || !confirmPassword) {
    setAlert('error', 'Please fill all fields.');
    return;
  }
  if (password.length < 6) {
    setAlert('error', 'Password must be at least 6 characters.');
    return;
  }
  if (password !== confirmPassword) {
    setAlert('error', 'Passwords do not match.');
    return;
  }

  if (submitBtn) {
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Creating Account...';
  }

  try {
    const res  = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();

    if (!res.ok) {
      setAlert('error', data.message || 'Registration failed. Please try again.');
      if (submitBtn) {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Create Account';
      }
      return;
    }

    setAlert('success', 'Account created successfully. Redirecting to login...');
    setTimeout(() => { window.location.href = '/login'; }, 1000);

  } catch (err) {
    console.error(err);
    setAlert('error', 'Server error. Please try again.');
    if (submitBtn) {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Create Account';
    }
  }
}

// ── Init ──────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (typeof emailjs !== 'undefined' && typeof EMAILJS_CONFIG !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  const otpForm = document.getElementById('otp-form');
  if (otpForm) otpForm.addEventListener('submit', handleOTPSubmit);

  const resendBtn = document.getElementById('resend-btn');
  if (resendBtn) resendBtn.addEventListener('click', handleResendOTP);

  const backBtn = document.getElementById('back-to-login');
  if (backBtn) backBtn.addEventListener('click', () => {
    clearOTPState();
    showLoginStep();
  });

  setupOTPInput();
  showLoginStep();
});
